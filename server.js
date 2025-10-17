// ==============================
//  Artesanal Blend - Backend + Frontend Estático
// ==============================

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuração inicial ---
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Servir arquivos estáticos (HTML, CSS, JS, imagens) ---
app.use(express.static(path.join(__dirname)));

// --- Conexão MongoDB Atlas ---
mongoose.connect(
  process.env.MONGO_URI ||
    'mongodb+srv://antoniogomesfilho88_db_user:Regiane2020@cluster0.nkg5z7v.mongodb.net/artesanal-blend?retryWrites=true&w=majority'
)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.log('⚠️ MongoDB offline:', err.message));

// --- Schema do Produto ---
const produtoSchema = new mongoose.Schema({
  id: Number,
  name: String,
  desc: String,
  price: Number,
  cat: String,
  imgUrl: String
});

const Produto = mongoose.model('Produto', produtoSchema);

// --- Dados locais de fallback (caso o banco caia) ---
const menuLocal = [
  {
    id: 1,
    name: "Hambúrguer Artesanal",
    desc: "Pão brioche, blend 180g, queijo, alface, tomate",
    price: 28.90,
    cat: "Hambúrgueres",
    imgUrl: "nd.jpg"
  },
  {
    id: 2,
    name: "Cheese Bacon",
    desc: "Blend 180g, queijo cheddar, bacon crocante",
    price: 32.90,
    cat: "Hambúrgueres",
    imgUrl: "batata.jpg"
  }
];

// --- Rotas da API ---

// Rota 1: Página inicial redireciona para index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota 2: API do Cardápio
app.get('/api/menu', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const produtos = await Produto.find();
      res.json(produtos);
    } else {
      res.json(menuLocal);
    }
  } catch (err) {
    res.json(menuLocal);
  }
});

// Rota 3: Status do sistema (health check)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Offline'
  });
});

// --- Rota final (para outras páginas HTML, como dashboard) ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Iniciar servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
