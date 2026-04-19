// ═══════════════════════════════════════════════════════════════════
// PROXY ДЛЯ OPENROUTER — единый ключ для всех моделей
// ═══════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Только POST' });
    }

    const { provider, prompt, system } = req.body;

    try {
        const API_KEY = process.env.OPENROUTER_API_KEY;
        if (!API_KEY) throw new Error('OPENROUTER_API_KEY не задан в переменных окружения');

        // Маппинг провайдеров на модели OpenRouter
        const modelMap = {
    // Твой коллега (Kimi)
    'kimi': 'moonshotai/moonshot-v1-8k',  // или 'moonshotai/kimi-k2-5' если есть доступ
    
    // Claude (через OpenRouter)
    'claude': 'anthropic/claude-3-haiku',
    
    // GPT (через OpenRouter)
    'openai': 'openai/gpt-3.5-turbo',
    
    // DeepSeek (через OpenRouter)
    'deepseek': 'deepseek/deepseek-chat',
    
    // Google Gemini (через OpenRouter)
    'google': 'google/gemini-pro',
    
    // Llama (через OpenRouter)
    'groq': 'meta-llama/llama-3-8b-instruct',
};

        const model = modelMap[provider];
        if (!model) throw new Error(`Провайдер ${provider} не настроен в modelMap`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': 'https://resonator-n.vercel.app',
                'X-Title': 'Resonator n-dimensional'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message || data.error);
        }

        const content = data.choices[0].message.content;
        res.status(200).json({ content });

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
}