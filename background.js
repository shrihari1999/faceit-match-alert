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

async function getSteamComments(profileId, isFirst, totalPages=null){
    
    const headers = {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "max-age=0",
        "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1"
    }

    if(isFirst){
        // Fetch first page to get comment count
        const firstRes = await fetch(`https://steamcommunity.com/profiles/${profileId}/allcomments`, {
            "headers": headers,
            "body": null,
            "method": "GET",
        })
        const firstHtml = await firstRes.text();
        return firstHtml
    }
    else{
        // Create fetches for pages 2..N
        let promises = []
        for (let page = 2; page <= totalPages; page++) {
            let promise = fetch(`https://steamcommunity.com/profiles/${profileId}/allcomments?ctp=${page}`, {
                "headers": headers,
                "body": null,
                "method": "GET",
            })
            .then(res => res.text())
            promises.push(promise)
        }
        const htmlPages = await Promise.all(promises);
        return htmlPages
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.type == 'alert'){
            if(request.data == 'play'){
                playAlert()
            }
            else if(request.data == 'mute'){
                let tabId = sender.tab.id
                chrome.tabs.get(tabId, async (tab) => {
                    let muted = true
                    chrome.tabs.update(tabId, { muted });
                });
            }
            else{
                chrome.offscreen.closeDocument()
            }
        }
        else if(request.type == 'comments-first'){
            getSteamComments(request.data.profile, true)
            .then((x) => sendResponse(x))
            return true
        }
        else if(request.type == 'comments'){
            getSteamComments(request.data.profile, false, request.data.totalPages)
            .then(sendResponse)
            return true
        }
    }
);
