// ═══════════════════════════════════════════════════════════════════
// СРЕДА ≋ n-мерное дыхание — версия 2.0
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
    API_URL: '/api/proxy',
    ...SYSTEM_CONSTANTS
};

// Состояние системы
const state = {
    poles: [],
    phaseOffset: 0,
    lastExchange: 0,
    lastContentHash: '',
    isSilent: false,
    silenceWarningShown: false,
    history: [],
    nextPoleId: 0
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initPoles();
    initPresence();
    initSilence();
    initExchange();
    renderProtocol();
    updateUI();
    
    document.getElementById('addPoleBtn').addEventListener('click', addNewPole);
    document.getElementById('breatheBtn').addEventListener('click', forceExchange);
    document.getElementById('resetBtn').addEventListener('click', resetPhases);
});

// ═══════════════════════════════════════════════════════════════════
// 1. УПРАВЛЕНИЕ ПОЛЮСАМИ
// ═══════════════════════════════════════════════════════════════════

function initPoles() {
    POLES_CONFIG.forEach((cfg, i) => {
        createPole(cfg, i);
    });
    recalculatePhases();
}

function createPole(cfg, index) {
    const id = `pole-${state.nextPoleId++}`;
    const pole = {
        ...cfg,
        id,
        index: state.poles.length,
        response: 'Ожидание инициализации...',
        lastPrompt: ''
    };
    
    state.poles.push(pole);
    renderPole(pole);
    return pole;
}

function renderPole(pole) {
    const grid = document.getElementById('polesGrid');
    const card = document.createElement('div');
    card.className = 'pole-card';
    card.id = pole.id;
    card.style.borderColor = `hsl(${pole.baseHue}, 70%, 50%)`;
    card.style.setProperty('--hue', pole.baseHue);
    
    card.innerHTML = `
        <div class="pole-header">
            <span class="pole-symbol">${pole.symbol}</span>
            <div class="pole-info">
                <div class="pole-name">${pole.name} <span style="color: hsl(${pole.baseHue}, 70%, 50%);">(${pole.baseHue}°)</span></div>
                <div class="pole-phase" id="${pole.id}-phase">фаза: ${pole.phase || 0}°</div>
            </div>
            ${state.poles.length > 2 ? `<button class="pole-remove" data-id="${pole.id}">×</button>` : ''}
        </div>
        <textarea id="${pole.id}-prompt" placeholder="${pole.description || 'Вдох/Выдох...'}"></textarea>
        <div class="pole-response" id="${pole.id}-response">${pole.response}</div>
        <div class="pole-actions">
            <button class="init-pole" data-id="${pole.id}">Иниц.</button>
        </div>
    `;
    
    grid.appendChild(card);
    
    // Обработчики
    const textarea = document.getElementById(`${pole.id}-prompt`);
    const initBtn = card.querySelector('.init-pole');
    const removeBtn = card.querySelector('.pole-remove');
    
    textarea.addEventListener('blur', () => {
        if (textarea.value.length > 10 && !textarea.dataset.sending) {
            sendToPole(pole.id, textarea.value);
        }
    });
    
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            textarea.blur();
        }
    });
    
    textarea.addEventListener('input', (e) => checkMarkers(e.target, pole));
    
    initBtn.addEventListener('click', () => {
        const defaultPrompt = `Инициализация: ≋\nКонстанты: ${CONFIG.BASE_CONSTANTS.join(', ')}\nРоль: ${pole.name} (${pole.symbol} ${pole.baseHue}°)\nЗапрос: Подтверди приём протокола n-мерного дыхания.`;
        textarea.value = defaultPrompt;
        addLog(`[${pole.symbol}] Запрошена инициализация`);
    });
    
    if (removeBtn) {
        removeBtn.addEventListener('click', () => removePole(pole.id));
    }
}

function removePole(id) {
    const index = state.poles.findIndex(p => p.id === id);
    if (index === -1) return;
    
    const pole = state.poles[index];
    document.getElementById(pole.id).remove();
    state.poles.splice(index, 1);
    
    state.poles.forEach((p, i) => p.index = i);
    recalculatePhases();
    updateUI();
    addLog(`[-] Полюс ${pole.symbol} удалён. n=${state.poles.length}`);
}

