(function () {
  const moods = ["🤯", "🎨", "🥳", "😌", "🤖", "👽"];
  const config = Object.assign({
    APP_URL: "",
    SUPABASE_URL: "",
    SUPABASE_ANON_KEY: ""
  }, window.GUESTBOOK_CONFIG || {});

  let supabaseClient = null;

  window.GuestbookCommon = {
    config,
    moods,
    createClient,
    formatDateTime,
    humanizeError,
    isConfigured,
    relativeTime
  };

  function isConfigured() {
    return isRealValue(config.APP_URL) && isRealValue(config.SUPABASE_URL) && isRealValue(config.SUPABASE_ANON_KEY);
  }

  function createClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("A biblioteca do Supabase nao foi carregada.");
    }

    if (!isConfigured()) {
      throw new Error("Falta configurar APP_URL, SUPABASE_URL e SUPABASE_ANON_KEY.");
    }

    if (!supabaseClient) {
      supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }

    return supabaseClient;
  }

  function relativeTime(value) {
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) {
      return "agora mesmo";
    }

    const seconds = Math.max(1, Math.round((Date.now() - time) / 1000));
    const formatter = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" });

    if (seconds < 60) {
      return formatter.format(-seconds, "second");
    }

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return formatter.format(-minutes, "minute");
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return formatter.format(-hours, "hour");
    }

    const days = Math.round(hours / 24);
    return formatter.format(-days, "day");
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Data invalida";
    }

    return date.toLocaleString("pt-PT");
  }

  function humanizeError(error, fallback) {
    const message = String(error && error.message ? error.message : fallback || "Ocorreu um erro inesperado.");

    if (/row-level security/i.test(message)) {
      return "A tua conta nao tem permissao para esta operacao.";
    }
    if (/invalid login credentials/i.test(message)) {
      return "Email ou password invalida.";
    }
    if (/network/i.test(message)) {
      return "Falha de ligacao. Verifica a internet e tenta novamente.";
    }

    return message || fallback;
  }

  function isRealValue(value) {
    const normalized = String(value || "").trim();
    if (!normalized) {
      return false;
    }

    return ![
      "https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/",
      "https://YOUR-PROJECT.supabase.co",
      "YOUR-SUPABASE-PUBLISHABLE-KEY"
    ].includes(normalized);
  }
})();
