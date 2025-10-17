// SUBSTITUA esta rota:
app.get('/', (req, res) => {
  res.json({ 
    message: '🍔 Artesanal Blend API Online!',
    status: 'Operacional',
    database: mongoose.connection.readyState === 1 ? 'Conectado ao MongoDB' : 'Modo offline',
    endpoints: {
      menu: '/api/menu',
      health: '/health',
      dashboard: '/dashboard'
    }
  });
});

// POR ESTA:
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Artesanal Blend - API</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 40px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          margin: 0;
          color: white;
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: rgba(255,255,255,0.1);
          padding: 40px; 
          border-radius: 20px;
          backdrop-filter: blur(10px);
          text-align: center;
        }
        h1 { 
          font-size: 3em; 
          margin-bottom: 20px;
        }
        .links { 
          margin: 30px 0; 
        }
        .link-btn { 
          display: inline-block; 
          background: white; 
          color: #667eea; 
          padding: 15px 30px; 
          margin: 10px; 
          border-radius: 50px; 
          text-decoration: none; 
          font-weight: bold;
          transition: transform 0.3s;
        }
        .link-btn:hover { 
          transform: translateY(-5px); 
        }
        .status { 
          background: rgba(255,255,255,0.2); 
          padding: 15px; 
          border-radius: 10px; 
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🍔 Artesanal Blend</h1>
        <p style="font-size: 1.2em;">Sistema de Cardápio Online</p>
        
        <div class="status">
          <strong>Status:</strong> ✅ Online &nbsp; | &nbsp;
          <strong>Banco:</strong> ${mongoose.connection.readyState === 1 ? '✅ Conectado' : '⚠️ Offline'}
        </div>

        <div class="links">
          <a href="/dashboard" class="link-btn">📊 Dashboard Admin</a>
          <a href="/api/menu" class="link-btn">📋 Ver Cardápio (API)</a>
          <a href="/health" class="link-btn">❤️ Status do Sistema</a>
        </div>

        <div style="margin-top: 40px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px;">
          <h3>🚀 Links Rápidos</h3>
          <p>
            <a href="/dashboard" style="color: white;">/dashboard</a> - Área administrativa<br>
            <a href="/api/menu" style="color: white;">/api/menu</a> - API do cardápio<br>
            <a href="/health" style="color: white;">/health</a> - Status do serviço
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});
