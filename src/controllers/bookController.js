const Book = require ("../models/Book");


async function getBooks(req,res) {
    try {
        const books = await  Book.find();
        res.json (books);
    } catch (err) {
        res.status(500).json({error:err.message});
    }
}

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
async function updateBook(req,res) {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(book);
    } catch (err) {
        res.status(400).json({ error: err.message});
    }

}

// delete book
async function deleteBook(req, res) {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.json({message: "Book deleted successfully"});
    } catch (err) {
        res.status(500).json({ error: err.message});
    }  
}

module.exports = {
    getBooks,
    getBookById,
    addBook,
    updateBook,
    deleteBook,
};