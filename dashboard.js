/* ================= FINANCEIRO PROFISSIONAL ================= */
dashboard.financeiroData = {
  // Dados de exemplo para demonstração
  totalVendas: 125430.50,
  totalCustos: 78420.30,
  lucro: 47010.20,
  variacaoVendas: 12.5,
  variacaoCustos: 8.2,
  variacaoLucro: 15.3,
  margemLucro: 37.5,
  
  stats: {
    ticketMedio: 245.80,
    vendasMes: 42,
    custoMedio: 186.70,
    clientesAtendidos: 128,
    pedidosCancelados: 3,
    tempoMedioPreparo: '18 min'
  },
  
  vendasMensais: [
    { mes: 'Jan', vendas: 8500, custos: 6200 },
    { mes: 'Fev', vendas: 9200, custos: 6800 },
    { mes: 'Mar', vendas: 10200, custos: 7500 },
    { mes: 'Abr', vendas: 11500, custos: 8200 },
    { mes: 'Mai', vendas: 12300, custos: 8800 },
    { mes: 'Jun', vendas: 13200, custos: 9200 }
  ]
};

// Inicialização do Financeiro
dashboard.initFinanceiro = function() {
  this.renderFinanceiro();
  this.renderStats();
  this.renderGrafico();
  this.renderUltimosPedidos();
  this.renderFluxoCaixa();
  this.configurarFiltros();
};

// Configuração dos filtros
dashboard.configurarFiltros = function() {
  const filtroPeriodo = document.getElementById('filtroPeriodo');
  const periodoPersonalizado = document.getElementById('periodoPersonalizado');
  
  if (filtroPeriodo) {
    filtroPeriodo.addEventListener('change', function() {
      if (periodoPersonalizado) {
        periodoPersonalizado.style.display = this.value === 'personalizado' ? 'flex' : 'none';
      }
      dashboard.filtrarFinanceiro();
    });
  }

  // Definir datas padrão
  const hoje = new Date();
  const umaSemanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const dataInicio = document.getElementById('dataInicio');
  const dataFim = document.getElementById('dataFim');
  
  if (dataInicio) dataInicio.value = umaSemanaAtras.toISOString().split('T')[0];
  if (dataFim) dataFim.value = hoje.toISOString().split('T')[0];
};

// Filtragem dos dados financeiros
dashboard.filtrarFinanceiro = function() {
  const periodo = document.getElementById('filtroPeriodo')?.value || '';
  const categoria = document.getElementById('filtroCategoria')?.value || '';
  const dataInicio = document.getElementById('dataInicio')?.value || '';
  const dataFim = document.getElementById('dataFim')?.value || '';
  
  console.log('Filtrando financeiro:', { periodo, categoria, dataInicio, dataFim });
  this.updateFinanceiro();
};

// Atualização principal do financeiro
dashboard.updateFinanceiro = function() {
  const btn = document.querySelector('#financeiroTab .btn.secondary');
  if (btn) {
    btn.innerHTML = '⏳ Atualizando...';
    btn.disabled = true;
  }

  // Simula carregamento com dados reais dos pedidos
  setTimeout(() => {
    try {
      // Usa dados reais dos pedidos para cálculos
      const pedidosEntregues = this.pedidos.filter(p => p.status === 'entregue');
      const totalVendas = pedidosEntregues.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
      
      // Atualiza dados (simulação de custos baseada em 60% das vendas)
      const custosPercentual = 0.6; // 60% de custos (ajustável)
      this.financeiroData.totalVendas = totalVendas;
      this.financeiroData.totalCustos = totalVendas * custosPercentual;
      this.financeiroData.lucro = totalVendas - this.financeiroData.totalCustos;
      this.financeiroData.margemLucro = totalVendas > 0 ? 
        ((this.financeiroData.lucro / totalVendas) * 100).toFixed(1) : 0;
      
      // Atualiza estatísticas com dados reais
      this.financeiroData.stats.vendasMes = pedidosEntregues.length;
      this.financeiroData.stats.ticketMedio = pedidosEntregues.length > 0 ? 
        totalVendas / pedidosEntregues.length : 0;
      this.financeiroData.stats.clientesAtendidos = new Set(pedidosEntregues.map(p => p.cliente)).size;
      this.financeiroData.stats.pedidosCancelados = this.pedidos.filter(p => p.status === 'cancelado').length;

      this.renderFinanceiro();
      this.renderStats();
      this.renderGrafico();
      this.renderUltimosPedidos();
      
      if (btn) {
        btn.innerHTML = '🔄 Atualizar';
        btn.disabled = false;
      }
      
      this.showToast('Dados financeiros atualizados com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar financeiro:', error);
      this.showToast('Erro ao atualizar dados financeiros', 'error');
    }
  }, 1500);
};

