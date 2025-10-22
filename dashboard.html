// ===============================
// 🔐 Verificação de Login (JWT)
// ===============================
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login';
} else {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    if (Date.now() > exp) {
      console.warn('⚠️ Token expirado. Redirecionando...');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  } catch (err) {
    console.error('Token inválido:', err);
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

// ===============================
// 📊 Classe Principal do Dashboard
// ===============================
class Dashboard {
  constructor() {
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.init();
  }

  async init() {
    await this.carregarDados();
    this.configurarAbas();
    this.setupEventListeners();
    this.renderProdutos();
    this.renderInsumos();
    this.renderPedidos();
    this.updateFinanceiro(); // vai existir, mas versão simples
  }

  // ===============================
  // 📦 Carrega Dados
  // ===============================
  async carregarDados() {
    try {
      this.showToast('Carregando dados...', 'info', 1000);
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

      const [produtosRes, pedidosRes, insumosRes] = await Promise.all([
        fetch('/api/menu', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/orders', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/insumos', { headers }).then(r => r.ok ? r.json() : [])
      ]);

      this.produtos = produtosRes || [];
      this.pedidos = pedidosRes || [];
      this.insumos = insumosRes || [];

      console.log('✅ Dados carregados:', {
        produtos: this.produtos.length,
        pedidos: this.pedidos.length,
        insumos: this.insumos.length
      });
    } catch (err) {
      console.error('Erro ao carregar dados', err);
      this.showToast('Erro ao carregar dados', 'error');
    }
  }

  // ===============================
  // ⚙️ Configurar Abas e Botões
  // ===============================
  configurarAbas() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById(tab.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  }

  setupEventListeners() {
    document.getElementById('visualizarCardapio')?.addEventListener('click', () => {
      window.open('/', '_blank');
    });

    document.getElementById('btnLogout')?.addEventListener('click', () => {
      if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    });

    // Filtros Produtos
    document.getElementById('filtroCategoria')?.addEventListener('change', () => this.renderProdutos());
    document.getElementById('filtroStatus')?.addEventListener('change', () => this.renderProdutos());
    document.getElementById('buscaProdutos')?.addEventListener('input', () => this.renderProdutos());
  }

  // ===============================
  // 🧱 Renderizar Produtos
  // ===============================
  renderProdutos() {
    const container = document.getElementById('produtosContainer');
    if (!container) return;

    const categoria = document.getElementById('filtroCategoria')?.value || '';
    const status = document.getElementById('filtroStatus')?.value || '';
    const busca = document.getElementById('buscaProdutos')?.value?.toLowerCase() || '';

    let produtosFiltrados = (this.produtos || []).slice();
    if (categoria) produtosFiltrados = produtosFiltrados.filter(p => p.categoria === categoria);
    if (status === 'disponivel') produtosFiltrados = produtosFiltrados.filter(p => p.disponivel);
    else if (status === 'indisponivel') produtosFiltrados = produtosFiltrados.filter(p => !p.disponivel);
    if (busca) produtosFiltrados = produtosFiltrados.filter(p => (p.nome || '').toLowerCase().includes(busca));

    if (!produtosFiltrados.length) {
      container.innerHTML = '<div class="empty-state">Nenhum produto encontrado</div>';
      return;
    }

    container.innerHTML = produtosFiltrados.map(prod => `
      <article class="produto-card ${!prod.disponivel ? 'indisponivel' : ''}">
        <span class="categoria">${prod.categoria || ''}</span>
        <span class="status">${prod.disponivel ? '✅' : '⏸️'}</span>
        <h3>${prod.nome}</h3>
        <div class="preco">R$ ${(prod.preco || 0).toFixed(2)}</div>
        <div class="descricao">${prod.descricao || ''}</div>
        ${prod.imagem ? `<img src="${this._formatImageSrc(prod.imagem)}" alt="${prod.nome}" style="width:100%;border-radius:8px;margin:8px 0;">` : ''}
        <div class="card-actions">
          <button class="btn-editar" onclick='dashboard.abrirModalProduto(${JSON.stringify(prod).replace(/"/g, '&quot;')})'>Editar</button>
          <button class="btn-toggle" onclick="dashboard.toggleDisponibilidade('${prod._id}')">${prod.disponivel ? 'Pausar' : 'Ativar'}</button>
          <button class="btn-excluir" onclick="dashboard.excluirProduto('${prod._id}')">Excluir</button>
        </div>
      </article>
    `).join('');
  }

  async toggleDisponibilidade(id) {
    const produto = this.produtos.find(p => p._id === id);
    if (!produto) return;
    try {
      const res = await fetch(`/api/menu/item/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ disponivel: !produto.disponivel })
      });
      if (res.ok) {
        produto.disponivel = !produto.disponivel;
        this.renderProdutos();
        this.showToast('Disponibilidade atualizada', 'success');
      }
    } catch {
      this.showToast('Erro ao atualizar produto', 'error');
    }
  }

  async excluirProduto(id) {
    if (!confirm('Deseja excluir este produto?')) return;
    try {
      const res = await fetch(`/api/menu/item/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        this.produtos = this.produtos.filter(p => p._id !== id);
        this.renderProdutos();
        this.showToast('Produto excluído', 'success');
      }
    } catch {
      this.showToast('Erro ao excluir produto', 'error');
    }
  }

  // ===============================
  // 💰 Financeiro (versão simples)
  // ===============================
  async updateFinanceiro() {
    try {
      const res = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      document.getElementById('totalVendas').textContent = `R$ ${data.vendas.toFixed(2)}`;
      document.getElementById('totalCustos').textContent = `R$ ${data.gastos.toFixed(2)}`;
      document.getElementById('lucro').textContent = `R$ ${data.lucro.toFixed(2)}`;
    } catch (err) {
      console.error('Erro financeiro:', err);
    }
  }

  // ===============================
  // 🧩 Utilitários
  // ===============================
  _formatImageSrc(src) {
    if (!src) return '';
    if (src.startsWith('http')) return src;
    return src.startsWith('/') ? src : `/${src}`;
  }

  showToast(msg, tipo = 'success', tempo = 2500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = 0;
      setTimeout(() => toast.remove(), 400);
    }, tempo);
  }
}

// ===============================
// 🚀 Inicializa Dashboard
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});
