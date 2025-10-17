const tabs = document.querySelectorAll(".tab-btn");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// Funções API
const api = {
  getProdutos: () => fetch("/produtos").then(res => res.json()),
  postProduto: data => fetch("/produtos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(res => res.json()),
  putProduto: (id, data) => fetch(`/produtos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(res => res.json()),
  deleteProduto: id => fetch(`/produtos/${id}`, { method: "DELETE" }).then(res => res.json()),

  getInsumos: () => fetch("/insumos").then(res => res.json()),
  postInsumo: data => fetch("/insumos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(res => res.json()),
  putInsumo: (id, data) => fetch(`/insumos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(res => res.json()),
  deleteInsumo: id => fetch(`/insumos/${id}`, { method: "DELETE" }).then(res => res.json()),

  getPedidos: () => fetch("/pedidos").then(res => res.json()),
  postPedido: data => fetch("/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(res => res.json()),

  getFinanceiro: () => fetch("/financeiro").then(res => res.json())
};

// Renderizar produtos
async function loadProdutos() {
  const produtos = await api.getProdutos();
  const tbody = document.querySelector("#produtosTable tbody");
  tbody.innerHTML = "";
  produtos.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${p.imagem}" width="50"></td>
      <td>${p.nome}</td>
      <td>R$ ${p.preco.toFixed(2)}</td>
      <td>${p.descricao}</td>
      <td>${p.insumos.map(i => i.nome).join(", ")}</td>
      <td>
        <button onclick="editProduto('${p._id}')">✏️</button>
        <button onclick="deleteProduto('${p._id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Renderizar insumos
async function loadInsumos() {
  const insumos = await api.getInsumos();
  const tbody = document.querySelector("#insumosTable tbody");
  tbody.innerHTML = "";
  insumos.forEach(i => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i.nome}</td>
      <td>${i.quantidade}</td>
      <td>${i.unidade}</td>
      <td>R$ ${i.custoUnitario.toFixed(2)}</td>
      <td>
        <button onclick="editInsumo('${i._id}')">✏️</button>
        <button onclick="deleteInsumo('${i._id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Renderizar pedidos
async function loadPedidos() {
  const pedidos = await api.getPedidos();
  const tbody = document.querySelector("#pedidosTable tbody");
  tbody.innerHTML = "";
  pedidos.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.cliente.nome}</td>
      <td>${p.produtos.map(prod => `${prod.produtoId} x${prod.quantidade}`).join(", ")}</td>
      <td>R$ ${p.total.toFixed(2)}</td>
      <td>${p.pagamento}</td>
      <td>${p.obs || ""}</td>
      <td>${new Date(p.data).toLocaleString()}</td>
      <td><button onclick="printPedido('${p._id}')">🖨️ Imprimir</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Renderizar financeiro
async function loadFinanceiro() {
  const data = await api.getFinanceiro();
  document.getElementById("receitaTotal").textContent = data.receitaTotal.toFixed(2);
  document.getElementById("custoTotal").textContent = data.custoTotal.toFixed(2);
  document.getElementById("lucroTotal").textContent = data.lucro.toFixed(2);
  document.getElementById("totalPedidos").textContent = data.totalPedidos;
}

// Inicializar
async function initDashboard() {
  await loadProdutos();
  await loadInsumos();
  await loadPedidos();
  await loadFinanceiro();
}

initDashboard();

// Aqui você pode criar funções como addProduto, editProduto, deleteProduto, addInsumo, etc.
// E também printPedido para enviar para impressora via JavaScript
