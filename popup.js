function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("UserAudioDB", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("audioFiles");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAudio(blob) {
  const db = await openDB();
  const tx = db.transaction("audioFiles", "readwrite");
  tx.objectStore("audioFiles").put(blob, "custom-audio");
  return tx.complete;
}

document.getElementById("saveBtn").onclick = async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("Select a file first.");
  await saveAudio(file);
  alert("Audio saved!");
};
