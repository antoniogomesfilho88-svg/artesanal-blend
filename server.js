// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join('.', '/')));

// MongoDB connection
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => {
    console.error("⚠️ MongoDB offline:", err.message);
    process.exit(1);
  });

// Schemas
const produtoSchema = new mongoose.Schema({
  nome: String,
  preco: Number,
  categoria: String,
  estoque: Number,
});

const insumoSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number,
  unidade: String
});

const pedidoSchema = new mongoose.Schema({
  itens: [{
    produto: String,
    quantidade: Number,
    preco: Number
  }],
  total: Number,
  data: { type: Date, default: Date.now }
});

const Produto = mongoose.model('Produto', produtoSchema);
const Insumo = mongoose.model('Insumo', insumoSchema);
const Pedido = mongoose.model('Pedido', pedidoSchema);

// Rotas Produtos
app.get('/produtos', async (req, res) => {
  try {
    const produtos = await Produto.find();
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/produtos', async (req, res) => {
  try {
    const novoProduto = new Produto(req.body);
    await novoProduto.save();
    res.status(201).json(novoProduto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rotas Insumos
app.get('/insumos', async (req, res) => {
  try {
    const insumos = await Insumo.find();
    res.json(insumos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/insumos', async (req, res) => {
  try {
    const novoInsumo = new Insumo(req.body);
    await novoInsumo.save();
    res.status(201).json(novoInsumo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rotas Pedidos (PDV)
app.get('/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/pedidos', async (req, res) => {
  try {
    const novoPedido = new Pedido(req.body);
    await novoPedido.save();
    res.status(201).json(novoPedido);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard / Frontend
app.get('/', (req, res) => {
  res.sendFile(path.join('.', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join('.', 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log("==> Your service is live 🎉");
});
