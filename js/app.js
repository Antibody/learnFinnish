document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('chat-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const userInput = document.getElementById('user-input').value;
        const pleaseWait = document.getElementById('please-wait');
        const chatGPTResponseElement = document.getElementById('chatgpt-response');

        pleaseWait.style.display = 'block';
        chatGPTResponseElement.innerText = '';

        try {
            const chatGPTResponse = await getChatGPTResponse(userInput);
            chatGPTResponseElement.innerText = chatGPTResponse;
        } catch (error) {
            chatGPTResponseElement.innerText = 'Error: Could not fetch the response.';
        } finally {
            pleaseWait.style.display = 'none';
        }
    });
});
// ... (rest of the code remains unchanged)


async function getChatGPTResponse(prompt) {
    const apiKey = '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';
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const headers = new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer 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`,
    });

    const body = JSON.stringify({
        'model': 'gpt-3.5-turbo',
        'messages': [{'role': 'user', 'content': prompt}],
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
        throw new Error(`Error: ${response.status}`);
    }
}



