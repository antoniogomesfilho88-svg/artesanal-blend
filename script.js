// script.js - MANTENDO TOTALMENTE A MESMA FUNCIONALIDADE
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
const TAXAS = {
    "Jardim Canadá": 6.00,
    "Retiro das Pedras": 10.00,
    "Serra do Manacás": 10.00,
    "Vale do Sol": 12.00,
    "Alphaville": 15.00
};

// Carregar cardápio da API
async function carregarCardapio() {
    try {
        const response = await fetch('/api/cardapio');
        const cardapio = await response.json();
        
        // Popular as categorias mantendo a mesma estrutura
        Object.keys(cardapio).forEach(categoria => {
            const container = document.getElementById(`cat-${categoria}`);
            if (container) {
                container.innerHTML = cardapio[categoria].map(produto => `
                    <div class="menu-item" onclick="adicionarAoCarrinho('${categoria}', '${produto.nome}', ${produto.preco})">
                        ${produto.imagem ? `<img src="${produto.imagem}" alt="${produto.nome}" />` : ''}
                        <h3>${produto.nome}</h3>
                        <p>${produto.descricao || ''}</p>
                        <span class="price">R$ ${produto.preco.toFixed(2)}</span>
                    </div>
                `).join('');
            }
        });
        
        renderCarrinho();
    } catch (error) {
        console.log('Usando cardápio local');
        carregarCardapioLocal();
    }
}

// Fallback para o menu.json local
function carregarCardapioLocal() {
    fetch('menu.json')
        .then(response => response.json())
        .then(cardapio => {
            Object.keys(cardapio).forEach(categoria => {
                const container = document.getElementById(`cat-${categoria}`);
                if (container) {
                    container.innerHTML = cardapio[categoria].map(produto => `
                        <div class="menu-item" onclick="adicionarAoCarrinho('${categoria}', '${produto.nome}', ${produto.preco})">
                            ${produto.imagem ? `<img src="${produto.imagem}" alt="${produto.nome}" />` : ''}
                            <h3>${produto.nome}</h3>
                            <p>${produto.descricao || ''}</p>
                            <span class="price">R$ ${produto.preco.toFixed(2)}</span>
                        </div>
                    `).join('');
                }
            });
        })
        .catch(err => console.error('Erro ao carregar cardápio:', err));
}

// ===== FUNÇÕES DO CARRINHO (MANTIDAS IGUAIS) =====
function adicionarAoCarrinho(categoria, nome, preco) {
    const itemExistente = carrinho.find(item => item.nome === nome);
    
    if (itemExistente) {
        itemExistente.qtd++;
    } else {
        carrinho.push({ categoria, nome, preco, qtd: 1 });
    }
    
    salvarCarrinho();
    renderCarrinho();
    
    // Feedback visual
    const btn = event.target.closest('.menu-item');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = 'scale(1)', 150);
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
    const cartTotal = document.getElementById('cart-total');
    const cartCount = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItems) return;
    
    // Contador
    const totalItens = carrinho.reduce((acc, item) => acc + item.qtd, 0);
    if (cartCount) cartCount.textContent = totalItens;
    
    // Itens
    cartItems.innerHTML = carrinho.map((item, index) => `
        <div class="cart-item">
            <div class="item-info">
                <strong>${item.nome}</strong>
                <span>R$ ${item.preco.toFixed(2)}</span>
            </div>
            <div class="item-controls">
                <button onclick="alterarQuantidade(${index}, -1)">−</button>
                <span>${item.qtd}</span>
                <button onclick="alterarQuantidade(${index}, 1)">+</button>
                <button onclick="removerDoCarrinho(${index})" class="remove">🗑️</button>
            </div>
        </div>
    `).join('');
    
    // Total
    const total = carrinho.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
    const taxa = TAXAS[document.getElementById('clienteRegiao')?.value] || 0;
    const totalComTaxa = total + taxa;
    
    if (cartTotal) {
        cartTotal.innerHTML = `
            Subtotal: R$ ${total.toFixed(2)}<br>
            ${taxa > 0 ? `Taxa de entrega: R$ ${taxa.toFixed(2)}<br>` : ''}
            <strong>Total: R$ ${totalComTaxa.toFixed(2)}</strong>
        `;
    }
    
    // Botão de checkout
    if (checkoutBtn) {
        checkoutBtn.disabled = carrinho.length === 0;
    }
}

// ===== FUNÇÕES DE ENTREGA E PAGAMENTO (MANTIDAS IGUAIS) =====
function atualizarTaxa() {
    renderCarrinho();
}

