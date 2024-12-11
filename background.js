async function hasOffscreenDocument() {
    if ('getContexts' in chrome.runtime) {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL('audio.html')]
      });
      return Boolean(contexts.length);
    } else {
      const matchedClients = await clients.matchAll();
      return matchedClients.some(client => {
        return client.url.includes(chrome.runtime.id);
      });
    }
}

async function playAlert(){
    let cannotCreateOffscreenDocument = await hasOffscreenDocument()
    if(!cannotCreateOffscreenDocument){
        chrome.offscreen.createDocument({
            url: chrome.runtime.getURL('audio.html'),
            reasons: ['AUDIO_PLAYBACK'],
            justification: 'notification',
        });
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(typeof(request) === 'boolean'){
            if(request){
                playAlert()
            }
            else{
                let tabId = sender.tab.id
                chrome.tabs.get(tabId, async (tab) => {
                    let muted = true
                    chrome.tabs.update(tabId, { muted });
                });
            }
        }
        else{
            chrome.offscreen.closeDocument()
        }
    }
);
