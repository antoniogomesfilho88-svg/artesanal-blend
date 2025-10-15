// ===============================
// ARTESANAL BLEND - SCRIPT COMPLETO
// ===============================

let carrinho = [];
let taxaEntrega = 0;

// ===============================
// Carregar o Cardápio do Servidor
// ===============================
async function carregarMenu() {
  try {
    const response = await fetch("/api/menu");
    if (!response.ok) throw new Error("Erro ao carregar cardápio.");
    const data = await response.json();

    const categorias = ["Hambúrgueres", "Combos", "Acompanhamentos", "Adicionais", "Bebidas"];
    categorias.forEach(cat => {
      const container = document.getElementById(`cat-${cat}`);
      if (container) container.innerHTML = "";
    });

    data.forEach(item => {
      const container = document.getElementById(`cat-${item.cat}`);
      if (!container) return;

      const card = document.createElement("div");
      card.classList.add("menu-item");
      card.innerHTML = `
        <img src="${item.imgUrl}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
        <div class="price-line">
          <span class="price">R$ ${item.price.toFixed(2)}</span>
          <button class="add-btn" onclick="addToCart(${item.id})">+</button>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (error) {
    console.error("❌ Erro ao carregar cardápio:", error);
    alert("⚠️ Não foi possível carregar o cardápio. Tente novamente.");
  }
}

// ===============================
// Funções do Carrinho
// ===============================
function addToCart(id) {
  fetch("/api/menu")
    .then(res => res.json())
    .then(menu => {
      const produto = menu.find(p => p.id === id);
      if (!produto) return alert("Produto não encontrado!");

      const existente = carrinho.find(p => p.id === id);
      if (existente) {
        existente.qtd += 1;
      } else {
        carrinho.push({ ...produto, qtd: 1 });
      }
      renderCarrinho();
    })
    .catch(err => console.error("Erro ao adicionar produto:", err));
}

function removeFromCart(id) {
  const index = carrinho.findIndex(p => p.id === id);
  if (index !== -1) {
    carrinho[index].qtd -= 1;
    if (carrinho[index].qtd <= 0) carrinho.splice(index, 1);
  }
  renderCarrinho();
}

function calcularSubtotal() {
  return carrinho.reduce((acc, item) => acc + item.price * item.qtd, 0);
}

function renderCarrinho() {
  const container = document.getElementById("cart-items");
  const totalElem = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const cartCount = document.getElementById("cartCount");

  if (!container) return;

  container.innerHTML = "";
  let subtotal = calcularSubtotal();

  carrinho.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <span>${item.name}</span>
      <div>
        <button onclick="removeFromCart(${item.id})">-</button>
        <span>${item.qtd}</span>
        <button onclick="addToCart(${item.id})">+</button>
      </div>
      <span>R$ ${(item.price * item.qtd).toFixed(2)}</span>
    `;
    container.appendChild(div);
  });

  const totalFinal = subtotal + taxaEntrega;
  totalElem.textContent = `Total: R$ ${totalFinal.toFixed(2)}`;

  checkoutBtn.disabled = carrinho.length === 0;
  cartCount.textContent = carrinho.reduce((acc, p) => acc + p.qtd, 0);
}

// ===============================
// Região e Taxa de Entrega
// ===============================
function atualizarTaxa() {
  const regiao = document.getElementById("clienteRegiao").value;

  switch (regiao) {
    case "Jardim Canadá":
      taxaEntrega = 6.00;
      break;
    case "Retiro das Pedras":
      taxaEntrega = 10.00;
      break;
    case "Serra do Manacás":
      taxaEntrega = 10.00;
      break;
    case "Vale do Sol":
      taxaEntrega = 12.00;
      break;
    case "Alphaville":
      taxaEntrega = 15.00;
      break;
    default:
      taxaEntrega = 0;
  }

  renderCarrinho();
}

// ===============================
// Mostrar campo de troco
// ===============================
function mostrarTroco() {
  const pagamento = document.getElementById("pagamento").value;
  const campoTroco = document.getElementById("campoTroco");
  campoTroco.style.display = pagamento === "Dinheiro" ? "block" : "none";
}

// ===============================
// Enviar Pedido pelo WhatsApp
// ===============================
function enviarPedido() {
  if (carrinho.length === 0) return alert("Adicione itens ao carrinho antes de enviar!");

  const nome = document.getElementById("clienteNome").value || "Cliente não informado";
  const telefone = document.getElementById("clienteTelefone").value || "Telefone não informado";
  const endereco = document.getElementById("clienteEndereco").value || "Endereço não informado";
  const regiao = document.getElementById("clienteRegiao").value || "Região não informada";
  const pagamento = document.getElementById("pagamento").value || "Não informado";
  const troco = document.getElementById("troco").value || "-";
  const obs = document.getElementById("obsCliente").value || "Nenhuma observação.";

  let mensagem = `🍔 *Pedido - Artesanal Blend*%0A%0A`;

  carrinho.forEach(item => {
    mensagem += `• ${item.name} (x${item.qtd}) - R$ ${(item.price * item.qtd).toFixed(2)}%0A`;
  });

  const subtotal = calcularSubtotal();
  const totalFinal = subtotal + taxaEntrega;

  mensagem += `%0A💰 *Subtotal:* R$ ${subtotal.toFixed(2)}`;
  mensagem += `%0A🚚 *Entrega (${regiao}):* R$ ${taxaEntrega.toFixed(2)}`;
  mensagem += `%0A💵 *Total:* R$ ${totalFinal.toFixed(2)}`;
  mensagem += `%0A%0A🏠 *Endereço:* ${endereco}`;
  mensagem += `%0A👤 *Nome:* ${nome}`;
  mensagem += `%0A📞 *Telefone:* ${telefone}`;
  mensagem += `%0A🏙️ *Região:* ${regiao}`;
  mensagem += `%0A💳 *Pagamento:* ${pagamento}`;
  if (pagamento === "Dinheiro") {
    mensagem += `%0A💵 *Troco para:* R$ ${troco}`;
  }
  mensagem += `%0A📝 *Obs:* ${obs}`;
  mensagem += `%0A%0A✅ *Agradecemos seu pedido!*`;

  const numero = "5531992128891";
  const url = `https://wa.me/${numero}?text=${mensagem}`;
  window.open(url, "_blank");
}

// ===============================
// Inicialização
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  carregarMenu();
  renderCarrinho();

  const checkoutBtn = document.getElementById("checkoutBtn");
  const regiaoSelect = document.getElementById("clienteRegiao");

  if (checkoutBtn) checkoutBtn.addEventListener("click", enviarPedido);
  if (regiaoSelect) regiaoSelect.addEventListener("change", atualizarTaxa);
});

// Controle de abrir e fechar o carrinho com animação
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cart = document.getElementById("cart");

if (openCartBtn && cart) {
  openCartBtn.addEventListener("click", () => {
    cart.classList.add("show");
  });
}

if (closeCartBtn && cart) {
  closeCartBtn.addEventListener("click", () => {
    cart.classList.remove("show");
  });
}
