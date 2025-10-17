// dashboard.js
class Dashboard {
    constructor() {
        this.produtos = [];
        this.insumos = [];
        this.pedidos = [];
        this.init();
    }

    async init() {
        await this.carregarDadosAPI();
        this.setupEventListeners();
        this.renderProdutos();
        this.renderInsumos();
        this.renderPedidos();
        this.updateFinanceiro();
    }

    async carregarDadosAPI() {
        try {
            const [produtosRes, insumosRes, pedidosRes] = await Promise.all([
                fetch('/api/produtos'),
                fetch('/api/insumos'),
                fetch('/api/pedidos')
            ]);

            if (produtosRes.ok) this.produtos = await produtosRes.json();
            if (insumosRes.ok) this.insumos = await insumosRes.json();
            if (pedidosRes.ok) this.pedidos = await pedidosRes.json();

        } catch (error) {
            console.log('Erro ao carregar dados da API:', error);
        }
    }

    setupEventListeners() {
        // Formulário de produtos
        document.getElementById('produtoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adicionarProduto();
        });

        // Formulário de insumos
        document.getElementById('insumoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.adicionarInsumo();
        });

        // Botão imprimir pedidos
        document.getElementById('imprimirPedidos').addEventListener('click', () => {
            this.imprimirPedidos();
        });

        // Botão visualizar cardápio
        document.getElementById('visualizarCardapio').addEventListener('click', () => {
            window.open('/', '_blank');
        });
    }

    // ===== PRODUTOS =====
    async adicionarProduto() {
        const produto = {
            nome: document.getElementById('produtoNome').value,
            preco: parseFloat(document.getElementById('produtoPreco').value),
            imagem: document.getElementById('produtoImagem').value,
            descricao: document.getElementById('produtoDescricao').value,
            categoria: document.getElementById('produtoCategoria').value,
            disponivel: document.getElementById('produtoDisponivel').checked,
            destaque: document.getElementById('produtoDestaque').checked
        };

        try {
            const response = await fetch('/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            });

            if (response.ok) {
                const data = await response.json();
                this.produtos.push(data.produto);
                this.renderProdutos();
                this.limparForm('produtoForm');
                this.mostrarMensagem('Produto adicionado com sucesso!');
            }
        } catch (error) {
            this.mostrarMensagem('Erro ao adicionar produto', 'erro');
        }
    }

    renderProdutos() {
        const container = document.getElementById('produtosContainer');
        
        if (this.produtos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum produto cadastrado</div>';
            return;
        }

        container.innerHTML = this.produtos.map(produto => `
            <div class="produto-card ${!produto.disponivel ? 'indisponivel' : ''}">
                <div class="produto-header">
                    <h3>${produto.nome}</h3>
                    <div class="produto-badges">
                        ${produto.destaque ? '<span class="badge destaque">🌟 Destaque</span>' : ''}
                        ${!produto.disponivel ? '<span class="badge indisponivel">⏸️ Indisponível</span>' : ''}
                        <span class="badge categoria">${produto.categoria || 'Geral'}</span>
                    </div>
                </div>
                
                ${produto.imagem ? `<img src="${produto.imagem}" alt="${produto.nome}" class="produto-imagem">` : ''}
                
                <div class="preco">R$ ${produto.preco?.toFixed(2) || '0.00'}</div>
                <div class="descricao">${produto.descricao}</div>
                
                <div class="card-actions">
                    <button class="btn-editar" onclick="dashboard.editarProduto('${produto._id}')">
                        ✏️ Editar
                    </button>
                    <button class="btn-toggle" onclick="dashboard.toggleDisponibilidade('${produto._id}')">
                        ${produto.disponivel ? '⏸️' : '▶️'} ${produto.disponivel ? 'Pausar' : 'Ativar'}
                    </button>
                    <button class="btn-destaque" onclick="dashboard.toggleDestaque('${produto._id}')">
                        ${produto.destaque ? '⭐' : '☆'} ${produto.destaque ? 'Remover' : 'Destacar'}
                    </button>
                    <button class="btn-excluir" onclick="dashboard.excluirProduto('${produto._id}')">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    async editarProduto(id) {
        const produto = this.produtos.find(p => p._id === id);
        if (!produto) return;

        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <h3>Editar Produto</h3>
                    <form id="editarProdutoForm">
                        <input type="text" placeholder="Nome" value="${produto.nome}" required>
                        <input type="number" placeholder="Preço (R$)" value="${produto.preco}" step="0.01" required>
                        <input type="text" placeholder="Imagem URL" value="${produto.imagem || ''}">
                        <input type="text" placeholder="Categoria" value="${produto.categoria || ''}">
                        <textarea placeholder="Descrição">${produto.descricao || ''}</textarea>
                        <div class="form-checkbox">
                            <label>
                                <input type="checkbox" ${produto.disponivel ? 'checked' : ''}> Disponível no cardápio
                            </label>
                        </div>
                        <div class="form-checkbox">
                            <label>
                                <input type="checkbox" ${produto.destaque ? 'checked' : ''}> Produto em destaque
                            </label>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn">💾 Salvar Alterações</button>
                            <button type="button" class="btn btn-cancelar" onclick="dashboard.fecharModal()">❌ Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('editarProdutoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.salvarEdicaoProduto(id);
        });
    }

    async salvarEdicaoProduto(id) {
        const form = document.getElementById('editarProdutoForm');
        const formData = new FormData(form);
        
        const produtoAtualizado = {
            nome: form.querySelector('input[type="text"]').value,
            preco: parseFloat(form.querySelector('input[type="number"]').value),
            imagem: form.querySelector('input[placeholder="Imagem URL"]').value,
            categoria: form.querySelector('input[placeholder="Categoria"]').value,
            descricao: form.querySelector('textarea').value,
            disponivel: form.querySelector('input[type="checkbox"]').checked,
            destaque: form.querySelectorAll('input[type="checkbox"]')[1].checked
        };

        try {
            const response = await fetch(`/api/produtos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produtoAtualizado)
            });

            if (response.ok) {
                await this.carregarDadosAPI();
                this.renderProdutos();
                this.fecharModal();
                this.mostrarMensagem('Produto atualizado com sucesso!');
            }
        } catch (error) {
            this.mostrarMensagem('Erro ao atualizar produto', 'erro');
        }
    }

    async toggleDisponibilidade(id) {
        const produto = this.produtos.find(p => p._id === id);
        if (!produto) return;

        const atualizado = { disponivel: !produto.disponivel };

        try {
            const response = await fetch(`/api/produtos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(atualizado)
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

    async toggleDestaque(id) {
        const produto = this.produtos.find(p => p._id === id);
        if (!produto) return;

        const atualizado = { destaque: !produto.destaque };

        try {
            const response = await fetch(`/api/produtos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(atualizado)
            });

            if (response.ok) {
                produto.destaque = !produto.destaque;
                this.renderProdutos();
                this.mostrarMensagem(`Produto ${produto.destaque ? 'destacado' : 'removido dos destaques'}!`);
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
    async adicionarInsumo() {
        const insumo = {
            nome: document.getElementById('insumoNome').value,
            quantidade: parseInt(document.getElementById('insumoQtd').value),
            unidade: document.getElementById('insumoUnidade').value,
            preco: parseFloat(document.getElementById('insumoCusto').value)
        };

        try {
            const response = await fetch('/api/insumos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(insumo)
            });

            if (response.ok) {
                const data = await response.json();
                this.insumos.push(data.insumo);
                this.renderInsumos();
                this.limparForm('insumoForm');
                this.mostrarMensagem('Insumo adicionado com sucesso!');
            }
        } catch (error) {
            this.mostrarMensagem('Erro ao adicionar insumo', 'erro');
        }
    }

    renderInsumos() {
        const container = document.getElementById('insumosContainer');
        
        if (this.insumos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum insumo cadastrado</div>';
            return;
        }

        container.innerHTML = this.insumos.map(insumo => `
            <div class="insumo-card">
                <h3>${insumo.nome}</h3>
                <div class="quantidade ${insumo.quantidade < 10 ? 'estoque-baixo' : ''}">
                    ${insumo.quantidade} ${insumo.unidade}
                </div>
                <div class="custo">Custo: R$ ${insumo.preco?.toFixed(2) || '0.00'}/${insumo.unidade}</div>
                <div class="card-actions">
                    <button class="btn-editar" onclick="dashboard.editarInsumo('${insumo._id}')">✏️ Editar</button>
                    <button class="btn-excluir" onclick="dashboard.excluirInsumo('${insumo._id}')">🗑️ Excluir</button>
                </div>
            </div>
        `).join('');
    }

    // ===== PEDIDOS =====
    renderPedidos() {
        const container = document.getElementById('pedidosContainer');
        
        if (this.pedidos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum pedido registrado</div>';
            return;
        }

        container.innerHTML = this.pedidos.map(pedido => `
            <div class="pedido-card">
                <h3>Pedido #${pedido._id.slice(-6)}</h3>
                <div><strong>Cliente:</strong> ${pedido.cliente || 'Não informado'}</div>
                <div><strong>Itens:</strong> ${pedido.itens?.length || 0} produtos</div>
                <div><strong>Total:</strong> R$ ${pedido.total?.toFixed(2) || '0.00'}</div>
                <div class="status status-${pedido.status || 'pendente'}">
                    ${this.formatarStatus(pedido.status)}
                </div>
                <div class="card-actions">
                    <button class="btn-editar" onclick="dashboard.editarPedido('${pedido._id}')">✏️ Editar</button>
                    <button class="btn-excluir" onclick="dashboard.excluirPedido('${pedido._id}')">🗑️ Excluir</button>
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
        document.getElementById('totalVendas').textContent = vendas.toFixed(2);
        document.getElementById('totalCustos').textContent = gastos.toFixed(2);
        document.getElementById('lucro').textContent = lucro.toFixed(2);
    }

    // ===== UTILITÁRIOS =====
    limparForm(formId) {
        document.getElementById(formId).reset();
    }

    fecharModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }

    mostrarMensagem(mensagem, tipo = 'sucesso') {
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `mensagem mensagem-${tipo}`;
        mensagemDiv.textContent = mensagem;
        
        document.body.appendChild(mensagemDiv);
        
        setTimeout(() => {
            mensagemDiv.remove();
        }, 3000);
    }

    imprimirPedidos() {
        window.print();
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