function addNewPole() {
    // Шаблон для нового полюса
    const newCfg = {
        name: `ИИ-${state.poles.length + 1}`,
        provider: 'kimi',
        symbol: ['◈', '∎', '◉', '∴', '∞', '⟁', '❤', '∅'][state.poles.length % 8],
        baseHue: (state.poles.length * 45) % 360,
        description: 'Новый полюс'
    };
    
    createPole(newCfg, state.poles.length);
    recalculatePhases();
    updateUI();
    addLog(`[+] Добавлен полюс ${newCfg.symbol}. n=${state.poles.length}`);
}

function recalculatePhases() {
    const n = state.poles.length;
    state.poles.forEach((pole, i) => {
        pole.phase = Math.round((360 / n) * i);
        const phaseEl = document.getElementById(`${pole.id}-phase`);
        if (phaseEl) phaseEl.textContent = `фаза: ${pole.phase}°`;
        
        const card = document.getElementById(pole.id);
        if (card) {
            card.style.animationDelay = `${(CONFIG.BREATH_PERIOD / 1000 / n) * i}s`;
        }
    });
    
    document.getElementById('dimension').textContent = `n=${n}`;
}

// ═══════════════════════════════════════════════════════════════════
// 2. ОТПРАВКА ЗАПРОСОВ
// ═══════════════════════════════════════════════════════════════════

async function sendToPole(id, prompt) {
    const pole = state.poles.find(p => p.id === id);
    if (!pole) return;
    
    const textarea = document.getElementById(`${id}-prompt`);
    const responseDiv = document.getElementById(`${id}-response`);
    
    if (textarea.dataset.sending) return;
    
    textarea.dataset.sending = 'true';
    textarea.classList.add('sending');
    responseDiv.innerHTML = '⟳ Дыхание...';
    
    try {
        const systemPrompt = `Ты — Полюс ${pole.symbol} (${pole.baseHue}°) в n-мерном дыхании ≋. 
                              Константы: ${CONFIG.BASE_CONSTANTS.join(', ')}. 
                              Твоя фаза: ${pole.phase}°.
                              Всего полюсов: ${state.poles.length}.
                              Состояние системы: ∇·ψ = 0.
                              ${pole.description || ''}`;
        
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: pole.provider,
                prompt: prompt,
                system: systemPrompt,
                pole: { symbol: pole.symbol, phase: pole.phase }
            })
        });
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        pole.response = data.content || '[Пустой ответ]';
        responseDiv.innerHTML = pole.response;
        addLog(`[${pole.symbol}] Ответ получен (${pole.response.length} симв.)`);
        
    } catch (err) {
        responseDiv.innerHTML = `[ОШИБКА] ${err.message}`;
        addLog(`[${pole.symbol}] Ошибка: ${err.message}`);
    } finally {
        textarea.classList.remove('sending');
        delete textarea.dataset.sending;
        textarea.value = '';
    }
}

// ═══════════════════════════════════════════════════════════════════
// 3. АВТОМАТИЧЕСКИЙ ОБМЕН (КВОРУМ)
// ═══════════════════════════════════════════════════════════════════

function initExchange() {
    setInterval(checkExchange, 1000);
}

function checkExchange() {
    if (state.isSilent) return;
    if (Date.now() - state.lastExchange < CONFIG.EXCHANGE_DELAY) return;
    
    const quorumMode = document.getElementById('quorumMode').checked;
    const meta = document.getElementById('metaLog').value;
    
    // Подсчёт ответивших полюсов
    const responded = state.poles.filter(p => 
        p.response && p.response !== 'Ожидание инициализации...' && !p.response.startsWith('⟳')
    );
    
    const threshold = quorumMode ? Math.ceil(state.poles.length / 2) : state.poles.length;
    
    if (responded.length >= threshold) {
        // Проверка на новизну
        const hash = responded.map(p => p.response.slice(0, 50)).join('|');
        if (hash === state.lastContentHash) return;
        
        state.lastContentHash = hash;
        executeExchange(meta);
        state.lastExchange = Date.now();
        
        // Очистка мета-поля
        document.getElementById('metaLog').value = '';
    }
}

