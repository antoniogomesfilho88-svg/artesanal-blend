// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
  ingredientes: [String],
  tempoPreparo: Number
});

const InsumoSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number,
  unidade: String,
  preco: Number,
  minimo: Number
});

const PedidoSchema = new mongoose.Schema({
  cliente: String,
  telefone: String,
  endereco: String,
  regiao: String,
  taxaEntrega: Number,
  itens: [{ 
    nome: String, 
    quantidade: Number, 
    preco: Number,
    categoria: String
  }],
  total: Number,
  formaPagamento: String,
  troco: Number,
  observacao: String,
  status: { type: String, default: 'pendente' },
  criadoEm: { type: Date, default: Date.now }
});

const Produto = mongoose.model('Produto', ProdutoSchema);
const Insumo = mongoose.model('Insumo', InsumoSchema);
const Pedido = mongoose.model('Pedido', PedidoSchema);

// ===== Rotas Públicas (Cardápio) =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API para o cardápio - mantém mesma estrutura do seu menu.json
app.get('/api/cardapio', async (req, res) => {
  try {
    const produtos = await Produto.find({ disponivel: true });
    
    // Converter para o formato do seu cardápio atual
    const cardapioFormatado = {
      "Hambúrgueres": produtos.filter(p => p.categoria === 'Hambúrgueres'),
      "Combos": produtos.filter(p => p.categoria === 'Combos'),
      "Acompanhamentos": produtos.filter(p => p.categoria === 'Acompanhamentos'),
      "Adicionais": produtos.filter(p => p.categoria === 'Adicionais'),
      "Bebidas": produtos.filter(p => p.categoria === 'Bebidas')
    };
    
    res.json(cardapioFormatado);
  } catch (error) {
    // Fallback para o menu.json se a API falhar
    try {
      const menuData = fs.readFileSync(path.join(__dirname, 'menu.json'), 'utf8');
      res.json(JSON.parse(menuData));
    } catch (fallbackError) {
      res.status(500).json({ error: 'Erro ao carregar cardápio' });
    }
  }
});

// ===== Rotas do Dashboard =====
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ===== API Produtos =====
app.get('/api/produtos', async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ categoria: 1, nome: 1 });
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
    res.json({ success: true, pedido });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// ===== Servidor =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Cardápio: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
});
