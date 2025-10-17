// Dados simulados (substituir por chamadas API/DB)
let produtos = [];
let insumos = [];
let pedidos = [];

// ======= PRODUTOS =======
const produtosList = document.getElementById("produtosList");
const addProdutoBtn = document.getElementById("addProdutoBtn");

function renderProdutos() {
  produtosList.innerHTML = "";
  produtos.forEach((p, index) => {
    const div = document.createElement("div");
    div.classList.add("item");
    div.innerHTML = `
      <img src="${p.imagem}" alt="${p.nome}" class="thumb" />
      <h3>${p.nome}</h3>
      <p>${p.descricao}</p>
      <p>R$ ${p.preco.toFixed(2)}</p>
      <button class="btn edit" onclick="editarProduto(${index})">✏️ Editar</button>
      <button class="btn delete" onclick="deletarProduto(${index})">🗑 Deletar</button>
    `;
    produtosList.appendChild(div);
  });
}

addProdutoBtn.addEventListener("click", () => {
  const nome = prompt("Nome do produto:");
  const descricao = prompt("Descrição:");
  const preco = parseFloat(prompt("Preço:"));
  const imagem = prompt("URL da imagem:");
  if (!nome || !descricao || isNaN(preco) || !imagem) return alert("Dados inválidos");
  produtos.push({ nome, descricao, preco, imagem, insumos: [] });
  renderProdutos();
});

function editarProduto(index) {
  const p = produtos[index];
  const nome = prompt("Nome do produto:", p.nome);
  const descricao = prompt("Descrição:", p.descricao);
  const preco = parseFloat(prompt("Preço:", p.preco));
  const imagem = prompt("URL da imagem:", p.imagem);
  if (!nome || !descricao || isNaN(preco) || !imagem) return alert("Dados inválidos");
  produtos[index] = { ...p, nome, descricao, preco, imagem };
  renderProdutos();
}

function deletarProduto(index) {
  if (confirm("Deseja deletar este produto?")) {
    produtos.splice(index, 1);
    renderProdutos();
  }
}

// ======= INSUMOS =======
const insumosList = document.getElementById("insumosList");
const addInsumoBtn = document.getElementById("addInsumoBtn");

function renderInsumos() {
  insumosList.innerHTML = "";
  insumos.forEach((i, index) => {
    const div = document.createElement("div");
    div.classList.add("item");
    div.innerHTML = `
      <h3>${i.nome}</h3>
      <p>Quantidade: ${i.quantidade} ${i.unidade}</p>
      <p>Custo unitário: R$ ${i.custo.toFixed(2)}</p>
      <button class="btn edit" onclick="editarInsumo(${index})">✏️ Editar</button>
      <button class="btn delete" onclick="deletarInsumo(${index})">🗑 Deletar</button>
    `;
    insumosList.appendChild(div);
  });
}

addInsumoBtn.addEventListener("click", () => {
  const nome = prompt("Nome do insumo:");
  const quantidade = parseFloat(prompt("Quantidade disponível:"));
  const unidade = prompt("Unidade (g, ml, und):");
  const custo = parseFloat(prompt("Custo total do insumo:"));
  if (!nome || isNaN(quantidade) || !unidade || isNaN(custo)) return alert("Dados inválidos");
  insumos.push({ nome, quantidade, unidade, custo });
  renderInsumos();
});

function editarInsumo(index) {
  const i = insumos[index];
  const nome = prompt("Nome do insumo:", i.nome);
  const quantidade = parseFloat(prompt("Quantidade disponível:", i.quantidade));
  const unidade = prompt("Unidade:", i.unidade);
  const custo = parseFloat(prompt("Custo total:", i.custo));
  if (!nome || isNaN(quantidade) || !unidade || isNaN(custo)) return alert("Dados inválidos");
  insumos[index] = { nome, quantidade, unidade, custo };
  renderInsumos();
}

function deletarInsumo(index) {
  if (confirm("Deseja deletar este insumo?")) {
    insumos.splice(index, 1);
    renderInsumos();
  }
}

