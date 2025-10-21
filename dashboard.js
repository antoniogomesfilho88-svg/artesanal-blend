/* ========================================================================= */
/* === CSS COMPLETO DO DASHBOARD INTEGRADO ================================ */
/* ========================================================================= */

:root {
    --primary: #3498db;
    --primary-dark: #2980b9;
    --secondary: #2c3e50;
    --success: #27ae60;
    --warning: #f39c12;
    --danger: #e74c3c;
    --info: #17a2b8;
    --light: #f8f9fa;
    --dark: #343a40;
    --gray: #6c757d;
    --radius: 8px;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    --transition: all 0.3s ease;
}

/* Reset e Base */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f5f7fa;
    color: var(--dark);
    line-height: 1.6;
}

/* Container Principal */
#dashboard {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
}

/* Header do Dashboard */
.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding: 20px;
    background: white;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
}

.dashboard-header h2 {
    color: var(--secondary);
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    gap: 10px;
}

.dashboard-header h2 i {
    color: var(--primary);
}

.header-controls {
    display: flex;
    gap: 15px;
    align-items: center;
}

/* Filtros e Botões */
.form-control {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: var(--radius);
    font-size: 0.9rem;
    min-width: 150px;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: var(--radius);
    font-size: 0.9rem;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    font-weight: 500;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-dark);
}

.btn-success {
    background: var(--success);
    color: white;
}

.btn-warning {
    background: var(--warning);
    color: white;
}

.btn-info {
    background: var(--info);
    color: white;
}

.btn-danger {
    background: var(--danger);
    color: white;
}

.btn-sm {
    padding: 6px 12px;
    font-size: 0.8rem;
}

