// dashboard.js - versão separada
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
    this.renderInsumos();
    this.renderPedidos();
    this.updateFinanceiro();
  }

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

      console.log('Dados carregados:', this.produtos.length, 'produtos,', this.pedidos.length, 'pedidos,', this.insumos.length, 'insumos');
    } catch (err) {
      console.error('Erro ao carregar dados', err);
      this.produtos = this.produtos || [];
      this.pedidos = this.pedidos || [];
      this.insumos = this.insumos || [];
      this.showToast('Erro ao carregar dados', 'error');
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

    // visualizar cardápio
    document.getElementById('visualizarCardapio')?.addEventListener('click', () => {
      window.open('/', '_blank');
    });
  }

  /* ================= PRODUTOS ================= */
  abrirModalProduto(produto = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h3>${produto ? 'Editar' : 'Novo'} Produto</h3>
        <form id="formProduto">
          <input type="hidden" id="produtoId" value="${produto?._id || ''}">
          <div class="form-group">
            <label>Nome do Produto</label>
            <input type="text" id="produtoNome" value="${produto?.nome || ''}" required>
          </div>

          <div class="form-group">
            <label>Categoria</label>
            <select id="produtoCategoria" required>
              <option value="">Selecione...</option>
              <option value="Hambúrgueres" ${produto?.categoria === 'Hambúrgueres' ? 'selected' : ''}>Hambúrgueres</option>
              <option value="Combos" ${produto?.categoria === 'Combos' ? 'selected' : ''}>Combos</option>
              <option value="Acompanhamentos" ${produto?.categoria === 'Acompanhamentos' ? 'selected' : ''}>Acompanhamentos</option>
              <option value="Adicionais" ${produto?.categoria === 'Adicionais' ? 'selected' : ''}>Adicionais</option>
              <option value="Bebidas" ${produto?.categoria === 'Bebidas' ? 'selected' : ''}>Bebidas</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Preço (R$)</label>
              <input type="number" id="produtoPreco" step="0.01" value="${produto?.preco ?? ''}" required>
            </div>
            <div class="form-group">
              <label>URL da Imagem (ex: images/nome.jpg ou https://...)</label>
              <input type="text" id="produtoImagem" value="${produto?.imagem || ''}">
            </div>
          </div>

          <div class="form-group">
            <label>Descrição</label>
            <textarea id="produtoDescricao" rows="3">${produto?.descricao || ''}</textarea>
          </div>

          <div style="display:flex;gap:.5rem;align-items:center;margin-top:.5rem">
            <label><input type="checkbox" id="produtoDisponivel" ${produto?.disponivel !== false ? 'checked' : ''}> Disponível</label>
          </div>

          <div style="display:flex;gap:.5rem;margin-top:1rem;justify-content:flex-end">
            <button type="submit" class="btn primary">Salvar</button>
            <button type="button" class="btn secondary" id="btnCancelarProduto">Cancelar</button>
          </div>
        </form>
      </div>
    `
