const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const listRoutes = require('./routes/listRoutes');
const presenceRoutes = require('./routes/presenceRoutes');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'sgp-default-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        httpOnly: true
    }
}));

// Disponibilizar dados de sessão para todas as views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    next();
});

// Rotas
app.use('/', authRoutes);
app.use('/', listRoutes);
app.use('/', presenceRoutes);

// 404
app.use((req, res) => {
    res.status(404).render('404', { title: 'Página não encontrada' });
});

module.exports = app;