/* Grid de Cards */
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.card-grid.secondary {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

/* Cards Principais */
.card {
    background: white;
    border-radius: var(--radius);
    padding: 20px;
    box-shadow: var(--shadow);
    transition: var(--transition);
    border-left: 4px solid transparent;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.card.success {
    border-left-color: var(--success);
}

.card.info {
    border-left-color: var(--info);
}

.card.warning {
    border-left-color: var(--warning);
}

.card.primary {
    border-left-color: var(--primary);
}

.card.danger {
    border-left-color: var(--danger);
}

.card-icon {
    font-size: 2rem;
    margin-bottom: 15px;
    opacity: 0.8;
}

.card.success .card-icon { color: var(--success); }
.card.info .card-icon { color: var(--info); }
.card.warning .card-icon { color: var(--warning); }
.card.primary .card-icon { color: var(--primary); }
.card.danger .card-icon { color: var(--danger); }

.card-content {
    flex: 1;
}

.card-title {
    font-size: 0.9rem;
    color: var(--gray);
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.card-value {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 5px;
    color: var(--secondary);
}

.card-subtitle {
    font-size: 0.9rem;
    color: var(--gray);
    margin-bottom: 10px;
}

.card-trend {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
    font-weight: 600;
}

.card-trend.positive {
    color: var(--success);
}

.card-trend.negative {
    color: var(--danger);
}

.card-actions {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
}

/* Container de Gráficos */
.charts-container {
    margin-bottom: 30px;
}

.chart-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.chart-card {
    background: white;
    border-radius: var(--radius);
    padding: 20px;
    box-shadow: var(--shadow);
}

.chart-card h3 {
    color: var(--secondary);
    margin-bottom: 15px;
    font-size: 1.1rem;
    font-weight: 600;
}

/* Status dos Pedidos */
.orders-status {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 15px;
    background: var(--light);
    border-radius: var(--radius);
    transition: var(--transition);
}

.status-item:hover {
    background: #e9ecef;
}

.status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.status-dot.pending { background: var(--warning); }
.status-dot.preparing { background: var(--info); }
.status-dot.ready { background: var(--success); }
.status-dot.delivered { background: var(--primary); }

.status-label {
    flex: 1;
    font-weight: 500;
    color: var(--dark);
}

.status-value {
    font-weight: bold;
    color: var(--secondary);
    font-size: 1.1rem;
}

/* Estatísticas de Entrega */
.delivery-stats {
    background: var(--light);
    padding: 20px;
    border-radius: var(--radius);
}

.delivery-stats h4 {
    margin-bottom: 15px;
    color: var(--primary);
    font-size: 1rem;
    font-weight: 600;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #dee2e6;
}

.stat-item:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

/* Pedidos Recentes */
.recent-orders {
    margin-top: 30px;
    background: white;
    padding: 25px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.section-header h3 {
    color: var(--secondary);
    font-size: 1.3rem;
}

.orders-table {
    background: var(--light);
    border-radius: var(--radius);
    overflow: hidden;
}

.order-row {
    display: grid;
    grid-template-columns: 80px 1fr 100px 100px 120px 100px;
    gap: 15px;
    padding: 15px;
    border-bottom: 1px solid #dee2e6;
    align-items: center;
    transition: var(--transition);
}

.order-row:not(.header):hover {
    background: white;
}

.order-row:last-child {
    border-bottom: none;
}

.order-row.header {
    background: var(--primary);
    color: white;
    font-weight: bold;
    padding: 12px 15px;
}

.order-id {
    font-weight: bold;
    color: var(--primary);
    font-family: 'Courier New', monospace;
}

.order-customer {
    display: flex;
    flex-direction: column;
}

.customer-name {
    font-weight: 600;
    color: var(--dark);
}

.customer-phone {
    font-size: 0.8rem;
    color: var(--gray);
}

.order-value {
    font-weight: bold;
    color: var(--success);
}

.order-type {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.type-delivery { 
    background: #e3f2fd; 
    color: var(--info); 
}

.type-pickup { 
    background: #e8f5e8; 
    color: var(--success); 
}

.order-status {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-pending { 
    background: #fff3cd; 
    color: #856404; 
}

.status-preparing { 
    background: #d1ecf1; 
    color: #0c5460; 
}

.status-ready { 
    background: #d4edda; 
    color: #155724; 
}

.status-delivered { 
    background: #e2e3e5; 
    color: #383d41; 
}

.order-time {
    font-family: 'Courier New', monospace;
    color: var(--gray);
    font-size: 0.9rem;
}

/* Alertas */
.alerts-container {
    background: white;
    padding: 25px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    margin-top: 30px;
}

.alerts-container h3 {
    color: var(--secondary);
    margin-bottom: 20px;
    font-size: 1.3rem;
}

.alerts-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.alert-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border-radius: var(--radius);
    border-left: 4px solid transparent;
    background: var(--light);
    transition: var(--transition);
}

.alert-item:hover {
    transform: translateX(5px);
}

.alert-item.danger {
    border-left-color: var(--danger);
    background: #fde8e8;
}

.alert-item.warning {
    border-left-color: var(--warning);
    background: #fff3cd;
}

.alert-item.info {
    border-left-color: var(--info);
    background: #d1ecf1;
}

.alert-item.success {
    border-left-color: var(--success);
    background: #d4edda;
}

.alert-icon {
    font-size: 1.5rem;
    width: 40px;
    text-align: center;
}

.alert-item.danger .alert-icon { color: var(--danger); }
.alert-item.warning .alert-icon { color: var(--warning); }
.alert-item.info .alert-icon { color: var(--info); }
.alert-item.success .alert-icon { color: var(--success); }

.alert-content {
    flex: 1;
}

.alert-title {
    font-weight: 600;
    margin-bottom: 5px;
    color: var(--dark);
}

.alert-description {
    font-size: 0.9rem;
    color: var(--gray);
}

/* Responsividade */
@media (max-width: 1200px) {
    .chart-row {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    #dashboard {
        padding: 15px;
    }
    
    .dashboard-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
    
    .header-controls {
        flex-direction: column;
        width: 100%;
    }
    
    .form-control, .btn {
        width: 100%;
        justify-content: center;
    }
    
    .card-grid {
        grid-template-columns: 1fr;
    }
    
    .order-row {
        grid-template-columns: 1fr;
        gap: 10px;
        text-align: center;
        padding: 15px 10px;
    }
    
    .order-row.header {
        display: none;
    }
    
    .order-customer {
        align-items: center;
    }
    
    .stat-item {
        flex-direction: column;
        text-align: center;
        gap: 5px;
    }
}

@media (max-width: 480px) {
    .dashboard-header h2 {
        font-size: 1.4rem;
    }
    
    .card-value {
        font-size: 1.5rem;
    }
    
    .chart-card {
        padding: 15px;
    }
}

/* Animações */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.card, .chart-card, .recent-orders, .alerts-container {
    animation: fadeIn 0.6s ease-out;
}

/* Scroll personalizado */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
    background: var(--primary);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--primary-dark);
}
