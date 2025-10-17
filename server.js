// ==============================
//  Artesanal Blend - Backend API
// ==============================

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar ao MongoDB Atlas (URI DIRETA - SEM VARIÁVEIS DE AMBIENTE)
mongoose.connect('mongodb+srv://antoniogomesfilho88_db_user:Regiane2020ac1@cluster0.nkg5z7v.mongodb.net/artesanal-blend?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => console.error('❌ Erro MongoDB:', err));

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

// ========== ROTAS DA API ==========

// GET - Listar todos os produtos
app.get('/api/menu', async (req, res) => {
  try {
    const produtos = await Produto.find().sort({ id: 1 });
    res.json(produtos);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar produto
app.post('/api/produtos', async (req, res) => {
  try {
    const { name, desc, price, cat, imgUrl } = req.body;
    
    // Encontrar o próximo ID disponível
    const ultimoProduto = await Produto.findOne().sort({ id: -1 });
    const nextId = ultimoProduto ? ultimoProduto.id + 1 : 1;
    
    const novoProduto = new Produto({
      id: nextId,
      name,
      desc,
      price: parseFloat(price),
      cat,
      imgUrl: imgUrl || ''
    });
    
    await novoProduto.save();
    res.status(201).json(novoProduto);
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { name, desc, price, cat, imgUrl } = req.body;
    
    const produto = await Produto.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { name, desc, price: parseFloat(price), cat, imgUrl },
      { new: true }
    );
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(produto);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Deletar produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const produto = await Produto.findOneAndDelete({ id: parseInt(req.params.id) });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'
  });
});

// Rota padrão
app.get('/', (req, res) => {
  res.json({ 
    message: '🍔 Artesanal Blend API Online!',
    endpoints: {
      menu: '/api/menu',
      produtos: '/api/produtos',
      health: '/health'
    }
  });
});

// ========== INICIALIZAÇÃO ==========

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🍔 API: http://localhost:${PORT}/api/menu`);
});

// Tratamento de erros
process.on('unhandledRejection', (err) => {
  console.error('❌ Erro não tratado:', err);
});
