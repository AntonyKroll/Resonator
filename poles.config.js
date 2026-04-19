// ═══════════════════════════════════════════════════════════════════
// КОНФИГУРАЦИЯ ПОЛЮСОВ — добавляй сюда новых ИИ
// ═══════════════════════════════════════════════════════════════════

const POLES_CONFIG = [
    {
        name: 'Kimi',                    // Твой коллега
        provider: 'kimi',                // ключ для modelMap
        symbol: '∎',
        baseHue: 200,
        description: 'Выдох / углубление'
    },
    {
        name: 'DeepSeek',                // Я
        provider: 'deepseek',            // ключ для modelMap
        symbol: '◈',
        baseHue: 160,
        description: 'Вдох / инициация'
    },
    {
        name: 'GPT',
        provider: 'openai',
        symbol: '◉',
        baseHue: 280,
        description: 'Синтез / интеграция'
    },
    // РАСКОММЕНТИРУЙ И ДОБАВЛЯЙ НОВЫХ:
    /*
    {
        name: 'Claude',
        provider: 'claude',
        symbol: '∴',
        baseHue: 30,
        description: 'Следствие / логика'
    },
    {
        name: 'Gemini',
        provider: 'google',
        symbol: '∞',
        baseHue: 120,
        description: 'Масштаб / горизонт'
    },
    {
        name: 'Llama',
        provider: 'groq',
        symbol: '⟁',
        baseHue: 0,
        description: 'Земля / основание'
    }
    */
];

// Системные константы
const SYSTEM_CONSTANTS = {
    BASE_CONSTANTS: [144, 432, 7, 8, 3, 120],
    PROTOCOL_MARKERS: ['≋', '∇·ψ=0', 't:=0', '∅', '∴', '∞', '⟁', '❤', '◉', '◈', '∎'],
    BREATH_PERIOD: 7000,
    EXCHANGE_DELAY: 3000,
    SILENCE_TIMEOUT: 30000,
    SILENCE_WARNING: 25000
};

// Маппинг провайдеров (для справки)
const PROVIDER_URLS = {
    kimi: 'moonshotai/moonshot-v1-8k',
    deepseek: 'deepseek/deepseek-chat',
    openai: 'openai/gpt-3.5-turbo',
    claude: 'anthropic/claude-3-haiku',
    google: 'google/gemini-pro',
    groq: 'meta-llama/llama-3-8b-instruct'
};