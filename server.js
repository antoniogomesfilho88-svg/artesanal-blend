import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser'; 
import cors from 'cors';

// Necessário para obter o __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações de Segurança
const ADMIN_USER = 'admin'; // Seu usuário de login
const ADMIN_PASS = '1234';  // Sua senha de login
// Chave secreta para assinar o cookie de sessão. Configure no Render!
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'SUA_CHAVE_SECRETA_MUITO_LONGA_123456789'; 

// Middlewares
app.use(cors({ 
    origin: '*', 
    credentials: true 
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser(COOKIE_SECRET)); 

// CORREÇÃO: Serve arquivos estáticos (HTML, CSS, JS, Imagens) da raiz do projeto
app.use(express.static(__dirname)); 


// ==================================================================
// ROTAS DA API
// ==================================================================

// ROTA 1: ROTA DE LOGIN
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        // Gera um cookie de sessão assinado (seguro)
        res.cookie('auth_session', 'loggedIn', { 
            signed: true, 
            httpOnly: true, 
            maxAge: 1000 * 60 * 60 * 24 
        });
        return res.json({ success: true, message: 'Login efetuado.' });
    } else {
        return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});

// ROTA 2: ROTA DE LOGOUT
app.post('/api/logout', (req, res) => {
    res.clearCookie('auth_session');
    return res.json({ success: true, message: 'Logout efetuado.' });
});

// ROTA 3: OBTER CARDÁPIO (NOVO: Para carregar os dados no dashboard e no cardápio principal)
app.get('/api/menu', (req, res) => {
    const filePath = join(__dirname, 'menu.json'); 

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler menu.json:', err);
            return res.status(500).json({ success: false, message: 'Erro interno ao carregar o cardápio.' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    });
});

// ROTA 4: EXPORTAÇÃO (PROTEGIDA POR COOKIE DE SESSÃO)
app.post('/api/export', (req, res) => {
    // 1. Verifica a Sessão
    const isAuthenticated = req.signedCookies.auth_session === 'loggedIn';

    if (!isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Acesso não autorizado. Sessão inválida.' });
    }

    // ROTA 5: OBTER LISTA DE INSUMOS (API)
app.get('/api/insumos', (req, res) => {
    const filePath = join(__dirname, 'insumos.json'); 

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler insumos.json:', err);
            return res.status(500).json({ success: false, message: 'Erro interno ao carregar insumos.' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    });
});


// ROTA 6: EXPORTAÇÃO DE INSUMOS (PROTEGIDA POR SESSÃO)
app.post('/api/insumos/export', (req, res) => {
    // 1. Verifica a Sessão
    const isAuthenticated = req.signedCookies.auth_session === 'loggedIn';

    if (!isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Acesso não autorizado. Sessão inválida.' });
    }

    // 2. Continua com a lógica de salvar o arquivo
    const insumosData = req.body;

    if (!insumosData || !Array.isArray(insumosData)) {
        return res.status(400).json({ success: false, message: 'Dados de insumos inválidos.' });
    }

    // Caminho para salvar insumos.json na raiz
    const filePath = join(__dirname, 'insumos.json'); 

    // 3. Salvando o arquivo
    fs.writeFile(filePath, JSON.stringify(insumosData, null, 2), (err) => {
        if (err) {
            console.error('Erro ao salvar insumos.json:', err);
            return res.status(500).json({ success: false, message: 'Erro interno ao salvar o arquivo.' });
        }
        res.json({ success: true, message: 'insumos.json atualizado no servidor!' });
    });
});

    // 2. Continua com a lógica de salvar o arquivo
    const menuData = req.body;

    if (!menuData || !Array.isArray(menuData)) {
        return res.status(400).json({ success: false, message: 'Dados de menu inválidos.' });
    }

    // Caminho para salvar menu.json na raiz
    const filePath = join(__dirname, 'menu.json'); 

    // 3. Salvando o arquivo
    fs.writeFile(filePath, JSON.stringify(menuData, null, 2), (err) => {
        if (err) {
            console.error('Erro ao salvar menu.json:', err);
            return res.status(500).json({ success: false, message: 'Erro interno ao salvar o arquivo.' });
        }
        res.json({ success: true, message: 'menu.json atualizado no servidor!' });
    });
});


// ==================================================================
// ROTAS DE SERVIÇO DE ARQUIVOS HTML (CORRIGIDO PARA RAIZ)
// ==================================================================

// Serve o dashboard.html (Ex: acessando /dashboard.html)
app.get('/dashboard.html', (req, res) => {
    res.sendFile(join(__dirname, 'dashboard.html'));
});

// Serve o index.html (Ex: acessando a URL principal /)
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server rodando na porta ${PORT}`);
});

