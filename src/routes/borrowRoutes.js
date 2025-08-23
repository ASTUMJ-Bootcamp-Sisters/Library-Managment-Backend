// routes/borrowRoutes.js
const express = require("express");
const router = express.Router();
const { borrowBook, returnBook } = require("../controllers/borrowController");

// Borrow a book
router.post("/", borrowBook);

// Return a book
router.post("/return", returnBook);

module.exports = router;
