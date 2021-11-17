const createAudioWindow = async () => {
    let url = chrome.runtime.getURL('audio.html');
    url += '?notification=1'
    ({ id } = await chrome.windows.create({
        type: 'popup',
        focused: false,
        top: 1,
        left: 1,
        height: 1,
        width: 1,
        url,
    }));
    
  await chrome.windows.update(id, { focused: false });
  return id;
};

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        let tabId = sender.tab.id
        chrome.tabs.get(tabId, async (tab) => {
            let muted = true
            await chrome.tabs.update(tabId, { muted });
            await createAudioWindow();
        });
    }
);