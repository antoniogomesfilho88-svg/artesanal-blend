// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ===== MongoDB Connection =====
// O fallback local foi removido para forçar o uso da MONGO_URI do Atlas
const MONGO_URI = process.env.MONGO_URI;

// DEBUG - Verificar se a variável está sendo lida
console.log('🔍 DEBUG MongoDB Configuration:');
console.log('MONGO_URI defined:', !!MONGO_URI);
console.log('MONGO_URI value:', MONGO_URI ? '***' + MONGO_URI.slice(-20) : 'undefined');

// Configuração melhorada para MongoDB Atlas
const connectToMongo = () => {
    if (MONGO_URI) {
        mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // retryWrites: true, (removido pois pode não ser necessário dependendo da versão do Mongoose/Atlas)
            // w: 'majority', (removido pois pode não ser necessário dependendo da versão do Mongoose/Atlas)
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        })
        .then(() => {
            console.log('✅ MongoDB conectado com sucesso!');
            console.log('📊 Database:', mongoose.connection.db?.databaseName);
        })
        .catch(err => {
            console.error('❌ ERRO MongoDB:', err.message);
            console.log('📝 Usando armazenamento local (JSON files)');
            // Força o status de desconexão para o middleware de fallback
            mongoose.connection.readyState = 0; 
        });
    } else {
        console.error('❌ ERRO: Variável MONGO_URI não está definida.');
        console.log('📝 Usando armazenamento local (JSON files)');
        // Força o status de desconexão
        mongoose.connection.readyState = 0; 
    }
};

connectToMongo(); // Chama a função de conexão

// ===== Schemas =====
const ProdutoSchema = new mongoose.Schema({
    nome: String,
    preco: Number,
    descricao: String,
    imagem: String,
    categoria: String,
    disponivel: { type: Boolean, default: true },
    ingredientes: [String],
    tempoPreparo: Number
}, { timestamps: true });

const InsumoSchema = new mongoose.Schema({
    nome: String,
    quantidade: Number,
    unidade: String,
    preco: Number,
    minimo: Number
}, { timestamps: true });

const PedidoSchema = new mongoose.Schema({
    cliente: String,
    telefone: String,
    endereco: String,
    regiao: String,
    taxaEntrega: Number,
    itens: [{
        nome: String,
        quantidade: Number,
        preco: Number,
        categoria: String
    }],
    total: Number,
    formaPagamento: String,
    troco: Number,
    observacao: String,
    status: { type: String, default: 'pendente' }
}, { timestamps: true });

const Produto = mongoose.model('Produto', ProdutoSchema);
const Insumo = mongoose.model('Insumo', InsumoSchema);
const Pedido = mongoose.model('Pedido', PedidoSchema);

// ===== Funções de Fallback (Local Storage) =====
const getLocalData = (file) => {
    try {
        const filePath = path.join(__dirname, `${file}.json`);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        return [];
    }
};

