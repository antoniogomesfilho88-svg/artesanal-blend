// dashboard.js - versão completa com login JWT
class Dashboard {
  constructor() {
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.token = null;
    this.init();
  }

  async init() {
    // Primeiro, checa login
    await this.checarLogin();

    // Se estiver logado, carrega dados
    if (this.token) {
      await this.carregarDados();
      this.setupEventListeners();
      this.renderProdutos();
      this.renderInsumos();
      this.renderPedidos();
      this.updateFinanceiro();
    }
  }

  /* ================= LOGIN ================= */
  async checarLogin() {
    this.token = localStorage.getItem('token');
    if (!this.token) {
      await this.mostrarLoginModal();
    }
  }

  async mostrarLoginModal() {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal">
          <h3>Login</h3>
          <form id="formLogin">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="loginEmail" required>
            </div>
            <div class="form-group">
              <label>Senha</label>
              <input type="password" id="loginSenha" required>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
              <button type="submit" class="btn primary">Entrar</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#formLogin').addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const senha = document.getElementById('loginSenha').value;
        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
          });
          if (res.ok) {
            const data = await res.json();
            this.token = data.token;
            localStorage.setItem('token', this.token);
            modal.remove();
            resolve();
          } else {
            const err = await res.json().catch(() => ({}));
            this.showToast(err.error || 'Login falhou', 'error');
          }
        } catch (e) {
          this.showToast('Erro de rede', 'error');
        }
      });
    });
  }

  getAuthHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` };
  }

  /* ================= CARREGAR DADOS ================= */
  async carregarDados() {
    try {
      this.showToast('Carregando dados...', 'info', 900);
      const [produtosRes, pedidosRes, insumosRes] = await Promise.all([
        fetch('/api/menu', { headers: this.getAuthHeaders() }).then(r => r.ok ? r.json() : []),
        fetch('/api/orders', { headers: this.getAuthHeaders() }).then(r => r.ok ? r.json() : []),
        fetch('/api/insumos', { headers: this.getAuthHeaders() }).then(r => r.ok ? r.json() : [])
      ]);

      this.produtos = produtosRes || [];
      this.pedidos = pedidosRes || [];
      this.insumos = insumosRes || [];

      console.log('Dados carregados:', this.produtos.length, 'produtos,', this.pedidos.length, 'pedidos,', this.insumos.length, 'insumos');
    } catch (err) {
      console.error('Erro ao carregar dados', err);
      this.produtos = this.produtos || [];
      this.pedidos = this.pedidos || [];
      this.insumos = this.insumos || [];
      this.showToast('Erro ao carregar dados', 'error');
    }
  }

  /* ================= EVENT LISTENERS ================= */
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

    // visualizar cardápio
    document.getElementById('visualizarCardapio')?.addEventListener('click', () => {
      window.open('/', '_blank');
    });
  }

  /* ================= PRODUTOS ================= */
  abrirModalProduto(produto = null) {
    // ... (mesmo código do seu original)
  }

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
    const url = produtoId ? `/api/menu/item/${produtoId}` : '/api/menu/item';
    const method = produtoId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: this.getAuthHeaders(),
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

  renderProdutos() {
    // ... (mesmo código do seu original)
  }

  filtrarProdutos() { this.renderProdutos(); }

  async toggleDisponibilidade(id) {
    // ... (mesmo código do seu original)
  }

  async excluirProduto(id) {
    // ... (mesmo código do seu original)
  }

  /* ================= INSUMOS ================= */
  abrirModalInsumo(insumo = null) {
    // ... (mesmo código do seu original)
  }

  async salvarInsumo() {
    // ... (mesmo código do seu original, usando this.getAuthHeaders())
  }

  renderInsumos() {
    // ... (mesmo código do seu original)
  }

  async excluirInsumo(id) {
    // ... (mesmo código do seu original, usando this.getAuthHeaders())
  }

  /* ================= PEDIDOS ================= */
  abrirModalPedido(pedido = null) {
    // ... (mesmo código do seu original)
  }

  renderPedidos() {
    // ... (mesmo código do seu original)
  }

  formatarStatus(status) {
    const map = { pendente: '⏳ Pendente', preparando: '👨‍🍳 Preparando', pronto: '✅ Pronto', entregue: '🚗 Entregue', cancelado: '❌ Cancelado' };
    return map[status] || status;
  }

  async atualizarStatusPedido(id, novoStatus) {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'PUT', headers: this.getAuthHeaders(), body: JSON.stringify({ status: novoStatus }) });
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
    // ... (mesmo código do seu original, usando this.getAuthHeaders())
  }

  imprimirCupom(id) {
    // ... (mesmo código do seu original)
  }

  /* ================= FINANCEIRO ================= */
  async updateFinanceiro() {
    try {
      const res = await fetch('/api/stats', { headers: this.getAuthHeaders() });
      if (res.ok) {
        const financeiro = await res.json();
        this.atualizarUIFinanceiro(financeiro);
      }
    } catch (e) {
      console.error('Erro financeiro', e);
    }
  }

  atualizarUIFinanceiro({ vendas = 0, gastos = 0, lucro = 0 } = {}) {
    document.getElementById('totalVendas').textContent = `R$ ${Number(vendas).toFixed(2)}`;
    document.getElementById('totalCustos').textContent = `R$ ${Number(gastos).toFixed(2)}`;
    document.getElementById('lucro').textContent = `R$ ${Number(lucro).toFixed(2)}`;
  }

  /* ================= UTILITÁRIOS ================= */
  showToast(mensagem, tipo = 'success', timeout = 2500) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${tipo === 'error' ? 'error' : tipo === 'info' ? 'info' : 'success'}`;
    t.textContent = mensagem;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, timeout);
  }

  _formatImageSrc(src) {
    if (!src) return '';
    try {
      const u = new URL(src);
      return src;
    } catch (e) {
      if (src.startsWith('/')) return src;
      return src;
    }
  }
}

// inicia
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});
