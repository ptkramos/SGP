const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Login
router.get('/', authController.loginPage);
router.post('/entrar', authController.loginSubmit);

// Logout
router.get('/sair', authController.logout);

// Cadastrar (admin only)
router.get('/cadastrar', requireAuth, requireAdmin, authController.registerPage);
router.post('/cadastrar', requireAuth, requireAdmin, authController.registerSubmit);

module.exports = router;
