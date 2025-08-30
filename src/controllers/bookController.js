const Book = require("../models/Book");

// Get all books
async function getBooks(req, res) {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get book by ID
async function getBookById(req, res) {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Add a single book
async function addBook(req, res) {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Add multiple books at once
async function addMultipleBooks(req, res) {
  try {
    const books = req.body; // expect an array of book objects
    const savedBooks = await Book.insertMany(books);
    res.status(201).json(savedBooks);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Update a book
async function updateBook(req, res) {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Delete a book
async function deleteBook(req, res) {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getBooks,
  getBookById,
  addBook,
  addMultipleBooks,
  updateBook,
  deleteBook,
};
