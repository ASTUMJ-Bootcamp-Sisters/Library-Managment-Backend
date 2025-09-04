const Book = require("../models/Book");
const Borrow = require("../models/Borrow");
const Settings = require("../models/Settings");

// Borrow a book
async function borrowBook(req, res) {
  try {
    const { bookId } = req.body;
    const studentId = req.user.id;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const settings = await Settings.findOne();

    // Check pay-per-borrow
    if (!settings.payPerBorrowEnabled && req.user.role === "user") {
      return res.status(403).json({ error: "Pay-per-borrow is disabled" });
    }

    // Check max borrow limit
    const activeBorrows = await Borrow.countDocuments({
      student: studentId,
      status: "Borrowed",
    });
    if (activeBorrows >= settings.maxBorrowLimit) {
      return res
        .status(400)
        .json({
          error: `You can borrow up to ${settings.maxBorrowLimit} books.`,
        });
    }

    // Calculate due date based on settings.borrowDurationDays
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + settings.borrowDurationDays);

    const borrow = new Borrow({ student: studentId, book: bookId, dueDate });
    await borrow.save();

    book.available -= 1;
    await book.save();

    res.status(201).json({ message: "Book borrowed successfully", borrow });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Return a book
async function returnBook(req, res) {
  try {
    const { borrowId } = req.body;
    const studentId = req.user.id;

    const borrow = await Borrow.findOne({ _id: borrowId, student: studentId });
    if (!borrow)
      return res.status(404).json({ error: "Borrow record not found" });

    if (borrow.status === "Returned")
      return res.status(400).json({ error: "Book already returned" });

    borrow.returnDate = new Date();
    borrow.status = "Returned";

    const settings = await Settings.findOne();

    // Calculate late fees
    if (borrow.returnDate > borrow.dueDate && settings.lateFeePerDay > 0) {
      const diffTime = borrow.returnDate - borrow.dueDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      borrow.fine = diffDays * settings.lateFeePerDay;
    }

    await borrow.save();

    const book = await Book.findById(borrow.book);
    if (book) {
      book.available += 1;
      await book.save();
    }

    res.status(200).json({ message: "Book returned successfully", borrow });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { borrowBook, returnBook };
