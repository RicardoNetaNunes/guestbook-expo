(function () {
  const api = window.GuestbookCommon;
  const list = document.querySelector("#admin-list");
  const statusBox = document.querySelector("#admin-status");
  const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
  const authCard = document.querySelector("#auth-card");
  const sessionCard = document.querySelector("#session-card");
  const moderationPanel = document.querySelector("#moderation-panel");
  const loginForm = document.querySelector("#admin-login-form");
  const loginButton = document.querySelector("#login-button");
  const authStatus = document.querySelector("#auth-status");
  const logoutButton = document.querySelector("#logout-button");
  const sessionTitle = document.querySelector("#session-title");
  const sessionCopy = document.querySelector("#session-copy");
  let activeStatus = "pending";
  let supabase = null;

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeStatus = button.dataset.status;
      for (const tab of tabButtons) {
        const isActive = tab === button;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
      }
      loadEntries();
    });
  });

  init();

  async function init() {
    if (!api.isConfigured()) {
      setAuthStatus("Falta configurar o Supabase em config.js antes de usar a moderacao.", "error");
      loginButton.disabled = true;
      return;
    }

    supabase = api.createClient();
    loginForm.addEventListener("submit", handleLogin);
    logoutButton.addEventListener("click", handleLogout);

    const { data } = await supabase.auth.getSession();
    await syncSession(data.session || null);

    supabase.auth.onAuthStateChange(async (_event, session) => {
      await syncSession(session);
    });
  }

  async function loadEntries() {
    setStatus("A carregar mensagens...", "success");

    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("id, comment, mood, name, status, created_at, moderated_at")
        .eq("status", activeStatus)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const entries = data || [];
      renderEntries(entries);
      setStatus(`${entries.length} mensagem(ns) em ${translateStatus(activeStatus)}.`, "success");
    } catch (error) {
      setStatus(api.humanizeError(error, "Nao foi possivel carregar as mensagens."), "error");
    }
  }

  function renderEntries(entries) {
    list.innerHTML = "";

    if (!entries.length) {
      list.innerHTML = `
        <article class="card entry-card">
          <h3>Sem mensagens ${translateStatus(activeStatus)} neste momento.</h3>
          <p class="entry-comment">A fila de moderacao esta tranquila por agora.</p>
        </article>
      `;
      return;
    }

    entries.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "card entry-card";
      card.innerHTML = `
        <div class="entry-head">
          <strong class="entry-nickname"></strong>
          <span class="entry-mood"></span>
        </div>
        <p class="entry-comment"></p>
        <div class="admin-meta">
          <span class="entry-status"></span>
          <span class="entry-created"></span>
          <span class="entry-moderated"></span>
        </div>
      `;
      card.querySelector(".entry-nickname").textContent = entry.name;
      card.querySelector(".entry-mood").textContent = entry.mood;
      card.querySelector(".entry-comment").textContent = entry.comment;
      card.querySelector(".entry-status").textContent = `Estado: ${translateStatus(entry.status)}`;
      card.querySelector(".entry-created").textContent = `Criada: ${api.formatDateTime(entry.created_at)}`;
      card.querySelector(".entry-moderated").textContent = `Moderada: ${
        entry.moderated_at ? api.formatDateTime(entry.moderated_at) : "Ainda nao"
      }`;

      const actions = buildActions(entry.id);
      if (actions) {
        card.appendChild(actions);
      }

      list.appendChild(card);
    });
  }

  async function moderate(id, action, ...buttons) {
    buttons.forEach((button) => {
      button.disabled = true;
    });
    setStatus(`A atualizar a mensagem #${id}...`, "success");

    try {
      const nextStatus = action === "approve" ? "approved" : "rejected";
      const { data, error } = await supabase
        .from("feedback")
        .update({
          status: nextStatus,
          moderated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select("id, status")
        .single();

      if (error) {
        throw error;
      }

      setStatus(`Mensagem #${id} marcada como ${translateStatus(data.status)}.`, "success");
      loadEntries();
    } catch (error) {
      setStatus(api.humanizeError(error, "Nao foi possivel atualizar a moderacao."), "error");
      buttons.forEach((button) => {
        button.disabled = false;
      });
    }
  }

  function setStatus(message, type) {
    statusBox.textContent = message;
    statusBox.className = `status ${type}`;
  }

  function buildActions(id) {
    if (!["pending", "approved", "rejected"].includes(activeStatus)) {
      return null;
    }

    const actions = document.createElement("div");
    actions.className = "admin-actions";
    const buttons = [];

    if (activeStatus === "pending") {
      buttons.push(makeActionButton(id, "approve", "Aprovar", "approve"));
      buttons.push(makeActionButton(id, "reject", "Rejeitar", "reject"));
    } else if (activeStatus === "approved") {
      buttons.push(makeActionButton(id, "reject", "Rejeitar", "reject"));
    } else if (activeStatus === "rejected") {
      buttons.push(makeActionButton(id, "approve", "Aprovar", "approve"));
    }

    actions.append(...buttons);
    return actions;
  }

  function makeActionButton(id, action, label, variant) {
    const button = document.createElement("button");
    button.className = `action-button ${variant}`;
    button.textContent = label;
    button.addEventListener("click", () => moderate(id, action, ...Array.from(button.parentElement.children)));
    return button;
  }

  async function handleLogin(event) {
    event.preventDefault();
    loginButton.disabled = true;
    setAuthStatus("A autenticar...", "success");

    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      loginButton.disabled = false;
      setAuthStatus("Preenche email e password para entrar.", "error");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }

      loginForm.reset();
      setAuthStatus("Sessao iniciada com sucesso.", "success");
    } catch (error) {
      setAuthStatus(api.humanizeError(error, "Nao foi possivel iniciar sessao."), "error");
    } finally {
      loginButton.disabled = false;
    }
  }

  async function handleLogout() {
    logoutButton.disabled = true;
    try {
      await supabase.auth.signOut();
      setStatus("Sessao terminada.", "success");
    } finally {
      logoutButton.disabled = false;
    }
  }

  async function syncSession(session) {
    const isAuthenticated = Boolean(session && session.user);
    authCard.classList.toggle("hidden", isAuthenticated);
    sessionCard.classList.toggle("hidden", !isAuthenticated);
    moderationPanel.classList.toggle("hidden", !isAuthenticated);

    if (!isAuthenticated) {
      sessionTitle.textContent = "Sem sessao ativa";
      sessionCopy.textContent = "Inicia sessao para veres e moderar as mensagens.";
      list.innerHTML = "";
      statusBox.className = "status hidden";
      return;
    }

    sessionTitle.textContent = "Admin autenticado";
    sessionCopy.textContent = `Ligado como ${session.user.email}. Se esta conta nao estiver na lista de admins do Supabase, a moderacao sera bloqueada pelas politicas RLS.`;
    await loadEntries();
  }

  function setAuthStatus(message, type) {
    authStatus.textContent = message;
    authStatus.className = `status ${type}`;
  }

  function translateStatus(status) {
    if (status === "pending") {
      return "pendente";
    }
    if (status === "approved") {
      return "aprovada";
    }
    if (status === "rejected") {
      return "rejeitada";
    }

    return status;
  }
})();
