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

// ========== ROTAS DA API ==========

// Rota 1: Página inicial redireciona para index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota 2: API do Cardápio - LISTAR
app.get('/api/menu', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const produtos = await Produto.find().sort({ id: 1 });
      res.json(produtos);
    } else {
      res.json(menuLocal);
    }
  } catch (err) {
    res.json(menuLocal);
  }
});

// Rota 3: CRIAR produto
app.post('/api/produtos', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Banco de dados offline' });
    }

    const { name, desc, price, cat, imgUrl } = req.body;
    
    // Encontrar próximo ID
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

// Rota 4: ATUALIZAR produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Banco de dados offline' });
    }

    const { name, desc, price, cat, imgUrl } = req.body;
    
    const produto = await Produto.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { 
        name, 
        desc, 
        price: parseFloat(price), 
        cat, 
        imgUrl 
      },
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

// Rota 5: DELETAR produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Banco de dados offline' });
    }

    const produto = await Produto.findOneAndDelete({ id: parseInt(req.params.id) });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ message: 'Produto deletado com sucesso', deletedId: produto.id });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota 6: Status do sistema (health check)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Offline',
    message: 'API Artesanal Blend funcionando!'
  });
});

// Rota 7: Dashboard Admin
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dashboard - Artesanal Blend</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .form-section, .products-section { margin-bottom: 40px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
        button { background: #FF6B6B; color: white; padding: 12px 25px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #e55a5a; }
        .product-item { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
        .status { padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center; font-weight: bold; }
        .connected { background: #d4edda; color: #155724; }
        .disconnected { background: #f8d7da; color: #721c24; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🍔 Dashboard Artesanal Blend</h1>
        
        <div class="status ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}">
          Banco de dados: ${mongoose.connection.readyState === 1 ? '✅ CONECTADO' : '⚠️ OFFLINE'}
        </div>

        <div class="form-section">
          <h3>➕ Adicionar Novo Produto</h3>
          <form id="productForm">
            <div class="form-group">
              <label>Nome do Produto:</label>
              <input type="text" id="productName" required>
            </div>
            <div class="form-group">
              <label>Descrição:</label>
              <textarea id="productDesc" required></textarea>
            </div>
            <div class="form-group">
              <label>Preço (R$):</label>
              <input type="number" id="productPrice" step="0.01" required>
            </div>
            <div class="form-group">
              <label>Categoria:</label>
              <select id="productCat" required>
                <option value="">Selecione...</option>
                <option value="Hambúrgueres">Hambúrgueres</option>
                <option value="Combos">Combos</option>
                <option value="Acompanhamentos">Acompanhamentos</option>
                <option value="Adicionais">Adicionais</option>
                <option value="Bebidas">Bebidas</option>
              </select>
            </div>
            <div class="form-group">
              <label>URL da Imagem (opcional):</label>
              <input type="text" id="productImgUrl" placeholder="ex: imagem.jpg">
            </div>
            <button type="submit">Adicionar Produto</button>
          </form>
        </div>

        <div class="products-section">
          <h3>📋 Produtos Cadastrados</h3>
          <button onclick="loadProducts()">🔄 Atualizar Lista</button>
          <div id="productsList"></div>
        </div>
      </div>

      <script>
        // Adicionar produto
        document.getElementById('productForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const productData = {
            name: document.getElementById('productName').value,
            desc: document.getElementById('productDesc').value,
            price: document.getElementById('productPrice').value,
            cat: document.getElementById('productCat').value,
            imgUrl: document.getElementById('productImgUrl').value
          };

          try {
            const response = await fetch('/api/produtos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(productData)
            });

            if (response.ok) {
              alert('✅ Produto adicionado com sucesso!');
              document.getElementById('productForm').reset();
              loadProducts();
            } else {
              const error = await response.json();
              alert('❌ Erro: ' + (error.error || 'Erro ao adicionar produto'));
            }
          } catch (error) {
            alert('❌ Erro de conexão com o servidor');
          }
        });

        // Carregar produtos
        async function loadProducts() {
          try {
            const response = await fetch('/api/menu');
            const products = await response.json();
            
            const container = document.getElementById('productsList');
            container.innerHTML = '';
            
            if (products.length === 0) {
              container.innerHTML = '<p>Nenhum produto cadastrado.</p>';
              return;
            }
            
            products.forEach(product => {
              const productDiv = document.createElement('div');
              productDiv.className = 'product-item';
              productDiv.innerHTML = \`
                <strong>\${product.name}</strong> - R$ \${product.price.toFixed(2)}
                <br><small>\${product.desc}</small>
                <br><small>Categoria: \${product.cat}</small>
                <br><small>ID: \${product.id}</small>
                <button onclick="deleteProduct(\${product.id})" style="background: #dc3545;">Deletar</button>
              \`;
              container.appendChild(productDiv);
            });
          } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            alert('Erro ao carregar produtos');
          }
        }

        // Deletar produto
        async function deleteProduct(id) {
          if (confirm('Tem certeza que deseja deletar este produto?')) {
            try {
              const response = await fetch(\`/api/produtos/\${id}\`, {
                method: 'DELETE'
              });

              if (response.ok) {
                alert('✅ Produto deletado com sucesso!');
                loadProducts();
              } else {
                const error = await response.json();
                alert('❌ Erro: ' + (error.error || 'Erro ao deletar produto'));
              }
            } catch (error) {
              alert('❌ Erro de conexão');
            }
          }
        }

        // Carregar produtos ao abrir a página
        loadProducts();
      </script>
    </body>
    </html>
  `);
});

// --- Rota final (para outras páginas HTML) ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Iniciar servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🚀 Servidor rodando na porta \${PORT}\`);
  console.log(\`🍔 Cardápio: http://localhost:\${PORT}\`);
  console.log(\`📊 Dashboard: http://localhost:\${PORT}/dashboard\`);
  console.log(\`📋 API: http://localhost:\${PORT}/api/menu\`);
});
