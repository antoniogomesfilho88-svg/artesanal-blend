// ===============================
// ARTESANAL BLEND - CARDÁPIO ONLINE
// ===============================

// Carrinho
let carrinho = [];

// ===============================
// Função principal - Carregar Menu
// ===============================
async function carregarMenu() {
  try {
    const response = await fetch("/api/menu");
    if (!response.ok) throw new Error("Erro ao carregar cardápio.");

    const data = await response.json();

    // Limpa todas as categorias antes de carregar
    const categorias = ["Hambúrgueres", "Combos", "Acompanhamentos", "Adicionais", "Bebidas"];
    categorias.forEach(cat => {
      const container = document.getElementById(`cat-${cat}`);
      if (container) container.innerHTML = "";
    });

    // Cria os cards dos produtos
    data.forEach(item => {
      const container = document.getElementById(`cat-${item.cat}`);
      if (!container) {
        console.warn(`⚠️ Categoria não encontrada para: ${item.cat}`);
        return;
      }

      const card = document.createElement("div");
      card.classList.add("menu-item");
      card.innerHTML = `
        <img src="${item.imgUrl}" alt="${item.name}" class="menu-img">
        <div class="info">
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
          <div class="price-line">
            <span class="price">R$ ${item.price.toFixed(2)}</span>
            <button class="add-btn" onclick="addToCart(${item.id})">+</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (error) {
    console.error("❌ Erro ao carregar cardápio:", error);
    alert("⚠️ Erro ao carregar cardápio. Verifique o servidor Render.");
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

function renderCarrinho() {
  const container = document.getElementById("cart-items");
  const totalElem = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (!container || !totalElem || !checkoutBtn) return;

  container.innerHTML = "";
  let total = 0;

  carrinho.forEach(item => {
    total += item.price * item.qtd;
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <span>${item.name}</span>
      <div>
        <button onclick="removeFromCart(${item.id})">-</button>
        <span>${item.qtd}</span>
        <button onclick="addToCart(${item.id})">+</button>
        <span>R$ ${(item.price * item.qtd).toFixed(2)}</span>
      </div>
    `;
    container.appendChild(div);
  });

  totalElem.textContent = `Total: R$ ${total.toFixed(2)}`;
  checkoutBtn.disabled = carrinho.length === 0;
}

// ===============================
// Enviar pedido via WhatsApp
// ===============================
function enviarPedido() {
  if (carrinho.length === 0) return;

  let mensagem = "🍔 *Pedido Artesanal Blend*%0A%0A";
  carrinho.forEach(item => {
    mensagem += `• ${item.name} (x${item.qtd}) - R$ ${(item.price * item.qtd).toFixed(2)}%0A`;
  });

  const total = carrinho.reduce((acc, p) => acc + p.price * p.qtd, 0);
  mensagem += `%0A💰 *Total:* R$ ${total.toFixed(2)}%0A`;
  mensagem += `%0A📍 Enviar para: *Artesanal Blend*`;

  const numero = "5531992128891"; // seu WhatsApp
  const url = `https://wa.me/${numero}?text=${mensagem}`;
  window.open(url, "_blank");
}

// ===============================
// Inicialização
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  carregarMenu();

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", enviarPedido);
});
