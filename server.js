// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join('.', '/'))); // Serve arquivos estáticos na raiz

// MongoDB connection
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => {
    console.error("⚠️ MongoDB offline:", err.message);
    process.exit(1); // encerra o processo se não conectar
  });

// Schema exemplo (substituir pelos seus)
const produtoSchema = new mongoose.Schema({
  nome: String,
  preco: Number,
  categoria: String,
  estoque: Number,
});

const Produto = mongoose.model('Produto', produtoSchema);

// Rotas
app.get('/produtos', async (req, res) => {
  try {
    const produtos = await Produto.find();
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/produtos', async (req, res) => {
  try {
    const novoProduto = new Produto(req.body);
    await novoProduto.save();
    res.status(201).json(novoProduto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota teste para o dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join('.', 'dashboard.html'));
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log("==> Your service is live 🎉");
});
