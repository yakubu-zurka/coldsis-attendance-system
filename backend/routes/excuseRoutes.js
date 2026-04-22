const express = require('express');
const router = express.Router();
const { submitExcuse, getExcuses, deleteExcuse } = require('../controllers/excuseController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, admin, getExcuses)
  .post(submitExcuse);

router.route('/:id')
  .delete(protect, admin, deleteExcuse);

module.exports = router;
