/* ========== DADOS DO CARDÁPIO ========== */
// Mantenha os seus dados do cardápio aqui
const menuItems = [
  // HAMBURGUERES
  { id:1, name:"CLASSICO BLEND", price:24.50, desc:"Pão brioche, blend 120g, cheddar, picles, molho especial", cat:"Hambúrgueres" },
  { id:2, name:"SALADA BLEND", price:23.50, desc:"Pão brioche, blend 120g, cheddar, tomate, alface americana, molho especial", cat:"Hambúrgueres" },
  { id:3, name:"BACON BLEND 180g", price:29.50, desc:"Pão brioche, blend 180g, cheddar, bacon, molho especial", cat:"Hambúrgueres" },
  { id:4, name:"BACON BLEND 120g", price:27.00, desc:"Pão brioche, blend 120g, cheddar, bacon, molho especial", cat:"Hambúrgueres" },
  { id:5, name:"SMACH BLEND 180g", price:34.50, desc:"Pão brioche, blend 180g, cheddar, bacon, 1 ovo, cebola caramelizada, molho especial", cat:"Hambúrgueres" },
  { id:6, name:"SMACH BLEND 120g", price:32.50, desc:"Pão brioche, blend 120g, cheddar, bacon, 1 ovo, cebola caramelizada, molho especial", cat:"Hambúrgueres" },

  // ACOMPANHAMENTOS
  { id:7, name:"BATATA FRITA 200g", price:12.50, desc:"Batata frita crocante 200g", cat:"Acompanhamentos" },
  { id:8, name:"BATATA FRITA 100g", price:7.80, desc:"Batata frita crocante 100g", cat:"Acompanhamentos" },
  
  // COMBOS
  { id:9, name:"BACON BLEND 1 (Combo)", price:38.25, desc:"1 Bacon Blend, 1 Batata 100g, 1 Refrigerante 350ml", cat:"Combos" },
  { id:10, name:"SMACH BLEND 1 (Combo)", price:42.50, desc:"1 Smach Blend, 1 Batata 100g, 1 Refrigerante 350ml", cat:"Combos" },
  
  // ADICIONAIS
  { id:19, name:"CHEDDAR (Adicional)", price:3.00, desc:"Adicional de cheddar", cat:"Adicionais" },
  { id:20, name:"BACON (Adicional)", price:4.00, desc:"Adicional de bacon", cat:"Adicionais" },
  
  // BEBIDAS
  { id:25, name:"REFRIGERANTE 350ml", price:6.00, desc:"Coca-Cola / Coca-Cola Zero / Fanta", cat:"Bebidas" },
  { id:26, name:"SUCO LATA", price:5.50, desc:"Suco de uva / laranja", cat:"Bebidas" }
];

/* Variáveis e Utilitários */
let cart = {};
const nameInput = document.getElementById('customerName');
const phoneInput = document.getElementById('customerPhone');
const addrInput = document.getElementById('customerAddress');
const paymentInput = document.getElementById('customerPayment');
const obsInput = document.getElementById('customerObs'); // Observações Gerais
const regionSel = document.getElementById('region');

// Variáveis de Controle do Carrinho
const cartToggleBtn = document.getElementById('cartToggle');
const cartEl = document.querySelector('.cart');
const overlayEl = document.getElementById('overlay');
const closeCartBtn = document.getElementById('closeCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');

// Variáveis de Controle do Modal de Personalização
const itemModal = document.getElementById('itemModal');
const modalQtySpan = document.getElementById('modalQty');
const modalItemName = document.getElementById('modalItemName');
const modalItemDesc = document.getElementById('modalItemDesc');
const modalItemPrice = document.getElementById('modalItemPrice');
const itemObsTextarea = document.getElementById('itemObs');
const addToCartModalBtn = document.getElementById('addToCartModalBtn');

let currentItem = null; // Armazena o item que está sendo personalizado
let modalQty = 1; // Quantidade inicial no modal

const money = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


/* ========== LÓGICA DO MENU E MODAL (Opcionais) ========== */

function renderMenu() {
  const categories = menuItems.reduce((acc, item) => {
    acc[item.cat] = acc[item.cat] || [];
    acc[item.cat].push(item);
    return acc;
  }, {});

  Object.keys(categories).forEach(catName => {
    const container = document.getElementById(`cat-${catName}`);
    if (container) {
      container.innerHTML = categories[catName].map(item => `
        <div class="menu-item" data-id="${item.id}" onclick="openItemModal(${item.id})">
          <div class="text">
            <h4>${item.name}</h4>
            <p>${item.desc}</p>
          </div>
          <div class="actions">
            <span class="price">${money(item.price)}</span>
            <button class="btn" style="pointer-events: none;">Ver opções</button> 
          </div>
        </div>
      `).join('');
    }
  });
}

