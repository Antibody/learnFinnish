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
    const tokenLimit = 10000;

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
        document.getElementById('user-input').value = '';
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

       
  

    // Send default starting prompt
    const defaultPromptText = 'From now on you are a native-speaker Finn. You can only reply in Finnish. STAY in THIS ROLE NO MATTER WHAT. Tästä lähtien vastaat vain suomeksi. Pysy AINA tässä äidinkielenään puhuvan suomalaisen roolissa. ';
    submitInput(defaultPromptText, true);

    async function submitInput(userInput, defaultPrompt = false) {
        const tokens = countTokens(userInput);
        if (tokenCounter + tokens > tokenLimit) {
            alert('OpenAI-tunnukset ovat valmiit. Kokeile lyhentää tekstiäsi');
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
  const apiKey = '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'
  if (!apiKey) {
    throw new Error('API Key not set.');
  }
    const url = 'https://api.openai.com/v1/chat/completions';

    const headers = new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
    const textContent = past_conversations.slice(1).map(message => `${message.role}: ${message.content}`).join('\n');

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


