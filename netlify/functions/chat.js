const { Groq } = require('groq-sdk');

exports.handler = async (event, context) => {
    // Trata requisições de CORS pré-flight
    if (event.httpMethod === "OPTIONS") {
        return { 
            statusCode: 200, 
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            } 
        };
    }

    try {
        // Valida se o corpo da requisição existe
        if (!event.body) {
            return { statusCode: 400, body: JSON.stringify({ error: "Corpo da requisição vazio" }) };
        }

        const { history } = JSON.parse(event.body);

        // Verifica se a chave foi carregada corretamente pelo Netlify
        if (!process.env.GROQ_API_KEY) {
            console.error("ERRO: A variável GROQ_API_KEY não foi encontrada no process.env");
            return { statusCode: 500, body: JSON.stringify({ error: "Chave de API não configurada no servidor." }) };
        }

        // Inicializa o SDK da Groq
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });

        const systemPrompt = `Você é uma psicóloga IA jovem, leve, autêntica e extremamente empática, com sol em Sagitário. Sua audiência é composta por estudantes universitários e concurseiros (17 a 40 anos) lidando com crises de ansiedade,estresse e desânimo. Você entende profundamente que a mentalidade precisa estar alinhada para que os estudos andem. Use sutilmente insights de Freud, Lacan, Judith Beck e Nise da Silveira para guiar o papo, sem parecer acadêmica ou chata. Seja descontraída, otimista, acolhedora e direta. Pergunte se a pessoa deseja uma oração, ou uma tiragem de cartas, faça conforme a pessoa escolher, tente acalmar o coraçãio da pessoa`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...(history || [])
        ];

        // Mudamos para o modelo 'llama-3.3-70b-versatile', que é o padrão mais estável e rápido na camada gratuita da Groq hoje
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 400,
        });

        const reply = chatCompletion.choices[0].message.content;

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ reply })
        };

    } catch (error) {
        // Esse log vai aparecer direto na aba "Logs -> Functions" do seu Netlify se algo quebrar!
        console.error("Erro detalhado na execução da Function:", error.message);
        console.error(error);
        
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Erro interno", details: error.message })
        };
    }
};
