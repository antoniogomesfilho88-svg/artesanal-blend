let secaoAtual = 'produtos';
mostrarSecao(secaoAtual);

// FUNÇÃO PARA NAVEGAR ENTRE SEÇÕES
function mostrarSecao(secao) {
  document.querySelectorAll('.secao').forEach(s => s.style.display = 'none');
  document.getElementById(secao).style.display = 'block';
  secaoAtual = secao;
}

// ================= PRODUTOS =================
const formProduto = document.getElementById('formProduto');
const tabelaProdutos = document.querySelector('#tabelaProdutos tbody');

async function carregarProdutos() {
  const res = await fetch('/api/produtos');
  const produtos = await res.json();
  tabelaProdutos.innerHTML = '';
  produtos.forEach(p => {
    tabelaProdutos.innerHTML += `<tr>
      <td>${p.nome}</td>
      <td>R$ ${p.preco.toFixed(2)}</td>
      <td><img src="${p.imagem}" alt="${p.nome}" width="50"></td>
      <td>
        <button onclick="editarProduto('${p._id}','${p.nome}',${p.preco},'${p.imagem}')">✏️</button>
        <button onclick="deletarProduto('${p._id}')">🗑️</button>
      </td>
    </tr>`;
  });
}
formProduto.addEventListener('submit', async e => {
  e.preventDefault();
  const nome = document.getElementById('produtoNome').value;
  const preco = parseFloat(document.getElementById('produtoPreco').value);
  const imagem = document.getElementById('produtoImagem').value;
  await fetch('/api/produtos', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({nome, preco, imagem})
  });
  formProduto.reset();
  carregarProdutos();
});
async function deletarProduto(id) {
  await fetch(`/api/produtos/${id}`,{method:'DELETE'});
  carregarProdutos();
}
async function editarProduto(id, nome, preco, imagem) {
  const novoNome = prompt("Novo nome:", nome);
  const novoPreco = parseFloat(prompt("Novo preço:", preco));
  const novaImagem = prompt("Nova imagem URL:", imagem);
  if(novoNome && !isNaN(novoPreco)){
    await fetch(`/api/produtos/${id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nome:novoNome, preco:novaPreco, imagem:novaImagem})
    });
    carregarProdutos();
  }
}
carregarProdutos();

// ================= INSUMOS =================
const formInsumo = document.getElementById('formInsumo');
const tabelaInsumos = document.querySelector('#tabelaInsumos tbody');

async function carregarInsumos() {
  const res = await fetch('/api/insumos');
  const insumos = await res.json();
  tabelaInsumos.innerHTML = '';
  insumos.forEach(i => {
    tabelaInsumos.innerHTML += `<tr>
      <td>${i.nome}</td>
      <td>${i.quantidade}</td>
      <td>
        <button onclick="editarInsumo('${i._id}','${i.nome}',${i.quantidade})">✏️</button>
        <button onclick="deletarInsumo('${i._id}')">🗑️</button>
      </td>
    </tr>`;
  });
}
formInsumo.addEventListener('submit', async e => {
  e.preventDefault();
  const nome = document.getElementById('insumoNome').value;
  const quantidade = parseInt(document.getElementById('insumoQuantidade').value);
  await fetch('/api/insumos',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({nome, quantidade})
  });
  formInsumo.reset();
  carregarInsumos();
});
async function deletarInsumo(id) {
  await fetch(`/api/insumos/${id}`,{method:'DELETE'});
  carregarInsumos();
}
async function editarInsumo(id, nome, quantidade){
  const novoNome = prompt("Novo nome:", nome);
  const novaQtd = parseInt(prompt("Nova quantidade:", quantidade));
  if(novoNome && !isNaN(novaQtd)){
    await fetch(`/api/insumos/${id}`,{
      method:'PUT', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nome:novoNome, quantidade:novaQtd})
    });
    carregarInsumos();
  }
}
carregarInsumos();

// ================= PEDIDOS =================
const tabelaPedidos = document.querySelector('#tabelaPedidos tbody');
async function carregarPedidos() {
  const res = await fetch('/api/pedidos');
  const pedidos = await res.json();
  tabelaPedidos.innerHTML = '';
  pedidos.forEach(p => {
    tabelaPedidos.innerHTML += `<tr>
      <td>${p.clienteNome}</td>
      <td>R$ ${p.total.toFixed(2)}</td>
      <td>${p.status}</td>
      <td>${p.itens.map(i=>i.nome+" x"+i.qtd).join(", ")}</td>
      <td>
        <button onclick="atualizarStatus('${p._id}')">✅ Concluir</button>
      </td>
    </tr>`;
  });
}
async function atualizarStatus(id){
  await fetch(`/api/pedidos/${id}`, {
    method:'PUT', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({status:'Concluído'})
  });
  carregarPedidos();
}
carregarPedidos();

// ================= FINANCEIRO =================
async function carregarFinanceiro(){
  const res = await fetch('/api/financeiro');
  const total = await res.json();
  document.getElementById('totalFinanceiro').textContent = total.toFixed(2);
}
carregarFinanceiro();

// Atualiza financeiro e pedidos a cada 10s
setInterval(()=>{carregarPedidos(); carregarFinanceiro();},10000);
