// dashboard.js - versão corrigida
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
        headers: { 'Content-Type': 'application/json' },
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

  filtrarProdutos() { this.renderProdutos(); }

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
        this.showToast('Disponibilidade atualizada', 'success');
      } else {
        this.showToast('Erro ao atualizar produto', 'error');
      }
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

  async excluirProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const res = await fetch(`/api/menu/item/${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.produtos = this.produtos.filter(p => p._id !== id);
        this.renderProdutos();
        this.showToast('Produto excluído', 'success');
      } else this.showToast('Erro ao excluir produto', 'error');
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

  /* ================= INSUMOS ================= */
  abrirModalInsumo(insumo = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h3>${insumo ? 'Editar' : 'Novo'} Insumo</h3>
        <form id="formInsumo">
          <input type="hidden" id="insumoId" value="${insumo?._id || ''}">
          <div class="form-row">
            <div class="form-group">
              <label>Nome</label>
              <input type="text" id="insumoNome" value="${insumo?.nome || ''}" required>
            </div>
            <div class="form-group">
              <label>Quantidade</label>
              <input type="number" id="insumoQuantidade" value="${insumo?.quantidade || 0}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Unidade</label>
              <select id="insumoUnidade">
                <option value="g" ${insumo?.unidade === 'g' ? 'selected' : ''}>g</option>
                <option value="ml" ${insumo?.unidade === 'ml' ? 'selected' : ''}>ml</option>
                <option value="un" ${insumo?.unidade === 'un' ? 'selected' : ''}>un</option>
                <option value="kg" ${insumo?.unidade === 'kg' ? 'selected' : ''}>kg</option>
                <option value="l" ${insumo?.unidade === 'l' ? 'selected' : ''}>l</option>
              </select>
            </div>
            <div class="form-group">
              <label>Preço Unitário (R$)</label>
              <input type="number" id="insumoPreco" step="0.01" value="${insumo?.preco || 0}" required>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:.75rem">
            <button class="btn primary" type="submit">Salvar</button>
            <button class="btn secondary" type="button" id="btnCancelarInsumo">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#btnCancelarInsumo').addEventListener('click', () => modal.remove());
    modal.querySelector('#formInsumo').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.salvarInsumo();
    });
  }

  async salvarInsumo() {
    const formData = {
      nome: document.getElementById('insumoNome').value,
      quantidade: parseInt(document.getElementById('insumoQuantidade').value) || 0,
      unidade: document.getElementById('insumoUnidade').value,
      preco: parseFloat(document.getElementById('insumoPreco').value) || 0
    };
    const insumoId = document.getElementById('insumoId').value;
    const url = insumoId ? `/api/insumos/${insumoId}` : '/api/insumos';
    const method = insumoId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) {
        await this.carregarDados();
        this.renderInsumos();
        document.querySelector('.modal-overlay')?.remove();
        this.showToast('Insumo salvo', 'success');
      } else this.showToast('Erro ao salvar insumo', 'error');
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

  renderInsumos() {
    const container = document.getElementById('insumosContainer');
    if (!this.insumos || !this.insumos.length) {
      container.innerHTML = '<div class="empty-state">Nenhum insumo cadastrado</div>';
      return;
    }
    container.innerHTML = this.insumos.map(i => `
      <div class="produto-card ${i.quantidade <= (i.minimo || 0) ? 'estoque-baixo' : ''}">
        <h3>${i.nome}</h3>
        <div class="insumo-info">
          <div class="quantidade ${i.quantidade <= (i.minimo || 0) ? 'alerta' : ''}">${i.quantidade} ${i.unidade}${i.minimo ? ` <small>(mín: ${i.minimo} ${i.unidade})</small>` : ''}</div>
          <div class="preco">R$ ${(i.preco || 0).toFixed(2)}/${i.unidade}</div>
        </div>
        <div class="card-actions">
          <button class="btn-editar" onclick='dashboard.abrirModalInsumo(${JSON.stringify(i).replace(/\"/g,'&quot;')})'>Editar</button>
          <button class="btn-excluir" onclick="dashboard.excluirInsumo('${i._id}')">Excluir</button>
        </div>
      </div>
    `).join('');
  }

  async excluirInsumo(id) {
    if (!confirm('Tem certeza que deseja excluir este insumo?')) return;
    try {
      const res = await fetch(`/api/insumos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.insumos = this.insumos.filter(x => x._id !== id);
        this.renderInsumos();
        this.showToast('Insumo excluído', 'success');
      } else this.showToast('Erro ao excluir insumo', 'error');
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

  /* ================= PEDIDOS ================= */
  abrirModalPedido(pedido = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    const itens = pedido?.itens || [];
    modal.innerHTML = `
      <div class="modal">
        <h3>${pedido ? 'Editar' : 'Novo'} Pedido</h3>
        <form id="formPedido">
          <input type="hidden" id="pedidoId" value="${pedido?._id || ''}">
          <div class="form-row">
            <div class="form-group">
              <label>Cliente</label>
              <input type="text" id="pedidoCliente" value="${pedido?.cliente || ''}" required>
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input type="text" id="pedidoTelefone" value="${pedido?.telefone || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Endereço</label>
              <input type="text" id="pedidoEndereco" value="${pedido?.endereco || ''}">
            </div>
            <div class="form-group">
              <label>Taxa de Entrega (R$)</label>
              <input type="number" id="pedidoTaxaEntrega" step="0.01" value="${pedido?.taxaEntrega || '0.00'}">
            </div>
          </div>

          <div id="itensWrapper">
            ${itens.map((it, idx) => `
              <div class="form-row" data-item-index="${idx}">
                <div class="form-group"><label>Item</label><input type="text" class="pedidoItemNome" value="${it.nome || ''}" required></div>
                <div class="form-group"><label>Qtd</label><input type="number" class="pedidoItemQtd" value="${it.quantidade || 1}" min="1" required></div>
                <div class="form-group"><label>Preço</label><input type="number" class="pedidoItemPreco" value="${it.preco || 0}" step="0.01"></div>
              </div>
            `).join('')}
          </div>

          <div style="display:flex;gap:.5rem;margin-top:.5rem">
            <button type="button" class="btn secondary" id="adicionarItemBtn">➕ Adicionar Item</button>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem">
            <div><strong>Total: R$ <span id="pedidoTotal">${(pedido?.total || 0).toFixed(2)}</span></strong></div>
            <div style="display:flex;gap:.5rem">
              <button type="submit" class="btn primary">Salvar Pedido</button>
              <button type="button" class="btn secondary" id="btnCancelarPedido">Cancelar</button>
            </div>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const itensWrapper = modal.querySelector('#itensWrapper');
    const atualizarTotal = () => {
      const qtds = Array.from(itensWrapper.querySelectorAll('.pedidoItemQtd')).map(i => parseInt(i.value) || 0);
      const precos = Array.from(itensWrapper.querySelectorAll('.pedidoItemPreco')).map(i => parseFloat(i.value) || 0);
      const taxaEntrega = parseFloat(modal.querySelector('#pedidoTaxaEntrega').value) || 0;
      
      let subtotal = 0;
      for (let i = 0; i < qtds.length; i++) subtotal += (qtds[i] || 0) * (precos[i] || 0);
      
      const total = subtotal + taxaEntrega;
      modal.querySelector('#pedidoTotal').textContent = total.toFixed(2);
    };

    modal.querySelectorAll('.pedidoItemQtd, .pedidoItemPreco').forEach(el => el.addEventListener('input', atualizarTotal));
    modal.querySelector('#pedidoTaxaEntrega').addEventListener('input', atualizarTotal);

    modal.querySelector('#adicionarItemBtn').addEventListener('click', () => {
      const idx = itensWrapper.querySelectorAll('.form-row[data-item-index]').length;
      const div = document.createElement('div');
      div.className = 'form-row';
      div.dataset.itemIndex = idx;
      div.innerHTML = `
        <div class="form-group"><label>Item</label><input type="text" class="pedidoItemNome" required></div>
        <div class="form-group"><label>Qtd</label><input type="number" class="pedidoItemQtd" value="1" min="1" required></div>
        <div class="form-group"><label>Preço</label><input type="number" class="pedidoItemPreco" value="0" step="0.01"></div>
      `;
      itensWrapper.appendChild(div);
      div.querySelectorAll('.pedidoItemQtd, .pedidoItemPreco').forEach(el => el.addEventListener('input', atualizarTotal));
      atualizarTotal();
    });

    modal.querySelector('#btnCancelarPedido').addEventListener('click', () => modal.remove());

    modal.querySelector('#formPedido').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pedidoId = modal.querySelector('#pedidoId').value;
      const cliente = modal.querySelector('#pedidoCliente').value;
      const telefone = modal.querySelector('#pedidoTelefone').value;
      const endereco = modal.querySelector('#pedidoEndereco').value;
      const taxaEntrega = parseFloat(modal.querySelector('#pedidoTaxaEntrega').value) || 0;
      
      const nomes = Array.from(modal.querySelectorAll('.pedidoItemNome')).map(i => i.value);
      const qtds = Array.from(modal.querySelectorAll('.pedidoItemQtd')).map(i => parseInt(i.value) || 0);
      const precos = Array.from(modal.querySelectorAll('.pedidoItemPreco')).map(i => parseFloat(i.value) || 0);
      
      const itens = nomes.map((nome, i) => ({ nome, quantidade: qtds[i], preco: precos[i] })).filter(it => it.nome && it.quantidade > 0);
      const subtotal = itens.reduce((s, it) => s + (it.quantidade * (it.preco || 0)), 0);
      const total = subtotal + taxaEntrega;
      
      // CORREÇÃO: Incluir taxaEntrega no payload
      const payload = { 
        cliente, 
        telefone, 
        endereco, 
        taxaEntrega,
        itens, 
        total, 
        status: pedido?.status || 'pendente' 
      };

      try {
        const url = pedidoId ? `/api/orders/${pedidoId}` : '/api/orders';
        const method = pedidoId ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
          await this.carregarDados();
          this.renderPedidos();
          document.querySelector('.modal-overlay')?.remove();
          this.showToast('Pedido salvo', 'success');
        } else {
          const err = await res.json().catch(() => ({}));
          this.showToast(err.error || 'Erro ao salvar pedido', 'error');
        }
      } catch (e) {
        this.showToast('Erro de rede ao salvar pedido', 'error');
      }
    });
  }

  /* ================= FINANCEIRO ================= */
  async updateFinanceiro() {
    try {
      const res = await fetch('/api/stats');
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
    // Se já for URL absoluta, retorna direto. Caso seja caminho relativo (ex: images/...), mantém relativo.
    if (!src) return '';
    try {
      const u = new URL(src);
      return src; // URL absoluta
    } catch (e) {
      // caminho relativo, torna relativo ao root (serve se você usa /images/ ou images/)
      if (src.startsWith('/')) return src;
      return src; // manter como veio (ex: images/...)
    }
  }
}

// inicia
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});







