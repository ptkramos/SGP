const express = require('express');
const router = express.Router();
const presenceController = require('../controllers/presenceController');

// Confirmar presença (rotas públicas - sem autenticação)
router.get('/confirmar/:code', presenceController.confirmPage);
router.post('/confirmar/:code', presenceController.confirmSubmit);

// API - Busca participante por CPF (pública, para auto-fill)
router.get('/api/participante/:cpf', presenceController.lookupParticipant);

module.exports = router;
