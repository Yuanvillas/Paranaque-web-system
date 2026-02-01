/**
 * Overdue Notification Scheduler
 * 
 * This module handles scheduled checks and notifications for overdue books.
 * Can be run periodically via cron jobs or manually triggered.
 */

const Transaction = require('../models/Transaction');
const Log = require('../models/Log');
const {
  sendOverdueNotificationEmail,
  sendOverdueReminderEmail
} = require('./emailService');

/**
 * Check for overdue books and optionally send notifications
 * @param {Object} options - Configuration options
 * @param {boolean} options.sendEmails - Whether to actually send emails (default: false for dry-run)
 * @param {boolean} options.markReminderSent - Whether to mark transactions as reminder sent
 * @param {number} options.daysOverdueMinimum - Minimum days overdue before sending notification (default: 1)
 * @param {number} options.daysOverdueMaximum - Maximum days overdue (optional, for limiting old overdue)
 * @returns {Promise<Object>} Notification results and statistics
 */
async function checkAndNotifyOverdue(options = {}) {
  const {
    sendEmails = false,
    markReminderSent = false,
    daysOverdueMinimum = 1,
    daysOverdueMaximum = null,
    excludePreviouslySent = true
  } = options;

  try {
    console.log('📬 Starting overdue book check...');
    const now = new Date();
    
    // Find all active borrow transactions where endDate has passed
    let query = {
      type: 'borrow',
      status: 'active',
      endDate: { $lt: now }
    };

    // Optionally exclude previously notified transactions
    if (excludePreviouslySent) {
      query.reminderSent = false;
    }

    const overdueTransactions = await Transaction.find(query);

    // Group transactions by user and calculate days overdue
    const userOverdueMap = {};
    let filteredCount = 0;

    overdueTransactions.forEach(transaction => {
      const daysOverdue = Math.floor(
        (now - new Date(transaction.endDate)) / (1000 * 60 * 60 * 24)
      );

      // Check if within acceptable range
      if (daysOverdue < daysOverdueMinimum) {
        console.log(`⏳ Book "${transaction.bookTitle}" for ${transaction.userEmail} only ${daysOverdue} days overdue (minimum: ${daysOverdueMinimum})`);
        return;
      }

      if (daysOverdueMaximum && daysOverdue > daysOverdueMaximum) {
        console.log(`⏭️  Skipping "${transaction.bookTitle}" - ${daysOverdue} days overdue (max: ${daysOverdueMaximum})`);
        return;
      }

      filteredCount++;

      if (!userOverdueMap[transaction.userEmail]) {
        userOverdueMap[transaction.userEmail] = [];
      }

      userOverdueMap[transaction.userEmail].push({
        transaction,
        daysOverdue
      });
    });

    const userEmails = Object.keys(userOverdueMap);
    console.log(`📊 Found ${overdueTransactions.length} overdue transaction(s), ${filteredCount} eligible for notification`);

    if (filteredCount === 0) {
      return {
        success: true,
        message: 'No eligible overdue books found',
        totalOverdue: overdueTransactions.length,
        eligible: filteredCount,
        notificationsSent: 0,
        emailsSent: [],
        errors: []
      };
    }

    const emailsSent = [];
    const errors = [];
    let totalEmailsSent = 0;

    // Send notifications to each user
    for (const userEmail of userEmails) {
      const userOverdues = userOverdueMap[userEmail];

      try {
        console.log(`📧 Preparing notification for ${userEmail} (${userOverdues.length} book(s))`);

        if (userOverdues.length === 1 && sendEmails) {
          // Single book - send individual notification
          const { transaction, daysOverdue } = userOverdues[0];
          console.log(`   Sending single book notification: "${transaction.bookTitle}"`);

          const result = await sendOverdueNotificationEmail(
            userEmail,
            transaction.bookTitle,
            transaction.endDate,
            daysOverdue
          );

          if (!result.error) {
            totalEmailsSent++;
            emailsSent.push({
              userEmail,
              type: 'single',
              bookCount: 1,
              books: [transaction.bookTitle],
              messageId: result.messageId
            });

            if (markReminderSent) {
              transaction.reminderSent = true;
              await transaction.save();
            }
          } else {
            errors.push({
              userEmail,
              error: result.error
            });
          }
        } else if (userOverdues.length > 1 && sendEmails) {
          // Multiple books - send bulk notification
          console.log(`   Sending bulk notification for ${userOverdues.length} books`);

          const booksData = userOverdues.map(({ transaction, daysOverdue }) => ({
            bookTitle: transaction.bookTitle,
            dueDate: transaction.endDate,
            daysOverdue
          }));

          const result = await sendOverdueReminderEmail(userEmail, booksData);

          if (!result.error) {
            totalEmailsSent++;
            emailsSent.push({
              userEmail,
              type: 'bulk',
              bookCount: userOverdues.length,
              books: userOverdues.map(u => u.transaction.bookTitle),
              messageId: result.messageId
            });

            if (markReminderSent) {
              await Promise.all(
                userOverdues.map(({ transaction }) => {
                  transaction.reminderSent = true;
                  return transaction.save();
                })
              );
            }
          } else {
            errors.push({
              userEmail,
              error: result.error
            });
          }
        } else if (!sendEmails) {
          // Dry run - just log what would be sent
          emailsSent.push({
            userEmail,
            type: userOverdues.length === 1 ? 'single' : 'bulk',
            bookCount: userOverdues.length,
            books: userOverdues.map(u => u.transaction.bookTitle),
            messageId: 'DRY_RUN'
          });
        }

        // Log the notification attempt
        await new Log({
          userEmail,
          action: `Overdue notification processed for ${userOverdues.length} book(s) [${sendEmails ? 'SENT' : 'DRY_RUN'}]`
        }).save();
      } catch (error) {
        console.error(`❌ Error processing ${userEmail}:`, error.message);
        errors.push({
          userEmail,
          error: error.message
        });
      }
    }

    console.log(`✅ Overdue check complete. Emails sent: ${totalEmailsSent}, Errors: ${errors.length}`);

    return {
      success: true,
      message: sendEmails 
        ? `Successfully sent ${totalEmailsSent} overdue notification(s)`
        : `DRY RUN: Would send ${emailsSent.length} notification(s)`,
      totalOverdue: overdueTransactions.length,
      eligible: filteredCount,
      notificationsSent: emailsSent.length,
      emailsSent,
      errors,
      dryRun: !sendEmails
    };
  } catch (error) {
    console.error('❌ Error in checkAndNotifyOverdue:', error);
    return {
      success: false,
      message: error.message,
      emailsSent: [],
      errors: [{ error: error.message }]
    };
  }
}

