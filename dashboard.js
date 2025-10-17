// -------------------- Configurações -------------------- //
const apiBase = ''; // mesmo host, mesmo servidor
const produtosContainer = document.getElementById('produtosContainer');
const insumosContainer = document.getElementById('insumosContainer');
const pedidosContainer = document.getElementById('pedidosContainer');
const financeiroContainer = document.getElementById('financeiroContainer');

// -------------------- Funções Produtos -------------------- //
async function carregarProdutos() {
  const res = await fetch(`${apiBase}/api/produtos`);
  const produtos = await res.json();
  produtosContainer.innerHTML = '';
  produtos.forEach(prod => {
    const div = document.createElement('div');
    div.className = 'produto-card';
    div.innerHTML = `
      <h4>${prod.nome}</h4>
      <p>Categoria: ${prod.categoria}</p>
      <p>Preço: R$ ${prod.preco.toFixed(2)}</p>
      <button onclick="editarProduto(${prod.id})">Editar</button>
      <button onclick="removerProduto(${prod.id})">Remover</button>
    `;
    produtosContainer.appendChild(div);
  });
}

async function adicionarProduto() {
  const nome = prompt('Nome do produto:');
  const categoria = prompt('Categoria:');
  const preco = parseFloat(prompt('Preço:'));
  if (!nome || !categoria || isNaN(preco)) return alert('Dados inválidos');

  await fetch(`${apiBase}/api/produtos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, categoria, preco })
  });

  carregarProdutos();
}

async function editarProduto(id) {
  const res = await fetch(`${apiBase}/api/produtos`);
  const produtos = await res.json();
  const produto = produtos.find(p => p.id === id);
  if (!produto) return alert('Produto não encontrado');

  const nome = prompt('Nome:', produto.nome);
  const categoria = prompt('Categoria:', produto.categoria);
  const preco = parseFloat(prompt('Preço:', produto.preco));
  if (!nome || !categoria || isNaN(preco)) return alert('Dados inválidos');

  await fetch(`${apiBase}/api/produtos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, categoria, preco })
  });

  carregarProdutos();
}

async function removerProduto(id) {
  if (!confirm('Deseja remover este produto?')) return;
  await fetch(`${apiBase}/api/produtos/${id}`, { method: 'DELETE' });
  carregarProdutos();
}

// -------------------- Funções Insumos -------------------- //
async function carregarInsumos() {
  const res = await fetch(`${apiBase}/api/insumos`);
  const insumos = await res.json();
  insumosContainer.innerHTML = '';
  insumos.forEach(ins => {
    const div = document.createElement('div');
    div.className = 'insumo-card';
    div.innerHTML = `
      <h4>${ins.nome}</h4>
      <p>Quantidade: ${ins.quantidade}</p>
      <button onclick="editarInsumo(${ins.id})">Editar</button>
      <button onclick="removerInsumo(${ins.id})">Remover</button>
    `;
    insumosContainer.appendChild(div);
  });
}

async function adicionarInsumo() {
  const nome = prompt('Nome do insumo:');
  const quantidade = parseInt(prompt('Quantidade:'));
  if (!nome || isNaN(quantidade)) return alert('Dados inválidos');

  await fetch(`${apiBase}/api/insumos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, quantidade })
  });

  carregarInsumos();
}

async function editarInsumo(id) {
  const res = await fetch(`${apiBase}/api/insumos`);
  const insumos = await res.json();
  const insumo = insumos.find(i => i.id === id);
  if (!insumo) return alert('Insumo não encontrado');

  const nome = prompt('Nome:', insumo.nome);
  const quantidade = parseInt(prompt('Quantidade:', insumo.quantidade));
  if (!nome || isNaN(quantidade)) return alert('Dados inválidos');

  await fetch(`${apiBase}/api/insumos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, quantidade })
  });

  carregarInsumos();
}

async function removerInsumo(id) {
  if (!confirm('Deseja remover este insumo?')) return;
  await fetch(`${apiBase}/api/insumos/${id}`, { method: 'DELETE' });
  carregarInsumos();
}

// -------------------- Funções Pedidos -------------------- //
async function carregarPedidos() {
  const res = await fetch(`${apiBase}/api/pedidos`);
  const pedidos = await res.json();
  pedidosContainer.innerHTML = '';
  pedidos.forEach(p => {
    const div = document.createElement('div');
    div.className = 'pedido-card';
    div.innerHTML = `
      <h4>Pedido #${p.id}</h4>
      <p>Cliente: ${p.clienteNome}</p>
      <p>Total: R$ ${p.total.toFixed(2)}</p>
      <p>Data: ${new Date(p.data).toLocaleString()}</p>
      <p>Observações: ${p.obsCliente || '-'}</p>
    `;
    pedidosContainer.appendChild(div);
  });
}

// -------------------- Funções Financeiro -------------------- //
async function atualizarFinanceiro() {
  const res = await fetch(`${apiBase}/api/financeiro`);
  const data = await res.json();
  financeiroContainer.innerHTML = `
    <h3>Resumo Financeiro</h3>
    <p>Total de Pedidos: ${data.totalPedidos}</p>
    <p>Total de Vendas: R$ ${data.totalVendas.toFixed(2)}</p>
  `;
}

// -------------------- Inicialização -------------------- //
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  carregarInsumos();
  carregarPedidos();
  atualizarFinanceiro();

  document.getElementById('btnAddProduto')?.addEventListener('click', adicionarProduto);
  document.getElementById('btnAddInsumo')?.addEventListener('click', adicionarInsumo);
});