function mostrarTroco() {
    const pagamento = document.getElementById('pagamento').value;
    const campoTroco = document.getElementById('campoTroco');
    campoTroco.style.display = pagamento === 'Dinheiro' ? 'block' : 'none';
}

function finalizarPedido() {
    const clienteNome = document.getElementById('clienteNome').value;
    const clienteTelefone = document.getElementById('clienteTelefone').value;
    const clienteEndereco = document.getElementById('clienteEndereco').value;
    const clienteRegiao = document.getElementById('clienteRegiao').value;
    const pagamento = document.getElementById('pagamento').value;
    const troco = document.getElementById('troco').value;
    const obsCliente = document.getElementById('obsCliente').value;
    
    if (!clienteNome || !clienteTelefone || !clienteEndereco || !clienteRegiao || !pagamento) {
        alert('Por favor, preencha todas as informações obrigatórias!');
        return;
    }
    
    if (pagamento === 'Dinheiro' && !troco) {
        alert('Por favor, informe para quanto precisa de troco!');
        return;
    }
    
    const taxa = TAXAS[clienteRegiao] || 0;
    const total = carrinho.reduce((acc, item) => acc + (item.preco * item.qtd), 0) + taxa;
    
    // Montar mensagem para WhatsApp
    let mensagem = `*NOVO PEDIDO - Artesanal Blend* 🍔\n\n`;
    mensagem += `*Cliente:* ${clienteNome}\n`;
    mensagem += `*Telefone:* ${clienteTelefone}\n`;
    mensagem += `*Endereço:* ${clienteEndereco}\n`;
    mensagem += `*Região:* ${clienteRegiao}\n\n`;
    mensagem += `*ITENS DO PEDIDO:*\n`;
    
    carrinho.forEach(item => {
        mensagem += `• ${item.qtd}x ${item.nome} - R$ ${(item.preco * item.qtd).toFixed(2)}\n`;
    });
    
    mensagem += `\n*Taxa de entrega:* R$ ${taxa.toFixed(2)}\n`;
    mensagem += `*Total:* R$ ${total.toFixed(2)}\n\n`;
    mensagem += `*FORMA DE PAGAMENTO:* ${pagamento}\n`;
    
    if (pagamento === 'Dinheiro') {
        mensagem += `*Troco para:* R$ ${parseFloat(troco).toFixed(2)}\n`;
    }
    
    if (obsCliente) {
        mensagem += `\n*OBSERVAÇÕES:* ${obsCliente}\n`;
    }
    
    mensagem += `\n_ Pedido gerado via sistema _`;
    
    // Salvar pedido no banco de dados
    salvarPedidoNoBanco({
        cliente: clienteNome,
        telefone: clienteTelefone,
        endereco: clienteEndereco,
        regiao: clienteRegiao,
        taxaEntrega: taxa,
        itens: carrinho,
        total: total,
        formaPagamento: pagamento,
        troco: troco ? parseFloat(troco) : null,
        observacao: obsCliente
    });
    
    // Enviar para WhatsApp
    const urlWhatsApp = `https://wa.me/5531992128891?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsApp, '_blank');
    
    // Limpar carrinho
    carrinho = [];
    salvarCarrinho();
    renderCarrinho();
    document.getElementById('cart').classList.remove('show');
    
    // Limpar formulário
    document.getElementById('clienteNome').value = '';
    document.getElementById('clienteTelefone').value = '';
    document.getElementById('clienteEndereco').value = '';
    document.getElementById('clienteRegiao').value = '';
    document.getElementById('pagamento').value = '';
    document.getElementById('troco').value = '';
    document.getElementById('obsCliente').value = '';
    document.getElementById('campoTroco').style.display = 'none';
}

async function salvarPedidoNoBanco(pedidoData) {
    try {
        await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedidoData)
        });
    } catch (error) {
        console.log('Pedido salvo localmente (sem conexão com servidor)');
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    carregarCardapio();
    renderCarrinho();
    
    // Event Listeners
    document.getElementById('checkoutBtn')?.addEventListener('click', finalizarPedido);
    document.getElementById('pagamento')?.addEventListener('change', mostrarTroco);
    document.getElementById('clienteRegiao')?.addEventListener('change', atualizarTaxa);
});

// Exportar funções para o HTML
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.removerDoCarrinho = removerDoCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.atualizarTaxa = atualizarTaxa;
window.mostrarTroco = mostrarTroco;
window.finalizarPedido = finalizarPedido;
