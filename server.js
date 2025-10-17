import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve arquivos estáticos

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/artesanal_blend';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB offline:', err.message));

// SCHEMAS
const produtoSchema = new mongoose.Schema({ nome: String, preco: Number, imagem: String });
const insumoSchema = new mongoose.Schema({ nome: String, quantidade: Number });
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

// ROTAS - PRODUTOS
app.get('/api/produtos', async (req, res) => res.json(await Produto.find()));
app.post('/api/produtos', async (req, res) => {
  const novo = new Produto(req.body); await novo.save(); await atualizarMenuJSON(); res.json(novo);
});
app.put('/api/produtos/:id', async (req, res) => {
  const produto = await Produto.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await atualizarMenuJSON(); res.json(produto);
});
app.delete('/api/produtos/:id', async (req, res) => {
  await Produto.findByIdAndDelete(req.params.id); await atualizarMenuJSON(); res.json({ ok: true });
});

// ROTAS - INSUMOS
app.get('/api/insumos', async (req, res) => res.json(await Insumo.find()));
app.post('/api/insumos', async (req, res) => res.json(await new Insumo(req.body).save()));
app.put('/api/insumos/:id', async (req, res) => res.json(await Insumo.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/insumos/:id', async (req, res) => { await Insumo.findByIdAndDelete(req.params.id); res.json({ ok: true }); });

// ROTAS - PEDIDOS
app.get('/api/pedidos', async (req, res) => res.json(await Pedido.find().sort({ criadoEm: -1 })));
app.post('/api/pedidos', async (req, res) => res.json(await new Pedido(req.body).save()));

// ROTAS - FINANCEIRO
app.get('/api/financeiro', async (req, res) => {
  const pedidos = await Pedido.find();
  const total = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
  res.json(total);
});

// FUNÇÃO PARA ATUALIZAR MENU.JSON
async function atualizarMenuJSON() {
  const produtos = await Produto.find();
  const menuJSON = {};
  produtos.forEach(prod => {
    let categoria = "Outros";
    const n = prod.nome.toLowerCase();
    if (n.includes('hamburguer')) categoria = 'Hambúrgueres';
    else if (n.includes('combo')) categoria = 'Combos';
    else if (n.includes('bebida')) categoria = 'Bebidas';
    else if (n.includes('acompanhamento')) categoria = 'Acompanhamentos';
    else if (n.includes('adicional')) categoria = 'Adicionais';
    if (!menuJSON[categoria]) menuJSON[categoria] = [];
    menuJSON[categoria].push(prod);
  });
  fs.writeFileSync(path.join('.', 'menu.json'), JSON.stringify(menuJSON, null, 2));
  console.log('✅ menu.json atualizado');
}

app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
