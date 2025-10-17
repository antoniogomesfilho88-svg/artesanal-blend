import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 10000;

// ==================== CONFIGURAÇÃO ====================
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve arquivos estáticos (HTML, CSS, imagens)

// ==================== MONGODB ====================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/artesanal_blend';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB offline:', err.message));

// ==================== SCHEMAS ====================
const produtoSchema = new mongoose.Schema({
  nome: String,
  preco: Number,
  imagem: String
});
const insumoSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number
});
const pedidoSchema = new mongoose.Schema({
  clienteNome: String,
  clienteTelefone: String,
  clienteEndereco: String,
  clienteRegiao: String,
  pagamento: String,
  troco: Number,
  obsCliente: String,
  itens: Array,
  total: Number,
  status: { type: String, default: 'Pendente' },
  criadoEm: { type: Date, default: Date.now }
});

const Produto = mongoose.model('Produto', produtoSchema);
const Insumo = mongoose.model('Insumo', insumoSchema);
const Pedido = mongoose.model('Pedido', pedidoSchema);

// ==================== ROTAS ====================

// --- Produtos ---
app.get('/api/produtos', async (req, res) => {
  const produtos = await Produto.find().sort({nome:1});
  res.json(produtos);
});

app.post('/api/produtos', async (req, res) => {
  const novo = new Produto(req.body);
  await novo.save();
  await atualizarMenuJSON();
  res.json(novo);
});

app.put('/api/produtos/:id', async (req, res) => {
  const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await atualizarMenuJSON();
  res.json(produto);
});

app.delete('/api/produtos/:id', async (req, res) => {
  await Produto.findByIdAndDelete(req.params.id);
  await atualizarMenuJSON();
  res.json({ ok: true });
});

// --- Insumos ---
app.get('/api/insumos', async (req, res) => {
  const insumos = await Insumo.find().sort({nome:1});
  res.json(insumos);
});

app.post('/api/insumos', async (req, res) => {
  const novo = new Insumo(req.body);
  await novo.save();
  res.json(novo);
});

app.put('/api/insumos/:id', async (req, res) => {
  const insumo = await Insumo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(insumo);
});

app.delete('/api/insumos/:id', async (req, res) => {
  await Insumo.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// --- Pedidos ---
app.get('/api/pedidos', async (req, res) => {
  const pedidos = await Pedido.find().sort({ criadoEm: -1 });
  res.json(pedidos);
});

app.post('/api/pedidos', async (req, res) => {
  const novo = new Pedido(req.body);
  await novo.save();
  res.json(novo);
});

// --- Financeiro ---
app.get('/api/financeiro', async (req, res) => {
  const pedidos = await Pedido.find();
  const total = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
  res.json(total);
});

// ==================== FUNÇÃO DE SINCRONIZAÇÃO DO CARDÁPIO ====================
async function atualizarMenuJSON() {
  const produtos = await Produto.find();
  const menuJSON = {};

  produtos.forEach(prod => {
    let categoria = "Outros";
    if (prod.nome.toLowerCase().includes('hamburguer')) categoria = 'Hambúrgueres';
    else if (prod.nome.toLowerCase().includes('combo')) categoria = 'Combos';
    else if (prod.nome.toLowerCase().includes('bebida')) categoria = 'Bebidas';
    else if (prod.nome.toLowerCase().includes('acompanhamento')) categoria = 'Acompanhamentos';
    else if (prod.nome.toLowerCase().includes('adicional')) categoria = 'Adicionais';

    if (!menuJSON[categoria]) menuJSON[categoria] = [];
    menuJSON[categoria].push(prod);
  });

  fs.writeFileSync(path.join('.', 'menu.json'), JSON.stringify(menuJSON, null, 2));
  console.log('✅ menu.json atualizado');
}

// ==================== INICIALIZAÇÃO ====================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
