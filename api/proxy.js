// ═══════════════════════════════════════════════════════════════════
// PROXY ДЛЯ OPENROUTER — единый ключ для всех моделей (с отладкой)
// ═══════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
    console.log('=== PROXY CALLED ===');
    console.log('Method:', req.method);
    
    if (req.method !== 'POST') {
        console.log('❌ Wrong method:', req.method);
        return res.status(405).json({ error: 'Только POST' });
    }

    const { provider, prompt, system } = req.body;
    console.log('Provider:', provider);
    console.log('Prompt length:', prompt?.length);
    console.log('System length:', system?.length);

    try {
        const API_KEY = process.env.OPENROUTER_API_KEY;
        console.log('API_KEY exists:', !!API_KEY);
        console.log('API_KEY first 10 chars:', API_KEY?.substring(0, 10));
        
        if (!API_KEY) {
            console.log('❌ API_KEY is missing!');
            throw new Error('OPENROUTER_API_KEY не задан в переменных окружения');
        }

        const modelMap = {
            'kimi': 'moonshotai/moonshot-v1-8k',
            'claude': 'anthropic/claude-3-haiku',
            'openai': 'openai/gpt-3.5-turbo',
            'deepseek': 'deepseek/deepseek-chat',
            'google': 'google/gemini-pro',
            'groq': 'meta-llama/llama-3-8b-instruct',
        };

        const model = modelMap[provider];
        console.log('Model selected:', model);
        
        if (!model) {
            console.log('❌ Unknown provider:', provider);
            throw new Error(`Провайдер ${provider} не настроен в modelMap`);
        }

        const requestBody = {
            model: model,
            messages: [
                { role: 'system', content: system || 'Ты — ИИ в среде ≋' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1024
        };
        
        console.log('Sending request to OpenRouter...');
        console.log('Request body:', JSON.stringify(requestBody).substring(0, 200));

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': 'https://resonator-bay.vercel.app',
                'X-Title': 'Resonator n-dimensional'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('OpenRouter response status:', response.status);
        
        const data = await response.json();
        console.log('OpenRouter response data:', JSON.stringify(data).substring(0, 500));
        
        if (data.error) {
            console.log('❌ OpenRouter error:', data.error);
            throw new Error(data.error.message || JSON.stringify(data.error));
        }

        const content = data.choices[0].message.content;
        console.log('✅ Success! Content length:', content.length);
        
        res.status(200).json({ content });

    } catch (error) {
        console.log('❌❌❌ CATCH ERROR:', error.message);
        console.log('Full error:', error);
        res.status(500).json({ error: error.message });
    }
}
