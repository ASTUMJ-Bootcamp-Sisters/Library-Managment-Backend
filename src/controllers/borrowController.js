const Book = require("../models/book");
const Borrow = require("../models/Borrow");

// Borrow a book (creates a pending request)
const borrowBook = async (req, res) => {
  try {
    const { bookId, duration } = req.body;
    const user = req.user.id;

    // Validate input
    if (!bookId) {
      return res.status(400).json({ 
        success: false,
        message: "Book ID is required" 
      });
    }

    if (!duration) {
      return res.status(400).json({ 
        success: false,
        message: "Duration is required" 
      });
    }

    // Calculate due date based on duration
    let dueDate = new Date();
    if (duration === "1w") dueDate.setDate(dueDate.getDate() + 7);
    else if (duration === "2w") dueDate.setDate(dueDate.getDate() + 14);
    else {
      return res.status(400).json({ 
        success: false,
        message: "Invalid duration format. Must be '1w' or '2w'" 
      });
    }

    // Check if book exists
    const foundBook = await Book.findById(bookId);
    if (!foundBook) {
      return res.status(404).json({ 
        success: false,
        message: "Book not found" 
      });
    }


    // Check if user already has a pending or borrowed request for this book
    const existingBorrow = await Borrow.findOne({
      student: user,
      book: bookId,
      status: { $in: ["Pending", "Borrowed"] }
    });
    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: existingBorrow.status === "Pending" 
          ? "You already have a pending request for this book" 
          : "You are already borrowing this book"
      });
    }

    // Enforce borrow limit: max 3 books at the same time
    const activeBorrowsCount = await Borrow.countDocuments({
      student: user,
      status: { $in: ["Pending", "Borrowed"] }
    });
    if (activeBorrowsCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "You cannot borrow more than 3 books at the same time. Please return a book before borrowing another."
      });
    }

    const newBorrow = new Borrow({
      student: user,
      book: bookId,
      dueDate,
      status: "Pending", // Default status is now Pending
    });
    const savedBorrow = await newBorrow.save();

    res.status(202).json({
      success: true,
      message: "Book borrowing request sent to admin for approval",
      data: savedBorrow,
    });
  } catch (error) {
    console.error("Error in borrowBook:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to process borrowing request", 
      error: error.message 
    });
  }
};

// Admin approves a borrow request
const approveBorrow = async (req, res) => {
  try {
    const borrowId = req.params.id;
    
    // Validate borrowId
    if (!borrowId) {
      return res.status(400).json({
        success: false,
        message: "Borrow ID is required"
      });
    }

    const borrow = await Borrow.findById(borrowId).populate("book").populate("student", "fullName email");

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: "Borrow record not found"
      });
    }
    
    if (borrow.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Borrow request is not pending"
      });
    }
    
    if (!borrow.book || borrow.book.available <= 0) {
      return res.status(400).json({
        success: false,
        message: "Book is not available"
      });
    }

    // Update status and decrement available count
    borrow.status = "Borrowed";
    borrow.borrowDate = new Date(); // Set the actual borrow date
    
    await Book.findByIdAndUpdate(borrow.book._id, { 
      $inc: { available: -1 } 
    });
    
    await borrow.save();

    res.json({
      success: true,
      message: "Borrow request approved successfully",
      data: borrow
    });
  } catch (error) {
    console.error("Error in approveBorrow:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve borrow request",
      error: error.message
    });
  }
};

// Admin rejects a borrow request
const rejectBorrow = async (req, res) => {
  try {
    const borrowId = req.params.id;
    
    // Validate borrowId
    if (!borrowId) {
      return res.status(400).json({
        success: false,
        message: "Borrow ID is required"
      });
    }

    const borrow = await Borrow.findById(borrowId);

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: "Borrow record not found"
      });
    }
    
    if (borrow.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Borrow request is not pending"
      });
    }

    // Instead of deleting, update status to Rejected
    borrow.status = "Rejected";
    await borrow.save();

    res.json({
      success: true,
      message: "Borrow request rejected successfully"
    });
  } catch (error) {
    console.error("Error in rejectBorrow:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject borrow request",
      error: error.message
    });
  }
};

