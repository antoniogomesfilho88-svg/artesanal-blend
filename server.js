// ==============================
//  Artesanal Blend - Servidor Unificado
//  Serve o site + menu.json + API de pedidos
// ==============================

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;
const __dirname = process.cwd();
const ordersFile = path.join(__dirname, "orders.json");

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // ✅ Serve index.html, imagens e menu.json

// Funções auxiliares
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

// ✅ Rota principal (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ Rota de pedidos
app.get("/orders", (req, res) => {
  res.json(readOrders());
});

app.post("/order", (req, res) => {
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

app.listen(PORT, () =>
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`)
);
