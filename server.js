// =========================================================
// Artesanal Blend - Backend COMPLETO
// =========================================================

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Todos os arquivos na raiz

// ---------------- CONEXÃO MONGO ----------------
mongoose.connect(
  process.env.MONGO_URI || 'mongodb+srv://SEU_USUARIO:senha@cluster.mongodb.net/artesanal-blend',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(()=>console.log('✅ MongoDB conectado'))
.catch(err=>console.log('⚠️ MongoDB offline:', err.message));

// ---------------- SCHEMAS ----------------
const produtoSchema = new mongoose.Schema({
  name: String,
  desc: String,
  price: Number,
  cat: String,
  imgUrl: String,
  insumos: [{ nome: String, quantidade: Number, unidade: String }]
});
const Produto = mongoose.model('Produto', produtoSchema);

const insumoSchema = new mongoose.Schema({
  nome: String,
  quantidade: Number,
  unidade: String,
  custoUnitario: Number
});
const Insumo = mongoose.model('Insumo', insumoSchema);

const pedidoSchema = new mongoose.Schema({
  itens: [{ produtoId: mongoose.Schema.Types.ObjectId, nome: String, quantidade: Number, precoUnitario: Number }],
  total: Number,
  cliente: String,
  data: { type: Date, default: Date.now }
});
const Pedido = mongoose.model('Pedido', pedidoSchema);

// ---------------- ROTAS ----------------

// Produtos
app.get('/api/menu', async (req,res)=>{ res.json(await Produto.find()); });
app.post('/api/menu/item', async (req,res)=>{ const p=new Produto(req.body); await p.save(); res.json({success:true,data:p}); });
app.put('/api/menu/item/:id', async (req,res)=>{ const p=await Produto.findByIdAndUpdate(req.params.id,req.body,{new:true}); res.json({success:true,data:p}); });
app.delete('/api/menu/item/:id', async (req,res)=>{ await Produto.findByIdAndDelete(req.params.id); res.json({success:true}); });

// Insumos
app.get('/api/insumos', async (req,res)=>{ res.json(await Insumo.find()); });
app.post('/api/insumos', async (req,res)=>{ const i=new Insumo(req.body); await i.save(); res.json({success:true,data:i}); });
app.put('/api/insumos/:id', async (req,res)=>{ const i=await Insumo.findByIdAndUpdate(req.params.id,req.body,{new:true}); res.json({success:true,data:i}); });
app.delete('/api/insumos/:id', async (req,res)=>{ await Insumo.findByIdAndDelete(req.params.id); res.json({success:true}); });

// Pedidos (PDV)
app.get('/api/pedidos', async (req,res)=>{ res.json(await Pedido.find().sort({data:-1})); });
app.post('/api/pedidos', async (req,res)=>{
  try{
    const pedido=new Pedido(req.body);
    await pedido.save();
    // Atualiza estoque
    for(const item of pedido.itens){
      const produto = await Produto.findById(item.produtoId);
      if(produto.insumos){
        for(const i of produto.insumos){
          await Insumo.updateOne({nome:i.nome}, {$inc:{quantidade:-i.quantidade * item.quantidade}});
        }
      }
    }
    res.json({success:true,data:pedido});
  }catch(err){ res.status(500).json({success:false,error:err.message}); }
});

// Estatísticas e financeiro
app.get('/api/stats', async (req,res)=>{
  try{
    const totalProdutos = await Produto.countDocuments();
    const totalPedidos = await Pedido.countDocuments();
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const pedidosHojeList = await Pedido.find({data: {$gte: hoje}});
    const pedidosHoje = pedidosHojeList.length;
    const vendasHoje = pedidosHojeList.reduce((acc,p)=>acc+p.total,0);
    res.json({ totalProdutos, totalPedidos, pedidosHoje, vendasHoje });
  }catch(err){ res.status(500).json({success:false,error:err.message}); }
});

// Servir dashboard
app.get('/', (req,res)=>{ res.sendFile(path.join(__dirname,'index.html')); });

// ---------------- 404 ----------------
app.use((req,res)=>{
  if(req.path.startsWith('/api/')) return res.status(404).json({success:false,message:`Endpoint ${req.path} não encontrado`});
  res.status(404).sendFile(path.join(__dirname,'index.html'));
});

// ---------------- INICIAR SERVIDOR ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`🚀 Servidor rodando na porta ${PORT}`));
