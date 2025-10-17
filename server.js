// ==============================
//  Artesanal Blend - Backend API
// ==============================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conectar ao MongoDB Atlas
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/artesanal-blend', {
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

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage do Multer para Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'artesanal_blend',
    allowed_formats: ['jpg', 'png', 'webp', 'jpeg', 'gif'],
    transformation: [
      { width: 800, height: 600, crop: "limit", quality: "auto" }
    ]
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  }
});

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

// GET - Buscar produto por ID
app.get('/api/produtos/:id', async (req, res) => {
  try {
    const produto = await Produto.findOne({ id: parseInt(req.params.id) });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar novo produto
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

// DELETE - Deletar produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const produto = await Produto.findOneAndDelete({ id: parseInt(req.params.id) });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Opcional: Deletar imagem do Cloudinary também
    if (produto.imgUrl && produto.imgUrl.includes('cloudinary')) {
      const publicId = produto.imgUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`artesanal_blend/${publicId}`);
    }
    
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========== UPLOAD DE IMAGENS ==========

// POST - Upload de imagem para produto existente
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'ID do produto é obrigatório' });
    }

    const imageUrl = req.file.path; // URL do Cloudinary

    // Atualizar produto com nova imagem
    const produto = await Produto.findOneAndUpdate(
      { id: parseInt(productId) },
      { $set: { imgUrl: imageUrl } },
      { new: true }
    );

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ 
      success: true, 
      message: 'Imagem uploadada com sucesso!',
      produto,
      imageUrl 
    });
    
  } catch (err) {
    console.error('Erro no upload:', err);
    res.status(500).json({ error: 'Erro no upload da imagem' });
  }
});

// POST - Criar produto com imagem
app.post('/api/produtos-com-imagem', upload.single('image'), async (req, res) => {
  try {
    const { name, desc, price, cat } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Imagem é obrigatória' });
    }

    // Próximo ID
    const ultimoProduto = await Produto.findOne().sort({ id: -1 });
    const nextId = ultimoProduto ? ultimoProduto.id + 1 : 1;

    const imageUrl = req.file.path;

    const novoProduto = new Produto({
      id: nextId,
      name,
      desc,
      price: parseFloat(price),
      cat,
      imgUrl: imageUrl
    });

    await novoProduto.save();
    res.status(201).json(novoProduto);
    
  } catch (err) {
    console.error('Erro ao criar produto com imagem:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========== ROTA DE PEDIDOS ==========

const pedidoSchema = new mongoose.Schema({
  cliente: {
    nome: String,
    telefone: String,
    endereco: String,
    regiao: String
  },
  itens: [{
    nome: String,
    quantidade: Number,
    preco: Number
  }],
  total: Number,
  taxaEntrega: Number,
  pagamento: String,
  observacoes: String,
  status: { type: String, default: 'Recebido' },
  data: { type: Date, default: Date.now }
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

// POST - Receber pedido do WhatsApp
app.post('/api/pedidos', async (req, res) => {
  try {
    const { cliente, itens, total, taxaEntrega, pagamento, observacoes } = req.body;
    
    const novoPedido = new Pedido({
      cliente,
      itens,
      total: parseFloat(total),
      taxaEntrega: parseFloat(taxaEntrega || 0),
      pagamento,
      observacoes
    });

    await novoPedido.save();
    
    // Aqui você pode integrar com:
    // - Webhook para Discord/Telegram
    // - Email de notificação
    // - Etc.
    
    res.status(201).json({ 
      success: true, 
      message: 'Pedido recebido com sucesso!',
      pedido: novoPedido 
    });
    
  } catch (err) {
    console.error('Erro ao salvar pedido:', err);
    res.status(500).json({ error: 'Erro ao processar pedido' });
  }
});

// GET - Listar pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ data: -1 });
    res.json(pedidos);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========== ROTAS DO DASHBOARD ==========

// Servir página do dashboard
app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'
  });
});

// ========== INICIALIZAÇÃO ==========

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🍔 API Menu: http://localhost:${PORT}/api/menu`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Erro não tratado:', err);
  process.exit(1);
});