/**
 * Get overdue statistics
 * @returns {Promise<Object>} Statistics about overdue books
 */
async function getOverdueStatistics() {
  try {
    const now = new Date();

    const stats = {
      totalOverdue: 0,
      byDaysOverdue: {},
      byUser: {},
      requiresNotification: 0
    };

    const overdueTransactions = await Transaction.find({
      type: 'borrow',
      status: 'active',
      endDate: { $lt: now }
    });

    stats.totalOverdue = overdueTransactions.length;

    overdueTransactions.forEach(transaction => {
      const daysOverdue = Math.floor(
        (now - new Date(transaction.endDate)) / (1000 * 60 * 60 * 24)
      );

      // Count by days overdue
      const dayRange = Math.ceil(daysOverdue / 7) * 7; // Group by week
      stats.byDaysOverdue[dayRange] = (stats.byDaysOverdue[dayRange] || 0) + 1;

      // Count by user
      stats.byUser[transaction.userEmail] = (stats.byUser[transaction.userEmail] || 0) + 1;

      // Count needing notification
      if (!transaction.reminderSent) {
        stats.requiresNotification++;
      }
    });

    return {
      success: true,
      statistics: stats
    };
  } catch (error) {
    console.error('❌ Error in getOverdueStatistics:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

module.exports = {
  checkAndNotifyOverdue,
  getOverdueStatistics
};
