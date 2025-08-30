const Book = require("../models/Book");
const Borrow = require("../models/Borrow");

// Borrow a book (creates a pending request)
const borrowBook = async (req, res) => {
  try {
    const { bookId, duration } = req.body;
    const user = req.user.id;

    let dueDate = new Date();
    if (duration === "1w") dueDate.setDate(dueDate.getDate() + 7);
    else if (duration === "2w") dueDate.setDate(dueDate.getDate() + 14);
    else return res.status(400).json({ message: "Invalid duration format" });

    const foundBook = await Book.findById(bookId);
    if (!foundBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    const newBorrow = new Borrow({
      student: user,
      book: bookId,
      dueDate,
      status: "Pending", // Default status is now Pending
    });
    const savedBorrow = await newBorrow.save();

    res.status(202).json({
      message: "Book borrowing request sent to admin for approval",
      borrow: savedBorrow,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin approves a borrow request
const approveBorrow = async (req, res) => {
  try {
    const borrowId = req.params.id;
    const borrow = await Borrow.findById(borrowId).populate("book");

    if (!borrow) {
      return res.status(404).json({ message: "Borrow record not found" });
    }
    if (borrow.status !== "Pending") {
      return res.status(400).json({ message: "Borrow request is not pending" });
    }
    if (borrow.book.available <= 0) {
      return res.status(400).json({ message: "Book is not available" });
    }

    // Update status and decrement available count
    borrow.status = "Borrowed";
    await Book.findByIdAndUpdate(borrow.book._id, { $inc: { available: -1 } });
    await borrow.save();

    res.json({ message: "Borrow request approved successfully", borrow });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin rejects a borrow request
const rejectBorrow = async (req, res) => {
  try {
    const borrowId = req.params.id;
    const borrow = await Borrow.findById(borrowId);

    if (!borrow) {
      return res.status(404).json({ message: "Borrow record not found" });
    }
    if (borrow.status !== "Pending") {
      return res.status(400).json({ message: "Borrow request is not pending" });
    }

    await Borrow.findByIdAndDelete(borrowId);

    res.json({ message: "Borrow request rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Return a book
const returnBook = async (req, res) => {
  try {
    const borrowId = req.body.borrowId;
    const user = req.user.id; // User from authenticated token

    const borrow = await Borrow.findById(borrowId).populate("book");

    if (!borrow)
      return res.status(404).json({ message: "Borrow record not found" });

    // Validate that the authenticated user is the student who borrowed the book
    if (borrow.student.toString() !== user) {
        return res.status(403).json({ message: "Not authorized to return this book" });
    }

    if (borrow.status === "Returned" || borrow.status === "Overdue") {
      return res.status(400).json({ message: "Book already returned" });
    }

    borrow.returnDate = new Date();

    borrow.status = borrow.returnDate > borrow.dueDate ? "Overdue" : "Returned";

    await Book.findByIdAndUpdate(borrow.book._id, { $inc: { available: 1 } });

    await borrow.save();

    res.json({ message: "Book returned successfully", borrow });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get all pending borrow requests for admin view
const getPendingBorrows = async (req, res) => {
  try {
    const pendingBorrows = await Borrow.find({ status: "Pending" })
      .populate("book", "title author image available")
      .populate("student", "fullName email");


    res.json(Array.isArray(pendingBorrows) ? pendingBorrows : []);
  } catch (error) {
    console.error("Error in getPendingBorrows:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = {
  borrowBook,
  returnBook,
  approveBorrow,
  rejectBorrow,
  getPendingBorrows,
};