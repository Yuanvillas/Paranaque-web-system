/**
 * Overdue Notification Integration Examples
 * 
 * This file shows different ways to integrate overdue notifications
 * into your system. Uncomment and modify as needed.
 */

// ============================================================================
// OPTION 1: Add to server.js for automatic daily checks
// ============================================================================

/*
// At the top of server.js, add:
const { checkAndNotifyOverdue, getOverdueStatistics } = require('./utils/overdueNotificationScheduler');

// After database connection, add:
// Daily overdue check at 9:00 AM
const scheduleOverdueChecks = () => {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(9, 0, 0, 0); // 9:00 AM
  
  // If already past 9:00 AM, schedule for tomorrow
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const timeUntilScheduled = scheduledTime - now;
  console.log(`⏰ Next overdue check scheduled in ${Math.round(timeUntilScheduled / 1000 / 60)} minutes`);
  
  setTimeout(async () => {
    try {
      console.log('🔔 Running scheduled overdue check...');
      const result = await checkAndNotifyOverdue({
        sendEmails: true,
        markReminderSent: false, // Set to true if you want to track
        daysOverdueMinimum: 1,
        excludePreviouslySent: true
      });
      
      console.log(`✅ Daily overdue check complete:`);
      console.log(`   - Total overdue: ${result.totalOverdue}`);
      console.log(`   - Notifications sent: ${result.emailsSent.length}`);
      console.log(`   - Errors: ${result.errors.length}`);
      
      // Schedule next check
      scheduleOverdueChecks();
    } catch (error) {
      console.error('❌ Error in scheduled overdue check:', error);
      // Retry in 1 hour
      setTimeout(scheduleOverdueChecks, 60 * 60 * 1000);
    }
  }, timeUntilScheduled);
};

// Call this after connecting to database
scheduleOverdueChecks();
*/

// ============================================================================
// OPTION 2: Use node-cron for more flexible scheduling
// ============================================================================

/*
// First install: npm install node-cron

// In server.js:
const cron = require('node-cron');
const { checkAndNotifyOverdue } = require('./utils/overdueNotificationScheduler');

// Run every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('🔔 Running scheduled overdue notification check');
    const result = await checkAndNotifyOverdue({
      sendEmails: true,
      markReminderSent: false,
      daysOverdueMinimum: 1,
      excludePreviouslySent: true
    });
    console.log(`✅ Notifications sent: ${result.emailsSent.length}`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
});

// You can also run:
// - Every Monday and Thursday at 9 AM: '0 9 * * 1,4'
// - Every 6 hours: '0 */6 * * *'
// - Every day at 9 AM and 3 PM: '0 9,15 * * *'
// - Every 30 minutes: '*/30 * * * *'
*/

// ============================================================================
// OPTION 3: Add admin API endpoint for manual notification
// ============================================================================

/*
// In routes/transactionRoutes.js or a new admin route:

router.post('/admin/trigger-overdue-notifications', authenticateAdmin, async (req, res) => {
  try {
    const { dryRun = false, daysMinimum = 1 } = req.body;
    
    const { checkAndNotifyOverdue } = require('../utils/overdueNotificationScheduler');
    
    const result = await checkAndNotifyOverdue({
      sendEmails: !dryRun,
      markReminderSent: !dryRun,
      daysOverdueMinimum: daysMinimum,
      excludePreviouslySent: true
    });
    
    res.json({
      message: dryRun ? 'DRY RUN COMPLETE' : 'NOTIFICATIONS SENT',
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Usage:
// POST /api/admin/trigger-overdue-notifications
// Body: { "dryRun": true, "daysMinimum": 1 }
*/

// ============================================================================
// OPTION 4: Frontend button to send notification to single user
// ============================================================================

/*
// React component example:

import React, { useState } from 'react';

function SendOverdueNotification({ userEmail }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const sendNotification = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/transactions/overdue/notify/${userEmail}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sendEmail: true,
            markReminderSent: true
          })
        }
      );

      const data = await response.json();
      setResult(data);

      if (data.emailsSent > 0) {
        alert(`✅ Notification sent to ${userEmail}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={sendNotification} 
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Overdue Notice'}
      </button>
      {result && (
        <div>
          <p>{result.message}</p>
          <p>Books: {result.books.map(b => b.title).join(', ')}</p>
        </div>
      )}
    </div>
  );
}

export default SendOverdueNotification;
*/

// ============================================================================
// OPTION 5: Dashboard statistics view
// ============================================================================

/*
// React component example:

import React, { useEffect, useState } from 'react';
import { getOverdueStatistics } from '../utils/overdueNotificationScheduler';

function OverdueStatistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await getOverdueStatistics();
        setStats(result.statistics);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="statistics">
      <h2>Overdue Books Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats?.totalOverdue || 0}</h3>
          <p>Total Overdue</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.requiresNotification || 0}</h3>
          <p>Require Notification</p>
        </div>
        <div className="stat-card">
          <h3>{Object.keys(stats?.byUser || {}).length}</h3>
          <p>Users with Overdue</p>
        </div>
      </div>
    </div>
  );
}

export default OverdueStatistics;
*/

// ============================================================================
// OPTION 6: Command-line utility for manual runs
// ============================================================================

/*
// Create file: backend/scripts/sendOverdueNotifications.js

const mongoose = require('mongoose');
require('dotenv').config();
const { checkAndNotifyOverdue, getOverdueStatistics } = require('../utils/overdueNotificationScheduler');

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'check') {
      // Dry run - just check what needs to be sent
      console.log('\n📋 DRY RUN - Preview of notifications:');
      const preview = await checkAndNotifyOverdue({
        sendEmails: false,
        daysOverdueMinimum: 1
      });
      console.log(JSON.stringify(preview, null, 2));
    } else if (command === 'send') {
      // Actually send notifications
      console.log('\n📧 SENDING notifications...');
      const result = await checkAndNotifyOverdue({
        sendEmails: true,
        markReminderSent: true,
        daysOverdueMinimum: 1,
        excludePreviouslySent: true
      });
      console.log(JSON.stringify(result, null, 2));
    } else if (command === 'stats') {
      // Show statistics
      console.log('\n📊 Overdue Statistics:');
      const result = await getOverdueStatistics();
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('Usage:');
      console.log('  node scripts/sendOverdueNotifications.js check   - Preview notifications');
      console.log('  node scripts/sendOverdueNotifications.js send    - Send notifications');
      console.log('  node scripts/sendOverdueNotifications.js stats   - Show statistics');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

// Usage:
// node backend/scripts/sendOverdueNotifications.js check
// node backend/scripts/sendOverdueNotifications.js send
// node backend/scripts/sendOverdueNotifications.js stats
*/

module.exports = {
  // This file is for examples only
  // Implementation options are shown as comments above
};
