const { validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Project = require('../models/Project');

// GET /api/payments?status=Paid&project=<projectId>
exports.getPayments = async (req, res) => {
  try {
    const query = { user: req.user._id };
    if (req.query.status) query.status = req.query.status;
    if (req.query.project) query.project = req.query.project;

    const payments = await Payment.find(query)
      .populate({ path: 'project', select: 'name client', populate: { path: 'client', select: 'name' } })
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/payments
exports.createPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { project, amount, date, status, note } = req.body;

    const ownsProject = await Project.exists({ _id: project, user: req.user._id });
    if (!ownsProject) return res.status(404).json({ message: 'Project not found' });

    const payment = await Payment.create({
      user: req.user._id,
      project,
      amount,
      date,
      status,
      note,
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/payments/:id
exports.updatePayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { project, amount, date, status, note } = req.body;

    const ownsProject = await Project.exists({ _id: project, user: req.user._id });
    if (!ownsProject) return res.status(404).json({ message: 'Project not found' });

    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { project, amount, date, status, note },
      { new: true, runValidators: true }
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/payments/:id
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};