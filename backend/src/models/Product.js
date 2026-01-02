const db = require('../config/database');

class Product {
  static async getHomePage() {
    // Top 5 sản phẩm gần kết thúc
    const endingSoonQuery = `
      SELECT 
        p.*,
        u.full_name as seller_name,
        u.rating as seller_rating,
        c.name as category_name,
        pi.url as main_image,
        EXTRACT(EPOCH FROM (p.end_time - (CURRENT_TIMESTAMP))) as seconds_remaining
      FROM products p
      INNER JOIN users u ON p.seller_id = u.id
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
      WHERE p.status = 'active' AND p.end_time > (CURRENT_TIMESTAMP)
      ORDER BY p.end_time ASC
      LIMIT 5
    `;

    // Top 5 sản phẩm có nhiều lượt ra giá nhất
    const mostBidsQuery = `
      SELECT 
        p.*,
        u.full_name as seller_name,
        u.rating as seller_rating,
        c.name as category_name,
        pi.url as main_image,
        p.total_bids
      FROM products p
      INNER JOIN users u ON p.seller_id = u.id
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
      WHERE p.status = 'active' AND p.end_time > (CURRENT_TIMESTAMP)
      ORDER BY p.total_bids DESC
      LIMIT 5
    `;

    // Top 5 sản phẩm có giá cao nhất
    const highestPriceQuery = `
      SELECT 
        p.*,
        u.full_name as seller_name,
        u.rating as seller_rating,
        c.name as category_name,
        pi.url as main_image
      FROM products p
      INNER JOIN users u ON p.seller_id = u.id
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
      WHERE p.status = 'active' AND p.end_time > (CURRENT_TIMESTAMP)
      ORDER BY p.current_price DESC
      LIMIT 5
    `;

    const [endingSoon, mostBids, highestPrice] = await Promise.all([
      db.query(endingSoonQuery),
      db.query(mostBidsQuery),
      db.query(highestPriceQuery)
    ]);

    return {
      endingSoon: endingSoon.rows,
      mostBids: mostBids.rows,
      highestPrice: highestPrice.rows
    };
  }

