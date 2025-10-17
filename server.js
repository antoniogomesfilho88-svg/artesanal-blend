const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve todos os arquivos da raiz
app.use(express.urlencoded({ extended: true }));

// Caminhos dos arquivos JSON
const menuFile = path.join(__dirname, 'menu.json');
const insumosFile = path.join(__dirname, 'insumos.json');
const ordersFile = path.join(__dirname, 'orders.json');

// Funções auxiliares
function readJSON(filePath) {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(filePath));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// -------------------- ROTAS -------------------- //

// Produtos
app.get('/api/produtos', (req, res) => {
  const produtos = readJSON(menuFile);
  res.json(produtos);
});

app.post('/api/produtos', (req, res) => {
  const produtos = readJSON(menuFile);
  const newProduto = { id: Date.now(), ...req.body };
  produtos.push(newProduto);
  writeJSON(menuFile, produtos);
  res.json(newProduto);
});

app.put('/api/produtos/:id', (req, res) => {
  const produtos = readJSON(menuFile);
  const idx = produtos.findIndex(p => p.id == req.params.id);
  if (idx === -1) return res.status(404).send('Produto não encontrado');
  produtos[idx] = { ...produtos[idx], ...req.body };
  writeJSON(menuFile, produtos);
  res.json(produtos[idx]);
});

app.delete('/api/produtos/:id', (req, res) => {
  let produtos = readJSON(menuFile);
  produtos = produtos.filter(p => p.id != req.params.id);
  writeJSON(menuFile, produtos);
  res.json({ success: true });
});

// Insumos
app.get('/api/insumos', (req, res) => {
  const insumos = readJSON(insumosFile);
  res.json(insumos);
});

app.post('/api/insumos', (req, res) => {
  const insumos = readJSON(insumosFile);
  const newInsumo = { id: Date.now(), ...req.body };
  insumos.push(newInsumo);
  writeJSON(insumosFile, insumos);
  res.json(newInsumo);
});

app.put('/api/insumos/:id', (req, res) => {
  const insumos = readJSON(insumosFile);
  const idx = insumos.findIndex(i => i.id == req.params.id);
  if (idx === -1) return res.status(404).send('Insumo não encontrado');
  insumos[idx] = { ...insumos[idx], ...req.body };
  writeJSON(insumosFile, insumos);
  res.json(insumos[idx]);
});

app.delete('/api/insumos/:id', (req, res) => {
  let insumos = readJSON(insumosFile);
  insumos = insumos.filter(i => i.id != req.params.id);
  writeJSON(insumosFile, insumos);
  res.json({ success: true });
});

// Pedidos
app.get('/api/pedidos', (req, res) => {
  const pedidos = readJSON(ordersFile);
  res.json(pedidos);
});

app.post('/api/pedidos', (req, res) => {
  const pedidos = readJSON(ordersFile);
  const newPedido = { id: Date.now(), ...req.body, data: new Date() };
  pedidos.push(newPedido);
  writeJSON(ordersFile, pedidos);
  res.json(newPedido);
});

// Financeiro (resumo)
app.get('/api/financeiro', (req, res) => {
  const pedidos = readJSON(ordersFile);
  const totalPedidos = pedidos.length;
  const totalVendas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
  res.json({ totalPedidos, totalVendas });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
