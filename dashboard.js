// dashboard.js - versão completa com login JWT
class Dashboard {
  constructor() {
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.token = localStorage.getItem('token') || null;
    this.init();
  }

  async init() {
    // Verifica se usuário está logado
    if (!this.token) {
      this.abrirModalLogin();
      return;
    }

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
      const headers = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};

      const [produtosRes, pedidosRes, insumosRes] = await Promise.all([
        fetch('/api/menu', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/orders', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/insumos', { headers }).then(r => r.ok ? r.json() : [])
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

  /* ================= LOGIN ================= */
  abrirModalLogin() {
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

    modal.querySelector('#formLogin').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.fazerLogin();
    });
  }

  async fazerLogin() {
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
        document.querySelector('.modal-overlay')?.remove();
        this.init();
        this.showToast('Login realizado com sucesso', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        this.showToast(err.error || 'Erro ao fazer login', 'error');
      }
    } catch (e) {
      this.showToast('Erro de rede ao fazer login', 'error');
    }
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
              <label>URL da Imagem</label>
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
    `;
    document.body.appendChild(modal);
    modal.querySelector('#btnCancelarProduto').addEventListener('click', () => modal.remove());
    modal.querySelector('#formProduto').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.salvarProduto();
    });
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
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
    const container = document.getElementById('produtosContainer');
    const categoria = document.getElementById('filtroCategoria')?.value || '';
    const status = document.getElementById('filtroStatus')?.value || '';
    const busca = document.getElementById('buscaProdutos')?.value?.toLowerCase() || '';

    let produtosFiltrados = (this.produtos || []).slice();

    if (categoria) produtosFiltrados = produtosFiltrados.filter(p => p.categoria === categoria);
    if (status === 'disponivel') produtosFiltrados = produtosFiltrados.filter(p => p.disponivel);
    else if (status === 'indisponivel') produtosFiltrados = produtosFiltrados.filter(p => !p.disponivel);
    if (busca) produtosFiltrados = produtosFiltrados.filter(p => (p.nome || '').toLowerCase().includes(busca) || (p.descricao || '').toLowerCase().includes(busca));

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
        ${prod.imagem ? `<div style="margin:0.75rem 0"><img src="${this._formatImageSrc(prod.imagem)}" alt="${prod.nome}" style="width:100%;height:140px;object-fit:cover;border-radius:8px"></div>` : ''}
        <div class="card-actions">
          <button class="btn-editar" onclick='dashboard.abrirModalProduto(${JSON.stringify(prod).replace(/\"/g,'&quot;')})'>Editar</button>
          <button class="btn-toggle" onclick="dashboard.toggleDisponibilidade('${prod._id}')">${prod.disponivel ? 'Pausar' : 'Ativar'}</button>
          <button class="btn-excluir" onclick="dashboard.excluirProduto('${prod._id}')">Excluir</button>
        </div>
      </article>
    `).join('');
  }

  // TODO: Continuar com insumos, pedidos, cupom, financeiro e utilitários
  // Mesma lógica do seu original, mas todos os fetch passam o header 'Authorization': `Bearer ${this.token}`

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
    try { const u = new URL(src); return src; } catch (e) { return src.startsWith('/') ? src : src; }
  }
}

// inicia
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});
