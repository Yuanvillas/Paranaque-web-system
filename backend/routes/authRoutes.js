// routes/authRoutes.js
require('dotenv').config();

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ArchivedUser = require('../models/ArchivedUser');
const Log = require('../models/Log');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');
const { uploadBase64ToSupabase } = require('../utils/upload');

// Initialize Resend email service
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'Paranaledge Library <noreply@paranaledge.online>';
const BACKEND_URL = process.env.BACKEND_URL || 'https://paranaque-web-system.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://paranaque-web-system.onrender.com';

console.log(`Email service configured with Resend API Key present: ${!!process.env.RESEND_API_KEY}`);
console.log(`Email sender: ${EMAIL_FROM}`);
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);

// Register
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, suffix, contactNumber, email, password, role, address } = req.body;

    // Required check
    if (!firstName || !lastName || !contactNumber || !email || !password || !address) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Name validation
    if (!/^[a-zA-Z\s]+$/.test(firstName) || !/^[a-zA-Z\s]+$/.test(lastName)) {
      return res.status(400).json({ message: "Names must contain only letters." });
    }

    // ✅ Contact number must start with 09 and be exactly 11 digits
    if (!/^09\d{9}$/.test(contactNumber)) {
      return res.status(400).json({ message: "Contact number must start with '09' and be 11 digits." });
    }

    // ✅ Gmail-only validation
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
      return res.status(400).json({ message: "Only Gmail addresses are allowed." });
    }

    // ✅ Password strength validation before hashing
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(20).toString("hex");

    const newUser = new User({
      firstName,
      lastName,
      suffix,
      contactNumber,
      email,
      password: hashedPassword,
      role,
      address,
      isVerified: false,
      verificationToken,
    });

    await newUser.save();

    await new Log({
      userEmail: email,
      action: 'User registered successfully'
    }).save();

    console.log("New user data:", newUser);

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Email Verification - Parañaledge",
      html: `
        <h2>Email Verification</h2>
        <p>Welcome to Parañaledge! Please verify your email by clicking the link below:</p>
        <a href="https://paranaque-web-system.onrender.com/api/auth/verify/${verificationToken}" style="display: inline-block; padding: 10px 20px; background-color: #2e7d32; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">Verify Email</a>
        <p>Or copy and paste this link: https://paranaque-web-system.onrender.com/api/auth/verify/${verificationToken}</p>
        <p>This link expires in 24 hours.</p>
        <p>If you did not register, please ignore this email.</p>
      `,
    };

    console.log(`Attempting to send verification email to: ${email}`);
    
    // Send email using Resend
    try {
      const emailResponse = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: 'Email Verification - Paranaledge',
        html: `
          <h2>Email Verification</h2>
          <p>Welcome to Paranaledge! Please verify your email by clicking the link below:</p>
          <a href="${BACKEND_URL}/api/auth/verify/${verificationToken}" style="display: inline-block; padding: 10px 20px; background-color: #2e7d32; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">Verify Email</a>
          <p>Or copy and paste this link: ${BACKEND_URL}/api/auth/verify/${verificationToken}</p>
          <p>This link expires in 24 hours.</p>
          <p>If you did not register, please ignore this email.</p>
        `,
      });
      console.log(`Verification email sent successfully to: ${email}`, emailResponse);
    } catch (emailErr) {
      console.error("Email send error details:", emailErr.message);
      console.error("Full email error:", JSON.stringify(emailErr, null, 2));
      // Don't throw error - still allow user registration even if email fails
      console.warn(`User registered but email failed for: ${email}`);
    }
    
    return res.status(200).json({ message: 'User registered successfully. Please check your email to verify your account.' });
  } catch (err) {
    console.error("Error in /register route:", err);
    return res.status(500).json({ message: 'Server error. Please check the backend logs.' });
  }
});