// Return a book
const returnBook = async (req, res) => {
  try {
    const { borrowId } = req.body;
    const user = req.user.id; // User from authenticated token

    // Validate borrowId
    if (!borrowId) {
      return res.status(400).json({
        success: false,
        message: "Borrow ID is required"
      });
    }

    const borrow = await Borrow.findById(borrowId).populate("book");

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: "Borrow record not found"
      });
    }

    // Validate that the authenticated user is the student who borrowed the book
    if (borrow.student.toString() !== user) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to return this book"
      });
    }

    if (borrow.status === "Returned" || borrow.status === "Overdue") {
      return res.status(400).json({
        success: false,
        message: "Book already returned"
      });
    }

    // Validate that the book was actually borrowed
    if (borrow.status !== "Borrowed") {
      return res.status(400).json({
        success: false,
        message: `Cannot return a book with status: ${borrow.status}`
      });
    }

    borrow.returnDate = new Date();

    // Calculate if the book is overdue
    borrow.status = borrow.returnDate > borrow.dueDate ? "Overdue" : "Returned";
    
    // Calculate late days if overdue
    if (borrow.status === "Overdue") {
      const diffTime = Math.abs(borrow.returnDate - borrow.dueDate);
      borrow.lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Increment available count for the book
    const bookUpdateResult = await Book.findByIdAndUpdate(
      borrow.book._id, 
      { $inc: { available: 1 } },
      { new: true }
    );
    
    if (!bookUpdateResult) {
      return res.status(500).json({
        success: false,
        message: "Failed to update book availability"
      });
    }

    await borrow.save();

    res.json({
      success: true,
      message: borrow.status === "Overdue" 
        ? `Book returned ${borrow.lateDays} days late` 
        : "Book returned successfully",
      data: borrow
    });
  } catch (error) {
    console.error("Error in returnBook:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process book return",
      error: error.message
    });
  }
};


// Get all pending borrow requests for admin view
const getPendingBorrows = async (req, res) => {
  try {
    const pendingBorrows = await Borrow.find({ status: "Pending" })
      .populate("book", "title author image available")
      .populate("student", "fullName email")
      .sort({ createdAt: -1 }); // Sort by newest requests first

    res.json({
      success: true,
      data: Array.isArray(pendingBorrows) ? pendingBorrows : []
    });
  } catch (error) {
    console.error("Error in getPendingBorrows:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending borrow requests",
      error: error.message
    });
  }
};

// Get borrow history for a student (their own records)
const getStudentBorrowHistory = async (req, res) => {
  try {
    const studentId = req.user.id; // Get student ID from authenticated user token
    
    // Optional status filter
    const { status } = req.query;
    let query = { student: studentId };
    
    if (status && ["Pending", "Borrowed", "Returned", "Overdue", "Rejected"].includes(status)) {
      query.status = status;
    }
    
    const borrowHistory = await Borrow.find(query)
      .populate("book", "title author image")
      .sort({ createdAt: -1 }); // Sort by most recent first
    
    res.json({
      success: true,
      data: borrowHistory
    });
  } catch (error) {
    console.error("Error in getStudentBorrowHistory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch borrow history",
      error: error.message
    });
  }
};

// Admin: Get borrow history for all users or for a specific user
const getAdminBorrowHistory = async (req, res) => {
  try {
    const { studentId, status, bookId, startDate, endDate } = req.query;
    let query = {};
    
    // Apply filters if provided
    if (studentId) {
      query.student = studentId;
    }
    
    if (status && ["Pending", "Borrowed", "Returned", "Overdue", "Rejected"].includes(status)) {
      query.status = status;
    }
    
    if (bookId) {
      query.book = bookId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const borrowHistory = await Borrow.find(query)
      .populate("book", "title author image")
      .populate("student", "fullName email")
      .sort({ createdAt: -1 }); // Sort by most recent first
    
    res.json({
      success: true,
      data: borrowHistory
    });
  } catch (error) {
    console.error("Error in getAdminBorrowHistory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch borrow history",
      error: error.message
    });
  }
};

module.exports = {
  borrowBook,
  returnBook,
  approveBorrow,
  rejectBorrow,
  getPendingBorrows,
  getStudentBorrowHistory,
  getAdminBorrowHistory,
};