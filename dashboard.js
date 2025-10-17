let produtos = [];
let insumos = [];
let pedidos = [];
let editarProdutoId = null;
let editarInsumoId = null;

// --- Navegação ---
function mostrarSecao(secao) {
  document.querySelectorAll('.secao').forEach(s => s.style.display='none');
  document.getElementById(secao).style.display='block';
  if(secao==='produtos') carregarProdutos();
  if(secao==='insumos') carregarInsumos();
  if(secao==='pedidos') carregarPedidos();
  if(secao==='financeiro') carregarFinanceiro();
}

// --- Modal Produto ---
function abrirModalProduto() {
  document.getElementById('modal-produto').style.display='block';
  carregarListaInsumos();
}
function fecharModalProduto() { 
  document.getElementById('modal-produto').style.display='none';
  editarProdutoId=null;
}

// --- Modal Insumo ---
function abrirModalInsumo() { document.getElementById('modal-insumo').style.display='block'; }
function fecharModalInsumo() { document.getElementById('modal-insumo').style.display='none'; editarInsumoId=null; }

// --- Produtos ---
async function carregarProdutos() {
  const res = await fetch('/api/produtos');
  produtos = await res.json();
  const tbody = document.querySelector('#tabela-produtos tbody');
  tbody.innerHTML='';
  produtos.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML=`<td>${p.nome}</td><td>${p.preco.toFixed(2)}</td><td>${p.descricao}</td>
      <td>
        <button onclick="editarProduto('${p._id}')">✏️</button>
        <button onclick="excluirProduto('${p._id}')">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function carregarListaInsumos() {
  const div = document.getElementById('lista-insumos-produto');
  div.innerHTML='';
  insumos.forEach(i=>{
    div.innerHTML+=`<label>${i.nome}: <input type="number" min="0" value="0" data-id="${i._id}"></label><br>`;
  });
}

function editarProduto(id) {
  const p = produtos.find(x=>x._id===id);
  editarProdutoId = id;
  document.getElementById('produto-nome').value=p.nome;
  document.getElementById('produto-preco').value=p.preco;
  document.getElementById('produto-descricao').value=p.descricao;
  document.getElementById('produto-imagem').value=p.imagem;
  abrirModalProduto();
}

async function salvarProduto() {
  const nome = document.getElementById('produto-nome').value;
  const preco = parseFloat(document.getElementById('produto-preco').value);
  const descricao = document.getElementById('produto-descricao').value;
  const imagem = document.getElementById('produto-imagem').value;
  const insumosInputs = document.querySelectorAll('#lista-insumos-produto input');
  const insumosProduto = [];
  insumosInputs.forEach(inp=>{
    if(parseFloat(inp.value)>0) insumosProduto.push({insumo: inp.dataset.id, quantidade: parseFloat(inp.value)});
  });

  const body = { nome, preco, descricao, imagem, insumos: insumosProduto };
  if(editarProdutoId) await fetch('/api/produtos/'+editarProdutoId, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
  else await fetch('/api/produtos', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
  
  fecharModalProduto();
  carregarProdutos();
}

// --- Excluir Produto ---
async function excluirProduto(id){
  await fetch('/api/produtos/'+id,{method:'DELETE'});
  carregarProdutos();
}

// --- Insumos ---
async function carregarInsumos() {
  const res = await fetch('/api/insumos');
  insumos = await res.json();
  const tbody = document.querySelector('#tabela-insumos tbody');
  tbody.innerHTML='';
  insumos.forEach(i=>{
    const tr = document.createElement('tr');
    tr.innerHTML=`<td>${i.nome}</td><td>${i.quantidade}</td><td>${i.unidade}</td><td>${i.precoUnitario.toFixed(2)}</td>
      <td>
        <button onclick="editarInsumo('${i._id}')">✏️</button>
        <button onclick="excluirInsumo('${i._id}')">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function editarInsumo(id){
  const i = insumos.find(x=>x._id===id);
  editarInsumoId=id;
  document.getElementById('insumo-nome').value=i.nome;
  document.getElementById('insumo-quantidade').value=i.quantidade;
  document.getElementById('insumo-unidade').value=i.unidade;
  document.getElementById('insumo-preco').value=i.precoUnitario;
  abrirModalInsumo();
}

async function salvarInsumo(){
  const nome = document.getElementById('insumo-nome').value;
  const quantidade = parseFloat(document.getElementById('insumo-quantidade').value);
  const unidade = document.getElementById('insumo-unidade').value;
  const precoUnitario = parseFloat(document.getElementById('insumo-preco').value);
  const body={nome,quantidade,unidade,precoUnitario};
  if(editarInsumoId) await fetch('/api/insumos/'+editarInsumoId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  else await fetch('/api/insumos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  fecharModalInsumo();
  carregarInsumos();
}

async function excluirInsumo(id){
  await fetch('/api/insumos/'+id,{method:'DELETE'});
  carregarInsumos();
}

// --- Pedidos ---
async function carregarPedidos() {
  const res = await fetch('/api/pedidos');
  pedidos = await res.json();
  const tbody = document.querySelector('#tabela-pedidos tbody');
  tbody.innerHTML='';
  pedidos.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${p.cliente.nome}</td><td>${p.total.toFixed(2)}</td><td>${p.pagamento}</td>
      <td><button onclick="imprimirPedido('${p._id}')">🖨️ Imprimir</button></td>`;
    tbody.appendChild(tr);
  });
}

async function imprimirPedido(id){
  const pedido = pedidos.find(p=>p._id===id);
  let texto=`Artesanal Blend\nPedido do Cliente: ${pedido.cliente.nome}\nItens:\n`;
  pedido.itens.forEach(i=>texto+=`- ${i.produto.nome} x ${i.quantidade}\n`);
  texto+=`Total: R$ ${pedido.total.toFixed(2)}\nPagamento: ${pedido.pagamento}`;
  const w = window.open('','PRINT');
  w.document.write('<pre>'+texto+'</pre>');
  w.print();
  w.close();
}

// --- Financeiro ---
async function carregarFinanceiro() {
  const res = await fetch('/api/financeiro');
  const f = await res.json();
  document.getElementById('total-vendas').textContent=f.totalVendas.toFixed(2);
  document.getElementById('total-custo').textContent=f.totalCusto.toFixed(2);
  document.getElementById('lucro').textContent=f.lucro.toFixed(2);

  const ctx = document.getElementById('grafico-vendas').getContext('2d');
  new Chart(ctx,{
    type:'bar',
    data:{
      labels:['Vendas','Custo','Lucro'],
      datasets:[{label:'R$',data:[f.totalVendas,f.totalCusto,f.lucro],backgroundColor:['#4CAF50','#f44336','#2196F3']}]
    }
  });
}

// Carregar produtos e insumos ao abrir dashboard
mostrarSecao('produtos');
fetch('/api/insumos').then(res=>res.json()).then(data=>insumos=data);
