const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();



public_users.post("/register", (req, res) => {
    
    const username = req.body.username || req.query.username; 
    const password = req.body.password || req.query.password; 

    // Validación 1: Verificar que se proporcionen credenciales
    if (!username || !password) {
        // Mantenemos el status 404 que usaste antes
        return res.status(404).json({ message: "Debe proporcionar username y password." });
    }

    // Validación 2: Verificar si el usuario ya existe
    if (isValid(username)) {
        return res.status(404).json({ message: "El username ya existe." });
    }

    // Registro Exitoso: Añadir a la base de datos de usuarios
    users.push({ "username": username, "password": password });
    return res.status(201).json({ message: "Usuario registrado exitosamente." });
});

const getBookData = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(books); 
        }, 1000);
    });
};

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
    try {
        const allBooks = await getBookData();
        return res.status(200).send(JSON.stringify(allBooks, null, 4));
    } catch (error) {
        return res.status(500).send("Error al recuperar la lista de libros.");
    }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
    const isbn = req.params.isbn; 
    try {
        const allBooks = await getBookData();
        if (allBooks[isbn]) {
            return res.status(200).json(allBooks[isbn]);
        } else {
            return res.status(404).json({ message: "Libro no encontrado con ISBN: " + isbn });
        }
    } catch (error) {
        return res.status(500).send("Error al buscar el libro por ISBN.");
    }
});
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
    const authorParam = req.params.author;
    const matchingBooks = [];

    try {
        const allBooks = await getBookData();
        const bookKeys = Object.keys(allBooks);
        for (const isbn of bookKeys) {
            const book = allBooks[isbn];
            if (book.author.toLowerCase() === authorParam.toLowerCase()) {
                matchingBooks.push(book);
            }
        }
        if (matchingBooks.length > 0) {
            return res.status(200).json(matchingBooks);
        } else {
            return res.status(404).json({ message: "No se encontraron libros del autor: " + authorParam });
        }
    } catch (error) {
        return res.status(500).send("Error al buscar libros por autor.");
    }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
    const titleParam = req.params.title;
    const matchingBooks = [];

    try {
        const allBooks = await getBookData();
        const bookKeys = Object.keys(allBooks);
        for (const isbn of bookKeys) {
            const book = allBooks[isbn];
            if (book.title.toLowerCase() === titleParam.toLowerCase()) {
                matchingBooks.push(book);
            }
        }
        if (matchingBooks.length > 0) {
            return res.status(200).json(matchingBooks);
        } else {
            return res.status(404).json({ message: "No se encontraron libros con el título: " + titleParam });
        }
    } catch (error) {
        return res.status(500).send("Error al buscar libros por título.");
    }
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;

    if (books[isbn] && books[isbn].reviews) {
        // Asumiendo que el objeto book contiene un campo 'reviews'
        return res.status(200).json(books[isbn].reviews);
    } else if (books[isbn]) {
        return res.status(200).json({ message: "Este libro aún no tiene reseñas." });
    } else {
        return res.status(404).json({ message: "Libro no encontrado con ISBN: " + isbn });
    }
});

module.exports.general = public_users;
