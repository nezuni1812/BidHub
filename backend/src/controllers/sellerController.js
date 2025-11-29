const asyncHandler = require('../middleware/asyncHandler');
const Product = require('../models/Product');
const DeniedBidder = require('../models/DeniedBidder');
const DescriptionHistory = require('../models/DescriptionHistory');
const Question = require('../models/Question');
const Bid = require('../models/Bid');
const Rating = require('../models/Rating');
const db = require('../config/database');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');

// 3.1 Đăng sản phẩm đấu giá
exports.createProduct = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    title,
    description,
    category_id,
    start_price,
    buy_now_price,
    bid_step,
    auto_extend,
    end_time,
    images // Array of image URLs, minimum 3
  } = req.body;

  // Validate minimum 3 images
  if (!images || images.length < 3) {
    throw new BadRequestError('Product must have at least 3 images');
  }

  // Create product
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const productQuery = `
      INSERT INTO products (
        seller_id, category_id, title, description,
        start_price, current_price, buy_now_price, bid_step,
        auto_extend, end_time, status
      )
      VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, 'active')
      RETURNING *
    `;
    
    const productResult = await client.query(productQuery, [
      userId,
      category_id,
      title,
      description,
      start_price,
      buy_now_price,
      bid_step || 10000,
      auto_extend || false,
      end_time
    ]);

    const product = productResult.rows[0];

    // Insert images
    for (let i = 0; i < images.length; i++) {
      const imageQuery = `
        INSERT INTO product_images (product_id, url, is_main)
        VALUES ($1, $2, $3)
      `;
      await client.query(imageQuery, [product.id, images[i], i === 0]);
    }

    await client.query('COMMIT');

    // Fetch product with images
    const fullProduct = await Product.getById(product.id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: fullProduct
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// 3.2 Bổ sung thông tin mô tả sản phẩm
exports.appendDescription = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { additional_description } = req.body;

  // Check product ownership
  const product = await Product.getById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (product.seller_id !== userId) {
    throw new ForbiddenError('You are not the owner of this product');
  }

  // Add to history
  await DescriptionHistory.create(productId, additional_description);

  // Append to product description
  const updateQuery = `
    UPDATE products
    SET description = description || E'\\n\\n--- Bổ sung ' || CURRENT_TIMESTAMP::DATE || ' ---\\n' || $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;
  await db.query(updateQuery, [additional_description, productId]);

  // Get history
  const history = await DescriptionHistory.getByProductId(productId);

  res.json({
    success: true,
    message: 'Description appended successfully',
    data: {
      product_id: productId,
      history
    }
  });
});

// 3.3 Từ chối lượt ra giá của bidder
exports.denyBidder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { bidder_id, reason } = req.body;

  // Check product ownership
  const product = await Product.getById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (product.seller_id !== userId) {
    throw new ForbiddenError('You are not the owner of this product');
  }

  // Cannot deny yourself
  if (bidder_id === userId) {
    throw new BadRequestError('Cannot deny yourself');
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Add to denied list
    await DeniedBidder.create(productId, bidder_id, reason);

    // Check if denied bidder is current highest bidder
    const highestBidQuery = `
      SELECT b.*, u.full_name
      FROM bids b
      JOIN users u ON b.user_id = u.id
      WHERE b.product_id = $1
      ORDER BY b.bid_price DESC, b.created_at ASC
      LIMIT 1
    `;
    const highestBidResult = await client.query(highestBidQuery, [productId]);

    if (highestBidResult.rows.length > 0 && highestBidResult.rows[0].user_id === bidder_id) {
      // Find second highest bidder (not denied)
      const secondHighestQuery = `
        SELECT b.*
        FROM bids b
        WHERE b.product_id = $1
          AND b.user_id != $2
          AND NOT EXISTS (
            SELECT 1 FROM denied_bidders db
            WHERE db.product_id = b.product_id AND db.user_id = b.user_id
          )
        ORDER BY b.bid_price DESC, b.created_at ASC
        LIMIT 1
      `;
      const secondHighestResult = await client.query(secondHighestQuery, [productId, bidder_id]);

      if (secondHighestResult.rows.length > 0) {
        const secondHighest = secondHighestResult.rows[0];
        
        // Update product current_price
        await client.query(
          'UPDATE products SET current_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [secondHighest.bid_price, productId]
        );
      } else {
        // No valid bids remaining, reset to start price
        await client.query(
          'UPDATE products SET current_price = start_price, total_bids = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [productId]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Bidder denied successfully',
      data: {
        product_id: productId,
        denied_user_id: bidder_id
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// 3.4 Trả lời câu hỏi của người tham gia đấu giá
exports.answerQuestion = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { questionId } = req.params;
  const { answer } = req.body;

  // Get question with product info
  const question = await Question.getById(questionId);
  if (!question) {
    throw new NotFoundError('Question not found');
  }

  // Check product ownership
  if (question.seller_id !== userId) {
    throw new ForbiddenError('You are not the owner of this product');
  }

  // Answer question
  const updatedQuestion = await Question.answer(questionId, answer);

  // TODO: Send email notification to asker
  // await sendEmail(question.asker_email, 'Your question has been answered', ...);

  res.json({
    success: true,
    message: 'Question answered successfully',
    data: updatedQuestion
  });
});

// 3.5 Xem danh sách sản phẩm mình đang đăng & còn hạn
exports.getActiveProducts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 10;
  const offset = (page - 1) * pageSize;

  const query = `
    SELECT 
      p.*,
      c.name as category_name,
      pi.url as main_image,
      COUNT(DISTINCT b.id) as bid_count,
      MAX(b.bid_price) as highest_bid
    FROM products p
    INNER JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
    LEFT JOIN bids b ON p.id = b.product_id
    WHERE p.seller_id = $1
      AND p.status = 'active'
      AND p.end_time > CURRENT_TIMESTAMP
    GROUP BY p.id, c.name, pi.url
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM products
    WHERE seller_id = $1
      AND status = 'active'
      AND end_time > CURRENT_TIMESTAMP
  `;

  const [dataResult, countResult] = await Promise.all([
    db.query(query, [userId, pageSize, offset]),
    db.query(countQuery, [userId])
  ]);

  res.json({
    success: true,
    data: {
      items: dataResult.rows,
      pagination: {
        page,
        page_size: pageSize,
        total_items: parseInt(countResult.rows[0].total),
        total_pages: Math.ceil(countResult.rows[0].total / pageSize)
      }
    }
  });
});

// 3.5 Xem danh sách sản phẩm đã có người thắng đấu giá
exports.getCompletedProducts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.page_size) || 10;
  const offset = (page - 1) * pageSize;

  const query = `
    SELECT 
      p.*,
      c.name as category_name,
      pi.url as main_image,
      w.id as winner_id,
      w.full_name as winner_name,
      w.email as winner_email,
      p.total_bids as bid_count,
      EXISTS (
        SELECT 1 FROM user_ratings
        WHERE rater_id = $1 AND rated_user_id = p.winner_id AND product_id = p.id
      ) as has_rated
    FROM products p
    INNER JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
    LEFT JOIN users w ON p.winner_id = w.id
    WHERE p.seller_id = $1
      AND p.status = 'completed'
      AND p.winner_id IS NOT NULL
    ORDER BY p.end_time DESC
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM products
    WHERE seller_id = $1
      AND status = 'completed'
      AND winner_id IS NOT NULL
  `;

  const [dataResult, countResult] = await Promise.all([
    db.query(query, [userId, pageSize, offset]),
    db.query(countQuery, [userId])
  ]);

  res.json({
    success: true,
    data: {
      items: dataResult.rows,
      pagination: {
        page,
        page_size: pageSize,
        total_items: parseInt(countResult.rows[0].total),
        total_pages: Math.ceil(countResult.rows[0].total / pageSize)
      }
    }
  });
});

// 3.5 Đánh giá người thắng đấu giá
exports.rateWinner = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { score, comment } = req.body;

  // Validate score (+1 or -1)
  if (![1, -1].includes(score)) {
    throw new BadRequestError('Score must be 1 (positive) or -1 (negative)');
  }

  // Check product ownership and winner
  const product = await Product.getById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (product.seller_id !== userId) {
    throw new ForbiddenError('You are not the owner of this product');
  }

  if (!product.winner_id) {
    throw new BadRequestError('This product has no winner yet');
  }

  // Check if already rated
  const existingRating = await db.query(
    'SELECT id FROM user_ratings WHERE rater_id = $1 AND rated_user_id = $2 AND product_id = $3',
    [userId, product.winner_id, productId]
  );

  if (existingRating.rows.length > 0) {
    throw new BadRequestError('You have already rated this winner');
  }

  // Create rating (convert -1/1 to 1-5 scale: -1 = 1, +1 = 5)
  const ratingScore = score === 1 ? 5 : 1;
  await Rating.create(userId, product.winner_id, productId, ratingScore, comment);

  res.json({
    success: true,
    message: 'Winner rated successfully',
    data: {
      product_id: productId,
      winner_id: product.winner_id,
      score,
      comment
    }
  });
});

// 3.5 Huỷ giao dịch và tự động -1 người thắng
exports.cancelTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  // Check product ownership and winner
  const product = await Product.getById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (product.seller_id !== userId) {
    throw new ForbiddenError('You are not the owner of this product');
  }

  if (!product.winner_id) {
    throw new BadRequestError('This product has no winner to cancel');
  }

  if (product.status !== 'completed') {
    throw new BadRequestError('Can only cancel completed transactions');
  }

  // Check if already rated
  const existingRating = await db.query(
    'SELECT id FROM user_ratings WHERE rater_id = $1 AND rated_user_id = $2 AND product_id = $3',
    [userId, product.winner_id, productId]
  );

  if (existingRating.rows.length > 0) {
    throw new BadRequestError('Transaction already processed (rating exists)');
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Create negative rating with standard comment
    const comment = 'Người thắng không thanh toán';
    await Rating.create(userId, product.winner_id, productId, 1, comment); // Score 1 = negative

    // Update product status to cancelled
    await client.query(
      'UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', productId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Transaction cancelled and winner rated negatively',
      data: {
        product_id: productId,
        winner_id: product.winner_id,
        comment
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
