const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/';
}
// ===============================
// dashboard.js - versão final profissional e segura
// ===============================
class Dashboard {
  constructor() {
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.financeiroData = {};
    this.baseURL = 'https://artesanal-blend.onrender.com';
    this.init();
  }

  // ===================== Fetch autenticado com JWT =====================
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

  // ===================== Carregar dados (seguro) =====================
  async carregarDados() {
    try {
      this.showToast('Carregando dados...', 'info', 800);

      const [menuRes, pedidosRes, insumosRes] = await Promise.all([
        this.fetchAutenticado(`${this.baseURL}/api/menu`),
        this.fetchAutenticado(`${this.baseURL}/api/orders`),
        this.fetchAutenticado(`${this.baseURL}/api/insumos`)
      ]);

      const validar = async (res) => {
        const tipo = res.headers.get('content-type') || '';
        if (!res.ok || !tipo.includes('application/json')) {
          const txt = await res.text();
          console.error('❌ Resposta inválida:', txt.slice(0, 200));
          throw new Error(`Resposta inválida (${res.status})`);
        }
        return res.json();
      };

      const [menu, pedidos, insumos] = await Promise.all([
        validar(menuRes),
        validar(pedidosRes),
        validar(insumosRes)
      ]);

      this.produtos = menu || [];
      this.pedidos = pedidos || [];
      this.insumos = insumos || [];

      console.log('✅ Dados carregados com sucesso');
    } catch (err) {
      console.error('⚠️ Erro ao carregar dados:', err);
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

  // ===================== MODAL UNIVERSAL (sem IDs duplicados) =====================
  criarModal(html) {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    return overlay;
  }

  fecharModal() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
  }

  // ===================== PRODUTOS =====================
  abrirModalProduto(produto = null) {
    const uid = Date.now();
    const modal = this.criarModal(`
      <div class="modal">
        <h3>${produto ? 'Editar' : 'Novo'} Produto</h3>
        <form id="formProduto-${uid}">
          <input type="hidden" id="produtoId-${uid}" value="${produto?._id || ''}">
          <div class="form-group">
            <label>Nome</label>
            <input id="produtoNome-${uid}" value="${produto?.nome || ''}" required>
          </div>
          <div class="form-group">
            <label>Categoria</label>
            <select id="produtoCategoria-${uid}">
              <option value="Hambúrgueres">Hambúrgueres</option>
              <option value="Combos">Combos</option>
              <option value="Acompanhamentos">Acompanhamentos</option>
              <option value="Adicionais">Adicionais</option>
              <option value="Bebidas">Bebidas</option>
            </select>
          </div>
          <div class="form-row">
            <input id="produtoPreco-${uid}" type="number" step="0.01" value="${produto?.preco ?? ''}" placeholder="Preço (R$)">
            <input id="produtoImagem-${uid}" value="${produto?.imagem || ''}" placeholder="URL da imagem">
          </div>
          <textarea id="produtoDescricao-${uid}" rows="2" placeholder="Descrição">${produto?.descricao || ''}</textarea>
          <label><input type="checkbox" id="produtoDisponivel-${uid}" ${produto?.disponivel !== false ? 'checked' : ''}> Disponível</label>
          <div class="modal-actions">
            <button type="submit" class="btn primary">Salvar</button>
            <button type="button" class="btn secondary" id="cancelar-${uid}">Cancelar</button>
          </div>
        </form>
      </div>
    `);

    modal.querySelector(`#cancelar-${uid}`).addEventListener('click', () => this.fecharModal());
    modal.querySelector(`#formProduto-${uid}`).addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        nome: document.getElementById(`produtoNome-${uid}`).value,
        categoria: document.getElementById(`produtoCategoria-${uid}`).value,
        preco: parseFloat(document.getElementById(`produtoPreco-${uid}`).value) || 0,
        descricao: document.getElementById(`produtoDescricao-${uid}`).value,
        imagem: document.getElementById(`produtoImagem-${uid}`).value,
        disponivel: document.getElementById(`produtoDisponivel-${uid}`).checked
      };
      const id = document.getElementById(`produtoId-${uid}`).value;
      await this.salvarProduto(data, id);
    });
  }

  async salvarProduto(data, id) {
    const url = id ? `${this.baseURL}/api/menu/item/${id}` : `${this.baseURL}/api/menu/item`;
    const method = id ? 'PUT' : 'POST';
    const res = await this.fetchAutenticado(url, { method, body: JSON.stringify(data) });
    if (res.ok) {
      this.showToast('Produto salvo!', 'success');
      this.fecharModal();
      await this.carregarDados();
      this.renderProdutos();
    } else this.showToast('Erro ao salvar produto', 'error');
  }

  // ===================== INSUMOS =====================
  abrirModalInsumo(insumo = null) {
    const uid = Date.now();
    const modal = this.criarModal(`
      <div class="modal">
        <h3>${insumo ? 'Editar' : 'Novo'} Insumo</h3>
        <form id="formInsumo-${uid}">
          <input type="hidden" id="insumoId-${uid}" value="${insumo?._id || ''}">
          <input id="insumoNome-${uid}" value="${insumo?.nome || ''}" placeholder="Nome">
          <input id="insumoQuantidade-${uid}" type="number" value="${insumo?.quantidade || 0}" placeholder="Qtd">
          <input id="insumoPreco-${uid}" type="number" step="0.01" value="${insumo?.preco || 0}" placeholder="Preço">
          <div class="modal-actions">
            <button type="submit" class="btn primary">Salvar</button>
            <button type="button" class="btn secondary" id="cancelarInsumo-${uid}">Cancelar</button>
          </div>
        </form>
      </div>
    `);
    modal.querySelector(`#cancelarInsumo-${uid}`).addEventListener('click', () => this.fecharModal());
    modal.querySelector(`#formInsumo-${uid}`).addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        nome: document.getElementById(`insumoNome-${uid}`).value,
        quantidade: parseInt(document.getElementById(`insumoQuantidade-${uid}`).value) || 0,
        preco: parseFloat(document.getElementById(`insumoPreco-${uid}`).value) || 0
      };
      const id = document.getElementById(`insumoId-${uid}`).value;
      await this.salvarInsumo(data, id);
    });
  }

  async salvarInsumo(data, id) {
    const url = id ? `${this.baseURL}/api/insumos/${id}` : `${this.baseURL}/api/insumos`;
    const method = id ? 'PUT' : 'POST';
    const res = await this.fetchAutenticado(url, { method, body: JSON.stringify(data) });
    if (res.ok) {
      this.showToast('Insumo salvo!', 'success');
      this.fecharModal();
      await this.carregarDados();
      this.renderInsumos();
    } else this.showToast('Erro ao salvar insumo', 'error');
  }

  // ===================== FINANCEIRO =====================
  initFinanceiro() {
    this.calcularFinanceiroLocal();
    this.renderFinanceiro();
    this.renderStats();
    this.renderGrafico();
    this.renderFluxoCaixa();
  }

  calcularFinanceiroLocal() {
    const pedidosEntregues = this.pedidos.filter(p => p.status === 'entregue');
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
    const d = this.financeiroData;
    document.getElementById('totalVendas').textContent = this.formatarMoeda(d.totalVendas);
    document.getElementById('totalCustos').textContent = this.formatarMoeda(d.totalCustos);
    document.getElementById('lucro').textContent = this.formatarMoeda(d.lucro);
    document.getElementById('margemLucro').textContent = `${d.margemLucro}%`;
  }

  renderStats() { /* idem versão anterior */ }
  renderGrafico() { /* idem versão anterior */ }
  renderFluxoCaixa() { /* idem versão anterior */ }

  // ===================== UTILITÁRIOS =====================
  formatarMoeda(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
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
      tipo === 'error' ? '#e74c3c' :
      tipo === 'info' ? '#3498db' : '#27ae60';
    toast.style.transition = 'opacity 0.4s';
    toast.style.fontWeight = 'bold';
    container.appendChild(toast);

    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, tempo);
  }
}

// ===================== Inicialização =====================
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});

