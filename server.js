// ==============================
//  Artesanal Blend - Backend SIMPLES
// ==============================

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar ao MongoDB
mongoose.connect('mongodb+srv://antoniogomesfilho88_db_user:Regiane2020@cluster0.nkg5z7v.mongodb.net/artesanal-blend?retryWrites=true&w=majority')
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => console.log('⚠️ MongoDB offline:', err.message));

// Schema do Produto
const produtoSchema = new mongoose.Schema({
  id: Number,
  name: String,
  desc: String,
  price: Number,
  cat: String,
  imgUrl: String
});

const Produto = mongoose.model('Produto', produtoSchema);

// Dados locais de fallback
const menuLocal = [
  {
    id: 1,
    name: "Hambúrguer Artesanal",
    desc: "Pão brioche, blend 180g, queijo, alface, tomate",
    price: 28.90,
    cat: "Hambúrgueres",
    imgUrl: ""
  },
  {
    id: 2,
    name: "Cheese Bacon",
    desc: "Blend 180g, queijo cheddar, bacon crocante",
    price: 32.90,
    cat: "Hambúrgueres", 
    imgUrl: ""
  }
];

// ========== ROTAS PRINCIPAIS ==========

// Rota 1: Página inicial SIMPLES
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Artesanal Blend</title></head>
      <body>
        <h1>🍔 Artesanal Blend - API</h1>
        <p><a href="/dashboard">Dashboard Admin</a></p>
        <p><a href="/api/menu">Ver Cardápio (JSON)</a></p>
        <p><a href="/health">Status do Sistema</a></p>
      </body>
    </html>
  `);
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

// Rota 3: Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Offline'
  });
});

// Rota 4: Dashboard SIMPLES
app.get('/dashboard', (req, res) => {
  res.send(`
    <html>
      <head><title>Dashboard</title></head>
      <body>
        <h1>📊 Dashboard Artesanal Blend</h1>
        <p>Status: ${mongoose.connection.readyState === 1 ? '✅ Conectado' : '⚠️ Offline'}</p>
        <p><a href="/api/menu" target="_blank">Ver Cardápio</a></p>
        <p><a href="/">Voltar</a></p>
      </body>
    </html>
  `);
});

// ========== INICIAR SERVIDOR ==========

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
