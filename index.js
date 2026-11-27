require('dotenv').config();

const express = require('express');
const path = require('path');
const { validarHeadersJson } = require('./src/middlewares/SegurancaMiddleware');
const router = require('./src/routes/ProdutoRoutes');
const VeiculoView = require('./src/views/VeiculoView');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(validarHeadersJson);

app.use('/api', router);

app.use((req, res) => {
  return res.status(404).json(
    VeiculoView.erro(404, `O endereço '${req.originalUrl}' não existe nesta API.`)
  );
});

app.listen(PORT, () => {
  console.log(`Servidor TransLog API rodando em http://localhost:${PORT}`);
});