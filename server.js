const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("./"));

mongoose.connect("mongodb+srv://SEU_USUARIO:SUASENHA@cluster.mongodb.net/artesanalblend?retryWrites=true&w=majority")
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.log("⚠️ Erro MongoDB:", err));

// Schemas
const produtoSchema = new mongoose.Schema({
  nome: String,
  preco: Number,
  descricao: String,
  imagem: String
});
const insumoSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number,
  unidade: String,
  preco: Number
});
const pedidoSchema = new mongoose.Schema({
  cliente: String,
  total: Number,
  itens: [{ nome: String, preco: Number, qtd: Number }]
});

// Models
const Produto = mongoose.model("Produto", produtoSchema);
const Insumo = mongoose.model("Insumo", insumoSchema);
const Pedido = mongoose.model("Pedido", pedidoSchema);

// Rotas produtos
app.get("/api/produtos", async (req, res) => {
  const produtos = await Produto.find();
  res.json(produtos);
});
app.post("/api/produtos", async (req, res) => {
  const produto = new Produto(req.body);
  await produto.save();
  res.json({ message: "Produto adicionado" });
});

// Rotas insumos
app.get("/api/insumos", async (req, res) => {
  const insumos = await Insumo.find();
  res.json(insumos);
});
app.post("/api/insumos", async (req, res) => {
  const insumo = new Insumo(req.body);
  await insumo.save();
  res.json({ message: "Insumo adicionado" });
});

// Rotas pedidos
app.get("/api/pedidos", async (req, res) => {
  const pedidos = await Pedido.find();
  res.json(pedidos);
});
app.get("/api/pedidos/:id", async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);
  res.json(pedido);
});
app.post("/api/pedidos", async (req, res) => {
  const pedido = new Pedido(req.body);
  await pedido.save();
  res.json({ message: "Pedido registrado" });
});

// Financeiro
app.get("/api/financeiro", async (req, res) => {
  const pedidos = await Pedido.find();
  const insumos = await Insumo.find();
  const vendas = pedidos.reduce((acc, p) => acc + p.total, 0);
  const custos = insumos.reduce((acc, i) => acc + i.preco, 0);
  res.json({ vendas, custos, lucro: vendas - custos });
});

// Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
