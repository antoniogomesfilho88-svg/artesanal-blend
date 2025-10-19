// ==============================
// ARTESANAL BLEND - SCRIPT FINAL
// ==============================

let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
const TAXAS = {
  "Jardim Canadá": 6.00,
  "Retiro das Pedras": 10.00,
  "Serra do Manacás": 10.00,
  "Vale do Sol": 12.00,
  "Alphaville": 15.00,
  "": 0.00
};

// ==============================
// 🔹 CARREGAR CARDÁPIO
// ==============================

async function carregarCardapio() {
  try {
    // 🔽 ALTERE AQUI COM SUA URL DO RENDER:
    const API_URL = 'https://seuapp.onrender.com/api/cardapio';

    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Erro: ${response.status}`);

    const cardapio = await response.json();
    renderizarCardapio(cardapio);
  } catch (erro) {
    console.warn('⚠️ Falha ao carregar API, usando menu local.', erro);
    carregarCardapioLocal();
  }
}

function renderizarCardapio(cardapio) {
  Object.keys(cardapio).forEach(categoria => {
    const container = document.getElementById(`cat-${categoria}`);
    if (container) {
      container.innerHTML = cardapio[categoria].map(produto => {
        const preco = Number(produto.preco) || 0;
        const imagem = produto.imagem || '';
        const descricao = produto.descricao || '';
        return `
          <div class="menu-item">
            ${imagem ? `<img src="${imagem}" alt="${produto.nome}" />` : ''}
            <div class="menu-item-content">
              <span class="menu-item-name">${produto.nome}</span>
              <span class="menu-item-price">R$ ${preco.toFixed(2)}</span>
              <p class="menu-item-description">${descricao}</p>
              <button class="btn-add" onclick="adicionarAoCarrinho('${categoria}', '${produto.nome}', ${preco})">
                ➕ Adicionar
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  });
  renderResumoCarrinho();
}

function carregarCardapioLocal() {
  fetch('menu.json')
    .then(r => r.json())
    .then(renderizarCardapio)
    .catch(err => console.error('❌ Erro ao carregar menu local:', err));
}

// ==============================
// 🔹 CARRINHO DE COMPRAS
// ==============================

function adicionarAoCarrinho(categoria, nome, preco) {
  const existente = carrinho.find(item => item.nome === nome);
  if (existente) {
    existente.qtd++;
  } else {
    carrinho.push({ categoria, nome, preco, qtd: 1 });
  }
  salvarCarrinho();
  renderResumoCarrinho();
}

function alterarQuantidadeResumo(index, delta) {
  carrinho[index].qtd += delta;
  if (carrinho[index].qtd <= 0) carrinho.splice(index, 1);
  salvarCarrinho();
  renderResumoCarrinho();
}

function removerDoResumo(index) {
  carrinho.splice(index, 1);
  salvarCarrinho();
  renderResumoCarrinho();
}

function salvarCarrinho() {
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// ==============================
// 🔹 RESUMO DO PEDIDO
// ==============================

function renderResumoCarrinho() {
  const cartItems = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('subTotalDisplay');
  const taxaEl = document.getElementById('taxaEntregaDisplay');
  const totalEl = document.getElementById('cart-total');
  const countEl = document.getElementById('cartCount');
  const checkoutBtn = document.getElementById('checkoutBtn');

  cartItems.innerHTML = '';

  let subtotal = 0;
  let totalItens = 0;

  carrinho.forEach((item, index) => {
    const totalItem = item.qtd * item.preco;
    subtotal += totalItem;
    totalItens += item.qtd;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="item-info">
        <strong>${item.qtd}x ${item.nome}</strong>
        <span>R$ ${totalItem.toFixed(2)}</span>
      </div>
      <div class="item-controls">
        <button onclick="alterarQuantidadeResumo(${index}, -1)">−</button>
        <button onclick="alterarQuantidadeResumo(${index}, 1)">+</button>
        <button onclick="removerDoResumo(${index})" class="remove">🗑️</button>
      </div>
    `;
    cartItems.appendChild(div);
  });

  if (carrinho.length === 0)
    cartItems.innerHTML = '<div class="muted text-center">Carrinho vazio</div>';

  const regiao = document.getElementById('clienteRegiao')?.value || '';
  const taxa = TAXAS[regiao] || 0;
  const total = subtotal + taxa;

  subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
  taxaEl.textContent = `R$ ${taxa.toFixed(2)}`;
  totalEl.textContent = `R$ ${total.toFixed(2)}`;

  if (countEl) countEl.textContent = totalItens;
  if (checkoutBtn) checkoutBtn.disabled = carrinho.length === 0;
}

// ==============================
// 🔹 FINALIZAR PEDIDO
// ==============================

function finalizarPedido() {
  const nome = document.getElementById('clienteNome').value.trim();
  const telefone = document.getElementById('clienteTelefone').value.trim();
  const endereco = document.getElementById('clienteEndereco').value.trim();
  const regiao = document.getElementById('clienteRegiao').value;
  const pagamento = document.getElementById('pagamento').value;
  const obs = document.getElementById('obsCliente').value.trim();

  if (!carrinho.length) return alert('Seu carrinho está vazio!');
  if (!nome || !telefone || !endereco || !pagamento)
    return alert('Preencha todos os campos obrigatórios.');

  const subtotal = carrinho.reduce((acc, i) => acc + i.qtd * i.preco, 0);
  const taxa = TAXAS[regiao] || 0;
  const total = subtotal + taxa;

  let mensagem = `*🍔 NOVO PEDIDO - ARTESANAL BLEND*\n\n`;
  mensagem += `*Cliente:* ${nome}\n`;
  mensagem += `*Telefone:* ${telefone}\n`;
  mensagem += `*Endereço:* ${endereco} (${regiao})\n\n`;
  mensagem += `*Itens do pedido:*\n`;

  carrinho.forEach(item => {
    mensagem += `• ${item.qtd}x ${item.nome} - R$ ${(item.qtd * item.preco).toFixed(2)}\n`;
  });

  mensagem += `\n*Subtotal:* R$ ${subtotal.toFixed(2)}\n`;
  mensagem += `*Taxa de entrega:* R$ ${taxa.toFixed(2)}\n`;
  mensagem += `*Total:* R$ ${total.toFixed(2)}\n\n`;
  mensagem += `*Pagamento:* ${pagamento}\n`;
  if (obs) mensagem += `\n*Obs:* ${obs}\n`;
  mensagem += `\n_Pedido gerado via sistema online._`;

  const url = `https://wa.me/5531992128891?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');

  carrinho = [];
  salvarCarrinho();
  renderResumoCarrinho();
}

// ==============================
// 🔹 EVENTOS
// ==============================

document.addEventListener('DOMContentLoaded', () => {
  carregarCardapio();
  renderResumoCarrinho();

  document.getElementById('checkoutBtn')?.addEventListener('click', finalizarPedido);
  document.getElementById('clienteRegiao')?.addEventListener('change', renderResumoCarrinho);
});
