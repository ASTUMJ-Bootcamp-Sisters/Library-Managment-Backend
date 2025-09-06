const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

// User submits feedback
router.post("/", authenticate, feedbackController.submitFeedback);

// Admin views all feedback
router.get("/", authenticate, authorizeRoles("admin"), feedbackController.getAllFeedback);

module.exports = router;
