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
// 🌐 Conexão com MongoDB Atlas
// ===============================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ MongoDB conectado com sucesso"))
  .catch((err) => console.error("❌ Erro ao conectar MongoDB:", err));

// ===============================
// 👤 Rotas de autenticação e usuários
// ===============================

// Cria usuário admin se não existir
async function criarAdmin() {
  const adminExiste = await User.findOne({ email: "admin@blend.com" });
  if (!adminExiste) {
    const admin = new User({
      nome: "Administrador",
      email: "admin@blend.com",
      senhaHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "123456", 10),
      cargo: "admin"
    });
    await admin.save();
    console.log("✅ Usuário admin criado: admin@blend.com / 123456");
  }
}
criarAdmin();

// Middleware de autenticação
function autenticarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Acesso negado" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

// Login
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
    console.error(err);
    res.status(500).json({ error: "Erro interno no login" });
  }
});

// Cadastrar novo colaborador (somente admin)
app.post("/api/auth/register", autenticarToken, async (req, res) => {
  try {
    if (req.user.cargo !== "admin")
      return res.status(403).json({ error: "Apenas admins podem cadastrar usuários" });

    const { nome, email, senha, cargo } = req.body;
    const jaExiste = await User.findOne({ email });
    if (jaExiste) return res.status(400).json({ error: "E-mail já cadastrado" });

    const senhaHash = await bcrypt.hash(senha, 10);
    const novo = new User({ nome, email, senhaHash, cargo });
    await novo.save();
    res.json({ message: "Usuário cadastrado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar usuário" });
  }
});

// Listar colaboradores (admin)
app.get("/api/users", autenticarToken, async (req, res) => {
  try {
    if (req.user.cargo !== "admin")
      return res.status(403).json({ error: "Apenas admins podem listar usuários" });

    const users = await User.find({}, "-senhaHash");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// ===============================
// 💰 Exemplo simples de rota financeira
// ===============================
app.get("/api/stats", autenticarToken, async (req, res) => {
  try {
    const vendas = 10000; // exemplo fictício
    const gastos = 6000;
    res.json({ vendas, gastos, lucro: vendas - gastos });
  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular financeiro." });
  }
});

// ===============================
// 🗂️ Servir arquivos estáticos (HTML, JS, CSS, imagens)
// ===============================
app.use(express.static(__dirname));

// Página inicial → Login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});


// ===============================
// 🚀 Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Cardápio: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
});

