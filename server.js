// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

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
  imagem: String,
  categoria: String,
  disponivel: { type: Boolean, default: true },
  destaque: { type: Boolean, default: false }
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
  telefone: String,
  itens: [{ 
    nome: String, 
    quantidade: Number, 
    preco: Number,
    produtoId: String 
  }],
  total: Number,
  status: { type: String, default: 'pendente' },
  observacao: String,
  criadoEm: { type: Date, default: Date.now }
});

const Produto = mongoose.model('Produto', ProdutoSchema);
const Insumo = mongoose.model('Insumo', InsumoSchema);
const Pedido = mongoose.model('Pedido', PedidoSchema);

// ===== Rotas Públicas (Cardápio) =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/cardapio', async (req, res) => {
  try {
    const produtos = await Produto.find({ disponivel: true });
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar cardápio' });
  }
});

app.get('/api/produtos-ativos', async (req, res) => {
  try {
    const produtos = await Produto.find({ disponivel: true });
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar produtos' });
  }
});

// ===== Rotas do Dashboard =====
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ===== API Produtos =====
app.get('/api/produtos', async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ nome: 1 });
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar produtos' });
  }
});

app.post('/api/produtos', async (req, res) => {
  try {
    const produto = new Produto(req.body);
    await produto.save();
    res.json({ success: true, produto });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

app.put('/api/produtos/:id', async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, produto });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

app.delete('/api/produtos/:id', async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

// ===== API Insumos =====
app.get('/api/insumos', async (req, res) => {
  try {
    const insumos = await Insumo.find();
    res.json(insumos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar insumos' });
  }
});

app.post('/api/insumos', async (req, res) => {
  try {
    const insumo = new Insumo(req.body);
    await insumo.save();
    res.json({ success: true, insumo });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar insumo' });
  }
});

// ===== API Pedidos =====
app.get('/api/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ criadoEm: -1 });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar pedidos' });
  }
});

app.post('/api/pedidos', async (req, res) => {
  try {
    const pedido = new Pedido(req.body);
    await pedido.save();
    
    // Atualizar uso de insumos
    for (const item of pedido.itens) {
      // Lógica para atualizar insumos baseada nos produtos vendidos
      // (você pode implementar conforme suas receitas)
    }
    
    res.json({ success: true, pedido });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, pedido });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// ===== API Financeiro =====
app.get('/api/financeiro', async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    const insumos = await Insumo.find();

    const vendas = pedidos.reduce((acc, p) => acc + p.total, 0);
    const gastos = insumos.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
    const lucro = vendas - gastos;

    res.json({ vendas, gastos, lucro });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar dados financeiros' });
  }
});

// ===== Servidor =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Cardápio: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
});
