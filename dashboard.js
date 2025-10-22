// ===============================
// 🚀 Verifica autenticação do usuário (Login JWT)
// ===============================

// Recupera o token salvo no navegador
const token = localStorage.getItem('token');

// Se não houver token, redireciona para a página de login
if (!token) {
  window.location.href = '/login';
} else {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiracao = payload.exp * 1000;
    const agora = Date.now();

    if (agora > expiracao) {
      console.warn('⚠️ Token expirado. Redirecionando para login...');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  } catch (err) {
    console.error('❌ Token inválido:', err);
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

// ===============================
// 🧠 Classe principal do Dashboard
// ===============================
class Dashboard {
  constructor() {
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.chartFinanceiro = null;

    this.init();
  }

  // ===============================
  // 🚀 Inicialização geral
  // ===============================
  async init() {
    try {
      await this.carregarDados();
      this.configurarAbas();
      this.setupEventListeners();
      this.renderProdutos();
      this.renderInsumos();
      this.renderPedidos();
      this.updateFinanceiro();
      console.log('✅ Dashboard inicializado com sucesso');
    } catch (err) {
      console.error('❌ Erro ao inicializar dashboard:', err);
    }
  }

  // ===============================
  // 🔄 Carregamento inicial de dados
  // ===============================
  async carregarDados() {
    try {
      this.showToast('Carregando dados...', 'info', 900);
      const [produtosRes, pedidosRes, insumosRes] = await Promise.all([
        fetch('/api/menu').then(r => r.ok ? r.json() : []),
        fetch('/api/orders').then(r => r.ok ? r.json() : []),
        fetch('/api/insumos').then(r => r.ok ? r.json() : [])
      ]);

      this.produtos = produtosRes || [];
      this.pedidos = pedidosRes || [];
      this.insumos = insumosRes || [];

      console.log('📦 Dados carregados com sucesso');
    } catch (err) {
      console.error('❌ Erro ao carregar dados', err);
      this.showToast('Erro ao carregar dados', 'error');
    }
  }

  // ===============================
  // 🧭 Controle de abas
  // ===============================
  configurarAbas() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    if (!tabs.length || !contents.length) return;

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

  // ===============================
  // ⚙️ Eventos gerais
  // ===============================
  setupEventListeners() {
    // Botão Ver Cardápio
    document.getElementById('visualizarCardapio')?.addEventListener('click', () => {
      window.open('/', '_blank');
    });

    // Botão Sair
    document.getElementById('btnLogout')?.addEventListener('click', () => {
      if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    });
  }

  // ===============================
  // 🛒 Produtos
  // ===============================
  renderProdutos() {
    const container = document.getElementById('produtosContainer');
    if (!container) return;

    if (!this.produtos.length) {
      container.innerHTML = '<div class="empty-state">Nenhum produto encontrado</div>';
      return;
    }

    container.innerHTML = this.produtos.map(prod => `
      <article class="produto-card ${!prod.disponivel ? 'indisponivel' : ''}">
        <span class="categoria">${prod.categoria || ''}</span>
        <span class="status">${prod.disponivel ? '✅' : '⏸️'}</span>
        <h3>${prod.nome}</h3>
        <div class="preco">R$ ${(prod.preco || 0).toFixed(2)}</div>
        <div class="descricao">${prod.descricao || ''}</div>
      </article>
    `).join('');
  }

  // ===============================
  // 📦 Insumos
  // ===============================
  renderInsumos() {
    const container = document.getElementById('insumosContainer');
    if (!container) return;

    if (!this.insumos.length) {
      container.innerHTML = '<div class="empty-state">Nenhum insumo cadastrado</div>';
      return;
    }

    container.innerHTML = this.insumos.map(i => `
      <div class="produto-card ${i.quantidade <= (i.minimo || 0) ? 'estoque-baixo' : ''}">
        <h3>${i.nome}</h3>
        <div class="insumo-info">
          <div>${i.quantidade} ${i.unidade}</div>
          <div class="preco">R$ ${(i.preco || 0).toFixed(2)}/${i.unidade}</div>
        </div>
      </div>
    `).join('');
  }

  // ===============================
  // 📬 Pedidos
  // ===============================
  renderPedidos() {
    const container = document.getElementById('pedidosContainer');
    if (!container) return;

    if (!this.pedidos.length) {
      container.innerHTML = '<div class="empty-state">Nenhum pedido recebido</div>';
      return;
    }

    container.innerHTML = this.pedidos.map(p => `
      <article class="produto-card">
        <h3>Pedido #${p._id?.slice(-6)}</h3>
        <p><strong>Cliente:</strong> ${p.cliente || '-'}</p>
        <p><strong>Total:</strong> R$ ${(p.total || 0).toFixed(2)}</p>
        <p><strong>Status:</strong> ${p.status || 'pendente'}</p>
      </article>
    `).join('');
  }

  // ===============================
  // 💰 Financeiro (Gráfico)
  // ===============================
  async updateFinanceiro() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      this.renderFinanceiro(data);
      this.renderGraficoFinanceiro(data);
    } catch (err) {
      console.error('Erro financeiro:', err);
    }
  }

  renderFinanceiro({ vendas = 0, custos = 0, lucro = 0 } = {}) {
    document.getElementById('totalVendas').textContent = `R$ ${vendas.toFixed(2)}`;
    document.getElementById('totalCustos').textContent = `R$ ${custos.toFixed(2)}`;
    document.getElementById('lucro').textContent = `R$ ${lucro.toFixed(2)}`;
  }

  renderGraficoFinanceiro({ historico = [] } = {}) {
    const ctx = document.getElementById('graficoFinanceiro')?.getContext('2d');
    if (!ctx) return;

    const labels = historico.map(d => d.data);
    const vendas = historico.map(d => d.vendas);
    const custos = historico.map(d => d.custos);

    if (this.chartFinanceiro) this.chartFinanceiro.destroy();

    this.chartFinanceiro = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Vendas', data: vendas, borderColor: '#FFD700', fill: false, tension: 0.3 },
          { label: 'Custos', data: custos, borderColor: '#B22222', fill: false, tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } }
      }
    });
  }

  // ===============================
  // 🔔 Toasts de feedback
  // ===============================
  showToast(msg, tipo = 'success', tempo = 2500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, tempo);
  }
}

// ===============================
// 🚀 Inicialização global
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});