// ======= PEDIDOS =======
const pedidosList = document.getElementById("pedidosList");
const addPedidoBtn = document.getElementById("addPedidoBtn");
const printPedidosBtn = document.getElementById("printPedidosBtn");

function renderPedidos() {
  pedidosList.innerHTML = "";
  pedidos.forEach((p, index) => {
    const div = document.createElement("div");
    div.classList.add("item");
    div.innerHTML = `
      <h3>Pedido #${index + 1}</h3>
      <p>Cliente: ${p.cliente}</p>
      <p>Produto: ${p.produto}</p>
      <p>Quantidade: ${p.quantidade}</p>
      <p>Total: R$ ${(p.preco * p.quantidade).toFixed(2)}</p>
      <button class="btn delete" onclick="deletarPedido(${index})">🗑 Deletar</button>
    `;
    pedidosList.appendChild(div);
  });
}

addPedidoBtn.addEventListener("click", () => {
  const cliente = prompt("Nome do cliente:");
  const produto = prompt("Produto:");
  const quantidade = parseInt(prompt("Quantidade:"));
  const preco = parseFloat(prompt("Preço unitário:"));
  if (!cliente || !produto || isNaN(quantidade) || isNaN(preco)) return alert("Dados inválidos");
  pedidos.push({ cliente, produto, quantidade, preco });
  atualizarFinanceiro();
  renderPedidos();
});

function deletarPedido(index) {
  if (confirm("Deseja deletar este pedido?")) {
    pedidos.splice(index, 1);
    atualizarFinanceiro();
    renderPedidos();
  }
}

printPedidosBtn.addEventListener("click", () => {
  let conteudo = "";
  pedidos.forEach((p, i) => {
    conteudo += `Pedido #${i + 1}\nCliente: ${p.cliente}\nProduto: ${p.produto}\nQuantidade: ${p.quantidade}\nTotal: R$ ${(p.preco * p.quantidade).toFixed(2)}\n\n`;
  });
  const printWindow = window.open('', '', 'width=600,height=600');
  printWindow.document.write('<pre>' + conteudo + '</pre>');
  printWindow.print();
});

// ======= FINANCEIRO =======
const totalVendasEl = document.getElementById("totalVendas");
const totalCustosEl = document.getElementById("totalCustos");
const lucroEl = document.getElementById("lucro");
const financeTableBody = document.querySelector("#financeTable tbody");

function atualizarFinanceiro() {
  let totalVendas = 0;
  let totalCustos = 0;

  financeTableBody.innerHTML = "";
  pedidos.forEach(p => {
    const custoProduto = calcularCustoProduto(p.produto) * p.quantidade;
    const lucro = (p.preco * p.quantidade) - custoProduto;
    totalVendas += p.preco * p.quantidade;
    totalCustos += custoProduto;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date().toLocaleString()}</td>
      <td>${p.produto}</td>
      <td>${p.quantidade}</td>
      <td>R$ ${p.preco.toFixed(2)}</td>
      <td>R$ ${custoProduto.toFixed(2)}</td>
      <td>R$ ${lucro.toFixed(2)}</td>
    `;
    financeTableBody.appendChild(tr);
  });

  totalVendasEl.textContent = totalVendas.toFixed(2);
  totalCustosEl.textContent = totalCustos.toFixed(2);
  lucroEl.textContent = (totalVendas - totalCustos).toFixed(2);
}

function calcularCustoProduto(nomeProduto) {
  const produto = produtos.find(p => p.nome === nomeProduto);
  if (!produto || !produto.insumos.length) return 0;

  let custoTotal = 0;
  produto.insumos.forEach(insumoUso => {
    const i = insumos.find(ins => ins.nome === insumoUso.nome);
    if (i) {
      const custoUnit = i.custo / i.quantidade;
      custoTotal += custoUnit * insumoUso.quantidade;
    }
  });
  return custoTotal;
}

// ======= Inicialização =======
renderProdutos();
renderInsumos();
renderPedidos();
atualizarFinanceiro();
