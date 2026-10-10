const { validationResult } = require('express-validator');
const Client = require('../models/Client');
const Project = require('../models/Project');

// GET /api/clients?search=abc
exports.getClients = async (req, res) => {
  try {
    const query = { user: req.user._id };
    if (req.query.search) {
      const safe = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: safe, $options: 'i' };
    }
    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/clients
exports.createClient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, phone, company } = req.body;
    const client = await Client.create({
      user: req.user._id,
      name,
      email,
      phone,
      company,
    });
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/clients/:id
exports.updateClient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, phone, company } = req.body;
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, email, phone, company },
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/clients/:id
exports.deleteClient = async (req, res) => {
  try {
    const hasProjects = await Project.exists({
      client: req.params.id,
      user: req.user._id,
    });
    if (hasProjects) {
      return res
        .status(400)
        .json({ message: 'Cannot delete a client who still has projects' });
    }

    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};