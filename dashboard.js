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
        this.renderPedidos();
        this.renderInsumos();
        this.updateFinanceiro();
    }

    async carregarDados() {
        try {
            const [produtosRes, pedidosRes, insumosRes] = await Promise.all([
                fetch('/api/produtos'),
                fetch('/api/pedidos'),
                fetch('/api/insumos')
            ]);

            if (produtosRes.ok) this.produtos = await produtosRes.json();
            if (pedidosRes.ok) this.pedidos = await pedidosRes.json();
            if (insumosRes.ok) this.insumos = await insumosRes.json();

        } catch (error) {
            console.log('Erro ao carregar dados:', error);
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
        document.getElementById('formProduto').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarProduto();
        });

        // Botão ver cardápio
        document.getElementById('visualizarCardapio').addEventListener('click', () => {
            window.open('/', '_blank');
        });
    }

    // ===== PRODUTOS =====
    abrirModalProduto(produto = null) {
        const modal = document.getElementById('modalProduto');
        const titulo = document.getElementById('modalProdutoTitulo');
        const form = document.getElementById('formProduto');
        
        if (produto) {
            titulo.textContent = 'Editar Produto';
            document.getElementById('produtoId').value = produto._id;
            document.getElementById('produtoNome').value = produto.nome;
            document.getElementById('produtoCategoria').value = produto.categoria;
            document.getElementById('produtoPreco').value = produto.preco;
            document.getElementById('produtoDescricao').value = produto.descricao || '';
            document.getElementById('produtoImagem').value = produto.imagem || '';
            document.getElementById('produtoDisponivel').checked = produto.disponivel;
        } else {
            titulo.textContent = 'Novo Produto';
            form.reset();
            document.getElementById('produtoId').value = '';
        }
        
        modal.style.display = 'flex';
    }

    fecharModal() {
        document.getElementById('modalProduto').style.display = 'none';
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
        const filtroCategoria = document.getElementById('filtroCategoria').value;
        const filtroStatus = document.getElementById('filtroStatus').value;

        let produtosFiltrados = this.produtos;

        if (filtroCategoria) {
            produtosFiltrados = produtosFiltrados.filter(p => p.categoria === filtroCategoria);
        }

        if (filtroStatus === 'disponivel') {
            produtosFiltrados = produtosFiltrados.filter(p => p.disponivel);
        } else if (filtroStatus === 'indisponivel') {
            produtosFiltrados = produtosFiltrados.filter(p => !p.disponivel);
        }

        if (produtosFiltrados.length === 0) {
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

    // ===== PEDIDOS =====
    async atualizarPedidos() {
        await this.carregarDados();
        this.renderPedidos();
        this.mostrarMensagem('Pedidos atualizados!');
    }

    renderPedidos() {
        const container = document.getElementById('pedidosContainer');
        
        if (this.pedidos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum pedido recebido</div>';
            return;
        }

        container.innerHTML = this.pedidos.map(pedido => `
            <div class="produto-card">
                <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3>Pedido #${pedido._id?.slice(-6) || 'N/A'}</h3>
                        <p><strong>Cliente:</strong> ${pedido.cliente}</p>
                        <p><strong>Telefone:</strong> ${pedido.telefone}</p>
                        <p><strong>Endereço:</strong> ${pedido.endereco}</p>
                    </div>
                    <span class="status ${pedido.status}">
                        ${this.formatarStatus(pedido.status)}
                    </span>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <strong>Itens:</strong>
                    ${pedido.itens?.map(item => `
                        <div style="display: flex; justify-content: between; margin: 0.25rem 0;">
                            <span>${item.qtd}x ${item.nome}</span>
                            <span>R$ ${(item.preco * item.qtd).toFixed(2)}</span>
                        </div>
                    `).join('') || ''}
                </div>
                
                <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                    <div style="display: flex; justify-content: between;">
                        <strong>Total: R$ ${pedido.total?.toFixed(2) || '0.00'}</strong>
                        <span>${new Date(pedido.criadoEm).toLocaleString()}</span>
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
                document.getElementById('totalVendas').textContent = `R$ ${financeiro.vendas.toFixed(2)}`;
                document.getElementById('totalCustos').textContent = `R$ ${financeiro.gastos.toFixed(2)}`;
                document.getElementById('lucro').textContent = `R$ ${financeiro.lucro.toFixed(2)}`;
            }
        } catch (error) {
            console.log('Erro ao carregar dados financeiros');
        }
    }

    // ===== MENSAGENS =====
    mostrarMensagem(mensagem, tipo = 'sucesso') {
        // Implementação simples de mensagens
        alert(mensagem); // Você pode substituir por um sistema de notificações mais elaborado
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
