const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

transporter.sendMail({
  from: `"GreenApp" <${process.env.GMAIL_USER}>`,
  to: 'Yuanvillas89@gmail.com', 
  subject: 'Test Email from GreenApp',
  text: 'Hello! This is a test email to verify Gmail setup in your app.'
}).then(() => {
  console.log("✅ Test email sent.");
}).catch((err) => {
  console.error("❌ Failed to send test email:", err);
});
