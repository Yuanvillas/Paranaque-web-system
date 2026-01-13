#!/usr/bin/env node

require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

console.log('🧪 Testing Email Service Configuration...');
console.log(`Gmail User: ${process.env.GMAIL_USER}`);
console.log(`Gmail Pass: ${process.env.GMAIL_PASS ? '***' : 'NOT SET'}`);
console.log('');

// Test the transporter
transporter.verify(function(err, success) {
  if (err) {
    console.error('❌ Email configuration error:', err);
    process.exit(1);
  } else {
    console.log('✅ Email service is ready to send!');
    console.log('');
    
    // Try sending a test email
    const testEmail = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Send to self
      subject: "Test Email - Parañaledge",
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from Parañaledge Library System.</p>
        <p>If you received this, the email service is working correctly!</p>
      `,
    };

    console.log('📧 Sending test email...');
    transporter.sendMail(testEmail, function(err, info) {
      if (err) {
        console.error('❌ Failed to send test email:', err);
        process.exit(1);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        process.exit(0);
      }
    });
  }
});
