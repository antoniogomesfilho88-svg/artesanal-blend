// ===============================
// dashboard.js - versão final corrigida com autenticação JWT
// ===============================
class Dashboard {
  constructor() {
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.baseURL = 'https://artesanal-blend.onrender.com';
    this.init();
  }

  // ===================== NOVO: fetch com token =====================
  async fetchAutenticado(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
      'Content-Type': options.headers?.['Content-Type'] || 'application/json'
    };

    return fetch(url, { ...options, headers });
  }

  // ===================== Inicialização =====================
  async init() {
    await this.carregarDados();
    this.setupEventListeners();
    this.renderProdutos();
    this.renderInsumos();
    this.renderPedidos();
  }

  async carregarDados() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const [produtosRes, pedidosRes, insumosRes] = await Promise.all([
        this.fetchAutenticado(`${this.baseURL}/api/menu`).then(r => r.json()),
        this.fetchAutenticado(`${this.baseURL}/api/orders`).then(r => r.json()),
        this.fetchAutenticado(`${this.baseURL}/api/insumos`).then(r => r.json())
      ]);

      this.produtos = produtosRes || [];
      this.pedidos = pedidosRes || [];
      this.insumos = insumosRes || [];

      console.log('✅ Dados carregados:', this.produtos.length, this.pedidos.length, this.insumos.length);
    } catch (err) {
      console.error('⚠️ Erro ao carregar dados:', err);
      this.produtos = [];
      this.pedidos = [];
      this.insumos = [];
      this.showToast('Erro ao carregar dados', 'error');
    }
  }

  // ===================== EVENTOS =====================
  setupEventListeners() {
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');

        if (btn.dataset.tab === 'financeiroTab') this.initFinanceiro();
      });
    });

    document.getElementById('visualizarCardapio')?.addEventListener('click', () => {
      window.open('/', '_blank');
    });
  }

  // ===================== PRODUTOS =====================
  async salvarProduto() {
    const formData = {
      nome: document.getElementById('produtoNome').value,
      categoria: document.getElementById('produtoCategoria').value,
      preco: parseFloat(document.getElementById('produtoPreco').value) || 0,
      descricao: document.getElementById('produtoDescricao').value,
      imagem: document.getElementById('produtoImagem').value,
      disponivel: document.getElementById('produtoDisponivel').checked
    };

    const produtoId = document.getElementById('produtoId').value;
    const url = produtoId
      ? `${this.baseURL}/api/menu/item/${produtoId}`
      : `${this.baseURL}/api/menu/item`;
    const method = produtoId ? 'PUT' : 'POST';

    try {
      const res = await this.fetchAutenticado(url, {
        method,
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await this.carregarDados();
        this.renderProdutos();
        document.querySelector('.modal-overlay')?.remove();
        this.showToast('Produto salvo', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        this.showToast(err.error || 'Erro ao salvar produto', 'error');
      }
    } catch (e) {
      this.showToast('Erro de rede ao salvar produto', 'error');
    }
  }

  async toggleDisponibilidade(id) {
    const produto = this.produtos.find(p => p._id === id);
    if (!produto) return;
    try {
      const res = await this.fetchAutenticado(`${this.baseURL}/api/menu/item/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ disponivel: !produto.disponivel })
      });
      if (res.ok) {
        produto.disponivel = !produto.disponivel;
        this.renderProdutos();
        this.showToast('Disponibilidade atualizada', 'success');
      } else {
        this.showToast('Erro ao atualizar produto', 'error');
      }
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

  async excluirProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const res = await this.fetchAutenticado(`${this.baseURL}/api/menu/item/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        this.produtos = this.produtos.filter(p => p._id !== id);
        this.renderProdutos();
        this.showToast('Produto excluído', 'success');
      } else this.showToast('Erro ao excluir produto', 'error');
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

  // ===================== INSUMOS =====================
  async salvarInsumo() {
    const formData = {
      nome: document.getElementById('insumoNome').value,
      quantidade: parseInt(document.getElementById('insumoQuantidade').value) || 0,
      unidade: document.getElementById('insumoUnidade').value,
      preco: parseFloat(document.getElementById('insumoPreco').value) || 0
    };
    const insumoId = document.getElementById('insumoId').value;
    const url = insumoId
      ? `${this.baseURL}/api/insumos/${insumoId}`
      : `${this.baseURL}/api/insumos`;
    const method = insumoId ? 'PUT' : 'POST';
    try {
      const res = await this.fetchAutenticado(url, { method, body: JSON.stringify(formData) });
      if (res.ok) {
        await this.carregarDados();
        this.renderInsumos();
        document.querySelector('.modal-overlay')?.remove();
        this.showToast('Insumo salvo', 'success');
      } else this.showToast('Erro ao salvar insumo', 'error');
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

  async excluirInsumo(id) {
    if (!confirm('Tem certeza que deseja excluir este insumo?')) return;
    try {
      const res = await this.fetchAutenticado(`${this.baseURL}/api/insumos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.insumos = this.insumos.filter(x => x._id !== id);
        this.renderInsumos();
        this.showToast('Insumo excluído', 'success');
      } else this.showToast('Erro ao excluir insumo', 'error');
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

  // ===================== PEDIDOS =====================
  async salvarPedido(payload, pedidoId) {
    try {
      const url = pedidoId
        ? `${this.baseURL}/api/orders/${pedidoId}`
        : `${this.baseURL}/api/orders`;
      const method = pedidoId ? 'PUT' : 'POST';
      const res = await this.fetchAutenticado(url, {
        method,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await this.carregarDados();
        this.renderPedidos();
        document.querySelector('.modal-overlay')?.remove();
        this.showToast('Pedido salvo', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        this.showToast(err.error || 'Erro ao salvar pedido', 'error');
      }
    } catch (e) {
      this.showToast('Erro de rede ao salvar pedido', 'error');
    }
  }

  async atualizarStatusPedido(id, novoStatus) {
    try {
      const res = await this.fetchAutenticado(`${this.baseURL}/api/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: novoStatus })
      });
      if (res.ok) {
        const pedido = this.pedidos.find(p => p._id === id);
        if (pedido) pedido.status = novoStatus;
        this.renderPedidos();
        this.showToast('Status atualizado', 'success');
      } else this.showToast('Erro ao atualizar status', 'error');
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

  async excluirPedido(id) {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return;
    try {
      const res = await this.fetchAutenticado(`${this.baseURL}/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.pedidos = this.pedidos.filter(p => p._id !== id);
        this.renderPedidos();
        this.showToast('Pedido excluído', 'success');
      } else this.showToast('Erro ao excluir pedido', 'error');
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

  // ===================== FINANCEIRO =====================
  async updateFinanceiro() {
    const btn = document.querySelector('#financeiroTab .btn.secondary');
    if (btn) {
      btn.innerHTML = '⏳ Atualizando...';
      btn.disabled = true;
    }

    try {
      this.calcularFinanceiroLocal();
      this.renderFinanceiro();
      this.renderStats();
      this.renderGrafico();
      this.renderUltimosPedidos();
      this.renderFluxoCaixa();
      if (btn) {
        btn.innerHTML = '🔄 Atualizar';
        btn.disabled = false;
      }
      this.showToast('Dados financeiros atualizados!', 'success');
    } catch (error) {
      console.error('Erro no financeiro:', error);
      this.showToast('Erro ao carregar dados financeiros', 'error');
    }
  }

  // ... (demais funções financeiras e de renderização permanecem iguais ao seu código atual)
}

// ===================== Inicialização =====================
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});
