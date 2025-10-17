// ==============================
//  Artesanal Blend - Servidor COMPLETO
// ==============================

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;
const __dirname = process.cwd();
const menuFile = path.join(__dirname, "menu.json");
const ordersFile = path.join(__dirname, "orders.json");

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ========== FUNÇÕES AUXILIARES ==========
function readMenu() {
  if (!fs.existsSync(menuFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(menuFile, "utf-8"));
  } catch {
    return [];
  }
}

function saveMenu(data) {
  fs.writeFileSync(menuFile, JSON.stringify(data, null, 2));
}

function readOrders() {
  if (!fs.existsSync(ordersFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(ordersFile, "utf-8"));
  } catch {
    return [];
  }
}

function saveOrders(data) {
  fs.writeFileSync(ordersFile, JSON.stringify(data, null, 2));
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
app.get("/api/menu", (req, res) => {
  res.json(readMenu());
});

// ✅ API - Atualizar cardápio
app.post("/api/menu", (req, res) => {
  try {
    const novoMenu = req.body;
    saveMenu(novoMenu);
    console.log("✅ Cardápio atualizado via dashboard");
    res.json({ success: true, message: "Cardápio atualizado!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API - Pedidos
app.get("/api/orders", (req, res) => {
  res.json(readOrders());
});

app.post("/api/order", (req, res) => {
  try {
    const order = req.body;
    if (!order || !order.itens || !order.total) {
      return res.status(400).json({ error: "Formato inválido de pedido." });
    }

    const orders = readOrders();
    const novo = {
      id: orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1,
      data: new Date().toISOString(),
      ...order,
    };

    orders.push(novo);
    saveOrders(orders);
    console.log("✅ Novo pedido recebido:", novo);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API - Estatísticas para o dashboard
app.get("/api/stats", (req, res) => {
  const menu = readMenu();
  const orders = readOrders();
  
  const hoje = new Date().toISOString().split('T')[0];
  const pedidosHoje = orders.filter(o => o.data.includes(hoje));
  
  const stats = {
    totalProdutos: menu.length,
    totalPedidos: orders.length,
    pedidosHoje: pedidosHoje.length,
    vendasHoje: pedidosHoje.reduce((sum, o) => sum + o.total, 0),
    categorias: menu.reduce((acc, item) => {
      acc[item.cat] = (acc[item.cat] || 0) + 1;
      return acc;
    }, {})
  };
  
  res.json(stats);
});

app.listen(PORT, () =>
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`)
);
