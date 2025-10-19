let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
// As taxas estão no HTML, então a constante TAXAS não é estritamente necessária aqui, 
// mas a mantemos como referência.
const TAXAS = {
    "Jardim Canadá": 6.00,
    "Retiro das Pedras": 10.00,
    "Serra do Manacás": 10.00,
    "Vale do Sol": 12.00,
    "Alphaville": 15.00,
    "none": 0.00
};

function escaparStringHTML(str) {
    if (typeof str !== 'string') return '';
    // A função é mantida por segurança, mas o método 'data-attribute' é o ideal (veja as observações)
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ====================================================================
// FUNÇÃO AUXILIAR PARA PEGAR A TAXA DO HTML (mais robusto)
// ====================================================================
function getTaxaEntrega(regiao) {
    const select = document.getElementById('clienteRegiao');
    if (!select) return 0;

    // A taxa agora está embutida no texto da opção (ex: "Jardim Canadá - R$ 6,00")
    for (let i = 0; i < select.options.length; i++) {
        const option = select.options[i];
        if (option.value === regiao) {
            const match = option.text.match(/R\$ ([\d,.]+)/);
            return match ? parseFloat(match[1].replace(',', '.')) : 0;
        }
    }
    return 0;
}

// Carregar cardápio da API
async function carregarCardapio() {
    try {
        const response = await fetch('/api/cardapio');
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar cardápio da API: ${response.status}`);
        }
        
        const cardapio = await response.json();
        renderCardapio(cardapio);
        
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
            renderCardapio(cardapio);
        })
        .catch(err => console.error('❌ Erro fatal ao carregar cardápio local ou API:', err));
}

// Função central para renderizar o cardápio (Chamada por ambas as fontes)
function renderCardapio(cardapio) {
    Object.keys(cardapio).forEach(categoria => {
        const container = document.getElementById(`cat-${categoria}`);
        
        if (container) {
            container.innerHTML = cardapio[categoria].map(produto => {
                const precoNumerico = produto.preco || 0;
                const precoFormatado = precoNumerico.toFixed(2);
                const imagemUrl = produto.imagem || '';
                
                // Melhor prática: USAR DATA-ATTRIBUTES EM VEZ DE ONCLICK
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
                                    data-categoria="${categoria}" 
                                    data-nome="${produto.nome}" 
                                    data-preco="${precoNumerico}"> 
                                ➕ Adicionar
                            </button> 
                        </div>
                    </div>
                `;
            }).join('');
        }
    });
    
    // Configura os listeners APÓS a renderização
    configurarListenersDeAdicao();
    renderCarrinho();
}

// NOVO: Função para configurar os Event Listeners (Solução para o problema)
function configurarListenersDeAdicao() {
    // Remove listeners anteriores para evitar duplicação (se for o caso)
    document.querySelectorAll('.btn-adicionar').forEach(oldButton => {
        oldButton.replaceWith(oldButton.cloneNode(true));
    });

    // Adiciona o listener aos novos botões
    document.querySelectorAll('.btn-adicionar').forEach(button => {
        button.addEventListener('click', (event) => {
            // Recupera os dados do produto dos data-attributes
            const { categoria, nome, preco } = event.currentTarget.dataset;
            
            // Chama a função de adicionar ao carrinho
            adicionarAoCarrinho(categoria, nome, parseFloat(preco));
            
            // Efeito visual (opcional)
            const itemElement = event.currentTarget.closest('.menu-item');
            if (itemElement) {
                itemElement.style.transform = 'scale(0.95)';
                setTimeout(() => itemElement.style.transform = 'scale(1)', 150);
            }
        });
    });
}
// ===== FIM DA NOVA FUNÇÃO DE LISTENERS =====
// ====================================================================


