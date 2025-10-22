// ===============================
// dashboard.js - versão final mesclada (JWT + layout completo)
// ===============================

// 🚀 Verifica se o usuário está logado
const token = localStorage.getItem('token', data.token);
if (!token) {
  window.location.href = '/';
}

class Dashboard {
  constructor() {
    this.baseURL = 'https://artesanal-blend.onrender.com';
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.financeiroData = {};
    this.init();
  }

  // ===============================
  // 🔐 Fetch com autenticação JWT
  // ===============================
  async fetchAutenticado(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    };
    const res = await fetch(`${this.baseURL}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const txt = await res.text();
      console.error('❌ Erro na requisição:', res.status, txt);
      throw new Error(`Erro ${res.status}`);
    }
    return res.json();
  }

  // ===============================
  // 🚀 Inicialização
  // ===============================
  async init() {
    try {
      await this.carregarDados();
      this.configurarAbas();
      this.configurarBotoes();
      this.renderProdutos();
      this.renderPedidos();
      this.renderInsumos();
      this.renderFinanceiro();
      this.showToast('✅ Dashboard carregado com sucesso', 'success');
    } catch (err) {
      console.error('⚠️ Erro na inicialização:', err);
      this.showToast('Erro ao carregar o dashboard', 'error');
    }
  }

  // ===============================
  // 📦 Carrega dados do backend
  // ===============================
  async carregarDados() {
    this.showToast('Carregando dados...', 'info');
    try {
      const [produtos, pedidos, insumos] = await Promise.all([
        this.fetchAutenticado('/api/menu'),
        this.fetchAutenticado('/api/orders'),
        this.fetchAutenticado('/api/insumos')
      ]);

      this.produtos = produtos || [];
      this.pedidos = pedidos || [];
      this.insumos = insumos || [];

      console.log('✅ Dados carregados com sucesso');
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      throw err;
    }
  }

  // ===============================
  // 🧭 Configuração de abas
  // ===============================
  configurarAbas() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');

        if (tab.dataset.tab === 'financeiroTab') {
          this.renderFinanceiro();
        }
      });
    });
  }

  // ===============================
  // ⚙️ Botões principais
  // ===============================
  configurarBotoes() {
    document.getElementById('btnAddProduto')?.addEventListener('click', () => this.abrirModalProduto());
    document.getElementById('btnAddInsumo')?.addEventListener('click', () => this.abrirModalInsumo());
    document.getElementById('btnLogout')?.addEventListener('click', () => {
      if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('token');
        window.location.href = '/';
      }
    });
  }

  // ===============================
  // 🧱 Renderização - Produtos
  // ===============================
  renderProdutos() {
    const container = document.getElementById('produtosContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!this.produtos.length) {
      container.innerHTML = '<p>Nenhum produto cadastrado.</p>';
      return;
    }

    this.produtos.forEach(prod => {
      const card = document.createElement('div');
      card.className = 'produto-card';
      card.innerHTML = `
        <h3>${prod.nome}</h3>
        <p class="preco">R$ ${prod.preco.toFixed(2)}</p>
        <p>${prod.disponivel ? 'Disponível' : 'Indisponível'}</p>
        <div class="card-actions">
          <button class="btn-editar">Editar</button>
          <button class="btn-excluir">Excluir</button>
        </div>
      `;
      card.querySelector('.btn-editar').addEventListener('click', () => this.abrirModalProduto(prod));
      card.querySelector('.btn-excluir').addEventListener('click', () => this.excluirProduto(prod.id));
      container.appendChild(card);
    });
  }

  // ===============================
  // 🧾 Renderização - Pedidos
  // ===============================
  renderPedidos() {
    const container = document.getElementById('pedidosContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!this.pedidos.length) {
      container.innerHTML = '<p>Nenhum pedido encontrado.</p>';
      return;
    }

    this.pedidos.forEach(p => {
      const card = document.createElement('div');
      card.className = 'produto-card';
      card.innerHTML = `
        <h3>Pedido #${p.id}</h3>
        <p><strong>Cliente:</strong> ${p.cliente}</p>
        <p><strong>Status:</strong> ${p.status}</p>
        <p class="preco">Total: R$ ${p.total.toFixed(2)}</p>
      `;
      container.appendChild(card);
    });
  }

  // ===============================
  // 📦 Renderização - Insumos
  // ===============================
  renderInsumos() {
    const container = document.getElementById('insumosContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!this.insumos.length) {
      container.innerHTML = '<p>Nenhum insumo cadastrado.</p>';
      return;
    }

    this.insumos.forEach(i => {
      const card = document.createElement('div');
      card.className = 'produto-card';
      card.innerHTML = `
        <h3>${i.nome}</h3>
        <p>Quantidade: ${i.quantidade}</p>
        <p class="preco">R$ ${i.preco.toFixed(2)}</p>
        <div class="card-actions">
          <button class="btn-editar">Editar</button>
          <button class="btn-excluir">Excluir</button>
        </div>
      `;
      card.querySelector('.btn-editar').addEventListener('click', () => this.abrirModalInsumo(i));
      card.querySelector('.btn-excluir').addEventListener('click', () => this.excluirInsumo(i.id));
      container.appendChild(card);
    });
  }

  // ===============================
  // 💰 Financeiro local
  // ===============================
  calcularFinanceiro() {
    const pedidosEntregues = this.pedidos.filter(p => p.status === 'entregue');
    const totalVendas = pedidosEntregues.reduce((acc, p) => acc + p.total, 0);
    const totalCustos = totalVendas * 0.6;
    const lucro = totalVendas - totalCustos;
    const margemLucro = totalVendas ? ((lucro / totalVendas) * 100).toFixed(1) : 0;

    this.financeiroData = { totalVendas, totalCustos, lucro, margemLucro };
  }

  renderFinanceiro() {
    this.calcularFinanceiro();
    const d = this.financeiroData;
    document.getElementById('totalVendas').textContent = this.formatarMoeda(d.totalVendas);
    document.getElementById('totalCustos').textContent = this.formatarMoeda(d.totalCustos);
    document.getElementById('lucro').textContent = this.formatarMoeda(d.lucro);
    document.getElementById('margemLucro').textContent = `${d.margemLucro}%`;
  }

  // ===============================
  // 🧮 CRUD simples - Produto
  // ===============================
  abrirModalProduto(produto = null) {
    const nome = prompt('Nome do produto:', produto?.nome || '');
    if (!nome) return;
    const preco = parseFloat(prompt('Preço:', produto?.preco || 0));
    if (isNaN(preco)) return;
    const disponivel = confirm('Disponível para venda?');
    const novoProduto = { nome, preco, disponivel };

    if (produto?.id) {
      this.salvarProduto(novoProduto, produto.id);
    } else {
      this.salvarProduto(novoProduto);
    }
  }

  async salvarProduto(data, id = null) {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/menu/${id}` : '/api/menu';
    try {
      await this.fetchAutenticado(url, { method, body: JSON.stringify(data) });
      this.showToast('Produto salvo!', 'success');
      await this.carregarDados();
      this.renderProdutos();
    } catch {
      this.showToast('Erro ao salvar produto', 'error');
    }
  }

