<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

// ==================================================================
    // VARIÁVEIS GLOBAIS E ELEMENTOS DOM 
    // ==================================================================
    let produtos = []; 
    let insumos = []; 
    let logged = false;
    // Variável que armazena a composição de TODOS os produtos (estrutura: { produtoId: [{insumoId, uso}] })
    let composicoes = {}; 
    let currentProductComposition = []; 
    let currentProductId = null; 

    // Elementos de Segurança
    const loginModal = document.getElementById('login-screen');
    const loginUser = document.getElementById('loginUser');
    const loginPass = document.getElementById('loginPass');
    const doLoginBtn = document.getElementById('doLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const currentUser = document.getElementById('currentUser');
    
    // Tabelas
    const menuTbody = document.getElementById('menu-tbody');
    const insumosTbody = document.getElementById('insumos-tbody'); 

    // Modais e Formulários (Inicialização dos objetos Bootstrap - ESSENCIAL!)
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    const insumoModal = new bootstrap.Modal(document.getElementById('insumoModal'));
    const compositionModal = new bootstrap.Modal(document.getElementById('compositionModal'));
    
    const saveProductBtn = document.getElementById('saveProductBtn');
    const saveInsumoBtn = document.getElementById('saveInsumoBtn');

    // ELEMENTOS DO MODAL DE INSUMO (PARA CÁLCULO)
    const insumoPrecoTotal = document.getElementById('insumoPrecoTotal');
    const insumoQuantidadeKg = document.getElementById('insumoQuantidadeKg');
    const insumoCusto = document.getElementById('insumoCusto');
    const insumoUnidade = document.getElementById('insumoUnidade'); 

    // ELEMENTOS DO MODAL DE COMPOSIÇÃO (FICHA TÉCNICA)
    const compInsumoSelect = document.getElementById('compInsumoSelect');
    const compInsumoUso = document.getElementById('compInsumoUso');
    const compositionTbody = document.getElementById('composition-tbody');
    const compositionProductName = document.getElementById('compositionProductName');
    const totalCostDisplay = document.getElementById('totalCostDisplay');
    
    // ==================================================================
    // FUNÇÕES DE NAVEGAÇÃO E UX
    // ==================================================================
    
    function showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId + '-section').style.display = 'block';

        const titleMap = {
            'products': 'Gerenciamento de Produtos',
            'insumos': 'Gestão de Insumos',
            'financeiro': 'Visão Financeira'
        };
        document.getElementById('main-title').innerText = titleMap[sectionId] || 'Dashboard';
        
        document.querySelectorAll('#sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    }

    // ==================================================================
    // FUNÇÕES DE MANIPULAÇÃO DE DADOS (PRODUTOS)
    // ==================================================================
    
    async function loadMenu() {
        try {
            const response = await fetch("/api/menu", { cache: "no-store" });
            if (!response.ok) { throw new Error(`Erro: ${response.status}`); }
            produtos = await response.json(); 
            render(); 
        } catch (e) {
            console.error("Erro ao carregar cardápio:", e);
            produtos = []; 
            render();
        }
    }
    
    function render() {
        menuTbody.innerHTML = '';
        if (produtos.length === 0) {
            menuTbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum produto cadastrado.</td></tr>';
            return;
        }

        produtos.forEach(p => {
            const custo = calculateProductCost(p.id); 
            
            const row = menuTbody.insertRow();
            row.innerHTML = `
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>R$ ${Number(p.price).toFixed(2)}</td>
                <td>R$ ${custo.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="openCompositionModal(${p.id}, '${p.name.replace(/'/g, "\\'")}')" title="Gerenciar Ficha Técnica">
                        <i class="fas fa-receipt"></i> Ficha
                    </button>
                    <button class="btn btn-sm btn-warning me-1" onclick="editP(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="delP(${p.id})"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
    }
    
    function openAddProductModal() {
        document.getElementById('productModalLabel').innerText = 'Adicionar Novo Produto';
        document.getElementById('product-form').reset(); 
        document.getElementById('productId').value = ''; 
        productModal.show();
    }

    function editP(id) {
        const produto = produtos.find(p => p.id === id);
        if (!produto) return;

        document.getElementById('productModalLabel').innerText = 'Editar Produto';
        
        document.getElementById('productId').value = produto.id;
        document.getElementById('productName').value = produto.name;
        document.getElementById('productPrice').value = produto.price;
        document.getElementById('productCat').value = produto.cat;
        document.getElementById('productDesc').value = produto.desc || '';
        document.getElementById('productImgUrl').value = produto.imgUrl || '';

        productModal.show();
    }

    // ==================================================================
    // FUNÇÃO CORRIGIDA: Salva e Exporta IMEDIATAMENTE (como iFood)
    // ==================================================================
    saveProductBtn.onclick = async () => {
        const id = document.getElementById('productId').value;
        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const cat = document.getElementById('productCat').value;
        const desc = document.getElementById('productDesc').value;
        const imgUrl = document.getElementById('productImgUrl').value;
        
        if (!name || isNaN(price) || !cat) {
            alert("Nome, Preço e Categoria são obrigatórios.");
            return;
        }

        let isNew = false;
        
        if (id) {
            const index = produtos.findIndex(p => p.id == id);
            if (index !== -1) {
                produtos[index] = { ...produtos[index], name, price, cat, desc, imgUrl };
            }
        } else {
            const newId = produtos.length > 0 ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
            produtos.push({ id: newId, name, price, cat, desc, imgUrl });
            isNew = true;
        }

        render();
        productModal.hide();

        // Tenta salvar no servidor Imediatamente
        alert(isNew ? "Produto adicionado localmente. Tentando salvar no servidor (Render)..." : "Produto atualizado localmente. Tentando salvar no servidor (Render)...");
        await exportMenuOnly(); 
        
        // Se a exportação falhar (por problemas no Render), o usuário será alertado na função exportMenuOnly()
    };
    // ==================================================================
    // FIM DA FUNÇÃO CORRIGIDA
    // ==================================================================

    function delP(id) { 
        if (confirm(`Tem certeza que deseja excluir o produto ID ${id}? A exclusão será local até que você exporte.`)) {
            produtos = produtos.filter(p => p.id !== id);
            delete composicoes[id]; // Remove a composição do produto excluído
            render();
            // Após remover localmente, também tentamos exportar imediatamente (melhor experiência)
            alert('Produto excluído localmente. Tentando salvar a exclusão no servidor...');
            exportMenuOnly(); 
        }
    }

    // ==================================================================
    // FUNÇÕES DE MANIPULAÇÃO DE DADOS (INSUMOS)
    // ==================================================================
    
    async function loadInsumos() {
        try {
            const response = await fetch("/api/insumos", { cache: "no-store" });
            if (!response.ok) { throw new Error(`Erro: ${response.status}`); }
            insumos = await response.json(); 
            renderInsumos();
        } catch (e) {
            console.error("Erro ao carregar insumos:", e);
            insumos = []; 
            renderInsumos();
        }
    }

    function renderInsumos() {
        insumosTbody.innerHTML = '';
        if (insumos.length === 0) {
            insumosTbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum insumo cadastrado.</td></tr>';
            return;
        }

        insumos.forEach(i => {
            const row = insumosTbody.insertRow();
            row.innerHTML = `
                <td>${i.id}</td>
                <td>${i.nome}</td>
                <td>R$ ${Number(i.custoUnitario).toFixed(4)} / ${i.unidade}</td>
                <td>${Number(i.estoqueAtual).toFixed(2)} ${i.unidade}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="editInsumo(${i.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="delInsumo(${i.id})"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
    }

    function calculateCustoUnitario() {
        const precoTotal = parseFloat(insumoPrecoTotal.value);
        const quantidadeKg = parseFloat(insumoQuantidadeKg.value);
        const unidadeSelecionada = insumoUnidade.value.toLowerCase(); 

        const calculoKgGroup = document.getElementById('calculoKgGroup');
        const custoUnitarioGroup = document.getElementById('custoUnitarioGroup');
        
        // Lógica para cálculo automático (apenas se a unidade for 'g')
        if (unidadeSelecionada === 'g') {
            calculoKgGroup.style.display = 'flex'; 
            custoUnitarioGroup.classList.remove('col-md-12');
            custoUnitarioGroup.classList.add('col-md-4');

            if (isNaN(precoTotal) || isNaN(quantidadeKg) || quantidadeKg <= 0) {
                insumoCusto.value = '';
                return;
            }

            const quantidadeGramas = quantidadeKg * 1000;
            const custoPorGrama = precoTotal / quantidadeGramas;

            insumoCusto.value = custoPorGrama.toFixed(4);
        } 
        // Lógica para unidades que não usam cálculo automático (ex: 'un', 'ml', 'pct')
        else {
            calculoKgGroup.style.display = 'none'; 
            custoUnitarioGroup.classList.remove('col-md-4');
            custoUnitarioGroup.classList.add('col-md-12');
            
            // Não limpa o custo se o usuário estiver editando manualmente
            if(insumoCusto.value === '' || !isNaN(parseFloat(insumoPrecoTotal.value))) {
                insumoCusto.value = ''; 
            }
        }
    }
    
    // Configura os listeners para os campos de cálculo e unidade
    insumoPrecoTotal.addEventListener('input', calculateCustoUnitario);
    insumoQuantidadeKg.addEventListener('input', calculateCustoUnitario);
    insumoUnidade.addEventListener('change', calculateCustoUnitario);

    function openAddInsumoModal() {
        document.getElementById('insumoModalLabel').innerText = 'Adicionar Novo Insumo';
        document.getElementById('insumo-form').reset();
        document.getElementById('insumoId').value = ''; 
        
        document.getElementById('insumoUnidade').value = 'g'; 
        insumoPrecoTotal.value = '';
        insumoQuantidadeKg.value = '';
        insumoCusto.value = '';
        
        calculateCustoUnitario(); 
        
        insumoModal.show();
    }

    function editInsumo(id) {
        const insumo = insumos.find(i => i.id === id);
        if (!insumo) return;

        document.getElementById('insumoModalLabel').innerText = 'Editar Insumo';
        
        document.getElementById('insumoId').value = insumo.id;
        document.getElementById('insumoName').value = insumo.nome;
        
        insumoPrecoTotal.value = ''; 
        insumoQuantidadeKg.value = '';
        
        insumoCusto.value = insumo.custoUnitario;
        document.getElementById('insumoUnidade').value = insumo.unidade;
        document.getElementById('insumoEstoque').value = insumo.estoqueAtual;

        calculateCustoUnitario(); 
        
        insumoModal.show();
    }

    saveInsumoBtn.onclick = async () => { // Adicionado 'async' para exportação
        const id = document.getElementById('insumoId').value;
        const nome = document.getElementById('insumoName').value;
        
        const custoUnitario = parseFloat(insumoCusto.value);
        const unidade = document.getElementById('insumoUnidade').value;
        const estoqueAtual = parseFloat(document.getElementById('insumoEstoque').value);
        
        if (!nome || isNaN(custoUnitario) || isNaN(estoqueAtual) || custoUnitario <= 0) {
            alert("Nome, Custo Unitário (deve ser maior que zero) e Estoque são obrigatórios. Para unidades como 'un' e 'ml', o Custo Unitário deve ser digitado manualmente.");
            return;
        }

        const newInsumoData = { nome, custoUnitario, unidade, estoqueAtual };

        if (id) {
            const index = insumos.findIndex(i => i.id == id);
            if (index !== -1) {
                insumos[index] = { ...insumos[index], id: parseInt(id), ...newInsumoData };
            }
        } else {
            const newId = insumos.length > 0 ? Math.max(...insumos.map(i => i.id)) + 1 : 1;
            insumos.push({ id: newId, ...newInsumoData });
        }

        renderInsumos();
        insumoModal.hide();
        
        // Tenta salvar insumos no servidor Imediatamente
        alert("Insumo atualizado localmente. Tentando salvar no servidor (Render)...");
        await exportInsumos();
        render(); // Re-renderiza produtos, pois o custo dos insumos pode ter mudado
    };

    function delInsumo(id) { 
        if (confirm(`Tem certeza que deseja excluir o Insumo ID ${id}? A exclusão será local até que você exporte.`)) {
            insumos = insumos.filter(i => i.id !== id);
            alert('Insumo excluído localmente. Tentando salvar a exclusão no servidor...');
            exportInsumos();
            renderComposition(); 
            render(); 
        }
    }

    // ==================================================================
    // FUNÇÕES DE EXPORTAÇÃO (Salvamento no Servidor)
    // ==================================================================
    
    // NOVO: Função para exportar APENAS o cardápio (Menu)
    async function exportMenuOnly() {
        if (!logged) { 
            alert("❌ Você precisa estar logado para salvar as alterações."); 
            return; 
        }
        
        const dataToExport = produtos.map(p => ({
            id: p.id, name: p.name, desc: p.desc, price: p.price, cat: p.cat, imgUrl: p.imgUrl || "" 
        }));

        try {
            const response = await fetch('/api/export', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToExport, null, 2),
            });

            const data = await response.json();

            if (response.status === 401) {
                alert(`❌ Erro de Autorização. Sessão expirou.`);
                checkStatus();
            } else if (data.success) {
                alert(`✅ Edição salva com sucesso no servidor!`);
            } else {
                alert(`⚠️ Falha ao salvar a edição no servidor: ${data.message}`);
            }
        } catch (error) {
            console.error('Erro de conexão durante o salvamento do Menu:', error);
            alert('❌ Erro de conexão com o servidor! A edição NÃO foi salva permanentemente. (Verifique o Render)');
        }
    }

    async function exportInsumos() {
        if (!logged) { alert("Você precisa estar logado para exportar os insumos."); return false; }

        try {
            const response = await fetch('/api/insumos/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(insumos, null, 2),
            });

            const data = await response.json();

            if (response.status === 401) {
                alert(`❌ Erro de Autorização. Sessão expirou.`);
                checkStatus();
                return false;
            } else if (data.success) {
                alert(`✅ Insumos salvos no servidor!`);
                return true;
            } else {
                alert(`❌ Erro ao exportar insumos: ${data.message}`);
                return false;
            }
        } catch (error) {
            console.error('Erro na requisição de exportação de insumos:', error);
            alert('❌ Erro de conexão com o servidor na exportação de insumos. (Verifique o Render)');
            return false;
        }
    }
    
    // Mantém a função original de "Exportar TUDO" para salvar Fichas Técnicas (Composições)
    async function exportCompositions() {
        if (!logged) { return false; }
        
        try {
            const response = await fetch('/api/composicoes/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(composicoes, null, 2),
            });

            const data = await response.json();

            if (response.status === 401) {
                alert(`❌ Erro de Autorização. Sessão expirou na exportação de Composições.`);
                checkStatus();
                return false;
            } else if (data.success) {
                return true;
            } else {
                alert(`❌ Erro ao exportar composições: ${data.message}`);
                return false;
            }
        } catch (error) {
            console.error('Erro na requisição de exportação de composições:', error);
            alert('❌ Erro de conexão com o servidor na exportação de Composições. (Verifique o Render)');
            return false;
        }
    }


    // ==================================================================
    // FUNÇÕES DE COMPOSIÇÃO / FICHA TÉCNICA (SEM ALTERAÇÕES SIGNIFICATIVAS)
    // ==================================================================

    function calculateProductCost(productId) {
        const composition = composicoes[productId] || [];
        let custoTotal = 0;

        composition.forEach(comp => {
            const insumo = insumos.find(i => i.id === comp.insumoId);
            if (insumo) {
                custoTotal += comp.uso * insumo.custoUnitario;
            }
        });
        return custoTotal;
    }

    function openCompositionModal(productId, productName) {
        currentProductId = productId;
        compositionProductName.innerText = productName;
        document.getElementById('currentProductId').value = productId;

        populateInsumoSelect();
        currentProductComposition = composicoes[productId] || [];
        renderComposition();
        compInsumoUso.value = ''; 
        compositionModal.show();
    }

    function populateInsumoSelect() {
        compInsumoSelect.innerHTML = '<option value="">Selecione um Insumo...</option>';
        
        const usedInsumoIds = currentProductComposition.map(c => c.insumoId);

        insumos.forEach(i => {
            if (!usedInsumoIds.includes(i.id)) {
                const option = document.createElement('option');
                option.value = i.id;
                option.innerText = `${i.nome} (R$ ${Number(i.custoUnitario).toFixed(4)}/${i.unidade})`;
                compInsumoSelect.appendChild(option);
            }
        });
    }

    function addInsumoToComposition() {
        const insumoId = parseInt(compInsumoSelect.value);
        const uso = parseFloat(compInsumoUso.value);

        if (isNaN(insumoId) || isNaN(uso) || uso <= 0) {
            alert("Selecione um insumo e defina uma quantidade de uso válida (> 0).");
            return;
        }

        if (!currentProductComposition.find(c => c.insumoId === insumoId)) {
            currentProductComposition.push({ insumoId, uso });
            composicoes[currentProductId] = currentProductComposition; // Salva na estrutura global
            
            compInsumoSelect.value = '';
            compInsumoUso.value = '';
            populateInsumoSelect();
            renderComposition();
            render(); 
            alert("Insumo adicionado à ficha técnica! Você deve clicar em 'Exportar TUDO' para salvar Fichas Técnicas.");
        }
    }

    function removeInsumoFromComposition(insumoIdToRemove) {
        if (confirm("Tem certeza que deseja remover este insumo da ficha técnica?")) {
            currentProductComposition = currentProductComposition.filter(c => c.insumoId !== insumoIdToRemove);
            composicoes[currentProductId] = currentProductComposition;

            populateInsumoSelect();
            renderComposition();
            render(); 
            alert("Insumo removido da ficha técnica! Você deve clicar em 'Exportar TUDO' para salvar Fichas Técnicas.");
        }
    }

    function renderComposition() {
        compositionTbody.innerHTML = '';
        let custoTotal = 0;

        if (currentProductComposition.length === 0) {
            compositionTbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum insumo adicionado a esta ficha técnica.</td></tr>';
            totalCostDisplay.innerText = 'R$ 0.00';
            return;
        }

        currentProductComposition.forEach(comp => {
            const insumo = insumos.find(i => i.id == comp.insumoId);

            if (insumo) {
                const custoLanche = comp.uso * insumo.custoUnitario;
                custoTotal += custoLanche;

                const row = compositionTbody.insertRow();
                row.innerHTML = `
                    <td>${insumo.nome}</td>
                    <td>${insumo.unidade}</td>
                    <td>R$ ${Number(insumo.custoUnitario).toFixed(4)}/${insumo.unidade}</td>
                    <td>${Number(comp.uso).toFixed(2)} ${insumo.unidade}</td>
                    <td>R$ ${custoLanche.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="removeInsumoFromComposition(${insumo.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                `;
            } else {
                const row = compositionTbody.insertRow();
                row.classList.add('table-danger');
                row.innerHTML = `<td colspan="5">Insumo ID ${comp.insumoId} (Excluído ou não encontrado)</td>
                    <td><button class="btn btn-sm btn-danger" onclick="removeInsumoFromComposition(${comp.insumoId})"><i class="fas fa-times"></i> Remover</button></td>`;
            }
        });

        totalCostDisplay.innerText = `R$ ${custoTotal.toFixed(2)}`;
    }


    // ==================================================================
    // LÓGICA DE SEGURANÇA E INICIALIZAÇÃO
    // ==================================================================
    
    async function loadCompositions() {
        // Em um sistema JSON, aqui você faria o fetch para carregar o arquivo 'composicoes.json'
        // Por enquanto, inicia vazio.
        composicoes = {}; 
    }

    async function checkStatus() {
        if (document.cookie.includes('auth_session')) {
            logged = true;
            loginModal.style.display = "none";
            currentUser.innerText = "admin"; 
            logoutBtn.style.display = "inline-block";
            
            showSection('products'); 
            await loadInsumos(); 
            await loadCompositions(); 
            await loadMenu(); 
            render(); 
        } else {
            loginModal.style.display = "flex";
        }
    }

    doLoginBtn.onclick = async () => {
        const user = loginUser.value;
        const pass = loginPass.value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, pass })
            });
            
            const data = await response.json();

            if (data.success) {
                logged = true;
                currentUser.innerText = user; 
                loginModal.style.display = "none";
                logoutBtn.style.display = "inline-block";
                
                showSection('products');
                await loadInsumos();
                await loadCompositions();
                await loadMenu(); 
                render();
                alert('Login efetuado com sucesso!');
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Erro de conexão ao tentar logar com o servidor.');
        }
    };

    logoutBtn.onclick = async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            logged = false;
            currentUser.innerText = "—";
            logoutBtn.style.display = "none";
            loginModal.style.display = "flex";
            alert('Você saiu do painel.');
        } catch (error) {
            alert('Erro ao fazer logout, mas a sessão local foi encerrada.');
        }
    };

    // Evento de Exportação de TUDO (Produtos e Composições)
    document.getElementById("exportBtn").onclick = async () => {
        if (!logged) { alert("Você precisa estar logado para exportar para o servidor."); return; }
        if (!confirm("ATENÇÃO: Tem certeza que deseja exportar e ATUALIZAR TODOS os dados (Produtos e Fichas Técnicas) no servidor?")) return;
        
        let successCount = 0;
        let totalExports = 2; // Composições e Menu

        alert("Iniciando exportação completa. Aguarde...");

        // 1. Exportar Composições (Fichas Técnicas)
        const compResult = await exportCompositions();
        if (compResult) { successCount++; }
        
        // 2. Exportar Produtos (Cardápio)
        const menuResult = await exportMenuOnly();
        if (menuResult) { successCount++; }
        
        if (successCount === totalExports) {
            alert("✅ Sucesso! Todos os dados (Produtos e Fichas Técnicas) foram exportados e salvos no servidor.");
        } else {
            alert(`⚠️ A exportação teve problemas. ${successCount}/${totalExports} itens salvos com sucesso. Verifique os alertas anteriores.`);
        }
    };
    
    // Inicializa a verificação de status
    checkStatus();

