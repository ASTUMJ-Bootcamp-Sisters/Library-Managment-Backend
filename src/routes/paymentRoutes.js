// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { submitPayment, getAllPayments, updatePaymentStatus } = require("../controllers/paymentController");
const { authenticate } = require("../middleware/authenticate");
const multer = require("multer");

// Upload setup
const upload = multer({ dest: "uploads/" });

// Student submits payment
router.post("/", authenticate, upload.single("screenshot"), submitPayment);

// Admin views all
router.get("/", authenticate, getAllPayments);

// Admin approves/rejects
router.put("/:id", authenticate, updatePaymentStatus);

module.exports = router;
