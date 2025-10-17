// ===== server.js =====

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 10000;

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(process.cwd(), '/')));

// ===== MongoDB Connection =====
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/artesanal-blend';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('⚠️ Erro ao conectar MongoDB:', err));

// ===== Schemas =====
const ProdutoSchema = new mongoose.Schema({
  nome: String,
  preco: Number,
  descricao: String,
  imagem: String
});

const InsumoSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number,
  unidade: String,
  preco: Number,
  uso: { type: Number, default: 0 }
});

const PedidoSchema = new mongoose.Schema({
  cliente: String,
  itens: [{ nome: String, qtd: Number, preco: Number }],
  total: Number,
  status: { type: String, default: 'pending' },
  criadoEm: { type: Date, default: Date.now }
});

const Produto = mongoose.model('Produto', ProdutoSchema);
const Insumo = mongoose.model('Insumo', InsumoSchema);
const Pedido = mongoose.model('Pedido', PedidoSchema);

// ===== Produtos Routes =====
app.get('/api/produtos', async (req, res) => {
  const produtos = await Produto.find();
  res.json(produtos);
});

app.post('/api/produtos', async (req, res) => {
  const produto = new Produto(req.body);
  await produto.save();
  res.json({ success: true });
});

app.put('/api/produtos/:id', async (req, res) => {
  await Produto.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
});

app.delete('/api/produtos/:id', async (req, res) => {
  await Produto.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ===== Insumos Routes =====
app.get('/api/insumos', async (req, res) => {
  const insumos = await Insumo.find();
  res.json(insumos);
});

app.post('/api/insumos', async (req, res) => {
  const insumo = new Insumo(req.body);
  await insumo.save();
  res.json({ success: true });
});

app.put('/api/insumos/:id', async (req, res) => {
  await Insumo.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
});

app.delete('/api/insumos/:id', async (req, res) => {
  await Insumo.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ===== Pedidos Routes =====
app.get('/api/pedidos', async (req, res) => {
  const pedidos = await Pedido.find().sort({ criadoEm: -1 });
  res.json(pedidos);
});

app.post('/api/pedidos', async (req, res) => {
  const pedido = new Pedido(req.body);
  await pedido.save();
  res.json({ success: true });
});

app.put('/api/pedidos/:id', async (req, res) => {
  await Pedido.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
});

app.delete('/api/pedidos/:id', async (req, res) => {
  await Pedido.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ===== Financeiro Route =====
app.get('/api/financeiro', async (req, res) => {
  const pedidos = await Pedido.find();
  const insumos = await Insumo.find();

  const vendas = pedidos.reduce((acc, p) => acc + p.total, 0);
  const gastos = insumos.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
  const lucro = vendas - gastos;

  res.json({ vendas, gastos, lucro });
});

// ===== Servir HTML Dashboard =====
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dashboard.html'));
});

// ===== Servidor =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
