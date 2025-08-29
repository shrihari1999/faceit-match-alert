async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("UserAudioDB", 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadAudio() {
  const db = await openDB();
  const tx = db.transaction("audioFiles", "readonly");
  const store = tx.objectStore("audioFiles");
  const req = store.get("custom-audio");
  
  req.onsuccess = () => {
    const blob = req.result;
    const audio = document.getElementById('audio');
    if (blob) {
      audio.src = URL.createObjectURL(blob);
    }

    audio.onended = () => {
      chrome.runtime.sendMessage({ type: 'alert', data: 'close' });
    };

    audio.play()
  };
}

loadAudio();

