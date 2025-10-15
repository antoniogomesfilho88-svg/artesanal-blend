const LS_KEY = 'blendDashboard';
let state = { produtos: [] };

const money = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
function loadState() {
  const data = localStorage.getItem(LS_KEY);
  if (data) state = JSON.parse(data);
  else saveState();
}

function showContent(tabId, el) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelectorAll('.nav-tabs a').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
  if (tabId === 'produtos') renderProdutos();
  if (tabId === 'dashboard') updateResumo();
}

/* === PRODUTOS === */
function renderProdutos() {
  const tableBody = document.querySelector('#produtosTable tbody');
  tableBody.innerHTML = '';
  state.produtos.sort((a, b) => a.id - b.id);
  state.produtos.forEach(p => {
    const lucroPct = ((p.preco - p.custo) / p.preco * 100 || 0).toFixed(1);
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nome}</td>
      <td>${money(p.preco)}</td>
      <td>${money(p.custo)}</td>
      <td class="${lucroPct >= 0 ? 'positive' : 'negative'}">${lucroPct}%</td>
      <td>${p.categoria}</td>
      <td class="action-buttons">
        <button onclick="editProduto(${p.id})"><i class="fas fa-edit"></i></button>
        <button onclick="deleteProduto(${p.id})"><i class="fas fa-trash"></i></button>
      </td>`;
  });
  updateResumo();
}

function addProduto() {
  const id = document.getElementById('prodIdToEdit').value;
  const nome = document.getElementById('prodNome').value.trim();
  const desc = document.getElementById('prodDesc').value.trim();
  const preco = parseFloat(document.getElementById('prodPreco').value) || 0;
  const custo = parseFloat(document.getElementById('prodCusto').value) || 0;
  const cat = document.getElementById('prodCat').value;
  const imgUrl = document.getElementById('prodImgUrl').value || 'logo.jpg';

  if (!nome || preco <= 0) return alert('Nome e preço obrigatórios.');

  if (id) {
    const p = state.produtos.find(p => p.id == id);
    Object.assign(p, { nome, descricao: desc, preco, custo, categoria: cat, imgUrl });
    alert('Produto atualizado!');
  } else {
    const newId = state.produtos.length ? Math.max(...state.produtos.map(p => p.id)) + 1 : 1;
    state.produtos.push({ id: newId, nome, descricao: desc, preco, custo, categoria: cat, imgUrl });
    alert('Produto adicionado!');
  }
  saveState(); renderProdutos(); clearForm();
}

function editProduto(id) {
  const p = state.produtos.find(p => p.id === id);
  if (!p) return;
  document.getElementById('prodIdToEdit').value = p.id;
  document.getElementById('prodNome').value = p.nome;
  document.getElementById('prodDesc').value = p.descricao;
  document.getElementById('prodPreco').value = p.preco;
  document.getElementById('prodCusto').value = p.custo;
  document.getElementById('prodCat').value = p.categoria;
  document.getElementById('prodImgUrl').value = p.imgUrl;
}

function deleteProduto(id) {
  if (confirm('Excluir produto?')) {
    state.produtos = state.produtos.filter(p => p.id !== id);
    saveState(); renderProdutos();
  }
}

function clearForm() {
  ['prodIdToEdit','prodNome','prodDesc','prodPreco','prodCusto','prodImgUrl'].forEach(id=>document.getElementById(id).value='');
}

/* === RESUMO === */
function updateResumo() {
  document.getElementById('totalProdutos').textContent = state.produtos.length;
  const lucroMedio = state.produtos.length ? 
    (state.produtos.reduce((s,p)=>(s+(p.preco-p.custo)/p.preco*100),0)/state.produtos.length).toFixed(1) : 0;
  document.getElementById('lucroMedio').textContent = `${lucroMedio}%`;
}

/* === EXPORTAR MENU.JSON === */
function exportarMenuJSON() {
  const produtos = state.produtos.map(p => ({
    id: p.id, name: p.nome, desc: p.descricao,
    price: p.preco, cat: p.categoria, imgUrl: p.imgUrl
  }));
  const blob = new Blob([JSON.stringify(produtos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "menu.json"; a.click();
  URL.revokeObjectURL(url);
  alert("✅ Arquivo menu.json exportado com sucesso!");
}

loadState();
renderProdutos();
