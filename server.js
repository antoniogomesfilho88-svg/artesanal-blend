// ===============================
// 📦 Dependências
// ===============================
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

// ===============================
// ⚙️ Configuração base
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "blend-secret";

// ===============================
// 🌐 Conexão MongoDB Atlas
// ===============================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB conectado com sucesso"))
  .catch((err) => console.error("❌ Erro ao conectar MongoDB:", err));

// ===============================
// 👤 Cria admin se não existir
// ===============================
async function criarAdmin() {
  const adminExiste = await User.findOne({ email: "admin@blend.com" });
  if (!adminExiste) {
    const admin = new User({
      nome: "Administrador",
      email: "admin@blend.com",
      senhaHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "123456", 10),
      cargo: "admin",
    });
    await admin.save();
    console.log("✅ Usuário admin criado: admin@blend.com / 123456");
  }
}
criarAdmin();

// ===============================
// 🔐 Middleware de autenticação
// ===============================
function autenticarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Acesso negado" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

// ===============================
// 🔑 Rotas de autenticação
// ===============================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaValida) return res.status(401).json({ error: "Senha incorreta" });

    const token = jwt.sign(
      { id: user._id, nome: user.nome, email: user.email, cargo: user.cargo },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({ token });
  } catch (err) {
    console.error("❌ Erro no login:", err);
    res.status(500).json({ error: "Erro interno no login" });
  }
});

// Registrar colaborador (somente admin)
app.post("/api/auth/register", autenticarToken, async (req, res) => {
  try {
    if (req.user.cargo !== "admin")
      return res
        .status(403)
        .json({ error: "Apenas administradores podem cadastrar usuários" });

    const { nome, email, senha, cargo } = req.body;
    const existe = await User.findOne({ email });
    if (existe) return res.status(400).json({ error: "E-mail já cadastrado" });

    const senhaHash = await bcrypt.hash(senha, 10);
    const novo = new User({ nome, email, senhaHash, cargo });
    await novo.save();

    res.json({ message: "Usuário cadastrado com sucesso" });
  } catch (err) {
    console.error("❌ Erro ao registrar:", err);
    res.status(500).json({ error: "Erro ao cadastrar usuário" });
  }
});

// ===============================
// 💰 Rotas simuladas (menu, pedidos, insumos)
// ===============================
app.get("/api/menu", autenticarToken, (req, res) => {
  res.json([
    { id: 1, nome: "Burger Artesanal", preco: 29.9, disponivel: true },
    { id: 2, nome: "Combo Duplo", preco: 45.5, disponivel: true },
  ]);
});

app.get("/api/orders", autenticarToken, (req, res) => {
  res.json([
    { id: 1, cliente: "João", total: 59.9, status: "entregue" },
    { id: 2, cliente: "Maria", total: 35.0, status: "pendente" },
  ]);
});

app.get("/api/insumos", autenticarToken, (req, res) => {
  res.json([
    { id: 1, nome: "Carne 120g", quantidade: 10, preco: 12.5 },
    { id: 2, nome: "Queijo Cheddar", quantidade: 5, preco: 8.9 },
  ]);
});

app.get("/api/stats", autenticarToken, (req, res) => {
  const vendas = 12890;
  const gastos = 7890;
  res.json({ vendas, gastos, lucro: vendas - gastos });
});

// ===============================
// 🗂️ Servir frontend do diretório /public
// ===============================
app.use(express.static(path.join(__dirname, "public")));

// Redireciona "/" para o dashboard.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Fallback — rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// ===============================
// 🚀 Inicialização do servidor
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});
