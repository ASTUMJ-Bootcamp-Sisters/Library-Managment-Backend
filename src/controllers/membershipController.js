

// Admin: Delete membership
exports.deleteMembership = async (req, res) => {
  try {
    // Ensure user is admin
    if (req.user.role !== "admin" && req.user.role !== "super-admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only."
      });
    }

    const { id } = req.params;
    
    // First find the membership to get file paths before deletion
    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found"
      });
    }

    // Store file paths to delete them later
    const idCardFilePath = membership.idCardImage;
    const paymentFilePath = membership.paymentImage;

    // Delete membership from database
    await Membership.findByIdAndDelete(id);

    // Delete files from filesystem
    let deletedFiles = [];
    if (idCardFilePath) {
      const idCardDeleted = await deleteFileIfExists(idCardFilePath);
      if (idCardDeleted) deletedFiles.push('ID card image');
    }
    
    if (paymentFilePath) {
      const paymentDeleted = await deleteFileIfExists(paymentFilePath);
      if (paymentDeleted) deletedFiles.push('Payment image');
    }

    res.status(200).json({
      success: true,
      message: "Membership deleted successfully",
      filesDeleted: deletedFiles.length ? deletedFiles : "No files deleted"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete membership",
      error: err.message
    });
  }
};
const Membership = require("../models/Membership");
const User = require("../models/User");
const crypto = require("crypto");
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('../utils/emailService');

