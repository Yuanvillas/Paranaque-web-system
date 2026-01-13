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

// Get all logs
router.get('/', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
