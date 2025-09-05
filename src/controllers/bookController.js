
const mongoose = require("mongoose");
const Book = require("../models/book");


// Get all books
async function getBooks(req, res) {
  try {
    const books = await Book.find()
      .populate({
        path: "comments.user",
        select: " fullName email"
      })
      .populate({
        path: "ratings.user",
        select: " fullName email"
      });
    res.json({ 
      success: true,
      data: books 
    });
  } catch (err) {
    console.error("Error getting books:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to retrieve books", 
      error: err.message 
    });
  }
}

// Get book by ID with populated comments and ratings
async function getBookById(req, res) {
  try {
    if (!req.params.id) {
      return res.status(400).json({ 
        success: false, 
        message: "Book ID is required" 
      });
    }

    const book = await Book.findById(req.params.id)
      .populate({
        path: "comments.user",
        select: "fullName email"
      })
      .populate({
        path: "ratings.user",
        select: "fullName email"
      });

    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: "Book not found" 
      });
    }

    res.json({
      success: true,
      data: book
    });
  } catch (err) {
    console.error("Error getting book by ID:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to retrieve book", 
      error: err.message 
    });
  }
}

// Add a new book
async function addBook(req, res) {
  try {
    // Validate required fields
    const { title, author } = req.body;
    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: "Title and author are required"
      });
    }

    // Always start with empty comments and ratings arrays
    const bookData = { ...req.body, comments: [], ratings: [] };
    const book = new Book(bookData);
    await book.save();
    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: book
    });
  } catch (err) {
    console.error("Error adding book:", err);
    res.status(400).json({
      success: false,
      message: "Failed to add book", 
      error: err.message
    });
  }
}

// Update a book
async function updateBook(req, res) {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required"
      });
    }

    const bookExists = await Book.findById(req.params.id);
    if (!bookExists) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: "Book updated successfully",
      data: book
    });
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(400).json({
      success: false,
      message: "Failed to update book", 
      error: err.message
    });
  }
}

// Delete a book
async function deleteBook(req, res) {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required"
      });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    await Book.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: "Book deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete book", 
      error: err.message
    });
  }
}

// Recently books
async function getRecentBooks(req, res) {
  try {
    const books = await Book.find()
      .sort({ createdAt: -1 })
      .limit(15)
      .populate({
        path: "comments.user",
        select: "fullName email"
      })
      .populate({
        path: "ratings.user",
        select: "fullName email"
      });
    res.json({
      success: true,
      data: books
    });
  } catch (err) {
    console.error("Error getting recent books:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve recent books",
      error: err.message
    });
  }
}

// Recomended books
async function getRecomendedBooks(req, res) {
  try {
    const books = await Book.aggregate([
      {
        $addFields: {
          averageRating: { $avg: "$ratings.value" }
        }
      },
      { $sort: { averageRating: -1}},
      {$limit:15}
    ]);
    res.json({
      success: true,
      data: books
    });
  } catch (err) {
    console.err("Error getting recommended books:", err)
    res.status(500).json({
      success: false,
      message: "Failed to relative recommended books",
      error: err.message
    });
  }
}

// Rate a book
async function rateBook(req, res) {
  try {
    const { bookId, value } = req.body;
    const userId = req.user && req.user.id;
    console.log('rateBook userId:', userId);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // Input validation
    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required"
      });
    }
    
    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: "Rating value is required"
      });
    }
    
    // Rating range validation
    if (value < 1 || value > 5) {
      return res.status(400).json({ 
        success: false,
        message: "Rating must be between 1 and 5" 
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: "Book not found" 
      });
    }

    // Update or create rating
    const existing = Array.isArray(book.ratings) ? book.ratings.find(
      (r) => r.user && r.user.toString() === userId
    ) : null;

    if (existing) {
      existing.value = value;
    } else {
      book.ratings.push({ user: new mongoose.Types.ObjectId(userId), value });
    }

    await book.save();

    const populatedBook = await Book.findById(bookId)
      .populate("ratings.user", "fullName")
      .populate("comments.user", "fullName");

    res.json({
      success: true,
      message: "Book rated successfully",
      data: {
        averageRating: populatedBook.averageRating,
        ratingsCount: populatedBook.ratings.length,
        ratings: populatedBook.ratings
      }
    });
  } catch (err) {
    console.error("Error rating book:", err);
    res.status(500).json({
      success: false,
      message: "Failed to rate book", 
      error: err.message
    });
  }
}

// Add a comment
async function addComment(req, res) {
  try {
    const { bookId, text } = req.body;
    const userId = req.user && req.user.id;
    console.log('addComment userId:', userId);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // Input validation
    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required"
      });
    }
    
    if (!text || text.trim() === "") {
      return res.status(400).json({ 
        success: false,
        message: "Comment cannot be empty" 
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: "Book not found" 
      });
    }

    book.comments.push({ user: new mongoose.Types.ObjectId(userId), text: text.trim() });
    await book.save();

    const populatedBook = await Book.findById(bookId)
      .populate("comments.user", "fullName")
      .populate("ratings.user", "fullName");

    res.json({
      success: true,
      message: "Comment added successfully",
      data: populatedBook
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add comment", 
      error: err.message
    });
  }
}

// Edit comment
async function editComment(req,res) {
  try {
    const {commentId, text } = req.body;
    const userId = req.user.id;

    if (!commentId || !text) {
      return res.status(400).json({ success: false, message: "Comment ID and text are required"});
    }

    const book = await Book.findOne({"comments._id": commentId});
    if (!book) return res.status(404).json({ success: false, message: "Comment not found"});

    const comment = book.comments.id(commentId);
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this comment"});
    }

    comment.text = text;
    await book.save();

    const populatedBook = await Book.findById(book._id).populate("comments.user", "fullName");
    res.json({ success: true, message:"Comment updated", data: populatedBook});
  } catch (err) {
    res.status(500).json({ success:false, message: "Failed to edit comment", error: err.message});
  }
}

// Delete comment
async function deleteComment(req, res) {
  try {
    const { commentId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!commentId) return res.status(400).json({ success: false, message: "Comment Id is required" });

    const book = await Book.findOne({ "comments._id": commentId });
    if (!book) return res.status(404).json({ success: false, message: "Comment not found" });

    const comment = book.comments.id(commentId);

    // Only author or admin can delete
    if (comment.user.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this comment" });
    }

    // Remove comment safely
    book.comments = book.comments.filter(c => c._id.toString() !== commentId);
    await book.save();

    const populatedBook = await Book.findById(book._id).populate("comments.user", "fullName email");
    res.json({ success: true, message: "Comment deleted", data: populatedBook });

  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete comment", error: err.message });
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
  editComment,
  deleteComment,
  getRecentBooks,
  getRecomendedBooks,
};
