// ==============================
//  Artesanal Blend - Backend API (ES Modules)
// ==============================

import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cors from 'cors';

dotenv.config();

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
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage do Multer para Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
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

    const imageUrl = req.file.path;

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
    message: 'API Artesanal Blend Online!',
    endpoints: {
      menu: '/api/menu',
      upload: '/api/upload-image',
      produtos: '/api/produtos',
      health: '/health'
    }
  });
});

// ========== INICIALIZAÇÃO ==========

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🍔 API Menu: http://localhost:${PORT}/api/menu`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Erro não tratado:', err);
  process.exit(1);
});
