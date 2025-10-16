import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser'; // Importação do cookie-parser
import cors from 'cors';

// Necessário para obter o __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações de Segurança
const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';
// Chave secreta para assinar o cookie de sessão. Configure no Render!
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'SUA_CHAVE_SECRETA_MUITO_LONGA_123456789'; 

// Middlewares
app.use(cors({ 
    origin: '*', 
    credentials: true 
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser(COOKIE_SECRET)); 
app.use(express.static(join(__dirname, 'public'))); // Assumindo que assets estão em 'public'

// ------------------------------------------------------------------
// ROTA 1: ROTA DE LOGIN
// ------------------------------------------------------------------
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        // Gera um cookie de sessão assinado (seguro)
        res.cookie('auth_session', 'loggedIn', { 
            signed: true, 
            httpOnly: true, // Não acessível via JS no navegador
            maxAge: 1000 * 60 * 60 * 24 // Expira em 24 horas
        });
        return res.json({ success: true, message: 'Login efetuado.' });
    } else {
        return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});

// ------------------------------------------------------------------
// ROTA 2: ROTA DE LOGOUT
// ------------------------------------------------------------------
app.post('/api/logout', (req, res) => {
    res.clearCookie('auth_session');
    return res.json({ success: true, message: 'Logout efetuado.' });
});

// ------------------------------------------------------------------
// ROTA 3: EXPORTAÇÃO (PROTEGIDA POR COOKIE DE SESSÃO)
// ------------------------------------------------------------------
app.post('/api/export', (req, res) => {
    // 1. Verifica a Sessão
    const isAuthenticated = req.signedCookies.auth_session === 'loggedIn';

    if (!isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Acesso não autorizado. Sessão inválida.' });
    }

    // 2. Continua com a lógica de salvar o arquivo
    const menuData = req.body;

    if (!menuData || !Array.isArray(menuData)) {
        return res.status(400).json({ success: false, message: 'Dados de menu inválidos.' });
    }

    // Ajuste o caminho para onde seu menu.json realmente está
    const filePath = join(__dirname, 'menu.json'); 
    // SE estiver dentro da pasta 'public', use: 
    // const filePath = join(__dirname, 'public', 'menu.json');

    // 3. Salvando o arquivo
    fs.writeFile(filePath, JSON.stringify(menuData, null, 2), (err) => {
        if (err) {
            console.error('Erro ao salvar menu.json:', err);
            return res.status(500).json({ success: false, message: 'Erro interno ao salvar o arquivo.' });
        }
        res.json({ success: true, message: 'menu.json atualizado no servidor!' });
    });
});


// ------------------------------------------------------------------
// Rotas de Conteúdo Estático
// ------------------------------------------------------------------
app.get('/dashboard.html', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'dashboard.html'));
});

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server rodando na porta ${PORT}`);
});
