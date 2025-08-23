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
