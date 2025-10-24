// ===============================
// server.js - Artesanal Blend (versão com login e JWT)
// ===============================

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

// ===============================
// 🔧 Configuração base
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "blend-secret";

// ===============================
// 🧩 Middlewares
// ===============================
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ===============================
// 🧠 Conexão com o MongoDB
// ===============================
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB conectado'))
    .catch(err => console.error('⚠️ Erro ao conectar MongoDB:', err.message));
} else {
  console.error('❌ ERRO: Variável MONGO_URI não está definida.');
}

// ===============================
// 👤 Criação automática do admin
// ===============================
async function criarAdmin() {
  try {
    const adminExiste = await User.findOne({ email: "admin@blend.com" });
    if (!adminExiste) {
      const senhaHash = await bcrypt.hash("123456", 10);
      await new User({
        nome: "Administrador",
        email: "admin@blend.com",
        senhaHash,
        cargo: "admin"
      }).save();
      console.log("✅ Usuário admin criado: admin@blend.com / 123456");
    } else {
      console.log("👤 Usuário admin já existe");
    }
  } catch (err) {
    console.error("Erro ao criar admin:", err);
  }
}
criarAdmin();

// ===============================
// 🔐 Autenticação (login)
// ===============================

// Página de login (serve o arquivo login.html)
app.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname, './login.html'));
});

// Rota da API para fazer login (POST)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaValida) return res.status(401).json({ error: "Senha incorreta" });

    const token = jwt.sign(
      { id: user._id, nome: user.nome, cargo: user.cargo },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro interno no login" });
  }
});

// Middleware para proteger rotas (opcional)
function autenticarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Acesso negado" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

// ===== Schemas (Adaptado do seu último código) =====
const ProdutoSchema = new mongoose.Schema({
    nome: String,
    preco: Number,
    descricao: String,
    imagem: String,
    // Campos adicionais dos modelos anteriores (para segurança):
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
    minimo: Number, // Adaptado do seu último código (uso foi substituído por minimo)
}, { timestamps: true });

const PedidoSchema = new mongoose.Schema({
    cliente: String,
    telefone: String,
    endereco: String,
    regiao: String,
    taxaEntrega: Number,
    itens: [{ nome: String, quantidade: Number, preco: Number, categoria: String }], // Adaptado para 'quantidade'
    total: Number,
    formaPagamento: String,
    troco: Number,
    observacao: String,
    status: { type: String, default: 'pending' },
    criadoEm: { type: Date, default: Date.now }
}, { timestamps: true });

const Produto = mongoose.model('Produto', ProdutoSchema);
const Insumo = mongoose.model('Insumo', InsumoSchema);
const Pedido = mongoose.model('Pedido', PedidoSchema);


// ===== Rotas do Cardápio Público =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API para o cardápio (Formatação por categoria)
app.get('/api/cardapio', async (req, res) => {
    try {
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
        console.error('Erro ao carregar cardápio:', error);
        res.status(500).json({ error: 'Erro ao carregar cardápio.' });
    }
});


// ===== Rotas do Dashboard (UNIFICADAS: Português -> Inglês) =====

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// GET /api/menu (Lista todos os produtos para o Dashboard)
app.get('/api/menu', async (req, res) => {
    try {
        const produtos = await Produto.find().sort({ categoria: 1, nome: 1 });
        // Mapeia _id para id para compatibilidade com o frontend
        const produtosFormatados = produtos.map(p => ({
            ...p._doc,
            id: p._id
        }));
        res.json(produtosFormatados);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar menu.' });
    }
});

// POST /api/menu/item (Criar Produto - ROTA CORRETA DO DASHBOARD)
app.post('/api/menu/item', async (req, res) => {
    try {
        const produto = new Produto(req.body);
        const produtoSalvo = await produto.save();
        res.status(201).json({ 
            success: true, 
            produto: { ...produtoSalvo._doc, id: produtoSalvo._id } 
        });
    } catch (error) {
        console.error('Erro ao criar item do menu:', error.message);
        res.status(500).json({ error: 'Erro ao criar produto.' });
    }
});

// PUT /api/menu/item/:id (Editar Produto - ROTA CORRETA DO DASHBOARD)
app.put('/api/menu/item/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const produto = await Produto.findByIdAndUpdate(id, req.body, { new: true });
        if (!produto) return res.status(404).json({ error: 'Produto não encontrado.' });
        res.json({ success: true, produto: { ...produto._doc, id: produto._id } });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar produto.' });
    }
});

// DELETE /api/menu/item/:id (Excluir Produto - ROTA CORRETA DO DASHBOARD)
app.delete('/api/menu/item/:id', async (req, res) => {
    try {
        const result = await Produto.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ error: 'Produto não encontrado.' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir produto.' });
    }
});


// ===== Insumos (Supplies) Routes (Mantido em Português) =====
app.get('/api/insumos', async (req, res) => {
    try {
        const insumos = await Insumo.find();
        res.json(insumos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar insumos.' });
    }
});

app.post('/api/insumos', async (req, res) => {
    try {
        const insumo = new Insumo(req.body);
        await insumo.save();
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar insumo.' });
    }
});

app.put('/api/insumos/:id', async (req, res) => {
    try {
        await Insumo.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar insumo.' });
    }
});

app.delete('/api/insumos/:id', async (req, res) => {
    try {
        await Insumo.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir insumo.' });
    }
});


// ===== Pedidos (Orders) Routes - UNIFICADAS com o Dashboard =====
app.get('/api/orders', async (req, res) => { // Renomeada de /api/pedidos
    try {
        const pedidos = await Pedido.find().sort({ criadoEm: -1 });
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar pedidos (orders).' });
    }
});

app.post('/api/orders', async (req, res) => { // Renomeada de /api/pedidos
    try {
        const pedido = new Pedido(req.body);
        await pedido.save();
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar pedido (order).' });
    }
});

app.put('/api/orders/:id', async (req, res) => { // Renomeada de /api/pedidos/:id
    try {
        await Pedido.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar pedido (order).' });
    }
});

app.delete('/api/orders/:id', async (req, res) => { // Renomeada de /api/pedidos/:id
    try {
        await Pedido.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir pedido (order).' });
    }
});

// ===== Financeiro (Stats) Route - UNIFICADA com o Dashboard =====
app.get('/api/stats', async (req, res) => { // Renomeada de /api/financeiro
    try {
        const pedidos = await Pedido.find();
        const insumos = await Insumo.find();

        const vendas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
        // Assumindo que o gasto é o custo total dos insumos atuais (preco * quantidade)
        const gastos = insumos.reduce((acc, i) => acc + (i.preco * i.quantidade), 0); 
        const lucro = vendas - gastos;

        res.json({ vendas, gastos, lucro });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao calcular financeiro/stats.' });
    }
});


// ===== Servidor =====
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    // Log dos URLs para facilitar o debug no Render
    console.log(`📱 Cardápio: https://artesanal-blend.onrender.com`);
    console.log(`📊 Dashboard: https://artesanal-blend.onrender.com/dashboard`);
});
