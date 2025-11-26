const express = require('express');
const router = express.Router();
const {
  getHomePage,
  getProducts,
  getProductById,
  getProductBids
} = require('../controllers/productController');

/**
 * @swagger
 * /products/home:
 *   get:
 *     tags: [Products]
 *     summary: Get homepage products
 *     description: Get top 5 products (ending soon, most bids, highest price)
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/home', getHomePage);

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Search and filter products
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search keyword (supports Vietnamese without accents)
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [end_time_asc, end_time_desc, price_asc, price_desc]
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', getProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /products/{id}/bids:
 *   get:
 *     tags: [Products]
 *     summary: Get product bid history
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id/bids', getProductBids);

module.exports = router;
