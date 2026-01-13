const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const { sendReservationExpiredEmail, sendReservationReminderEmail } = require('./emailService');

const RESERVATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const REMINDER_BEFORE_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const checkAndExpireReservations = async () => {
  try {
    const now = new Date();
    
    // Find reservations that are expired
    const expiredReservations = await Transaction.find({
      type: 'reserve',
      status: 'pending',
      startDate: { $lt: new Date(now - RESERVATION_DURATION) }
    });

    // Process each expired reservation
    for (const reservation of expiredReservations) {
      // Update transaction status
      reservation.status = 'expired';
      await reservation.save();

      // Send email notification
      try {
        await sendReservationExpiredEmail(
          reservation.userEmail,
          reservation.bookTitle
        );
      } catch (emailError) {
        console.error('Failed to send expiration email:', emailError);
      }
    }

    // Find reservations that will expire soon (for reminders)
    const almostExpiredReservations = await Transaction.find({
      type: 'reserve',
      status: 'pending',
      startDate: {
        $lt: new Date(now - (RESERVATION_DURATION - REMINDER_BEFORE_EXPIRY)),
        $gt: new Date(now - RESERVATION_DURATION)
      },
      reminderSent: { $ne: true }
    });

    // Send reminders for reservations about to expire
    for (const reservation of almostExpiredReservations) {
      const expiryDate = new Date(reservation.startDate.getTime() + RESERVATION_DURATION);
      
      try {
        await sendReservationReminderEmail(
          reservation.userEmail,
          reservation.bookTitle,
          expiryDate.toLocaleString()
        );
        
        // Mark reminder as sent
        reservation.reminderSent = true;
        await reservation.save();
      } catch (emailError) {
        console.error('Failed to send reminder email:', emailError);
      }
    }

  } catch (error) {
    console.error('Error in reservation expiration check:', error);
  }
};

// Function to start the periodic check
const startReservationExpirationCheck = () => {
  // Run immediately on start
  checkAndExpireReservations();
  
  // Then run every 15 minutes
  setInterval(checkAndExpireReservations, 15 * 60 * 1000);
};

module.exports = {
  startReservationExpirationCheck,
  checkAndExpireReservations
};