// Helper function to delete file safely
const deleteFileIfExists = async (filePath) => {
  try {
    // Check if file exists
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Failed to delete file ${filePath}:`, err);
    return false;
  }
};

// Helper function to send verification email
const sendVerificationEmail = async (email, token) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h1 style="color: #8B4513; text-align: center;">Email Verification for ASTUMSJ Library Membership</h1>
      <p>Thank you for applying for membership with ASTUMSJ Library!</p>
      <p>To complete your membership application, we need to verify your email address.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:5000/api/membership/verify-email/${token}" style="background-color: #8B4513; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify My Email</a>
      </div>
      <p>This verification link will expire in 24 hours.</p>
      <p>If you didn't request this membership, you can safely ignore this email.</p>
      <div style="text-align: center; margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
        <p style="margin: 0; color: #666;">ASTUMSJ Library Management System</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, "Verify Your Email for ASTUMSJ Library Membership", html);
};

// Helper function to send membership request confirmation email
const sendMembershipRequestConfirmation = async (email, userName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h1 style="color: #8B4513; text-align: center;">Thank You for Your Membership Request</h1>
      <p>Dear ${userName},</p>
      <p>We have received your membership request for the ASTUMSJ Library. Your request is currently being processed.</p>
      <p><strong>Next steps:</strong></p>
      <ol style="padding-left: 25px;">
        <li style="margin-bottom: 10px;">Verify your email address using the verification email we sent (if you haven't already)</li>
        <li style="margin-bottom: 10px;">Our admin team will review your application, including your ID card and payment information</li>
        <li style="margin-bottom: 10px;">You will receive an email notification when your request is approved or rejected</li>
      </ol>
      <p>If you have any questions, please contact our support team at <a href="mailto:support@astumsj.library.com">support@astumsj.library.com</a></p>
      <p>Thank you for choosing ASTUMSJ Library!</p>
      <div style="text-align: center; margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
        <p style="margin: 0; color: #666;">ASTUMSJ Library Management System</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, "ASTUMSJ Library Membership Request Submitted", html);
};

// Helper function to send membership approval email
const sendMembershipApprovalEmail = async (email, userName, expiryDate) => {
  // Format expiry date nicely
  const formattedExpiryDate = new Date(expiryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h1 style="color: #8B4513; text-align: center;">Congratulations! Your Membership is Approved</h1>
      <p>Dear ${userName},</p>
      <p>We are delighted to inform you that your ASTUMSJ Library membership application has been approved!</p>
      
      <h2 style="color: #A0522D;">Your Membership Benefits:</h2>
      <ul style="list-style-type: none; padding-left: 0;">
        <li style="margin-bottom: 10px; padding-left: 20px;">✓ Borrow up to 5 books at a time</li>
        <li style="margin-bottom: 10px; padding-left: 20px;">✓ Extended borrowing duration (21 days)</li>
        <li style="margin-bottom: 10px; padding-left: 20px;">✓ Access to members-only events and workshops</li>
        <li style="margin-bottom: 10px; padding-left: 20px;">✓ Access to exclusive digital resources</li>
        <li style="margin-bottom: 10px; padding-left: 20px;">✓ No late fees for the first 3 days</li>
      </ul>
      
      <div style="background-color: #f5f5dc; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Your membership is valid until: ${formattedExpiryDate}</strong></p>
      </div>
      
      <p>You can now enjoy all the benefits of being a member. To start borrowing books, simply visit our library or log in to our online portal.</p>
      <p>If you have any questions about your membership or need assistance, please don't hesitate to contact us at <a href="mailto:support@astumsj.library.com">support@astumsj.library.com</a></p>
      <p>Happy reading!</p>
      
      <div style="text-align: center; margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
        <p style="margin: 0; color: #666;">ASTUMSJ Library Management System</p>
        <p style="margin: 5px 0 0; color: #666; font-size: 14px;">Where knowledge meets community</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, "Your ASTUMSJ Library Membership is Approved!", html);
};

// Helper function to send membership rejection email
const sendMembershipRejectionEmail = async (email, userName, rejectionReason) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h1 style="color: #8B4513; text-align: center;">ASTUMSJ Library Membership Status Update</h1>
      <p>Dear ${userName},</p>
      <p>Thank you for your interest in becoming a member of the ASTUMSJ Library. We have reviewed your application carefully.</p>
      
      <p>Unfortunately, we are unable to approve your membership application at this time due to the following reason:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #8B4513; margin: 20px 0;">
        <p style="margin: 0;">${rejectionReason}</p>
      </div>
      
      <p>You are welcome to submit a new application addressing the issues mentioned above. If you have any questions or need clarification, please don't hesitate to contact our support team at <a href="mailto:support@astumsj.library.com">feti.fafi@astumsj.library.com</a>.</p>
      
      <div style="margin-top: 30px;">
        <p>Best regards,</p>
        <p>The ASTUMSJ Library Team</p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
        <p style="margin: 0; color: #666;">ASTUMSJ Library Management System</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, "Update on Your ASTUMSJ Library Membership Application", html);
};

// Request membership
exports.membershipRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const files = req.files || {};
    const idCardImage = files.idCard ? files.idCard[0].path : null;
    const paymentImage = files.paymentImage ? files.paymentImage[0].path : null;
    const { paymentAmount, paymentMethod, paymentReference } = req.body;

    // Input validation for files
    if (!idCardImage) {
      // Delete any uploaded payment file to prevent orphaned files
      if (paymentImage) {
        await deleteFileIfExists(paymentImage);
      }
      return res.status(400).json({
        success: false,
        message: "ID card image is required"
      });
    }
    
    if (!paymentImage) {
      // Delete any uploaded ID card file to prevent orphaned files
      if (idCardImage) {
        await deleteFileIfExists(idCardImage);
      }
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required"
      });
    }
    
    // Payment validation
    if (!paymentAmount || !paymentMethod) {
      // Delete any uploaded files to prevent orphaned files
      if (idCardImage) await deleteFileIfExists(idCardImage);
      if (paymentImage) await deleteFileIfExists(paymentImage);
      
      return res.status(400).json({
        success: false,
        message: "Payment amount and method are required"
      });
    }

    // Validate payment amount (minimum required amount)
    const minimumPaymentAmount = 50; // Example minimum amount
    if (parseFloat(paymentAmount) < minimumPaymentAmount) {
      // Delete any uploaded files to prevent orphaned files
      if (idCardImage) await deleteFileIfExists(idCardImage);
      if (paymentImage) await deleteFileIfExists(paymentImage);
      
      return res.status(400).json({
        success: false,
        message: `Payment amount must be at least ${minimumPaymentAmount}`
      });
    }

    // Check if user already has a membership
    const existingMembership = await Membership.findOne({ user: userId });
    if (existingMembership) {
      // Delete any uploaded files to prevent orphaned files
      if (idCardImage) await deleteFileIfExists(idCardImage);
      if (paymentImage) await deleteFileIfExists(paymentImage);
      
      return res.status(400).json({
        success: false,
        message: "You already have a membership request or active membership"
      });
    }

    // Get user email, verification status, and check if blacklisted
    const user = await User.findById(userId);
    if (!user) {
      // Delete any uploaded files to prevent orphaned files
      if (idCardImage) await deleteFileIfExists(idCardImage);
      if (paymentImage) await deleteFileIfExists(paymentImage);
      
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is blacklisted
    if (user.isBlacklisted) {
      // Delete any uploaded files to prevent orphaned files
      if (idCardImage) await deleteFileIfExists(idCardImage);
      if (paymentImage) await deleteFileIfExists(paymentImage);
      
      return res.status(403).json({
        success: false,
        message: "You are currently blacklisted and cannot apply for a membership"
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    // Create new membership
    const membership = new Membership({
      user: userId,
      idCardImage,
      paymentImage,
      paymentAmount: parseFloat(paymentAmount),
      paymentMethod,
      paymentReference,
      status: "Pending",
      verificationToken,
      verificationTokenExpiry,
      isEmailVerified: user.emailVerified === true
    });

    await membership.save();

    // Send verification email only if not already verified
    let verificationEmailSent = true;
    if (!user.emailVerified) {
      verificationEmailSent = await sendVerificationEmail(user.email, verificationToken);
    }

    // Send membership request confirmation email
    const confirmationEmailSent = await sendMembershipRequestConfirmation(user.email, user.fullName);

    res.status(201).json({
      success: true,
      message: "Membership request submitted",
      emailSent: verificationEmailSent && confirmationEmailSent,
      membership
    });
  } catch (err) {
    // Cleanup any uploaded files in case of error
    try {
      if (req.files) {
        const files = req.files;
        if (files.idCard && files.idCard[0]) {
          await deleteFileIfExists(files.idCard[0].path);
        }
        if (files.paymentImage && files.paymentImage[0]) {
          await deleteFileIfExists(files.paymentImage[0].path);
        }
      }
    } catch (cleanupErr) {
      console.error('Error cleaning up files:', cleanupErr);
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to submit membership request",
      error: err.message
    });
  }
};

// Verify email for membership
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const membership = await Membership.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    });

    if (!membership) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token"
      });
    }

    membership.isEmailVerified = true;
    membership.verificationToken = undefined;
    membership.verificationTokenExpiry = undefined;
    await membership.save();

    // Also update the user's emailVerified status for consistency
    const user = await User.findById(membership.user);
    if (user && !user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to verify email",
      error: err.message
    });
  }
};

// Get membership status
exports.getMembershipStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const membership = await Membership.findOne({ user: userId });
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "No membership found"
      });
    }

    res.status(200).json({
      success: true,
      membership
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to get membership status",
      error: err.message
    });
  }
};

// Admin: Get all memberships
exports.getAllMemberships = async (req, res) => {
  try {
    // Ensure user is admin
    if (req.user.role !== "admin" && req.user.role !== "super-admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only."
      });
    }

    const memberships = await Membership.find().populate("user", "fullName email");
    res.status(200).json({
      success: true,
      count: memberships.length,
      memberships
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to get memberships",
      error: err.message
    });
  }
};

// Admin: Approve membership
exports.approveMembership = async (req, res) => {
  try {
    // Ensure user is admin
    if (req.user.role !== "admin" && req.user.role !== "super-admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only."
      });
    }

    const { id } = req.params;
    const { expiryMonths = 1 } = req.body; // Default to 1 month

    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found"
      });
    }

    // Get the user record to check email verification status
    const user = await User.findById(membership.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if email is verified in both user and membership records
    if (!membership.isEmailVerified || !user.emailVerified) {
      // Sync the status between user and membership
      if (user.emailVerified && !membership.isEmailVerified) {
        membership.isEmailVerified = true;
      } else if (membership.isEmailVerified && !user.emailVerified) {
        user.emailVerified = true;
        await user.save();
      } else {
        return res.status(400).json({
          success: false,
          message: "Email not verified yet"
        });
      }
    }

    // Set expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

    membership.status = "Active";
    membership.expiryDate = expiryDate;
    membership.lastPaymentDate = new Date();
    await membership.save();

    // Send membership approval email
    const emailSent = await sendMembershipApprovalEmail(user.email, user.fullName, expiryDate);

    res.status(200).json({
      success: true,
      message: "Membership approved",
      membership,
      emailSent
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to approve membership",
      error: err.message
    });
  }
};

// Admin: Reject membership
exports.rejectMembership = async (req, res) => {
  try {
    // Ensure user is admin
    if (req.user.role !== "admin" && req.user.role !== "super-admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only."
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found"
      });
    }

    // Get user details
    const user = await User.findById(membership.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    membership.status = "Rejected";
    membership.rejectionReason = reason || "No specific reason provided";
    await membership.save();

    // Send membership rejection email with proper error handling
    const emailSent = await sendMembershipRejectionEmail(
      user.email, 
      user.fullName, 
      membership.rejectionReason
    );

    res.status(200).json({
      success: true,
      message: "Membership rejected",
      membership,
      emailSent
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to reject membership",
      error: err.message
    });
  }
};