  static async searchWithFilters(filters = {}) {
    const {
      keyword,
      category_id,
      sort_by = 'end_time_asc',
      page = 1,
      page_size = 20
    } = filters;

    const offset = (page - 1) * page_size;
    
    let whereConditions = ["p.status = 'active'", "p.end_time > (CURRENT_TIMESTAMP)"];
    const params = [];
    let paramIndex = 1;

    // Full-text search cho tiếng Việt không dấu
    if (keyword) {
      whereConditions.push(`(
        LOWER(unaccent(p.title)) LIKE LOWER(unaccent($${paramIndex}))
        OR LOWER(unaccent(p.description)) LIKE LOWER(unaccent($${paramIndex}))
      )`);
      params.push(`%${keyword}%`);
      paramIndex++;
    }

    if (category_id) {
      // Get all child categories
      whereConditions.push(`p.category_id IN (
        WITH RECURSIVE category_tree AS (
          SELECT id FROM categories WHERE id = $${paramIndex}
          UNION
          SELECT c.id FROM categories c
          INNER JOIN category_tree ct ON c.parent_id = ct.id
        )
        SELECT id FROM category_tree
      )`);
      params.push(category_id);
      paramIndex++;
    }

    // Sorting
    let orderBy = '';
    switch (sort_by) {
      case 'end_time_asc':
        orderBy = 'p.end_time ASC';
        break;
      case 'end_time_desc':
        orderBy = 'p.end_time DESC';
        break;
      case 'price_asc':
        orderBy = 'p.current_price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.current_price DESC';
        break;
      default:
        orderBy = 'p.end_time ASC';
    }

    const query = `
      SELECT 
        p.id,
        p.title,
        p.current_price,
        p.buy_now_price,
        p.total_bids,
        p.end_time,
        p.created_at,
        c.name as category_name,
        c.id as category_id,
        u.full_name as seller_name,
        u.rating as seller_rating,
        pi.url as main_image,
        (SELECT full_name FROM users WHERE id = (
          SELECT user_id FROM bids WHERE product_id = p.id ORDER BY bid_price DESC LIMIT 1
        )) as highest_bidder_name,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.created_at)) / 60 as minutes_since_created,
        EXTRACT(EPOCH FROM (p.end_time - (CURRENT_TIMESTAMP))) as seconds_remaining
      FROM products p
      INNER JOIN users u ON p.seller_id = u.id
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(page_size, offset);

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE ${whereConditions.join(' AND ')}
    `;

    const [products, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);

    return {
      data: products.rows,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(page_size),
        total,
        total_pages: Math.ceil(total / page_size)
      }
    };
  }

  static async getById(id) {
    const productQuery = `
      SELECT 
        p.*,
        u.id as seller_id,
        u.full_name as seller_name,
        u.rating as seller_rating,
        u.email as seller_email,
        c.name as category_name,
        c.id as category_id,
        winner.id as winner_id,
        winner.full_name as winner_name,
        winner.rating as winner_rating,
        EXTRACT(EPOCH FROM (p.end_time - (CURRENT_TIMESTAMP))) as seconds_remaining
      FROM products p
      INNER JOIN users u ON p.seller_id = u.id
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN users winner ON p.winner_id = winner.id
      WHERE p.id = $1
    `;

    const imagesQuery = `
      SELECT id, url, is_main
      FROM product_images
      WHERE product_id = $1
      ORDER BY is_main DESC, id ASC
    `;

    const questionsQuery = `
      SELECT 
        pq.id,
        pq.question,
        pq.answer,
        pq.created_at,
        pq.answered_at,
        u.full_name as asker_name
      FROM product_questions pq
      INNER JOIN users u ON pq.user_id = u.id
      WHERE pq.product_id = $1
      ORDER BY pq.created_at DESC
    `;

    const relatedProductsQuery = `
      SELECT 
        p.id,
        p.title,
        p.current_price,
        p.buy_now_price,
        p.total_bids,
        p.end_time,
        pi.url as main_image
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
      WHERE p.category_id = (SELECT category_id FROM products WHERE id = $1)
        AND p.id != $1
        AND p.status = 'active'
        AND p.end_time > (CURRENT_TIMESTAMP)
      ORDER BY p.end_time ASC
      LIMIT 5
    `;

    const descriptionHistoryQuery = `
      SELECT additional_description, created_at
      FROM product_description_history
      WHERE product_id = $1
      ORDER BY created_at DESC
    `;

    const [product, images, questions, relatedProducts, descriptionHistory] = await Promise.all([
      db.query(productQuery, [id]),
      db.query(imagesQuery, [id]),
      db.query(questionsQuery, [id]),
      db.query(relatedProductsQuery, [id]),
      db.query(descriptionHistoryQuery, [id])
    ]);

    if (product.rows.length === 0) {
      return null;
    }

    return {
      ...product.rows[0],
      images: images.rows,
      questions: questions.rows,
      related_products: relatedProducts.rows,
      description_history: descriptionHistory.rows
    };
  }

  static async getBidHistory(productId, page = 1, page_size = 20, includeUserId = false) {
    const offset = (page - 1) * page_size;
    
    const query = `
      SELECT 
        b.id,
        b.bid_price,
        b.is_auto,
        b.created_at,
        ${includeUserId ? 'b.user_id,' : ''}
        CONCAT(LEFT(u.full_name, 4), REPEAT('*', GREATEST(LENGTH(u.full_name) - 4, 0))) as masked_bidder_name,
        CASE WHEN db.id IS NOT NULL THEN true ELSE false END as is_denied
      FROM bids b
      INNER JOIN users u ON b.user_id = u.id
      LEFT JOIN denied_bidders db ON db.product_id = b.product_id AND db.user_id = b.user_id
      WHERE b.product_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM bids
      WHERE product_id = $1
    `;

    const [bids, countResult] = await Promise.all([
      db.query(query, [productId, page_size, offset]),
      db.query(countQuery, [productId])
    ]);

    const total = parseInt(countResult.rows[0].total);

    return {
      data: bids.rows,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(page_size),
        total,
        total_pages: Math.ceil(total / page_size)
      }
    };
  }

  // ================================================
  // ADMIN METHODS
  // ================================================

  static async findAllAdmin({ status, category_id, seller_id, search, sort = 'created_at', order = 'DESC', limit = 20, offset = 0 }) {
    let query = `
      SELECT 
        p.id,
        p.title,
        p.status,
        p.start_price,
        p.current_price,
        p.buy_now_price,
        p.bid_step,
        p.total_bids,
        p.start_time,
        p.end_time,
        p.created_at,
        p.updated_at,
        u.id as seller_id,
        u.full_name as seller_name,
        u.email as seller_email,
        c.name as category_name,
        pi.url as main_image
      FROM products p
      INNER JOIN users u ON p.seller_id = u.id
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category_id) {
      query += ` AND p.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (seller_id) {
      query += ` AND p.seller_id = $${paramIndex}`;
      params.push(seller_id);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Sort
    const validSorts = {
      'created_at': 'p.created_at',
      'name': 'p.title',
      'current_price': 'p.current_price',
      'end_time': 'p.end_time',
      'bid_count': 'p.total_bids'
    };
    query += ` ORDER BY ${validSorts[sort] || 'p.created_at'} ${order}`;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async countAdmin({ status, category_id, seller_id, search }) {
    let query = 'SELECT COUNT(*) FROM products p WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category_id) {
      query += ` AND p.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (seller_id) {
      query += ` AND p.seller_id = $${paramIndex}`;
      params.push(seller_id);
      paramIndex++;
    }

    if (search) {
      query += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  static async findByIdAdmin(id) {
    const query = `
      SELECT 
        p.*,
        u.id as seller_id,
        u.full_name as seller_name,
        u.email as seller_email,
        u.rating as seller_rating,
        c.name as category_name,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', pi.id,
              'url', pi.url,
              'is_main', pi.is_main
            )
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) as images,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', b.id,
              'user_id', b.user_id,
              'bidder_name', ub.full_name,
              'bid_price', b.bid_price,
              'is_auto', b.is_auto,
              'created_at', b.created_at
            )
          ) FILTER (WHERE b.id IS NOT NULL) ORDER BY b.created_at DESC,
          '[]'
        ) as recent_bids
      FROM products p
      INNER JOIN users u ON p.seller_id = u.id
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN bids b ON p.id = b.product_id
      LEFT JOIN users ub ON b.user_id = ub.id
      WHERE p.id = $1
      GROUP BY p.id, u.id, u.full_name, u.email, u.rating, c.name
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE products
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [status, id]);
    return result.rows[0];
  }

  static async countByStatus() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM products
      GROUP BY status
    `;
    const result = await db.query(query);
    
    const stats = {
      pending: 0,
      approved: 0,
      active: 0,
      ended: 0,
      removed: 0
    };

    result.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
    });

    return stats;
  }

  static async countByPeriod(days = 30) {
    const query = `
      SELECT COUNT(*) as count
      FROM products
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `;
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }

  static async countActive() {
    const query = `
      SELECT COUNT(*) as count
      FROM products
      WHERE status = 'active' AND end_time > (CURRENT_TIMESTAMP)
    `;
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }

  static async getTotalRevenue(days = 30) {
    const query = `
      SELECT COALESCE(SUM(current_price), 0) as revenue
      FROM products
      WHERE status = 'ended'
      AND end_time > NOW() - INTERVAL '${days} days'
      AND current_price > start_price
    `;
    const result = await db.query(query);
    return result.rows[0].revenue;
  }

  static async getStatsByInterval(days = 30, interval = 'day') {
    const intervalFormat = {
      'day': 'YYYY-MM-DD',
      'week': 'IYYY-IW',
      'month': 'YYYY-MM'
    }[interval] || 'YYYY-MM-DD';

    const query = `
      SELECT 
        TO_CHAR(created_at, '${intervalFormat}') as period,
        COUNT(*) as total_auctions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_auctions,
        COUNT(CASE WHEN status = 'ended' THEN 1 END) as ended_auctions
      FROM products
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY period
      ORDER BY period
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async getRevenueByInterval(days = 30, interval = 'day') {
    const intervalFormat = {
      'day': 'YYYY-MM-DD',
      'week': 'IYYY-IW',
      'month': 'YYYY-MM'
    }[interval] || 'YYYY-MM-DD';

    const query = `
      SELECT 
        TO_CHAR(end_time, '${intervalFormat}') as period,
        COUNT(*) as total_sales,
        COALESCE(SUM(CASE WHEN current_price > start_price THEN current_price END), 0) as revenue
      FROM products
      WHERE status = 'ended'
      AND end_time > NOW() - INTERVAL '${days} days'
      GROUP BY period
      ORDER BY period
    `;
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Buy Now Instant - User clicks "Buy Now" button
   * This will:
   * 1. End the auction immediately
   * 2. Set the buyer as winner
   * 3. Update product status to 'completed'
   * 4. Set final price to buy_now_price
   * Returns: product data with winner info
   */
  static async buyNowInstant(productId, buyerId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Lock the product row for update
      const productQuery = `
        SELECT 
          p.*,
          u.full_name as seller_name,
          u.email as seller_email,
          c.name as category_name
        FROM products p
        INNER JOIN users u ON p.seller_id = u.id
        INNER JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1
        FOR UPDATE
      `;
      
      const productResult = await client.query(productQuery, [productId]);
      
      if (productResult.rows.length === 0) {
        throw new Error('Product not found');
      }

      const product = productResult.rows[0];

      // Validations
      if (product.status !== 'active') {
        throw new Error('Product is not available for buy now');
      }

      // Handle end_time as both Date object and string, compare with GMT+7
      const endTime = product.end_time instanceof Date ? product.end_time : new Date(product.end_time);
      if (endTime <= new Date()) {
        throw new Error('Auction has already ended');
      }

      if (!product.buy_now_price || product.buy_now_price <= 0) {
        throw new Error('This product does not have a buy now price');
      }

      if (product.seller_id === buyerId) {
        throw new Error('Seller cannot buy their own product');
      }

      // Check if buyer is denied
      const deniedCheck = await client.query(
        'SELECT id FROM denied_bidders WHERE product_id = $1 AND user_id = $2',
        [productId, buyerId]
      );

      if (deniedCheck.rows.length > 0) {
        throw new Error('You are denied from bidding on this product');
      }

      // Update product: set winner, end auction, set final price
      const updateQuery = `
        UPDATE products
        SET 
          winner_id = $1,
          current_price = buy_now_price,
          status = 'completed',
          end_time = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [buyerId, productId]);
      const updatedProduct = updateResult.rows[0];

      // Get buyer info
      const buyerQuery = 'SELECT id, full_name, email FROM users WHERE id = $1';
      const buyerResult = await client.query(buyerQuery, [buyerId]);
      const buyer = buyerResult.rows[0];

      await client.query('COMMIT');

      return {
        ...updatedProduct,
        seller_name: product.seller_name,
        seller_email: product.seller_email,
        category_name: product.category_name,
        buyer_name: buyer.full_name,
        buyer_email: buyer.email
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Product;
