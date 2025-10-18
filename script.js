let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
const TAXAS = {
    "Jardim Canadá": 5.00,
    "Vila da Serra": 10.00,
    "Outras Regiões": 15.00,
    "none": 0.00 
};

function escaparStringHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Carregar cardápio da API
async function carregarCardapio() {
    try {
        const response = await fetch('/api/cardapio');
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar cardápio da API: ${response.status}`);
        }
        
        const cardapio = await response.json();
        
        Object.keys(cardapio).forEach(categoria => {
            const container = document.getElementById(`cat-${categoria}`); 
            
            if (container) {
                container.innerHTML = cardapio[categoria].map(produto => {
                    const precoNumerico = produto.preco || 0;
                    const precoFormatado = precoNumerico.toFixed(2);
                    const imagemUrl = produto.imagem || '';
                    const nomeEscapado = escaparStringHTML(produto.nome); 

                    return `
                        <div class="menu-item">
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

                        return `
                            <div class="menu-item">
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
    const itemExistente = carrinho.find(item => item.nome === nome);
    
    if (itemExistente) {
        itemExistente.qtd++;
    } else {
        carrinho.push({ categoria, nome, preco: preco || 0, qtd: 1 });
    }
    
    salvarCarrinho();
    renderCarrinho();
    
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
    const cartItems = document.getElementById('cart-items');
    const totalDisplay = document.getElementById('cart-total');
    const cartCount = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItems) return;cartItems.

     cartItems.setAttribute('data-item-count', carrinho.length);
        
    const totalItens = carrinho.reduce((acc, item) => acc + item.qtd, 0);
    if (cartCount) cartCount.textContent = totalItens;
    
    cartItems.innerHTML = carrinho.map((item, index) => {
        const totalItem = ((item.preco || 0) * item.qtd).toFixed(2);

        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-nome">${item.qtd}x ${item.nome}</div>
                    <div class="cart-item-preco">R$ ${totalItem}</div>
                </div>
                <div class="cart-item-controles">
                    <button onclick="alterarQuantidade(${index}, -1)">−</button>
                    <span class="cart-item-quantidade">${item.qtd}</span>
                    <button onclick="alterarQuantidade(${index}, 1)">+</button>
                    <button onclick="removerDoCarrinho(${index})">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    if (carrinho.length === 0) {
        cartItems.innerHTML = '<div class="muted" style="text-align: center;">Carrinho vazio</div>';
    }
    
    const subtotal = carrinho.reduce((acc, item) => acc + ((item.preco || 0) * item.qtd), 0);
    
    const regionSelect = document.getElementById('clienteRegiao');
    const selectedOption = regionSelect ? regionSelect.options[regionSelect.selectedIndex] : null;
    
    let taxa = 0;
    if (selectedOption) {
        const optionText = selectedOption.text;
        if (optionText.includes('R$')) {
            const match = optionText.match(/R\$\s*(\d+[,.]?\d*)/);
            if (match) {
                taxa = parseFloat(match[1].replace(',', '.')) || 0;
            }
        }
    }
    
    const totalComTaxa = subtotal + taxa;
    
    if (totalDisplay) {
        totalDisplay.textContent = `Total: R$ ${totalComTaxa.toFixed(2).replace('.', ',')}`;
    }

    if (checkoutBtn) {
        checkoutBtn.disabled = carrinho.length === 0;
    }
}

function atualizarTaxa() {
    renderCarrinho();
}

function toggleCart() {
    const cart = document.querySelector('.cart');
    const overlay = document.getElementById('overlay');
    cart.classList.toggle('show');
    overlay.style.display = cart.classList.contains('show') ? 'block' : 'none';
}

function finalizarPedido() {
    const clienteNome = document.getElementById('clienteNome').value;
    const clienteTelefone = document.getElementById('clienteTelefone').value;
    const clienteEndereco = document.getElementById('clienteEndereco').value;
    const clienteRegiaoSelect = document.getElementById('clienteRegiao');
    const clienteRegiao = clienteRegiaoSelect.options[clienteRegiaoSelect.selectedIndex].text;
    const pagamento = document.getElementById('pagamento').value;
    const obsCliente = document.getElementById('obsCliente').value;
    
    const showMessage = (message, isError = true) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = isError ? 'custom-message error' : 'custom-message success';
        msgDiv.textContent = message;
        
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
    
    const subtotal = carrinho.reduce((acc, item) => acc + ((item.preco || 0) * item.qtd), 0);
    
    const selectedOption = clienteRegiaoSelect.options[clienteRegiaoSelect.selectedIndex];
    const taxa = parseFloat(selectedOption.getAttribute('data-fee')) || 0;
    
    const total = subtotal + taxa;
    
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
    
    const urlWhatsApp = `https://wa.me/5531992128891?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsApp, '_blank');
    
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
    
    carrinho = [];
    salvarCarrinho();
    renderCarrinho();
    toggleCart();
    
    document.getElementById('clienteNome').value = '';
    document.getElementById('clienteTelefone').value = '';
    document.getElementById('clienteEndereco').value = '';
    document.getElementById('pagamento').value = '';
    document.getElementById('obsCliente').value = '';
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

function mostrarTroco() {
    const pagamento = document.getElementById('pagamento').value;
    const campoTroco = document.getElementById('campoTroco');
    
    if (pagamento === 'Dinheiro') {
        campoTroco.style.display = 'block';
    } else {
        campoTroco.style.display = 'none';
    }
}

// ===== INICIALIZAÇÃO E EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    carregarCardapio();
    renderCarrinho();
    
    document.getElementById('checkoutBtn')?.addEventListener('click', finalizarPedido);
    document.getElementById('clienteRegiao')?.addEventListener('change', atualizarTaxa);
    document.getElementById('pagamento')?.addEventListener('change', mostrarTroco);
    document.getElementById('openCartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('closeCartBtn')?.addEventListener('click', toggleCart);
});

window.adicionarAoCarrinho = adicionarAoCarrinho;
window.removerDoCarrinho = removerDoCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.atualizarTaxa = atualizarTaxa;
window.finalizarPedido = finalizarPedido;
window.toggleCart = toggleCart;
window.mostrarTroco = mostrarTroco;

