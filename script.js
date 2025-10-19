let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
const TAXAS = {
  "Jardim Canadá": 6.00,
  "Retiro das Pedras": 10.00,
  "Serra do Manacás": 10.00,
  "Vale do Sol": 12.00,
  "Alphaville": 15.00,
  "": 0.00
};

function salvarCarrinho() {
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function adicionarAoCarrinho(nome, preco) {
  const itemExistente = carrinho.find(i => i.nome === nome);
  if (itemExistente) {
    itemExistente.qtd++;
  } else {
    carrinho.push({ nome, preco, qtd: 1 });
  }
  salvarCarrinho();
  renderCarrinho();
}

function alterarQuantidade(index, delta) {
  carrinho[index].qtd += delta;
  if (carrinho[index].qtd <= 0) carrinho.splice(index, 1);
  salvarCarrinho();
  renderCarrinho();
}

function removerItem(index) {
  carrinho.splice(index, 1);
  salvarCarrinho();
  renderCarrinho();
}

function renderCarrinho() {
  const cartItems = document.getElementById('cart-items');
  const subtotalDisplay = document.getElementById('subTotalDisplay');
  const taxaDisplay = document.getElementById('taxaEntregaDisplay');
  const totalDisplay = document.getElementById('cart-total');
  const cartCount = document.getElementById('cartCount');
  const regiaoSelect = document.getElementById('clienteRegiao');

  cartItems.innerHTML = '';
  let subtotal = 0;
  let totalItens = 0;

  carrinho.forEach((item, i) => {
    const totalItem = item.preco * item.qtd;
    subtotal += totalItem;
    totalItens += item.qtd;

    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
      <div class="item-info">
        <strong>${item.qtd}x ${item.nome}</strong><br>
        <small>R$ ${item.preco.toFixed(2)} un.</small>
      </div>
      <div class="item-controls">
        <button onclick="alterarQuantidade(${i}, -1)">−</button>
        <button onclick="alterarQuantidade(${i}, 1)">+</button>
        <button onclick="removerItem(${i})">🗑️</button>
      </div>
    `;
    cartItems.appendChild(div);
  });

  if (carrinho.length === 0) {
    cartItems.innerHTML = '<p class="muted text-center">Carrinho vazio</p>';
  }

  const regiao = regiaoSelect ? regiaoSelect.value : '';
  const taxa = TAXAS[regiao] || 0;
  const total = subtotal + taxa;

  subtotalDisplay.textContent = `R$ ${subtotal.toFixed(2)}`;
  taxaDisplay.textContent = `R$ ${taxa.toFixed(2)}`;
  totalDisplay.textContent = `R$ ${total.toFixed(2)}`;
  if (cartCount) cartCount.textContent = totalItens;
}

document.addEventListener('DOMContentLoaded', () => {
  renderCarrinho();

  document.getElementById('openCartBtn')?.addEventListener('click', () => {
    document.getElementById('cart').classList.add('show');
  });

  document.getElementById('closeCartBtn')?.addEventListener('click', () => {
    document.getElementById('cart').classList.remove('show');
  });
});
