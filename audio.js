const audio = document.getElementById('audio');
audio.src = 'alert.mp3';

audio.onended = () => {
  chrome.runtime.sendMessage('close');
};

audio.play();
