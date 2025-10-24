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

 /* ================= EVENTOS ================= */
  setupEventListeners() {
    // ==== Tabs ====
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });

    // ==== Ver Cardápio ====
    const btnCardapio = document.getElementById('visualizarCardapio');
    if (btnCardapio) {
      btnCardapio.addEventListener('click', () => {
        window.open('/', '_blank');
      });
    }

    // ==== Botão Logout ====
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        if (confirm('Deseja realmente sair do sistema?')) {
          // Remove o token e redireciona
          localStorage.removeItem('token');
          sessionStorage.clear();

          // Feedback visual
          this.showToast('Logout realizado com sucesso!', 'info');

          // Redireciona após pequeno atraso
          setTimeout(() => {
            window.location.href = '/login';
          }, 800);
        }
      });
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
          <div class="form-group">
            <label>Endereço</label>
            <input type="text" id="pedidoEndereco" value="${pedido?.endereco || ''}">
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
      let total = 0;
      for (let i = 0; i < qtds.length; i++) total += (qtds[i] || 0) * (precos[i] || 0);
      modal.querySelector('#pedidoTotal').textContent = total.toFixed(2);
    };

    modal.querySelectorAll('.pedidoItemQtd, .pedidoItemPreco').forEach(el => el.addEventListener('input', atualizarTotal));

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
      const nomes = Array.from(modal.querySelectorAll('.pedidoItemNome')).map(i => i.value);
      const qtds = Array.from(modal.querySelectorAll('.pedidoItemQtd')).map(i => parseInt(i.value) || 0);
      const precos = Array.from(modal.querySelectorAll('.pedidoItemPreco')).map(i => parseFloat(i.value) || 0);
      const itens = nomes.map((nome, i) => ({ nome, quantidade: qtds[i], preco: precos[i] })).filter(it => it.nome && it.quantidade > 0);
      const total = itens.reduce((s, it) => s + (it.quantidade * (it.preco || 0)), 0);
      const payload = { cliente, telefone, endereco, itens, total, status: pedido?.status || 'pendente' };

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

  renderPedidos() {
    const container = document.getElementById('pedidosContainer');
    if (!this.pedidos || !this.pedidos.length) {
      container.innerHTML = '<div class="empty-state">Nenhum pedido recebido</div>';
      return;
    }

    container.innerHTML = this.pedidos.map(pedido => `
      <article class="produto-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem">
          <div>
            <h3>Pedido #${pedido._id?.slice(-6) || 'N/A'}</h3>
            <p><strong>Cliente:</strong> ${pedido.cliente || '-'}</p>
            <p><strong>Telefone:</strong> ${pedido.telefone || '-'}</p>
            <p><strong>Endereço:</strong> ${pedido.endereco || '-'}</p>
          </div>
          <div style="text-align:right">
            <div style="margin-bottom:.5rem"><strong>Total:</strong> R$ ${(pedido.total || 0).toFixed(2)}</div>
            <div class="status">${this.formatarStatus(pedido.status)}</div>
          </div>
        </div>

        <div style="margin:0.5rem 0;border-top:1px solid var(--border);padding-top:0.5rem">
          <strong>Itens:</strong>
          ${(pedido.itens || []).map(item => `<div style="display:flex;justify-content:space-between;margin:.25rem 0"><span>${item.quantidade}x ${item.nome}</span><span>R$ ${((item.preco || 0) * (item.quantidade || 1)).toFixed(2)}</span></div>`).join('')}
        </div>

        <div class="card-actions" style="margin-top:.75rem">
          <button class="btn-editar" onclick='dashboard.abrirModalPedido(${JSON.stringify(pedido).replace(/\"/g,'&quot;')})'>Editar</button>
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${pedido._id}','preparando')">👨‍🍳 Preparando</button>
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${pedido._id}','pronto')">✅ Pronto</button>
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${pedido._id}','entregue')">🚗 Entregue</button>
          <button class="btn" onclick="dashboard.imprimirCupom('${pedido._id}')">🖨️ Imprimir Cupom</button>
          <button class="btn-excluir" onclick="dashboard.excluirPedido('${pedido._id}')">Excluir</button>
        </div>
      </article>
    `).join('');
  }

  formatarStatus(status) {
    const map = { pendente: '⏳ Pendente', preparando: '👨‍🍳 Preparando', pronto: '✅ Pronto', entregue: '🚗 Entregue', cancelado: '❌ Cancelado' };
    return map[status] || status;
  }

  async atualizarStatusPedido(id, novoStatus) {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: novoStatus }) });
      if (res.ok) {
        const pedido = this.pedidos.find(p => p._id === id);
        if (pedido) pedido.status = novoStatus;
        this.renderPedidos();
        this.showToast('Status atualizado', 'success');
      } else this.showToast('Erro ao atualizar status', 'error');
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

  async excluirPedido(id) {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.pedidos = this.pedidos.filter(p => p._id !== id);
        this.renderPedidos();
        this.showToast('Pedido excluído', 'success');
      } else this.showToast('Erro ao excluir pedido', 'error');
    } catch (e) {
      this.showToast('Erro de rede', 'error');
    }
  }

