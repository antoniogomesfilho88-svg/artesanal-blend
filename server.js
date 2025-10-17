import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/artesanal-blend'
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Modelos
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    default: 'Geral'
  },
  ingredients: [{
    type: String
  }],
  available: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const OrderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const SupplySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  minQuantity: {
    type: Number,
    default: 0
  },
  cost: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const Supply = mongoose.model('Supply', SupplySchema);

// Rotas da API

// 🟢 PRODUTOS
app.get('/api/products', async (req, res) => {
  try {
    console.log('📦 Carregando produtos...');
    const products = await Product.find().sort({ createdAt: -1 });
    console.log(`✅ ${products.length} produtos carregados`);
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('❌ Erro ao carregar produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar produtos'
    });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    console.log('🆕 Criando novo produto:', req.body);
    
    const product = new Product(req.body);
    await product.save();
    
    console.log('✅ Produto criado com sucesso:', product._id);
    
    res.status(201).json({
      success: true,
      message: 'Produto salvo com sucesso!',
      data: product
    });
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao salvar produto: ' + error.message
    });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Produto atualizado com sucesso!',
      data: product
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao atualizar produto'
    });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Produto deletado com sucesso!'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar produto'
    });
  }
});

// 🟢 PEDIDOS
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('❌ Erro ao carregar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar pedidos'
    });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    await order.populate('items.product');
    
    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso!',
      data: order
    });
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao criar pedido'
    });
  }
});

// 🟢 INSUMOS
app.get('/api/supplies', async (req, res) => {
  try {
    const supplies = await Supply.find().sort({ name: 1 });
    
    res.json({
      success: true,
      data: supplies,
      count: supplies.length
    });
  } catch (error) {
    console.error('❌ Erro ao carregar insumos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar insumos'
    });
  }
});

app.post('/api/supplies', async (req, res) => {
  try {
    const supply = new Supply(req.body);
    await supply.save();
    
    res.status(201).json({
      success: true,
      message: 'Insumo salvo com sucesso!',
      data: supply
    });
  } catch (error) {
    console.error('❌ Erro ao criar insumo:', error);
    res.status(400).json({
      success: false,
      message: 'Erro ao salvar insumo'
    });
  }
});

// Rota de saúde da API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Artesanal Blend está funcionando!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'
  });
});

// Dados iniciais
const initializeData = async () => {
  try {
    // Verificar se já existem produtos
    const productCount = await Product.countDocuments();
    const supplyCount = await Supply.countDocuments();
    
    if (productCount === 0) {
      console.log('📝 Criando produtos iniciais...');
      await Product.create([
        {
          name: "Café Especial Artesanal",
          description: "Blend exclusivo da casa",
          price: 8.50,
          category: "Bebidas Quentes"
        },
        {
          name: "Capuccino Cremoso",
          description: "Com chocolate e canela",
          price: 12.00,
          category: "Bebidas Quentes"
        },
        {
          name: "Croissant de Manteiga",
          description: "Folhado e dourado",
          price: 6.50,
          category: "Salgados"
        }
      ]);
      console.log('✅ Produtos iniciais criados');
    }
    
    if (supplyCount === 0) {
      console.log('📝 Criando insumos iniciais...');
      await Supply.create([
        { name: "Grão de Café", unit: "kg", quantity: 10, minQuantity: 2, cost: 45.00 },
        { name: "Leite", unit: "L", quantity: 20, minQuantity: 5, cost: 8.50 },
        { name: "Açúcar", unit: "kg", quantity: 5, minQuantity: 1, cost: 12.00 }
      ]);
      console.log('✅ Insumos iniciais criados');
    }
  } catch (error) {
    console.error('❌ Erro ao criar dados iniciais:', error);
  }
};

// Inicializar servidor
const startServer = async () => {
  await connectDB();
  await initializeData();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Artesanal Blend rodando na porta ${PORT}`);
    console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Conectado' : '❌ Desconectado'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();
