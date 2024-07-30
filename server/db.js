const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Connexion à la base de données SQLite
const db = new sqlite3.Database('./mydatabase.sqlite', (err) => {
    if (err) {
        console.error('Erreur lors de l\'ouverture de la base de données', err);
    } else {
        console.log('Connecté à la base de données SQLite.');
        // Création de la table des utilisateurs si elle n'existe pas
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        )`);
        // Création de la table des produits si elle n'existe pas
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            imageUrl TEXT,
            price REAL,
            quantity INTEGER
        )`);
    }
});

// Fonction pour ajouter un utilisateur
function addUser(username, email, password, role = 'user') {
    return new Promise((resolve, reject) => {
        // Hachage du mot de passe avant de le stocker
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) reject(err);
            db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hash, role], function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
    });
}

// Fonction pour valider les informations de connexion d'un utilisateur
function validateUser(email, password) {
    return new Promise((resolve, reject) => {
        console.log(`Validation de l'utilisateur : ${email}`);
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
            if (err) {
                console.error('Erreur lors de la récupération de l\'utilisateur:', err);
                reject(err);
            }
            if (row) {
                bcrypt.compare(password, row.password, (err, result) => {
                    if (err) {
                        console.error('Erreur lors de la comparaison des mots de passe:', err);
                        reject(err);
                    }
                    if (result) {
                        console.log('Mot de passe correct pour l\'utilisateur:', email);
                        resolve(row);
                    } else {
                        console.log('Mot de passe incorrect pour l\'utilisateur:', email);
                        resolve(null);
                    }
                });
            } else {
                console.log('Aucun utilisateur trouvé avec l\'email:', email);
                resolve(null);
            }
        });
    });
}

// Fonction pour ajouter un produit
function addProduct(title, description, imageUrl, price, quantity) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO products (title, description, imageUrl, price, quantity) VALUES (?, ?, ?, ?, ?)', 
            [title, description, imageUrl, price, quantity], 
            function(err) {
                if (err) {
                    console.error('Erreur lors de l\'insertion du produit:', err);
                    reject(err);
                } else {
                    console.log('Produit inséré avec l\'ID:', this.lastID);
                    resolve(this.lastID);
                }
            }
        );
    });
}

// Fonction pour récupérer tous les produits
function getAllProducts() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM products', (err, rows) => {
            if (err) {
                console.error('Erreur lors de la récupération des produits:', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Fonction pour mettre à jour un produit
function updateProduct(productId, title, description, imageUrl, price, quantity) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE products 
                SET title = ?, description = ?, imageUrl = ?, price = ?, quantity = ? 
                WHERE id = ?`,
            [title, description, imageUrl, price, quantity, productId],
            function(err) {
                if (err) {
                    console.error('Erreur lors de la mise à jour du produit:', err);
                    reject(err);
                } else {
                    console.log('Produit mis à jour avec l\'ID:', productId);
                    resolve(this.changes);
                }
            }
        );
    });
}

// Fonction pour supprimer un produit
function deleteProduct(productId) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
            if (err) {
                console.error('Erreur lors de la suppression du produit:', err);
                reject(err);
            } else {
                console.log('Produit supprimé avec l\'ID:', productId);
                resolve(this.changes);
            }
        });
    });
}

module.exports = { 
    db, 
    addUser, 
    validateUser, 
    addProduct, 
    getAllProducts, 
    updateProduct, 
    deleteProduct 
};