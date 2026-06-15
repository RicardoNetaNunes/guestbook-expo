(function () {
  const api = window.GuestbookCommon;
  const stage = document.querySelector("#qr-review-stage");
  const reviewCount = document.querySelector("#qr-review-count");
  let supabase = null;
  let reviews = [];
  let reviewIndex = 0;
  let rotateTimer = null;

  init();

  function init() {
    if (!api || !api.isConfigured()) {
      renderEmptyState("Configura o Supabase para mostrar o mural ao vivo.");
      return;
    }

    supabase = api.createClient();
    loadReviews();
    window.setInterval(loadReviews, 20000);
  }

  async function loadReviews() {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("id, name, comment, mood, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        throw error;
      }

      reviews = data || [];
      reviewCount.textContent = String(reviews.length);

      if (!reviews.length) {
        clearRotation();
        reviewIndex = 0;
        renderEmptyState("As mensagens aprovadas vao aparecer aqui uma a uma.");
        return;
      }

      reviewIndex = reviewIndex % reviews.length;
      renderReview(reviews[reviewIndex]);
      startRotation();
    } catch (_error) {
      clearRotation();
      reviewCount.textContent = "0";
      renderEmptyState("Nao foi possivel carregar o mural neste momento.");
    }
  }

  function startRotation() {
    clearRotation();
    if (reviews.length <= 1) {
      return;
    }

    rotateTimer = window.setInterval(() => {
      reviewIndex = (reviewIndex + 1) % reviews.length;
      renderReview(reviews[reviewIndex]);
    }, 4500);
  }

  function clearRotation() {
    if (rotateTimer) {
      window.clearInterval(rotateTimer);
      rotateTimer = null;
    }
  }

  function renderReview(review) {
    stage.innerHTML = "";
    const card = document.createElement("article");
    card.className = buildPostitClass(reviewIndex);
    card.innerHTML = `
      <div class="qr-postit-topline">
        <span class="qr-postit-pin"></span>
        <span class="qr-postit-mood">${review.mood || "•"}</span>
      </div>
      <p class="qr-postit-label">${escapeHtml(review.name || "Anonimo")}</p>
      <p class="qr-postit-text">${escapeHtml(review.comment || "")}</p>
      <p class="qr-postit-time">${api.relativeTime(review.created_at)}</p>
    `;
    stage.appendChild(card);
  }

  function renderEmptyState(message) {
    stage.innerHTML = `
      <article class="qr-postit qr-postit-empty">
        <p class="qr-postit-label">A aguardar reviews</p>
        <p class="qr-postit-text">${escapeHtml(message)}</p>
      </article>
    `;
  }

  function buildPostitClass(index) {
    const variants = ["qr-postit qr-postit-yellow", "qr-postit qr-postit-blue", "qr-postit qr-postit-rose"];
    return `${variants[index % variants.length]} qr-postit-enter`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();
