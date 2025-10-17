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

// Configuração melhorada para MongoDB Atlas
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => console.log('✅ MongoDB conectado com sucesso!'))
.catch(err => {
  console.error('⚠️ Erro ao conectar MongoDB:', err.message);
  console.log('📝 Usando armazenamento local (JSON files)');
});

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

// ===== Funções de Fallback (Local Storage) =====
const getLocalData = (file) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, `${file}.json`), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const saveLocalData = (file, data) => {
  try {
    fs.writeFileSync(path.join(__dirname, `${file}.json`), JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    return false;
  }
};

// ===== Rotas Públicas (Cardápio) =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API para o cardápio
app.get('/api/cardapio', async (req, res) => {
  try {
    // Tentar carregar do MongoDB primeiro
    const produtos = await Produto.find({ disponivel: true });
    
    const cardapioFormatado = {
      "Hambúrgueres": produtos.filter(p => p.categoria === 'Hambúrgueres'),
      "Combos": produtos.filter(p => p.categoria === 'Combos'),
      "Acompanhamentos": produtos.filter(p => p.categoria === 'Acompanhamentos'),
      "Adicionais": produtos.filter(p => p.categoria === 'Adicionais'),
      "Bebidas": produtos.filter(p => p.categoria === 'Bebidas')
    };
    
    res.json(cardapioFormatado);
  } catch (error) {
    // Fallback para menu.json local
    try {
      const menuData = getLocalData('menu');
      res.json(menuData);
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
    // Fallback para local
    const produtos = getLocalData('produtos');
    res.json(produtos);
  }
});

app.post('/api/produtos', async (req, res) => {
  try {
    const produto = new Produto(req.body);
    await produto.save();
    res.json({ success: true, produto });
  } catch (error) {
    // Fallback para local
    const produtos = getLocalData('produtos');
    const novoProduto = { ...req.body, id: Date.now().toString() };
    produtos.push(novoProduto);
    saveLocalData('produtos', produtos);
    res.json({ success: true, produto: novoProduto });
  }
});

app.put('/api/produtos/:id', async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, produto });
  } catch (error) {
    // Fallback para local
    const produtos = getLocalData('produtos');
    const index = produtos.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
      produtos[index] = { ...produtos[index], ...req.body };
      saveLocalData('produtos', produtos);
      res.json({ success: true, produto: produtos[index] });
    } else {
      res.status(404).json({ error: 'Produto não encontrado' });
    }
  }
});

app.delete('/api/produtos/:id', async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    // Fallback para local
    const produtos = getLocalData('produtos');
    const produtosFiltrados = produtos.filter(p => p.id !== req.params.id);
    saveLocalData('produtos', produtosFiltrados);
    res.json({ success: true });
  }
});

// ===== API Pedidos =====
app.get('/api/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ criadoEm: -1 });
    res.json(pedidos);
  } catch (error) {
    // Fallback para local
    const pedidos = getLocalData('orders');
    res.json(pedidos);
  }
});

app.post('/api/pedidos', async (req, res) => {
  try {
    const pedido = new Pedido(req.body);
    await pedido.save();
    res.json({ success: true, pedido });
  } catch (error) {
    // Fallback para local
    const pedidos = getLocalData('orders');
    const novoPedido = { ...req.body, id: Date.now().toString() };
    pedidos.push(novoPedido);
    saveLocalData('orders', pedidos);
    res.json({ success: true, pedido: novoPedido });
  }
});

// ===== API Insumos =====
app.get('/api/insumos', async (req, res) => {
  try {
    const insumos = await Insumo.find();
    res.json(insumos);
  } catch (error) {
    // Fallback para local
    const insumos = getLocalData('insumos');
    res.json(insumos);
  }
});

app.post('/api/insumos', async (req, res) => {
  try {
    const insumo = new Insumo(req.body);
    await insumo.save();
    res.json({ success: true, insumo });
  } catch (error) {
    // Fallback para local
    const insumos = getLocalData('insumos');
    const novoInsumo = { ...req.body, id: Date.now().toString() };
    insumos.push(novoInsumo);
    saveLocalData('insumos', insumos);
    res.json({ success: true, insumo: novoInsumo });
  }
});

// ===== API Financeiro =====
app.get('/api/financeiro', async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    const insumos = await Insumo.find();

    const vendas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
    const gastos = insumos.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
    const lucro = vendas - gastos;

    res.json({ vendas, gastos, lucro });
  } catch (error) {
    // Fallback para cálculo local
    const pedidos = getLocalData('orders');
    const insumos = getLocalData('insumos');
    
    const vendas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
    const gastos = insumos.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
    const lucro = vendas - gastos;
    
    res.json({ vendas, gastos, lucro });
  }
});

// ===== Health Check =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// ===== Servidor =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Cardápio: https://artesanal-blend.onrender.com`);
  console.log(`📊 Dashboard: https://artesanal-blend.onrender.com/dashboard`);
  console.log(`❤️  Health Check: https://artesanal-blend.onrender.com/health`);
});
