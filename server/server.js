const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const multer = require('multer');
const { db, addUser, validateUser, addProduct, getAllProducts, updateProduct, deleteProduct } = require('./db');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuration de multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Configuration du middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configuration de la session
app.use(session({
    store: new SQLiteStore({ db: 'sessions.sqlite' }),
    secret: 'votre clé secrète',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Middleware de journalisation pour le débogage
app.use((req, res, next) => {
    console.log(`ID de session : ${req.sessionID}`);
    console.log(`Session :`, req.session);
    next();
});

// Middleware pour vérifier si l'utilisateur est authentifié
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/');
    }
}

// Middleware pour vérifier si l'utilisateur est administrateur
function isAdmin(req, res, next) {
    if (req.session.role === 'admin') {
        next();
    } else {
        res.status(403).send('Interdit');
    }
}

// Route pour la page d'accueil
app.get('/', (req, res) => {
    console.log("GET / - Rendu de index.ejs");
    res.render('index');
});

// Route pour créer un compte
app.post('/create-account', async (req, res) => {
    const { username, email, password, role } = req.body;
    console.log(`POST /create-account - Création du compte avec le nom d'utilisateur: ${username}, email: ${email}`);
    try {
        await addUser(username, email, password, role);
        res.redirect('/');
    } catch (error) {
        console.error('Erreur lors de la création du compte:', error);
        res.status(500).send('Erreur lors de la création du compte');
    }
});

// Route pour se connecter
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`POST /login - Tentative de connexion avec l'email: ${email}`);
    try {
        const user = await validateUser(email, password);
        if (user) {
            console.log('Utilisateur validé:', user);
            req.session.userId = user.id;
            req.session.role = user.role;
            console.log(`Session userId définie: ${req.session.userId}, rôle: ${req.session.role}`);
            res.redirect('/manage-products');
        } else {
            console.log('Tentative de connexion invalide');
            res.redirect('/');
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).send('Erreur lors de la connexion');
    }
});

// Route pour gérer les produits
app.get('/manage-products', isAuthenticated, async (req, res) => {
    try {
        const products = await getAllProducts();
        console.log('Rendu de manage-products.ejs avec les produits:', products);
        res.render('manage-products', { products, role: req.session.role });
    } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        res.status(500).send('Erreur lors de la récupération des produits');
    }
});

// Route pour créer un produit
app.post('/create-product', isAuthenticated, upload.single('imageFile'), async (req, res) => {
    const { title, description, imageUrl, price, quantity } = req.body;
    const imageFile = req.file ? req.file.filename : null;
    console.log(`POST /create-product - Création du produit`);
    console.log(`Détails du produit: Titre: ${title}, Description: ${description}, URL de l'image: ${imageUrl}, Fichier d'image: ${imageFile}, Prix: ${price}, Quantité: ${quantity}`);
    try {
        await addProduct(title, description, imageUrl || imageFile, price, quantity);
        console.log('Produit créé avec succès');
        res.redirect('/manage-products');
    } catch (error) {
        console.error('Erreur lors de la création du produit:', error);
        res.status(500).send('Erreur lors de la création du produit');
    }
});

// Route pour mettre à jour un produit (administrateur seulement)
app.post('/update-product', isAuthenticated, isAdmin, async (req, res) => {
    const { productId, title, description, imageUrl, price, quantity } = req.body;
    console.log(`POST /update-product - Mise à jour du produit avec l'ID: ${productId}`);
    try {
        await updateProduct(productId, title, description, imageUrl, price, quantity);
        console.log('Produit mis à jour avec succès');
        res.redirect('/manage-products');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du produit:', error);
        res.status(500).send('Erreur lors de la mise à jour du produit');
    }
});

// Route pour supprimer un produit (administrateur seulement)
app.post('/delete-product', isAuthenticated, isAdmin, async (req, res) => {
    const { productId } = req.body;
    console.log(`POST /delete-product - Suppression du produit avec l'ID: ${productId}`);
    try {
        await deleteProduct(productId);
        console.log('Produit supprimé avec succès');
        res.redirect('/manage-products');
    } catch (error) {
        console.error('Erreur lors de la suppression du produit:', error);
        res.status(500).send('Erreur lors de la suppression du produit');
    }
});

// Route pour obtenir les produits (utilisateur authentifié)
app.get('/products', isAuthenticated, async (req, res) => {
    try {
        const products = await getAllProducts();
        console.log(`GET /products - Rendu des produits`);
        res.render('products', { products, role: req.session.role });
    } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        res.status(500).send('Erreur lors de la récupération des produits');
    }
});

// Route pour obtenir les utilisateurs (à des fins de débogage, à supprimer en production)
app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            res.status(500).send('Erreur lors de la récupération des utilisateurs');
        } else {
            res.json(rows);
        }
    });
});

app.listen(PORT, () => console.log(`Serveur en cours d'exécution sur le port ${PORT}`));