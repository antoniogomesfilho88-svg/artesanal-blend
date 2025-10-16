import express from 'express';
// Importação dos módulos necessários do MongoDB
import { MongoClient, ObjectId } from 'mongodb'; 
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// ==================================================================
// CONFIGURAÇÃO INICIAL
// ==================================================================

const app = express();
// O Render define a porta através da variável de ambiente PORT
const port = process.env.PORT || 3000;

// Configuração para ES Modules para obter o __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middlewares
app.use(express.json());
app.use(cookieParser());
// Permite conexões de qualquer origem durante o desenvolvimento
app.use(cors({ origin: '*', credentials: true })); 

// ==================================================================
// CONFIGURAÇÃO E CONEXÃO COM O MONGODB
// ==================================================================

// Obtém a URL de conexão do MongoDB Atlas da variável de ambiente MONGO_URL
const uri = process.env.MONGO_URL; 
const client = new MongoClient(uri); 

// Nomes das coleções no banco de dados
const dbName = 'artesanalBlendDB'; 
const collections = {
    menu: 'menuItems', 
    insumos: 'insumos', 
    composicoes: 'composicoes'
};

let db; // Variável para a conexão ativa com o banco de dados

// Função para Iniciar o Servidor e Conectar ao DB
async function run() {
    try {
        await client.connect();
        db = client.db(dbName);
        console.log("🎉 Conectado com sucesso ao MongoDB Atlas!"); // Log de sucesso

        // ------------------------------------------
        // INICIALIZAÇÃO DO SERVIDOR HTTP (APÓS CONEXÃO COM O BANCO)
        // ------------------------------------------
        app.listen(port, () => {
            console.log(`Servidor Node.js rodando na porta ${port}`);
        });

    } catch (error) {
        console.error("❌ ERRO CRÍTICO ao conectar ao MongoDB ou iniciar o servidor:", error);
        // Encerra o processo em caso de falha crítica na conexão
        process.exit(1); 
    }
}

// Inicia a aplicação
run();

// ==================================================================
// ROTAS DE SEGURANÇA E AUTENTICAÇÃO
// ==================================================================

const SECRET_PASSWORD = process.env.ADMIN_PASS || '1234'; 

app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === 'admin' && pass === SECRET_PASSWORD) {
        // Define o cookie de sessão seguro
        res.cookie('auth_session', 'true', { 
            httpOnly: true, 
            maxAge: 3600000, // 1 hora
            // Importante: Usar "secure" em produção (Render usa HTTPS)
            secure: process.env.NODE_ENV === 'production' 
        });
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
// ROTAS DE API (GET/POST) - PRIORIDADE MÁXIMA
// Estas rotas devem vir antes de qualquer rota estática ou fallback (resolve Cannot GET)
// ==================================================================

// ROTA DE TESTE 
app.get('/teste', (req, res) => {
    res.send("O servidor está vivo e esta rota funciona!");
});


// ----------------------------------------------------
// ROTAS DE LEITURA (GET) - LENDO DO MONGODB
// ----------------------------------------------------

app.get('/api/menu', async (req, res) => {
    try {
        const data = await db.collection(collections.menu).find({}).toArray();
        res.json(data);
    } catch (error) {
        console.error("Erro ao ler menu do DB:", error);
        res.status(500).json({ error: 'Falha ao buscar dados do cardápio.' });
    }
});

app.get('/api/insumos', async (req, res) => {
    try {
        const data = await db.collection(collections.insumos).find({}).toArray();
        res.json(data);
    } catch (error) {
        console.error("Erro ao ler insumos do DB:", error);
        res.status(500).json({ error: 'Falha ao buscar dados de insumos.' });
    }
});

app.get('/api/composicoes', async (req, res) => {
    try {
        const data = await db.collection(collections.composicoes).find({}).toArray();
        res.json(data);
    } catch (error) {
        console.error("Erro ao ler composições do DB:", error);
        res.status(500).json({ error: 'Falha ao buscar dados de composições.' });
    }
});


// ----------------------------------------------------
// ROTAS DE ESCRITA (POST) - ESCREVENDO NO MONGODB
// ----------------------------------------------------

app.post('/api/export', isAuthenticated, async (req, res) => {
    try {
        const newMenuData = req.body; 
        const collection = db.collection(collections.menu);
        
        // Substitui todos os documentos existentes no menu pela nova lista
        await collection.deleteMany({});
        
        if (newMenuData.length > 0) {
             await collection.insertMany(newMenuData);
        }

        res.json({ success: true, message: 'Menu salvo no MongoDB com sucesso!' });
    } catch (error) {
        console.error("ERRO CRÍTICO (ESCRITA NO MONGODB) - menu:", error);
        res.status(500).json({ success: false, message: 'Erro de Servidor: Falha ao salvar no banco de dados.' });
    }
});

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

// ==================================================================
// SERVIÇO DE ARQUIVOS ESTÁTICOS E ROTA DE FALLBACK
// ==================================================================

// Servir arquivos estáticos (HTML, JS, CSS do painel)
// Isso deve vir após as rotas de API para evitar conflitos
app.use(express.static(join(__dirname)));

// ROTA FALLBACK (Catch-All):
// Qualquer requisição que não foi tratada pelas rotas /api/* ou /teste
// será redirecionada para o index.html (seu frontend principal).
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});
