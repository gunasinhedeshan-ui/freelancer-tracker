const express = require('express');
const { body, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');

const router = express.Router();
router.use(protect); // මේ file එකේ හැම route එකක්ම login වෙලා ඉන්න ඕනි

const clientRules = [
  body('name').trim().notEmpty().withMessage('Client name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
];

router.get('/', getClients);
router.post('/', clientRules, createClient);
router.put('/:id', [param('id').isMongoId().withMessage('Invalid id'), ...clientRules], updateClient);
router.delete('/:id', [param('id').isMongoId().withMessage('Invalid id')], deleteClient);

module.exports = router;