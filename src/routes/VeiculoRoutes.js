const express = require('express');
const router = express.Router();
const VeiculoController = require('../controllers/VeiculoController');

router.get('/veiculos', VeiculoController.listar);
router.get('/veiculos/:id', VeiculoController.buscarPorId);
router.post('/veiculos', VeiculoController.cadastrar);
router.put('/veiculos/:id', VeiculoController.substituir);

module.exports = router;