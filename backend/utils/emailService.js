require('dotenv').config();
const { Resend } = require('resend');

// Initialize Resend email service
let resend = null;
let emailConfigured = false;

const getResend = () => {
  if (!resend) {
    try {
      resend = new Resend(process.env.RESEND_API_KEY);
      emailConfigured = true;
      console.log('📧 Email service configured with Resend');
    } catch (error) {
      console.error('⚠️  Failed to configure email service:', error.message);
      emailConfigured = false;
    }
  }
  return resend;
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const emailService = getResend();
    if (!emailService) {
      console.warn('⚠️  Email service not configured, skipping email');
      return { messageId: 'mock-' + Date.now() };
    }
    
    console.log('📧 Sending email via Resend to:', to);
    const emailFrom = process.env.EMAIL_FROM || 'Paranaledge Library <noreply@paranaledge.online>';
    const result = await emailService.emails.send({
      from: emailFrom,
      to,
      subject,
      html: html || `<p>${text}</p>`
    });
    
    if (result.error) {
      console.error('❌ Resend error:', result.error);
      throw new Error(result.error);
    }
    
    console.log('✅ Email sent successfully:', result.id);
    return { messageId: result.id };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('❌ Full error:', error);
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

const sendOverdueNotificationEmail = async (userEmail, bookTitle, dueDate, daysOverdue) => {
  const subject = '📚 Overdue Book Notification - Please Return Your Borrowed Book';
  const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">📚 Book Return Reminder</h2>
      <p>Dear Library Member,</p>
      <p>We are writing to remind you that the following book is <strong style="color: #d32f2f;">overdue</strong>:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
        <p><strong>Book Title:</strong> ${bookTitle}</p>
        <p><strong>Due Date:</strong> ${formattedDueDate}</p>
        <p><strong>Days Overdue:</strong> ${daysOverdue} day(s)</p>
      </div>
      
      <p><strong>Action Required:</strong></p>
      <ul>
        <li>Please return the book to the library as soon as possible</li>
        <li>You may renew the book if you need more time (subject to availability)</li>
        <li>Late returns may incur overdue fees as per library policies</li>
      </ul>
      
      <p>If you have already returned this book, please disregard this message and contact the library staff.</p>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
        <strong>Library Contact Information:</strong><br>
        If you have any questions or concerns, please contact the library staff.<br>
        Thank you for your cooperation!
      </p>
    </div>
  `;
  
  const text = `Dear Library Member,\n\nThe following book is overdue:\n\nBook Title: ${bookTitle}\nDue Date: ${formattedDueDate}\nDays Overdue: ${daysOverdue}\n\nPlease return the book to the library as soon as possible. Late returns may incur overdue fees.\n\nIf you have already returned this book, please contact the library staff.`;
  
  return sendEmail({ to: userEmail, subject, text, html });
};

const sendOverdueReminderEmail = async (userEmail, booksData) => {
  // booksData = [{ bookTitle, dueDate, daysOverdue }, ...]
  const subject = '⚠️ Multiple Books Overdue - Immediate Action Required';
  
  let booksHtml = '';
  booksData.forEach((book, index) => {
    const formattedDueDate = new Date(book.dueDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    booksHtml += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${book.bookTitle}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${formattedDueDate}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #d32f2f; font-weight: bold;">${book.daysOverdue}</td>
      </tr>
    `;
  });
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">⚠️ Multiple Books Overdue</h2>
      <p>Dear Library Member,</p>
      <p>You have <strong>${booksData.length}</strong> overdue book(s) that need to be returned immediately:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">#</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Book Title</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Due Date</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Days Overdue</th>
          </tr>
        </thead>
        <tbody>
          ${booksHtml}
        </tbody>
      </table>
      
      <p><strong>Important:</strong></p>
      <ul>
        <li>Please return all overdue books immediately</li>
        <li>Late return fees may apply to your account</li>
        <li>Your borrowing privileges may be suspended if books remain unreturned</li>
      </ul>
      
      <p>If you need any assistance or would like to discuss payment plans, please contact the library staff.</p>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
        <strong>Library Hours & Contact:</strong><br>
        Please visit us during library hours or call for assistance.<br>
        Thank you!
      </p>
    </div>
  `;
  
  return sendEmail({ to: userEmail, subject, text: '', html });
};

const sendPickupReminderEmail = async (userEmail, bookTitle, pickupDate) => {
  const pickupDateFormatted = new Date(pickupDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">📚 Your Book is Ready for Pickup!</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello,</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Great news! Your reserved book <strong>"${bookTitle}"</strong> is ready for pickup <strong>today</strong>!
        </p>
        <div style="background-color: #fff; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #333; font-weight: bold;">Pickup Date:</p>
          <p style="margin: 5px 0 0 0; color: #4CAF50; font-size: 18px; font-weight: bold;">${pickupDateFormatted}</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Please visit the library during operating hours to collect your book. Don't miss out!
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you have any questions, feel free to contact us.
        </p>
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          <strong>Paranaledge Library</strong>
        </p>
      </div>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #999;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `📚 Your Book is Ready for Pickup Today - "${bookTitle}"`,
    html
  });
};

const sendBorrowRequestSubmittedEmail = async (userEmail, bookTitle) => {
  const subject = 'Borrow Request Received - Awaiting Approval';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2196F3; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">📖 Borrow Request Received</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello,</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Thank you! Your request to borrow <strong>"${bookTitle}"</strong> has been received.
        </p>
        <div style="background-color: #fff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #333; font-weight: bold;">Book:</p>
          <p style="margin: 5px 0 0 0; color: #2196F3; font-size: 16px;">${bookTitle}</p>
          <p style="margin: 15px 0 0 0; color: #333; font-weight: bold;">Status:</p>
          <p style="margin: 5px 0 0 0; color: #FF9800; font-size: 14px;">⏳ Pending Approval</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Our library staff will review your request shortly. You will receive another email once your request has been approved or if any clarification is needed.
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you have any questions, feel free to contact us.
        </p>
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          <strong>Paranaledge Library</strong>
        </p>
      </div>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #999;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  const text = `Your request to borrow "${bookTitle}" has been received and is pending approval. You will be notified once approved.`;
  
  return sendEmail({ to: userEmail, subject, text, html });
};

const sendBorrowRequestApprovedEmail = async (userEmail, bookTitle, dueDate) => {
  const dueDateFormatted = new Date(dueDate).toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const subject = '✅ Your Borrow Request Has Been Approved!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">✅ Borrow Request Approved!</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello,</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Great news! Your request to borrow <strong>"${bookTitle}"</strong> has been approved!
        </p>
        <div style="background-color: #fff; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #333; font-weight: bold;">Book:</p>
          <p style="margin: 5px 0 0 0; color: #4CAF50; font-size: 16px;">${bookTitle}</p>
          <p style="margin: 15px 0 0 0; color: #333; font-weight: bold;">Due Date:</p>
          <p style="margin: 5px 0 0 0; color: #d32f2f; font-size: 14px;">${dueDateFormatted}</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          You can now collect your book from the library. Please return it on or before the due date.
        </p>
        <ul style="color: #333; font-size: 14px; line-height: 1.8;">
          <li>Visit the library during operating hours</li>
          <li>Return the book by ${dueDateFormatted}</li>
          <li>Contact us if you need to renew the book</li>
        </ul>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you have any questions, feel free to contact us.
        </p>
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          <strong>Paranaledge Library</strong>
        </p>
      </div>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #999;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  const text = `Your borrow request for "${bookTitle}" has been approved! Due date: ${dueDateFormatted}. Please collect the book from the library.`;
  
  return sendEmail({ to: userEmail, subject, text, html });
};

const sendBorrowRequestRejectedEmail = async (userEmail, bookTitle, rejectionReason) => {
  const subject = '❌ Your Borrow Request Could Not Be Approved';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #d32f2f; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">❌ Borrow Request Not Approved</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello,</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Unfortunately, your request to borrow <strong>"${bookTitle}"</strong> could not be approved.
        </p>
        <div style="background-color: #fff; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #333; font-weight: bold;">Book:</p>
          <p style="margin: 5px 0 0 0; font-size: 16px;">${bookTitle}</p>
          <p style="margin: 15px 0 0 0; color: #333; font-weight: bold;">Reason:</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">${rejectionReason}</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          If you have any questions about this decision or would like to discuss alternatives, please contact our library staff. We'd be happy to help!
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Best regards,<br>
          <strong>Paranaledge Library</strong>
        </p>
      </div>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #999;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;

  const text = `Unfortunately, your borrow request for "${bookTitle}" could not be approved. Reason: ${rejectionReason}. Please contact the library for more information.`;
  
  return sendEmail({ to: userEmail, subject, text, html });
};

module.exports = {
  sendEmail,
  sendReservationExpiredEmail,
  sendReservationApprovedEmail,
  sendReservationRejectedEmail,
  sendReservationPendingEmail,
  sendReservationReminderEmail,
  sendOverdueNotificationEmail,
  sendOverdueReminderEmail,
  sendPickupReminderEmail,
  sendBorrowRequestSubmittedEmail,
  sendBorrowRequestApprovedEmail,
  sendBorrowRequestRejectedEmail
};
