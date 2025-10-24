// ===============================
// 🔐 AUTENTICAÇÃO COM JWT
// ===============================
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login';
} else {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    if (Date.now() > exp) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  } catch {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}

// ===============================
// 🧭 DASHBOARD PRO
// ===============================
class Dashboard {
  constructor() {
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.financeiro = {};
    this.chartFinanceiro = null;

    document.addEventListener('DOMContentLoaded', () => this.init());
  }

 async init() {
    await this.carregarDados();
    this.setupEventListeners();
    this.renderProdutos();
    this.renderInsumos();
    this.renderPedidos();
    this.updateFinanceiro();
  }


  // ===============================
  // 🔄 CARREGAMENTO DE DADOS
  // ===============================
  async carregarDados() {
    try {
      const [produtosRes, pedidosRes, insumosRes] = await Promise.all([
        fetch('/api/menu').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/insumos').then(r => r.json())
      ]);
      this.produtos = produtosRes || [];
      this.pedidos = pedidosRes || [];
      this.insumos = insumosRes || [];
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      this.showToast('Erro ao carregar dados', 'error');
    }
  }

  // ===============================
  // 🧭 ABAS E LOGOUT
  // ===============================
  configurarAbas() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById(tab.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  }

  configurarLogout() {
    const btn = document.getElementById('btnLogout');
    if (btn) {
      btn.addEventListener('click', () => {
        if (confirm('Deseja realmente sair?')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      });
    }
  }

  // ===============================
  // 🍔 PRODUTOS
  // ===============================
 renderPedidos() {
    const container = document.getElementById('pedidosContainer');
    if (!this.pedidos || !this.pedidos.length) {
      container.innerHTML = '<div class="empty-state">Nenhum pedido recebido</div>';
      return;
    }

    container.innerHTML = this.pedidos.map(pedido => `
      <article class="produto-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem">
          <div>
            <h3>Pedido #${pedido._id?.slice(-6) || 'N/A'}</h3>
            <p><strong>Cliente:</strong> ${pedido.cliente || '-'}</p>
            <p><strong>Telefone:</strong> ${pedido.telefone || '-'}</p>
            <p><strong>Endereço:</strong> ${pedido.endereco || '-'}</p>
          </div>
          <div style="text-align:right">
            <div style="margin-bottom:.5rem"><strong>Total:</strong> R$ ${(pedido.total || 0).toFixed(2)}</div>
            <div class="status">${this.formatarStatus(pedido.status)}</div>
          </div>
        </div>

        <div style="margin:0.5rem 0;border-top:1px solid var(--border);padding-top:0.5rem">
          <strong>Itens:</strong>
          ${(pedido.itens || []).map(item => `<div style="display:flex;justify-content:space-between;margin:.25rem 0"><span>${item.quantidade}x ${item.nome}</span><span>R$ ${((item.preco || 0) * (item.quantidade || 1)).toFixed(2)}</span></div>`).join('')}
        </div>

        <div class="card-actions" style="margin-top:.75rem">
          <button class="btn-editar" onclick='dashboard.abrirModalPedido(${JSON.stringify(pedido).replace(/\"/g,'&quot;')})'>Editar</button>
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${pedido._id}','preparando')">👨‍🍳 Preparando</button>
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${pedido._id}','pronto')">✅ Pronto</button>
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${pedido._id}','entregue')">🚗 Entregue</button>
          <button class="btn" onclick="dashboard.imprimirCupom('${pedido._id}')">🖨️ Imprimir Cupom</button>
          <button class="btn-excluir" onclick="dashboard.excluirPedido('${pedido._id}')">Excluir</button>
        </div>
      </article>
    `).join('');
  }
  async toggleDisponibilidade(id) {
    const p = this.produtos.find(x => x._id === id);
    if (!p) return;
    try {
      const res = await fetch(`/api/menu/item/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponivel: !p.disponivel })
      });
      if (res.ok) {
        p.disponivel = !p.disponivel;
        this.renderProdutos();
        this.showToast('Disponibilidade atualizada', 'success');
      }
    } catch {
      this.showToast('Erro ao atualizar produto', 'error');
    }
  }

  async excluirProduto(id) {
    if (!confirm('Excluir produto?')) return;
    try {
      await fetch(`/api/menu/item/${id}`, { method: 'DELETE' });
      this.produtos = this.produtos.filter(p => p._id !== id);
      this.renderProdutos();
      this.showToast('Produto excluído', 'success');
    } catch {
      this.showToast('Erro ao excluir produto', 'error');
    }
  }

  // ===============================
  // 🧾 PEDIDOS
  // ===============================
  renderPedidos() {
    const container = document.getElementById('pedidosContainer');
    if (!container) return;
    if (!this.pedidos.length) {
      container.innerHTML = `<div class="empty-state">Nenhum pedido recebido</div>`;
      return;
    }

    container.innerHTML = this.pedidos.map(p => `
      <div class="produto-card">
        <h3>Pedido #${p._id.slice(-6)}</h3>
        <p><strong>Cliente:</strong> ${p.cliente}</p>
        <p><strong>Total:</strong> R$ ${(p.total || 0).toFixed(2)}</p>
        <p><strong>Status:</strong> ${p.status}</p>
        <div class="card-actions">
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${p._id}','preparando')">👨‍🍳 Preparar</button>
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${p._id}','pronto')">✅ Pronto</button>
          <button class="btn secondary" onclick="dashboard.atualizarStatusPedido('${p._id}','entregue')">🚗 Entregue</button>
        </div>
      </div>
    `).join('');
  }

  async atualizarStatusPedido(id, novoStatus) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      if (res.ok) {
        const p = this.pedidos.find(x => x._id === id);
        if (p) p.status = novoStatus;
        this.renderPedidos();
        this.showToast('Status atualizado', 'success');
      }
    } catch {
      this.showToast('Erro ao atualizar status', 'error');
    }
  }

  // 🔄 Atualizar pedidos manualmente
  async updatePedidos() {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Erro ao atualizar pedidos');
      this.pedidos = await res.json();
      this.renderPedidos();
      this.showToast('Pedidos atualizados', 'success');
    } catch (err) {
      console.error('Erro ao atualizar pedidos:', err);
      this.showToast('Erro ao atualizar pedidos', 'error');
    }
  }
  imprimirCupom(id) {
  const pedido = this.pedidos.find(p => p._id === id);
  if (!pedido) return this.showToast('Pedido não encontrado', 'error');

  const janelaImpressao = window.open('', '_blank', 'width=380,height=700');
  
  if (!janelaImpressao) {
    this.showToast('Permita pop-ups para imprimir o cupom', 'error');
    return;
  }

  const css = `
    <style>
      @media print {
        body { 
          width: 80mm !important;
          max-width: 80mm !important;
          margin: 3mm !important;
          padding: 0 !important;
          font-size: 16px !important;
          font-weight: bold !important;
        }
        .no-print { display: none !important; }
      }
      
      body { 
        width: 80mm;
        max-width: 80mm;
        font-family: 'Courier New', Courier, monospace; 
        font-size: 13px;
        font-weight: bold;
        margin: 3mm;
        padding: 0;
        line-height: 1.2;
        background: white;
      }
      .center { 
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .right { text-align: right; }
      .left { text-align: left; }
      .bold { 
        font-weight: bold; 
        font-size: 14px;
      }
      .line { 
        border: none;
        border-top: 2px dashed #000; 
        margin: 5px 0;
      }
      table { 
        width: 100%; 
        border-collapse: collapse;
      }
      td { 
        vertical-align: top; 
        padding: 2px 0;
        word-wrap: break-word;
      }
      .item-qty { width: 20%; text-align: center; font-weight: bold; }
      .item-name { width: 50%; text-align: left; padding: 0 3px; font-weight: bold; }
      .item-total { width: 30%; text-align: right; font-weight: bold; }
      .logo-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin: 0 auto 5px auto;
      }
      .logo { 
        max-width: 120px; 
        height: auto; 
        display: block;
        margin: 0 auto;
      }
      .header { 
        margin-bottom: 5px;
        width: 100%;
      }
      .footer { margin-top: 5px; }
      .medium { font-size: 12px; }
      .break-word { word-break: break-word; }
      .total-section {
        margin-top: 8px;
        padding-top: 5px;
        border-top: 2px solid #000;
      }
      .item-row {
        margin: 3px 0;
        padding: 2px 0;
      }
    </style>
  `;

  const qrPix = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=PIX:+5531992128891`;

  // Processar itens e totais
  let subtotal = 0;
  const itensHtml = pedido.itens.map(item => {
    const quantidade = parseInt(item.quantidade) || 1;
    const preco = parseFloat(item.preco) || 0;
    const totalItem = quantidade * preco;
    subtotal += totalItem;
    
    // Limitar nome do item
    let nomeItem = item.nome || '';
    if (nomeItem.length > 20) {
      nomeItem = nomeItem.substring(0, 20) + '...';
    }
    
    return `
      <tr class="item-row">
        <td class="item-qty">${quantidade}x</td>
        <td class="item-name break-word">${nomeItem}</td>
        <td class="item-total">R$ ${totalItem.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const totalPedido = parseFloat(pedido.total) || subtotal;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cupom #${pedido._id?.slice(-6) || 'N/A'}</title>
      <meta charset="UTF-8">
      ${css}
    </head>
    <body>
      <!-- CABEÇALHO COM LOGO CENTRALIZADA -->
      <div class="header center">
        <div class="logo-container">
          <img class="logo" src="${window.location.origin + '/images/logo.jpg'}" alt="Logo" onerror="this.style.display='none'">
        </div>
        <div class="bold" style="font-size: 16px; margin-bottom: 3px;">BURGUER ARTESANAL BLEND</div>
        <div class="medium">CNPJ: 58.518.297/0001-61</div>
        <div class="medium">Rua Coniston, 380 - Jd. Canadá</div>
        <div class="medium">Nova Lima - MG</div>
        <div class="medium">Tel: (31) 99212-8891</div>
      </div>

      <hr class="line">

      <!-- DADOS DO PEDIDO -->
      <div>
        <div style="font-size: 14px;"><strong>PEDIDO #${pedido._id?.slice(-6) || 'N/A'}</strong></div>
        <div class="medium">${new Date(pedido.data || pedido.createdAt || Date.now()).toLocaleString('pt-BR')}</div>
        <div><strong>CLIENTE:</strong> ${pedido.cliente || 'CONSUMIDOR'}</div>
        ${pedido.telefone ? `<div><strong>TEL:</strong> ${pedido.telefone}</div>` : ''}
        ${pedido.endereco ? `<div class="break-word medium"><strong>END:</strong> ${pedido.endereco}</div>` : ''}
      </div>

      <hr class="line">

      <!-- ITENS -->
      <div style="margin: 5px 0;">
        <div style="font-size: 14px; margin-bottom: 3px;"><strong>ITENS DO PEDIDO:</strong></div>
        <table>
          ${itensHtml}
        </table>
      </div>

      <hr class="line">

      <!-- TOTAIS -->
       <div class="total-section">
  <table>
    <tr>
      <td class="left"><strong>SUBTOTAL:</strong></td>
      <td class="right"><strong>R$ ${subtotal.toFixed(2)}</strong></td>
    </tr>
    ${pedido.taxaEntrega > 0 ? `
      <tr>
        <td class="left"><strong>TAXA ENTREGA:</strong></td>
        <td class="right"><strong>R$ ${pedido.taxaEntrega.toFixed(2)}</strong></td>
      </tr>
    ` : ''}
    <tr>
      <td class="left"><strong>TOTAL:</strong></td>
      <td class="right" style="font-size: 14px;"><strong>R$ ${totalPedido.toFixed(2)}</strong></td>
    </tr>
    <tr>
      <td class="left medium">Pagamento:</td>
  <td class="right medium">${pedido.formaPagamento || pedido.pagamento || 'NÃO INFORMADO'}</td>
    </tr>
    <tr>
      <td class="left medium">Status:</td>
      <td class="right medium">${(pedido.status || 'PENDENTE').toUpperCase()}</td>
    </tr>
  </table>
</div>
      <hr class="line">

      <!-- RODAPÉ -->
      <div class="footer center">
        <div class="bold" style="font-size: 14px; margin-bottom: 3px;">FORMA DE PAGAMENTO PIX</div>
        <div class="medium">Chave: +55 31 99212-8891</div>
        <div class="logo-container" style="margin: 5px auto;">
          <img class="qr" src="${qrPix}" alt="QR Code PIX" onerror="this.style.display='none'" style="max-width: 80px; height: auto;">
        </div>
        <div class="medium"><strong>VALQUIRIA GOMES AROEIRA</strong></div>
        <div class="medium">${new Date().toLocaleString('pt-BR')}</div>
        <br>
        <div class="bold" style="font-size: 14px;">*** OBRIGADO PELA PREFERÊNCIA! ***</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 800);
        };

        window.addEventListener('afterprint', function() {
          setTimeout(function() {
            window.close();
          }, 500);
        });
      </script>
    </body>
    </html>
  `;

  try {
    janelaImpressao.document.write(html);
    janelaImpressao.document.close();
    
  } catch (error) {
    console.error('Erro ao gerar cupom:', error);
    this.showToast('Erro ao gerar cupom', 'error');
    janelaImpressao.close();
  }
}

  // ===============================
  // 📦 INSUMOS
  // ===============================
  renderInsumos() {
    const container = document.getElementById('insumosContainer');
    if (!container) return;
    if (!this.insumos.length) {
      container.innerHTML = `<div class="empty-state">Nenhum insumo cadastrado</div>`;
      return;
    }

    container.innerHTML = this.insumos.map(i => `
      <div class="produto-card">
        <h3>${i.nome}</h3>
        <p>Quantidade: ${i.quantidade} ${i.unidade}</p>
        <p>Preço: R$ ${(i.preco || 0).toFixed(2)}</p>
      </div>
    `).join('');
  }

  // ===============================
  // 💰 FINANCEIRO PRO
  // ===============================
  async updateFinanceiro() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      this.financeiro = data;
      this.renderFinanceiro();
      this.renderGrafico();
    } catch (e) {
      console.error('Erro ao carregar financeiro:', e);
    }
  }

  renderFinanceiro() {
    const {
      vendas = 0,
      gastos = 0,
      lucro = 0,
      margem = 0,
      ticketMedio = 0,
      topProdutos = []
    } = this.financeiro;

    // Preenche valores principais
    document.getElementById('totalVendas').textContent = `R$ ${vendas.toFixed(2)}`;
    document.getElementById('totalCustos').textContent = `R$ ${gastos.toFixed(2)}`;
    document.getElementById('lucro').textContent = `R$ ${lucro.toFixed(2)}`;
    if (document.getElementById('margemLucro'))
      document.getElementById('margemLucro').textContent = `${margem.toFixed(1)}%`;

    // Ticket médio
    if (document.getElementById('ticketMedio'))
      document.getElementById('ticketMedio').textContent = `R$ ${ticketMedio.toFixed(2)}`;

    // Top produtos
    const topList = document.getElementById('topProdutos');
    if (topList) {
      if (!topProdutos.length) {
        topList.innerHTML = '<li>Nenhum dado disponível</li>';
      } else {
        topList.innerHTML = topProdutos
          .map(p => `<li>${p.nome} — <strong>${p.qtd}</strong> vendidos</li>`)
          .join('');
      }
    }
  }

  renderGrafico() {
    const ctx = document.getElementById('graficoFinanceiro');
    if (!ctx) return;
    const dias = this.financeiro.historico?.map(h => h.data) || [];
    const vendas = this.financeiro.historico?.map(h => h.vendas) || [];

    if (this.chartFinanceiro) this.chartFinanceiro.destroy();

    this.chartFinanceiro = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dias,
        datasets: [{
          label: 'Vendas',
          data: vendas,
          borderColor: '#d4af37',
          backgroundColor: 'rgba(212,175,55,0.2)',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: '📈 Histórico de Vendas Diárias' }
        }
      }
    });
  }

  // ===============================
  // ⚙️ UTILITÁRIOS
  // ===============================
  showToast(msg, tipo = 'success', tempo = 2500) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${tipo}`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, tempo);
  }
}

// Inicia o dashboard
window.dashboard = new Dashboard();



