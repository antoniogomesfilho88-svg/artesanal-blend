// Controle de abas
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Funções para produtos
const produtoForm = document.getElementById("produtoForm");
produtoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const produto = {
    nome: document.getElementById("nomeProduto").value,
    preco: parseFloat(document.getElementById("precoProduto").value),
    descricao: document.getElementById("descricaoProduto").value,
    imagem: document.getElementById("imagemProduto").value
  };
  await fetch("/api/produtos", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(produto)
  });
  produtoForm.reset();
  carregarProdutos();
});

async function carregarProdutos() {
  const res = await fetch("/api/produtos");
  const produtos = await res.json();
  const lista = document.getElementById("listaProdutos");
  lista.innerHTML = produtos.map(p => `
    <div class="produto-card">
      <img src="${p.imagem}" alt="${p.nome}">
      <h3>${p.nome}</h3>
      <p>${p.descricao}</p>
      <p>R$ ${p.preco.toFixed(2)}</p>
    </div>
  `).join("");
}

// Funções para insumos
const insumoForm = document.getElementById("insumoForm");
insumoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const insumo = {
    nome: document.getElementById("nomeInsumo").value,
    quantidade: parseFloat(document.getElementById("quantidadeInsumo").value),
    unidade: document.getElementById("unidadeInsumo").value,
    preco: parseFloat(document.getElementById("precoInsumo").value)
  };
  await fetch("/api/insumos", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(insumo)
  });
  insumoForm.reset();
  carregarInsumos();
});

async function carregarInsumos() {
  const res = await fetch("/api/insumos");
  const insumos = await res.json();
  const lista = document.getElementById("listaInsumos");
  lista.innerHTML = insumos.map(i => `
    <div class="insumo-card">
      <h3>${i.nome}</h3>
      <p>Quantidade: ${i.quantidade} ${i.unidade}</p>
      <p>Preço: R$ ${i.preco.toFixed(2)}</p>
    </div>
  `).join("");
}

// Funções para pedidos
async function carregarPedidos() {
  const res = await fetch("/api/pedidos");
  const pedidos = await res.json();
  const lista = document.getElementById("listaPedidos");
  lista.innerHTML = pedidos.map(p => `
    <div class="pedido-card">
      <p><strong>Cliente:</strong> ${p.cliente}</p>
      <p><strong>Total:</strong> R$ ${p.total.toFixed(2)}</p>
      <p><strong>Itens:</strong> ${p.itens.map(i => i.nome).join(", ")}</p>
      <button onclick="imprimirPedido('${p._id}')">Imprimir</button>
    </div>
  `).join("");
}

// Imprimir pedido
function imprimirPedido(id) {
  fetch(`/api/pedidos/${id}`)
    .then(res => res.json())
    .then(p => {
      const printWindow = window.open("", "PRINT", "height=600,width=400");
      printWindow.document.write(`<h1>Cupom Não Fiscal</h1>`);
      printWindow.document.write(`<p>Cliente: ${p.cliente}</p>`);
      printWindow.document.write(`<p>Total: R$ ${p.total.toFixed(2)}</p>`);
      printWindow.document.write(`<p>Itens: ${p.itens.map(i => i.nome).join(", ")}</p>`);
      printWindow.document.close();
      printWindow.print();
    });
}

// Financeiro
async function carregarFinanceiro() {
  const res = await fetch("/api/financeiro");
  const data = await res.json();
  document.getElementById("totalVendas").textContent = data.vendas.toFixed(2);
  document.getElementById("totalCustos").textContent = data.custos.toFixed(2);
  document.getElementById("lucro").textContent = data.lucro.toFixed(2);
}

// Inicializar
carregarProdutos();
carregarInsumos();
carregarPedidos();
carregarFinanceiro();
