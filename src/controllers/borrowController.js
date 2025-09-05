// Get all pending borrow requests (for admin)
const getPendingBorrows = async (req, res) => {
  try {
    const pendingBorrows = await Borrow.find({ status: "Pending" })
      .populate("book", "title author image")
      .populate("student", "fullName email");
    res.json({ success: true, data: pendingBorrows });
  } catch (error) {
    console.error("Error in getPendingBorrows:", error);
    res.status(500).json({ success: false, message: "Failed to fetch pending borrows", error: error.message });
  }
};

// Get borrow history for a student (user)
const getStudentBorrowHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const history = await Borrow.find({ student: studentId })
      .populate("book", "title author image")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: history });
  } catch (error) {
    console.error("Error in getStudentBorrowHistory:", error);
    res.status(500).json({ success: false, message: "Failed to fetch borrow history", error: error.message });
  }
};
const Membership = require("../models/Membership");
const sendEmailNotification = require("../utils/sendEmailNotification");
const Book = require("../models/book");
const Borrow = require("../models/Borrow");
const Settings = require("../models/Settings");

// Borrow a book
async function borrowBook(req, res) {
  try {
    const { bookId, duration, note } = req.body;
    const user = req.user.id;
    const files = req.files || {};
    const idCardImage = files.idCardImage ? files.idCardImage[0].path : null;
    const paymentImage = files.paymentImage ? files.paymentImage[0].path : null;

    // Validate input
    if (!bookId) {
      return res.status(400).json({ success: false, message: "Book ID is required" });
    }
    if (!duration) {
      return res.status(400).json({ success: false, message: "Duration is required" });
    }

    // Calculate due date
    let dueDate = new Date();
    if (duration === "1w") dueDate.setDate(dueDate.getDate() + 7);
    else if (duration === "2w") dueDate.setDate(dueDate.getDate() + 14);
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid duration format. Must be '1w' or '2w'"
      });
    }

    // Check membership status
    const membership = await Membership.findOne({ user });
    const isMember = membership && membership.status === "Active" && new Date() < membership.expiryDate;

    // Check if book exists
    const foundBook = await Book.findById(bookId);
    if (!foundBook) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    // Prevent duplicate borrow requests for the same book
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

    // Enforce borrow limit: max 3 books
    const activeBorrowsCount = await Borrow.countDocuments({
      student: user,
      status: { $in: ["Pending", "Borrowed"] }
    });
    if (activeBorrowsCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "You cannot borrow more than 3 books at the same time"
      });
    }

    // Non-member requirements
    if (!isMember) {
      if (!idCardImage) {
        return res.status(400).json({ success: false, message: "Upload an ID card image" });
      }
      if (!paymentImage) {
        return res.status(400).json({ success: false, message: "Upload a payment screenshot" });
      }
    }

    // Create borrow record
    const newBorrow = new Borrow({
      student: user,
      book: bookId,
      dueDate,
      status: isMember ? "Borrowed" : "Pending",
      idCardImage: !isMember ? idCardImage : undefined,
      paymentImage: !isMember ? paymentImage : undefined,
      note
    });
    const savedBorrow = await newBorrow.save();

    res.status(isMember ? 200 : 202).json({
      success: true,
      message: isMember
        ? "Book borrowed successfully"
        : "Borrow request sent to admin for approval",
      data: savedBorrow,
      isMember
    });
  } catch (error) {
    console.error("Error in borrowBook:", error);
    res.status(500).json({ success: false, message: "Failed to borrow book", error: error.message });
  }
}

