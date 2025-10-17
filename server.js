// ==============================
//  Artesanal Blend - Servidor PARA RENDER + ATLAS
// ==============================

import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = process.cwd();

// ✅ Configuração MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/artesanal-blend";
const DB_NAME = "artesanal-blend";
const MENU_COLLECTION = "menu";
const ORDERS_COLLECTION = "orders";

let db, menuCollection, ordersCollection;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ========== CONEXÃO MONGODB ==========
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    menuCollection = db.collection(MENU_COLLECTION);
    ordersCollection = db.collection(ORDERS_COLLECTION);
    console.log("✅ Conectado ao MongoDB Atlas");
  } catch (error) {
    console.error("❌ Erro ao conectar MongoDB:", error);
  }
}

// ========== ROTAS DA API ==========

// ✅ Rota principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ Dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// ✅ API - Obter cardápio
app.get("/api/menu", async (req, res) => {
  try {
    const menu = await menuCollection.find({}).toArray();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ API - Atualizar cardápio
app.post("/api/menu", async (req, res) => {
  try {
    const novoMenu = req.body;
    
    // Limpar coleção e inserir novos dados
    await menuCollection.deleteMany({});
    if (novoMenu.length > 0) {
      await menuCollection.insertMany(novoMenu);
    }
    
    console.log("✅ Cardápio atualizado no MongoDB Atlas");
    res.json({ success: true, message: "Cardápio atualizado!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API - Adicionar item individual
app.post("/api/menu/item", async (req, res) => {
  try {
    const item = req.body;
    const result = await menuCollection.insertOne(item);
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ API - Atualizar item
app.put("/api/menu/item/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const result = await menuCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ API - Deletar item
app.delete("/api/menu/item/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await menuCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ API - Pedidos
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await ordersCollection.find({}).sort({ data: -1 }).toArray();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/order", async (req, res) => {
  try {
    const order = req.body;
    if (!order || !order.itens || !order.total) {
      return res.status(400).json({ error: "Formato inválido de pedido." });
    }

    const novoPedido = {
      ...order,
      data: new Date().toISOString(),
      status: "pendente"
    };

    const result = await ordersCollection.insertOne(novoPedido);
    console.log("✅ Novo pedido salvo no MongoDB:", result.insertedId);
    res.json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API - Estatísticas
app.get("/api/stats", async (req, res) => {
  try {
    const totalProdutos = await menuCollection.countDocuments();
    const totalPedidos = await ordersCollection.countDocuments();
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const pedidosHoje = await ordersCollection.find({
      data: { $gte: hoje.toISOString() }
    }).toArray();
    
    const vendasHoje = pedidosHoje.reduce((sum, o) => sum + o.total, 0);
    
    // Estatísticas por categoria
    const categorias = await menuCollection.aggregate([
      { $group: { _id: "$cat", count: { $sum: 1 } } }
    ]).toArray();
    
    const stats = {
      totalProdutos,
      totalPedidos,
      pedidosHoje: pedidosHoje.length,
      vendasHoje,
      categorias: categorias.reduce((acc, cat) => {
        acc[cat._id] = cat.count;
        return acc;
      }, {})
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Health Check para Render
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    database: db ? "Connected" : "Disconnected"
  });
});

// Inicializar servidor
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  });
}

startServer();
