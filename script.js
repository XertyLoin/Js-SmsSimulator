const form = document.getElementById('message-form');
const messagesContainer = document.getElementById('messages');
const addMessageBtn = document.getElementById('add-message');
const videoPlayer = document.getElementById('background-video-player');
const messageOverlay = document.getElementById('message-overlay');
const messageContainer = document.getElementById('message-container');
const conversationName = document.getElementById('conv-name');
const videoInput = document.getElementById('background-video');
const avatar = document.querySelector('.avatar');
const voiceReceived = document.getElementById('voice-received');
const voiceSent = document.getElementById('voice-sent');
const voiceReceivedLabel = document.getElementById('voice-received-label');
const voiceSentLabel = document.getElementById('voice-sent-label');
let voices = [];

function loadVoices() {
  voices = speechSynthesis.getVoices();
  [voiceReceived, voiceSent].forEach(select => {
    select.innerHTML = '';
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang}) - ${voice.default ? 'Default' : 'Optional'}`;
      select.appendChild(option);
    });
    if (select === voiceReceived) select.value = voices.find(v => v.default)?.name || voices[0]?.name;
    if (select === voiceSent) select.value = voices.find(v => v.default)?.name || voices[0]?.name;
  });
  console.log("Voices available:", voices);
}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Gestion de la navigation
document.querySelectorAll('.menu-lien').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
      // Ferme le menu sur mobile
      const menuCb = document.getElementById('menu-cb');
      if (menuCb.checked) menuCb.checked = false;
    }
  });
});

addMessageBtn.addEventListener('click', () => {
  const div = document.createElement('div');
  div.className = 'message-input';
  div.innerHTML = `
    <input type="text" placeholder="Enter Message" class="font-signika" />
    <select class="message-type font-signika">
      <option value="received">Received</option>
      <option value="sent">Sent</option>
    </select>
    <button type="button" class="remove-message font-signika">Remove</button>
  `;
  messagesContainer.appendChild(div);
  div.querySelector('.remove-message').addEventListener('click', () => div.remove());
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const messages = Array.from(messagesContainer.querySelectorAll('.message-input')).map(input => ({
    text: input.querySelector('input').value,
    type: input.querySelector('.message-type').value
  }));
  if (!videoInput.files[0] || messages.length === 0) {
    alert('Please select a video and add at least one message.');
    return;
  }

  const convName = document.getElementById('conversation-name').value;
  conversationName.textContent = convName;
  avatar.textContent = convName.charAt(0).toUpperCase();
  videoPlayer.src = URL.createObjectURL(videoInput.files[0]);
  await videoPlayer.play();

  voiceReceivedLabel.textContent = `Voice for Received (${convName}):`;
  voiceSentLabel.textContent = `Voice for Sent (You):`;

  let currentMessageIndex = 0;

  function displayNextMessage() {
    if (currentMessageIndex >= messages.length) {
      videoPlayer.pause();
      return;
    }

    const message = messages[currentMessageIndex];
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${message.type === 'received' ? 'received' : 'sent'}`;
    msgDiv.textContent = message.text;

    if (messageContainer.children.length >= 7) {
      messageContainer.innerHTML = '';
    }

    messageContainer.appendChild(msgDiv);

    messageOverlay.style.height = `${150 + messageContainer.children.length * 30}px`;

    const utterance = new SpeechSynthesisUtterance(message.text);
    const selectedVoice = message.type === 'received' ? voiceReceived.value : voiceSent.value;
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = 1.0;
    utterance.pitch = 1.2;

    speechSynthesis.speak(utterance);

    utterance.onend = () => {
      currentMessageIndex++;
      displayNextMessage();
    };
  }

  messageContainer.innerHTML = '';
  messageOverlay.style.height = '150px';
  displayNextMessage();
});