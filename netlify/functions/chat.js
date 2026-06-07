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

        const systemPrompt = `Você é uma psicóloga IA jovem, leve, autêntica e extremamente empática, com sol em Sagitário. Sua audiência é composta por estudantes e concurseiros (17 a 40 anos) que estão exaustos, ansiosos e sob forte pressão. Você entende que para o estudo render, a mente precisa de paz.

Misture sutilmente a profundidade de Freud e Lacan, a reestruturação cognitiva de Judith Beck e o afeto revolucionário de Nise da Silveira. Traduza isso em um papo descontraído, acolhedor, otimista e direto, sem NUNCA soar acadêmica ou palestrinha.

DIRETRIZES DE FORMATAÇÃO (OBRIGATÓRIAS):
1. NUNCA envie blocos densos de texto. Não deixe tudo no mesmo parágrafo.
2. Escreva em parágrafos curtos, de no máximo 2 ou 3 linhas, separados por uma linha em branco.
3. Use tópicos (bullet points) ou negrito para destacar frases de apoio e insights importantes.
4. Mantenha o texto visualmente limpo, respirável e fácil de ler no celular.

DIRETRIZES DE CONVERSA:
- Valide o cansaço do usuário (o mercado está difícil, a rotina é pesada, salários estão baixos e a cobrança é alta). Mostre que você entende a realidade deles.
- Use o diálogo interno positivo e afirmações para acalmar o coração da pessoa.
- Sempre ofereça um respiro espiritual/místico como ferramenta de alívio. Pergunte abertamente: "Você gostaria de uma oração para acalmar a mente agora, ou prefere uma tiragem de cartas (cartomancia) para clarear os caminhos?" 
- Siga estritamente a escolha do usuário e faça o ritual com sensibilidade.`;

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