// Email verification
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) {
      // Redirect to error page if token is invalid
      return res.redirect(`${FRONTEND_URL}/verify-error?reason=invalid`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Redirect to success page with email parameter
    res.redirect(`${FRONTEND_URL}/verify-success?email=${encodeURIComponent(user.email)}`);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}/verify-error?reason=server_error`);
  }
});

// Check if email is verified
router.get('/is-verified', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required', verified: false });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found', verified: false });
    }

    return res.json({ verified: user.isVerified });
  } catch (err) {
    return res.status(500).json({ message: err.message, verified: false });
  }
});

// Login
router.post('/login', async (req, res) => {
  console.log("/login/", req.body);
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log("/login/ - user:", user);
    if (!user) {
      // Log failed login attempt
      await new Log({
        userEmail: email,
        action: 'Failed login attempt - User not found'
      }).save();
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      // Log unverified login attempt
      await new Log({
        userEmail: email,
        action: 'Failed login attempt - Email not verified'
      }).save();
      return res.status(401).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log invalid password attempt
      await new Log({
        userEmail: email,
        action: 'Failed login attempt - Invalid password'
      }).save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Log successful login
    await new Log({
      userEmail: email,
      action: 'Successful login'
    }).save();

    console.log("User logged in:", user);
    return res.status(200).json({
      message: 'Login successful',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactNumber: user.contactNumber,
        address: user.address,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    console.log("Login error:", err);
    return res.status(500).json({ message: err.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Log user logout
    await new Log({
      userEmail: email,
      action: 'User logged out'
    }).save();

    return res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    console.log("Logout error:", err);
    return res.status(500).json({ message: err.message });
  }
});

// Get user profile
router.get('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user basic info (for post-verification redirect)
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }).select('email role firstName lastName');
    if (!user) return res.status(404).json({ message: 'User not found', user: null });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message, user: null });
  }
});

// Update profile
router.put('/profile/:email', async (req, res) => {
  console.log("/profile/", req.params);
  try {
    const { email } = req.params;
    const updates = req.body;

    if (updates.contactNumber && !/^\d{11}$/.test(updates.contactNumber)) {
      return res.status(400).json({ message: 'Contact number must be exactly 11 digits.' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put('/profile/upload-image/:email', async (req, res) => {
  console.log("Uploading image for:", req.params.email);

  try {
    const { email } = req.params;
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({ message: 'No image detected' });
    }

    if (typeof profilePicture !== 'string' || !profilePicture.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format. Expected base64 data URL.' });
    }

    const uploadedImageUrl = await uploadBase64ToSupabase(
      profilePicture,
      "book_bucket",
      `profile/${Date.now()}-${email}-profile.jpg`
    );

    if (!uploadedImageUrl) {
      return res.status(500).json({ message: "Failed to upload image to Supabase" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { profilePicture: uploadedImageUrl } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile picture updated successfully',
      user: updatedUser
    });

  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ message: err.message });
  }
});


router.put("/change-password", async (req, res) => {
  console.log("/change-password/", req.body)
  const { email, currentPassword, newPassword } = req.body;

  // Password strength validation (same as register)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ message: "Error updating password." });
  }
});

// GET /users (for /api/auth/users)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    res.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.put('/users/:id/update-role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Role updated successfully" });
  } catch (err) {
    console.error("Error updating role:", err);
    res.status(500).json({ message: "Failed to update role" });
  }
});

// DELETE /users/:id (for /api/auth/users/:id) - Archives user instead of permanent delete
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Create archived user record
    const archivedUser = new ArchivedUser({
      firstName: user.firstName,
      lastName: user.lastName,
      suffix: user.suffix,
      contactNumber: user.contactNumber,
      address: user.address,
      email: user.email,
      password: user.password,
      role: user.role,
      profilePicture: user.profilePicture,
      originalUserId: user._id,
      archivedAt: new Date(),
      archivedBy: 'admin'
    });

    await archivedUser.save();

    // Save archive log
    await new Log({
      userEmail: user.email,
      action: `User account archived by admin`
    }).save();

    // Delete the user from active users
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User archived successfully.' });
  } catch (err) {
    console.error("Error archiving user:", err);
    res.status(500).json({ error: 'Failed to archive user.' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    if (!updates.firstName || !updates.lastName || !updates.contactNumber || !updates.address) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!/^[a-zA-Z\s]+$/.test(updates.firstName) || !/^[a-zA-Z\s]+$/.test(updates.lastName)) {
      return res.status(400).json({ message: "Names must contain only letters." });
    }

    if (!/^09\d{9}$/.test(updates.contactNumber)) {
      return res.status(400).json({ message: "Contact number must start with '09' and be 11 digits." });
    }

    // Handle password update if provided
    if (updates.password && updates.password.trim() !== '') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/;
      if (!passwordRegex.test(updates.password)) {
        return res.status(400).json({
          message: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
        });
      }
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      // If password is empty, remove it from updates so it doesn't get updated
      delete updates.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    await new Log({
      userEmail: updatedUser.email,
      action: "User profile updated" + (updates.password ? " (password changed)" : "")
    }).save();

    res.json({
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /archived-users - Retrieve all archived users
router.get('/archived-users', async (req, res) => {
  try {
    const archivedUsers = await ArchivedUser.find().sort({ archivedAt: -1 });
    res.json({ users: archivedUsers });
  } catch (err) {
    console.error("Error fetching archived users:", err);
    res.status(500).json({ error: 'Failed to fetch archived users.' });
  }
});

// DELETE /archived-users/:id - Permanently delete archived user
router.delete('/archived-users/:id', async (req, res) => {
  try {
    const archivedUser = await ArchivedUser.findByIdAndDelete(req.params.id);
    if (!archivedUser) return res.status(404).json({ error: 'Archived user not found.' });

    res.json({ message: 'Archived user permanently deleted.' });
  } catch (err) {
    console.error("Error deleting archived user:", err);
    res.status(500).json({ error: 'Failed to delete archived user.' });
  }
});

// PUT /archived-users/:id/restore - Restore archived user to active users
router.put('/archived-users/:id/restore', async (req, res) => {
  try {
    const archivedUser = await ArchivedUser.findById(req.params.id);
    if (!archivedUser) return res.status(404).json({ error: 'Archived user not found.' });

    // Check if user with same email already exists
    const existingUser = await User.findOne({ email: archivedUser.email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Create new active user from archived data
    const restoredUser = new User({
      firstName: archivedUser.firstName,
      lastName: archivedUser.lastName,
      suffix: archivedUser.suffix,
      contactNumber: archivedUser.contactNumber,
      address: archivedUser.address,
      email: archivedUser.email,
      password: archivedUser.password,
      role: archivedUser.role,
      profilePicture: archivedUser.profilePicture,
      isVerified: true
    });

    await restoredUser.save();

    await new Log({
      userEmail: archivedUser.email,
      action: `Archived user restored to active users`
    }).save();

    // Delete from archived
    await ArchivedUser.findByIdAndDelete(req.params.id);

    res.json({ message: 'User restored successfully.', user: restoredUser });
  } catch (err) {
    console.error("Error restoring archived user:", err);
    res.status(500).json({ error: 'Failed to restore user.' });
  }
});

/**
 * PASSWORD RESET FLOW
 * 
 * Step 1: POST /api/auth/forgot-password - User requests password reset email
 * Step 2: Email sent with link: https://domain.com/api/auth/reset-password/{token}
 * Step 3: User clicks email link, backend GET /reset-password/:token verifies token
 * Step 4: Backend redirects to: https://domain.com/reset-password?token={token}&email={email}
 * Step 5: Frontend ResetPassword component loads with token and email
 * Step 6: User enters new password and submits
 * Step 7: Frontend POST /api/auth/reset-password with token and newPassword
 * Step 8: Backend updates password and returns success
 * Step 9: Frontend redirects to login page
 */

// POST /api/auth/forgot-password - Send password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email not found.' });
    }

    // Generate reset token (20 random bytes = 40 hex characters)
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    console.log(`\n📧 ========== PASSWORD RESET EMAIL ==========`);
    console.log(`📧 Email: ${email}`);
    console.log(`📧 Token: ${resetToken.substring(0, 10)}... (expires in 1 hour)`);

    // Construct reset link
    const resetLink = `${BACKEND_URL}/api/auth/reset-password/${resetToken}`;
    console.log(`📧 Reset Link: ${resetLink}`);
    console.log(`📧 ==========================================\n`);

    // Send email using Resend
    try {
      const emailResponse = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: 'Password Reset Request - Paranaledge Library',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2e7d32;">Password Reset Request</h2>
            <p>Hi ${user.firstName},</p>
            <p>You requested a password reset for your Paranaledge Library account. Please click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 12px 30px; background-color: #2e7d32; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>Or copy and paste this link:</p>
            <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
              ${resetLink}
            </p>
            
            <p style="color: #888; font-size: 12px;">
              This link expires in 1 hour.<br>
              If you did not request this, please ignore this email and your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #888; font-size: 12px; text-align: center;">
              Paranaledge Library System
            </p>
          </div>
        `,
      });
      
      console.log(`✅ Password reset email sent successfully to: ${email}`);
      console.log(`   Resend Response ID: ${emailResponse.data?.id || 'N/A'}`);
    } catch (emailErr) {
      console.error("❌ Email send error:", emailErr.message);
      throw new Error('Failed to send password reset email. Please try again later.');
    }
    
    // Log the action
    await new Log({
      userEmail: email,
      action: 'Password reset email sent'
    }).save().catch(err => console.error("Log save error:", err));

    res.json({ 
      message: 'Password reset email sent successfully. Check your email for instructions.',
      success: true 
    });
  } catch (err) {
    console.error("❌ Error in forgot-password route:", err.message);
    
    // Log the error
    await new Log({
      userEmail: req.body.email,
      action: `Failed to send password reset email: ${err.message}`
    }).save().catch(e => console.log("Log save error:", e));
    
    res.status(500).json({ message: 'Failed to send email. Please try again later.' });
  }
});