imprimirCupom(id) {
  const pedido = this.pedidos.find(p => p._id === id);
  if (!pedido) return this.showToast('Pedido não encontrado', 'error');

  const janelaImpressao = window.open('', '_blank', 'width=380,height=700');
  
  if (!janelaImpressao) {
    this.showToast('Permita pop-ups para imprimir o cupom', 'error');
    return;
  }

  const css = `
    <style>
      @media print {
        body { 
          width: 80mm !important;
          max-width: 80mm !important;
          margin: 3mm !important;
          padding: 0 !important;
          font-size: 16px !important;
          font-weight: bold !important;
        }
        .no-print { display: none !important; }
      }
      
      body { 
        width: 80mm;
        max-width: 80mm;
        font-family: 'Courier New', Courier, monospace; 
        font-size: 13px;
        font-weight: bold;
        margin: 3mm;
        padding: 0;
        line-height: 1.2;
        background: white;
      }
      .center { 
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .right { text-align: right; }
      .left { text-align: left; }
      .bold { 
        font-weight: bold; 
        font-size: 14px;
      }
      .line { 
        border: none;
        border-top: 2px dashed #000; 
        margin: 5px 0;
      }
      table { 
        width: 100%; 
        border-collapse: collapse;
      }
      td { 
        vertical-align: top; 
        padding: 2px 0;
        word-wrap: break-word;
      }
      .item-qty { width: 20%; text-align: center; font-weight: bold; }
      .item-name { width: 50%; text-align: left; padding: 0 3px; font-weight: bold; }
      .item-total { width: 30%; text-align: right; font-weight: bold; }
      .logo-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin: 0 auto 5px auto;
      }
      .logo { 
        max-width: 120px; 
        height: auto; 
        display: block;
        margin: 0 auto;
      }
      .header { 
        margin-bottom: 5px;
        width: 100%;
      }
      .footer { margin-top: 5px; }
      .medium { font-size: 12px; }
      .break-word { word-break: break-word; }
      .total-section {
        margin-top: 8px;
        padding-top: 5px;
        border-top: 2px solid #000;
      }
      .item-row {
        margin: 3px 0;
        padding: 2px 0;
      }
    </style>
  `;

  const qrPix = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=PIX:+5531992128891`;

  // Processar itens e totais
  let subtotal = 0;
  const itensHtml = pedido.itens.map(item => {
    const quantidade = parseInt(item.quantidade) || 1;
    const preco = parseFloat(item.preco) || 0;
    const totalItem = quantidade * preco;
    subtotal += totalItem;
    
    // Limitar nome do item
    let nomeItem = item.nome || '';
    if (nomeItem.length > 20) {
      nomeItem = nomeItem.substring(0, 20) + '...';
    }
    
    return `
      <tr class="item-row">
        <td class="item-qty">${quantidade}x</td>
        <td class="item-name break-word">${nomeItem}</td>
        <td class="item-total">R$ ${totalItem.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const totalPedido = parseFloat(pedido.total) || subtotal;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cupom #${pedido._id?.slice(-6) || 'N/A'}</title>
      <meta charset="UTF-8">
      ${css}
    </head>
    <body>
      <!-- CABEÇALHO COM LOGO CENTRALIZADA -->
      <div class="header center">
        <div class="logo-container">
          <img class="logo" src="${window.location.origin + '/images/logo.jpg'}" alt="Logo" onerror="this.style.display='none'">
        </div>
        <div class="bold" style="font-size: 16px; margin-bottom: 3px;">BURGUER ARTESANAL BLEND</div>
        <div class="medium">CNPJ: 58.518.297/0001-61</div>
        <div class="medium">Rua Coniston, 380 - Jd. Canadá</div>
        <div class="medium">Nova Lima - MG</div>
        <div class="medium">Tel: (31) 99212-8891</div>
      </div>

      <hr class="line">

      <!-- DADOS DO PEDIDO -->
      <div>
        <div style="font-size: 14px;"><strong>PEDIDO #${pedido._id?.slice(-6) || 'N/A'}</strong></div>
        <div class="medium">${new Date(pedido.data || pedido.createdAt || Date.now()).toLocaleString('pt-BR')}</div>
        <div><strong>CLIENTE:</strong> ${pedido.cliente || 'CONSUMIDOR'}</div>
        ${pedido.telefone ? `<div><strong>TEL:</strong> ${pedido.telefone}</div>` : ''}
        ${pedido.endereco ? `<div class="break-word medium"><strong>END:</strong> ${pedido.endereco}</div>` : ''}
      </div>

      <hr class="line">

      <!-- ITENS -->
      <div style="margin: 5px 0;">
        <div style="font-size: 14px; margin-bottom: 3px;"><strong>ITENS DO PEDIDO:</strong></div>
        <table>
          ${itensHtml}
        </table>
      </div>

      <hr class="line">

      <!-- TOTAIS -->
       <div class="total-section">
  <table>
    <tr>
      <td class="left"><strong>SUBTOTAL:</strong></td>
      <td class="right"><strong>R$ ${subtotal.toFixed(2)}</strong></td>
    </tr>
    ${pedido.taxaEntrega > 0 ? `
      <tr>
        <td class="left"><strong>TAXA ENTREGA:</strong></td>
        <td class="right"><strong>R$ ${pedido.taxaEntrega.toFixed(2)}</strong></td>
      </tr>
    ` : ''}
    <tr>
      <td class="left"><strong>TOTAL:</strong></td>
      <td class="right" style="font-size: 14px;"><strong>R$ ${totalPedido.toFixed(2)}</strong></td>
    </tr>
    <tr>
      <td class="left medium">Pagamento:</td>
  <td class="right medium">${pedido.formaPagamento || pedido.pagamento || 'NÃO INFORMADO'}</td>
    </tr>
    <tr>
      <td class="left medium">Status:</td>
      <td class="right medium">${(pedido.status || 'PENDENTE').toUpperCase()}</td>
    </tr>
  </table>
</div>
      <hr class="line">

      <!-- RODAPÉ -->
      <div class="footer center">
        <div class="bold" style="font-size: 14px; margin-bottom: 3px;">FORMA DE PAGAMENTO PIX</div>
        <div class="medium">Chave: +55 31 99212-8891</div>
        <div class="logo-container" style="margin: 5px auto;">
          <img class="qr" src="${qrPix}" alt="QR Code PIX" onerror="this.style.display='none'" style="max-width: 80px; height: auto;">
        </div>
        <div class="medium"><strong>VALQUIRIA GOMES AROEIRA</strong></div>
        <div class="medium">${new Date().toLocaleString('pt-BR')}</div>
        <br>
        <div class="bold" style="font-size: 14px;">*** OBRIGADO PELA PREFERÊNCIA! ***</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 800);
        };

        window.addEventListener('afterprint', function() {
          setTimeout(function() {
            window.close();
          }, 500);
        });
      </script>
    </body>
    </html>
  `;

  try {
    janelaImpressao.document.write(html);
    janelaImpressao.document.close();
    
  } catch (error) {
    console.error('Erro ao gerar cupom:', error);
    this.showToast('Erro ao gerar cupom', 'error');
    janelaImpressao.close();
  }
}
  /* ================= FINANCEIRO ================= */
async updateFinanceiro() {
  try {
    this.showToast('Atualizando dados financeiros...', 'info', 1000);

    const res = await fetch('/api/stats');
    if (res.ok) {
      const financeiro = await res.json();
      this.atualizarUIFinanceiro(financeiro);
    } else {
      this.showToast('Erro ao buscar dados financeiros', 'error');
    }
  } catch (e) {
    console.error('Erro financeiro', e);
    this.showToast('Erro de rede ao atualizar financeiro', 'error');
  }
}

atualizarUIFinanceiro({ vendas = 0, gastos = 0, lucro = 0, meses = [] } = {}) {
  // Atualiza os textos
  document.getElementById('totalVendas').textContent = `R$ ${Number(vendas).toFixed(2)}`;
  document.getElementById('totalCustos').textContent = `R$ ${Number(gastos).toFixed(2)}`;
  document.getElementById('lucro').textContent = `R$ ${Number(lucro).toFixed(2)}`;

  // Garante que o Chart.js está pronto
  if (!window.Chart) return;

  // Remove gráficos antigos se existirem
  if (this.graficoBarras) this.graficoBarras.destroy();
  if (this.graficoPizza) this.graficoPizza.destroy();

  const ctxBarras = document.getElementById('graficoBarras').getContext('2d');
  const ctxPizza = document.getElementById('graficoPizza').getContext('2d');

  // ==== Gráfico de Barras: Comparativo Mensal ====
  this.graficoBarras = new Chart(ctxBarras, {
    type: 'bar',
    data: {
      labels: meses.map(m => m.nome || 'Mês'),
      datasets: [
        {
          label: 'Vendas (R$)',
          data: meses.map(m => m.vendas || 0),
          backgroundColor: 'rgba(46, 204, 113, 0.6)',
        },
        {
          label: 'Custos (R$)',
          data: meses.map(m => m.gastos || 0),
          backgroundColor: 'rgba(231, 76, 60, 0.6)',
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'R$' } }
      }
    }
  });

  // ==== Gráfico de Pizza: Distribuição ====
  this.graficoPizza = new Chart(ctxPizza, {
    type: 'doughnut',
    data: {
      labels: ['Lucro', 'Custos'],
      datasets: [{
        data: [lucro, gastos],
        backgroundColor: ['#2ecc71', '#e74c3c'],
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}



  /* ================= EVENTOS ================= */
  setupEventListeners() {
    // ==== Tabs ====
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });

    // ==== Ver Cardápio ====
    const btnCardapio = document.getElementById('visualizarCardapio');
    if (btnCardapio) {
      btnCardapio.addEventListener('click', () => {
        window.open('/', '_blank');
      });
    }

    // ==== Botão Logout ====
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        if (confirm('Deseja realmente sair do sistema?')) {
          // Remove o token e redireciona
          localStorage.removeItem('token');
          sessionStorage.clear();

          // Feedback visual
          this.showToast('Logout realizado com sucesso!', 'info');

          // Redireciona após pequeno atraso
          setTimeout(() => {
            window.location.href = '/login';
          }, 800);
        }
      });
    }
  }