const saveLocalData = (file, data) => {
    try {
        fs.writeFileSync(path.join(__dirname, `${file}.json`), JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        return false;
    }
};

// ===== Middleware para verificar conexão MongoDB =====
const checkMongoDB = (req, res, next) => {
    // readyState === 1 significa 'connected'
    req.useMongoDB = mongoose.connection.readyState === 1;
    next();
};

// =========================================================
//                  Rotas Públicas (Cardápio)
// =========================================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API para o cardápio
app.get('/api/cardapio', checkMongoDB, async (req, res) => {
    try {
        let produtos = [];
        if (req.useMongoDB) {
            produtos = await Produto.find({ disponivel: true });
        } else {
            // Usando 'produtos' como fallback se for a mesma estrutura
            produtos = getLocalData('produtos'); 
        }

        const cardapioFormatado = {
            "Hambúrgueres": produtos.filter(p => p.categoria === 'Hambúrgueres'),
            "Combos": produtos.filter(p => p.categoria === 'Combos'),
            "Acompanhamentos": produtos.filter(p => p.categoria === 'Acompanhamentos'),
            "Adicionais": produtos.filter(p => p.categoria === 'Adicionais'),
            "Bebidas": produtos.filter(p => p.categoria === 'Bebidas')
        };
        res.json(cardapioFormatado);
        
    } catch (error) {
        console.error('Erro ao carregar cardápio:', error);
        // Em caso de erro, tenta o fallback novamente
        res.json(getLocalData('produtos') || {}); 
    }
});

// =========================================================
//                    Rotas do Dashboard
// =========================================================

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ===== API Menu (Produtos) - Rotas unificadas com o Dashboard (Inglês) =====

// GET /api/menu (Lista todos os produtos para o Dashboard)
app.get('/api/menu', checkMongoDB, async (req, res) => {
    try {
        if (req.useMongoDB) {
            const produtos = await Produto.find().sort({ categoria: 1, nome: 1 });
            // Mapeia _id para id para compatibilidade com o frontend
            const produtosFormatados = produtos.map(p => ({
                ...p._doc,
                id: p._id
            }));
            res.json(produtosFormatados);
        } else {
            res.json(getLocalData('produtos'));
        }
    } catch (error) {
        console.error('Erro ao listar menu:', error);
        res.status(500).json(getLocalData('produtos'));
    }
});


// POST /api/menu/item (Criação de novo produto) - Corrigido o 404
app.post('/api/menu/item', checkMongoDB, async (req, res) => {
    try {
        if (req.useMongoDB) {
            const produto = new Produto(req.body);
            await produto.save();
            res.status(201).json({ success: true, produto: { ...produto._doc, id: produto._id } });
        } else {
            const produtos = getLocalData('produtos');
            const novoItem = {
                ...req.body,
                _id: new mongoose.Types.ObjectId().toString(),
                id: Date.now().toString(),
                createdAt: new Date()
            };
            produtos.push(novoItem);
            saveLocalData('produtos', produtos);
            res.status(201).json({ success: true, produto: novoItem });
        }
    } catch (error) {
        console.error('Erro ao salvar item do menu:', error);
        res.status(500).json({ error: 'Erro ao salvar produto' });
    }
});

// PUT /api/menu/item/:id (Atualização de produto)
app.put('/api/menu/item/:id', checkMongoDB, async (req, res) => {
    try {
        const id = req.params.id;
        if (req.useMongoDB) {
            const produto = await Produto.findByIdAndUpdate(id, req.body, { new: true });
            if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
            res.json({ success: true, produto: { ...produto._doc, id: produto._id } });
        } else {
            const produtos = getLocalData('produtos');
            const index = produtos.findIndex(p => p._id === id || p.id === id);
            if (index !== -1) {
                produtos[index] = { ...produtos[index], ...req.body, updatedAt: new Date() };
                saveLocalData('produtos', produtos);
                res.json({ success: true, produto: produtos[index] });
            } else {
                res.status(404).json({ error: 'Produto não encontrado' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

// DELETE /api/menu/item/:id (Exclusão de produto)
app.delete('/api/menu/item/:id', checkMongoDB, async (req, res) => {
    try {
        const id = req.params.id;
        if (req.useMongoDB) {
            const result = await Produto.findByIdAndDelete(id);
            if (!result) return res.status(404).json({ error: 'Produto não encontrado' });
            res.json({ success: true });
        } else {
            const produtos = getLocalData('produtos');
            const produtosFiltrados = produtos.filter(p => p._id !== id && p.id !== id);
            saveLocalData('produtos', produtosFiltrados);
            res.json({ success: true });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir produto' });
    }
});


// ===== API Insumos (Mantendo o nome em Português, ajuste se o Dashboard usar 'supplies') =====
// Estas rotas não foram renomeadas, pois não tínhamos erros delas no log.
app.get('/api/insumos', checkMongoDB, async (req, res) => {
    try {
        if (req.useMongoDB) {
            const insumos = await Insumo.find();
            res.json(insumos);
        } else {
            res.json(getLocalData('insumos'));
        }
    } catch (error) {
        res.json(getLocalData('insumos'));
    }
});

app.post('/api/insumos', checkMongoDB, async (req, res) => {
    try {
        if (req.useMongoDB) {
            const insumo = new Insumo(req.body);
            await insumo.save();
            res.json({ success: true, insumo });
        } else {
            const insumos = getLocalData('insumos');
            const novoInsumo = {
                ...req.body,
                _id: new mongoose.Types.ObjectId().toString(),
                createdAt: new Date()
            };
            insumos.push(novoInsumo);
            saveLocalData('insumos', insumos);
            res.json({ success: true, insumo: novoInsumo });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar insumo' });
    }
});

app.put('/api/insumos/:id', checkMongoDB, async (req, res) => {
    try {
        const id = req.params.id;
        if (req.useMongoDB) {
            const insumo = await Insumo.findByIdAndUpdate(id, req.body, { new: true });
            res.json({ success: true, insumo });
        } else {
            const insumos = getLocalData('insumos');
            const index = insumos.findIndex(i => i._id === id);
            if (index !== -1) {
                insumos[index] = { ...insumos[index], ...req.body, updatedAt: new Date() };
                saveLocalData('insumos', insumos);
                res.json({ success: true, insumo: insumos[index] });
            } else {
                res.status(404).json({ error: 'Insumo não encontrado' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar insumo' });
    }
});

app.delete('/api/insumos/:id', checkMongoDB, async (req, res) => {
    try {
        const id = req.params.id;
        if (req.useMongoDB) {
            await Insumo.findByIdAndDelete(id);
            res.json({ success: true });
        } else {
            const insumos = getLocalData('insumos');
            const insumosFiltrados = insumos.filter(i => i._id !== id);
            saveLocalData('insumos', insumosFiltrados);
            res.json({ success: true });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir insumo' });
    }
});

// ===== API Pedidos - Rotas unificadas com o Dashboard (Inglês) =====

app.get('/api/orders', checkMongoDB, async (req, res) => {
    try {
        if (req.useMongoDB) {
            const pedidos = await Pedido.find().sort({ createdAt: -1 });
            res.json(pedidos);
        } else {
            res.json(getLocalData('orders'));
        }
    } catch (error) {
        res.json(getLocalData('orders'));
    }
});

app.post('/api/orders', checkMongoDB, async (req, res) => {
    try {
        if (req.useMongoDB) {
            const pedido = new Pedido(req.body);
            await pedido.save();
            res.json({ success: true, pedido });
        } else {
            const pedidos = getLocalData('orders');
            const novoPedido = {
                ...req.body,
                _id: new mongoose.Types.ObjectId().toString(),
                createdAt: new Date()
            };
            pedidos.push(novoPedido);
            saveLocalData('orders', pedidos);
            res.json({ success: true, pedido: novoPedido });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar pedido' });
    }
});

app.put('/api/orders/:id', checkMongoDB, async (req, res) => {
    try {
        const id = req.params.id;
        if (req.useMongoDB) {
            const pedido = await Pedido.findByIdAndUpdate(id, req.body, { new: true });
            res.json({ success: true, pedido });
        } else {
            const pedidos = getLocalData('orders');
            const index = pedidos.findIndex(p => p._id === id);
            if (index !== -1) {
                pedidos[index] = { ...pedidos[index], ...req.body, updatedAt: new Date() };
                saveLocalData('orders', pedidos);
                res.json({ success: true, pedido: pedidos[index] });
            } else {
                res.status(404).json({ error: 'Pedido não encontrado' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar pedido' });
    }
});

// ===== API Estatísticas - Rotas unificadas com o Dashboard (Inglês) =====

app.get('/api/stats', checkMongoDB, async (req, res) => {
    try {
        let pedidos, insumos;

        if (req.useMongoDB) {
            pedidos = await Pedido.find();
            insumos = await Insumo.find();
        } else {
            pedidos = getLocalData('orders');
            insumos = getLocalData('insumos');
        }

        // Calcula as métricas
        const vendas = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
        const gastos = insumos.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
        const lucro = vendas - gastos;

        // Retorna o formato esperado para estatísticas (stats)
        res.json({ vendas, gastos, lucro });

    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao carregar dados financeiros' });
    }
});

// ===== Debug Route =====
app.get('/debug', (req, res) => {
    res.json({
        status: 'OK',
        mongoConnected: mongoose.connection.readyState === 1,
        mongoUriConfigured: !!process.env.MONGO_URI,
        timestamp: new Date().toISOString()
    });
});

// ===== Health Check =====
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        mongoConnected: mongoose.connection.readyState === 1,
        environment: process.env.NODE_ENV || 'development'
    });
});

// ===== Servidor =====
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Cardápio: https://artesanal-blend.onrender.com`);
    console.log(`📊 Dashboard: https://artesanal-blend.onrender.com/dashboard`);
    console.log(`❤️  Health: https://artesanal-blend.onrender.com/health`);
    console.log(`🐛 Debug: https://artesanal-blend.onrender.com/debug`);
});
