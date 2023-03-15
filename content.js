window.onload = () => {
    const accessToken = localStorage.getItem('token')
    const faceitApiKey = '2dcfe758-ab25-46e0-b20f-f1fe87345e1b'
    // wait for match
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
    
    // download latest match
    setTimeout(() => {
        let downloadButton = document.createElement('div')
        downloadButton.setAttribute('class', 'download-button')
        downloadButton.innerHTML = '<span>▼</span>'
        downloadButton.style.position = 'fixed'
        downloadButton.style.bottom = '80px'
        downloadButton.style.right = '16px'
        downloadButton.style.width = '48px'
        downloadButton.style.height = '48px'
        downloadButton.style.borderRadius = '2px'
        downloadButton.style.cursor = 'pointer'
        downloadButton.style.zIndex = 14
        downloadButton.style.transition = 'width 0.2s,height 0.2s'
        downloadButton.style.backgroundColor = '#404040'
        downloadButton.style.display = 'flex'
        downloadButton.style.justifyContent = 'center'
        downloadButton.style.alignItems = 'center'
        downloadButton.style.color = '#cacaca'
        downloadButton.style.fontSize = '26px'
        downloadButton.style.boxShadow = '0 4px 12px 0 rgb(0 0 0 / 75%)'
        let body = document.getElementsByTagName('body')[0]
        body.appendChild(downloadButton)
        
        downloadButton.onclick = function(){
            fetch('https://api.faceit.com/users/v1/sessions/me', {
                headers: {
                    'authorization': `Bearer ${accessToken}`
                }
            })
            .then(r => r.json())
            .then(r => {
                let userId = r['payload']['id']
                fetch(`https://api.faceit.com/stats/v1/stats/time/users/${userId}/games/csgo?page=0&size=1`)
                .then(r => r.json())
                .then(r => {
                    let mapName = r[0]['i1']
                    if(confirm(`Download ${mapName}?`)){
                        let matchId = r[0]['matchId']
                        fetch(`https://api.faceit.com/match/v2/match/${matchId}`)
                        .then(r => r.json())
                        .then(r => window.open(r['payload']['demoURLs'][0]))
                    }
                })
            })
        }
    }, 3000);

    let reportShield = false
    let ipShield = false
    let countShield = false
    let historyShield = false
    
    let counter = {}
    let counterReady = false
    var mutationObserverForReport = new MutationObserver(function (){
        const shadowRoot = document.getElementById('parasite-container').shadowRoot
        let parasiteReady = Boolean(shadowRoot) && (typeof(shadowRoot.querySelector) === 'function')
        if(parasiteReady && Boolean(shadowRoot.querySelector('div[name="info"]') && Boolean(shadowRoot.querySelector('div[name="info"]').querySelector('a')))){
            // report all opponents in room
            if(!reportShield){
                reportShield = true
                setTimeout(() => {
                    let infoContainer = shadowRoot.querySelector('div[name="info"]')
                    let newButton = infoContainer.querySelector('a').cloneNode(true)
                    newButton.removeAttribute('href')
                    newButton.style.marginTop = '10px';
                    (newButton.querySelector('span') || newButton).innerText = 'Report all opponents'
                    newButton.addEventListener('click', function(){
                        fetch('https://api.faceit.com/users/v1/sessions/me', {
                            headers: {
                                'authorization': `Bearer ${accessToken}`
                            }
                        })
                        .then(r => r.json())
                        .then(r => {
                            let userId = r['payload']['id']
                            let matchId = location.href.split('room/')[1]
                            fetch(`https://api.faceit.com/match/v2/match/${matchId}`)
                            .then(r => r.json())
                            .then(r => {
                                const { faction1, faction2 } = r['payload']['teams']
                                let opponentFaction = (
                                    faction1['roster'].find(player => {
                                        return player['id'] == userId
                                    }) === undefined
                                ) ? faction1 : faction2
                                opponentFaction['roster'].forEach(player => {
                                    fetch(`https://api.faceit.com/fbi/v1/matches/${matchId}/report`, {
                                        headers: {
                                            "authorization": `Bearer ${accessToken}`,
                                            "accept": "application/json, text/plain, */*",
                                            "accept-language": "en-US,en;q=0.9",
                                            "content-type": "application/json",
                                        },
                                        referrer: "https://api.faceit.com/proxy.html",
                                        referrerPolicy: "strict-origin-when-cross-origin",
                                        body: JSON.stringify({
                                            "matchId": matchId,
                                            "reportedUserId": player['id'],
                                            "category": "cheat",
                                            "subCategory": "cheating",
                                            "comment": ""
                                        }),
                                        method: "POST",
                                        mode: "cors",
                                    });
                                });
                                alert('All opponents reported!')
                            })
                        })
                    })
                    infoContainer.append(newButton)
                }, 1000);
            }
            // auto download current match ip
            if(!ipShield){
                ipShield = true
                setTimeout(() => {
                    let infoContainer = shadowRoot.querySelector('div[name="info"]')
                    let buttons = infoContainer.querySelectorAll('a[href^="steam"]')
                    for (let i = 0; i < buttons.length; i++) {
                        if(buttons[i].innerText == 'CONNECT'){
                            let text = decodeURIComponent(buttons[i].href).split('+')[1]
                            const link = document.createElement("a")
                            const file = new Blob([text], { type: 'text/plain' })
                            link.href = URL.createObjectURL(file)
                            link.download = "faceit-ip.txt"
                            link.click()
                            URL.revokeObjectURL(link.href)
                            navigator.clipboard.writeText(text)
                            break
                        }
                    }
                }, 1000);
            }
        }
        else{
            if(reportShield){
                reportShield = false
            }
            if(ipShield){
                ipShield = false
            }
        }
        if(parasiteReady && Boolean(shadowRoot.querySelector('div[name="roster1"]'))){
            // show how many times we have played with each opponent
            if(!countShield){
                countShield = true
                setTimeout(() => {
                    fetch('https://api.faceit.com/users/v1/sessions/me', {
                        headers: {
                            'authorization': `Bearer ${accessToken}`
                        }
                    })
                    .then(r => r.json())
                    .then(r => {
                        let promises = []
                        let userId = r['payload']['id']
                        // get total matches played
                        fetch(`https://api.faceit.com/stats/v1/stats/users/${userId}/games/csgo`, {
                            "headers": {
                                'authorization': `Bearer ${accessToken}`
                            },
                        })
                        .then(r => r.json())
                        .then(r => {
                            // scan all matches of player
                            let numberOfMatches = Math.min(Number(r['lifetime']['m1']), 1000) // max 1000
                            let limit = 100 // max 100
                            let offset = 0
                            while (offset < numberOfMatches) {
                                let promise = fetch(`https://open.faceit.com/data/v4/players/${userId}/history?game=csgo&offset=${offset}&limit=${limit}`, {
                                    "headers": {
                                        "accept": "application/json, text/plain, */*",
                                        "accept-language": "en-US,en;q=0.9",
                                        'authorization': `Bearer ${faceitApiKey}`
                                    },
                                })
                                .then(r => r.json())
                                promises.push(promise)
                                offset += limit
                            }
                            // accumulate counter once all promises resolved
                            Promise.all(promises).then(results => {
                                results.forEach(result => {
                                    result['items'].forEach(match => {
                                        const { faction1, faction2 } = match['teams']
                                        let opponentFaction = faction1['players'].find(player => {
                                            return player['player_id'] == userId
                                        }) === undefined
                                        let opponentWon;
                                        if(opponentFaction){
                                            opponentFaction = faction1
                                            opponentWon = match['results']['winner'] == 'faction1'
                                        }
                                        else{
                                            opponentFaction = faction2
                                            opponentWon = match['results']['winner'] == 'faction2'
                                        }
                                        opponentFaction['players'].forEach(player => {
                                            let key = player['player_id']
                                            if(counter[key]){
                                                counter[key].matches.push({
                                                    url: match['faceit_url'].replace('{lang}', 'en'),
                                                    won: opponentWon
                                                })
                                                counter[key].won += Number(opponentWon)
                                                counter[key].lost += Number(!opponentWon)
                                            }
                                            else{
                                                counter[key] = {
                                                    name: player['nickname'],
                                                    matches: [{
                                                        url: match['faceit_url'].replace('{lang}', 'en'),
                                                        won: opponentWon
                                                    }],
                                                    won: Number(opponentWon),
                                                    lost: Number(!opponentWon)
                                                }
                                            }
                                        });
                                    });
                                });
                                // assign counts to each player
                                let matchId = location.href.split('room/')[1]
                                fetch(`https://api.faceit.com/match/v2/match/${matchId}`)
                                .then(r => r.json())
                                .then(r => {
                                    const { faction1, faction2 } = r['payload']['teams']
                                    let opponentFaction = faction1['roster'].find(player => {
                                            return player['id'] == userId
                                    }) === undefined
                                    let rosterContainerName;
                                    if(opponentFaction){
                                        opponentFaction = faction1
                                        rosterContainerName = 'roster1'
                                    }
                                    else{
                                        opponentFaction = faction2
                                        rosterContainerName = 'roster2'
                                    }
                                    opponentFaction['roster'].forEach(player => {
                                        let playerName = player['nickname']
                                        let playerHistory = counter[player['id']] || { matches: [], won: 0, lost: 0 }
                                        // update player history
                                        let rosterContainer = shadowRoot.querySelector(`div[name="${rosterContainerName}"]`)
                                        let divs = rosterContainer.querySelectorAll('div')
                                        for (let i = 0; i < divs.length; i++) {
                                            if(divs[i].innerText == playerName){
                                                let historyContainer = divs[i].cloneNode()
                                                historyContainer.innerHTML = `<span style="color: #32d35a">W</span>: ${playerHistory.won}&emsp;<span style="color: #ff6c20">L</span>: ${playerHistory.lost}`
                                                divs[i].after(historyContainer)
                                                break
                                            }
                                        }
                                    });
                                    counterReady = true
                                })
                            })
                        })
                    })
                }, 1000);
            }
            // show history in player modal
            let playerNameLink = document.querySelector('div[data-popper-escaped] a[href*="players-modal"]')
            let statsContainer = document.querySelector('div[data-popper-escaped]>div>div>div:last-child>div:nth-child(3)')
            let statsContainerReady = statsContainer && !Boolean(statsContainer.querySelector('div>button'))
            let historyContainerExists = Boolean(document.getElementById('history-container'))
            if(!historyContainerExists && statsContainerReady && counterReady){
                if(!historyShield){
                    historyShield = true
                    let historyContainer = statsContainer.cloneNode(true)
                    historyContainer.setAttribute('id', 'history-container')
                    let playerName = playerNameLink.href.split('players-modal/')[1]
                    let playerId = Object.keys(counter).find(userId => {
                        return counter[userId].name == playerName
                    });
                    if(!counter[playerId]){
                        return
                    }

                    let historyHtml = ''
                    counter[playerId].matches.forEach(match => {
                        let span = `<span style="color: ${match.won ? '#32d35a' : '#ffffff99'}; font-weight: bold;">${match.won ? 'W' : 'L'}</span>`
                        let link = `<a href="${match['url']}" target="_blank" style="margin: 0 4px 0 0;">${span}</a>`
                        historyHtml += link
                    });
                    historyContainer.children[0].textContent = 'History with you'
                    historyContainer.querySelector('div').children[0].remove()
                    historyContainer.querySelector('div').children[0].remove()
                    let historyListContainer = historyContainer.querySelector('div').children[0]
                    historyListContainer.children[0].style.display = 'flex'
                    historyListContainer.children[0].style.flexWrap = 'wrap'
                    historyListContainer.children[0].innerHTML = historyHtml
                    historyListContainer.children[1].textContent = 'Click on a result to view match'
                    statsContainer.after(historyContainer)
                    historyShield = false
                }
            }
        }
        else{
            if(countShield){
                countShield = false
            }
        }
    })
    mutationObserverForReport.observe(document.body, {attributes: true, subtree: true, childList: true, characterData: true})
}
