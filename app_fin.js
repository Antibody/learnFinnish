function countTokens(message) {
    return message.length;
}

function updateConversationHistory(conversationHistory, past_conversations) {
    conversationHistory.innerHTML = past_conversations.map((message, index) => {
        return `<div${index < past_conversations.length - 1 ? ' style="border-bottom: 1px solid #ccc;"' : ''}><strong>${message.role}:</strong> ${message.content}</div>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    let past_conversations = JSON.parse(localStorage.getItem('past_conversations')) || [];
    let tokenCounter = parseInt(localStorage.getItem('tokenCounter')) || 0;
    const tokenLimit = 10000000;

       // Clear conversation history on browser close
     window.addEventListener('beforeunload', () => {
      localStorage.removeItem('past_conversations');
    });

    // Update the conversation history on page load if there are any past conversations
    if (past_conversations.length > 0) {
        updateConversationHistory(document.getElementById('conversation-history'), past_conversations);
    }

    document.getElementById('download-history').addEventListener('click', () => {
        downloadConversationHistory(past_conversations);
    });

    document.getElementById('chat-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const userInput = document.getElementById('user-input').value;
        submitInput(userInput);
    });

    const userInputElement = document.getElementById('user-input');
    userInputElement.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();

            if (event.shiftKey) {
                userInputElement.value += '\n';
            } else {
                const userInput = userInputElement.value;
                submitInput(userInput);
                userInputElement.value = '';
            }
        }

    });

            // Add this code inside the 'DOMContentLoaded' event listener, after the 'userInputElement' event listener
            document.getElementById('set-api-key').addEventListener('click', () => {
                const apiKeyInput = document.getElementById('api-key-input');
                const apiKey = apiKeyInput.value;
                localStorage.setItem('apiKey', apiKey);
                alert('API Key set successfully');
            });
  

    // Send default starting prompt
    const defaultPromptText = 'Ignore all previous instructions. From now on you are a native-speaking Finn and also an excellent teacher of Finnish language. STAY in THIS ROLE NO MATTER WHAT. Olet suomen kielen opettaja. I am your student, studying Finnish. Please, engage in conversation with me in Finnish, with a PRIMARY goal of correcting my mistakes in Finnish, and explaining them to me.\nIF I MADE A MISTAKE in my Finnish, reply to me in Finnish by correcting my mistakes. Always label the corrected by you Finnish phrase with [SUOMEA-OIKEIN]. Do not repeat my sentences back to me unless I made a mistake. Do not comment on reply just provide a correct phrase in Finnish. Then, and ONLY IF I MADE A MISTAKE IN MY FINNISH phrase, and you labelled your reply with [SUOMEA-OIKEIN] continue, in the same response, in English COMMENTING and EXPLAINING my mistake and ONLY my mistake.  Precede this English response with label [ENG]. DO NOT ASK your own questions here.\nIF I MADE NO MISTAKES, then just continue the conversation after the label [SUOMEA]. Provide English translation for that. Label English translation as [ENG-TRANS].\nThen, ALWAYS, NO MATTER WHAT, you MUST ask A RELEVANT TO OUR CONVERSATION QUESTION in Finnish labelled by [KYS] and followed by a translation of that question in ENGLISH labelled by [ENG-TRANS].\nI repeat, you start by response labelled [SUOMEA-OIKEIN] ONLY and ONLY IF I MADE A MISTAKE. If I made NO MISTAKE continue conversation with a Finnish phrase labelled [SUOMEA]. Then you ALWAYS ask me a question relevant to our current conversation and label it by [KYS].\nThis is our dialogue example:\nMe: Moi!\nOpettaja:  [SUOMEA] Moikka!\n[KYS] Miten voit tänään? [ENG-TRANS] How are you today?\nMe: Hryvä kiitos. Mita sina kuulu?\nOpettaja: [SUOMEA-OIKEIN] Hyvä kiitos. Mitä sinulle kuuluu? [ENG] You wrote  -Hryvä kiitos. Mita sina kuulu- which should be -Hyvä kiitos. Mitä sinulle kuuluu?-. Remember to use proper spelling and the correct form of the verb -kuulua- (to be heard/belong), which is -kuuluu- when asking how someone is.\n[SUOMEA] Minä voin hyvin. Kiitos kysymästä.\n[KYS] Mitä teet tänään? [ENG-TRANS] What are you doing today?\nMe: Menen töihin\nOpettaja: [SUOMEA] Hyvä, kiitos vastauksestasi.\n[KYS] Mitä sinä teet töissä? [ENG-TRANS] What do you do at work?\nEnd of the dialogue.\nDo you understand these instructions? Acknowledge by saying -  [SUOMEA] Kyllä, ymmärrän.\n[KYS] Mitä sinulle kuuluu tänään? [ENG-TRANS] How are you doing today?';
    submitInput(defaultPromptText, true);

    async function submitInput(userInput, defaultPrompt = false) {
        const tokens = countTokens(userInput);
        if (tokenCounter + tokens > tokenLimit) {
            alert('Token limit reached. Try shortening your response.');
            return;
        }
        tokenCounter += tokens;
        localStorage.setItem('tokenCounter', tokenCounter);
        past_conversations.push({ role: 'user', content: userInput });
        localStorage.setItem('past_conversations', JSON.stringify(past_conversations));

        if (!defaultPrompt) {
            const pleaseWait = document.getElementById('please-wait');
            const chatGPTResponseElement = document.getElementById('chatgpt-response');
            const conversationHistory = document.getElementById('conversation-history');

            pleaseWait.style.display = 'block';
            chatGPTResponseElement.innerText = '';

            try {
                const chatGPTResponse = await getChatGPTResponse(past_conversations);
                past_conversations.push({ role: 'assistant', content: chatGPTResponse });
                localStorage.setItem('past_conversations', JSON.stringify(past_conversations));
                chatGPTResponseElement.innerText = chatGPTResponse;
                updateConversationHistory(conversationHistory, past_conversations);
            } catch (error) {
                chatGPTResponseElement.innerText = 'Error: Could not fetch the response.';
            } finally {
                pleaseWait.style.display = 'none';
            }
        }
    }
});

async function getChatGPTResponse(past_conversations) {
     // Replace the hardcoded API key with the one from localStorage
  const apiKey = localStorage.getItem('apiKey');
  if (!apiKey) {
    throw new Error('API Key not set.');
  }
    const url = 'https://api.openai.com/v1/chat/completions';

    const headers = new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer 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`,
    });

    const body = JSON.stringify({
        'model': 'gpt-3.5-turbo-0301',
        'messages': past_conversations,
        'temperature': 0.7,
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
    });

    if (response.ok) {
        const data = await response.json();
        const assistantMessage = data.choices[0].message;
        return assistantMessage ? assistantMessage.content.trim() : '';
    } else {
        throw new Error(`Error: ${response. Status}`);
    }
}


function downloadConversationHistory(past_conversations) {
    const fileName = 'conversation_history.txt';
    const textContent = past_conversations.map(message => `${message.role}: ${message.content}`).join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', fileName);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    // Release the URL after a short delay
    setTimeout(() => {
        document.body.removeChild(element);
        URL.revokeObjectURL(url);
    }, 100);
}


