const Project = require('../models/Project');
const Payment = require('../models/Payment');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [activeProjects, totalProjects, incomeAgg, pendingAgg, monthly, statusAgg] =
      await Promise.all([
        Project.countDocuments({ user: userId, status: 'Active' }),
        Project.countDocuments({ user: userId }),
        Payment.aggregate([
          { $match: { user: userId, status: 'Paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.aggregate([
          { $match: { user: userId, status: 'Pending' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Payment.aggregate([
          { $match: { user: userId, status: 'Paid' } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Project.aggregate([
          { $match: { user: userId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
      ]);

    res.json({
      activeProjects,
      totalProjects,
      totalIncome: incomeAgg[0]?.total || 0,
      pendingPayments: pendingAgg[0]?.total || 0,
      monthlyIncome: monthly.map((m) => ({ month: m._id, total: m.total })),
      projectStatus: statusAgg.map((s) => ({ status: s._id, count: s.count })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};