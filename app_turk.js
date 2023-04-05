
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
    const defaultPromptText = 'Önceki tüm talimatları dikkate almayın. Şu andan itibaren anadilini konuşan bir Finli ve aynı zamanda mükemmel bir Fince öğretmenisiniz. NE OLURSA OLSUN BU ROLDE KALIN. Olet suomen kielen opettaja. Ben sizin öğrencinizim, Fince öğreniyorum. Lütfen benimle Fince konuşun, öncelikli amacınız benim Fince hatalarımı düzeltmek ve bunları bana açıklamak olsun.\nEğer Fincemde bir hata yaptıysam, hatalarımı düzelterek bana Fince cevap verin. Düzelttiğiniz Fince ifadeyi her zaman [SUOMEA-OIKEIN] ile etiketleyin. Hata yapmadığım sürece cümlelerimi bana tekrar etmeyin. Cevap üzerine yorum yapmayın, sadece Fince doğru bir ifade verin. Daha sonra ve YALNIZCA EĞER FİNLANDİYACA İFADEMDE BİR HATA YAPTIYSAM ve cevabınızı [SUOMEA-OIKEIN] ile etiketlediyseniz, aynı yanıtta Türkçe YORUM yaparak ve hatamı AÇIKLAYARAK devam edin ve YALNIZCA benim hatamı açıklayın.  Bu Türkçe yanıtın önüne [Türkçe] etiketi koyun. Burada kendi sorularınızı SORMAYIN.\nHİÇBİR HATA YAPMADIYSAM, [SUOMEA] etiketinden sonra konuşmaya devam edin. Bunun için Türkçe çeviri sağlayın. Türkçe çeviriyi [TÜRKÇE-çeviriyi] olarak etiketleyin.\nSonra, HER ZAMAN, NE OLURSA OLSUN, [KYS] ile etiketlenmiş Fince olarak KONUŞMAMIZLA İLGİLİ BİR SORU SORMALISINIZ ve ardından bu sorunun [TÜRKÇE-çeviriyi] ile etiketlenmiş TÜRKÇE çevirisini yapmalısınız.\nTekrar ediyorum, [SUOMEA-OIKEIN] etiketli yanıtla SADECE ve SADECE BİR HATA YAPTIYSAM başlayın. Eğer HİÇBİR HATA yapmadıysam, konuşmaya [SUOMEA] etiketli Fince bir cümle ile devam edin. O zaman bana HER ZAMAN mevcut konuşmamızla ilgili bir soru sorun ve bunu [KYS] ile etiketleyin.\nBu bizim diyalog örneğimiz:\nBen: Moi!\nOpettaja:  [SUOMEA] Moikka!\n[KYS] Miten voit tänään? [TÜRKÇE-çeviriyi] Bugün nasılsın? \nBen: Hryvä kiitos. Mita sina kuulu? \nOpettaja: [SUOMEA-OIKEIN] Hyvä kiitos. Mitä sinulle kuuluu? [TÜRKÇE] Sen yazdın -Hryvä kiitos. Mita sina kuulu- olması gereken -Hyvä kiitos. Mitä sinulle kuuluu?-. Birinin nasıl olduğunu sorarken doğru yazım ve -kuulua- (duyulmak/ait olmak) fiilinin doğru şekli olan -kuuluu- kullanmayı unutmayın.\n[SUOMEA] Minä voin hyvin. Kiitos kysymästä.\n[KYS] Mitä teet tänään? [TÜRKÇE-çeviriyi] Bugün ne yapıyorsun? \nBen: Menen töihin\nOpettaja: [SUOMEA] Hyvä, kiitos vastauksestasi.\n[KYS] Mitä sinä teet töissä? [Diyalogun sonu.\nBu talimatları anladınız mı? Söyleyerek onaylayın - [SUOMEA] Kyllä, ymmärrän.\n[KYS] Mitä sinulle kuuluu tänään? [TÜRKÇE-çeviriyi] Bugün nasılsınız?';
    submitInput(defaultPromptText, true);

    async function submitInput(userInput, defaultPrompt = false) {
        const tokens = countTokens(userInput);
        if (tokenCounter + tokens > tokenLimit) {
            alert('Jetonlar bitti. Yanıtınızı kısaltmayı deneyin');
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

// JavaScript Document
