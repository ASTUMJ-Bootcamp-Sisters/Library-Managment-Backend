import Book from "../models/Book";

// get all books
async function getBooks(req,res) {
    try {
        const books = await  Book.find();
        res.json (books);
    } catch (err) {
        res.status(500).json({error:err.message});
    }
}

// get by id
async function getBookById(req,res) {
    try {
        const book = await Book.findById(req.params.id);
        if(!book) return res.status(404).json({ error: "Book not found"});
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: err.message});
    }
}

// creat or add book
async function addBook(req,res) {
    try {
        const book = new Book(req.body);
        await book.save();
        res.status(201).json(book);
    } catch (err) {
        res.status(400).json({ error: err.message});    
    }
}

// update or edit
