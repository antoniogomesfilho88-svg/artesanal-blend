<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        // ==================================================================
        // VARIÁVEIS GLOBAIS E ELEMENTOS DOM
        // ==================================================================
        let produtos = []; 
        let insumos = [];
        let logged = false;

        // Elementos de Segurança
        const loginModal = document.getElementById('login-screen');
        const loginUser = document.getElementById('loginUser');
        const loginPass = document.getElementById('loginPass');
        const doLoginBtn = document.getElementById('doLoginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const currentUser = document.getElementById('currentUser');
        const menuTbody = document.getElementById('menu-tbody');
        const insumosTbody = document.getElementById('insumos-tbody'); 

        // Modais e Formulários (Novos Elementos)
        const productModal = new bootstrap.Modal(document.getElementById('productModal'));
        const insumoModal = new bootstrap.Modal(document.getElementById('insumoModal'));
        const saveProductBtn = document.getElementById('saveProductBtn');
        const saveInsumoBtn = document.getElementById('saveInsumoBtn');
        
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
                const row = menuTbody.insertRow();
                row.innerHTML = `
                    <td>${p.id}</td>
                    <td>${p.name}</td>
                    <td>R$ ${Number(p.price).toFixed(2)}</td>
                    <td>${p.cat}</td>
                    <td>
                        <button class="btn btn-sm btn-warning me-1" onclick="editP(${p.id})"><i class="fas fa-edit"></i> Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="delP(${p.id})"><i class="fas fa-trash-alt"></i> Excluir</button>
                    </td>
                `;
            });
        }
        
       // NOVO: Abre o modal para ADIÇÃO
function openAddProductModal() {
    // 1. Configura o título do modal
    document.getElementById('productModalLabel').innerText = 'Adicionar Novo Produto';
    // 2. Limpa o formulário
    document.getElementById('product-form').reset(); 
    // 3. Define o ID como vazio para indicar ADIÇÃO
    document.getElementById('productId').value = ''; 
    
    // 4. Abre o popup usando o objeto Bootstrap
    productModal.show();
}

        // NOVO: Abre o modal para EDIÇÃO
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

        // NOVO: Salva Produto (Adicionar ou Editar)
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
                // EDIÇÃO
                const index = produtos.findIndex(p => p.id == id);
                if (index !== -1) {
                    produtos[index] = { ...produtos[index], name, price, cat, desc, imgUrl };
                    alert("Produto atualizado localmente. EXPORTE para salvar!");
                }
            } else {
                // ADIÇÃO
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
                const row = insumosTbody.insertRow();
                row.innerHTML = `
                    <td>${i.id}</td>
                    <td>${i.nome}</td>
                    <td>R$ ${Number(i.custoUnitario).toFixed(2)} / ${i.unidade}</td>
                    <td>${Number(i.estoqueAtual).toFixed(2)} ${i.unidade}</td>
                    <td>
                        <button class="btn btn-sm btn-warning me-1" onclick="editInsumo(${i.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="delInsumo(${i.id})"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
            });
        }
        
        // NOVO: Abre o modal para ADIÇÃO de Insumo (chamada pelo botão)
        function openAddInsumoModal() {
            document.getElementById('insumoModalLabel').innerText = 'Adicionar Novo Insumo';
            document.getElementById('insumo-form').reset();
            document.getElementById('insumoId').value = ''; 
            insumoModal.show();
        }

        // NOVO: Abre o modal para EDIÇÃO de Insumo
        function editInsumo(id) {
            const insumo = insumos.find(i => i.id === id);
            if (!insumo) return;

            document.getElementById('insumoModalLabel').innerText = 'Editar Insumo';
            
            document.getElementById('insumoId').value = insumo.id;
            document.getElementById('insumoName').value = insumo.nome;
            document.getElementById('insumoCusto').value = insumo.custoUnitario;
            document.getElementById('insumoUnidade').value = insumo.unidade;
            document.getElementById('insumoEstoque').value = insumo.estoqueAtual;

            insumoModal.show();
        }

        // NOVO: Salva Insumo (Adicionar ou Editar)
        saveInsumoBtn.onclick = () => {
            const id = document.getElementById('insumoId').value;
            const nome = document.getElementById('insumoName').value;
            const custoUnitario = parseFloat(document.getElementById('insumoCusto').value);
            const unidade = document.getElementById('insumoUnidade').value;
            const estoqueAtual = parseFloat(document.getElementById('insumoEstoque').value);
            
            if (!nome || isNaN(custoUnitario) || isNaN(estoqueAtual)) {
                alert("Nome, Custo e Estoque são obrigatórios.");
                return;
            }

            const newInsumoData = { nome, custoUnitario, unidade, estoqueAtual };

            if (id) {
                // EDIÇÃO
                const index = insumos.findIndex(i => i.id == id);
                if (index !== -1) {
                    insumos[index] = { ...insumos[index], id: parseInt(id), ...newInsumoData };
                    alert("Insumo atualizado localmente. EXPORTE para salvar!");
                }
            } else {
                // ADIÇÃO
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
                renderInsumos();
                alert('Insumo excluído localmente. Lembre-se de EXPORTAR!');
            }
        }
        
        // Funções de Exportação (Já existentes, mantidas)
        async function exportInsumos() { /* ... */ } // Mantenha a função de exportInsumos original
        document.getElementById("exportBtn").onclick = async () => { /* ... */ }; // Mantenha a função de exportação de PRODUTOS original

        // ==================================================================
        // LÓGICA DE SEGURANÇA (Mantidas)
        // ==================================================================
        
        async function checkStatus() { /* ... */ }
        doLoginBtn.onclick = async () => { /* ... */ };
        logoutBtn.onclick = async () => { /* ... */ };

        // Inicializa a verificação de status
        checkStatus();

    </script>

