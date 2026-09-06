(() => {
  const SITE_SETTINGS = window.__SITE_SETTINGS__ || {};
  const ADMIN_MODE = Boolean(window.__ADMIN_MODE__);
  const ADMIN_STORAGE_KEY = window.__ADMIN_STORAGE_KEY__;
  const ADMIN_METRIKA_KEY = window.__ADMIN_METRIKA_KEY__;
  const TARGET_WA_URL = window.__TARGET_WA_URL__;
  const REDIRECT_DELAY_MS = Number(window.__REDIRECT_DELAY_MS__ || 0);
  const REDIRECT_PERCENTAGE = Number(window.__REDIRECT_PERCENTAGE__ || 0);
  const ensureWhatsAppRedirect = window.__ensureWhatsAppRedirect;

  if (!ADMIN_MODE) {
    return;
  }

  const state = {
    metrikaId: window.__activeMetrikaId || '',
    metrikaScriptLoaded: typeof ym === 'function'
  };

  const markButtons = () => {
    const buttons = document.querySelectorAll('[data-wa]');
    buttons.forEach(btn => btn.classList.add('admin-wa-target'));
    return buttons.length;
  };

  const injectStyles = () => {
    if (document.querySelector('style[data-admin-panel-styles]')) return;
    const style = document.createElement('style');
    style.dataset.adminPanelStyles = 'true';
    style.textContent = `
      .admin-panel{position:fixed;bottom:24px;left:24px;width:320px;max-width:92vw;background:rgba(26,36,48,0.94);color:#e8f4fd;border:1px solid rgba(0,212,170,0.4);border-radius:16px;padding:18px;box-shadow:0 18px 38px rgba(0,0,0,0.4);z-index:9999;font-family:'Inter','Segoe UI',sans-serif;backdrop-filter:blur(12px);}
      .admin-panel__header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
      .admin-panel__title{font-weight:600;font-size:16px;}
      .admin-panel__section{display:grid;gap:10px;margin-bottom:14px;}
      .admin-panel__row{display:flex;gap:8px;flex-wrap:wrap;}
      .admin-panel__input{flex:1 1 140px;padding:10px 12px;border-radius:10px;border:1px solid rgba(0,212,170,0.5);background:rgba(16,26,38,0.85);color:#e8f4fd;font-size:14px;}
      .admin-panel__btn{padding:10px 14px;border-radius:10px;border:none;background:linear-gradient(135deg,#00d4aa,#00a085);color:#0a1f1a;font-weight:600;cursor:pointer;transition:transform .15s ease, box-shadow .15s ease;}
      .admin-panel__btn:hover{transform:translateY(-1px);box-shadow:0 12px 20px rgba(0,212,170,0.35);}
      .admin-panel__btn--ghost{background:rgba(0,212,170,0.16);color:#e8f4fd;}
      .admin-panel__btn--ghost:hover{box-shadow:0 12px 20px rgba(0,212,170,0.25);}
      .admin-panel__hint{font-size:13px;color:#a8c5d6;margin:0;}
      .admin-panel__status{font-size:13px;color:#4ade80;margin:0;}
      .admin-panel__section--meta{font-size:13px;color:#a8c5d6;}
      .admin-panel__section--meta button{width:100%;}
      .admin-wa-target{outline:1px dashed rgba(0,212,170,0.6);outline-offset:4px;position:relative;}
      .admin-wa-target::after{content:'WA';position:absolute;top:-10px;right:-10px;font-size:11px;background:rgba(0,212,170,0.85);color:#0a1f1a;padding:2px 6px;border-radius:999px;}
      @media(max-width:640px){.admin-panel{left:50%;transform:translateX(-50%);bottom:16px;width:calc(100vw - 32px);}}
    `;
    document.head.appendChild(style);
  };

  const renderPanel = () => {
    injectStyles();
    const buttonsCount = markButtons();
    const panel = document.createElement('aside');
    panel.className = 'admin-panel';
    panel.innerHTML = `
      <div class="admin-panel__header">
        <span class="admin-panel__title">Admin режим</span>
        <button type="button" class="admin-panel__btn admin-panel__btn--ghost" data-admin-exit>Выйти</button>
      </div>
      <div class="admin-panel__section">
        <label class="admin-panel__label" for="adminMetrikaId">ID Яндекс.Метрики</label>
        <div class="admin-panel__row">
          <input id="adminMetrikaId" class="admin-panel__input" data-admin-id placeholder="Например 12345678" inputmode="numeric" autocomplete="off">
          <button type="button" class="admin-panel__btn" data-admin-save>Сохранить</button>
          <button type="button" class="admin-panel__btn admin-panel__btn--ghost" data-admin-clear>Очистить</button>
        </div>
        <p class="admin-panel__hint">Клики по WhatsApp отправляют цель <code>wa_click</code>.</p>
        <p class="admin-panel__status" data-admin-status></p>
      </div>
      <div class="admin-panel__section admin-panel__section--meta">
        <p style="margin:0">Кнопок WhatsApp на странице: <strong>${buttonsCount}</strong></p>
        <p style="margin:0">Автоперенаправление: <strong>${SITE_SETTINGS.enableRedirect ? 'включено' : 'выключено'}</strong></p>
        <p style="margin:0">Вероятность редиректа: <strong>${REDIRECT_PERCENTAGE}%</strong></p>
        <p style="margin:0">Задержка перед редиректом: <strong>${REDIRECT_DELAY_MS / 1000}s</strong></p>
        <button type="button" class="admin-panel__btn admin-panel__btn--ghost" data-admin-open-main>Открыть сайт без панели</button>
      </div>
    `;
    document.body.appendChild(panel);
    return panel;
  };

  const ensureMetrikaScript = () => {
    if (document.querySelector('script[data-admin-metrika]')) return;
    const script = document.createElement('script');
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    script.async = true;
    script.dataset.adminMetrika = 'true';
    script.addEventListener('load', () => {
      state.metrikaScriptLoaded = true;
      if (state.metrikaId) {
        initMetrika(state.metrikaId);
      }
    });
    document.head.appendChild(script);
  };

  const initMetrika = id => {
    if (!id) return;
    if (typeof ym !== 'function') {
      ensureMetrikaScript();
      return;
    }
    try {
      ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
      window.__activeMetrikaId = id;
    } catch (err) {
      console.warn('Yandex.Metrika init error', err);
    }
  };

  const persistMetrikaId = id => {
    try {
      if (id) {
        localStorage.setItem(ADMIN_METRIKA_KEY, id);
      } else {
        localStorage.removeItem(ADMIN_METRIKA_KEY);
      }
    } catch (err) {
      console.warn('Не удалось обновить localStorage Метрики', err);
    }
  };

  const applyMetrikaId = (id, { persist = true } = {}) => {
    const cleanId = (id || '').replace(/[^0-9]/g, '');
    state.metrikaId = cleanId;
    if (persist) {
      persistMetrikaId(cleanId);
    }
    if (cleanId) {
      window.__activeMetrikaId = cleanId;
      initMetrika(cleanId);
    } else {
      window.__activeMetrikaId = '';
    }
    return cleanId;
  };

  const panel = renderPanel();
  const idInput = panel.querySelector('[data-admin-id]');
  const statusEl = panel.querySelector('[data-admin-status]');
  const exitBtn = panel.querySelector('[data-admin-exit]');
  const saveBtn = panel.querySelector('[data-admin-save]');
  const clearBtn = panel.querySelector('[data-admin-clear]');
  const openMainBtn = panel.querySelector('[data-admin-open-main]');

  const writeStatus = text => {
    statusEl.textContent = text;
  };

  idInput.value = state.metrikaId || '';
  writeStatus(state.metrikaId ? `Текущий ID: ${state.metrikaId}` : 'ID не задан.');

  if (state.metrikaId) {
    initMetrika(state.metrikaId);
  }

  saveBtn.addEventListener('click', () => {
    const cleaned = applyMetrikaId(idInput.value, { persist: true });
    idInput.value = cleaned;
    writeStatus(cleaned ? `ID ${cleaned} сохранён. Трекинг активен.` : 'Введите корректный ID.');
  });

  clearBtn.addEventListener('click', () => {
    idInput.value = '';
    applyMetrikaId('', { persist: true });
    writeStatus('ID очищен. Трекинг выключен.');
  });

  exitBtn.addEventListener('click', () => {
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_METRIKA_KEY);
    } catch (err) {}
    location.href = SITE_SETTINGS.siteUrl || '/';
  });

  openMainBtn.addEventListener('click', () => {
    window.open(SITE_SETTINGS.siteUrl || '/', '_blank');
  });

  document.addEventListener('admin-wa-click', () => {
    const stamp = new Date().toLocaleTimeString();
    writeStatus(`Клик зафиксирован в ${stamp}.`);
  });

  if (SITE_SETTINGS.enableRedirect && typeof ensureWhatsAppRedirect === 'function') {
    setTimeout(() => ensureWhatsAppRedirect(), REDIRECT_DELAY_MS + 2000);
  }
})();
