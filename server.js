import express from 'express';
// 1. IMPORTAÇÃO DO CLIENTE MONGODB
import { MongoClient, ObjectId } from 'mongodb'; 
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// import fs from 'fs'; // <-- REMOVIDO: Não precisamos mais do sistema de arquivos
import cookieParser from 'cookie-parser';
import cors from 'cors';

// ==================================================================
// CONFIGURAÇÃO INICIAL E ACESSO AO DIRETÓRIO
// ==================================================================

const app = express();
const port = process.env.PORT || 3000;

// Configuração para ES Modules para obter o __dirname (caminho absoluto)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: '*', credentials: true })); 

// Servir arquivos estáticos (HTML, JS, CSS do painel) - Assumindo que estão na raiz
app.use(express.static(join(__dirname)));

// ==================================================================
// CONFIGURAÇÃO E CONEXÃO COM O MONGODB
// ==================================================================

// 2. USA A VARIÁVEL DE AMBIENTE MONGO_URL
const uri = process.env.MONGO_URL; 
const client = new MongoClient(uri); 

// Nomes das coleções no banco de dados
const dbName = 'artesanalBlendDB'; 
const collections = {
    menu: 'menuItems', 
    insumos: 'insumos', 
    composicoes: 'composicoes'
};

let db; // Variável para a conexão ativa

// Função para Iniciar o Servidor e Conectar ao DB
async function run() {
    try {
        await client.connect();
        db = client.db(dbName);
        console.log("🎉 Conectado com sucesso ao MongoDB Atlas!");

        // ------------------------------------------
        // INICIALIZAÇÃO DO SERVIDOR HTTP (APÓS CONEXÃO COM O BANCO)
        // ------------------------------------------
        app.listen(port, () => {
            console.log(`Servidor Node.js rodando na porta ${port}`);
        });

    } catch (error) {
        console.error("❌ ERRO CRÍTICO ao conectar ao MongoDB ou iniciar o servidor:", error);
        process.exit(1); 
    }
}

// Inicia a aplicação
run();

// ==================================================================
// ROTAS DE SEGURANÇA E AUTENTICAÇÃO (MANTIDAS)
// ==================================================================

const SECRET_PASSWORD = process.env.ADMIN_PASS || '1234'; 

app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === 'admin' && pass === SECRET_PASSWORD) {
        res.cookie('auth_session', 'true', { httpOnly: true, maxAge: 3600000 });
        return res.json({ success: true, message: 'Login realizado!' });
    }
    res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('auth_session');
    res.json({ success: true });
});

// Middleware de Autenticação para todas as rotas de edição
function isAuthenticated(req, res, next) {
    if (req.cookies.auth_session === 'true') {
        return next();
    }
    res.status(401).json({ success: false, message: 'Sessão expirada. Faça login novamente.' });
}

// ==================================================================
// ROTAS DE LEITURA (GET) - LENDO DO MONGODB
// ==================================================================

app.get('/api/menu', async (req, res) => {
    try {
        // Busca todos os documentos da coleção 'menuItems'
        const data = await db.collection(collections.menu).find({}).toArray();
        res.json(data);
    } catch (error) {
        console.error("Erro ao ler menu do DB:", error);
        res.status(500).json([]);
    }
});

app.get('/api/insumos', async (req, res) => {
    try {
        // Busca todos os documentos da coleção 'insumos'
        const data = await db.collection(collections.insumos).find({}).toArray();
        res.json(data);
    } catch (error) {
        console.error("Erro ao ler insumos do DB:", error);
        res.status(500).json([]);
    }
});

app.get('/api/composicoes', async (req, res) => {
    try {
        // Busca todos os documentos da coleção 'composicoes'
        const data = await db.collection(collections.composicoes).find({}).toArray();
        res.json(data);
    } catch (error) {
        console.error("Erro ao ler composições do DB:", error);
        res.status(500).json([]);
    }
});


// ==================================================================
// ROTAS DE ESCRITA (POST) - ESCREVENDO NO MONGODB
// ==================================================================

// 1. Rota de Exportação do Menu (POST /api/export)
app.post('/api/export', isAuthenticated, async (req, res) => {
    try {
        const newMenuData = req.body; // Array de itens do menu

        const collection = db.collection(collections.menu);
        
        // 1. Deleta todo o conteúdo anterior (simulando a substituição do arquivo JSON)
        await collection.deleteMany({});
        
        // 2. Insere os novos dados (se o array não estiver vazio)
        if (newMenuData.length > 0) {
             await collection.insertMany(newMenuData);
        }

        res.json({ success: true, message: 'Menu salvo no MongoDB com sucesso!' });
    } catch (error) {
        console.error("ERRO CRÍTICO (ESCRITA NO MONGODB) - menu:", error);
        res.status(500).json({ success: false, message: 'Erro de Servidor: Falha ao salvar no banco de dados.' });
    }
});

// 2. Rota de Exportação de Insumos (POST /api/insumos/export)
app.post('/api/insumos/export', isAuthenticated, async (req, res) => {
    try {
        const newInsumosData = req.body;

        const collection = db.collection(collections.insumos);
        
        await collection.deleteMany({});
        
        if (newInsumosData.length > 0) {
             await collection.insertMany(newInsumosData);
        }

        res.json({ success: true, message: 'Insumos salvos no MongoDB com sucesso!' });
    } catch (error) {
        console.error("ERRO CRÍTICO (ESCRITA NO MONGODB) - insumos:", error);
        res.status(500).json({ success: false, message: 'Erro de Servidor: Falha ao salvar no banco de dados.' });
    }
});

// 3. Rota de Exportação de Composições (POST /api/composicoes/export)
app.post('/api/composicoes/export', isAuthenticated, async (req, res) => {
    try {
        const newComposicoesData = req.body;

        const collection = db.collection(collections.composicoes);
        
        await collection.deleteMany({});
        
        if (newComposicoesData.length > 0) {
             await collection.insertMany(newComposicoesData);
        }

        res.json({ success: true, message: 'Composições salvas no MongoDB com sucesso!' });
    } catch (error) {
        console.error("ERRO CRÍTICO (ESCRITA NO MONGODB) - composicoes:", error);
        res.status(500).json({ success: false, message: 'Erro de Servidor: Falha ao salvar no banco de dados.' });
    }
});
