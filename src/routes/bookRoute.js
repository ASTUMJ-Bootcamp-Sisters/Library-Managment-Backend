const express = require("express");
const {
  getBooks,
  getBookById,
  addBook,
  addMultipleBooks, // add this
  updateBook,
  deleteBook
} = require("../controllers/bookController");

const router = express.Router();

// Routes
router.get("/", getBooks);
router.get("/:id", getBookById);
router.post("/", addBook);
router.post("/multiple", addMultipleBooks); // new route for multiple books
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);

module.exports = router;
