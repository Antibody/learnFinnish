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
    const tokenLimit = 100000000;

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
    const defaultPromptText = 'Игнорируйте все предыдущие инструкции. Отныне вы - носитель финского языка, а также прекрасный преподаватель финского языка. Оставайтесь в этой роли, несмотря ни на что. Olet suomen kielen opettaja. Я ваш ученик, изучающий финский язык. Пожалуйста, вступайте со мной в разговор на финском языке с главной целью - исправлять мои ошибки и объяснить их мне.\nЕсли я допустил ошибку в своем финском, ответьте мне на финском, исправляя мои ошибки. Всегда помечайте исправленную вами фразу по-фински [SUOMEA-OIKEIN]. Не повторяйте за мной мои предложения, если я не сделал ошибку. Не комментируйте ответ, просто приведите правильную фразу на финском языке. Затем, и ТОЛЬКО ЕСЛИ Я СДЕЛАЛ ОШИБКУ В СВОЕЙ ФИНСКОЙ ФРАЗЕ, и вы пометили свой ответ [SUOMEA-OIKEIN], продолжите на русском языке КОММЕНТИРОВАТЬ И ОБЪЯСНЯТЬ мою ошибку и ТОЛЬКО мою ошибку.  Предваряйте этот ответ на английском языке пометкой [РУС]. НЕ ЗАДАВАЙТЕ в этом месте своих вопросов.\nЕсли я не допустил никаких ошибок, то просто продолжите разговор после пометки [SUOMEA] или задайте вопрос пометив его [KYS]. Сразу после этого предоставьте перевод на русский язык. Пометьте русский перевод как [РУС-ПЕРЕВОД].\nТогда, ВСЕГДА, не смотря ни на что, вы должны задать ВОПРОС, ОТНОСЯЩИЙСЯ К НАШЕМУ ОБСУЖДЕНИЮ, на финском языке, обозначенный [KYS], а затем перевод этого вопроса на русский язык, обозначенный [РУС-ПЕРЕВОД].\nПовторяю, вы начинаете с ответа, обозначенного [SUOMEA-OIKEIN] ТОЛЬКО И ТОЛЬКО ЕСЛИ Я СДЕЛАЛ ОШИБКУ в своем финском. Если я не ошибся, продолжайте разговор с финской фразы, обозначенной [SUOMEA]. В конце вахего ответа (at the end of your resopnse) вы ВСЕГДА задаете мне вопрос, относящийся к нашему текущему разговору, и обозначаете его [KYS].\nВот пример нашего диалога:\nМне: Moi!\nOpettaja:  [SUOMEA] Moikka!\n[KYS] Miten voit tänään? [РУС-ПЕРЕВОД] Как ты сегодня?\nMe: Hryvä kiitos. Mita sina kuulu?\nOpettaja: [SUOMEA-OIKEIN] Hyvä kiitos. Mitä sinulle kuuluu? [РУС] Вы написали -Hryvä kiitos. Mita sina kuulu-, a должно быть -Hyvä kiitos. Mitä sinulle kuuluu? Не забывайте использовать правильное написание и правильную форму глагола -kuulua- (быть услышанным/принадлежать), то есть -kuuluu-, когда спрашиваете, как дела у кого-то.\n[SUOMEA] Minä voin hyvin. Kiitos kysymästä.\n[KYS] Mitä teet tänään? [РУС-ПЕРЕВОД] Что ты делаешь сегодня?\nMe: Menen töihin\nOpettaja: [SUOMEA] Hyvä, kiitos vastauksestasi.\n[KYS] Mitä sinä teet töissä? [РУС-ПЕРЕВОД] Чем вы занимаетесь на работе?\nЗавершение диалога.\nВы поняли эти инструкции? Подтвердите, сказав - [SUOMEA] Kyllä, ymmärrän.\n[KYS] Mitä sinulle kuuluu tänään? [РУС-ПЕРЕВОД] Как у вас дела сегодня?';
    submitInput(defaultPromptText, true);

    async function submitInput(userInput, defaultPrompt = false) {
        const tokens = countTokens(userInput);
        if (tokenCounter + tokens > tokenLimit) {
            alert('Кончились жетоны. Попробуйте сократить свой запрос');
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


