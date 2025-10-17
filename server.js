// =========================================================
//  Artesanal Blend - Backend COMPLETO com Rotas de Gerenciamento
// =========================================================

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
app.use(express.json()); // Necessário para ler o corpo (body) de requisições POST/PUT

// --- Servir arquivos estáticos (Frontend) ---
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

// --- Dados locais de fallback ---
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

// =======================================================
// --- ROTAS DO CARDÁPIO E GERENCIAMENTO (CRUD) ---
// =======================================================

// Rota 1: Página inicial (Abre o Cardápio HTML)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota 2: Listar Cardápio (GET)
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


// Rota 3: Criar/Salvar um novo Produto (POST)
// ESSA ROTA CORRIGE O ERRO DE SALVAR PRODUTO
app.post('/api/menu/item', async (req, res) => {
    try {
        const novoProduto = new Produto(req.body);
        
        // Garante que o ID seja sequencial para novos itens
        const ultimoProduto = await Produto.findOne().sort({ id: -1 });
        novoProduto.id = (ultimoProduto ? ultimoProduto.id : 0) + 1;

        const produtoSalvo = await novoProduto.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Produto salvo com sucesso!', 
            data: produtoSalvo 
        });

    } catch (err) {
        console.error("Erro ao salvar produto:", err.message);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao salvar o produto no banco de dados.', 
            error: err.message 
        });
    }
});

// Rota 4: Atualizar um Produto existente (PUT)
app.put('/api/menu/item/:id', async (req, res) => {
    try {
        const produtoAtualizado = await Produto.findOneAndUpdate(
            { id: req.params.id }, // Busca pelo ID Sequencial
            req.body,             
            { new: true }         
        );

        if (!produtoAtualizado) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        res.json({ 
            success: true,
            message: 'Produto atualizado com sucesso!', 
            data: produtoAtualizado 
        });

    } catch (err) {
        console.error("Erro ao atualizar produto:", err.message);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao atualizar o produto.', 
            error: err.message 
        });
    }
});

// Rota 5: Deletar um Produto (DELETE)
// ESSA ROTA CORRIGE O ERRO DE EXCLUIR PRODUTO
app.delete('/api/menu/item/:id', async (req, res) => {
    try {
        const produtoDeletado = await Produto.findOneAndDelete({ id: req.params.id });

        if (!produtoDeletado) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        
        res.json({ 
            success: true,
            message: 'Produto excluído com sucesso!'
        });

    } catch (err) {
        console.error("Erro ao deletar produto:", err.message);
        res.status(500).json({ 
            success: false,
            message: 'Erro ao deletar o produto.', 
            error: err.message 
        });
    }
});


/ --- Rotas Genéricas Adicionais para o Dashboard ---

// Rota para Pedidos (Resolve o erro da linha 812)
app.get('/api/pedidos', (req, res) => {
    // Retorna JSON vazio para não quebrar o frontend
    res.json({ success: true, pedidos: [], message: 'Rota de pedidos ativa.' });
});

// Rota para Estatísticas (Resolve o erro da linha 836)
app.get('/api/estatisticas', (req, res) => {
    // Retorna JSON vazio para não quebrar o frontend
    res.json({ success: true, estatisticas: {}, message: 'Rota de estatísticas ativa.' });
});
// Rota 6: Status do sistema (health check)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Offline'
  });
});

// Rota 7: Rota vazia para Pedidos (Evita o erro 'Unexpected token <' do Dashboard)
app.get('/api/pedidos', (req, res) => {
    res.json({ success: true, pedidos: [], message: 'Rota de pedidos não implementada, mas ativa.' });
});

// Rota 8: Rota vazia para Estatísticas (Evita o erro 'Unexpected token <' do Dashboard)
app.get('/api/estatisticas', (req, res) => {
    res.json({ success: true, estatisticas: {}, message: 'Rota de estatísticas não implementada, mas ativa.' });
});


// Rota 9: Rota curinga para rotas não reconhecidas (para o Dashboard)
app.get('*', (req, res) => {
  // Se a rota for o dashboard.html e não for uma rota da API, carrega o arquivo.
  if (req.url.includes('dashboard')) {
      return res.sendFile(path.join(__dirname, 'dashboard.html'));
  }
  // Para qualquer outra rota desconhecida, volta ao index.
  res.sendFile(path.join(__dirname, 'index.html'));
});


// --- Iniciar servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