  async excluirProduto(id) {
    if (!confirm('Excluir este produto?')) return;
    try {
      await this.fetchAutenticado(`/api/menu/${id}`, { method: 'DELETE' });
      this.showToast('Produto removido', 'success');
      await this.carregarDados();
      this.renderProdutos();
    } catch {
      this.showToast('Erro ao excluir produto', 'error');
    }
  }

  // ===============================
  // 🧮 CRUD simples - Insumo
  // ===============================
  abrirModalInsumo(insumo = null) {
    const nome = prompt('Nome do insumo:', insumo?.nome || '');
    if (!nome) return;
    const quantidade = parseInt(prompt('Quantidade:', insumo?.quantidade || 0));
    const preco = parseFloat(prompt('Preço:', insumo?.preco || 0));
    const novoInsumo = { nome, quantidade, preco };

    if (insumo?.id) {
      this.salvarInsumo(novoInsumo, insumo.id);
    } else {
      this.salvarInsumo(novoInsumo);
    }
  }

  async salvarInsumo(data, id = null) {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/insumos/${id}` : '/api/insumos';
    try {
      await this.fetchAutenticado(url, { method, body: JSON.stringify(data) });
      this.showToast('Insumo salvo!', 'success');
      await this.carregarDados();
      this.renderInsumos();
    } catch {
      this.showToast('Erro ao salvar insumo', 'error');
    }
  }

  async excluirInsumo(id) {
    if (!confirm('Excluir este insumo?')) return;
    try {
      await this.fetchAutenticado(`/api/insumos/${id}`, { method: 'DELETE' });
      this.showToast('Insumo removido', 'success');
      await this.carregarDados();
      this.renderInsumos();
    } catch {
      this.showToast('Erro ao excluir insumo', 'error');
    }
  }

  // ===============================
  // 💬 Utilitários
  // ===============================
  formatarMoeda(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  }

  showToast(mensagem, tipo = 'info', tempo = 2500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.textContent = mensagem;
    toast.style.padding = '10px 16px';
    toast.style.borderRadius = '8px';
    toast.style.color = '#fff';
    toast.style.fontWeight = '600';
    toast.style.background =
      tipo === 'success' ? '#27ae60' :
      tipo === 'error' ? '#e74c3c' :
      '#3498db';
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, tempo);
  }
}

// ===============================
// 🚀 Inicialização
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});

