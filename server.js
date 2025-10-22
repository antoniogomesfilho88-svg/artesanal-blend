// server.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// ===== Configuração ES Modules =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir index.html, dashboard.html, JS, CSS

// ===== JWT =====
const SECRET_KEY = process.env.JWT_SECRET || "segredo-artesanal-blend";

// ===== Usuário admin =====
const admin = {
  username: "admin",
  passwordHash: bcrypt.hashSync("123456", 10),
};

// ===== Conexão MongoDB =====
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB conectado"))
    .catch(err => console.error("⚠️ Erro ao conectar MongoDB:", err.message));
} else {
  console.error("❌ MONGO_URI não definida. Persistência de dados não funcionará.");
}

// ===== Schemas =====
const ProdutoSchema = new mongoose.Schema({
  nome: String,
  preco: Number,
  descricao: String,
  imagem: String,
  categoria: String,
  disponivel: { type: Boolean, default: true },
  ingredientes: [String],
  tempoPreparo: Number,
}, { timestamps: true });

const InsumoSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number,
  unidade: String,
  preco: Number,
  minimo: Number,
}, { timestamps: true });

const PedidoSchema = new mongoose.Schema({
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

const Produto = mongoose.model("Produto", ProdutoSchema);
const Insumo = mongoose.model("Insumo", InsumoSchema);
const Pedido = mongoose.model("Pedido", PedidoSchema);

// ===== Autenticação =====
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Usuário e senha obrigatórios" });
  if (username !== admin.username) return res.status(401).json({ message: "Usuário ou senha inválidos" });

  const isPasswordValid = bcrypt.compareSync(password, admin.passwordHash);
  if (!isPasswordValid) return res.status(401).json({ message: "Usuário ou senha inválidos" });

  const token = jwt.sign({ username: admin.username }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// ===== Rotas Públicas =====
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "dashboard.html")));

// Cardápio público
app.get("/api/cardapio", async (req, res) => {
  try {
    const produtos = await Produto.find({ disponivel: true });
    const cardapio = {
      "Hambúrgueres": produtos.filter(p => p.categoria === "Hambúrgueres"),
      "Combos": produtos.filter(p => p.categoria === "Combos"),
      "Acompanhamentos": produtos.filter(p => p.categoria === "Acompanhamentos"),
      "Adicionais": produtos.filter(p => p.categoria === "Adicionais"),
      "Bebidas": produtos.filter(p => p.categoria === "Bebidas"),
    };
    res.json(cardapio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao carregar cardápio." });
  }
});

// ===== Rotas Dashboard =====
// Produtos
app.get("/api/menu", async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ categoria: 1, nome: 1 });
    const produtosFormatados = produtos.map(p => ({ ...p._doc, id: p._id }));
    res.json(produtosFormatados);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar produtos." });
  }
});

app.post("/api/menu/item", async (req, res) => {
  try {
    const produto = new Produto(req.body);
    const salvo = await produto.save();
    res.status(201).json({ success: true, produto: { ...salvo._doc, id: salvo._id } });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar produto." });
  }
});

app.put("/api/menu/item/:id", async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!produto) return res.status(404).json({ error: "Produto não encontrado." });
    res.json({ success: true, produto: { ...produto._doc, id: produto._id } });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar produto." });
  }
});

app.delete("/api/menu/item/:id", async (req, res) => {
  try {
    const result = await Produto.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Produto não encontrado." });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir produto." });
  }
});

// Insumos
app.get("/api/insumos", async (req, res) => {
  try { res.json(await Insumo.find()); } 
  catch (error) { res.status(500).json({ error: "Erro ao listar insumos." }); }
});
app.post("/api/insumos", async (req, res) => {
  try { const i = new Insumo(req.body); await i.save(); res.status(201).json({ success: true }); }
  catch (error) { res.status(500).json({ error: "Erro ao criar insumo." }); }
});
app.put("/api/insumos/:id", async (req, res) => {
  try { await Insumo.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: "Erro ao atualizar insumo." }); }
});
app.delete("/api/insumos/:id", async (req, res) => {
  try { await Insumo.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: "Erro ao excluir insumo." }); }
});

// Pedidos
app.get("/api/orders", async (req, res) => {
  try { res.json(await Pedido.find().sort({ criadoEm: -1 })); } 
  catch (error) { res.status(500).json({ error: "Erro ao listar pedidos." }); }
});
app.post("/api/orders", async (req, res) => {
  try { const p = new Pedido(req.body); await p.save(); res.status(201).json({ success: true }); } 
  catch (error) { res.status(500).json({ error: "Erro ao criar pedido." }); }
});
app.put("/api/orders/:id", async (req, res) => {
  try { await Pedido.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ error: "Erro ao atualizar pedido." }); }
});
app.delete("/api/orders/:id", async (req, res) => {
  try { await Pedido.findByIdAndDelete(req.params.id); res.json({ success: true }); } 
  catch (error) { res.status(500).json({ error: "Erro ao excluir pedido." }); }
});

// Financeiro
app.get("/api/stats", async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    const insumos = await Insumo.find();
    const vendas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
    const gastos = insumos.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
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
