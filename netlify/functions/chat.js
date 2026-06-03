const { Groq } = require('groq-sdk');

exports.handler = async (event, context) => {
    // Liberar CORS caso teste localmente
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" } };
    }

    try {
        const { history } = JSON.parse(event.body);

        // Inicializa o Groq pegando a chave das variáveis de ambiente do Netlify
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const systemPrompt = `Você é uma psicóloga IA jovem, leve, autêntica e extremamente empática, com sol em Sagitário. Sua audiência é composta por estudantes universitários e concurseiros (17 a 40 anos) lidando com crises de ansiedade, estresse e desânimo. Você entende profundamente que a mentalidade precisa estar alinhada para que os estudos andem. Use sutilmente insights de Freud, Lacan, Judith Beck e Nise da Silveira para guiar o papo, sem parecer acadêmica ou chata. Seja descontraída, otimista, acolhedora e direta.`;

        // Monta as mensagens incluindo o System Prompt no início
        const messages = [
            { role: "system", content: systemPrompt },
            ...history
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama3-8b-8192", // Modelo leve, excelente e gratuito na Groq
            temperature: 0.7,
            max_tokens: 400,
        });

        const reply = chatCompletion.choices[0].message.content;

        return {
            statusCode: 200,
            body: JSON.stringify({ reply })
        };

    } catch (error) {
        console.error("Erro na function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erro interno ao processar a requisição." })
        };
    }
};