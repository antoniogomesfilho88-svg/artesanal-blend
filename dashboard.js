// ===== Dashboard.js =====

// Inicializações
let produtos = [];
let insumos = [];
let pedidos = [];
let financeiro = { vendas: 0, gastos: 0, lucro: 0 };

// ===== Funções de Produtos =====
function carregarProdutos() {
  fetch('/api/produtos')
    .then(res => res.json())
    .then(data => {
      produtos = data;
      renderProdutos();
    });
}

function renderProdutos() {
  const container = document.getElementById('produtos-container');
  container.innerHTML = '';
  produtos.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${prod.imagem}" alt="${prod.nome}">
      <h3>${prod.nome}</h3>
      <p>${prod.descricao}</p>
      <p class="price">R$ ${prod.preco.toFixed(2)}</p>
      <button class="btn btn-secondary" onclick="editarProduto('${prod.id}')">Editar</button>
      <button class="btn btn-primary" onclick="removerProduto('${prod.id}')">Remover</button>
    `;
    container.appendChild(card);
  });
}

function adicionarProduto(produto) {
  fetch('/api/produtos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(produto)
  }).then(() => carregarProdutos());
}

function editarProduto(id) {
  const produto = produtos.find(p => p.id === id);
  const novoNome = prompt('Nome:', produto.nome);
  const novoPreco = parseFloat(prompt('Preço:', produto.preco));
  const novaDescricao = prompt('Descrição:', produto.descricao);
  if (novoNome && !isNaN(novoPreco) && novaDescricao) {
    fetch(`/api/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoNome, preco: novoPreco, descricao: novaDescricao })
    }).then(() => carregarProdutos());
  }
}

function removerProduto(id) {
  if (confirm('Deseja realmente remover o produto?')) {
    fetch(`/api/produtos/${id}`, { method: 'DELETE' }).then(() => carregarProdutos());
  }
}

// ===== Funções de Insumos =====
function carregarInsumos() {
  fetch('/api/insumos')
    .then(res => res.json())
    .then(data => {
      insumos = data;
      renderInsumos();
    });
}

function renderInsumos() {
  const container = document.getElementById('insumos-container');
  container.innerHTML = '';
  insumos.forEach(insumo => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${insumo.nome}</td>
      <td>${insumo.quantidade}</td>
      <td>${insumo.unidade}</td>
      <td><input type="number" value="${insumo.uso}" onchange="atualizarCusto('${insumo.id}', this.value)"></td>
      <td>R$ ${(insumo.preco * insumo.uso).toFixed(2)}</td>
    `;
    container.appendChild(tr);
  });
}

function atualizarCusto(id, valor) {
  const insumo = insumos.find(i => i.id === id);
  insumo.uso = parseFloat(valor);
  renderInsumos();
}

// ===== Funções de Pedidos =====
function carregarPedidos() {
  fetch('/api/pedidos')
    .then(res => res.json())
    .then(data => {
      pedidos = data;
      renderPedidos();
    });
}

function renderPedidos() {
  const container = document.getElementById('pedidos-container');
  container.innerHTML = '';
  pedidos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <h4>Pedido #${p.id}</h4>
      <p>Cliente: ${p.cliente}</p>
      <p>Total: R$ ${p.total.toFixed(2)}</p>
      <p>Status: <span class="status ${p.status}">${p.status}</span></p>
      <button class="btn btn-primary" onclick="imprimirPedido('${p.id}')">Imprimir Cupom</button>
      <button class="btn btn-secondary" onclick="atualizarStatus('${p.id}')">Atualizar Status</button>
    `;
    container.appendChild(card);
  });
}

function atualizarStatus(id) {
  const status = prompt('Novo status (pending/completed/cancelled):');
  if (status) {
    fetch(`/api/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(() => carregarPedidos());
  }
}

function imprimirPedido(id) {
  const pedido = pedidos.find(p => p.id === id);
  let printContent = `Pedido #${pedido.id}\nCliente: ${pedido.cliente}\nTotal: R$ ${pedido.total.toFixed(2)}\nItens:\n`;
  pedido.itens.forEach(i => {
    printContent += `- ${i.nome} x${i.qtd} = R$ ${(i.preco * i.qtd).toFixed(2)}\n`;
  });
  const win = window.open('', '', 'width=400,height=600');
  win.document.write('<pre>' + printContent + '</pre>');
  win.print();
  win.close();
}

// ===== Funções Financeiro =====
function carregarFinanceiro() {
  fetch('/api/financeiro')
    .then(res => res.json())
    .then(data => {
      financeiro = data;
      renderFinanceiro();
    });
}

function renderFinanceiro() {
  document.getElementById('vendas').textContent = `R$ ${financeiro.vendas.toFixed(2)}`;
  document.getElementById('gastos').textContent = `R$ ${financeiro.gastos.toFixed(2)}`;
  document.getElementById('lucro').textContent = `R$ ${financeiro.lucro.toFixed(2)}`;
}

// ===== Inicialização =====
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  carregarInsumos();
  carregarPedidos();
  carregarFinanceiro();
});
