const LS_KEY = 'blendDashboard';
const LS_SESSION_KEY = 'dashboardSession'; // Nova chave para a sessão
const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234'; // ATENÇÃO: Em produção, o ideal é não ter a senha em texto claro.

let state = { produtos: [] };

const money = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Funções de Estado (Produtos)
function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
function loadState() {
  const data = localStorage.getItem(LS_KEY);
  if (data) state = JSON.parse(data);
  else saveState();
}

// === FUNÇÕES DE LOGIN ===
function checkSession() {
  const isLoggedIn = localStorage.getItem(LS_SESSION_KEY) === 'true';
  if (isLoggedIn) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'block';
  } else {
    document.getElementById('main-dashboard').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
  }
  return isLoggedIn;
}

function handleLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value.trim();

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    localStorage.setItem(LS_SESSION_KEY, 'true');
    checkSession();
    loadState(); // Carrega os dados só após o login
    showContent('dashboard', document.querySelector('.nav-tabs a')); // Redireciona para o dashboard
    alert('Login realizado com sucesso!');
  } else {
    alert('Usuário ou senha inválidos.');
  }
}

function handleLogout() {
  localStorage.removeItem(LS_SESSION_KEY);
  checkSession();
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  alert('Você saiu do painel.');
}
// === FIM DAS FUNÇÕES DE LOGIN ===

function showContent(tabId, el) {
  if (!checkSession()) return; // Protege contra acesso direto
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelectorAll('.nav-tabs a').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
  if (tabId === 'produtos') renderProdutos();
  if (tabId === 'dashboard') updateResumo();
}

/* === O RESTANTE DO SEU CÓDIGO (PRODUTOS, RESUMO, EXPORTAR) VAI AQUI === */

/* === PRODUTOS === */
function renderProdutos() {
  // ... (o conteúdo da sua função renderProdutos permanece o mesmo)
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
  // ... (o conteúdo da sua função addProduto permanece o mesmo)
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
  // ... (o conteúdo da sua função editProduto permanece o mesmo)
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
  // ... (o conteúdo da sua função deleteProduto permanece o mesmo)
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
  // ... (o conteúdo da sua função updateResumo permanece o mesmo)
  document.getElementById('totalProdutos').textContent = state.produtos.length;
  const lucroMedio = state.produtos.length ?
    (state.produtos.reduce((s,p)=>(s+(p.preco-p.custo)/p.preco*100),0)/state.produtos.length).toFixed(1) : 0;
  document.getElementById('lucroMedio').textContent = `${lucroMedio}%`;
}

/* === EXPORTAR MENU.JSON === */
// Esta função será substituída no próximo passo pela versão com token.
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
  alert("✅ Arquivo menu.json exportado com sucesso! (Ainda não salvo no servidor)");
}

// INICIALIZAÇÃO
// Não chame loadState/renderProdutos aqui. A função checkSession fará isso após o login.
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  // Adiciona o listener para o botão de login (se você estiver usando um no HTML)
  const loginButton = document.getElementById('login-button');
  if (loginButton) loginButton.addEventListener('click', handleLogin);
});
