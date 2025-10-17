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

// Conectar ao MongoDB Atlas (SENHA CORRIGIDA: Regiane2020)
mongoose.connect('mongodb+srv://antoniogomesfilho88_db_user:Regiane2020@cluster0.nkg5z7v.mongodb.net/artesanal-blend?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB conectado com sucesso!'))
.catch(err => {
  console.error('❌ Erro MongoDB:', err.message);
  console.log('⚠️  API funcionará em modo offline');
});

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

// Dados locais para fallback
const menuLocal = [
  {
    "id": 1,
    "name": "Hambúrguer Artesanal",
    "desc": "Pão brioche, blend 180g, queijo, alface, tomate",
    "price": 28.90,
    "cat": "Hambúrgueres",
    "imgUrl": ""
  },
  {
    "id": 2,
    "name": "Cheese Bacon",
    "desc": "Blend 180g, queijo cheddar, bacon crocante", 
    "price": 32.90,
    "cat": "Hambúrgueres",
    "imgUrl": ""
  },
  {
    "id": 3,
    "name": "Combo Classic",
    "desc": "Hambúrguer + Batata + Refri 350ml",
    "price": 45.90,
    "cat": "Combos",
    "imgUrl": ""
  },
  {
    "id": 4, 
    "name": "Batata Frita",
    "desc": "Porção 200g",
    "price": 15.90,
    "cat": "Acompanhamentos",
    "imgUrl": ""
  },
  {
    "id": 5,
    "name": "Refrigerante",
    "desc": "Lata 350ml", 
    "price": 8.90,
    "cat": "Bebidas",
    "imgUrl": ""
  }
];

// ========== ROTAS DA API ==========

// GET - Listar todos os produtos
app.get('/api/menu', async (req, res) => {
  try {
    // Tenta buscar do MongoDB, se não consegue usa dados locais
    if (mongoose.connection.readyState === 1) {
      const produtos = await Produto.find().sort({ id: 1 });
      return res.json(produtos);
    } else {
      return res.json(menuLocal);
    }
  } catch (err) {
    console.error('Erro ao buscar produtos, usando dados locais:', err);
    res.json(menuLocal);
  }
});

// POST - Criar produto (só funciona se MongoDB estiver conectado)
app.post('/api/produtos', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Banco de dados offline' });
    }

    const { name, desc, price, cat, imgUrl } = req.body;
    
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Offline - usando dados locais',
    message: 'API Artesanal Blend funcionando perfeitamente! 🍔'
  });
});

// Rota padrão
app.get('/', (req, res) => {
  res.json({ 
    message: '🍔 Artesanal Blend API Online!',
    status: 'Operacional',
    database: mongoose.connection.readyState === 1 ? 'Conectado ao MongoDB' : 'Modo offline',
    endpoints: {
      menu: '/api/menu',
      health: '/health',
      dashboard: '/dashboard'
    }
  });
});

// ========== DASHBOARD SIMPLES ==========

app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dashboard - Artesanal Blend</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          margin: 0;
        }
        .container { 
          max-width: 1000px; 
          margin: 0 auto; 
          background: white; 
          padding: 30px; 
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 { 
          color: #333; 
          text-align: center;
          margin-bottom: 30px;
        }
        .status { 
          padding: 15px; 
          border-radius: 10px; 
          margin: 20px 0; 
          text-align: center;
          font-weight: bold;
          font-size: 18px;
        }
        .connected { 
          background: #d4edda; 
          color: #155724; 
          border: 2px solid #c3e6cb;
        }
        .disconnected { 
          background: #f8d7da; 
          color: #721c24; 
          border: 2px solid #f5c6cb;
        }
        .endpoints {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin: 30px 0;
        }
        .endpoint-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          border-left: 4px solid #667eea;
        }
        .endpoint-card a {
          color: #667eea;
          text-decoration: none;
          font-weight: bold;
          font-size: 16px;
        }
        .endpoint-card a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🍔 Dashboard Artesanal Blend</h1>
        
        <div class="status ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}">
          📊 Status do Banco: ${mongoose.connection.readyState === 1 ? '✅ CONECTADO AO MONGODB' : '⚠️ OFFLINE - USANDO DADOS LOCAIS'}
        </div>

        <div class="endpoints">
          <div class="endpoint-card">
            <h3>📋 Cardápio</h3>
            <p><a href="/api/menu" target="_blank">Ver Produtos (API)</a></p>
          </div>
          
          <div class="endpoint-card">
            <h3>❤️ Saúde do Sistema</h3>
            <p><a href="/health" target="_blank">Status do Serviço</a></p>
          </div>
          
          <div class="endpoint-card">
            <h3>🏠 Página Inicial</h3>
            <p><a href="/" target="_blank">API Principal</a></p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #e9ecef; border-radius: 10px;">
          <h3>ℹ️ Informações</h3>
          <p>Sistema funcionando perfeitamente! 🎉</p>
          <p>O cardápio está disponível em <strong>/api/menu</strong></p>
          ${mongoose.connection.readyState !== 1 ? '<p><em>Para gerenciar produtos, verifique a conexão com o MongoDB Atlas.</em></p>' : ''}
        </div>
      </div>
    </body>
    </html>
  `);
});

// ========== INICIALIZAÇÃO ==========

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🍔 API: https://artesanal-blend.onrender.com`);
  console.log(`📊 Dashboard: https://artesanal-blend.onrender.com/dashboard`);
  console.log(`❤️  Health: https://artesanal-blend.onrender.com/health`);
});
