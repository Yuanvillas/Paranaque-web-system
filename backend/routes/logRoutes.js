const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// Add a log entry
router.post('/add', async (req, res) => {
  try {
    const log = new Log(req.body);
    await log.save();
    res.status(201).json({ message: 'Log saved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all logs (for admin)
router.get('/', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get user-specific logs with pagination
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const actionType = req.query.actionType || null; // Optional filter

    let query = { userEmail: email };
    
    // Additional filter if actionType is provided
    if (actionType && actionType !== 'all') {
      query.actionType = actionType;
    }

    const totalLogs = await Log.countDocuments(query);
    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(pageSize)
      .skip((page - 1) * pageSize)
      .lean();

    // Format dates for frontend
    const formattedLogs = logs.map(log => ({
      ...log,
      formattedDate: new Date(log.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    }));

    return res.json({
      logs: formattedLogs,
      totalLogs,
      totalPages: Math.ceil(totalLogs / pageSize),
      currentPage: page,
      pageSize
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get log statistics for user
router.get('/stats/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const stats = {
      totalLogins: await Log.countDocuments({ userEmail: email, action: 'login' }),
      totalLogouts: await Log.countDocuments({ userEmail: email, action: 'logout' }),
      totalBorrows: await Log.countDocuments({ userEmail: email, action: 'borrow' }),
      totalReserves: await Log.countDocuments({ userEmail: email, action: 'reserve' }),
      totalReturns: await Log.countDocuments({ userEmail: email, action: 'return' })
    };

    const lastLogin = await Log.findOne({ userEmail: email, action: 'login' })
      .sort({ timestamp: -1 })
      .lean();

    return res.json({
      stats,
      lastLogin: lastLogin ? {
        timestamp: lastLogin.timestamp,
        formattedDate: new Date(lastLogin.timestamp).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      } : null
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
