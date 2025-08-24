

// routes/borrowRoutes.js
const express = require("express");
const router = express.Router();
const { borrowBook, returnBook } = require("../controllers/borrowController");


// Borrow a book
router.post("/", borrowBook);

// Return a book

router.put("/return/:id", returnBook); // :id = borrow record ID



module.exports = router;
