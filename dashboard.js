// ===============================
// 🔐 AUTENTICAÇÃO COM JWT
// ===============================
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login';
} else {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    if (Date.now() > exp) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  } catch {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

// ===============================
// 🧭 DASHBOARD PRO
// ===============================
class Dashboard {
  constructor() {
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.financeiro = {};
    this.chartFinanceiro = null;

    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  async init() {
    this.configurarAbas();
    this.configurarLogout();
    await this.carregarDados();
    this.renderProdutos();
    this.renderInsumos();
    this.renderPedidos();
    await this.updateFinanceiro();
  }

  // ===============================
  // 🔄 CARREGAMENTO DE DADOS
  // ===============================
  async carregarDados() {
    try {
      const [produtosRes, pedidosRes, insumosRes] = await Promise.all([
        fetch('/api/menu').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/insumos').then(r => r.json())
      ]);
      this.produtos = produtosRes || [];
      this.pedidos = pedidosRes || [];
      this.insumos = insumosRes || [];
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      this.showToast('Erro ao carregar dados', 'error');
    }
  }

  // ===============================
  // 🧭 ABAS E LOGOUT
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

  configurarLogout() {
    const btn = document.getElementById('btnLogout');
    if (btn) {
      btn.addEventListener('click', () => {
        if (confirm('Deseja realmente sair?')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      });
    }
  }

  // ===============================
  // 🍔 PRODUTOS
  // ===============================
  renderProdutos() {
    const container = document.getElementById('produtosContainer');
    if (!container) return;
    if (!this.produtos.length) {
      container.innerHTML = `<div class="empty-state">Nenhum produto cadastrado</div>`;
      return;
    }

    container.innerHTML = this.produtos.map(prod => `
      <article class="produto-card ${!prod.disponivel ? 'indisponivel' : ''}">
        <span class="categoria">${prod.categoria}</span>
        <h3>${prod.nome}</h3>
        <div class="preco">R$ ${(prod.preco || 0).toFixed(2)}</div>
        <div class="descricao">${prod.descricao || ''}</div>
        ${prod.imagem ? `<img src="${prod.imagem}" alt="${prod.nome}" style="width:100%;border-radius:8px;margin:8px 0;">` : ''}
        <div class="card-actions">
          <button class="btn-editar" onclick='dashboard.abrirModalProduto(${JSON.stringify(prod).replace(/"/g, '&quot;')})'>Editar</button>
          <button class="btn-toggle" onclick="dashboard.toggleDisponibilidade('${prod._id}')">${prod.disponivel ? 'Pausar' : 'Ativar'}</button>
          <button class="btn-excluir" onclick="dashboard.excluirProduto('${prod._id}')">Excluir</button>
        </div>
      </article>
    `).join('');
  }

  async toggleDisponibilidade(id) {
    const p = this.produtos.find(x => x._id === id);
    if (!p) return;
    try {
      const res = await fetch(`/api/menu/item/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponivel: !p.disponivel })
      });
      if (res.ok) {
        p.disponivel = !p.disponivel;
        this.renderProdutos();
        this.showToast('Disponibilidade atualizada', 'success');
      }
    } catch {
      this.showToast('Erro ao atualizar produto', 'error');
    }
  }

  async excluirProduto(id) {
    if (!confirm('Excluir produto?')) return;
    try {
      await fetch(`/api/menu/item/${id}`, { method: 'DELETE' });
      this.produtos = this.produtos.filter(p => p._id !== id);
      this.renderProdutos();
      this.showToast('Produto excluído', 'success');
    } catch {
      this.showToast('Erro ao excluir produto', 'error');
    }
  }

  // ===============================
  // 🧾 PEDIDOS
  // ===============================
  renderPedidos() {
    const container = document.getElementById('pedidosContainer');
    if (!container) return;
    if (!this.pedidos.length) {
      container.innerHTML = `<div class="empty-state">Nenhum pedido recebido</div>`;
      return;
    }

    container.innerHTML = this.pedidos.map(p => `
      <div class="produto-card">
        <h3>Pedido #${p._id.slice(-6)}</h3>
        <p><strong>Cliente:</strong> ${p.cliente}</p>
        <p><strong>Total:</strong> R$ ${(p.total || 0).toFixed(2)}</p>
        <p><strong>Status:</strong> ${p.status}</p>
        <div class="card-actions">
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${p._id}','preparando')">👨‍🍳 Preparar</button>
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${p._id}','pronto')">✅ Pronto</button>
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${p._id}','entregue')">🚗 Entregue</button>
        </div>
      </div>
    `).join('');
  }

  async atualizarStatusPedido(id, novoStatus) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      if (res.ok) {
        const p = this.pedidos.find(x => x._id === id);
        if (p) p.status = novoStatus;
        this.renderPedidos();
        this.showToast('Status atualizado', 'success');
      }
    } catch {
      this.showToast('Erro ao atualizar status', 'error');
    }
  }

  // 🔄 Atualizar pedidos manualmente
  async updatePedidos() {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Erro ao atualizar pedidos');
      this.pedidos = await res.json();
      this.renderPedidos();
      this.showToast('Pedidos atualizados', 'success');
    } catch (err) {
      console.error('Erro ao atualizar pedidos:', err);
      this.showToast('Erro ao atualizar pedidos', 'error');
    }
  }

  // ===============================
  // 📦 INSUMOS
  // ===============================
  renderInsumos() {
    const container = document.getElementById('insumosContainer');
    if (!container) return;
    if (!this.insumos.length) {
      container.innerHTML = `<div class="empty-state">Nenhum insumo cadastrado</div>`;
      return;
    }

    container.innerHTML = this.insumos.map(i => `
      <div class="produto-card">
        <h3>${i.nome}</h3>
        <p>Quantidade: ${i.quantidade} ${i.unidade}</p>
        <p>Preço: R$ ${(i.preco || 0).toFixed(2)}</p>
      </div>
    `).join('');
  }

  // ===============================
  // 💰 FINANCEIRO PRO
  // ===============================
  async updateFinanceiro() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      this.financeiro = data;
      this.renderFinanceiro();
      this.renderGrafico();
    } catch (e) {
      console.error('Erro ao carregar financeiro:', e);
    }
  }

  renderFinanceiro() {
    const {
      vendas = 0,
      gastos = 0,
      lucro = 0,
      margem = 0,
      ticketMedio = 0,
      topProdutos = []
    } = this.financeiro;

    // Preenche valores principais
    document.getElementById('totalVendas').textContent = `R$ ${vendas.toFixed(2)}`;
    document.getElementById('totalCustos').textContent = `R$ ${gastos.toFixed(2)}`;
    document.getElementById('lucro').textContent = `R$ ${lucro.toFixed(2)}`;
    if (document.getElementById('margemLucro'))
      document.getElementById('margemLucro').textContent = `${margem.toFixed(1)}%`;

    // Ticket médio
    if (document.getElementById('ticketMedio'))
      document.getElementById('ticketMedio').textContent = `R$ ${ticketMedio.toFixed(2)}`;

    // Top produtos
    const topList = document.getElementById('topProdutos');
    if (topList) {
      if (!topProdutos.length) {
        topList.innerHTML = '<li>Nenhum dado disponível</li>';
      } else {
        topList.innerHTML = topProdutos
          .map(p => `<li>${p.nome} — <strong>${p.qtd}</strong> vendidos</li>`)
          .join('');
      }
    }
  }

  renderGrafico() {
    const ctx = document.getElementById('graficoFinanceiro');
    if (!ctx) return;
    const dias = this.financeiro.historico?.map(h => h.data) || [];
    const vendas = this.financeiro.historico?.map(h => h.vendas) || [];

    if (this.chartFinanceiro) this.chartFinanceiro.destroy();

    this.chartFinanceiro = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dias,
        datasets: [{
          label: 'Vendas',
          data: vendas,
          borderColor: '#d4af37',
          backgroundColor: 'rgba(212,175,55,0.2)',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: '📈 Histórico de Vendas Diárias' }
        }
      }
    });
  }

  // ===============================
  // ⚙️ UTILITÁRIOS
  // ===============================
  showToast(msg, tipo = 'success', tempo = 2500) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${tipo}`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, tempo);
  }
}

// Inicia o dashboard
window.dashboard = new Dashboard();
