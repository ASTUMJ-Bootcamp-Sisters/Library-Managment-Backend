
const Borrow = require("../models/Borrow");
const Book = require("../models/book");

// Borrow a book
const borrowBook = async (req, res) => {
  try {
    const { student, book, dueDate } = req.body;

    // Decrease availability when borrowing
    const foundBook = await Book.findById(book);
    if (!foundBook || foundBook.available <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    foundBook.available -= 1;
    await foundBook.save();

    const newBorrow = new Borrow({ student, book, dueDate, status: "Borrowed" });
    const savedBorrow = await newBorrow.save();

    res.status(201).json({ message: "Book borrowed successfully", borrow: savedBorrow });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Return a book
const returnBook = async (req, res) => {
  try {
    const borrowId = req.params.id;
    const borrow = await Borrow.findById(borrowId).populate("book");

    if (!borrow) return res.status(404).json({ message: "Borrow record not found" });
    if (borrow.status === "Returned" || borrow.status === "Overdue") {
      return res.status(400).json({ message: "Book already returned" });
    }

    borrow.returnDate = new Date();

    // Overdue check
    if (borrow.returnDate > borrow.dueDate) {
      borrow.status = "Overdue";
    } else {
      borrow.status = "Returned";
    }

    // Increase availability when returned
    await Book.findByIdAndUpdate(borrow.book._id, { $inc: { available: 1 } });

    await borrow.save();

    res.json({ message: "Book returned successfully", borrow });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { borrowBook, returnBook };
=======
// controllers/borrowController.js
const Book = require("../models/Book");
const Borrow = require("../models/Borrow");

// Borrow a book
async function borrowBook(req, res) {
  try {
    const { bookId, duration } = req.body; // duration instead of dueDate
    const studentId = req.user.id; // assume user is authenticated

    // 1. Find the book
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ error: "Book not found" });

    // 2. Check availability
    if (book.available <= 0) {
      return res.status(400).json({ error: "No available copies" });
    }

    // 3. Calculate dueDate based on duration
    const dueDate = new Date();
    if (duration === "1w") dueDate.setDate(dueDate.getDate() + 7);
    else if (duration === "1m") dueDate.setMonth(dueDate.getMonth() + 1);
    else if (duration === "2m") dueDate.setMonth(dueDate.getMonth() + 2);
    else if (duration === "6m") dueDate.setMonth(dueDate.getMonth() + 6);
    else return res.status(400).json({ error: "Invalid duration option" });

    // 4. Create borrow record
    const borrow = new Borrow({
      student: studentId,
      book: bookId,
      dueDate,
    });
    await borrow.save();

    // 5. Decrease available count
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
    const studentId = req.user.id; // assume user is authenticated

    // 1. Find the borrow record
    const borrow = await Borrow.findOne({ _id: borrowId, student: studentId });
    if (!borrow) return res.status(404).json({ error: "Borrow record not found" });

    // 2. Check if already returned
    if (borrow.status === "Returned") {
      return res.status(400).json({ error: "Book already returned" });
    }

    // 3. Update borrow record
    borrow.returnDate = new Date();
    borrow.status = "Returned";
    await borrow.save();

    // 4. Increase book availability
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

module.exports = {
  borrowBook,
  returnBook,
};