// ===== FUNÇÕES DO CARRINHO (Ajustadas para os novos IDs) =====
function adicionarAoCarrinho(categoria, nome, preco) {
    // CORRIGIDO: ID clienteNome
    const clienteNome = document.getElementById('clienteNome')?.value;
    
    // Apenas dá um aviso, mas permite adicionar
    if (!clienteNome) {
         // Não usamos alert em SPA, mas mantemos o aviso
         console.warn('Preencha seu nome no carrinho antes de adicionar itens.');
    }
    
    const itemExistente = carrinho.find(item => item.nome === nome);
    
    if (itemExistente) {
        itemExistente.qtd++;
    } else {
        // Garantimos que 'preco' seja um número
        carrinho.push({ categoria, nome, preco: preco || 0, qtd: 1 });
    }
    
    salvarCarrinho();
    renderCarrinho();
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
    // CORRIGIDO: Novos IDs do HTML
    const subtotalDisplay = document.getElementById('subTotalDisplay');
    const feeDisplay = document.getElementById('taxaEntregaDisplay');
    const totalDisplay = document.getElementById('cart-total');
    // CORRIGIDO: Novo ID do HTML
    const cartCount = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    // CORRIGIDO: Novo ID do HTML
    const regionSelect = document.getElementById('clienteRegiao');
    
    if (!cartItems) return;
    
    const totalItens = carrinho.reduce((acc, item) => acc + item.qtd, 0);
    if (cartCount) cartCount.textContent = totalItens;
    
    cartItems.innerHTML = carrinho.map((item, index) => {
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
    
    const subtotal = carrinho.reduce((acc, item) => acc + ((item.preco || 0) * item.qtd), 0);
    
    const selectedRegion = regionSelect?.value;
    // CORRIGIDO: Pega a taxa da nova função
    const taxa = getTaxaEntrega(selectedRegion || "none");
    
    const totalComTaxa = subtotal + taxa;
    
    if (subtotalDisplay) subtotalDisplay.textContent = `R$ ${subtotal.toFixed(2)}`;
    if (feeDisplay) feeDisplay.textContent = `R$ ${taxa.toFixed(2)}`;
    if (totalDisplay) totalDisplay.textContent = `R$ ${totalComTaxa.toFixed(2)}`;

    if (checkoutBtn) {
        checkoutBtn.disabled = carrinho.length === 0;
    }
}

function atualizarTaxa() {
    renderCarrinho();
}

function toggleCart() {
    // CORRIGIDO: Novo ID do HTML (section#cart)
    const cart = document.getElementById('cart');
    
    // O seu HTML não tem mais o overlay, então vamos apenas alternar a classe 'show'
    cart.classList.toggle('show');
    
    // Se quiser o overlay, adicione ao HTML: <div id="overlay"></div>
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = cart.classList.contains('show') ? 'block' : 'none';
}

// NOVO: Função para exibir o campo de troco
function mostrarTroco() {
    // CORRIGIDO: Novo ID do HTML
    const pagamentoSelect = document.getElementById('pagamento');
    const campoTrocoDiv = document.getElementById('campoTroco');
    
    if (pagamentoSelect?.value === 'Dinheiro') {
        campoTrocoDiv.style.display = 'block';
    } else {
        campoTrocoDiv.style.display = 'none';
    }
}

function finalizarPedido() {
    // 1. Coleta e mapeamento dos dados
    const clienteNome = document.getElementById('clienteNome').value;
    const clienteTelefone = document.getElementById('clienteTelefone').value;
    const clienteEndereco = document.getElementById('clienteEndereco').value;
    const clienteRegiaoSelect = document.getElementById('clienteRegiao');
    
    // Pega o nome da região (ex: "Jardim Canadá" ou "Retirada no Local")
    const clienteRegiao = clienteRegiaoSelect.options[clienteRegiaoSelect.selectedIndex].text.split(' - ')[0]; 
    
    const pagamento = document.getElementById('pagamento').value;
    const obsCliente = document.getElementById('obsCliente').value;
    const trocoNecessario = document.getElementById('troco')?.value;
    
    const showMessage = (message, isError = true) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = isError ? 'custom-message error' : 'custom-message success';
        msgDiv.textContent = message;
        
        const cartContent = document.getElementById('cart'); 
        if (cartContent) cartContent.prepend(msgDiv);

        setTimeout(() => msgDiv.remove(), 4000);
    };

    // 2. Validações
    if (!carrinho || carrinho.length === 0) {
        showMessage('Seu carrinho está vazio!', true);
        return;
    }

    if (!clienteNome || !clienteTelefone || !pagamento) {
        showMessage('Por favor, preencha nome, telefone e pagamento!', true);
        return;
    }
    
    // Validação CONDICIONAL: Endereço é obrigatório SOMENTE se NÃO for Retirada
    if (clienteRegiao !== 'Retirada no Local' && !clienteEndereco) {
        showMessage('Para entrega, o endereço completo é obrigatório!', true);
        return;
    }

    // 3. Cálculos de valores
    const subtotal = carrinho.reduce((acc, item) => acc + ((item.preco || 0) * item.qtd), 0);
    const taxa = getTaxaEntrega(clienteRegiaoSelect.value || "none");
    const total = subtotal + taxa;
    
    // 4. Montagem da Mensagem do WhatsApp
    let mensagem = `*NOVO PEDIDO - Artesanal Blend* 🍔\n\n`;
    mensagem += `*Cliente:* ${clienteNome}\n`;
    mensagem += `*Telefone:* ${clienteTelefone}\n`;
    
    // Lógica para Retirada vs. Entrega
    if (clienteRegiao === 'Retirada no Local') {
        mensagem += `*Modalidade:* Retirada no Local (O cliente irá buscar)\n`;
    } else {
        mensagem += `*Endereço:* ${clienteEndereco}\n`;
        mensagem += `*Região de Entrega:* ${clienteRegiao}\n`;
    }
    mensagem += `\n`; // Quebra de linha

    mensagem += `*ITENS DO PEDIDO:*\n`;
    
    carrinho.forEach(item => {
        mensagem += `• ${item.qtd}x ${item.nome} (R$ ${((item.preco || 0) * item.qtd).toFixed(2)})\n`;
    });
    
    mensagem += `\n*Subtotal:* R$ ${subtotal.toFixed(2)}\n`;
    mensagem += `*Taxa de entrega:* R$ ${taxa.toFixed(2)}\n`;
    mensagem += `*Total a pagar:* R$ ${total.toFixed(2)}\n\n`;
    mensagem += `*FORMA DE PAGAMENTO:* ${pagamento}\n`;
    
    if (pagamento.includes('Dinheiro') && trocoNecessario) {
          mensagem += `*Troco para:* R$ ${parseFloat(trocoNecessario).toFixed(2)}\n`;
    }
    
    if (obsCliente) {
        mensagem += `\n*OBSERVAÇÕES:* ${obsCliente}\n`;
    }
    
    mensagem += `\n_ Pedido gerado via sistema _`;
    
    // 5. Envio e Limpeza
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
    
    // Limpeza após o envio
    carrinho = [];
    salvarCarrinho();
    renderCarrinho();
    toggleCart();
    
    // Limpa os campos do cliente
    document.getElementById('clienteNome').value = '';
    document.getElementById('clienteTelefone').value = '';
    document.getElementById('clienteEndereco').value = '';
    document.getElementById('pagamento').value = '';
    document.getElementById('obsCliente').value = '';
    
    const trocoInput = document.getElementById('troco');
    if (trocoInput) trocoInput.value = '';
    mostrarTroco(); 
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

// ===== INICIALIZAÇÃO E EVENT LISTENERS (Ajustados para os novos IDs) =====
document.addEventListener('DOMContentLoaded', () => {
    carregarCardapio();
    renderCarrinho();
    
    // CORRIGIDO: Novos IDs para os listeners
    document.getElementById('checkoutBtn')?.addEventListener('click', finalizarPedido);
    document.getElementById('clienteRegiao')?.addEventListener('change', atualizarTaxa);
    document.getElementById('openCartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('closeCartBtn')?.addEventListener('click', toggleCart);
    
    // NOVO: Listener para mostrar campo de troco
    document.getElementById('pagamento')?.addEventListener('change', mostrarTroco);
});

// Tornar as funções globais para o onclick no carrinho renderizado
window.adicionarAoCarrinho = adicionarAoCarrinho;
window.removerDoCarrinho = removerDoCarrinho;
window.alterarQuantidade = alterarQuantidade;
window.atualizarTaxa = atualizarTaxa;
window.finalizarPedido = finalizarPedido;
window.toggleCart = toggleCart;
window.mostrarTroco = mostrarTroco;

