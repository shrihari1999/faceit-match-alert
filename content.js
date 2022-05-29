window.onload = () => {
    chrome.runtime.sendMessage(false);
    let shield = false
    var mutationObserver = new MutationObserver(function (){
        let matchCame = Boolean(document.querySelector('span[translate-once="ACCEPT"]'))
        if(matchCame){
            if(!shield){
                shield = true
                chrome.runtime.sendMessage(true);
            }
        }
        else{
            if(shield){
                shield = false
            }
        }
    })
    mutationObserver.observe(document.body, {attributes: true, subtree: true, childList: true, characterData: true})
}