// Renderização dos cards principais
dashboard.renderFinanceiro = function() {
  const data = this.financeiroData;
  
  // Cards principais
  const totalVendasEl = document.getElementById('totalVendas');
  const totalCustosEl = document.getElementById('totalCustos');
  const lucroEl = document.getElementById('lucro');
  const margemLucroEl = document.getElementById('margemLucro');
  
  if (totalVendasEl) totalVendasEl.textContent = this.formatarMoeda(data.totalVendas);
  if (totalCustosEl) totalCustosEl.textContent = this.formatarMoeda(data.totalCustos);
  if (lucroEl) {
    lucroEl.textContent = this.formatarMoeda(data.lucro);
    lucroEl.className = data.lucro >= 0 ? 'positive' : 'negative';
  }
  if (margemLucroEl) {
    margemLucroEl.textContent = data.margemLucro + '%';
    margemLucroEl.className = data.margemLucro >= 0 ? 'positive' : 'negative';
  }
  
  // Variações (elementos opcionais)
  const variacaoVendasEl = document.getElementById('variacaoVendas');
  const variacaoCustosEl = document.getElementById('variacaoCustos');
  const variacaoLucroEl = document.getElementById('variacaoLucro');
  
  if (variacaoVendasEl) {
    variacaoVendasEl.textContent = `${data.variacaoVendas >= 0 ? '+' : ''}${data.variacaoVendas}%`;
    variacaoVendasEl.className = data.variacaoVendas >= 0 ? 'positive' : 'negative';
  }
  
  if (variacaoCustosEl) {
    variacaoCustosEl.textContent = `${data.variacaoCustos >= 0 ? '+' : ''}${data.variacaoCustos}%`;
    variacaoCustosEl.className = data.variacaoCustos >= 0 ? 'positive' : 'negative';
  }
  
  if (variacaoLucroEl) {
    variacaoLucroEl.textContent = `${data.variacaoLucro >= 0 ? '+' : ''}${data.variacaoLucro}%`;
    variacaoLucroEl.className = data.variacaoLucro >= 0 ? 'positive' : 'negative';
  }
};

// Renderização das estatísticas
dashboard.renderStats = function() {
  const container = document.getElementById('financeiroStats');
  if (!container) return;
  
  const stats = this.financeiroData.stats;
  
  container.innerHTML = `
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">🎫</div>
        <div class="stat-info">
          <h4>Ticket Médio</h4>
          <p class="stat-value">${this.formatarMoeda(stats.ticketMedio)}</p>
          <small>Por pedido</small>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <h4>Vendas/Mês</h4>
          <p class="stat-value">${stats.vendasMes}</p>
          <small>Pedidos realizados</small>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <h4>Clientes Únicos</h4>
          <p class="stat-value">${stats.clientesAtendidos}</p>
          <small>Atendidos</small>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-info">
          <h4>Tempo Médio</h4>
          <p class="stat-value">${stats.tempoMedioPreparo}</p>
          <small>Preparação</small>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <h4>Custo Médio</h4>
          <p class="stat-value">${this.formatarMoeda(stats.custoMedio)}</p>
          <small>Por pedido</small>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-info">
          <h4>Pedidos Cancel.</h4>
          <p class="stat-value ${stats.pedidosCancelados > 5 ? 'negative' : 'positive'}">${stats.pedidosCancelados}</p>
          <small>Este mês</small>
        </div>
      </div>
    </div>
  `;
};

