const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// ======= MIDDLEWARES =======
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "/"))); // Servir arquivos na raiz

// ======= MONGODB =======
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://<usuario>:<senha>@cluster.mongodb.net/artesanalBlend?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("⚠️ MongoDB offline:", err));

// ======= MODELOS =======
const insumoSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number,
  unidade: String,
  custo: Number
});

const produtoSchema = new mongoose.Schema({
  nome: String,
  descricao: String,
  preco: Number,
  imagem: String,
  insumos: [{ nome: String, quantidade: Number }] // referência ao insumo e quantidade usada
});

const pedidoSchema = new mongoose.Schema({
  cliente: String,
  produto: String,
  quantidade: Number,
  preco: Number,
  criadoEm: { type: Date, default: Date.now }
});

const Insumo = mongoose.model("Insumo", insumoSchema);
const Produto = mongoose.model("Produto", produtoSchema);
const Pedido = mongoose.model("Pedido", pedidoSchema);

// ======= ROTAS =======

// Produtos
app.get("/api/produtos", async (req, res) => {
  const produtos = await Produto.find();
  res.json(produtos);
});

app.post("/api/produtos", async (req, res) => {
  const novoProduto = new Produto(req.body);
  await novoProduto.save();
  res.json(novoProduto);
});

app.put("/api/produtos/:id", async (req, res) => {
  const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(produto);
});

app.delete("/api/produtos/:id", async (req, res) => {
  await Produto.findByIdAndDelete(req.params.id);
  res.json({ message: "Produto deletado" });
});

// Insumos
app.get("/api/insumos", async (req, res) => {
  const insumos = await Insumo.find();
  res.json(insumos);
});

app.post("/api/insumos", async (req, res) => {
  const novoInsumo = new Insumo(req.body);
  await novoInsumo.save();
  res.json(novoInsumo);
});

app.put("/api/insumos/:id", async (req, res) => {
  const insumo = await Insumo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(insumo);
});

app.delete("/api/insumos/:id", async (req, res) => {
  await Insumo.findByIdAndDelete(req.params.id);
  res.json({ message: "Insumo deletado" });
});

// Pedidos
app.get("/api/pedidos", async (req, res) => {
  const pedidos = await Pedido.find().sort({ criadoEm: -1 });
  res.json(pedidos);
});

app.post("/api/pedidos", async (req, res) => {
  const novoPedido = new Pedido(req.body);
  await novoPedido.save();
  res.json(novoPedido);
});

app.delete("/api/pedidos/:id", async (req, res) => {
  await Pedido.findByIdAndDelete(req.params.id);
  res.json({ message: "Pedido deletado" });
});

// Relatório financeiro
app.get("/api/financeiro", async (req, res) => {
  const pedidos = await Pedido.find();
  const produtos = await Produto.find();
  const insumos = await Insumo.find();

  let totalVendas = 0;
  let totalCustos = 0;

  pedidos.forEach(p => {
    const produto = produtos.find(prod => prod.nome === p.produto);
    let custoProduto = 0;
    if (produto && produto.insumos.length) {
      produto.insumos.forEach(insumoUso => {
        const i = insumos.find(ins => ins.nome === insumoUso.nome);
        if (i) {
          const custoUnit = i.custo / i.quantidade;
          custoProduto += custoUnit * insumoUso.quantidade;
        }
      });
    }
    totalVendas += p.preco * p.quantidade;
    totalCustos += custoProduto * p.quantidade;
  });

  const lucro = totalVendas - totalCustos;
  res.json({ totalVendas, totalCustos, lucro });
});

// Servir dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// ======= START SERVER =======
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
