const apiBase = '/api';

// Containers
const produtosContainer = document.getElementById('produtosContainer');
const insumosContainer = document.getElementById('insumosContainer');
const pedidosContainer = document.getElementById('pedidosContainer');
const financeiroContainer = document.getElementById('financeiroContainer');

// Função para atualizar o dashboard
async function carregarDashboard() {
  await carregarProdutos();
  await carregarInsumos();
  await carregarPedidos();
  await atualizarFinanceiro();
}

// ==================== PRODUTOS ====================
async function carregarProdutos() {
  produtosContainer.innerHTML = '';
  const res = await fetch(`${apiBase}/produtos`);
  const produtos = await res.json();
  produtos.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'card produto-card';
    card.innerHTML = `
      <img src="${prod.imagem || 'batata.jpg'}" alt="${prod.nome}" />
      <h3>${prod.nome}</h3>
      <p>Preço: R$ ${prod.preco.toFixed(2)}</p>
      <button onclick="editarProduto('${prod._id}')">✏️ Editar</button>
      <button onclick="deletarProduto('${prod._id}')">🗑️ Excluir</button>
    `;
    produtosContainer.appendChild(card);
  });
}

async function adicionarProduto() {
  const nome = prompt('Nome do produto:');
  const preco = parseFloat(prompt('Preço do produto:'));
  const imagem = prompt('URL da imagem:');
  if (!nome || !preco) return;
  await fetch(`${apiBase}/produtos`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({nome, preco, imagem})
  });
  carregarDashboard();
}

async function editarProduto(id) {
  const nome = prompt('Novo nome:');
  const preco = parseFloat(prompt('Novo preço:'));
  const imagem = prompt('Nova URL da imagem:');
  await fetch(`${apiBase}/produtos/${id}`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({nome, preco, imagem})
  });
  carregarDashboard();
}

async function deletarProduto(id) {
  if (!confirm('Deseja realmente excluir?')) return;
  await fetch(`${apiBase}/produtos/${id}`, {method:'DELETE'});
  carregarDashboard();
}

// ==================== INSUMOS ====================
async function carregarInsumos() {
  insumosContainer.innerHTML = '';
  const res = await fetch(`${apiBase}/insumos`);
  const insumos = await res.json();
  insumos.forEach(insumo => {
    const card = document.createElement('div');
    card.className = 'card insumo-card';
    card.innerHTML = `
      <h3>${insumo.nome}</h3>
      <p>Quantidade: ${insumo.quantidade}</p>
      <button onclick="editarInsumo('${insumo._id}')">✏️ Editar</button>
      <button onclick="deletarInsumo('${insumo._id}')">🗑️ Excluir</button>
    `;
    insumosContainer.appendChild(card);
  });
}

async function adicionarInsumo() {
  const nome = prompt('Nome do insumo:');
  const quantidade = parseInt(prompt('Quantidade:'), 10);
  if (!nome || isNaN(quantidade)) return;
  await fetch(`${apiBase}/insumos`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({nome, quantidade})
  });
  carregarDashboard();
}

async function editarInsumo(id) {
  const nome = prompt('Novo nome:');
  const quantidade = parseInt(prompt('Nova quantidade:'), 10);
  await fetch(`${apiBase}/insumos/${id}`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({nome, quantidade})
  });
  carregarDashboard();
}

async function deletarInsumo(id) {
  if (!confirm('Deseja realmente excluir?')) return;
  await fetch(`${apiBase}/insumos/${id}`, {method:'DELETE'});
  carregarDashboard();
}

// ==================== PEDIDOS ====================
async function carregarPedidos() {
  pedidosContainer.innerHTML = '';
  const res = await fetch(`${apiBase}/pedidos`);
  const pedidos = await res.json();
  pedidos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card pedido-card';
    card.innerHTML = `
      <h3>${p.clienteNome}</h3>
      <p>Total: R$ ${p.total.toFixed(2)}</p>
      <p>${p.itens.map(i => i.nome + ' x' + i.qtd).join(', ')}</p>
      <p>Obs: ${p.obsCliente || '-'}</p>
      <p>Status: ${p.status}</p>
    `;
    pedidosContainer.appendChild(card);
  });
}

// ==================== FINANCEIRO ====================
async function atualizarFinanceiro() {
  const res = await fetch(`${apiBase}/financeiro`);
  const total = await res.json();
  financeiroContainer.innerHTML = `<h3>Total de vendas: R$ ${total.toFixed(2)}</h3>`;
}

// ==================== EVENTOS ====================
document.getElementById('btnAddProduto').addEventListener('click', adicionarProduto);
document.getElementById('btnAddInsumo').addEventListener('click', adicionarInsumo);

// Inicializa dashboard
carregarDashboard();
