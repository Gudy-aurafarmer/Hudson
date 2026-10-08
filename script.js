// importação da bliblioteca WebLLM direto de uma CDN
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

const chatBox = document.getElementById("chat-box")
const userInput = document.getElementById("user-input")
const sendBtn = document.getElementById("send-btn")
const statusText =  document.getElementById("status")

// Escolha de um modelo leve e rápido (Llama 3.2 de 1 Bilhão de parâmetros)
const selectedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC"
let engine

// Função para iniciar a IA
async function initAI() {
    try {
        // Callback para atualizar o progresso do download na tela
        const initProgressCallback = (report) => {
            statusText.innerText = report.text;
        };

        // Cria e carrega o motor da IA
        engine = await webllm.CreateMLCEngine(
            selectedModel,
            { initProgressCallback: initProgressCallback }
        );

        statusText.innerText = "IA Pronta! Pode enviar sua mensagem.";
        userInput.disabled = false;
        sendBtn.disabled = false;
    } catch (error) {
        statusText.innerText = "Erro: Seu navegador não suporta WebGPU ou houve falha no download.";
        console.error(error);
    }
}

// Histórico da conversa para dar contexto à IA
const messages = [
    { role: "system", content: "Você é um assistente virtual prestativo, inteligente e fala português do Brasil." }
];

// Função para enviar e receber mensagens
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Mostrar mensagem do usuário
    addMessageToUI(text, "user-message");
    userInput.value = "";
    messages.push({ role: "user", content: text });

    // Bloqueia o input enquanto a IA pensa
    userInput.disabled = true;
    sendBtn.disabled = true;
    statusText.innerText = "Gerando resposta...";

    // 2. Criar balão vazio para a resposta da IA
    const aiMessageDiv = addMessageToUI("...", "ai-message");

    try {
        // Pede a resposta para a IA de forma "stream" (palavra por palavra)
        const chunks = await engine.chat.completions.create({
            messages,
            temperature: 0.7,
            stream: true, // Habilita o efeito de digitação em tempo real
        });

        let aiFullResponse = "";

        // Atualiza o texto na tela conforme as palavras chegam
        for await (const chunk of chunks) {
            const reply = chunk.choices[0]?.delta?.content || "";
            aiFullResponse += reply;
            aiMessageDiv.innerText = aiFullResponse;
        }

        // Salva a resposta da IA no histórico
        messages.push({ role: "assistant", content: aiFullResponse });
        statusText.innerText = "Pronto!";

    } catch (error) {
        aiMessageDiv.innerText = "Ops, ocorreu um erro ao gerar a resposta.";
        console.error(error);
    }

    // Desbloqueia o input
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
}

// Função auxiliar para criar as mensagens na tela
function addMessageToUI(text, className) {
    const div = document.createElement("div")
    div.className = `message ${className}`
    div.innerText = text
    chatBox.appendChild(div)
    chatBox.scrollTop = chatBox.scrollHeight
    return div
}

// Eventos de clique e tecla "Enter"
sendBtn.addEventListener("click", sendMessage)
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage()
})

// Inicia o carregamento assim que a página abre
initAI();