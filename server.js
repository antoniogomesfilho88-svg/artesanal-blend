import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir os arquivos estáticos (HTML, CSS, JS, imagens)

// =============================
// ROTAS DO SISTEMA
// =============================

// Página principal (cardápio)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "índice.html"));
});

// Página do painel administrativo (dashboard)
app.get("/painel", (req, res) => {
  res.sendFile(path.join(__dirname, "painel.html"));
});

// =============================
// API - Cardápio (menu.json)
// =============================
app.get("/api/menu", (req, res) => {
  const filePath = path.join(__dirname, "menu.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Erro ao carregar o cardápio" });
    res.json(JSON.parse(data));
  });
});

app.post("/api/menu", (req, res) => {
  const filePath = path.join(__dirname, "menu.json");
  fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
    if (err) return res.status(500).json({ error: "Erro ao salvar o cardápio" });
    res.json({ success: true });
  });
});

// =============================
// API - Pedidos (orders.json)
// =============================
app.get("/api/pedidos", (req, res) => {
  const filePath = path.join(__dirname, "pedidos.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Erro ao carregar pedidos" });
    res.json(JSON.parse(data));
  });
});

app.post("/api/pedidos", (req, res) => {
  const filePath = path.join(__dirname, "pedidos.json");
  const pedido = req.body;

  fs.readFile(filePath, "utf8", (err, data) => {
    let pedidos = [];
    if (!err && data) pedidos = JSON.parse(data);

    pedidos.push(pedido);
    fs.writeFile(filePath, JSON.stringify(pedidos, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Erro ao registrar pedido" });
      res.json({ success: true });
    });
  });
});

// =============================
// SERVIDOR ONLINE
// =============================
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${port}`);
});
