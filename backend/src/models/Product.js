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
        EXTRACT(EPOCH FROM (p.end_time - CURRENT_TIMESTAMP)) as seconds_remaining
      FROM products p
      INNER JOIN users u ON p.seller_id = u.id
      INNER JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = true
      WHERE p.status = 'active' AND p.end_time > CURRENT_TIMESTAMP
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
      WHERE p.status = 'active' AND p.end_time > CURRENT_TIMESTAMP
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
      WHERE p.status = 'active' AND p.end_time > CURRENT_TIMESTAMP
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
    
    let whereConditions = ["p.status = 'active'", "p.end_time > CURRENT_TIMESTAMP"];
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
      whereConditions.push(`p.category_id = $${paramIndex}`);
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
        EXTRACT(EPOCH FROM (p.end_time - CURRENT_TIMESTAMP)) as seconds_remaining
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
        EXTRACT(EPOCH FROM (p.end_time - CURRENT_TIMESTAMP)) as seconds_remaining
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
        AND p.end_time > CURRENT_TIMESTAMP
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

  static async getBidHistory(productId, page = 1, page_size = 20) {
    const offset = (page - 1) * page_size;
    
    const query = `
      SELECT 
        b.id,
        b.bid_price,
        b.is_auto,
        b.created_at,
        CONCAT(LEFT(u.full_name, 4), REPEAT('*', GREATEST(LENGTH(u.full_name) - 4, 0))) as masked_bidder_name
      FROM bids b
      INNER JOIN users u ON b.user_id = u.id
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
}

module.exports = Product;
