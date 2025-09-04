const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { membershipRequest, verifyEmail, approveMembership, rejectMembership, getMembershipStatus, getAllMemberships, deleteMembership } = require("../controllers/membershipController");
// Admin: Delete membership
router.delete("/admin/delete/:id", authenticate, deleteMembership);
const multer = require("multer");

// Upload setup
const upload = multer({ dest: "uploads/" });

// Request membership (requires ID card and payment upload)
router.post("/request", authenticate, upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'paymentImage', maxCount: 1 }
]), membershipRequest);

// Verify email for membership
router.get("/verify-email/:token", verifyEmail);

// Get user's membership status
router.get("/status", authenticate, getMembershipStatus);

// Admin: Get all membership requests
router.get("/admin/all", authenticate, getAllMemberships);

// Admin: Approve membership
router.put("/admin/approve/:id", authenticate, approveMembership);

// Admin: Reject membership
router.put("/admin/reject/:id", authenticate, rejectMembership);

module.exports = router;
