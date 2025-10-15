// ==============================
//  Artesanal Blend - Cardápio Online
//  script.js — versão com integração Node.js
// ==============================

let menuData = [];
let cart = [];

// ========== Carregar o cardápio ==========
async function carregarMenu() {
  try {
    const resp = await fetch("menu.json");
    menuData = await resp.json();
    renderMenu(menuData);
  } catch (err) {
    document.getElementById("menu").innerHTML = "<p>Erro ao carregar cardápio.</p>";
    console.error(err);
  }
}

// ========== Renderizar o cardápio ==========
function renderMenu(menu) {
  const container = document.getElementById("menu");
  container.innerHTML = "";

  menu.forEach(item => {
    const card = document.createElement("div");
    card.classList.add("menu-item");
    card.innerHTML = `
      <img src="${item.imgUrl}" alt="${item.name}">
      <div class="info">
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
        <div class="bottom">
          <span class="price">R$ ${item.price.toFixed(2)}</span>
          <button class="add-btn" onclick="addToCart(${item.id})">+</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ========== Carrinho ==========
function addToCart(id) {
  const item = menuData.find(p => p.id === id);
  if (!item) return;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qtd++;
  else cart.push({ ...item, qtd: 1 });
  updateCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCart();
}

function updateCart() {
  const container = document.getElementById("cart-items");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const subtotalElem = document.getElementById("subtotal");

  container.innerHTML = "";
  let subtotal = 0;

  cart.forEach(item => {
    subtotal += item.qtd * item.price;
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.qtd}x ${item.name} - R$ ${(item.qtd * item.price).toFixed(2)}
      <button class="remove" onclick="removeFromCart(${item.id})">x</button>
    `;
    container.appendChild(li);
  });

  subtotalElem.textContent = subtotal.toFixed(2);
  checkoutBtn.disabled = cart.length === 0;
}

// ========== Enviar Pedido ==========
async function enviarPedidoServidor(pedido) {
  try {
    await fetch("http://localhost:3000/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido),
    });
    console.log("✅ Pedido enviado ao servidor com sucesso!");
  } catch (err) {
    console.error("⚠️ Erro ao enviar pedido:", err);
  }
}

document.getElementById("checkoutBtn").addEventListener("click", async () => {
  if (cart.length === 0) return;

  const region = document.getElementById("region")?.value || "Cliente Online";
  const total = cart.reduce((sum, item) => sum + item.qtd * item.price, 0);

  const pedido = {
    itens: cart.map(item => ({
      nome: item.name,
      quantidade: item.qtd,
      preco: item.price,
    })),
    total,
    cliente: region,
  };

  // Envia pedido para servidor
  await enviarPedidoServidor(pedido);

  // Envia mensagem para WhatsApp
  const msg = encodeURIComponent(
    `*Artesanal Blend - Novo Pedido*\n\n${pedido.itens
      .map(i => `${i.quantidade}x ${i.nome} - R$ ${(i.preco * i.quantidade).toFixed(2)}`)
      .join("\n")}\n\n*Total:* R$ ${total.toFixed(2)}\n*Endereço:* ${region}`
  );
  window.open(`https://wa.me/5531992128891?text=${msg}`, "_blank");

  // Limpa carrinho
  cart = [];
  updateCart();
});

// Iniciar
carregarMenu();
