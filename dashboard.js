// dashboard.js
class Dashboard {
    constructor() {
        this.produtos = [];
        this.pedidos = [];
        this.insumos = [];
        this.init();
    }

    async init() {
        await this.carregarDados();
        this.setupEventListeners();
        this.renderProdutos();
        this.renderInsumos();
        this.renderPedidos();
        this.updateFinanceiro();
    }

    async carregarDados() {
        try {
            console.log('📥 Carregando dados da API...');
            
            const [produtosRes, pedidosRes, insumosRes] = await Promise.all([
                fetch('/api/produtos').then(r => r.ok ? r.json() : []),
                fetch('/api/pedidos').then(r => r.ok ? r.json() : []),
                fetch('/api/insumos').then(r => r.ok ? r.json() : [])
            ]);

            this.produtos = produtosRes || [];
            this.pedidos = pedidosRes || [];
            this.insumos = insumosRes || [];

            console.log(`✅ Dados carregados: ${this.produtos.length} produtos, ${this.pedidos.length} pedidos, ${this.insumos.length} insumos`);

        } catch (error) {
            console.log('⚠️ Erro ao carregar dados:', error);
            this.produtos = [];
            this.pedidos = [];
            this.insumos = [];
        }
    }

    setupEventListeners() {
        // Tabs
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });

        // Formulário de produto
        document.getElementById('formProduto')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarProduto();
        });

        // Botão ver cardápio
        document.getElementById('visualizarCardapio')?.addEventListener('click', () => {
            window.open('/', '_blank');
        });
    }

    // ===== PRODUTOS =====
    abrirModalProduto(produto = null) {
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <h3>${produto ? 'Editar' : 'Novo'} Produto</h3>
                    <form id="formProduto">
                        <input type="hidden" id="produtoId" value="${produto?._id || ''}">
                        
                        <div class="form-group">
                            <label>Nome do Produto</label>
                            <input type="text" id="produtoNome" value="${produto?.nome || ''}" required>
                        </div>

                        <div class="form-group">
                            <label>Categoria</label>
                            <select id="produtoCategoria" required>
                                <option value="">Selecione...</option>
                                <option value="Hambúrgueres" ${produto?.categoria === 'Hambúrgueres' ? 'selected' : ''}>🍔 Hambúrgueres</option>
                                <option value="Combos" ${produto?.categoria === 'Combos' ? 'selected' : ''}>🥡 Combos</option>
                                <option value="Acompanhamentos" ${produto?.categoria === 'Acompanhamentos' ? 'selected' : ''}>🍟 Acompanhamentos</option>
                                <option value="Adicionais" ${produto?.categoria === 'Adicionais' ? 'selected' : ''}>➕ Adicionais</option>
                                <option value="Bebidas" ${produto?.categoria === 'Bebidas' ? 'selected' : ''}>🥤 Bebidas</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Preço (R$)</label>
                            <input type="number" id="produtoPreco" step="0.01" value="${produto?.preco || ''}" required>
                        </div>

                        <div class="form-group">
                            <label>Descrição</label>
                            <textarea id="produtoDescricao" rows="3">${produto?.descricao || ''}</textarea>
                        </div>

                        <div class="form-group">
                            <label>URL da Imagem</label>
                            <input type="text" id="produtoImagem" value="${produto?.imagem || ''}">
                        </div>

                        <div class="form-checkbox">
                            <label>
                                <input type="checkbox" id="produtoDisponivel" ${produto?.disponivel !== false ? 'checked' : ''}>
                                Disponível no cardápio
                            </label>
                        </div>

                        <div class="modal-actions">
                            <button type="submit" class="btn primary">💾 Salvar</button>
                            <button type="button" class="btn secondary" onclick="dashboard.fecharModal()">❌ Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('formProduto').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarProduto();
        });
    }

    async salvarProduto() {
        const formData = {
            nome: document.getElementById('produtoNome').value,
            categoria: document.getElementById('produtoCategoria').value,
            preco: parseFloat(document.getElementById('produtoPreco').value),
            descricao: document.getElementById('produtoDescricao').value,
            imagem: document.getElementById('produtoImagem').value,
            disponivel: document.getElementById('produtoDisponivel').checked
        };

        const produtoId = document.getElementById('produtoId').value;
        const url = produtoId ? `/api/produtos/${produtoId}` : '/api/produtos';
        const method = produtoId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await this.carregarDados();
                this.renderProdutos();
                this.fecharModal();
                this.mostrarMensagem('Produto salvo com sucesso!');
            }
        } catch (error) {
            this.mostrarMensagem('Erro ao salvar produto', 'erro');
        }
    }

    renderProdutos() {
        const container = document.getElementById('produtosContainer');
        const filtroCategoria = document.getElementById('filtroCategoria')?.value || '';
        const filtroStatus = document.getElementById('filtroStatus')?.value || '';

        let produtosFiltrados = this.produtos;

        if (filtroCategoria) {
            produtosFiltrados = produtosFiltrados.filter(p => p.categoria === filtroCategoria);
        }

        if (filtroStatus === 'disponivel') {
            produtosFiltrados = produtosFiltrados.filter(p => p.disponivel);
        } else if (filtroStatus === 'indisponivel') {
            produtosFiltrados = produtosFiltrados.filter(p => !p.disponivel);
        }

        if (!produtosFiltrados || produtosFiltrados.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum produto encontrado</div>';
            return;
        }

        container.innerHTML = produtosFiltrados.map(produto => `
            <div class="produto-card ${!produto.disponivel ? 'indisponivel' : ''}">
                <span class="categoria">${produto.categoria}</span>
                <span class="status ${produto.disponivel ? 'disponivel' : 'indisponivel'}">
                    ${produto.disponivel ? '✅' : '⏸️'}
                </span>
                
                <h3>${produto.nome}</h3>
                <div class="preco">R$ ${produto.preco?.toFixed(2) || '0.00'}</div>
                <div class="descricao">${produto.descricao || ''}</div>
                
                ${produto.imagem ? `
                    <div style="margin: 1rem 0;">
                        <img src="${produto.imagem}" alt="${produto.nome}" 
                             style="max-width: 100%; height: 150px; object-fit: cover; border-radius: 4px;">
                    </div>
                ` : ''}
                
                <div class="card-actions">
                    <button class="btn-editar" onclick="dashboard.abrirModalProduto(${JSON.stringify(produto).replace(/"/g, '&quot;')})">
                        ✏️ Editar
                    </button>
                    <button class="btn-toggle" onclick="dashboard.toggleDisponibilidade('${produto._id}')">
                        ${produto.disponivel ? '⏸️' : '▶️'} ${produto.disponivel ? 'Pausar' : 'Ativar'}
                    </button>
                    <button class="btn-excluir" onclick="dashboard.excluirProduto('${produto._id}')">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    filtrarProdutos() {
        this.renderProdutos();
    }

    async toggleDisponibilidade(id) {
        const produto = this.produtos.find(p => p._id === id);
        if (!produto) return;

        try {
            const response = await fetch(`/api/produtos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disponivel: !produto.disponivel })
            });

            if (response.ok) {
                produto.disponivel = !produto.disponivel;
                this.renderProdutos();
                this.mostrarMensagem(`Produto ${produto.disponivel ? 'ativado' : 'pausado'} no cardápio!`);
            }
        } catch (error) {
            this.mostrarMensagem('Erro ao atualizar produto', 'erro');
        }
    }

    async excluirProduto(id) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            const response = await fetch(`/api/produtos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.produtos = this.produtos.filter(p => p._id !== id);
                this.renderProdutos();
                this.mostrarMensagem('Produto excluído com sucesso!');
            }
        } catch (error) {
            this.mostrarMensagem('Erro ao excluir produto', 'erro');
        }
    }

    // ===== INSUMOS =====
    abrirModalInsumo(insumo = null) {
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <h3>${insumo ? 'Editar' : 'Novo'} Insumo</h3>
                    <form id="formInsumo">
                        <input type="hidden" id="insumoId" value="${insumo?._id || ''}">
                        
                        <div class="form-group">
                            <label>Nome do Insumo</label>
                            <input type="text" id="insumoNome" value="${insumo?.nome || ''}" required>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Quantidade</label>
                                <input type="number" id="insumoQuantidade" value="${insumo?.quantidade || 0}" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Unidade</label>
                                <select id="insumoUnidade" required>
                                    <option value="g" ${insumo?.unidade === 'g' ? 'selected' : ''}>Gramas (g)</option>
                                    <option value="ml" ${insumo?.unidade === 'ml' ? 'selected' : ''}>Mililitros (ml)</option>
                                    <option value="un" ${insumo?.unidade === 'un' ? 'selected' : ''}>Unidades (un)</option>
                                    <option value="kg" ${insumo?.unidade === 'kg' ? 'selected' : ''}>Quilogramas (kg)</option>
                                    <option value="l" ${insumo?.unidade === 'l' ? 'selected' : ''}>Litros (l)</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Preço Unitário (R$)</label>
                            <input type="number" id="insumoPreco" step="0.01" value="${insumo?.preco || 0}" required>
                        </div>

                        <div class="form-group">
                            <label>Estoque Mínimo</label>
                            <input type="number" id="insumoMinimo" value="${insumo?.minimo || 0}">
                        </div>

                        <div class="modal-actions">
                            <button type="submit" class="btn primary">💾 Salvar</button>
                            <button type="button" class="btn secondary" onclick="dashboard.fecharModal()">❌ Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('formInsumo').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarInsumo();
        });
    }

    async salvarInsumo() {
        const formData = {
            nome: document.getElementById('insumoNome').value,
            quantidade: parseInt(document.getElementById('insumoQuantidade').value),
            unidade: document.getElementById('insumoUnidade').value,
            preco: parseFloat(document.getElementById('insumoPreco').value),
            minimo: parseInt(document.getElementById('insumoMinimo').value) || 0
        };

        const insumoId = document.getElementById('insumoId').value;
        const url = insumoId ? `/api/insumos/${insumoId}` : '/api/insumos';
        const method = insumoId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await this.carregarDados();
                this.renderInsumos();
                this.fecharModal();
                this.mostrarMensagem('Insumo salvo com sucesso!');
            }
        } catch (error) {
            this.mostrarMensagem('Erro ao salvar insumo', 'erro');
        }
    }

    renderInsumos() {
        const container = document.getElementById('insumosContainer');
        
        if (!this.insumos || this.insumos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum insumo cadastrado</div>';
            return;
        }

        container.innerHTML = this.insumos.map(insumo => `
            <div class="produto-card ${insumo.quantidade <= (insumo.minimo || 0) ? 'estoque-baixo' : ''}">
                <h3>${insumo.nome}</h3>
                <div class="insumo-info">
                    <div class="quantidade ${insumo.quantidade <= (insumo.minimo || 0) ? 'alerta' : ''}">
                        ${insumo.quantidade} ${insumo.unidade}
                        ${insumo.minimo ? `<small>(mín: ${insumo.minimo} ${insumo.unidade})</small>` : ''}
                    </div>
                    <div class="preco">R$ ${insumo.preco?.toFixed(2) || '0.00'}/${insumo.unidade}</div>
                </div>
                <div class="card-actions">
                    <button class="btn-editar" onclick="dashboard.abrirModalInsumo(${JSON.stringify(insumo).replace(/"/g, '&quot;')})">
                        ✏️ Editar
                    </button>
                    <button class="btn-excluir" onclick="dashboard.excluirInsumo('${insumo._id}')">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    async excluirInsumo(id) {
        if (!confirm('Tem certeza que deseja excluir este insumo?')) return;

        try {
            const response = await fetch(`/api/insumos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.insumos = this.insumos.filter(i => i._id !== id);
                this.renderInsumos();
                this.mostrarMensagem('Insumo excluído com sucesso!');
            }
        } catch (error) {
            this.mostrarMensagem('Erro ao excluir insumo', 'erro');
        }
    }

    // ===== PEDIDOS =====
    async atualizarPedidos() {
        await this.carregarDados();
        this.renderPedidos();
        this.mostrarMensagem('Pedidos atualizados!');
    }

    renderPedidos() {
        const container = document.getElementById('pedidosContainer');
        
        if (!this.pedidos || this.pedidos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum pedido recebido</div>';
            return;
        }

        container.innerHTML = this.pedidos.map(pedido => `
            <div class="produto-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h3>Pedido #${pedido._id?.slice(-6) || 'N/A'}</h3>
                        <p><strong>Cliente:</strong> ${pedido.cliente}</p>
                        <p><strong>Telefone:</strong> ${pedido.telefone}</p>
                        <p><strong>Endereço:</strong> ${pedido.endereco}</p>
                    </div>
                    <span class="status status-${pedido.status || 'pendente'}">
                        ${this.formatarStatus(pedido.status)}
                    </span>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <strong>Itens:</strong>
                    ${(pedido.itens || []).map(item => `
                        <div style="display: flex; justify-content: space-between; margin: 0.25rem 0;">
                            <span>${item.quantidade}x ${item.nome}</span>
                            <span>R$ ${((item.preco || 0) * (item.quantidade || 1)).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>Total: R$ ${pedido.total?.toFixed(2) || '0.00'}</strong>
                        <span>${new Date(pedido.createdAt || pedido.criadoEm).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatarStatus(status) {
        const statusMap = {
            'pendente': '⏳ Pendente',
            'preparando': '👨‍🍳 Preparando',
            'pronto': '✅ Pronto',
            'entregue': '🚗 Entregue',
            'cancelado': '❌ Cancelado'
        };
        return statusMap[status] || status;
    }

    // ===== FINANCEIRO =====
    async updateFinanceiro() {
        try {
            const response = await fetch('/api/financeiro');
            if (response.ok) {
                const financeiro = await response.json();
                this.atualizarUIFinanceiro(financeiro);
            }
        } catch (error) {
            console.log('Erro ao carregar dados financeiros:', error);
        }
    }

    atualizarUIFinanceiro({ vendas, gastos, lucro }) {
        const totalVendas = document.getElementById('totalVendas');
        const totalCustos = document.getElementById('totalCustos');
        const lucroElement = document.getElementById('lucro');

        if (totalVendas) totalVendas.textContent = `R$ ${vendas?.toFixed(2) || '0.00'}`;
        if (totalCustos) totalCustos.textContent = `R$ ${gastos?.toFixed(2) || '0.00'}`;
        if (lucroElement) lucroElement.textContent = `R$ ${lucro?.toFixed(2) || '0.00'}`;
    }

    // ===== UTILITÁRIOS =====
    fecharModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }

    mostrarMensagem(mensagem, tipo = 'sucesso') {
        // Implementação simples - pode ser melhorada com notificações
        console.log(`${tipo.toUpperCase()}: ${mensagem}`);
        alert(mensagem); // Substitua por um sistema de notificações mais elaborado
    }

    imprimirPedidos() {
        window.print();
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
