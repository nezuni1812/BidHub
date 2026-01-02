const asyncHandler = require('../middleware/asyncHandler');
const Product = require('../models/Product');
const DeniedBidder = require('../models/DeniedBidder');
const DescriptionHistory = require('../models/DescriptionHistory');
const Question = require('../models/Question');
const Bid = require('../models/Bid');
const Rating = require('../models/Rating');
const User = require('../models/User');
const ImageUploadService = require('../services/imageUploadService');
const { sendQuestionAnsweredEmail, sendBidderDeniedEmail } = require('../utils/email');
const db = require('../config/database');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const EVENTS = require('../socket/events');

// Get available bidders (all users except current seller and admins)
exports.getAvailableBidders = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  
  const query = `
    SELECT id, full_name, email, role, ROUND(rating::numeric, 2) as rating
    FROM users
    WHERE id != $1 
      AND is_active = true 
      AND role != 'admin'
      AND rating < 0.8
    ORDER BY full_name ASC
  `;
  
  const result = await db.query(query, [currentUserId]);
  
  res.json({
    success: true,
    data: result.rows
  });
});

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
    end_time
  } = req.body;

  // Check if files were uploaded
  if (!req.files || !req.files.main_image || !req.files.additional_images) {
    throw new BadRequestError('Vui lòng upload ảnh đại diện và ít nhất 2 ảnh phụ');
  }

  const mainImage = req.files.main_image[0];
  const additionalImages = req.files.additional_images;

  // Validate minimum 2 additional images
  if (additionalImages.length < 2) {
    throw new BadRequestError('Sản phẩm cần có ít nhất 2 ảnh phụ');
  }

  // Upload main image to R2
  const mainImageResult = await ImageUploadService.uploadImage(mainImage);

  // Upload additional images to R2
  const additionalImageResults = await ImageUploadService.uploadMultipleImages(additionalImages);

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

    // Insert main image
    await client.query(
      'INSERT INTO product_images (product_id, url, is_main) VALUES ($1, $2, $3)',
      [product.id, mainImageResult.url, true]
    );

    // Insert additional images
    for (const imageResult of additionalImageResults) {
      await client.query(
        'INSERT INTO product_images (product_id, url, is_main) VALUES ($1, $2, $3)',
        [product.id, imageResult.url, false]
      );
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
    
    // Cleanup uploaded images if product creation fails
    try {
      await ImageUploadService.deleteImage(ImageUploadService.extractFilenameFromUrl(mainImageResult.url));
      const filenames = additionalImageResults.map(img => ImageUploadService.extractFilenameFromUrl(img.url));
      await ImageUploadService.deleteMultipleImages(filenames);
    } catch (cleanupError) {
      console.error('Failed to cleanup images:', cleanupError);
    }
    
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

  if (product.status !== 'active') {
    throw new BadRequestError('Can only deny bidders for active auctions');
  }

  // Check if bidder exists and has bid on this product
  const bidderHasBidQuery = `
    SELECT COUNT(*) as bid_count
    FROM bids
    WHERE product_id = $1 AND user_id = $2
  `;
  const bidderHasBid = await db.query(bidderHasBidQuery, [productId, bidder_id]);
  
  if (parseInt(bidderHasBid.rows[0].bid_count) === 0) {
    throw new BadRequestError('This user has not bid on this product');
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Add to denied list
    await DeniedBidder.create(productId, bidder_id, reason);

    // Get current highest bid
    const currentHighestBid = await Bid.getCurrentHighestBid(productId);

    let priceChanged = false;
    let newPrice = product.current_price;
    let secondHighestBidder = null;

    // If denied bidder is the current highest bidder
    if (currentHighestBid && currentHighestBid.user_id === bidder_id) {
      // Find the highest valid bid (excluding denied bidder)
      const nextHighestBid = await Bid.getHighestValidBid(productId, bidder_id);

      if (nextHighestBid) {
        // Update product to second highest price AND winner
        newPrice = nextHighestBid.bid_price;
        secondHighestBidder = nextHighestBid;
        
        await client.query(
          'UPDATE products SET current_price = $1, winner_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [newPrice, nextHighestBid.user_id, productId]
        );
        priceChanged = true;
      } else {
        // No valid bids remaining, reset to start price and clear winner
        newPrice = product.start_price;
        
        await client.query(
          'UPDATE products SET current_price = start_price, winner_id = NULL, total_bids = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [productId]
        );
        priceChanged = true;
      }
    }

    await client.query('COMMIT');

    // Send email notification to denied bidder
    try {
      const deniedBidder = await User.findById(bidder_id);
      if (deniedBidder && deniedBidder.email) {
        await sendBidderDeniedEmail(
          deniedBidder.email,
          deniedBidder.full_name,
          product.title,
          productId,
          reason || 'Không có lý do cụ thể'
        );
      }
    } catch (emailError) {
      console.error('[SELLER] Email notification error:', emailError);
      // Don't fail denial if email fails
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      // Notify denied bidder
      io.to(`user-${bidder_id}`).emit('bidder-denied', {
        product_id: parseInt(productId),
        product_title: product.title,
        reason: reason || 'Không có lý do cụ thể'
      });

      // If price changed, notify all watchers
      if (priceChanged) {
        io.to(`product-${productId}`).emit('price-updated', {
          product_id: parseInt(productId),
          new_price: parseFloat(newPrice),
          reason: 'bidder_denied',
          denied_bidder_id: bidder_id
        });

        // Notify new highest bidder if exists
        if (secondHighestBidder) {
          io.to(`user-${secondHighestBidder.user_id}`).emit('now-winning', {
            product_id: parseInt(productId),
            product_title: product.title,
            bid_price: parseFloat(secondHighestBidder.bid_price)
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Bidder denied successfully',
      data: {
        product_id: parseInt(productId),
        denied_user_id: bidder_id,
        price_changed: priceChanged,
        new_price: parseFloat(newPrice),
        previous_price: parseFloat(product.current_price)
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

  // Emit socket event for real-time update
  const io = req.app.get('io');
  if (io) {
    io.to(`product-${question.product_id}`).emit(EVENTS.QUESTION_ANSWERED, {
      productId: question.product_id,
      questionId: parseInt(questionId),
      answer: answer
    });
  }

  // Send email notifications
  try {
    // Get asker info
    const asker = await User.findById(question.asker_id);
    if (asker && asker.email) {
      await sendQuestionAnsweredEmail(
        asker.email,
        asker.full_name,
        question.product_title,
        question.product_id,
        question.question,
        answer
      );
    }

    // Get all watchers who asked questions on this product
    const watchersQuery = await db.query(
      `SELECT DISTINCT u.id, u.email, u.full_name
       FROM questions q
       INNER JOIN users u ON q.asker_id = u.id
       WHERE q.product_id = $1 AND q.asker_id != $2`,
      [question.product_id, question.asker_id]
    );

    for (const watcher of watchersQuery.rows) {
      if (watcher.email) {
        await sendQuestionAnsweredEmail(
          watcher.email,
          watcher.full_name,
          question.product_title,
          question.product_id,
          question.question,
          answer
        );
      }
    }
  } catch (emailError) {
    console.error('[SELLER] Email notification error:', emailError);
    // Don't fail answer if email fails
  }

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
      AND p.end_time > (CURRENT_TIMESTAMP + INTERVAL '7 hours')
    GROUP BY p.id, c.name, pi.url
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM products
    WHERE seller_id = $1
      AND status = 'active'
      AND end_time > (CURRENT_TIMESTAMP + INTERVAL '7 hours')
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

// Allow unrated bidder to bid on product
exports.allowUnratedBidder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId, bidderId } = req.params;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Verify product ownership
    const productResult = await client.query(
      'SELECT seller_id, status FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw new NotFoundError('Product not found');
    }

    const product = productResult.rows[0];
    if (product.seller_id !== userId) {
      throw new ForbiddenError('You can only manage permissions for your own products');
    }

    if (product.status !== 'active') {
      throw new BadRequestError('Can only grant permissions for active auctions');
    }

    // Verify bidder exists and has no ratings
    const bidderResult = await client.query(
      `SELECT u.id, COALESCE(COUNT(r.id), 0) as rating_count
       FROM users u
       LEFT JOIN user_ratings r ON u.id = r.rated_user_id
       WHERE u.id = $1 AND u.is_active = true
       GROUP BY u.id`,
      [bidderId]
    );

    if (bidderResult.rows.length === 0) {
      throw new NotFoundError('Bidder not found');
    }

    const ratingCount = parseInt(bidderResult.rows[0].rating_count);
    if (ratingCount > 0) {
      throw new BadRequestError('This bidder already has ratings and does not need special permission');
    }

    // Grant permission (upsert)
    await client.query(
      `INSERT INTO unrated_bidder_permissions (product_id, bidder_id, seller_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (product_id, bidder_id) DO NOTHING`,
      [productId, bidderId, userId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Unrated bidder permission granted',
      data: {
        product_id: parseInt(productId),
        bidder_id: parseInt(bidderId)
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Allow multiple unrated bidders to bid on product (batch operation)
exports.allowMultipleBidders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;
  const { bidderIds } = req.body;

  if (!Array.isArray(bidderIds) || bidderIds.length === 0) {
    throw new BadRequestError('bidderIds must be a non-empty array');
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Verify product ownership
    const productResult = await client.query(
      'SELECT seller_id, status FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw new NotFoundError('Product not found');
    }

    const product = productResult.rows[0];
    if (product.seller_id !== userId) {
      throw new ForbiddenError('You can only manage permissions for your own products');
    }

    if (product.status !== 'active') {
      throw new BadRequestError('Can only grant permissions for active auctions');
    }

    // Get all bidders with their rating info
    const biddersResult = await client.query(
      `SELECT u.id, u.rating, 
              COALESCE(COUNT(r.id), 0) as rating_count,
              EXISTS(
                SELECT 1 FROM unrated_bidder_permissions 
                WHERE product_id = $1 AND bidder_id = u.id
              ) as already_allowed
       FROM users u
       LEFT JOIN user_ratings r ON u.id = r.rated_user_id
       WHERE u.id = ANY($2) AND u.is_active = true
       GROUP BY u.id`,
      [productId, bidderIds]
    );

    let addedCount = 0;
    const skipped = [];
    const notFound = bidderIds.filter(id => 
      !biddersResult.rows.find(row => row.id === id)
    );

    // Process each bidder
    for (const bidder of biddersResult.rows) {
      const ratingCount = parseInt(bidder.rating_count);
      const userRating = parseFloat(bidder.rating);
      
      // Skip if bidder already has sufficient rating (>= 0.8) or already has ratings
      if (ratingCount > 0 || userRating >= 0.8 || bidder.already_allowed) {
        skipped.push({
          id: bidder.id,
          reason: bidder.already_allowed ? 'already_allowed' : 'has_ratings'
        });
        continue;
      }

      // Grant permission
      await client.query(
        `INSERT INTO unrated_bidder_permissions (product_id, bidder_id, seller_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, bidder_id) DO NOTHING`,
        [productId, bidder.id, userId]
      );
      addedCount++;
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Granted permissions to ${addedCount} bidder(s)`,
      data: {
        added: addedCount,
        skipped: skipped.length,
        notFound: notFound.length,
        details: {
          skippedBidders: skipped,
          notFoundBidders: notFound
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
