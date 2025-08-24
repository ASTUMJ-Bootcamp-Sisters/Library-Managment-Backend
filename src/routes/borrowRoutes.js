const express = require("express");
const { borrowBook, returnBook } = require("../controllers/borrowController");

const router = express.Router();

// Borrow a book
router.post("/", borrowBook);

// Return a book
router.put("/return/:id", returnBook); // :id is the borrow record ID

module.exports = router;
