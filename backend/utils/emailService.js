const nodemailer = require('nodemailer');
require('dotenv').config();

// Lazy initialize transporter - only create when actually needed
let transporter = null;
let emailConfigured = false;

const getTransporter = () => {
  if (!transporter) {
    try {
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
        pool: {
          maxConnections: 1
        }
      });
      emailConfigured = true;
      console.log('📧 Email service configured');
    } catch (error) {
      console.error('⚠️  Failed to configure email service:', error.message);
      emailConfigured = false;
    }
  }
  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn('⚠️  Email service not configured, skipping email');
      return { messageId: 'mock-' + Date.now() };
    }
    
    const info = await transporter.sendMail({
      from: `"Library System" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log('📧 Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('⚠️  Error sending email:', error.message);
    // Don't crash - just log the error and continue
    return { messageId: 'error-' + Date.now(), error: error.message };
  }
};

const sendReservationExpiredEmail = async (userEmail, bookTitle) => {
  const subject = 'Book Reservation Expired';
  const text = `Your reservation for "${bookTitle}" has expired. The book is now available for other users.`;
  const html = `
    <h2>Book Reservation Expired</h2>
    <p>Your reservation for <strong>${bookTitle}</strong> has expired.</p>
    <p>The book is now available for other users to borrow or reserve.</p>
    <p>If you still wish to borrow this book, please make a new reservation.</p>
  `;
  
  return sendEmail({ to: userEmail, subject, text, html });
};

const sendReservationApprovedEmail = async (userEmail, bookTitle, dueDate) => {
  const subject = 'Book Reservation Approved';
  const text = `Your reservation for "${bookTitle}" has been approved. Please collect the book by ${dueDate}.`;
  const html = `
    <h2>Book Reservation Approved</h2>
    <p>Your reservation for <strong>${bookTitle}</strong> has been approved!</p>
    <p>Please collect the book from the library.</p>
    <p>Due date: ${dueDate}</p>
  `;
  
  return sendEmail({ to: userEmail, subject, text, html });
};

const sendReservationReminderEmail = async (userEmail, bookTitle, expiryDate) => {
  const subject = 'Book Reservation Reminder';
  const text = `Your reservation for "${bookTitle}" will expire on ${expiryDate}. Please collect the book before then.`;
  const html = `
    <h2>Book Reservation Reminder</h2>
    <p>Your reservation for <strong>${bookTitle}</strong> will expire soon.</p>
    <p>Please collect the book before: ${expiryDate}</p>
    <p>If you don't collect the book by then, the reservation will be cancelled automatically.</p>
  `;
  
  return sendEmail({ to: userEmail, subject, text, html });
};

const sendReservationRejectedEmail = async (userEmail, bookTitle, rejectionReason) => {
  const subject = 'Book Reservation Request Rejected';
  const text = `Your reservation request for "${bookTitle}" has been rejected. Reason: ${rejectionReason}`;
  const html = `
    <h2>Book Reservation Request Rejected</h2>
    <p>Your reservation request for <strong>${bookTitle}</strong> has been rejected.</p>
    <p><strong>Reason:</strong> ${rejectionReason}</p>
    <p>If you have any questions, please contact the library staff.</p>
  `;
  
  return sendEmail({ to: userEmail, subject, text, html });
};

const sendReservationPendingEmail = async (userEmail, bookTitle) => {
  const subject = 'Book Reservation Request Received';
  const text = `Your reservation request for "${bookTitle}" has been received and is pending approval.`;
  const html = `
    <h2>Book Reservation Request Received</h2>
    <p>Your reservation request for <strong>${bookTitle}</strong> has been received.</p>
    <p>The request is currently pending approval from our staff. We will notify you once it's approved or if any issues arise.</p>
    <p>Thank you for your patience!</p>
  `;
  
  return sendEmail({ to: userEmail, subject, text, html });
};

module.exports = {
  sendEmail,
  sendReservationExpiredEmail,
  sendReservationApprovedEmail,
  sendReservationRejectedEmail,
  sendReservationPendingEmail,
  sendReservationReminderEmail
};