// Admin approves a borrow request
const approveBorrow = async (req, res) => {
  try {
    const borrowId = req.params.id;
    if (!borrowId) return res.status(400).json({ success: false, message: "Borrow ID is required" });

    const borrow = await Borrow.findById(borrowId).populate("book").populate("student", "fullName email");
    if (!borrow) return res.status(404).json({ success: false, message: "Borrow record not found" });
    if (borrow.status !== "Pending") return res.status(400).json({ success: false, message: "Borrow request is not pending" });
    if (!borrow.book || borrow.book.available <= 0) return res.status(400).json({ success: false, message: "Book not available" });

    borrow.status = "Borrowed";
    borrow.borrowDate = new Date();

    await Book.findByIdAndUpdate(borrow.book._id, { $inc: { available: -1 } });

    // Apply settings for due date
    const settings = await Settings.findOne();
    if (settings && settings.borrowDurationDays) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + settings.borrowDurationDays);
      borrow.dueDate = dueDate;
    }

    await borrow.save();

    // Email notification
    if (borrow.student?.email) {
      const emailContent = `
        <h2>Book Borrowing Approved</h2>
        <p>Dear ${borrow.student.fullName},</p>
        <p>Your request to borrow <strong>${borrow.book.title}</strong> has been approved.</p>
        <ul>
          <li>Book: ${borrow.book.title}</li>
          <li>Author: ${borrow.book.author}</li>
          <li>Borrow Date: ${new Date().toDateString()}</li>
          <li>Due Date: ${new Date(borrow.dueDate).toDateString()}</li>
        </ul>
      `;
      await sendEmailNotification(
        borrow.student.email,
        "Book Borrowing Request Approved - ASTUMSJ Library",
        emailContent
      );
    }

    res.json({ success: true, message: "Borrow request approved", data: borrow });
  } catch (error) {
    console.error("Error in approveBorrow:", error);
    res.status(500).json({ success: false, message: "Failed to approve borrow request", error: error.message });
  }
};

// Admin rejects a borrow request
const rejectBorrow = async (req, res) => {
  try {
    const borrowId = req.params.id;
    if (!borrowId) return res.status(400).json({ success: false, message: "Borrow ID is required" });

    const borrow = await Borrow.findById(borrowId);
    if (!borrow) return res.status(404).json({ success: false, message: "Borrow record not found" });
    if (borrow.status !== "Pending") return res.status(400).json({ success: false, message: "Request is not pending" });

    borrow.status = "Rejected";
    await borrow.save();

    res.json({ success: true, message: "Borrow request rejected" });
  } catch (error) {
    console.error("Error in rejectBorrow:", error);
    res.status(500).json({ success: false, message: "Failed to reject borrow", error: error.message });
  }
};

// Return a book
async function returnBook(req, res) {
  try {
    const { borrowId } = req.body;
    const user = req.user.id;

    if (!borrowId) return res.status(400).json({ success: false, message: "Borrow ID is required" });

    const borrow = await Borrow.findOne({ _id: borrowId, student: user }).populate("book");
    if (!borrow) return res.status(404).json({ success: false, message: "Borrow record not found" });

    if (borrow.status !== "Borrowed") {
      return res.status(400).json({ success: false, message: `Cannot return book with status: ${borrow.status}` });
    }

    borrow.returnDate = new Date();
    borrow.status = borrow.returnDate > borrow.dueDate ? "Overdue" : "Returned";

    if (borrow.status === "Overdue") {
      const diffTime = borrow.returnDate - borrow.dueDate;
      borrow.lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    await Book.findByIdAndUpdate(borrow.book._id, { $inc: { available: 1 } });

    const settings = await Settings.findOne();
    if (borrow.status === "Overdue" && settings?.lateFeePerDay > 0) {
      borrow.fine = borrow.lateDays * settings.lateFeePerDay;
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
    res.status(500).json({ success: false, message: "Failed to return book", error: error.message });
  }
}

// Admin borrow history
const getAdminBorrowHistory = async (req, res) => {
  try {
    const { bookId, studentId, startDate, endDate } = req.query;
    const query = {};
    if (bookId) query.book = bookId;
    if (studentId) query.student = studentId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const borrowHistory = await Borrow.find(query)
      .populate("book", "title author image")
      .populate("student", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: borrowHistory });
  } catch (error) {
    console.error("Error in getAdminBorrowHistory:", error);
    res.status(500).json({ success: false, message: "Failed to fetch borrow history", error: error.message });
  }
};

module.exports = {
  borrowBook,
  returnBook,
  approveBorrow,
  rejectBorrow,
  getPendingBorrows,
  getStudentBorrowHistory,
  getAdminBorrowHistory
};
