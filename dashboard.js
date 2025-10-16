<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        // ==================================================================
        // VARIÁVEIS GLOBAIS E ELEMENTOS DOM 
        // ==================================================================
        let produtos = []; 
        let insumos = []; 
        let logged = false;
        let composicoes = {}; 
        let currentProductComposition = []; 
        let currentProductId = null; 

        const LOW_STOCK_LIMIT_G_ML = 500;
        const LOW_STOCK_LIMIT_UN = 5;

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

        // Modais e Formulários 
        const productModal = new bootstrap.Modal(document.getElementById('productModal'));
        const insumoModal = new bootstrap.Modal(document.getElementById('insumoModal'));
        const compositionModal = new bootstrap.Modal(document.getElementById('compositionModal')); 
        
        const saveProductBtn = document.getElementById('saveProductBtn');
        const saveInsumoBtn = document.getElementById('saveInsumoBtn');

        // ELEMENTOS DO MODAL DE INSUMO (PARA CÁLCULO)
        const insumoPrecoTotal = document.getElementById('insumoPrecoTotal');
        // CORRIGIDO: Voltando a usar o ID para Kg
        const insumoQuantidadeKg = document.getElementById('insumoQuantidadeKg'); 
        const insumoCusto = document.getElementById('insumoCusto');
        const insumoUnidade = document.getElementById('insumoUnidade'); 

        // ELEMENTOS DO MODAL DE COMPOSIÇÃO (FICHA TÉCNICA)
        const compInsumoSelect = document.getElementById('compInsumoSelect');
        const compInsumoUso = document.getElementById('compInsumoUso');
        const compositionTbody = document.getElementById('composition-tbody');
        const compositionProductName = document.getElementById('compositionProductName');
        const totalCostDisplay = document.getElementById('totalCostDisplay');

        // ELEMENTOS DA SIMULAÇÃO DE VENDAS
        const vendaProdutoSelect = document.getElementById('vendaProdutoSelect');
        const vendaQuantidade = document.getElementById('vendaQuantidade');
        
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
                'financeiro': 'Financeiro e Vendas'
            };
            document.getElementById('main-title').innerText = titleMap[sectionId] || 'Dashboard';
            
            document.querySelectorAll('#sidebar .nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`[onclick="showSection('${sectionId}')"]`)?.classList.add('active');
            document.querySelector(`[onclick="showFinanceiroSection()"]`)?.classList.add('active'); 
        }
        
        function showFinanceiroSection() {
            showSection('financeiro');
            populateVendaSelect(); 
            renderFinanceiroSummary(); 
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
            renderFinanceiroSummary(); 
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

        saveProductBtn.onclick = () => {
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

            if (id) {
                const index = produtos.findIndex(p => p.id == id);
                if (index !== -1) {
                    produtos[index] = { ...produtos[index], name, price, cat, desc, imgUrl };
                    alert("Produto atualizado localmente. EXPORTE para salvar!");
                }
            } else {
                const newId = produtos.length > 0 ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
                produtos.push({ id: newId, name, price, cat, desc, imgUrl });
                alert("Produto adicionado localmente. EXPORTE para salvar!");
            }

            render();
            productModal.hide();
        };

        function delP(id) { 
            if (confirm(`Tem certeza que deseja excluir o produto ID ${id}?`)) {
                produtos = produtos.filter(p => p.id !== id);
                delete composicoes[id]; 
                render();
                alert('Produto excluído localmente. Lembre-se de EXPORTAR!');
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
                let isLowStock = false;
                if (i.unidade.toLowerCase() === 'g' || i.unidade.toLowerCase() === 'ml') {
                    if (i.estoqueAtual < LOW_STOCK_LIMIT_G_ML) {
                        isLowStock = true;
                    }
                } else if (i.unidade.toLowerCase() === 'un') {
                    if (i.estoqueAtual < LOW_STOCK_LIMIT_UN) {
                        isLowStock = true;
                    }
                }
                
                const row = insumosTbody.insertRow();
                if (isLowStock) {
                    row.classList.add('table-danger-light');
                }
                
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

        // FUNÇÃO DE CÁLCULO CORRIGIDA: Converte Kg/Litros para Gramas/ML
        function calculateCustoUnitario() {
            const precoTotal = parseFloat(insumoPrecoTotal.value);
            const quantidadeKg = parseFloat(insumoQuantidadeKg.value); // Valor inserido em Kg ou Litros
            const unidade = insumoUnidade.value.toLowerCase();

            if (isNaN(precoTotal) || isNaN(quantidadeKg) || quantidadeKg <= 0) {
                insumoCusto.value = '';
                return;
            }
            
            if (unidade === 'g') {
                // Cálculo para Gramas: (Preço Total) / (Kg * 1000)
                const quantidadeGramas = quantidadeKg * 1000;
                const custoPorGrama = precoTotal / quantidadeGramas;
                insumoCusto.value = custoPorGrama.toFixed(4);
            } else if (unidade === 'ml') {
                // Cálculo para Mililitros: (Preço Total) / (Litros * 1000)
                const quantidadeMl = quantidadeKg * 1000;
                const custoPorMl = precoTotal / quantidadeMl;
                insumoCusto.value = custoPorMl.toFixed(4);
            } else {
                 // Para 'un' ou outras, o campo fica vazio para inserção manual do custo unitário
                 insumoCusto.value = ''; 
            }
        }
        
        // Adiciona a função de cálculo aos eventos de input
        insumoPrecoTotal.oninput = calculateCustoUnitario;
        insumoQuantidadeKg.oninput = calculateCustoUnitario; 
        insumoUnidade.oninput = calculateCustoUnitario;
        
        function openAddInsumoModal() {
            document.getElementById('insumoModalLabel').innerText = 'Adicionar Novo Insumo';
            document.getElementById('insumo-form').reset();
            document.getElementById('insumoId').value = ''; 
            insumoPrecoTotal.value = '';
            insumoQuantidadeKg.value = ''; 
            insumoCusto.value = '';
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

            insumoModal.show();
        }

        saveInsumoBtn.onclick = () => {
            const id = document.getElementById('insumoId').value;
            const nome = document.getElementById('insumoName').value;
            
            const custoUnitario = parseFloat(insumoCusto.value);
            const unidade = document.getElementById('insumoUnidade').value;
            const estoqueAtual = parseFloat(document.getElementById('insumoEstoque').value);
            
            if (!nome || isNaN(custoUnitario) || isNaN(estoqueAtual) || custoUnitario <= 0) {
                alert("Nome, Custo Unitário (deve ser maior que zero) e Estoque são obrigatórios.");
                return;
            }

            const newInsumoData = { nome, custoUnitario, unidade, estoqueAtual };

            if (id) {
                const index = insumos.findIndex(i => i.id == id);
                if (index !== -1) {
                    insumos[index] = { ...insumos[index], id: parseInt(id), ...newInsumoData };
                    alert("Insumo atualizado localmente. EXPORTE para salvar!");
                }
            } else {
                const newId = insumos.length > 0 ? Math.max(...insumos.map(i => i.id)) + 1 : 1;
                insumos.push({ id: newId, ...newInsumoData });
                alert("Insumo adicionado localmente. EXPORTE para salvar!");
            }

            renderInsumos();
            insumoModal.hide();
        };

        function delInsumo(id) { 
            if (confirm(`Tem certeza que deseja excluir o Insumo ID ${id}?`)) {
                insumos = insumos.filter(i => i.id !== id);
                alert('Insumo excluído localmente. Lembre-se de EXPORTAR!');
                renderComposition(); 
                render(); 
            }
        }

        async function exportInsumos() {
            if (!logged) { alert("Você precisa estar logado para exportar os insumos."); return; }
            if (!confirm("ATENÇÃO: Tem certeza que deseja ATUALIZAR o insumos.json no servidor?")) return;

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
                } else if (data.success) {
                    alert(`✅ Sucesso! ${data.message}`);
                } else {
                    alert(`❌ Erro ao exportar insumos: ${data.message}`);
                }
            } catch (error) {
                console.error('Erro na requisição de exportação de insumos:', error);
                alert('❌ Erro de conexão com o servidor.');
            }
        }
        
        // ==================================================================
        // FUNÇÕES DE MANIPULAÇÃO DE DADOS (COMPOSIÇÃO / FICHA TÉCNICA)
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

            const existingIndex = currentProductComposition.findIndex(c => c.insumoId === insumoId);
            if (existingIndex !== -1) {
                currentProductComposition[existingIndex].uso = uso;
                alert("Uso do insumo atualizado na ficha técnica! Lembre-se de EXPORTAR TUDO.");
            } else {
                currentProductComposition.push({ insumoId, uso });
                alert("Insumo adicionado à ficha técnica! Lembre-se de EXPORTAR TUDO.");
            }

            composicoes[currentProductId] = currentProductComposition; 
            
            compInsumoSelect.value = '';
            compInsumoUso.value = '';
            populateInsumoSelect(); 
            renderComposition();
            render(); 
        }

        function removeInsumoFromComposition(insumoIdToRemove) {
            if (confirm("Tem certeza que deseja remover este insumo da ficha técnica?")) {
                currentProductComposition = currentProductComposition.filter(c => c.insumoId !== insumoIdToRemove);
                composicoes[currentProductId] = currentProductComposition;

                populateInsumoSelect();
                renderComposition();
                render(); 
                alert("Insumo removido da ficha técnica! Lembre-se de EXPORTAR TUDO.");
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
        // FUNÇÕES DE CONTROLE DE ESTOQUE E VENDAS 
        // ==================================================================

        function populateVendaSelect() {
            vendaProdutoSelect.innerHTML = '<option value="">Selecione um Produto...</option>';
            
            produtos.forEach(p => {
                if (composicoes[p.id] && composicoes[p.id].length > 0) {
                    const custo = calculateProductCost(p.id);
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.innerText = `${p.name} (Venda: R$ ${Number(p.price).toFixed(2)} | Custo: R$ ${custo.toFixed(2)})`;
                    vendaProdutoSelect.appendChild(option);
                }
            });
        }

        function renderFinanceiroSummary() {
            let totalCusto = 0;
            let totalVenda = 0;
            let countProdutosComCusto = 0;
            
            produtos.forEach(p => {
                const custo = calculateProductCost(p.id);
                if (custo > 0) {
                    totalCusto += custo;
                    totalVenda += p.price;
                    countProdutosComCusto++;
                }
            });

            const custoMedio = countProdutosComCusto > 0 ? totalCusto / countProdutosComCusto : 0;
            const vendaMedia = countProdutosComCusto > 0 ? totalVenda / countProdutosComCusto : 0;
            const lucroMedio = vendaMedia - custoMedio;

            document.getElementById('totalProdutos').innerText = produtos.length;
            document.getElementById('resumoCusto').innerText = `R$ ${custoMedio.toFixed(2)}`;
            document.getElementById('resumoLucro').innerText = `R$ ${lucroMedio.toFixed(2)}`;
        }


        function processSaleAndLowerStock() {
            const productId = parseInt(vendaProdutoSelect.value);
            const quantidade = parseInt(vendaQuantidade.value);

            if (isNaN(productId) || isNaN(quantidade) || quantidade <= 0) {
                alert("Selecione um produto e defina uma quantidade válida.");
                return;
            }

            const composition = composicoes[productId];
            if (!composition || composition.length === 0) {
                alert("Este produto não possui ficha técnica para dar baixa no estoque.");
                return;
            }

            let hasStockIssue = false;
            let insufficientInsumos = [];
            
            // 1. PRIMEIRA PASSAGEM: Checa se há estoque suficiente
            composition.forEach(comp => {
                const insumo = insumos.find(i => i.id === comp.insumoId);
                if (insumo) {
                    const usoTotal = comp.uso * quantidade;
                    if (insumo.estoqueAtual < usoTotal) {
                        hasStockIssue = true;
                        insufficientInsumos.push(`${insumo.nome} (${insumo.estoqueAtual.toFixed(2)} ${insumo.unidade} disponíveis, necessário: ${usoTotal.toFixed(2)} ${insumo.unidade})`);
                    }
                }
            });

            if (hasStockIssue) {
                alert(`❌ Não é possível registrar a venda. Estoque insuficiente para os seguintes insumos:\n\n- ${insufficientInsumos.join('\n- ')}`);
                return;
            }

            // 2. SEGUNDA PASSAGEM: Dá baixa no estoque
            composition.forEach(comp => {
                const insumoIndex = insumos.findIndex(i => i.id === comp.insumoId);
                if (insumoIndex !== -1) {
                    const usoTotal = comp.uso * quantidade;
                    insumos[insumoIndex].estoqueAtual -= usoTotal;
                }
            });

            // 3. ATUALIZAÇÃO DA INTERFACE
            renderInsumos(); 
            
            alert(`✅ Venda de ${quantidade} unidade(s) registrada com sucesso! Estoque dos insumos utilizados foi baixado.\n\nLembre-se de EXPORTAR INSUMOS para salvar esta baixa no servidor!`);
            
            vendaProdutoSelect.value = '';
            vendaQuantidade.value = 1;
            populateVendaSelect(); 
        }


        // ==================================================================
        // LÓGICA DE SEGURANÇA E EXPORTAÇÃO
        // ==================================================================
        
        async function loadCompositions() {
            // Em uma aplicação real, aqui você faria um fetch para carregar o arquivo 'composicoes.json'
            composicoes = {}; 
        }

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
                alert('❌ Erro de conexão com o servidor na exportação de Composições.');
                return false;
            }
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

        document.getElementById("exportBtn").onclick = async () => {
            if (!logged) { alert("Você precisa estar logado para exportar para o servidor."); return; }
            if (!confirm("ATENÇÃO: Tem certeza que deseja exportar e ATUALIZAR TODOS os dados (Produtos e Fichas Técnicas) no servidor?")) return;
            
            let exportSuccess = true;

            const compResult = await exportCompositions();
            if (!compResult) { exportSuccess = false; }
            
            try {
                const response = await fetch('/api/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(produtos.map(p => ({
                        id: p.id, name: p.name, desc: p.desc, price: p.price, cat: p.cat, imgUrl: p.imgUrl || "" 
                    })), null, 2),
                });

                const data = await response.json();

                if (response.status === 401) {
                    alert(`❌ Erro de Autorização. Sessão expirou na exportação de Produtos.`);
                    checkStatus();
                    exportSuccess = false;
                } else if (data.success) {
                } else {
                    alert(`❌ Erro ao exportar Produtos: ${data.message}`);
                    exportSuccess = false;
                }
            } catch (error) {
                console.error('Erro na requisição de exportação de Produtos:', error);
                alert('❌ Erro de conexão com o servidor na exportação de Produtos.');
                exportSuccess = false;
            }

            if (exportSuccess) {
                alert("✅ Sucesso! Todos os dados (Produtos e Fichas Técnicas) foram exportados e salvos no servidor.");
            } else {
                alert("⚠️ A exportação teve problemas. Verifique os alertas anteriores.");
            }
        };
        
        document.querySelector('[onclick="showSection(\'financeiro\')"]').onclick = showFinanceiroSection;

        checkStatus();

    </script>
