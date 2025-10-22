// dashboard.js

async function login(username, password) {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) throw new Error("Usuário ou senha inválidos");

    const data = await response.json();
    localStorage.setItem("token", data.token);
    window.location.href = "/dashboard.html";
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById("btnLogin")?.addEventListener("click", () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  login(username, password);
});

class Dashboard {
  constructor() {
    this.produtos = [];
    this.pedidos = [];
    this.insumos = [];
    this.token = localStorage.getItem("token") || "";
    this.init();
  }

  async init() {
    await this.carregarDados();
    this.setupEventListeners();
    this.renderProdutos();
    this.renderInsumos();
    this.renderPedidos();
    this.updateFinanceiro();
  }

  async fetchAPI(url, options = {}) {
    options.headers = { ...(options.headers || {}), Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" };
    const res = await fetch(url, options);
    if (!res.ok) throw new Error("Erro na requisição");
    return res.json();
  }

  async carregarDados() {
    try {
      this.showToast("Carregando dados...", "info", 800);
      const [produtosRes, pedidosRes, insumosRes] = await Promise.all([
        this.fetchAPI("/api/produtos").catch(() => []),
        this.fetchAPI("/api/pedidos").catch(() => []),
        this.fetchAPI("/api/insumos").catch(() => []),
      ]);

      this.produtos = produtosRes || [];
      this.pedidos = pedidosRes || [];
      this.insumos = insumosRes || [];
    } catch (err) {
      console.error("Erro ao carregar dados", err);
      this.showToast("Erro ao carregar dados", "error");
    }
  }

  setupEventListeners() {
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab)?.classList.add("active");
      });
    });
  }

  /* ================= PRODUTOS ================= */
  abrirModalProduto(produto = {}) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal">
        <h3>${produto.nome ? "Editar" : "Novo"} Produto</h3>
        <form id="formProduto">
          <input type="hidden" id="produtoId" value="${produto._id || ""}">
          <label>Nome</label><input type="text" id="produtoNome" value="${produto.nome || ""}" required>
          <label>Categoria</label>
          <select id="produtoCategoria" required>
            <option value="">Selecione...</option>
            <option value="Hambúrgueres" ${produto.categoria === "Hambúrgueres" ? "selected" : ""}>Hambúrgueres</option>
            <option value="Combos" ${produto.categoria === "Combos" ? "selected" : ""}>Combos</option>
            <option value="Acompanhamentos" ${produto.categoria === "Acompanhamentos" ? "selected" : ""}>Acompanhamentos</option>
            <option value="Adicionais" ${produto.categoria === "Adicionais" ? "selected" : ""}>Adicionais</option>
            <option value="Bebidas" ${produto.categoria === "Bebidas" ? "selected" : ""}>Bebidas</option>
          </select>
          <label>Preço (R$)</label><input type="number" id="produtoPreco" step="0.01" value="${produto.preco || 0}" required>
          <label>URL da Imagem</label><input type="text" id="produtoImagem" value="${produto.imagem || ""}">
          <label>Descrição</label><textarea id="produtoDescricao">${produto.descricao || ""}</textarea>
          <label><input type="checkbox" id="produtoDisponivel" ${produto.disponivel !== false ? "checked" : ""}> Disponível</label>
          <div style="display:flex;gap:.5rem;margin-top:.5rem">
            <button type="submit" class="btn primary">Salvar</button>
            <button type="button" class="btn secondary" id="btnCancelarProduto">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#btnCancelarProduto").addEventListener("click", () => modal.remove());
    modal.querySelector("#formProduto").addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.salvarProduto();
    });

    // Preenche modal para edição usando dataset
    this.modalAtual = modal;
  }

  async salvarProduto() {
    const formData = {
      nome: document.getElementById("produtoNome").value,
      categoria: document.getElementById("produtoCategoria").value,
      preco: parseFloat(document.getElementById("produtoPreco").value) || 0,
      descricao: document.getElementById("produtoDescricao").value,
      imagem: document.getElementById("produtoImagem").value,
      disponivel: document.getElementById("produtoDisponivel").checked,
    };

    const produtoId = document.getElementById("produtoId").value;
    const url = produtoId ? `/api/produtos/${produtoId}` : "/api/produtos";
    const method = produtoId ? "PUT" : "POST";

    try {
      await this.fetchAPI(url, { method, body: JSON.stringify(formData) });
      await this.carregarDados();
      this.renderProdutos();
      this.modalAtual?.remove();
      this.showToast("Produto salvo", "success");
    } catch (err) {
      console.error(err);
      this.showToast("Erro ao salvar produto", "error");
    }
  }

  renderProdutos() {
    const container = document.getElementById("produtosContainer");
    if (!container) return;
    if (!this.produtos.length) {
      container.innerHTML = "<div class='empty-state'>Nenhum produto cadastrado</div>";
      return;
    }

    container.innerHTML = this.produtos
      .map((p) => {
        const id = p._id || p.id || "";
        return `
        <article class="produto-card ${!p.disponivel ? "indisponivel" : ""}">
          <h3>${p.nome}</h3>
          <div>R$ ${p.preco?.toFixed(2) || 0}</div>
          <div>${p.descricao || ""}</div>
          <div class="card-actions">
            <button onclick="dashboard.abrirModalProduto(${encodeURIComponent(JSON.stringify(p))})">Editar</button>
            <button onclick="dashboard.toggleDisponibilidade('${id}')">${p.disponivel ? "Pausar" : "Ativar"}</button>
            <button onclick="dashboard.excluirProduto('${id}')">Excluir</button>
          </div>
        </article>`;
      })
      .join("");
  }

  async toggleDisponibilidade(id) {
    try {
      const produto = this.produtos.find((p) => (p._id || p.id) === id);
      if (!produto) return;
      await this.fetchAPI(`/api/produtos/${id}`, {
        method: "PUT",
        body: JSON.stringify({ disponivel: !produto.disponivel }),
      });
      produto.disponivel = !produto.disponivel;
      this.renderProdutos();
      this.showToast("Disponibilidade atualizada", "success");
    } catch (e) {
      this.showToast("Erro ao atualizar disponibilidade", "error");
    }
  }

  async excluirProduto(id) {
    if (!confirm("Deseja excluir este produto?")) return;
    try {
      await this.fetchAPI(`/api/produtos/${id}`, { method: "DELETE" });
      this.produtos = this.produtos.filter((p) => (p._id || p.id) !== id);
      this.renderProdutos();
      this.showToast("Produto excluído", "success");
    } catch (e) {
      this.showToast("Erro ao excluir produto", "error");
    }
  }

  /* ================= INSUMOS ================= */
  abrirModalInsumo(insumo = {}) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal">
        <h3>${insumo.nome ? "Editar" : "Novo"} Insumo</h3>
        <form id="formInsumo">
          <input type="hidden" id="insumoId" value="${insumo._id || ""}">
          <label>Nome</label><input type="text" id="insumoNome" value="${insumo.nome || ""}" required>
          <label>Quantidade</label><input type="number" id="insumoQuantidade" value="${insumo.quantidade || 0}" required>
          <label>Unidade</label>
          <select id="insumoUnidade">
            <option value="g" ${insumo.unidade === "g" ? "selected" : ""}>g</option>
            <option value="ml" ${insumo.unidade === "ml" ? "selected" : ""}>ml</option>
            <option value="un" ${insumo.unidade === "un" ? "selected" : ""}>un</option>
            <option value="kg" ${insumo.unidade === "kg" ? "selected" : ""}>kg</option>
            <option value="l" ${insumo.unidade === "l" ? "selected" : ""}>l</option>
          </select>
          <label>Preço Unitário (R$)</label><input type="number" id="insumoPreco" step="0.01" value="${insumo.preco || 0}" required>
          <div style="margin-top:0.5rem">
            <button type="submit" class="btn primary">Salvar</button>
            <button type="button" class="btn secondary" id="btnCancelarInsumo">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("#btnCancelarInsumo").addEventListener("click", () => modal.remove());
    modal.querySelector("#formInsumo").addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.salvarInsumo();
    });
    this.modalAtual = modal;
  }

  async salvarInsumo() {
    const formData = {
      nome: document.getElementById("insumoNome").value,
      quantidade: parseInt(document.getElementById("insumoQuantidade").value) || 0,
      unidade: document.getElementById("insumoUnidade").value,
      preco: parseFloat(document.getElementById("insumoPreco").value) || 0,
    };
    const insumoId = document.getElementById("insumoId").value;
    const url = insumoId ? `/api/insumos/${insumoId}` : "/api/insumos";
    const method = insumoId ? "PUT" : "POST";
    try {
      await this.fetchAPI(url, { method, body: JSON.stringify(formData) });
      await this.carregarDados();
      this.renderInsumos();
      this.modalAtual?.remove();
      this.showToast("Insumo salvo", "success");
    } catch (e) {
      this.showToast("Erro ao salvar insumo", "error");
    }
  }

  renderInsumos() {
    const container = document.getElementById("insumosContainer");
    if (!container) return;
    if (!this.insumos.length) {
      container.innerHTML = "<div class='empty-state'>Nenhum insumo cadastrado</div>";
      return;
    }
    container.innerHTML = this.insumos
      .map((i) => {
        const id = i._id || i.id || "";
        return `<div class="produto-card">
          <h3>${i.nome}</h3>
          <div>${i.quantidade} ${i.unidade}</div>
          <div>R$ ${i.preco.toFixed(2)}/${i.unidade}</div>
          <div class="card-actions">
            <button onclick="dashboard.abrirModalInsumo(${encodeURIComponent(JSON.stringify(i))})">Editar</button>
            <button onclick="dashboard.excluirInsumo('${id}')">Excluir</button>
          </div>
        </div>`;
      })
      .join("");
  }

  async excluirInsumo(id) {
    if (!confirm("Deseja excluir este insumo?")) return;
    try {
      await this.fetchAPI(`/api/insumos/${id}`, { method: "DELETE" });
      this.insumos = this.insumos.filter((i) => (i._id || i.id) !== id);
      this.renderInsumos();
      this.showToast("Insumo excluído", "success");
    } catch (e) {
      this.showToast("Erro ao excluir insumo", "error");
    }
  }

  /* ================= TOAST ================= */
  showToast(msg, tipo = "success", tempo = 2500) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const t = document.createElement("div");
    t.className = `toast ${tipo}`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 400);
    }, tempo);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new Dashboard();
});
