const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');
const { requireAuth } = require('../middleware/auth');

// Home
router.get('/inicio', requireAuth, listController.homePage);

// Criar lista
router.get('/criar-lista', requireAuth, listController.createPage);
router.post('/criar-lista', requireAuth, listController.createSubmit);

// Lista criada (exibe QR e código)
router.get('/lista-criada/:code', requireAuth, listController.listCreatedPage);

// Minhas listas
router.get('/gerenciar', requireAuth, listController.myListsPage);

// Detalhes da lista
router.get('/lista/:code', requireAuth, listController.listDetailsPage);

// Download PDF
router.get('/lista/:code/pdf', requireAuth, listController.downloadPdf);

// Encerrar evento
router.post('/lista/:code/encerrar', requireAuth, listController.closeEvent);

module.exports = router;
