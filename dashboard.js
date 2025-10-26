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
// 🧭 DASHBOARD PRINCIPAL
// ===============================
class Dashboard {
  constructor() {
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.grafico = null;
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
      this.showToast('Carregando dados...', 'info', 800);
      const [produtosRes, pedidosRes, insumosRes] = await Promise.all([
        fetch('/api/menu').then(r => r.ok ? r.json() : []),
        fetch('/api/orders').then(r => r.ok ? r.json() : []),
        fetch('/api/insumos').then(r => r.ok ? r.json() : [])
      ]);
      this.produtos = produtosRes || [];
      this.pedidos = pedidosRes || [];
      this.insumos = insumosRes || [];
    } catch (err) {
      console.error('Erro ao carregar dados', err);
      this.showToast('Erro ao carregar dados', 'error');
    }
  }

  setupEventListeners() {
    // Tabs laterais
    document.querySelectorAll('.sidebar li').forEach(li => {
      li.addEventListener('click', () => {
        document.querySelectorAll('.sidebar li').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        li.classList.add('active');
        document.getElementById(li.dataset.tab).classList.add('active');
      });
    });

    // Botão ver cardápio
    document.getElementById('visualizarCardapio')?.addEventListener('click', () => {
      window.open('/', '_blank');
    });
  }

  // =================== PRODUTOS ===================
  abrirModalProduto(produto = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h3>${produto ? 'Editar' : 'Novo'} Produto</h3>
        <form id="formProduto">
          <input type="hidden" id="produtoId" value="${produto?._id || ''}">
          <div class="form-group">
            <label>Nome</label>
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
              <label>Imagem (URL)</label>
              <input type="text" id="produtoImagem" value="${produto?.imagem || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <textarea id="produtoDescricao" rows="3">${produto?.descricao || ''}</textarea>
          </div>
          <div class="form-group">
            <label><input type="checkbox" id="produtoDisponivel" ${produto?.disponivel !== false ? 'checked' : ''}> Disponível</label>
          </div>
          <div class="actions">
            <button type="submit" class="btn primary">Salvar</button>
            <button type="button" class="btn secondary" id="cancelarProduto">Cancelar</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('#cancelarProduto').addEventListener('click', () => modal.remove());
    modal.querySelector('#formProduto').addEventListener('submit', async e => {
      e.preventDefault();
      await this.salvarProduto();
      modal.remove();
    });
  }

  async salvarProduto() {
    const id = document.getElementById('produtoId').value;
    const data = {
      nome: document.getElementById('produtoNome').value,
      categoria: document.getElementById('produtoCategoria').value,
      preco: parseFloat(document.getElementById('produtoPreco').value),
      imagem: document.getElementById('produtoImagem').value,
      descricao: document.getElementById('produtoDescricao').value,
      disponivel: document.getElementById('produtoDisponivel').checked
    };
    const url = id ? `/api/menu/item/${id}` : '/api/menu/item';
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        this.showToast('Produto salvo', 'success');
        await this.carregarDados();
        this.renderProdutos();
      } else this.showToast('Erro ao salvar produto', 'error');
    } catch {
      this.showToast('Erro de rede', 'error');
    }
  }

  renderProdutos() {
    const container = document.getElementById('produtosContainer');
    const categoria = document.getElementById('filtroCategoria')?.value || '';
    const status = document.getElementById('filtroStatus')?.value || '';
    const busca = document.getElementById('buscaProdutos')?.value?.toLowerCase() || '';
    let produtos = [...this.produtos];

    if (categoria) produtos = produtos.filter(p => p.categoria === categoria);
    if (status === 'disponivel') produtos = produtos.filter(p => p.disponivel);
    if (status === 'indisponivel') produtos = produtos.filter(p => !p.disponivel);
    if (busca) produtos = produtos.filter(p => p.nome.toLowerCase().includes(busca));

    if (!produtos.length) {
      container.innerHTML = '<div class="empty-state">Nenhum produto encontrado</div>';
      return;
    }

    container.innerHTML = produtos.map(p => `
      <div class="produto-card ${!p.disponivel ? 'indisponivel' : ''}">
        <h3>${p.nome}</h3>
        <div class="preco">R$ ${(p.preco || 0).toFixed(2)}</div>
        ${p.imagem ? `<img src="${p.imagem}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;">` : ''}
        <div class="descricao">${p.descricao || ''}</div>
        <div class="card-actions">
          <button class="btn-editar" onclick="dashboard.abrirModalProduto(${JSON.stringify(p).replace(/"/g, '&quot;')})">Editar</button>
          <button class="btn-toggle" onclick="dashboard.toggleDisponibilidade('${p._id}')">${p.disponivel ? 'Pausar' : 'Ativar'}</button>
          <button class="btn-excluir" onclick="dashboard.excluirProduto('${p._id}')">Excluir</button>
        </div>
      </div>
    `).join('');
  }

  async toggleDisponibilidade(id) {
    const produto = this.produtos.find(p => p._id === id);
    if (!produto) return;
    try {
      const res = await fetch(`/api/menu/item/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponivel: !produto.disponivel })
      });
      if (res.ok) {
        produto.disponivel = !produto.disponivel;
        this.renderProdutos();
        this.showToast('Status atualizado', 'success');
      } else this.showToast('Erro ao atualizar', 'error');
    } catch {
      this.showToast('Erro de rede', 'error');
    }
  }

  async excluirProduto(id) {
    if (!confirm('Excluir este produto?')) return;
    try {
      const res = await fetch(`/api/menu/item/${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.produtos = this.produtos.filter(p => p._id !== id);
        this.renderProdutos();
        this.showToast('Produto excluído', 'success');
      } else this.showToast('Erro ao excluir', 'error');
    } catch {
      this.showToast('Erro de rede', 'error');
    }
  }

  // =================== INSUMOS ===================
  abrirModalInsumo(insumo = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h3>${insumo ? 'Editar' : 'Novo'} Insumo</h3>
        <form id="formInsumo">
          <input type="hidden" id="insumoId" value="${insumo?._id || ''}">
          <div class="form-row">
            <div class="form-group"><label>Nome</label><input type="text" id="insumoNome" value="${insumo?.nome || ''}" required></div>
            <div class="form-group"><label>Qtd</label><input type="number" id="insumoQuantidade" value="${insumo?.quantidade || 0}" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Unidade</label>
              <select id="insumoUnidade">
                <option value="g" ${insumo?.unidade === 'g' ? 'selected' : ''}>g</option>
                <option value="ml" ${insumo?.unidade === 'ml' ? 'selected' : ''}>ml</option>
                <option value="un" ${insumo?.unidade === 'un' ? 'selected' : ''}>un</option>
              </select>
            </div>
            <div class="form-group"><label>Preço Unitário (R$)</label><input type="number" id="insumoPreco" step="0.01" value="${insumo?.preco || 0}" required></div>
          </div>
          <div class="actions">
            <button class="btn primary" type="submit">Salvar</button>
            <button class="btn secondary" type="button" id="cancelarInsumo">Cancelar</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('#cancelarInsumo').addEventListener('click', () => modal.remove());
    modal.querySelector('#formInsumo').addEventListener('submit', async e => {
      e.preventDefault();
      await this.salvarInsumo();
      modal.remove();
    });
  }

  async salvarInsumo() {
    const id = document.getElementById('insumoId').value;
    const data = {
      nome: document.getElementById('insumoNome').value,
      quantidade: parseFloat(document.getElementById('insumoQuantidade').value),
      unidade: document.getElementById('insumoUnidade').value,
      preco: parseFloat(document.getElementById('insumoPreco').value)
    };
    const url = id ? `/api/insumos/${id}` : '/api/insumos';
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        this.showToast('Insumo salvo', 'success');
        await this.carregarDados();
        this.renderInsumos();
      } else this.showToast('Erro ao salvar', 'error');
    } catch {
      this.showToast('Erro de rede', 'error');
    }
  }

  renderInsumos() {
    const container = document.getElementById('insumosContainer');
    if (!this.insumos.length) {
      container.innerHTML = '<div class="empty-state">Nenhum insumo cadastrado</div>';
      return;
    }
    container.innerHTML = this.insumos.map(i => `
      <div class="produto-card">
        <h3>${i.nome}</h3>
        <div>${i.quantidade} ${i.unidade} - R$ ${(i.preco || 0).toFixed(2)}/${i.unidade}</div>
        <div class="card-actions">
          <button class="btn-editar" onclick="dashboard.abrirModalInsumo(${JSON.stringify(i).replace(/"/g, '&quot;')})">Editar</button>
          <button class="btn-excluir" onclick="dashboard.excluirInsumo('${i._id}')">Excluir</button>
        </div>
      </div>`).join('');
  }

  async excluirInsumo(id) {
    if (!confirm('Excluir este insumo?')) return;
    try {
      const res = await fetch(`/api/insumos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.insumos = this.insumos.filter(x => x._id !== id);
        this.renderInsumos();
        this.showToast('Insumo excluído', 'success');
      } else this.showToast('Erro ao excluir', 'error');
    } catch {
      this.showToast('Erro de rede', 'error');
    }
  }

  // =================== UTILITÁRIOS ===================
  showToast(msg, tipo = 'success', tempo = 2500) {
    const box = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${tipo}`;
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 500);
    }, tempo);
  }
}

// inicia
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});

// logout
document.getElementById('btnLogout')?.addEventListener('click', () => {
  if (confirm('Deseja realmente sair do sistema?')) {
    localStorage.removeItem('token');
    sessionStorage.clear();
    window.location.href = '/login';
  }
});
