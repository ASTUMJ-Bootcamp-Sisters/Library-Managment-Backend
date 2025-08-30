// routes/borrowRoutes.js
const express = require("express");
const router = express.Router();
const { borrowBook, returnBook } = require("../controllers/borrowController");
const { authenticate } = require("../middleware/authenticate"); // ✅ import auth
const checkMembership = require("../middleware/checkMembership"); // ✅ import membership check

// Borrow a book (requires login + approved membership)
router.post("/borrow", authenticate, checkMembership, borrowBook);

// Return a book (requires login, ID comes from URL param)
router.put("/return/:id", authenticate, returnBook);

module.exports = router;
