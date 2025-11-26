const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoriesTree,
  getCategoryById
} = require('../controllers/categoryController');

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     description: Retrieve a flat list of all categories with parent information
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', getCategories);

/**
 * @swagger
 * /categories/tree:
 *   get:
 *     tags: [Categories]
 *     summary: Get categories tree
 *     description: Retrieve categories in 2-level hierarchy (parent-child structure)
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/tree', getCategoriesTree);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by ID
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
 *         description: Category not found
 */
router.get('/:id', getCategoryById);

module.exports = router;
