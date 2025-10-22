// server.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// ===== Config ES Modules =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import User from "./models/User.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve index.html, dashboard.html, css e js

// ===== JWT =====
const SECRET_KEY = process.env.JWT_SECRET || "segredo-artesanal-blend";

// ===== MongoDB =====
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB conectado"))
    .catch(err => console.error("⚠️ Erro ao conectar MongoDB:", err.message));
} else {
  console.error("❌ MONGO_URI não definida. Persistência de dados não funcionará.");
}

// ===== Schemas de domínio =====
import mongoosePkg from "mongoose";
const { Schema, model } = mongoosePkg;

const ProdutoSchema = new Schema({
  nome: String,
  preco: Number,
  descricao: String,
  imagem: String,
  categoria: String,
  disponivel: { type: Boolean, default: true },
  ingredientes: [String],
  tempoPreparo: Number,
}, { timestamps: true });

const InsumoSchema = new Schema({
  nome: String,
  quantidade: Number,
  unidade: String,
  preco: Number,
  minimo: Number,
}, { timestamps: true });

const PedidoSchema = new Schema({
  cliente: String,
  telefone: String,
  endereco: String,
  regiao: String,
  taxaEntrega: Number,
  itens: [{ nome: String, quantidade: Number, preco: Number, categoria: String }],
  total: Number,
  formaPagamento: String,
  troco: Number,
  observacao: String,
  status: { type: String, default: "pending" },
  criadoEm: { type: Date, default: Date.now }
}, { timestamps: true });

const Produto = model("Produto", ProdutoSchema);
const Insumo = model("Insumo", InsumoSchema);
const Pedido = model("Pedido", PedidoSchema);

// ===== Middleware de Auth =====
function autenticarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Acesso negado" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}
function exigirAdmin(req, res, next) {
  if (req.user?.cargo !== "admin") return res.status(403).json({ error: "Apenas admin" });
  next();
}

// ===== Seed de Admin (primeira execução) =====
async function ensureAdmin() {
  const existe = await User.findOne({ cargo: "admin" });
  if (!existe) {
    const u = new User({ nome: "Administrador", email: "admin@blend.com", senhaHash: "placeholder", cargo: "admin" });
    await u.setSenha(process.env.ADMIN_PASSWORD || "123456");
    await u.save();
    console.log("👤 Admin criado: admin@blend.com / 123456 (mude ADMIN_PASSWORD no Render)");
  }
}
ensureAdmin().catch(console.error);

// ===== Rotas Públicas =====
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "dashboard.html"))); // página é servida, mas o JS redireciona se não tiver token
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "login.html")));

// Cardápio público
app.get("/api/cardapio", async (req, res) => {
  try {
    const produtos = await Produto.find({ disponivel: true });
    const cat = ["Hambúrgueres","Combos","Acompanhamentos","Adicionais","Bebidas"];
    const cardapio = Object.fromEntries(cat.map(c => [c, produtos.filter(p => p.categoria === c)]));
    res.json(cardapio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao carregar cardápio." });
  }
});

// ===== Auth =====
app.post("/api/auth/login", async (req, res) => {
  const { email, senha } = req.body;
  const user = await User.findOne({ email, ativo: true });
  if (!user) return res.status(401).json({ error: "Usuário não encontrado" });

  const ok = await bcrypt.compare(senha, user.senhaHash);
  if (!ok) return res.status(401).json({ error: "Senha inválida" });

  const token = jwt.sign({ id: user._id, nome: user.nome, email: user.email, cargo: user.cargo }, SECRET_KEY, { expiresIn: "8h" });
  res.json({ token });
});

// cadastrar colaborador (admin)
app.post("/api/auth/register", autenticarToken, exigirAdmin, async (req, res) => {
  try {
    const { nome, email, senha, cargo = "colaborador" } = req.body;
    const ja = await User.findOne({ email });
    if (ja) return res.status(400).json({ error: "E-mail já cadastrado" });

    const u = new User({ nome, email, senhaHash: "placeholder", cargo });
    await u.setSenha(senha);
    await u.save();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao cadastrar usuário" });
  }
});

// listar usuários (admin)
app.get("/api/users", autenticarToken, exigirAdmin, async (req, res) => {
  const users = await User.find().select("-senhaHash");
  res.json(users);
});

// ===== Rotas Protegidas do Dashboard =====
// Produtos
app.get("/api/menu", autenticarToken, async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ categoria: 1, nome: 1 });
    const produtosFormatados = produtos.map(p => ({ ...p._doc, id: p._id }));
    res.json(produtosFormatados);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar produtos." });
  }
});
app.post("/api/menu/item", autenticarToken, exigirAdmin, async (req, res) => {
  try {
    const produto = new Produto(req.body);
    const salvo = await produto.save();
    res.status(201).json({ success: true, produto: { ...salvo._doc, id: salvo._id } });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar produto." });
  }
});
app.put("/api/menu/item/:id", autenticarToken, async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!produto) return res.status(404).json({ error: "Produto não encontrado." });
    res.json({ success: true, produto: { ...produto._doc, id: produto._id } });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar produto." });
  }
});
app.delete("/api/menu/item/:id", autenticarToken, exigirAdmin, async (req, res) => {
  try {
    const result = await Produto.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Produto não encontrado." });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir produto." });
  }
});

// Insumos
app.get("/api/insumos", autenticarToken, async (req, res) => {
  try { res.json(await Insumo.find()); } 
  catch (error) { res.status(500).json({ error: "Erro ao listar insumos." }); }
});
app.post("/api/insumos", autenticarToken, async (req, res) => {
  try { const i = new Insumo(req.body); await i.save(); res.status(201).json({ success: true }); }
  catch (error) { res.status(500).json({ error: "Erro ao criar insumo." }); }
});
app.put("/api/insumos/:id", autenticarToken, async (req, res) => {
  try { await Insumo.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: "Erro ao atualizar insumo." }); }
});
app.delete("/api/insumos/:id", autenticarToken, exigirAdmin, async (req, res) => {
  try { await Insumo.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: "Erro ao excluir insumo." }); }
});

// Pedidos
app.get("/api/orders", autenticarToken, async (req, res) => {
  try { res.json(await Pedido.find().sort({ criadoEm: -1 })); } 
  catch (error) { res.status(500).json({ error: "Erro ao listar pedidos." }); }
});
app.post("/api/orders", autenticarToken, async (req, res) => {
  try { const p = new Pedido(req.body); await p.save(); res.status(201).json({ success: true }); } 
  catch (error) { res.status(500).json({ error: "Erro ao criar pedido." }); }
});
app.put("/api/orders/:id", autenticarToken, async (req, res) => {
  try { await Pedido.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ error: "Erro ao atualizar pedido." }); }
});
app.delete("/api/orders/:id", autenticarToken, exigirAdmin, async (req, res) => {
  try { await Pedido.findByIdAndDelete(req.params.id); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ error: "Erro ao excluir pedido." }); }
});

// Financeiro
app.get("/api/stats", autenticarToken, async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    const insumos = await Insumo.find();
    const vendas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
    const gastos = insumos.reduce((acc, i) => acc + ((i.preco || 0) * (i.quantidade || 0)), 0);
    res.json({ vendas, gastos, lucro: vendas - gastos });
  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular financeiro." });
  }
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Cardápio: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
});
