// ==============================
//  Artesanal Blend - Cardápio Online
// ==============================

let menuData = [];
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

// ========== Carregar o cardápio ==========
async function carregarMenu() {
  try {
    console.log("🔄 Carregando cardápio...");
    
    // Dados locais em vez de API
    const menuLocal = [
      {
        "id": 1,
        "name": "Hambúrguer Artesanal",
        "desc": "Pão brioche, blend 180g, queijo, alface, tomate",
        "price": 28.90,
        "cat": "Hambúrgueres",
        "imgUrl": ""
      },
      {
        "id": 2,
        "name": "Cheese Bacon",
        "desc": "Blend 180g, queijo cheddar, bacon crocante",
        "price": 32.90,
        "cat": "Hambúrgueres",
        "imgUrl": ""
      },
      {
        "id": 3,
        "name": "Combo Classic",
        "desc": "Hambúrguer + Batata + Refri 350ml",
        "price": 45.90,
        "cat": "Combos",
        "imgUrl": ""
      },
      {
        "id": 4,
        "name": "Combo Família",
        "desc": "2 Hambúrgueres + 2 Batatas + 2 Refris",
        "price": 79.90,
        "cat": "Combos",
        "imgUrl": ""
      },
      {
        "id": 5,
        "name": "Batata Frita",
        "desc": "Porção 200g",
        "price": 15.90,
        "cat": "Acompanhamentos",
        "imgUrl": ""
      },
      {
        "id": 6,
        "name": "Onion Rings",
        "desc": "Porção 150g",
        "price": 18.90,
        "cat": "Acompanhamentos",
        "imgUrl": ""
      },
      {
        "id": 7,
        "name": "Queijo Extra",
        "desc": "Fatia adicional",
        "price": 4.90,
        "cat": "Adicionais",
        "imgUrl": ""
      },
      {
        "id": 8,
        "name": "Bacon Extra",
        "desc": "Porção 50g",
        "price": 6.90,
        "cat": "Adicionais",
        "imgUrl": ""
      },
      {
        "id": 9,
        "name": "Refrigerante",
        "desc": "Lata 350ml",
        "price": 8.90,
        "cat": "Bebidas",
        "imgUrl": ""
      },
      {
        "id": 10,
        "name": "Suco Natural",
        "desc": "Copo 500ml",
        "price": 12.90,
        "cat": "Bebidas",
        "imgUrl": ""
      }
    ];
    
    menuData = menuLocal;
    console.log("✅ Cardápio carregado localmente:", menuData);
    renderMenu(menuData);
    
  } catch (err) {
    console.error("❌ Erro ao carregar cardápio:", err);
    document.querySelector("main").innerHTML = `
      <div style="text-align: center; padding: 40px; color: #fff;">
        <h3>⚠️ Erro ao carregar cardápio</h3>
        <p>Tente recarregar a página</p>
        <button onclick="carregarMenu()" style="padding: 10px 20px; background: #f56f76; color: white; border: none; border-radius: 5px; cursor: pointer;">
          🔄 Tentar Novamente
        </button>
      </div>
    `;
  }
}

// ========== Renderizar o cardápio ==========
function renderMenu(menu) {
  console.log("🎨 Renderizando cardápio...");
  
  // Limpar containers por categoria
  const categorias = ['Hambúrgueres', 'Combos', 'Acompanhamentos', 'Adicionais', 'Bebidas'];
  categorias.forEach(cat => {
    const container = document.getElementById(`cat-${cat}`);
    if (container) {
      container.innerHTML = '';
    }
  });

  // Agrupar por categoria
  const menuPorCategoria = {};
  categorias.forEach(cat => {
    menuPorCategoria[cat] = menu.filter(item => item.cat === cat);
  });

  // Renderizar cada categoria
  categorias.forEach(categoria => {
    const container = document.getElementById(`cat-${categoria}`);
    if (!container) return;

    const itens = menuPorCategoria[categoria];
    
    if (itens.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #ccc; grid-column: 1 / -1;">
          Nenhum produto em ${categoria}
        </div>
      `;
      return;
    }

    itens.forEach(item => {
      const card = document.createElement("div");
      card.classList.add("menu-item");
      
      // CORREÇÃO AQUI: Link correto do placeholder
      const imagemUrl = item.imgUrl && item.imgUrl.trim() !== '' 
        ? item.imgUrl 
        : 'https://via.placeholder.com/300x200/FF6B6B/ffffff?text=Artesanal+Blend';
      
      card.innerHTML = `
        <img src="${imagemUrl}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300x200/FF6B6B/ffffff?text=Artesanal+Blend'">
        <div class="item-info">
          <h4>${item.name}</h4>
          <p>${item.desc || 'Delicioso produto artesanal'}</p>
          <div class="item-footer">
            <span class="price">R$ ${item.price.toFixed(2)}</span>
            <button class="add-btn" onclick="addToCart(${item.id})">+</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  });
}

// ========== Carrinho ==========
function addToCart(id) {
  const item = menuData.find(p => p.id === id);
  if (!item) {
    console.error("Item não encontrado:", id);
    return;
  }
  
  const existing = carrinho.find(c => c.id === id);
  if (existing) {
    existing.qtd++;
  } else {
    carrinho.push({ ...item, qtd: 1 });
  }
  
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  updateCart();
  showCart();
}

function removeFromCart(id) {
  carrinho = carrinho.filter(item => item.id !== id);
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  updateCart();
}

function updateCart() {
  const container = document.getElementById("cart-items");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const totalElem = document.getElementById("cart-total");

  if (!container) return;

  container.innerHTML = "";
  let subtotal = 0;

  carrinho.forEach(item => {
    subtotal += item.qtd * item.price;
    const div = document.createElement("div");
    div.className = "cart-line";
    div.innerHTML = `
      <div>
        <strong>${item.qtd}x ${item.name}</strong>
        <br>
        <span>R$ ${(item.qtd * item.price).toFixed(2)}</span>
      </div>
      <button class="remove-btn" onclick="removeFromCart(${item.id})">❌</button>
    `;
    container.appendChild(div);
  });

  const total = subtotal;

  if (totalElem) totalElem.textContent = `Total: R$ ${total.toFixed(2)}`;
  
  if (checkoutBtn) {
    checkoutBtn.disabled = carrinho.length === 0;
  }

  // Atualizar contador
  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    cartCount.textContent = carrinho.reduce((acc, item) => acc + item.qtd, 0);
  }
}