function closeItemModal() {
    itemModal.style.display = 'none';
    overlayEl.classList.remove('active');
    currentItem = null; // Limpa o item atual
}

function openItemModal(itemId) {
    currentItem = menuItems.find(m => m.id == itemId);

    if (!currentItem) return;

    // Preenche o modal
    modalItemName.textContent = currentItem.name;
    modalItemDesc.textContent = currentItem.desc;
    modalItemPrice.textContent = money(currentItem.price);
    itemObsTextarea.value = ''; // Limpa observações anteriores
    modalQty = 1;
    modalQtySpan.textContent = modalQty;
    
    // Abre o modal
    itemModal.style.display = 'block';
    overlayEl.classList.add('active');

    // Fecha o carrinho, se estiver aberto (para mobile)
    toggleCart(false);
}


/* ========== LÓGICA DO CARRINHO ========== */

function renderCart() {
  const cartItemsEl = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('subtotal');
  const feeEl = document.getElementById('fee');
  const totalEl = document.getElementById('total');
  
  let subtotal = 0;
  const cartItemKeys = Object.keys(cart);

  if (cartItemKeys.length === 0) {
    cartItemsEl.innerHTML = '<div class="empty-cart-message">Carrinho vazio</div>';
    checkoutBtn.disabled = true;
    cartToggleBtn.setAttribute('data-count', 0);
  } else {
    checkoutBtn.disabled = false;
    // Contador para o botão flutuante
    cartToggleBtn.setAttribute('data-count', cartItemKeys.reduce((sum, key) => sum + cart[key], 0));

    cartItemsEl.innerHTML = cartItemKeys.map(key => {
      // Separa o ID do item da observação (ex: "1_Sem picles")
      const [itemId, obsText] = key.split('_'); 
      const item = menuItems.find(m => m.id == itemId);
      
      const qty = cart[key];
      const sub = item.price * qty;
      subtotal += sub;
      
      // Monta a exibição da observação
      const obsDisplay = obsText && obsText.trim() ? `<p class="item-obs-text">Obs: ${obsText.trim()}</p>` : '';

      return `
        <div class="cart-item">
          <div class="qty-control">
            <button data-id="${key}" data-action="dec">-</button>
            <span>${qty}</span>
            <button data-id="${key}" data-action="add">+</button>
          </div>
          <div class="details">
            <p class="name">${item.name}</p>
            ${obsDisplay}
            <p class="price-line">${money(item.price)} x ${qty} = <strong>${money(sub)}</strong></p>
          </div>
          <button class="remove-btn" data-id="${key}" data-action="rem">✕</button>
        </div>
      `;
    }).join('');
  }

  // Taxa de entrega
  const selectedOption = regionSel.options[regionSel.selectedIndex];
  const fee = parseFloat(selectedOption.getAttribute('data-fee')) || 0;
  
  const total = subtotal + fee;

  subtotalEl.textContent = money(subtotal);
  feeEl.textContent = money(fee);
  totalEl.textContent = money(total);
  // Atualiza o valor no botão flutuante (ícone)
  cartToggleBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> ${money(total)}`;
}

/**
 * Função para alternar o carrinho no modo mobile (ESSENCIAL)
 */
function toggleCart(open) {
  if(window.innerWidth > 1100) return; // Não faz nada no desktop

  if(open) {
    cartEl.classList.add('open');
    overlayEl.classList.add('active');
  } else {
    cartEl.classList.remove('open');
    overlayEl.classList.remove('active');
  }
}

/* ========== EVENT LISTENERS ========== */

// Listener de cliques gerais (Adicionar/Remover no carrinho)
document.addEventListener('click', e => {
  const target = e.target.closest('[data-id][data-action]');
  if (target) {
    const id = target.getAttribute('data-id'); 
    const act = target.getAttribute('data-action');
    
    if (act === 'add') {
      cart[id] = (cart[id] || 0) + 1;
    } 
    else if (act === 'dec') {
      cart[id] = (cart[id] || 0) - 1;
      if (cart[id] <= 0) {
        delete cart[id];
      }
    }
    else if(act === 'rem') {
      delete cart[id];
    }
    renderCart();
  }
});

/* Mudança de região recalcula */
regionSel.addEventListener('change', renderCart);


// ===============================================
// LÓGICA DE CONTROLE DO MODAL
// ===============================================

// Controle de Quantidade no Modal
document.getElementById('addModalQty').addEventListener('click', () => {
    modalQty++;
    modalQtySpan.textContent = modalQty;
});
document.getElementById('decModalQty').addEventListener('click', () => {
    if (modalQty > 1) {
        modalQty--;
        modalQtySpan.textContent = modalQty;
    }
});

// Adicionar ao Carrinho do Modal
addToCartModalBtn.addEventListener('click', () => {
    if (!currentItem || modalQty <= 0) return;

    const obs = itemObsTextarea.value.trim().replace(/_/g, ' '); // Evita quebra na chave
    // Chave única: ID_OBSERVACAO
    const itemKey = `${currentItem.id}_${obs || 'SemObs'}`; 
    
    // Adiciona a quantidade selecionada ao carrinho
    cart[itemKey] = (cart[itemKey] || 0) + modalQty;

    // Renderiza e fecha
    renderCart();
    closeItemModal();
});


// ===============================================
// LÓGICA DE ABRIR/FECHAR O CARRINHO FLUTUANTE
// ===============================================

// Eventos de clique para abrir/fechar o carrinho mobile
cartToggleBtn.addEventListener('click', () => {
  const isOpen = cartEl.classList.contains('open');
  toggleCart(!isOpen);
});

overlayEl.addEventListener('click', () => {
  toggleCart(false); 
  closeItemModal(); // Fecha o modal se o overlay for clicado
});

// O botão de fechar (X) dentro do carrinho:
closeCartBtn.addEventListener('click', () => {
  toggleCart(false);
});


/* checkout -> whatsapp */
const WHATSAPP_NUMBER = '5531992128891';

checkoutBtn.addEventListener('click', () => {
  if(Object.keys(cart).length === 0) return alert('Carrinho vazio.');

  const customerName = nameInput.value.trim();
  const customerPhone = phoneInput.value.trim();
  const customerAddress = addrInput.value.trim();
  const customerPayment = paymentInput.value.trim();
  const customerObs = obsInput.value.trim() || 'Nenhuma.'; // Observações gerais

  if (!customerName || !customerPhone || !customerPayment) {
    alert('Por favor, preencha nome, telefone e método de pagamento.');
    return;
  }
  
  const selectedOption = regionSel.options[regionSel.selectedIndex];
  const selectedOptionText = selectedOption.text;
  const isDelivery = regionSel.value !== 'none';
  const fee = parseFloat(selectedOption.getAttribute('data-fee')) || 0;

  if (isDelivery && !customerAddress) {
    alert('Por favor, preencha o endereço completo para entrega.');
    return;
  }

  // Monta as linhas do pedido (incluindo observações específicas)
  let subtotal = 0;
  const itemsLines = Object.keys(cart).map(key => {
    const [itemId, obsTextEncoded] = key.split('_'); 
    const item = menuItems.find(m => m.id==itemId);
    const qty = cart[key];
    const sub = item.price * qty;
    subtotal += sub;
    
    let line = `${qty}x ${item.name}`;

    // Adiciona a observação específica do item se existir
    if (obsTextEncoded && obsTextEncoded !== 'SemObs') {
      line += `\n    (Obs: ${obsTextEncoded.trim()})`;
    }
    line += ` — ${money(sub)}`;
    return line;
  });
  
  const totalGeral = subtotal + fee;

  const lines = [];
  lines.push(`🧾 *NOVO PEDIDO - Artesanal Blend* 🎯`);
  lines.push('');
  lines.push(`✅ *DADOS DO CLIENTE:*`);
  lines.push(`Nome: ${customerName}`);
  lines.push(`Telefone: ${customerPhone}`);
  
  lines.push(`Opção de Entrega: ${selectedOptionText}`); 
  
  if (isDelivery) {
    lines.push(`Endereço: ${customerAddress}`);
  } else {
    lines.push(`Local de Retirada: Rua Coniston, 380 B2`);
  }
  
  lines.push(`Pagamento: ${customerPayment}`);
  lines.push(`Obs. Gerais: ${customerObs}`); 
  lines.push('');
  lines.push(`📦 *ITENS DO PEDIDO:*`);
  lines.push(itemsLines.join('\n'));
  lines.push('');
  
  lines.push(`🛵 *TAXA DE ENTREGA:* ${money(fee)}`); 
  lines.push(`💰 *TOTAL GERAL:* ${money(totalGeral)}`);

  const text = encodeURIComponent(lines.join('\n'));
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  window.open(url,'_blank');
});


/* ========== INICIALIZAÇÃO ========== */
renderMenu();
renderCart();
