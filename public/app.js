(function () {
  const api = window.GuestbookCommon;
  const moods = api.moods;
  const placeholders = [
    "O que te surpreendeu mais neste Dia da Multimédia?",
    "Deixa uma frase sobre o momento mais criativo que viste.",
    "Que detalhe da exposicao te ficou na memoria?",
    "Partilha uma ideia antes que a inspiracao fuja."
  ];

  const form = document.querySelector("#feedback-form");
  const moodOptions = document.querySelector("#mood-options");
  const commentInput = document.querySelector("#comment");
  const nameInput = document.querySelector("#name");
  const charCount = document.querySelector("#char-count");
  const formError = document.querySelector("#form-error");
  const formSuccess = document.querySelector("#form-success");
  const submitButton = document.querySelector("#submit-button");
  const formCard = document.querySelector("#form-card");
  const feed = document.querySelector("#feed");
  const feedEmpty = document.querySelector("#feed-empty");
  const refreshButton = document.querySelector("#refresh-button");
  const statsCount = document.querySelector("#stats-count");
  const statsBars = document.querySelector("#stats-bars");

  let selectedMood = "";
  let isSubmitting = false;
  let supabase = null;

  init();

  function init() {
    if (!api.isConfigured()) {
      showError("Falta configurar o Supabase em config.js antes de publicar o mural.");
      feed.innerHTML = '<article class="card entry-card"><p class="entry-comment">Configura o projeto no Supabase e volta a carregar esta pagina.</p></article>';
      statsCount.textContent = "0";
      return;
    }

    supabase = api.createClient();
    renderMoodOptions();
    commentInput.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
    commentInput.addEventListener("input", updateCharacterCount);
    form.addEventListener("submit", handleSubmit);
    refreshButton.addEventListener("click", () => {
      loadFeed();
      loadStats();
    });

    updateCharacterCount();
    loadFeed();
    loadStats();
    window.setInterval(loadFeed, 20000);
    window.setInterval(loadStats, 20000);
  }

  function renderMoodOptions() {
    moods.forEach((mood) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mood-option";
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", "false");
      button.setAttribute("aria-label", `Estado de espirito ${mood}`);
      button.innerHTML = `<span aria-hidden="true">${mood}</span><small>Escolher</small>`;
      button.addEventListener("click", () => selectMood(mood, button));
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectMood(mood, button);
        }
      });
      moodOptions.appendChild(button);
    });
  }

  function selectMood(mood, button) {
    selectedMood = mood;
    for (const option of moodOptions.children) {
      option.classList.remove("selected");
      option.setAttribute("aria-checked", "false");
    }
    button.classList.add("selected");
    button.setAttribute("aria-checked", "true");
    hideMessage(formError);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const comment = commentInput.value.trim();
    const name = nameInput.value.trim();

    if (!name) {
      return showError("Escreve o teu nome para enviar a mensagem.");
    }

    if (!comment) {
      return showError("Escreve uma mensagem antes de enviar.");
    }

    if (!selectedMood) {
      return showError("Escolhe primeiro o teu estado de espirito.");
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "A enviar...";
    hideMessage(formError);
    hideMessage(formSuccess);

    try {
      const { error } = await supabase
        .from("feedback")
        .insert([{
          comment,
          mood: selectedMood,
          name,
          status: "pending"
        }]);

      if (error) {
        throw error;
      }

      form.reset();
      selectedMood = "";
      for (const option of moodOptions.children) {
        option.classList.remove("selected");
        option.setAttribute("aria-checked", "false");
      }
      updateCharacterCount();
      formCard.classList.add("wiggle");
      window.setTimeout(() => formCard.classList.remove("wiggle"), 450);
      burstConfetti();
      showSuccess("Mensagem recebida. Vai entrar na fila de moderacao e aparecer no mural depois de aprovada.");
    } catch (error) {
      showError(navigator.onLine ? api.humanizeError(error, "Nao foi possivel enviar a mensagem.") : "Estas offline. Liga-te novamente e tenta enviar a mensagem.");
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = "Enviar mensagem";
    }
  }

  async function loadFeed() {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("id, name, comment, mood, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      renderFeed(data || []);
    } catch (_error) {
      if (!feed.children.length) {
        feed.innerHTML = '<article class="card entry-card"><p class="entry-comment">O mural esta a preparar-se. Toca em atualizar dentro de instantes.</p></article>';
      }
    }
  }

  async function loadStats() {
    try {
      const { data, error } = await supabase.rpc("get_feedback_stats");
      if (error) {
        throw error;
      }

      renderStats(data || { count: 0, moods: {} });
    } catch (_error) {
      statsCount.textContent = "0";
      statsBars.innerHTML = "";
    }
  }

  function renderFeed(entries) {
    feed.innerHTML = "";

    if (!entries.length) {
      feedEmpty.classList.remove("hidden");
      return;
    }

    feedEmpty.classList.add("hidden");
    entries.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "card entry-card";
      const createdAt = relativeTime(entry.created_at);
      card.innerHTML = `
        <div class="entry-head">
          <strong class="entry-nickname"></strong>
          <span class="entry-mood" aria-label="Mood"></span>
        </div>
        <p class="entry-comment"></p>
        <div class="entry-foot">
          <span>${createdAt}</span>
          <span>Aprovada para o mural</span>
        </div>
      `;
      card.querySelector(".entry-nickname").textContent = entry.name;
      card.querySelector(".entry-mood").textContent = entry.mood;
      card.querySelector(".entry-comment").textContent = entry.comment;
      card.querySelector(".entry-mood").setAttribute("aria-label", `Estado de espirito ${entry.mood}`);
      feed.appendChild(card);
    });
  }

  function renderStats(payload) {
    const moodsMap = payload && payload.moods ? payload.moods : {};
    const total = Number(payload && payload.count ? payload.count : 0);
    statsCount.textContent = String(total);
    statsBars.innerHTML = "";

    moods.forEach((mood) => {
      const row = document.createElement("div");
      row.className = "meter-row";
      const count = Number(moodsMap[mood] || 0);
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      row.innerHTML = `
        <span>${mood}</span>
        <div class="meter-track" aria-hidden="true">
          <div class="meter-fill" style="width: ${percentage}%"></div>
        </div>
        <strong>${count}</strong>
      `;
      statsBars.appendChild(row);
    });
  }

  function showError(message) {
    formError.textContent = message;
    formError.classList.remove("hidden");
    hideMessage(formSuccess);
  }

  function showSuccess(message) {
    formSuccess.textContent = message;
    formSuccess.classList.remove("hidden");
    hideMessage(formError);
  }

  function hideMessage(element) {
    element.classList.add("hidden");
    element.textContent = "";
  }

  function updateCharacterCount() {
    charCount.textContent = `${commentInput.value.length} / 280`;
  }

  function relativeTime(value) {
    return api.relativeTime(value);
  }

  function burstConfetti() {
    const layer = document.createElement("div");
    layer.className = "confetti";
    const colors = ["#0f69c7", "#ff1f2d", "#ffba08", "#39a935", "#6ec6ff"];

    for (let index = 0; index < 18; index += 1) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.animationDelay = `${Math.random() * 160}ms`;
      layer.appendChild(piece);
    }

    document.body.appendChild(layer);
    window.setTimeout(() => layer.remove(), 1100);
  }
})();
