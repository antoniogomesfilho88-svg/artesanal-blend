// ========== DASHBOARD ADMIN ==========

// Servir página do dashboard
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard - Artesanal Blend</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        h1 { color: #333; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; }
        button { background: #FF6B6B; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #e55a5a; }
        .product-list { margin-top: 30px; }
        .product-item { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🍔 Dashboard Artesanal Blend</h1>
        
        <div class="form-group">
          <h3>Adicionar Novo Produto</h3>
          <form id="productForm">
            <label>Nome:</label>
            <input type="text" id="name" required>
            
            <label>Descrição:</label>
            <textarea id="desc" required></textarea>
            
            <label>Preço:</label>
            <input type="number" id="price" step="0.01" required>
            
            <label>Categoria:</label>
            <select id="cat" required>
              <option value="">Selecione...</option>
              <option value="Hambúrgueres">Hambúrgueres</option>
              <option value="Combos">Combos</option>
              <option value="Acompanhamentos">Acompanhamentos</option>
              <option value="Adicionais">Adicionais</option>
              <option value="Bebidas">Bebidas</option>
            </select>
            
            <label>URL da Imagem (opcional):</label>
            <input type="text" id="imgUrl" placeholder="https://exemplo.com/imagem.jpg">
            
            <button type="submit">Adicionar Produto</button>
          </form>
        </div>

        <div class="product-list">
          <h3>Produtos Cadastrados</h3>
          <button onclick="loadProducts()">🔄 Atualizar Lista</button>
          <div id="productsContainer"></div>
        </div>
      </div>

      <script>
        // Adicionar produto
        document.getElementById('productForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const productData = {
            name: document.getElementById('name').value,
            desc: document.getElementById('desc').value,
            price: parseFloat(document.getElementById('price').value),
            cat: document.getElementById('cat').value,
            imgUrl: document.getElementById('imgUrl').value
          };

          try {
            const response = await fetch('/api/produtos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(productData)
            });

            if (response.ok) {
              alert('Produto adicionado com sucesso!');
              document.getElementById('productForm').reset();
              loadProducts();
            } else {
              alert('Erro ao adicionar produto');
            }
          } catch (error) {
            alert('Erro de conexão');
          }
        });

        // Carregar produtos
        async function loadProducts() {
          try {
            const response = await fetch('/api/menu');
            const products = await response.json();
            
            const container = document.getElementById('productsContainer');
            container.innerHTML = '';
            
            products.forEach(product => {
              const productDiv = document.createElement('div');
              productDiv.className = 'product-item';
              productDiv.innerHTML = \`
                <strong>\${product.name}</strong> - R$ \${product.price.toFixed(2)}
                <br><small>\${product.desc}</small>
                <br><small>Categoria: \${product.cat}</small>
                <button onclick="deleteProduct(\${product.id})" style="background: red; margin-left: 10px;">Deletar</button>
              \`;
              container.appendChild(productDiv);
            });
          } catch (error) {
            console.error('Erro ao carregar produtos:', error);
          }
        }

        // Deletar produto
        async function deleteProduct(id) {
          if (confirm('Tem certeza que deseja deletar este produto?')) {
            try {
              const response = await fetch(\`/api/produtos/\${id}\`, {
                method: 'DELETE'
              });

              if (response.ok) {
                alert('Produto deletado com sucesso!');
                loadProducts();
              } else {
                alert('Erro ao deletar produto');
              }
            } catch (error) {
              alert('Erro de conexão');
            }
          }
        }

        // Carregar produtos ao abrir a página
        loadProducts();
      </script>
    </body>
    </html>
  `);
});
