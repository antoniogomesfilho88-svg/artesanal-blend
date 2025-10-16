import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
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
app.use(cors({ origin: '*', credentials: true })); // Permite conexões do seu front-end

// Servir arquivos estáticos (HTML, JS, CSS do painel) - Assumindo que estão em 'public'
app.use(express.static(join(__dirname)));

// ==================================================================
// SIMULAÇÃO DE BANCO DE DADOS (CARREGAMENTO DOS JSONs)
// ==================================================================

// Função genérica e SEGURA para carregar JSONs na inicialização
function loadJSON(fileName) {
    try {
        // Usa join para garantir o caminho absoluto correto, evitando falhas de inicialização
        const filePath = join(__dirname, fileName); 
        
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            // Se o arquivo estiver vazio, retorna um objeto vazio para evitar erro de JSON.parse
            return data ? JSON.parse(data) : {}; 
        }
        // Retorna array ou objeto vazio se o arquivo não existir (evita crash)
        return []; 
    } catch (error) {
        // Se houver qualquer erro na leitura ou parsing (JSON corrompido), loga e retorna vazio
        console.error(`ERRO CRÍTICO ao carregar ${fileName}. Arquivo corrompido ou inacessível:`, error.message);
        return []; 
    }
}

// Carregamento inicial dos dados. O servidor não trava se os arquivos falharem.
let menuData = loadJSON('menu.json');
let insumosData = loadJSON('insumos.json');
let composicoesData = loadJSON('composicoes.json');

// ==================================================================
// ROTAS DE SEGURANÇA E AUTENTICAÇÃO
// ==================================================================

const SECRET_PASSWORD = process.env.ADMIN_PASS || '1234'; // USE VARIÁVEL DE AMBIENTE!

app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === 'admin' && pass === SECRET_PASSWORD) {
        res.cookie('auth_session', 'true', { httpOnly: true, maxAge: 3600000 }); // 1 hora
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
    // Retorna 401 para que o front-end saiba que a sessão expirou
    res.status(401).json({ success: false, message: 'Sessão expirada. Faça login novamente.' });
}

// ==================================================================
// ROTAS DE LEITURA (GET)
// ==================================================================

app.get('/api/menu', (req, res) => {
    res.json(menuData);
});

app.get('/api/insumos', (req, res) => {
    res.json(insumosData);
});

app.get('/api/composicoes', (req, res) => {
    res.json(composicoesData);
});


// ==================================================================
// ROTAS DE ESCRITA (POST) - CORREÇÃO DE SALVAMENTO INSTANTÂNEO ❗
// ==================================================================

// Função genérica e SEGURA para salvar JSONs
function saveJSON(fileName, data) {
    // Usa join para garantir o caminho absoluto correto para ESCRITA
    const filePath = join(__dirname, fileName); 
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 1. Rota de Exportação do Menu (Chamada pela edição instantânea)
app.post('/api/export', isAuthenticated, (req, res) => {
    try {
        menuData = req.body; // Atualiza a variável local
        saveJSON('menu.json', menuData);
        res.json({ success: true, message: 'Menu salvo com sucesso!' });
    } catch (error) {
        console.error("ERRO CRÍTICO (ESCRITA NO RENDER) - menu.json:", error);
        res.status(500).json({ 
            success: false, 
            message: `Erro de Servidor: Falha na permissão de escrita (${error.code}). Verifique o Render.` 
        });
    }
});

// 2. Rota de Exportação de Insumos
app.post('/api/insumos/export', isAuthenticated, (req, res) => {
    try {
        insumosData = req.body;
        saveJSON('insumos.json', insumosData);
        res.json({ success: true, message: 'Insumos salvos com sucesso!' });
    } catch (error) {
        console.error("ERRO CRÍTICO (ESCRITA NO RENDER) - insumos.json:", error);
        res.status(500).json({ success: false, message: `Erro de Servidor: Falha na permissão de escrita (${error.code})` });
    }
});

// 3. Rota de Exportação de Composições (Fichas Técnicas)
app.post('/api/composicoes/export', isAuthenticated, (req, res) => {
    try {
        composicoesData = req.body;
        saveJSON('composicoes.json', composicoesData);
        res.json({ success: true, message: 'Composições salvas com sucesso!' });
    } catch (error) {
        console.error("ERRO CRÍTICO (ESCRITA NO RENDER) - composicoes.json:", error);
        res.status(500).json({ success: false, message: `Erro de Servidor: Falha na permissão de escrita (${error.code})` });
    }
});


// ==================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ==================================================================

app.listen(port, () => {
    console.log(`Servidor Node.js rodando na porta ${port}`);
});

