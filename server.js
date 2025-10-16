const app = express();
const port = process.env.PORT || 3000;

// Configuração para ES Modules para obter o __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: '*', credentials: true })); // Ajuste a origem se necessário

// Servir arquivos estáticos (HTML, JS, CSS do painel)
app.use(express.static(join(__dirname, 'public')));

// ==================================================================
// SIMULAÇÃO DE BANCO DE DADOS (CARREGAMENTO DOS JSONs)
// ==================================================================

// Função genérica para carregar JSON de forma segura
function loadJSON(fileName) {
    try {
        const filePath = join(__dirname, fileName);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return []; // Retorna array vazio se o arquivo não existir
    } catch (error) {
        console.error(`Erro ao carregar ${fileName}:`, error);
        return [];
    }
}

// ==================================================================
// ROTAS DE SEGURANÇA (MANTIDAS SIMPLES)
// ==================================================================

const SECRET_PASSWORD = process.env.ADMIN_PASS || '1234'; // Use variável de ambiente!

app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === 'admin' && pass === SECRET_PASSWORD) {
        // Define um cookie de sessão simples (auth_session=true)
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
    // O status 401 é crucial para o Front-end saber que a sessão expirou
    res.status(401).json({ success: false, message: 'Sessão expirada. Faça login novamente.' });
}

// ==================================================================
// ROTAS DE LEITURA (GET)
// ==================================================================

app.get('/api/menu', (req, res) => {
    const menu = loadJSON('menu.json');
    res.json(menu);
});

app.get('/api/insumos', (req, res) => {
    const insumos = loadJSON('insumos.json');
    res.json(insumos);
});

app.get('/api/composicoes', (req, res) => {
    const composicoes = loadJSON('composicoes.json');
    res.json(composicoes);
});


// ==================================================================
// ROTAS DE ESCRITA (POST) - AQUI ESTÁ A CORREÇÃO PRINCIPAL ❗
// ==================================================================

// 1. Rota de Exportação do Menu (Chamada pela função 'exportMenuOnly' para salvamento instantâneo)
app.post('/api/export', isAuthenticated, (req, res) => {
    const menuData = req.body;
    const filePath = join(__dirname, 'menu.json');

    try {
        fs.writeFileSync(filePath, JSON.stringify(menuData, null, 2));
        res.json({ success: true, message: 'Menu salvo com sucesso!' });
    } catch (error) {
        console.error("ERRO CRÍTICO (RENDER/PERMISSÃO) - menu.json:", error);
        // Retorna um status 500 com a mensagem de erro para o Front-end
        res.status(500).json({ 
            success: false, 
            message: `Erro de Servidor ao salvar menu. Verifique os logs do Render. Detalhe: ${error.code}` 
        });
    }
});

// 2. Rota de Exportação de Insumos
app.post('/api/insumos/export', isAuthenticated, (req, res) => {
    const insumosData = req.body;
    const filePath = join(__dirname, 'insumos.json');

    try {
        fs.writeFileSync(filePath, JSON.stringify(insumosData, null, 2));
        res.json({ success: true, message: 'Insumos salvos com sucesso!' });
    } catch (error) {
        console.error("ERRO CRÍTICO (RENDER/PERMISSÃO) - insumos.json:", error);
        res.status(500).json({ 
            success: false, 
            message: `Erro de Servidor ao salvar insumos. Detalhe: ${error.code}` 
        });
    }
});

// 3. Rota de Exportação de Composições (Fichas Técnicas)
app.post('/api/composicoes/export', isAuthenticated, (req, res) => {
    const composicoesData = req.body;
    const filePath = join(__dirname, 'composicoes.json');

    try {
        fs.writeFileSync(filePath, JSON.stringify(composicoesData, null, 2));
        res.json({ success: true, message: 'Composições salvas com sucesso!' });
    } catch (error) {
        console.error("ERRO CRÍTICO (RENDER/PERMISSÃO) - composicoes.json:", error);
        res.status(500).json({ 
            success: false, 
            message: `Erro de Servidor ao salvar composições. Detalhe: ${error.code}` 
        });
    }
});


// ==================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ==================================================================

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
