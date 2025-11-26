const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');
const { NotFoundError } = require('../utils/errors');

/**
 * @desc    Get all categories (flat list)
 * @route   GET /api/v1/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.getAll();
  
  res.json({
    success: true,
    data: categories
  });
});

/**
 * @desc    Get categories tree (2-level hierarchy)
 * @route   GET /api/v1/categories/tree
 * @access  Public
 */
const getCategoriesTree = asyncHandler(async (req, res) => {
  const tree = await Category.getTree();
  
  res.json({
    success: true,
    data: tree
  });
});

/**
 * @desc    Get category by ID
 * @route   GET /api/v1/categories/:id
 * @access  Public
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.getById(req.params.id);
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  res.json({
    success: true,
    data: category
  });
});

module.exports = {
  getCategories,
  getCategoriesTree,
  getCategoryById
};
