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

// DEBUG - Verificar se a variável está sendo lida
console.log('🔍 DEBUG MongoDB Configuration:');
console.log('MONGO_URI defined:', !!process.env.MONGO_URI);
console.log('MONGO_URI value:', process.env.MONGO_URI ? '***' + process.env.MONGO_URI.slice(-20) : 'undefined');

// Configuração melhorada para MongoDB Atlas
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB conectado com sucesso!');
  console.log('📊 Database:', mongoose.connection.db?.databaseName);
})
.catch(err => {
  console.error('❌ ERRO MongoDB:', err.message);
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
}, { timestamps: true });

const InsumoSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number,
  unidade: String,
  preco: Number,
  minimo: Number
}, { timestamps: true });

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
  status: { type: String, default: 'pendente' }
}, { timestamps: true });

const Produto = mongoose.model('Produto', ProdutoSchema);
const Insumo = mongoose.model('Insumo', InsumoSchema);
const Pedido = mongoose.model('Pedido', PedidoSchema);

// ===== Funções de Fallback (Local Storage) =====
const getLocalData = (file) => {
  try {
    if (fs.existsSync(path.join(__dirname, `${file}.json`))) {
      const data = fs.readFileSync(path.join(__dirname, `${file}.json`), 'utf8');
      return JSON.parse(data);
    }
    return [];
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

// ===== Middleware para verificar conexão MongoDB =====
const checkMongoDB = (req, res, next) => {
  req.useMongoDB = mongoose.connection.readyState === 1;
  next();
};

// ===== Rotas Públicas (Cardápio) =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API para o cardápio
app.get('/api/cardapio', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      const produtos = await Produto.find({ disponivel: true });
      const cardapioFormatado = {
        "Hambúrgueres": produtos.filter(p => p.categoria === 'Hambúrgueres'),
        "Combos": produtos.filter(p => p.categoria === 'Combos'),
        "Acompanhamentos": produtos.filter(p => p.categoria === 'Acompanhamentos'),
        "Adicionais": produtos.filter(p => p.categoria === 'Adicionais'),
        "Bebidas": produtos.filter(p => p.categoria === 'Bebidas')
      };
      res.json(cardapioFormatado);
    } else {
      const menuData = getLocalData('menu');
      res.json(menuData);
    }
  } catch (error) {
    const menuData = getLocalData('menu');
    res.json(menuData);
  }
});

// ===== Rotas do Dashboard =====
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ===== API Produtos =====
app.get('/api/produtos', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      const produtos = await Produto.find().sort({ categoria: 1, nome: 1 });
      res.json(produtos);
    } else {
      const produtos = getLocalData('produtos');
      res.json(produtos);
    }
  } catch (error) {
    const produtos = getLocalData('produtos');
    res.json(produtos);
  }
});

app.post('/api/produtos', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      const produto = new Produto(req.body);
      await produto.save();
      res.json({ success: true, produto });
    } else {
      const produtos = getLocalData('produtos');
      const novoProduto = { 
        ...req.body, 
        _id: Date.now().toString(),
        createdAt: new Date()
      };
      produtos.push(novoProduto);
      saveLocalData('produtos', produtos);
      res.json({ success: true, produto: novoProduto });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar produto' });
  }
});

app.put('/api/produtos/:id', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json({ success: true, produto });
    } else {
      const produtos = getLocalData('produtos');
      const index = produtos.findIndex(p => p._id === req.params.id);
      if (index !== -1) {
        produtos[index] = { ...produtos[index], ...req.body, updatedAt: new Date() };
        saveLocalData('produtos', produtos);
        res.json({ success: true, produto: produtos[index] });
      } else {
        res.status(404).json({ error: 'Produto não encontrado' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

app.delete('/api/produtos/:id', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      await Produto.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } else {
      const produtos = getLocalData('produtos');
      const produtosFiltrados = produtos.filter(p => p._id !== req.params.id);
      saveLocalData('produtos', produtosFiltrados);
      res.json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

// ===== API Insumos =====
app.get('/api/insumos', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      const insumos = await Insumo.find();
      res.json(insumos);
    } else {
      const insumos = getLocalData('insumos');
      res.json(insumos);
    }
  } catch (error) {
    const insumos = getLocalData('insumos');
    res.json(insumos);
  }
});

app.post('/api/insumos', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      const insumo = new Insumo(req.body);
      await insumo.save();
      res.json({ success: true, insumo });
    } else {
      const insumos = getLocalData('insumos');
      const novoInsumo = { 
        ...req.body, 
        _id: Date.now().toString(),
        createdAt: new Date()
      };
      insumos.push(novoInsumo);
      saveLocalData('insumos', insumos);
      res.json({ success: true, insumo: novoInsumo });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar insumo' });
  }
});

