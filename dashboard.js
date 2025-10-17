// dashboard.js
class Dashboard {
  constructor() {
    this.produtos = JSON.parse(localStorage.getItem('produtos')) || [];
    this.insumos = JSON.parse(localStorage.getItem('insumos')) || [];
    this.pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderProdutos();
    this.renderInsumos();
    this.renderPedidos();
    this.updateFinanceiro();
  }

  setupEventListeners() {
    // Formulário de produtos
    document.getElementById('produtoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.adicionarProduto();
    });

    // Formulário de insumos
    document.getElementById('insumoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.adicionarInsumo();
    });

    // Botão imprimir pedidos
    document.getElementById('imprimirPedidos').addEventListener('click', () => {
      this.imprimirPedidos();
    });
  }

  // Produtos
  adicionarProduto() {
    const produto = {
      id: Date.now(),
      nome: document.getElementById('produtoNome').value,
      preco: parseFloat(document.getElementById('produtoPreco').value),
      imagem: document.getElementById('produtoImagem').value,
      descricao: document.getElementById('produtoDescricao').value
    };

    this.produtos.push(produto);
    this.salvarNoLocalStorage('produtos', this.produtos);
    this.renderProdutos();
    this.limparForm('produtoForm');
  }

  renderProdutos() {
    const container = document.getElementById('produtosContainer');
    
    if (this.produtos.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum produto cadastrado</div>';
      return;
    }

    container.innerHTML = this.produtos.map(produto => `
      <div class="produto-card">
        ${produto.imagem ? `<img src="${produto.imagem}" alt="${produto.nome}" class="produto-imagem">` : ''}
        <h3>${produto.nome}</h3>
        <div class="preco">R$ ${produto.preco.toFixed(2)}</div>
        <div class="descricao">${produto.descricao}</div>
        <div class="card-actions">
          <button class="btn-editar" onclick="dashboard.editarProduto(${produto.id})">✏️ Editar</button>
          <button class="btn-excluir" onclick="dashboard.excluirProduto(${produto.id})">🗑️ Excluir</button>
        </div>
      </div>
    `).join('');
  }

  // Insumos
  adicionarInsumo() {
    const insumo = {
      id: Date.now(),
      nome: document.getElementById('insumoNome').value,
      quantidade: parseInt(document.getElementById('insumoQtd').value),
      unidade: document.getElementById('insumoUnidade').value,
      custo: parseFloat(document.getElementById('insumoCusto').value)
    };

    this.insumos.push(insumo);
    this.salvarNoLocalStorage('insumos', this.insumos);
    this.renderInsumos();
    this.limparForm('insumoForm');
  }

  renderInsumos() {
    const container = document.getElementById('insumosContainer');
    
    if (this.insumos.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum insumo cadastrado</div>';
      return;
    }

    container.innerHTML = this.insumos.map(insumo => `
      <div class="insumo-card">
        <h3>${insumo.nome}</h3>
        <div class="quantidade">${insumo.quantidade} ${insumo.unidade}</div>
        <div class="custo">Custo: R$ ${insumo.custo.toFixed(2)}/${insumo.unidade}</div>
        <div class="card-actions">
          <button class="btn-editar" onclick="dashboard.editarInsumo(${insumo.id})">✏️ Editar</button>
          <button class="btn-excluir" onclick="dashboard.excluirInsumo(${insumo.id})">🗑️ Excluir</button>
        </div>
      </div>
    `).join('');
  }

  // Pedidos
  renderPedidos() {
    const container = document.getElementById('pedidosContainer');
    
    if (this.pedidos.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhum pedido registrado</div>';
      return;
    }

    container.innerHTML = this.pedidos.map(pedido => `
      <div class="pedido-card">
        <h3>Pedido #${pedido.id}</h3>
        <div>Cliente: ${pedido.cliente}</div>
        <div>Total: R$ ${pedido.total.toFixed(2)}</div>
        <div>Status: ${pedido.status}</div>
      </div>
    `).join('');
  }

  // Financeiro
  updateFinanceiro() {
    const totalVendas = this.pedidos.reduce((sum, pedido) => sum + pedido.total, 0);
    const totalCustos = this.insumos.reduce((sum, insumo) => sum + (insumo.custo * insumo.quantidade), 0);
    const lucro = totalVendas - totalCustos;

    document.getElementById('totalVendas').textContent = totalVendas.toFixed(2);
    document.getElementById('totalCustos').textContent = totalCustos.toFixed(2);
    document.getElementById('lucro').textContent = lucro.toFixed(2);
  }

  // Utilitários
  salvarNoLocalStorage(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  }

  limparForm(formId) {
    document.getElementById(formId).reset();
  }

  imprimirPedidos() {
    window.print();
  }

  // Métodos de edição/exclusão (simplificados)
  excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      this.produtos = this.produtos.filter(p => p.id !== id);
      this.salvarNoLocalStorage('produtos', this.produtos);
      this.renderProdutos();
    }
  }

  excluirInsumo(id) {
    if (confirm('Tem certeza que deseja excluir este insumo?')) {
      this.insumos = this.insumos.filter(i => i.id !== id);
      this.salvarNoLocalStorage('insumos', this.insumos);
      this.renderInsumos();
    }
  }
}

// Inicializar dashboard
const dashboard = new Dashboard();
