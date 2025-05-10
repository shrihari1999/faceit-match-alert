const audio = document.getElementById('audio');
audio.src = 'alert.mp3';

audio.onended = () => {
  chrome.runtime.sendMessage({'type': 'alert', 'data': 'close'});
};

audio.play();
