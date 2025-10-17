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
// O CORS é configurado para aceitar requisições de qualquer lugar (necessário para o Dashboard/Cardápio)
app.use(cors());
app.use(express.json());

// --- Servir arquivos estáticos (HTML, CSS, JS, imagens) ---
// Isso permite que o Render encontre e sirva seus arquivos frontend (index.html, script.js, dashboard.html, etc.)
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

// =======================================================
// --- ROTAS DA API ---
// =======================================================

// Rota 1: Página inicial (Cardápio)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota 2: Listar Cardápio (usada pelo Cardápio público)
app.get('/api/menu', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const produtos = await Produto.find();
      res.json(produtos);
    } else {
      res.json(menuLocal); // Retorna fallback se o MongoDB estiver fora
    }
  } catch (err) {
    res.json(menuLocal);
  }
});

// -------------------------------------------------------------------
// ROTAS DE GERENCIAMENTO (PARA O DASHBOARD)
// CORREÇÃO: Adicionando POST, PUT e DELETE que estavam faltando.
// -------------------------------------------------------------------

// Rota 3: Criar/Salvar um novo Produto (POST)
// ESSA ROTA RESOLVE O ERRO AO SALVAR PRODUTO NO DASHBOARD
app.post('/api/produtos', async (req, res) => {
    try {
        const novoProduto = new Produto(req.body);
        
        // Lógica para garantir que o 'id' seja sequencial e único
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

// Rota 4: Atualizar um Produto existente (PUT/PATCH)
app.put('/api/produtos/:id', async (req, res) => {
    try {
        const produtoAtualizado = await Produto.findOneAndUpdate(
            { id: req.params.id }, 
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
app.delete('/api/produtos/:id', async (req, res) => {
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


// -------------------------------------------------------------------
// ROTAS GENÉRICAS / HEALTH CHECK
// CORREÇÃO: Adicionando rotas vazias para evitar o erro 'Unexpected token <'
// -------------------------------------------------------------------

// Rota 6: Status do sistema (health check)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Offline'
  });
});

// Rota 7: Rota vazia para evitar erro de pedidos/estatísticas no Dashboard
// Evita o erro 'Unexpected token <' ao carregar o dashboard.
app.get('/api/pedidos', (req, res) => {
    res.json({ success: true, pedidos: [], message: 'Rota de pedidos não implementada, mas ativa.' });
});

// Rota 8: Rota curinga para garantir que outras URLs abram o Dashboard (ou index)
// É importante que essa rota venha por último!
app.get('*', (req, res) => {
  // Assume que qualquer outra rota desconhecida deve levar ao Cardápio ou Dashboard
  // Dependendo de qual arquivo você quer ser o padrão para rotas desconhecidas.
  res.sendFile(path.join(__dirname, 'index.html'));
});


// --- Iniciar servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
