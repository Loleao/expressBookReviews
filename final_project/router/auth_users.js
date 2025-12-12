const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const SECRET_KEY_JWT = 'CLAVE_LAB_JWT_2025';

const isValid = (username) => {
    // Función simple para verificar si el nombre de usuario ya existe
    return users.some(user => user.username === username);
}

const authenticatedUser = (username, password) => {
    // Función para validar credenciales (simulada)
    return users.some(user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Error al iniciar sesión: Datos faltantes." });
    }

    if (authenticatedUser(username, password)) {
        // 1. Generar el JWT
        let accessToken = jwt.sign({ data: username }, SECRET_KEY_JWT, { expiresIn: 60 * 60 });

        // 2. Almacenar el token en la sesión
        req.session.authorization = {
            accessToken,
            username
        }
        return res.status(200).send("Login exitoso. Usuario " + username + " autenticado. Token: "+accessToken);
    } else {
        return res.status(208).json({ message: "Login fallido. Credenciales inválidas." });
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review; // Obtener la reseña del query parameter
    const username = req.session.authorization.username; // Obtener el usuario de la sesión (o de req.user si lo adjuntaste)

    if (!books[isbn]) {
        return res.status(404).json({ message: `Libro con ISBN ${isbn} no encontrado.` });
    }

    if (!review) {
        return res.status(400).json({ message: "El contenido de la reseña es obligatorio." });
    }

    // Asegurar que el campo 'reviews' existe
    if (!books[isbn].reviews) {
        books[isbn].reviews = {};
    }

    // 🎯 Lógica Upsert (Crear o Modificar)
    // Usamos el username como clave dentro del objeto de reseñas
    books[isbn].reviews[username] = review;

    return res.status(200).json({ 
        message: `La reseña del ISBN ${isbn} ha sido añadida/modificada exitosamente por ${username}.`,
        reviews: books[isbn].reviews
    });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username; // Obtener el usuario autenticado

    if (!books[isbn]) {
        return res.status(404).json({ message: `Libro con ISBN ${isbn} no encontrado.` });
    }

    // 1. Verificar si la reseña existe para este usuario
    if (books[isbn].reviews && books[isbn].reviews[username]) {
        // 2. Eliminar la propiedad (la reseña del usuario)
        delete books[isbn].reviews[username];

        // Opcional: Si no quedan más reseñas, eliminar el objeto 'reviews'
        if (Object.keys(books[isbn].reviews).length === 0) {
            delete books[isbn].reviews;
        }

        return res.status(200).json({ message: `Reseña del usuario ${username} para el ISBN ${isbn} eliminada exitosamente.` });
    } else {
        return res.status(404).json({ message: `No se encontró una reseña de ${username} para el ISBN ${isbn}.` });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
