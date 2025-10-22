// ===============================
// dashboard.js - versão final estável e integrada
// ===============================

// 🔐 Verifica se há token válido
const token = localStorage.getItem('token');
if (!token) {
  document.getElementById('loginOverlay')?.classList.remove('hidden');
}

// ===============================
// 📊 Classe principal do Dashboard
// ===============================
class Dashboard {
  constructor() {
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.financeiroData = {};
    this.baseURL = window.location.origin; // 🔧 usa o domínio atual (Render ou local)
    this.init();
  }

  // ===================== Fetch autenticado com JWT =====================
  async fetchAutenticado(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token ausente');

    const res = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'Authorization': `Bearer ${token}`,
        'Content-Type': options.headers?.['Content-Type'] || 'application/json',
      },
    });

    // Validação da resposta
    const tipo = res.headers.get('content-type') || '';
    if (!tipo.includes('application/json')) {
      const txt = await res.text();
      console.error('❌ Resposta não JSON recebida:', txt.slice(0, 200));
      throw new Error(`Resposta inválida (${res.status})`);
    }

    if (res.status === 403) {
      localStorage.removeItem('token');
      document.getElementById('loginOverlay')?.classList.remove('hidden');
      throw new Error('Token inválido ou expirado');
    }

    return res.json();
  }

  // ===================== Inicialização =====================
  async init() {
    try {
      await this.carregarDados();
      this.setupEventListeners();
      this.renderProdutos();
      this.renderPedidos();
      this.renderInsumos();
      console.log('✅ Dashboard iniciado com sucesso');
    } catch (err) {
      console.error('⚠️ Erro na inicialização:', err);
      this.showToast('Erro ao inicializar painel', 'error');
    }
  }

  // ===================== Carregar dados =====================
  async carregarDados() {
    try {
      this.showToast('Carregando dados...', 'info', 800);
      const [menu, pedidos, insumos] = await Promise.all([
        this.fetchAutenticado('/api/menu'),
        this.fetchAutenticado('/api/orders'),
        this.fetchAutenticado('/api/insumos'),
      ]);

      this.produtos = menu;
      this.pedidos = pedidos;
      this.insumos = insumos;
      this.calcularFinanceiroLocal();
      console.log('📦 Dados carregados com sucesso');
    } catch (err) {
      console.error('⚠️ Erro ao carregar dados:', err);
      this.showToast('Falha ao carregar dados', 'error');
    }
  }

  // ===================== Eventos =====================
  setupEventListeners() {
    document.querySelectorAll('.tab-button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));
        btn.classList.add('active');
        const tab = document.getElementById(btn.dataset.tab);
        tab?.classList.add('active');

        if (btn.dataset.tab === 'financeiroTab') this.renderFinanceiro();
      });
    });

    document.getElementById('visualizarCardapio')?.addEventListener('click', () => {
      window.open('/', '_blank');
    });
  }

  // ===================== Renderizações =====================
  renderProdutos() {
    const container = document.querySelector('#produtosTab') || document.createElement('div');
    if (!container) return;
    container.innerHTML = `
      <h2>Produtos</h2>
      <ul>${this.produtos.map(p => `<li>${p.nome} — ${this.formatarMoeda(p.preco)}</li>`).join('')}</ul>
    `;
  }

  renderPedidos() {
    const container = document.querySelector('#pedidosTab') || document.createElement('div');
    container.innerHTML = `
      <h2>Pedidos</h2>
      <ul>${this.pedidos.map(p => `<li>${p.cliente} — ${this.formatarMoeda(p.total)} (${p.status})</li>`).join('')}</ul>
    `;
  }

  renderInsumos() {
    const container = document.querySelector('#insumosTab') || document.createElement('div');
    container.innerHTML = `
      <h2>Insumos</h2>
      <ul>${this.insumos.map(i => `<li>${i.nome} — ${i.quantidade}un x ${this.formatarMoeda(i.preco)}</li>`).join('')}</ul>
    `;
  }

  // ===================== Financeiro =====================
  calcularFinanceiroLocal() {
    const pedidosEntregues = this.pedidos.filter((p) => p.status === 'entregue');
    const totalVendas = pedidosEntregues.reduce((s, p) => s + (parseFloat(p.total) || 0), 0);
    const totalCustos = totalVendas * 0.6;
    const lucro = totalVendas - totalCustos;

    this.financeiroData = {
      totalVendas,
      totalCustos,
      lucro,
      margemLucro: totalVendas ? ((lucro / totalVendas) * 100).toFixed(1) : 0,
    };
  }

  renderFinanceiro() {
    const f = this.financeiroData;
    const tab = document.querySelector('#financeiroTab');
    if (tab) {
      tab.innerHTML = `
        <h2>Financeiro</h2>
        <p>Total de Vendas: ${this.formatarMoeda(f.totalVendas)}</p>
        <p>Custos: ${this.formatarMoeda(f.totalCustos)}</p>
        <p>Lucro: ${this.formatarMoeda(f.lucro)}</p>
        <p>Margem: ${f.margemLucro}%</p>
      `;
    }
  }

  // ===================== Utilitários =====================
  formatarMoeda(v) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v || 0);
  }

  showToast(mensagem, tipo = 'success', tempo = 2500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.textContent = mensagem;
    toast.style.padding = '10px 16px';
    toast.style.marginTop = '6px';
    toast.style.borderRadius = '6px';
    toast.style.color = '#fff';
    toast.style.background =
      tipo === 'error'
        ? '#e74c3c'
        : tipo === 'info'
        ? '#3498db'
        : '#27ae60';
    toast.style.transition = 'opacity 0.4s';
    toast.style.fontWeight = 'bold';
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, tempo);
  }
}

// ===================== Inicialização global =====================
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});
