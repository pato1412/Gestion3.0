/*
  Widget de chat de capacitación — embebible en cualquier web.
  Uso: <script src="chat-widget.js" data-endpoint="https://TU-BACKEND.com/api/chat"></script>
  No requiere ningún framework. Se auto-inyecta al cargar.
*/
(function () {
  const scriptTag = document.currentScript;
  const ENDPOINT = scriptTag.dataset.endpoint || "/api/chat";
  const TITLE = scriptTag.dataset.title || "Capacitación";

  // Icono de auricular (SVG embebido) para identificar el widget como chat/soporte
  const LOGO_DATA_URI = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 12a8 8 0 0 1 16 0"/>' +
    '<rect x="2" y="11" width="5" height="7" rx="1.5"/>' +
    '<rect x="17" y="11" width="5" height="7" rx="1.5"/>' +
    '<path d="M20 15v3a3 3 0 0 1-3 3h-2"/>' +
    '</svg>'
  );

  const TEMAS = [
    { id: "luz-azul-gestion-web", label: "Luz Azul Gestión y Web" },
    { id: "operatoria-local", label: "Operatoria del local" },
  ];

  // Paleta de marca Luz Azul
  const AZUL = "#2957A4";       // azul oscuro (texto principal del logo)
  const CELESTE = "#29ABE2";    // celeste (acento del logo)
  const VERDE = "#8CC63F";      // verde (acento del logo)
  const CELESTE_CLARO = "#EAF6FC"; // celeste muy claro, para fondo de mensajes del bot

  const css = `
    .cw-bubble{position:fixed;top:15px;right:20px;width:58px;height:58px;border-radius:50%;
      background:${AZUL};color:#fff;border:1px solid ${CELESTE_CLARO};cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.25);
      font-size:26px;z-index:999999;display:flex;align-items:center;justify-content:center;}
    .cw-panel{position:fixed;bottom:60px;right:20px;width:340px;max-width:92vw;height:480px;max-height:75vh;
      background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.22);display:none;
      flex-direction:column;overflow:hidden;z-index:999999;font-family:system-ui,-apple-system,sans-serif;
      border-top:3px solid ${VERDE};}
    .cw-panel.cw-open{display:flex;}
    .cw-head{background:${AZUL};color:#fff;padding:10px 16px;font-size:14px;font-weight:600;
      display:flex;justify-content:space-between;align-items:center;}
    .cw-head-buttons{display:flex;align-items:center;gap:10px;}
    .cw-logo{height:26px;display:block;}
    .cw-back{cursor:pointer;opacity:.85;font-size:13px;background:none;border:none;color:#fff;
      display:none;padding:0;}
    .cw-back.cw-show{display:inline;}
    .cw-close{cursor:pointer;opacity:.8;font-size:18px;background:none;border:none;color:#fff;}
    .cw-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;}
    .cw-msg{max-width:85%;padding:9px 12px;border-radius:11px;font-size:14px;line-height:1.4;white-space:pre-wrap;}
    .cw-bot{align-self:flex-start;background:${CELESTE_CLARO};color:#173a5e;border-bottom-left-radius:2px;
      border-left:3px solid ${CELESTE};}
    .cw-user{align-self:flex-end;background:${AZUL};color:#fff;border-bottom-right-radius:2px;}
    .cw-topics{display:flex;flex-direction:column;gap:8px;padding:6px 0;}
    .cw-topic-btn{background:#fff;border:1.5px solid ${AZUL};color:${AZUL};border-radius:10px;
      padding:10px 12px;font-size:14px;font-weight:600;cursor:pointer;text-align:left;}
    .cw-topic-btn:hover{background:${CELESTE_CLARO};}
    .cw-form{display:flex;gap:6px;padding:10px;border-top:1px solid #e4e1e8;align-items:center;}
    .cw-form.cw-hidden{display:none;}
    .cw-input{flex:1;border:1px solid #d3d6de;border-radius:8px;padding:8px 10px;font-size:13.5px;outline:none;}
    .cw-input:focus{border-color:${CELESTE};}
    .cw-attach{background:none;border:1px solid #d3d6de;border-radius:8px;width:34px;height:34px;
      font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .cw-attach.cw-has-image{border-color:${VERDE};background:#f2fbe8;}
    .cw-send{background:${AZUL};color:#fff;border:none;border-radius:8px;padding:0 14px;font-size:13.5px;cursor:pointer;}
    .cw-send:hover{background:#233c76;}
    .cw-preview{max-width:180px;border-radius:8px;margin-top:6px;display:block;}
  `;
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const bubble = document.createElement("button");
  bubble.className = "cw-bubble";
  bubble.innerHTML = `<img src="${LOGO_DATA_URI}" alt="" style="width:38px;height:auto;" />`;
  bubble.setAttribute("aria-label", "Abrir chat de " + TITLE);

  const panel = document.createElement("div");
  panel.className = "cw-panel";
  panel.innerHTML = `
    <div class="cw-head">
      <div class="cw-head-buttons">
        <button class="cw-back" aria-label="Volver a temas">← Temas</button>
        <img class="cw-logo" src="${LOGO_DATA_URI}" alt="${TITLE}" />
      </div>
      <button class="cw-close" aria-label="Cerrar">✕</button>
    </div>
    <div class="cw-msgs"></div>
    <form class="cw-form cw-hidden">
      <button type="button" class="cw-attach" title="Adjuntar foto">📷</button>
      <input type="file" class="cw-file" accept="image/*" style="display:none;" />
      <input class="cw-input" placeholder="Escribí tu pregunta..." autocomplete="off" />
      <button class="cw-send" type="submit">Enviar</button>
    </form>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  const msgsEl = panel.querySelector(".cw-msgs");
  const form = panel.querySelector(".cw-form");
  const input = panel.querySelector(".cw-input");
  const backBtn = panel.querySelector(".cw-back");
  const attachBtn = panel.querySelector(".cw-attach");
  const fileInput = panel.querySelector(".cw-file");
  let history = [];
  let opened = false;
  let currentTopic = null;
  let imagenAdjunta = null; // { media_type, data, previewUrl }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function youtubeIdFromUrl(url) {
    const m1 = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/);
    if (m1) return m1[1];
    const m2 = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    if (m2) return m2[1];
    const m3 = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
    if (m3) return m3[1];
    return null;
  }

  function linkify(text) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return escapeHtml(text).replace(urlPattern, (url) => {
      const ytId = youtubeIdFromUrl(url);
      if (ytId) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#2957A4;text-decoration:underline;">${url}</a>
          <div style="position:relative;padding-top:56.25%;margin-top:8px;border-radius:8px;overflow:hidden;">
            <iframe src="https://www.youtube.com/embed/${ytId}" title="Video"
              style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
          </div>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#2957A4;text-decoration:underline;">${url}</a>`;
    });
  }

  function addMsg(text, who, imagenPreviewUrl) {
    const d = document.createElement("div");
    d.className = "cw-msg " + (who === "user" ? "cw-user" : "cw-bot");
    d.innerHTML = linkify(text);
    if (imagenPreviewUrl) {
      const img = document.createElement("img");
      img.src = imagenPreviewUrl;
      img.className = "cw-preview";
      d.appendChild(img);
    }
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return d;
  }

  function addContinueButton() {
    const wrap = document.createElement("div");
    wrap.style.alignSelf = "flex-start";
    const b = document.createElement("button");
    b.className = "cw-topic-btn";
    b.style.padding = "6px 12px";
    b.style.fontSize = "13px";
    b.textContent = "Continuar leyendo →";
    b.addEventListener("click", () => {
      wrap.remove();
      enviarMensaje("Segui, por favor.");
    });
    wrap.appendChild(b);
    msgsEl.appendChild(wrap);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function showTopicPicker() {
    currentTopic = null;
    history = [];
    backBtn.classList.remove("cw-show");
    form.classList.add("cw-hidden");
    msgsEl.innerHTML = "";
    addMsg("¡Hola! ¿Sobre qué tema querés consultar?", "bot");
    const wrap = document.createElement("div");
    wrap.className = "cw-topics";
    TEMAS.forEach((t) => {
      const b = document.createElement("button");
      b.className = "cw-topic-btn";
      b.textContent = t.label;
      b.addEventListener("click", () => selectTopic(t));
      wrap.appendChild(b);
    });
    msgsEl.appendChild(wrap);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function selectTopic(t) {
    currentTopic = t.id;
    history = [];
    msgsEl.innerHTML = "";
    backBtn.classList.add("cw-show");
    form.classList.remove("cw-hidden");
    addMsg(`Estás consultando sobre: ${t.label}. Escribí tu pregunta.`, "bot");
    input.focus();
  }

  bubble.addEventListener("click", () => {
    panel.classList.toggle("cw-open");
    if (!opened && panel.classList.contains("cw-open")) {
      showTopicPicker();
      opened = true;
    }
  });
  panel.querySelector(".cw-close").addEventListener("click", () => panel.classList.remove("cw-open"));
  backBtn.addEventListener("click", showTopicPicker);

  attachBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result; // ej: data:image/jpeg;base64,AAAA...
      const [meta, base64] = dataUrl.split(",");
      const media_type = meta.match(/data:(.*);base64/)[1];
      imagenAdjunta = { media_type, data: base64, previewUrl: dataUrl };
      attachBtn.classList.add("cw-has-image");
      attachBtn.textContent = "✅";
    };
    reader.readAsDataURL(file);
  });

  async function enviarMensaje(text) {
    const imgParaEnviar = imagenAdjunta;
    const textoMostrado = text || "(envié una foto)";
    addMsg(textoMostrado, "user", imgParaEnviar ? imgParaEnviar.previewUrl : null);
    // En el historial no guardamos la imagen en sí (pesa mucho), solo una referencia textual
    history.push({ role: "user", content: imgParaEnviar ? `${textoMostrado} [imagen adjunta]` : text });
    input.value = "";
    input.disabled = true;
    imagenAdjunta = null;
    attachBtn.classList.remove("cw-has-image");
    attachBtn.textContent = "📷";
    fileInput.value = "";

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          topic: currentTopic,
          image: imgParaEnviar ? { media_type: imgParaEnviar.media_type, data: imgParaEnviar.data } : null,
        }),
      });
      const data = await res.json();
      addMsg(data.reply || "No pude responder, probá de nuevo.", "bot");
      history.push({ role: "assistant", content: data.reply || "" });
      if (data.cortada) addContinueButton();
    } catch (err) {
      addMsg("Error de conexión. Probá de nuevo en un momento.", "bot");
    } finally {
      input.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if ((!text && !imagenAdjunta) || !currentTopic) return;
    enviarMensaje(text);
  });
})();
