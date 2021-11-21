window.onload = () => {
    let shield = false
    var mutationObserver = new MutationObserver(function (mutations){
        let matchCame = document.getElementsByTagName('countdown-timer').length
        if(matchCame){
            if(!shield){
                shield = true
                chrome.runtime.sendMessage('');
            }
        }
        else{
            shield = false
        }
    })
    mutationObserver.observe(document.body, {attributes: true, subtree: true, childList: true, characterData: true})
}
