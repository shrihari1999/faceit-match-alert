const createAudioWindow = async () => {
    let url = chrome.runtime.getURL('audio.html');

    chrome.windows.create({
        type: 'popup',
        focused: true,
        top: 1,
        left: 1,
        height: 1,
        width: 1,
        url,
    })
    
    // await chrome.windows.update(window.id, { focused: true, state: 'docked' });
    // return window.id;
    return
};

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request){
            createAudioWindow();
        }
        else{
            let tabId = sender.tab.id
            chrome.tabs.get(tabId, async (tab) => {
                let muted = true
                chrome.tabs.update(tabId, { muted });
            });
        }
    }
);
