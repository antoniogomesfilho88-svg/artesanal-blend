imprimirCupom(id) {
  const pedido = this.pedidos.find(p => p._id === id);
  if (!pedido) return this.showToast('Pedido não encontrado', 'error');

  const janela = window.open('', '_blank', 'width=400,height=600');

  // calcula tamanho da fonte dependendo do número de itens
  const fontSize = pedido.itens.length > 10 ? '10px' : '12px';
  const css = `
    <style>
      body { width: 384px; font-family: monospace; font-size: ${fontSize}; margin:0; padding:0; }
      .center { text-align:center; }
      .line { border-bottom:1px dashed #000; margin:4px 0; }
      .right { text-align:right; }
      .bold { font-weight:bold; }
      table { width:100%; border-collapse:collapse; }
      td { vertical-align:top; padding:2px 0; word-wrap: break-word; }
      .item-name { max-width:220px; white-space: nowrap; overflow:hidden; text-overflow:ellipsis; }
      .item-qty, .item-total { width:60px; text-align:right; }
      .qr { margin-top:6px; max-width:120px; }
    </style>
  `;

  const qrPix = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=PIX:+5531992128891`;

  // calcula subtotal
  const subtotal = pedido.itens.reduce((sum, item) => sum + ((item.quantidade || 0) * (item.preco || 0)), 0);

  const html = `
    ${css}
    <body>
      <div class="center">
        <img src="images/logo.jpg" style="max-width:120px;height:auto;" />
        <div class="bold">BURGUER ARTESANAL BLEND</div>
        <div>CNPJ: 58.518.297/0001-61</div>
        <div>Rua Coniston, 380 - Jd. Canadá, Nova Lima - MG</div>
        <div>Tel: (31) 99212-8891</div>
        <hr class="line" />
      </div>

      <div>
        <div>Venda #${pedido._id}</div>
        <div>${pedido.data || pedido.createdAt || ''}</div>
        <div>Cliente: ${pedido.cliente || ''}</div>
        <hr class="line" />
      </div>

      <table>
        ${pedido.itens.map(item => {
          const totalItem = (item.quantidade || 0) * (item.preco || 0);
          return `
            <tr>
              <td class="item-qty">${item.quantidade || 0}x</td>
              <td class="item-name">${item.nome || ''}</td>
              <td class="item-total">R$ ${totalItem.toFixed(2)}</td>
            </tr>
          `;
        }).join('')}
      </table>

      <hr class="line" />

      <table>
        <tr>
          <td>Subtotal</td>
          <td class="right">R$ ${subtotal.toFixed(2)}</td>
        </tr>
        <tr class="bold">
          <td>TOTAL</td>
          <td class="right">R$ ${pedido.total?.toFixed(2) || '0.00'}</td>
        </tr>
        <tr>
          <td>Pagamento:</td>
          <td class="right">${pedido.pagamento || '—'}</td>
        </tr>
        <tr>
          <td>Status:</td>
          <td class="right">${pedido.status || '—'}</td>
        </tr>
      </table>

      <hr class="line" />

      <div class="center">
        <div>PIX: +55 31 99212-8891</div>
        <img class="qr" src="${qrPix}" alt="QR Code PIX" />
        <div>VALQUIRIA GOMES AROEIRA</div>
        <div>${pedido.data || pedido.createdAt || ''}</div>
        <div>* Obrigado pela preferência! *</div>
      </div>
    </body>
  `;

  janela.document.write(html);
  janela.document.close();
  janela.focus();

  // dispara a impressão e fecha a janela somente após o usuário finalizar
  janela.onafterprint = () => janela.close();
  janela.print();
}
