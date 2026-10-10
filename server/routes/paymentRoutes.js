const express = require('express');
const { body, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
} = require('../controllers/paymentController');

const router = express.Router();
router.use(protect);

const paymentRules = [
  body('project').isMongoId().withMessage('A valid project is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('status')
    .optional()
    .isIn(['Paid', 'Pending'])
    .withMessage('Status must be Paid or Pending'),
  body('date').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date'),
];

router.get('/', getPayments);
router.post('/', paymentRules, createPayment);
router.put('/:id', [param('id').isMongoId().withMessage('Invalid id'), ...paymentRules], updatePayment);
router.delete('/:id', [param('id').isMongoId().withMessage('Invalid id')], deletePayment);

module.exports = router;