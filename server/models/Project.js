const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Completed'],
      default: 'Pending',
    },
    fee: { type: Number, required: true, min: 0 },
    deadline: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);