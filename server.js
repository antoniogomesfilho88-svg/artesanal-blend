// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/artesanal_blend";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Erro MongoDB:", err));

// Schemas
const InsumoSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number,
  unidade: String,
  custoUnitario: Number
});

const ProdutoSchema = new mongoose.Schema({
  nome: String,
  preco: Number,
  imagem: String,
  descricao: String,
  insumos: [InsumoSchema]
});

const PedidoSchema = new mongoose.Schema({
  produtos: [{ produtoId: mongoose.Schema.Types.ObjectId, quantidade: Number }],
  total: Number,
  cliente: {
    nome: String,
    telefone: String,
    endereco: String,
    regiao: String
  },
  pagamento: String,
  troco: Number,
  obs: String,
  data: { type: Date, default: Date.now }
});

const Produto = mongoose.model("Produto", ProdutoSchema);
const Pedido = mongoose.model("Pedido", PedidoSchema);
const Insumo = mongoose.model("Insumo", InsumoSchema);

// Rotas de Produtos
app.get("/produtos", async (req, res) => {
  const produtos = await Produto.find();
  res.json(produtos);
});

app.post("/produtos", async (req, res) => {
  const produto = new Produto(req.body);
  await produto.save();
  res.json(produto);
});

app.put("/produtos/:id", async (req, res) => {
  const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(produto);
});

app.delete("/produtos/:id", async (req, res) => {
  await Produto.findByIdAndDelete(req.params.id);
  res.json({ message: "Produto removido" });
});

// Rotas de Insumos
app.get("/insumos", async (req, res) => {
  const insumos = await Insumo.find();
  res.json(insumos);
});

app.post("/insumos", async (req, res) => {
  const insumo = new Insumo(req.body);
  await insumo.save();
  res.json(insumo);
});

app.put("/insumos/:id", async (req, res) => {
  const insumo = await Insumo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(insumo);
});

app.delete("/insumos/:id", async (req, res) => {
  await Insumo.findByIdAndDelete(req.params.id);
  res.json({ message: "Insumo removido" });
});

// Rotas de Pedidos
app.get("/pedidos", async (req, res) => {
  const pedidos = await Pedido.find().sort({ data: -1 });
  res.json(pedidos);
});

app.post("/pedidos", async (req, res) => {
  const pedido = new Pedido(req.body);
  await pedido.save();
  res.json(pedido);
});

// Relatório Financeiro
app.get("/financeiro", async (req, res) => {
  const pedidos = await Pedido.find();
  const produtos = await Produto.find();

  let receitaTotal = 0;
  let custoTotal = 0;

  pedidos.forEach(pedido => {
    receitaTotal += pedido.total;
    pedido.produtos.forEach(item => {
      const produto = produtos.find(p => p._id.equals(item.produtoId));
      if (produto) {
        let custoProduto = 0;
        produto.insumos.forEach(insumo => {
          custoProduto += insumo.custoUnitario * (insumo.quantidade / 1); // ajusta unidade se necessário
        });
        custoTotal += custoProduto * item.quantidade;
      }
    });
  });

  res.json({
    receitaTotal,
    custoTotal,
    lucro: receitaTotal - custoTotal,
    totalPedidos: pedidos.length
  });
});

// Inicializa servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