// ========== Controle do Carrinho ==========
function showCart() {
  const cart = document.getElementById("cart");
  if (cart) {
    cart.classList.add("show");
    updateCart();
  }
}

function hideCart() {
  const cart = document.getElementById("cart");
  if (cart) {
    cart.classList.remove("show");
  }
}

// ========== Enviar Pedido ==========
function enviarPedidoWhatsApp() {
  if (carrinho.length === 0) return;

  const regionSelect = document.getElementById("clienteRegiao");
  const region = regionSelect ? regionSelect.value : "Retirada";
  const taxa = regionSelect ? parseFloat(regionSelect.selectedOptions[0].textContent.match(/R\$\s*([0-9,]+)/)?.[1].replace(',', '.')) || 0 : 0;
  
  const total = carrinho.reduce((sum, item) => sum + item.qtd * item.price, 0) + taxa;

  // Montar mensagem WhatsApp
  let msg = `*ARTESANAL BLEND - NOVO PEDIDO*%0A%0A`;
  
  carrinho.forEach(item => {
    msg += `▪️ ${item.qtd}x ${item.name} - R$ ${(item.qtd * item.price).toFixed(2)}%0A`;
  });
  
  if (taxa > 0) {
    msg += `%0A*Taxa de entrega:* R$ ${taxa.toFixed(2)}%0A`;
  }
  
  msg += `*Total:* R$ ${total.toFixed(2)}%0A%0A`;
  msg += `*Região:* ${region}%0A`;
  
  // Informações do cliente
  const nome = document.getElementById("clienteNome")?.value || "Não informado";
  const telefone = document.getElementById("clienteTelefone")?.value || "Não informado";
  const endereco = document.getElementById("clienteEndereco")?.value || "Não informado";
  const pagamento = document.getElementById("pagamento")?.value || "Não informado";
  const observacoes = document.getElementById("obsCliente")?.value || "Nenhuma";
  
  msg += `*Nome:* ${nome}%0A`;
  msg += `*Telefone:* ${telefone}%0A`;
  msg += `*Endereço:* ${endereco}%0A`;
  msg += `*Pagamento:* ${pagamento}%0A`;
  
  if (pagamento === "Dinheiro") {
    const troco = document.getElementById("troco")?.value || "Não informado";
    msg += `*Troco para:* R$ ${troco}%0A`;
  }
  
  msg += `*Observações:* ${observacoes}%0A%0A`;
  msg += `_Pedido gerado automaticamente via site_`;

  // Abrir WhatsApp
  window.open(`https://wa.me/5531992128891?text=${msg}`, "_blank");

  // Limpar carrinho
  carrinho = [];
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  updateCart();
  hideCart();
  
  alert("Pedido enviado para o WhatsApp! 🎉");
}

// ========== Event Listeners ==========
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Iniciando cardápio...");
  carregarMenu();
  updateCart();

  // Carrinho
  const openCartBtn = document.getElementById("openCartBtn");
  const closeCartBtn = document.getElementById("closeCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (openCartBtn) {
    openCartBtn.addEventListener("click", showCart);
  }

  if (closeCartBtn) {
    closeCartBtn.addEventListener("click", hideCart);
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", enviarPedidoWhatsApp);
  }

  // Taxa de entrega
  const regionSelect = document.getElementById("clienteRegiao");
  if (regionSelect) {
    regionSelect.addEventListener("change", updateCart);
  }
});

// ========== Funções auxiliares ==========
function mostrarTroco() {
  const pagamento = document.getElementById("pagamento");
  const campoTroco = document.getElementById("campoTroco");
  if (pagamento && campoTroco) {
    campoTroco.style.display = pagamento.value === "Dinheiro" ? "block" : "none";
  }
}

function atualizarTaxa() {
  updateCart();
}