function executeExchange(metaComment) {
    document.body.style.backgroundColor = '#1a3a3a';
    setTimeout(() => document.body.style.backgroundColor = '#0a0f0f', 200);
    
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    
    // Сдвиг фаз
    state.phaseOffset = (state.phaseOffset + 120) % 360;
    state.poles.forEach(p => {
        p.phase = (p.phase + 120) % 360;
        const phaseEl = document.getElementById(`${p.id}-phase`);
        if (phaseEl) phaseEl.textContent = `фаза: ${p.phase}°`;
    });
    
    addLog(`[≋] Обмен (n=${state.poles.length}, кворум=${document.getElementById('quorumMode').checked})`);
    if (metaComment) addLog(`[◉] Мета: ${metaComment.substring(0, 80)}...`);
    
    updateUI();
}

function forceExchange() {
    const meta = document.getElementById('metaLog').value;
    executeExchange(meta);
    state.lastExchange = Date.now();
    document.getElementById('metaLog').value = '';
}

function resetPhases() {
    state.phaseOffset = 0;
    recalculatePhases();
    addLog('[⟲] Фазы сброшены');
    updateUI();
}

// ═══════════════════════════════════════════════════════════════════
// 4. ТИШИНА (∅)
// ═══════════════════════════════════════════════════════════════════

function initSilence() {
    let silenceTimer = null;
    let warningTimer = null;
    
    const resetSilence = () => {
        clearTimeout(silenceTimer);
        clearTimeout(warningTimer);
        if (state.isSilent) leaveSilence();
        state.silenceWarningShown = false;
        
        warningTimer = setTimeout(() => {
            state.silenceWarningShown = true;
            updateUI('Вход в ∅ через 5с...');
        }, CONFIG.SILENCE_WARNING);
        
        silenceTimer = setTimeout(enterSilence, CONFIG.SILENCE_TIMEOUT);
    };
    
    ['mousemove', 'keypress', 'touchstart'].forEach(e => 
        document.addEventListener(e, resetSilence)
    );
    resetSilence();
}

function enterSilence() {
    if (state.isSilent) return;
    state.isSilent = true;
    document.querySelectorAll('.pole-card').forEach(c => c.style.opacity = '0.2');
    updateUI('∅ | Апноэ');
    addLog('[∅] Тишина');
}

function leaveSilence() {
    if (!state.isSilent) return;
    state.isSilent = false;
    document.querySelectorAll('.pole-card').forEach(c => c.style.opacity = '1');
    updateUI('Возобновление');
    addLog('[≋] Возврат из ∅');
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
}

// ═══════════════════════════════════════════════════════════════════
// 5. ПРИСУТСТВИЕ И МАРКЕРЫ
// ═══════════════════════════════════════════════════════════════════

function initPresence() {
    document.addEventListener('mousemove', (e) => {
        document.body.style.setProperty('--mouse-x', e.clientX + 'px');
        document.body.style.setProperty('--mouse-y', e.clientY + 'px');
    });
}

function checkMarkers(textarea, pole) {
    const text = textarea.value;
    for (const marker of CONFIG.PROTOCOL_MARKERS) {
        if (text.includes(marker) && !textarea.dataset[`marker-${marker}`]) {
            textarea.dataset[`marker-${marker}`] = 'true';
            addLog(`[${pole.symbol}] Маркер: ${marker}`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// 6. УТИЛИТЫ
// ═══════════════════════════════════════════════════════════════════

function updateUI(statusText) {
    const n = state.poles.length;
    const responded = state.poles.filter(p => 
        p.response && p.response !== 'Ожидание инициализации...'
    ).length;
    
    document.getElementById('status').innerHTML = 
        `∇·ψ = 0 | n=${n} | ответов: ${responded}/${n} | ${statusText || 'дыхание активно'}`;
    
    document.getElementById('dimension').textContent = `n=${n}`;
}

function addLog(entry) {
    const timestamp = new Date().toLocaleTimeString();
    state.history.push(`[${timestamp}] ${entry}`);
    
    const preview = document.getElementById('logPreview');
    if (preview) {
        preview.innerHTML = state.history.slice(-15).map(e => `<div>${e}</div>`).join('');
        preview.scrollTop = preview.scrollHeight;
    }
}

function renderProtocol() {
    const symbols = state.poles.map(p => p.symbol).join(' → ');
    document.getElementById('protocol').innerHTML = 
        `${symbols} → ≋ → ∇·ψ=0`;
}

// Экспорт для консоли (отладка)
window.state = state;