const express = require("express");
const {
  createBookReview,
  getBookReviews,
  deleteBookReview,
} = require("../controllers/bookReviewController");

const router = express.Router();

router.post("/", createBookReview);   // ➕ Add new
router.get("/", getBookReviews);      // 📚 Get all
router.delete("/:id", deleteBookReview); // 🗑 Delete

module.exports = router;
