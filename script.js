let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
// CORRIGIDO: O objeto TAXAS foi atualizado para refletir o seu HTML
const TAXAS = {
    "Jardim Canadá": 5.00,
    "Vila da Serra": 10.00,
    "Outras Regiões": 15.00,
    "none": 0.00 // Retirada / Sem entrega
};

// NOVO: Função para escapar strings para uso seguro no HTML onclick
function escaparStringHTML(str) {
    if (typeof str !== 'string') return '';
    // Escapa aspas simples e duplas para uso seguro dentro do atributo onclick
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Carregar cardápio da API
async function carregarCardapio() {
    try {
        const response = await fetch('/api/cardapio');
        
        if (!response.ok) {
            // Se o status não for 200 (OK), tenta o fallback local
            throw new Error(`Erro ao buscar cardápio da API: ${response.status}`);
        }
        
        const cardapio = await response.json();
        
        // Popular as categorias mantendo a mesma estrutura
        Object.keys(cardapio).forEach(categoria => {
            const container = document.getElementById(`cat-${categoria}`); 
            
            if (container) {
                container.innerHTML = cardapio[categoria].map(produto => {
                    const precoNumerico = produto.preco || 0;
                    const precoFormatado = precoNumerico.toFixed(2);
                    const imagemUrl = produto.imagem || '';
                    const nomeEscapado = escaparStringHTML(produto.nome); 

                    // ESTRUTURA PARA GRADE DE 2/3 COLUNAS
                    return `
                        <div class="menu-item" onclick="openItemModal('${produto.nome}', '${produto.descricao}', ${precoNumerico})">
                            ${imagemUrl ? `<img src="${imagemUrl}" alt="${produto.nome}" />` : ''}
                            
                            <div class="menu-item-text">
                                
                                <div class="menu-item-header">
                                    <h3>${produto.nome}</h3>
                                    <span class="price">R$ ${precoFormatado}</span>
                                </div>
                                
                                <p>${produto.descricao || ''}</p>
                            </div>
                            
                            <div class="menu-item-footer">
                                <button class="btn-adicionar" 
                                        onclick="adicionarAoCarrinho('${categoria}', '${nomeEscapado}', ${precoNumerico}); event.stopPropagation();"> 
                                    ➕ Adicionar
                                </button> 
                            </div>
                        </div>
                    `;
                }).join('');
            }
        });
        
        renderCarrinho();
        // AVISO: Se o problema persistir, verifique a definição de 'openItemModal'
    } catch (error) {
        console.log('⚠️ Erro ao carregar cardápio da API. Tentando fallback local.', error);
        carregarCardapioLocal(); 
    }
}

// Fallback para o menu.json local
function carregarCardapioLocal() {
    fetch('menu.json')
        .then(response => {
             if (!response.ok) {
                 throw new Error('menu.json não encontrado ou erro de leitura.');
             }
             return response.json();
        })
        .then(cardapio => {
            Object.keys(cardapio).forEach(categoria => {
                const container = document.getElementById(`cat-${categoria}`);
                if (container) {
                    container.innerHTML = cardapio[categoria].map(produto => {
                        const precoNumerico = produto.preco || 0;
                        const precoFormatado = precoNumerico.toFixed(2);
                        const imagemUrl = produto.imagem || '';
                        const nomeEscapado = escaparStringHTML(produto.nome); 

                        // ESTRUTURA PARA GRADE DE 2/3 COLUNAS
                        return `
                            <div class="menu-item" onclick="openItemModal('${produto.nome}', '${produto.descricao}', ${precoNumerico})">
                                ${imagemUrl ? `<img src="${imagemUrl}" alt="${produto.nome}" />` : ''}
                                
                                <div class="menu-item-text">
                                    
                                    <div class="menu-item-header">
                                        <h3>${produto.nome}</h3>
                                        <span class="price">R$ ${precoFormatado}</span>
                                    </div>
                                    
                                    <p>${produto.descricao || ''}</p>
                                </div>
                                
                                <div class="menu-item-footer">
                                    <button class="btn-adicionar" 
                                            onclick="adicionarAoCarrinho('${categoria}', '${nomeEscapado}', ${precoNumerico}); event.stopPropagation();"> 
                                        ➕ Adicionar
                                    </button> 
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            });
            renderCarrinho();
        })
        .catch(err => console.error('❌ Erro fatal ao carregar cardápio local ou API:', err));
}

// ===== FUNÇÕES DO CARRINHO =====
function adicionarAoCarrinho(categoria, nome, preco) {
    // CORREÇÃO: Usa o nome 'customerName' do seu HTML
    const clienteNome = document.getElementById('customerName')?.value;
    if (!clienteNome) {
        // Se o modal existisse, abriria ele aqui. Por enquanto, só um feedback.
        alert('Por favor, preencha seu nome antes de adicionar itens.');
        document.getElementById('customerName')?.focus();
        return;
    }
    
    // Simplesmente adiciona o item
    const itemExistente = carrinho.find(item => item.nome === nome);
    
    if (itemExistente) {
        itemExistente.qtd++;
    } else {
        carrinho.push({ categoria, nome, preco: preco || 0, qtd: 1 });
    }
    
    salvarCarrinho();
    renderCarrinho();
    
    // Feedback visual
    const btn = event.target.closest('.menu-item');
    if (btn) {
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = 'scale(1)', 150);
    }
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    salvarCarrinho();
    renderCarrinho();
}

function alterarQuantidade(index, delta) {
    carrinho[index].qtd += delta;
    
    if (carrinho[index].qtd <= 0) {
        removerDoCarrinho(index);
    } else {
        salvarCarrinho();
        renderCarrinho();
    }
}

function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function renderCarrinho() {
    // CORREÇÃO: IDs corrigidos para refletir o index.html
    const cartItems = document.getElementById('cart-items');
    const subtotalDisplay = document.getElementById('subtotal');
    const feeDisplay = document.getElementById('fee');
    const totalDisplay = document.getElementById('total');
    const cartCount = document.getElementById('cartToggle'); // Botão flutuante
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItems) return;
    
    // 1. Contador do Carrinho Flutuante
    const totalItens = carrinho.reduce((acc, item) => acc + item.qtd, 0);
    if (cartCount) cartCount.setAttribute('data-count', totalItens);
    
    // 2. Itens do Carrinho
    cartItems.innerHTML = carrinho.map((item, index) => {
        const precoItem = (item.preco || 0).toFixed(2);
        const totalItem = ((item.preco || 0) * item.qtd).toFixed(2);

        return `
            <div class="cart-item">
                <div class="item-info">
                    <strong>${item.qtd}x ${item.nome}</strong>
                    <span>R$ ${totalItem}</span>
                </div>
                <div class="item-controls">
                    <button onclick="alterarQuantidade(${index}, -1)">−</button>
                    <button onclick="alterarQuantidade(${index}, 1)">+</button>
                    <button onclick="removerDoCarrinho(${index})" class="remove">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    if (carrinho.length === 0) {
        cartItems.innerHTML = '<div class="muted" style="text-align: center;">Carrinho vazio</div>';
    }
    
    // 3. Totais
    const subtotal = carrinho.reduce((acc, item) => acc + ((item.preco || 0) * item.qtd), 0);
    
    // CORREÇÃO: Pega o valor da taxa da opção selecionada no HTML
    const regionSelect = document.getElementById('region');
    const selectedOption = regionSelect ? regionSelect.options[regionSelect.selectedIndex] : null;
    const taxa = selectedOption ? parseFloat(selectedOption.getAttribute('data-fee')) || 0 : 0;
    
    const totalComTaxa = subtotal + taxa;
    
    if (subtotalDisplay) subtotalDisplay.textContent = `R$ ${subtotal.toFixed(2)}`;
    if (feeDisplay) feeDisplay.textContent = `R$ ${taxa.toFixed(2)}`;
    if (totalDisplay) totalDisplay.textContent = `R$ ${totalComTaxa.toFixed(2)}`;

    // 4. Botão de checkout
    if (checkoutBtn) {
        checkoutBtn.disabled = carrinho.length === 0;
    }
}

// ===== FUNÇÕES DE ENTREGA E PAGAMENTO =====
function atualizarTaxa() {
    renderCarrinho();
}

// Função para mostrar/esconder o carrinho no mobile
function toggleCart() {
    const cart = document.querySelector('.cart');
    const overlay = document.getElementById('overlay');
    cart.classList.toggle('show');
    overlay.style.display = cart.classList.contains('show') ? 'block' : 'none';
}

function finalizarPedido() {
    // CORREÇÃO: IDs corrigidos para refletir o index.html
    const clienteNome = document.getElementById('customerName').value;
    const clienteTelefone = document.getElementById('customerPhone').value;
    const clienteEndereco = document.getElementById('customerAddress').value;
    const clienteRegiaoSelect = document.getElementById('region');
    const clienteRegiao = clienteRegiaoSelect.options[clienteRegiaoSelect.selectedIndex].text;
    const pagamento = document.getElementById('customerPayment').value;
    const obsCliente = document.getElementById('customerObs').value;
    
    // Função de mensagem temporária (substitui o alert feio)
    const showMessage = (message, isError = true) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = isError ? 'custom-message error' : 'custom-message success';
        msgDiv.textContent = message;
        
        // Coloca a mensagem na topbar do carrinho
        const cartContent = document.querySelector('.cart'); 
        if (cartContent) cartContent.prepend(msgDiv);

        setTimeout(() => msgDiv.remove(), 4000);
    };

    if (!carrinho || carrinho.length === 0) {
        showMessage('Seu carrinho está vazio!', true);
        return;
    }

    if (!clienteNome || !clienteTelefone || !clienteEndereco || !pagamento) {
        showMessage('Por favor, preencha todos os campos obrigatórios!', true);
        return;
    }
    
    // Cálculo final dos valores
    const subtotal = carrinho.reduce((acc, item) => acc + ((item.preco || 0) * item.qtd), 0);
    
    const selectedOption = clienteRegiaoSelect.options[clienteRegiaoSelect.selectedIndex];
    const taxa = parseFloat(selectedOption.getAttribute('data-fee')) || 0;
    
    const total = subtotal + taxa;
    
    // Montar mensagem para WhatsApp
    let mensagem = `*NOVO PEDIDO - Artesanal Blend* 🍔\n\n`;
    mensagem += `*Cliente:* ${clienteNome}\n`;
    mensagem += `*Telefone:* ${clienteTelefone}\n`;
    mensagem += `*Endereço:* ${clienteEndereco} (${clienteRegiao})\n\n`;
    mensagem += `*ITENS DO PEDIDO:*\n`;
    
    carrinho.forEach(item => {
        mensagem += `• ${item.qtd}x ${item.nome} (R$ ${((item.preco || 0) * item.qtd).toFixed(2)})\n`;
    });
    
    mensagem += `\n*Subtotal:* R$ ${subtotal.toFixed(2)}\n`;
    mensagem += `*Taxa de entrega:* R$ ${taxa.toFixed(2)}\n`;
    mensagem += `*Total a pagar:* R$ ${total.toFixed(2)}\n\n`;
    mensagem += `*FORMA DE PAGAMENTO:* ${pagamento}\n`;
    
    // Verifica se precisa de troco
    if (pagamento.includes('Dinheiro')) {
        const troco = prompt('Você precisa de troco? Se sim, para quanto? Ex: 50.00');
        if (troco) {
             mensagem += `*Troco para:* R$ ${parseFloat(troco).toFixed(2)}\n`;
        }
    }
    
    if (obsCliente) {
        mensagem += `\n*OBSERVAÇÕES:* ${obsCliente}\n`;
    }
    
    mensagem += `\n_ Pedido gerado via sistema _`;
    
    // Enviar para WhatsApp
    const urlWhatsApp = `https://wa.me/5531992128891?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsApp, '_blank');
    
    // Salvar pedido no banco de dados (Opcional, se o backend estiver rodando)
    salvarPedidoNoBanco({
        cliente: clienteNome,
        telefone: clienteTelefone,
        endereco: clienteEndereco,
        regiao: clienteRegiao,
        taxaEntrega: taxa,
        itens: carrinho,
        total: total,
        formaPagamento: pagamento,
        observacao: obsCliente
    });
    
    // Limpar carrinho e fechar sidebar
    carrinho = [];
    salvarCarrinho();
    renderCarrinho();
    toggleCart();
    
    // Limpar formulário (mantém a região e taxa)
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerPayment').value = '';
    document.getElementById('customerObs').value = '';
}

async function salvarPedidoNoBanco(pedidoData) {
    try {
        await fetch('/api/orders', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedidoData)
        });
    } catch (error) {
        console.log('⚠️ Erro ao salvar pedido no servidor (pode estar offline):', error);
    }
}

// ===== INICIALIZAÇÃO E EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    carregarCardapio();
    renderCarrinho();
    
    // Event Listeners para o Carrinho
    document.getElementById('checkoutBtn')?.addEventListener('click', finalizarPedido);
    document.getElementById('region')?.addEventListener('change', atualizarTaxa);
    document.getElementById('cartToggle')?.addEventListener('click', toggleCart);
    document.getElementById('closeCartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('overlay')?.addEventListener('click', toggleCart);
});

// Exportar funções para o HTML
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.removerDoCarrinho = removerDoCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.atualizarTaxa = atualizarTaxa;
window.finalizarPedido = finalizarPedido;
window.toggleCart = toggleCart;
```eof

### 2. `style.css` (Corrigido para Grid 2x2 no Mobile)

Este arquivo contém a solução para o problema de corte no celular (removendo o padding redundante) e define o layout de grade compacto que você pediu. **Por favor, substitua todo o conteúdo do seu `style.css` por este código.**

```css:style.css
:root {
    --primary: #FF4500; /* Laranja/Vermelho */
    --secondary: #FF6347; /* Vermelho mais claro */
    --background: #1e1e1e; /* Fundo escuro */
    --card: #2e2e2e; /* Cor dos cards */
    --text: #ffffff;
    --gray: #b0b0b0;
    --dark-gray: #404040;
    --red: #FF4136;
    --radius: 8px;
}

body {
    font-family: Arial, sans-serif;
    background-color: var(--background);
    color: var(--text);
    margin: 0;
    padding: 0;
    line-height: 1.6;
    padding-bottom: 70px; /* Espaço para o botão flutuante */
}

/* Base Geral */
a { color: var(--primary); text-decoration: none; }
h1, h2, h3 { color: var(--text); margin: 0 0 10px 0; }
input, textarea, select {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid var(--dark-gray);
    border-radius: var(--radius);
    background-color: #404040;
    color: var(--text);
    box-sizing: border-box;
}

/* Botões Padrão */
.btn {
    padding: 10px 15px;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    font-weight: bold;
}

.btn.primary {
    background-color: var(--primary);
    color: var(--text);
}

.btn.primary:hover:not(:disabled) {
    background-color: var(--secondary);
}

.btn:disabled {
    background-color: var(--dark-gray);
    cursor: not-allowed;
    color: #888;
}

/* ===========================
    TOPBAR (Header)
=========================== */
.topbar {
    background: #000;
    padding: 15px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
    margin-bottom: 20px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
}

.brand h1 {
    font-size: 1.5rem;
    color: var(--primary);
}

.brand p {
    font-size: 0.8rem;
    color: var(--gray);
    margin: 0;
}

.logo {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--primary);
    box-shadow: 0 0 10px var(--primary);
}

.hours {
    font-size: 0.9rem;
    color: var(--gray);
    margin-top: 5px;
}

/* ===========================
    LAYOUT PRINCIPAL (Mobile)
=========================== */
.container {
    padding: 0 10px; /* Padding principal que controla as laterais */
}

/* ===========================
    FILTROS E HEADER DO MENU
=========================== */
.menu-top {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    padding: 0 5px;
}

.filters label {
    font-size: 0.9rem;
    color: var(--gray);
}

.filters select {
    width: auto;
    padding: 8px;
    margin-bottom: 0;
    font-size: 0.9rem;
    display: inline-block;
}

/* Categorias */
.category h3 {
    font-size: 1.2rem;
    padding: 10px 5px;
    border-bottom: 2px solid var(--primary);
    margin-bottom: 15px;
    margin-top: 20px;
}

/* ===========================
    ITENS DO CARDÁPIO (GRID DE 2 COLUNAS MOBILE)
=========================== */

/* Grid Principal: FORÇA 2 COLUNAS NO CELULAR */
.menu-grid {
    display: grid;
    grid-template-columns: 1fr 1fr; /* 2 COLUNAS FLUIDAS */
    gap: 15px;
    /* CORREÇÃO: Removido o padding: 0 5px; para evitar o corte na tela do celular */
}

.menu-item {
    background: var(--card);
    border-radius: var(--radius);
    padding: 0; 
    display: flex;
    flex-direction: column; /* Imagem, Texto e Botão em coluna */
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    height: 100%; 
    text-align: left;
}

/* 1. Imagem: Ocupa 100% da largura estreita do card */
.menu-item img {
    width: 100%;
    height: 100px; 
    object-fit: cover;
    border-radius: var(--radius) var(--radius) 0 0; 
}

/* 2. Container do Texto (Nome, Preço, Descrição) */
.menu-item-text {
    padding: 8px; 
    flex-grow: 1; 
}

/* Título e Preço Lado a Lado */
.menu-item-header {
    display: flex;
    justify-content: space-between; 
    align-items: flex-start;
    margin-bottom: 2px;
}

.menu-item h3 {
    font-size: 0.85rem; 
    margin: 0;
    line-height: 1.2;
    white-space: normal; 
    max-height: 2.4em; 
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
}

.menu-item-header .price {
    color: var(--red);
    font-weight: 800;
    font-size: 0.9rem; 
    margin-left: 6px;
    flex-shrink: 0;
}

/* Descrição: Limita a 2 linhas e garante altura mínima */
.menu-item p {
    font-size: 0.7rem;
    color: var(--gray);
    margin: 4px 0 6px 0;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.4em; 
}

/* 3. Rodapé: Contém APENAS o botão (largura total) */
.menu-item-footer {
    display: flex;
    width: 100%;
    padding: 8px; 
    justify-content: center;
    border-radius: 0 0 var(--radius) var(--radius);
    border-top: 1px solid var(--dark-gray); 
}

.btn-adicionar {
    width: 100%;
    font-size: 0.75rem; 
    padding: 6px 0; 
    line-height: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* ===========================
    AJUSTE PARA DESKTOP/TABLET (3 Colunas)
=========================== */
@media (min-width: 768px) {
    .menu-grid {
        grid-template-columns: 1fr 1fr 1fr; /* 3 COLUNAS no desktop */
        gap: 20px;
        padding: 0; 
    }
    
    .menu-item img {
        height: 140px; 
    }
    
    .menu-item-text {
        padding: 12px;
    }
    
    .menu-item h3 {
        font-size: 1rem; 
        max-height: none; 
    }
    
    .menu-item-header .price {
        font-size: 1.2rem; 
    }
    
    .menu-item p {
        font-size: 0.8rem;
        -webkit-line-clamp: 3; 
        min-height: 3.6em; 
    }
    
    .menu-item-footer {
        padding: 12px;
    }
    
    .btn-adicionar {
        font-size: 0.9rem;
        padding: 8px 0;
    }
}


/* ===========================
    CARRINHO E BOTÃO FLUTUANTE (Sem Alterações)
=========================== */

/* Botão Flutuante */
.floating-cart {
    position: fixed;
    bottom: 15px;
    right: 15px;
    width: 50px;
    height: 50px;
    background-color: var(--primary);
    color: var(--text);
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    z-index: 100;
    transition: transform 0.2s;
}

.floating-cart:hover {
    transform: scale(1.05);
}

.floating-cart::after {
    content: attr(data-count);
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: var(--red);
    color: var(--text);
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 0.7rem;
    font-weight: bold;
    line-height: 1;
    min-width: 10px;
    text-align: center;
}

/* Sidebar do Carrinho */
.cart {
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    max-width: 350px;
    height: 100%;
    background-color: var(--card);
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    box-shadow: -4px 0 10px rgba(0, 0, 0, 0.5);
    z-index: 200;
    padding: 20px;
    overflow-y: auto;
    box-sizing: border-box;
}

.cart.show {
    transform: translateX(0);
}

.cart h3 {
    border-bottom: 2px solid var(--primary);
    padding-bottom: 10px;
    margin-bottom: 20px;
}

.close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    border: none;
    color: var(--gray);
    font-size: 1.5rem;
    cursor: pointer;
}

.cart-items {
    margin-bottom: 20px;
}

.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px dashed var(--dark-gray);
    padding: 10px 0;
}

.item-info strong {
    display: block;
}

.item-controls button {
    background-color: var(--dark-gray);
    color: var(--text);
    border: none;
    width: 25px;
    height: 25px;
    border-radius: 4px;
    cursor: pointer;
    margin: 0 2px;
    font-weight: bold;
}

.item-controls .remove {
    background: none;
    color: var(--red);
    font-size: 1rem;
}

.cart-summary {
    margin-top: 20px;
}

.cart-summary .line {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 0.9rem;
    color: var(--gray);
}

.cart-summary .line.total {
    font-size: 1.1rem;
    font-weight: bold;
    color: var(--text);
    padding-top: 10px;
    border-top: 1px solid var(--dark-gray);
    margin-top: 10px;
}

.cart-summary .input-group {
    margin: 20px 0;
}

.cart-summary .small {
    display: block;
    text-align: center;
    margin-top: 10px;
}

/* Overlay (Fundo escuro quando o carrinho está aberto) */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 150;
    display: none;
}

.cart.show + .overlay {
    display: block;
}

/* Mensagem Customizada (Substitui o alert) */
.custom-message {
    background-color: var(--red);
    color: var(--text);
    padding: 10px;
    border-radius: var(--radius);
    text-align: center;
    margin-bottom: 15px;
    animation: fadeInOut 3s forwards;
}

.custom-message.success {
    background-color: var(--primary);
}

@keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-20px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
}

/* ===========================
    RESPONSIVIDADE (Desktop - Mais de 768px)
=========================== */
@media (min-width: 768px) {
    /* Main Layout */
    .container {
        display: flex;
        gap: 30px;
        padding: 0 40px;
    }

    .menu-section {
        flex-grow: 1;
        width: 100%;
    }

    /* Sidebar do Carrinho */
    .cart {
        position: static; /* Volta a ser estático na coluna lateral */
        transform: translateX(0);
        width: 350px;
        max-width: none;
        height: auto;
        padding: 0;
        background-color: transparent;
        box-shadow: none;
    }
    
    .floating-cart {
        display: none; /* Esconde o botão flutuante no desktop */
    }
    
    .overlay {
        display: none !important; /* Esconde overlay */
    }
    
    .cart h3 {
        margin-top: 0;
    }
}

/* ===========================
    FOOTER
=========================== */
.site-footer {
    text-align: center;
    padding: 20px;
    font-size: 0.8rem;
    color: var(--gray);
    border-top: 1px solid var(--dark-gray);
    margin-top: 30px;
}
```eof

