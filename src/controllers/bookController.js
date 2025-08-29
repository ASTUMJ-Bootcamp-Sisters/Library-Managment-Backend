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

// Get book by ID with populated comments and ratings
async function getBookById(req, res) {
  try {
    const book = await Book.findById(req.params.id)
      .populate("comments.user", "fullName")
      .populate("ratings.user", "fullName");

    if (!book) return res.status(404).json({ error: "Book not found" });

    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Add a new book
async function addBook(req, res) {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Update a book
async function updateBook(req, res) {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Delete a book
async function deleteBook(req, res) {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Rate a book
async function rateBook(req, res) {
  try {
    const { bookId, userId, value } = req.body;

    if (value < 1 || value > 5)
      return res.status(400).json({ error: "Rating must be 1-5" });

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const existing = book.ratings.find(
      (r) => r.user.toString() === userId
    );

    if (existing) {
      existing.value = value;
    } else {
      book.ratings.push({ user: userId, value });
    }

    await book.save();

    // Populate user info
    const populatedBook = await Book.findById(bookId)
      .populate("ratings.user", "fullName")
      .populate("comments.user", "fullName");

    res.json({
      averageRating: populatedBook.averageRating,
      ratingsCount: populatedBook.ratings.length,
      ratings: populatedBook.ratings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Add a comment
async function addComment(req, res) {
  try {
    const { bookId, userId, text } = req.body;

    if (!text || text.trim() === "")
      return res.status(400).json({ error: "Comment cannot be empty" });

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ error: "Book not found" });

    book.comments.push({ user: userId, text });
    await book.save();

    const populatedBook = await Book.findById(bookId)
      .populate("comments.user", "fullName")
      .populate("ratings.user", "fullName");

    res.json(populatedBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  rateBook,
  addComment,
};