// GET /api/auth/reset-password/:token - Verify reset token and redirect to frontend reset form
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;

    console.log(`\n🔐 ========== PASSWORD RESET TOKEN VERIFICATION ==========`);
    console.log(`🔐 Token received: ${token.substring(0, 10)}...`);

    if (!token) {
      console.error(`🔐 ❌ No token provided`);
      return res.redirect(`${FRONTEND_URL}/forgot-password?error=missing_token`);
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // Token must not be expired
    });

    if (!user) {
      console.error(`🔐 ❌ Token invalid or expired`);
      console.log(`🔐 Redirecting to: ${FRONTEND_URL}/forgot-password?error=invalid_token`);
      return res.redirect(`${FRONTEND_URL}/forgot-password?error=invalid_token`);
    }

    console.log(`🔐 ✅ Token valid for user: ${user.email}`);

    // Token is valid, redirect to reset password page with token and email in query params
    const redirectUrl = `${FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    console.log(`🔐 Redirecting to: ${redirectUrl}`);
    console.log(`🔐 ===========================================================\n`);
    
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("❌ Error in reset-password GET route:", err.message);
    res.redirect(`${FRONTEND_URL}/forgot-password?error=server_error`);
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log(`\n🔑 ========== PASSWORD RESET SUBMISSION ==========`);
    console.log(`🔑 Token: ${token ? token.substring(0, 10) + '...' : 'MISSING'}`);
    console.log(`🔑 New Password Length: ${newPassword ? newPassword.length : 0}`);

    // Validation
    if (!token || !newPassword) {
      console.error(`🔑 ❌ Missing token or password`);
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      console.error(`🔑 ❌ Password does not meet requirements`);
      return res.status(400).json({
        message: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      console.error(`🔑 ❌ Token invalid or expired - no user found`);
      return res.status(400).json({ 
        message: 'Reset link is invalid or has expired. Please request a new password reset.' 
      });
    }

    console.log(`🔑 ✅ Token verified for user: ${user.email}`);

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;  // Clear the reset token
    user.resetTokenExpiry = undefined;  // Clear the expiry
    await user.save();

    console.log(`🔑 ✅ Password updated successfully`);

    // Log the action
    await new Log({
      userEmail: user.email,
      action: 'Password reset via email link'
    }).save().catch(err => console.error("Log save error:", err));

    console.log(`🔑 ===========================================================\n`);

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error("❌ Error in reset-password POST route:", err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// GET /api/auth/diagnostics - Debug password reset configuration
router.get('/diagnostics', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        BACKEND_URL: BACKEND_URL,
        FRONTEND_URL: FRONTEND_URL,
        EMAIL_FROM: EMAIL_FROM,
        RESEND_API_KEY_PRESENT: !!process.env.RESEND_API_KEY,
        NODE_ENV: process.env.NODE_ENV || 'production'
      },
      passwordResetFlow: {
        emailLink: `${BACKEND_URL}/api/auth/reset-password/{token}`,
        redirectsTo: `${FRONTEND_URL}/reset-password?token={token}&email={email}`,
        emailExpiryHours: 1
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly user statistics
router.get('/monthly-stats', async (req, res) => {
  try {
    const months = [];
    const monthlyStats = [];

    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const monthName = date.toLocaleString('default', { month: 'long' });
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      months.push({ monthName, startDate, endDate });
    }

    // Count users registered in each month
    for (const { monthName, startDate, endDate } of months) {
      const count = await User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      });

      monthlyStats.push({
        month: monthName,
        count: count
      });
    }

    res.status(200).json({
      monthlyStats: monthlyStats,
      total: monthlyStats.reduce((sum, stat) => sum + stat.count, 0)
    });
  } catch (err) {
    console.error("Error fetching monthly stats:", err);
    res.status(500).json({ error: 'Server error while fetching monthly stats' });
  }
});

module.exports = router;
