const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
// GET /api/projects?status=Active&client=<clientId>&search=web
exports.getProjects = async (req, res) => {
  try {
    const query = { user: req.user._id };
    if (req.query.status) query.status = req.query.status;
    if (req.query.client) query.client = req.query.client;
    if (req.query.search) {
      const safe = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: safe, $options: 'i' };
    }

    const projects = await Project.find(query)
      .populate('client', 'name company')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, client, status, fee, deadline } = req.body;

    const ownsClient = await Client.exists({ _id: client, user: req.user._id });
    if (!ownsClient) return res.status(404).json({ message: 'Client not found' });

    const project = await Project.create({
      user: req.user._id,
      name,
      client,
      status,
      fee,
      deadline,
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, client, status, fee, deadline } = req.body;

    const ownsClient = await Client.exists({ _id: client, user: req.user._id });
    if (!ownsClient) return res.status(404).json({ message: 'Client not found' });

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, client, status, fee, deadline },
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
        await Payment.deleteMany({ project: project._id, user: req.user._id });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};