// Renderização do gráfico
dashboard.renderGrafico = function() {
  const container = document.getElementById('graficoPedidos');
  if (!container) return;
  
  const dados = this.financeiroData.vendasMensais;
  const maxVendas = Math.max(...dados.map(d => d.vendas)) || 1;
  
  let html = '';
  dados.forEach(item => {
    const alturaVendas = (item.vendas / maxVendas) * 100;
    const alturaCustos = (item.custos / maxVendas) * 100;
    
    html += `
      <div class="barra-container">
        <div class="barra-valor">${this.formatarMoeda(item.vendas)}</div>
        <div class="barra" style="height: ${alturaVendas}%; background: linear-gradient(to top, var(--primary), var(--primary-light))"></div>
        <div class="barra" style="height: ${alturaCustos}%; background: linear-gradient(to top, var(--danger), #ff6b6b); margin-top: 2px"></div>
        <div class="barra-label">${item.mes}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
};

// Renderização dos últimos pedidos
dashboard.renderUltimosPedidos = function() {
  const container = document.getElementById('ultimosPedidos');
  if (!container) return;
  
  // Usa os pedidos reais do sistema
  const ultimosPedidos = [...this.pedidos]
    .sort((a, b) => new Date(b.createdAt || b.data) - new Date(a.createdAt || a.data))
    .slice(0, 5);

  if (ultimosPedidos.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhum pedido recente</p>';
    return;
  }

  let html = '';
  ultimosPedidos.forEach(pedido => {
    html += `
      <div class="pedido-resumo">
        <div class="pedido-info">
          <strong>${pedido._id?.slice(-6) || 'N/A'}</strong>
          <span class="cliente">${pedido.cliente || 'Cliente'}</span>
          <small>${new Date(pedido.createdAt || pedido.data).toLocaleDateString('pt-BR')}</small>
        </div>
        <div class="pedido-detalhes">
          <span class="total">${this.formatarMoeda(pedido.total || 0)}</span>
          <span class="status ${pedido.status}">${this.formatarStatus(pedido.status)}</span>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
};

// Renderização do fluxo de caixa
dashboard.renderFluxoCaixa = function() {
  const container = document.getElementById('fluxoCaixa');
  if (!container) return;
  
  // Gera fluxo de caixa baseado nos pedidos reais
  const fluxo = this.gerarFluxoCaixa();
  
  let html = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
        <thead>
          <tr style="background: var(--light);">
            <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border);">Data</th>
            <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border);">Descrição</th>
            <th style="padding: 0.75rem; text-align: right; border-bottom: 1px solid var(--border);">Entrada</th>
            <th style="padding: 0.75rem; text-align: right; border-bottom: 1px solid var(--border);">Saída</th>
            <th style="padding: 0.75rem; text-align: right; border-bottom: 1px solid var(--border);">Saldo</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  fluxo.forEach(item => {
    html += `
      <tr>
        <td style="padding: 0.75rem; border-bottom: 1px solid var(--border);">${item.data}</td>
        <td style="padding: 0.75rem; border-bottom: 1px solid var(--border);">${item.descricao}</td>
        <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid var(--border); color: var(--success);">
          ${item.entrada > 0 ? this.formatarMoeda(item.entrada) : '-'}
        </td>
        <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid var(--border); color: var(--danger);">
          ${item.saida > 0 ? this.formatarMoeda(item.saida) : '-'}
        </td>
        <td style="padding: 0.75rem; text-align: right; border-bottom: 1px solid var(--border); font-weight: bold; color: ${item.saldo >= 0 ? 'var(--success)' : 'var(--danger)'};">
          ${this.formatarMoeda(item.saldo)}
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = html;
};

// Gera fluxo de caixa baseado nos pedidos
dashboard.gerarFluxoCaixa = function() {
  const pedidosEntregues = this.pedidos.filter(p => p.status === 'entregue');
  const fluxo = [];
  let saldo = 0;
  
  // Agrupa por data
  const pedidosPorData = {};
  pedidosEntregues.forEach(pedido => {
    const data = new Date(pedido.createdAt || pedido.data).toLocaleDateString('pt-BR');
    if (!pedidosPorData[data]) {
      pedidosPorData[data] = 0;
    }
    pedidosPorData[data] += parseFloat(pedido.total) || 0;
  });
  
  // Cria entradas de vendas
  Object.entries(pedidosPorData).forEach(([data, total]) => {
    saldo += total;
    fluxo.push({
      data: data,
      descricao: 'Vendas do dia',
      entrada: total,
      saida: 0,
      saldo: saldo
    });
  });
  
  // Adiciona algumas saídas simuladas (custos)
  if (fluxo.length > 0) {
    const custoDiario = saldo * 0.6 / fluxo.length; // 60% dos custos distribuídos
    fluxo.forEach(item => {
      if (item.entrada > 0) {
        saldo -= custoDiario;
        fluxo.push({
          data: item.data,
          descricao: 'Custos operacionais',
          entrada: 0,
          saida: custoDiario,
          saldo: saldo
        });
      }
    });
  }
  
  return fluxo.sort((a, b) => new Date(a.data.split('/').reverse().join('-')) - new Date(b.data.split('/').reverse().join('-')));
};

// Exportação de relatório
dashboard.exportarRelatorio = function() {
  this.showToast('Gerando relatório financeiro...', 'info');
  
  setTimeout(() => {
    try {
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(this.gerarCSV());
      const link = document.createElement('a');
      link.href = dataStr;
      link.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      this.showToast('Relatório exportado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      this.showToast('Erro ao exportar relatório', 'error');
    }
  }, 1000);
};

// Geração de CSV para relatório
dashboard.gerarCSV = function() {
  const data = this.financeiroData;
  let csv = 'Relatório Financeiro - Artesanal Blend\n\n';
  csv += `Período: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
  csv += 'Métrica,Valor\n';
  csv += `Total Vendas,${data.totalVendas}\n`;
  csv += `Total Custos,${data.totalCustos}\n`;
  csv += `Lucro Líquido,${data.lucro}\n`;
  csv += `Margem de Lucro,${data.margemLucro}%\n`;
  csv += `Ticket Médio,${data.stats.ticketMedio}\n`;
  csv += `Vendas no Mês,${data.stats.vendasMes}\n`;
  csv += `Clientes Atendidos,${data.stats.clientesAtendidos}\n`;
  csv += `Pedidos Cancelados,${data.stats.pedidosCancelados}\n`;
  return csv;
};

// Utilitários para o financeiro
dashboard.formatarMoeda = function(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

dashboard.formatarStatus = function(status) {
  const statusMap = {
    'entregue': 'Entregue',
    'pronto': 'Pronto',
    'preparando': 'Preparando',
    'pendente': 'Pendente',
    'cancelado': 'Cancelado'
  };
  return statusMap[status] || status;
};

// Inicialização automática quando a aba financeiro for ativada
document.addEventListener('DOMContentLoaded', function() {
  const financeiroTab = document.getElementById('financeiroTab');
  if (financeiroTab) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (financeiroTab.classList.contains('active')) {
            dashboard.initFinanceiro();
          }
        }
      });
    });
    
    observer.observe(financeiroTab, { attributes: true });
  }
});
