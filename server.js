const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// --- Conexão MongoDB ---
const mongoURI = 'SUA_URI_MONGODB_AQUI';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('⚠️ MongoDB offline', err));

// --- Schemas ---
const InsumoSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number,
  unidade: String,
  precoUnitario: Number
});
const Insumo = mongoose.model('Insumo', InsumoSchema);

const ProdutoSchema = new mongoose.Schema({
  nome: String,
  preco: Number,
  descricao: String,
  imagem: String,
  insumos: [{ insumo: { type: mongoose.Schema.Types.ObjectId, ref: 'Insumo' }, quantidade: Number }]
});
const Produto = mongoose.model('Produto', ProdutoSchema);

const PedidoSchema = new mongoose.Schema({
  cliente: {
    nome: String,
    telefone: String,
    endereco: String,
    regiao: String
  },
  itens: [{ produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto' }, quantidade: Number }],
  total: Number,
  pagamento: String,
  troco: Number,
  obs: String,
  criadoEm: { type: Date, default: Date.now }
});
const Pedido = mongoose.model('Pedido', PedidoSchema);

// --- Rotas API ---

// Produtos
app.get('/api/produtos', async (req, res) => {
  const produtos = await Produto.find().populate('insumos.insumo');
  res.json(produtos);
});

app.post('/api/produtos', async (req, res) => {
  const produto = new Produto(req.body);
  await produto.save();
  res.json(produto);
});

app.put('/api/produtos/:id', async (req, res) => {
  const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(produto);
});

app.delete('/api/produtos/:id', async (req, res) => {
  await Produto.findByIdAndDelete(req.params.id);
  res.json({ sucesso: true });
});

// Insumos
app.get('/api/insumos', async (req, res) => {
  const insumos = await Insumo.find();
  res.json(insumos);
});

app.post('/api/insumos', async (req, res) => {
  const insumo = new Insumo(req.body);
  await insumo.save();
  res.json(insumo);
});

app.put('/api/insumos/:id', async (req, res) => {
  const insumo = await Insumo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(insumo);
});

app.delete('/api/insumos/:id', async (req, res) => {
  await Insumo.findByIdAndDelete(req.params.id);
  res.json({ sucesso: true });
});

// Pedidos
app.get('/api/pedidos', async (req, res) => {
  const pedidos = await Pedido.find().populate('itens.produto');
  res.json(pedidos);
});

app.post('/api/pedidos', async (req, res) => {
  const pedido = new Pedido(req.body);
  await pedido.save();
  res.json(pedido);
});

// --- Dashboard financeiro
app.get('/api/financeiro', async (req, res) => {
  const pedidos = await Pedido.find().populate('itens.produto');
  let totalVendas = 0;
  let totalCusto = 0;

  pedidos.forEach(p => {
    totalVendas += p.total;
    p.itens.forEach(i => {
      const custoItem = i.produto.insumos.reduce((acc, ins) => acc + (ins.insumo.precoUnitario * ins.quantidade), 0);
      totalCusto += custoItem * i.quantidade;
    });
  });

  res.json({ totalVendas, totalCusto, lucro: totalVendas - totalCusto });
});

// --- Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
