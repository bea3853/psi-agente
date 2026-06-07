const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatContainer = document.getElementById('chatContainer');

// Array para guardar o histórico da conversa e mandar pro modelo (mantém contexto)
let conversationHistory = [];

function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageText = userInput.value.trim();
    if (!messageText) return;

    // 1. Mostrar mensagem do usuário na tela
    appendMessage(messageText, 'user');
    userInput.value = '';

    // Guardar no histórico local
    conversationHistory.push({ role: "user", content: messageText });

    // 2. Colocar indicador de "pensando..." de forma simples
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('message', 'system');
    typingIndicator.innerHTML = `<p><i>Digitando...</i></p>`;
    chatContainer.appendChild(typingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        // Chamada para a nossa Serverless Function do Netlify
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: conversationHistory })
        });

        const data = await response.json();
        
        // Remover indicador de digitando
        chatContainer.removeChild(typingIndicator);

        if (data.reply) {
            appendMessage(data.reply, 'system');
            // Salva a resposta da IA no histórico para manter o contexto na próxima iteração
            conversationHistory.push({ role: "assistant", content: data.reply });
        } else {
            appendMessage("Putz, deu um bugzinho aqui na minha rede. Pode repetir?", 'system');
        }

    } catch (error) {
        console.error(error);
        chatContainer.removeChild(typingIndicator);
        appendMessage("Deu erro ao conectar com meu cérebro de IA. Tenta de novo?", 'system');
    }
});