app.put('/api/insumos/:id', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      const insumo = await Insumo.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json({ success: true, insumo });
    } else {
      const insumos = getLocalData('insumos');
      const index = insumos.findIndex(i => i._id === req.params.id);
      if (index !== -1) {
        insumos[index] = { ...insumos[index], ...req.body, updatedAt: new Date() };
        saveLocalData('insumos', insumos);
        res.json({ success: true, insumo: insumos[index] });
      } else {
        res.status(404).json({ error: 'Insumo não encontrado' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar insumo' });
  }
});

app.delete('/api/insumos/:id', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      await Insumo.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } else {
      const insumos = getLocalData('insumos');
      const insumosFiltrados = insumos.filter(i => i._id !== req.params.id);
      saveLocalData('insumos', insumosFiltrados);
      res.json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir insumo' });
  }
});

// ===== API Pedidos =====
app.get('/api/pedidos', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      const pedidos = await Pedido.find().sort({ createdAt: -1 });
      res.json(pedidos);
    } else {
      const pedidos = getLocalData('orders');
      res.json(pedidos);
    }
  } catch (error) {
    const pedidos = getLocalData('orders');
    res.json(pedidos);
  }
});

app.post('/api/pedidos', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      const pedido = new Pedido(req.body);
      await pedido.save();
      res.json({ success: true, pedido });
    } else {
      const pedidos = getLocalData('orders');
      const novoPedido = { 
        ...req.body, 
        _id: Date.now().toString(),
        createdAt: new Date()
      };
      pedidos.push(novoPedido);
      saveLocalData('orders', pedidos);
      res.json({ success: true, pedido: novoPedido });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar pedido' });
  }
});

app.put('/api/pedidos/:id', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      const pedido = await Pedido.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json({ success: true, pedido });
    } else {
      const pedidos = getLocalData('orders');
      const index = pedidos.findIndex(p => p._id === req.params.id);
      if (index !== -1) {
        pedidos[index] = { ...pedidos[index], ...req.body, updatedAt: new Date() };
        saveLocalData('orders', pedidos);
        res.json({ success: true, pedido: pedidos[index] });
      } else {
        res.status(404).json({ error: 'Pedido não encontrado' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// ===== API Financeiro =====
app.get('/api/financeiro', checkMongoDB, async (req, res) => {
  try {
    if (req.useMongoDB) {
      const pedidos = await Pedido.find();
      const insumos = await Insumo.find();

      const vendas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
      const gastos = insumos.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
      const lucro = vendas - gastos;

      res.json({ vendas, gastos, lucro });
    } else {
      const pedidos = getLocalData('orders');
      const insumos = getLocalData('insumos');
      
      const vendas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
      const gastos = insumos.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
      const lucro = vendas - gastos;
      
      res.json({ vendas, gastos, lucro });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar dados financeiros' });
  }
});

// ===== Debug Route =====
app.get('/debug', (req, res) => {
  res.json({
    status: 'OK',
    mongoConnected: mongoose.connection.readyState === 1,
    mongoUriConfigured: !!process.env.MONGO_URI,
    timestamp: new Date().toISOString()
  });
});

// ===== Health Check =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== Servidor =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Cardápio: https://artesanal-blend.onrender.com`);
  console.log(`📊 Dashboard: https://artesanal-blend.onrender.com/dashboard`);
  console.log(`❤️  Health: https://artesanal-blend.onrender.com/health`);
  console.log(`🐛 Debug: https://artesanal-blend.onrender.com/debug`);
});
