const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

// User submits feedback (token optional)
router.post("/", feedbackController.submitFeedback);

// Admin views all feedback
router.get("/", authenticate, authorizeRoles("admin"), feedbackController.getAllFeedback);

module.exports = router;
