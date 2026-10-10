const express = require('express');
const { body, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

const router = express.Router();
router.use(protect);

const projectRules = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('client').isMongoId().withMessage('A valid client is required'),
  body('status')
    .optional()
    .isIn(['Pending', 'Active', 'Completed'])
    .withMessage('Status must be Pending, Active or Completed'),
  body('fee').isFloat({ min: 0 }).withMessage('Fee must be a positive number'),
  body('deadline').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date'),
];

router.get('/', getProjects);
router.post('/', projectRules, createProject);
router.put('/:id', [param('id').isMongoId().withMessage('Invalid id'), ...projectRules], updateProject);
router.delete('/:id', [param('id').isMongoId().withMessage('Invalid id')], deleteProject);

module.exports = router;