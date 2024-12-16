const faceitApiKey = '2dcfe758-ab25-46e0-b20f-f1fe87345e1b'

function getHeaders(){
    return {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "faceit-referer": "web-next",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
    }
}

window.onload = () => {
    // wait for match
    chrome.runtime.sendMessage(false);
    let shield = false
    var mutationObserver = new MutationObserver(function (){
        let matchCame = false
        if(document.querySelector('div[role="dialog"]')){
            let buttons = document.querySelectorAll('div[role="dialog"] button')
            for (let i = 0; i < buttons.length; i++) {
                const node = buttons[i];
                if(node.innerText.toLowerCase() == 'accept'){
                    matchCame = true
                    setTimeout(() => {
                        node.click()
                    }, 1000);
                    break
                }
            }
        }
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
        downloadButton.style.zIndex = 66
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
            fetch("https://www.faceit.com/api/users/v1/sessions/me", {
                "headers": getHeaders(),
                "mode": "cors",
                "credentials": "include"
            })
            .then(r => r.json())
            .then(r => {
                let userId = r['payload']['id']
                fetch(`https://api.faceit.com/stats/v1/stats/time/users/${userId}/games/cs2?page=0&size=1`)
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
        if(Boolean(document.querySelector('div[name="info"]') && Boolean(document.querySelector('div[name="info"]').querySelector('button')))){
            // report all opponents in room
            if(!reportShield){
                reportShield = true
                setTimeout(() => {
                    let infoContainer = document.querySelector('div[name="info"]')
                    let newButton = infoContainer.querySelectorAll('button')[infoContainer.querySelectorAll('button').length - 1].cloneNode(true)
                    newButton.removeAttribute('href')
                    newButton.style.marginTop = '10px';
                    (newButton.querySelector('span') || newButton).innerText = 'Report all opponents'
                    newButton.addEventListener('click', function(){
                        fetch("https://www.faceit.com/api/users/v1/sessions/me", {
                            "headers": getHeaders(),
                            "mode": "cors",
                            "credentials": "include"
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
            // // auto download current match ip
            // if(!ipShield){
            //     ipShield = true
            //     setTimeout(() => {
            //         let infoContainer = document.querySelector('div[name="info"]')
            //         let buttons = infoContainer.querySelectorAll('a[href^="steam"]')
            //         for (let i = 0; i < buttons.length; i++) {
            //             if(buttons[i].innerText == 'CONNECT'){
            //                 let text = decodeURIComponent(buttons[i].href).split('+')[1]
            //                 const link = document.createElement("a")
            //                 const file = new Blob([text], { type: 'text/plain' })
            //                 link.href = URL.createObjectURL(file)
            //                 link.download = "faceit-ip.txt"
            //                 link.click()
            //                 URL.revokeObjectURL(link.href)
            //                 navigator.clipboard.writeText(text)
            //                 break
            //             }
            //         }
            //     }, 1000);
            // }
        }
        else{
            if(reportShield){
                reportShield = false
            }
            if(ipShield){
                ipShield = false
            }
        }
        if(Boolean(document.querySelector('div[name="roster1"]'))){
            // show how many times we have played with each opponent
            if(!countShield){
                countShield = true
                setTimeout(() => {
                    fetch("https://www.faceit.com/api/users/v1/sessions/me", {
                        "headers": getHeaders(),
                        "mode": "cors",
                        "credentials": "include"
                    })
                    .then(r => r.json())
                    .then(r => {
                        let promises = []
                        let userId = r['payload']['id']
                        // get total matches played
                        fetch(`https://api.faceit.com/stats/v1/stats/users/${userId}/games/cs2`)
                        .then(r => r.json())
                        .then(r => {
                            // scan all matches of player
                            let numberOfMatches = Math.min(Number(r['lifetime']['m1']), 1000) // max 1000
                            let limit = 100 // max 100
                            let offset = 0
                            while (offset < numberOfMatches) {
                                let promise = fetch(`https://open.faceit.com/data/v4/players/${userId}/history?game=cs2&offset=${offset}&limit=${limit}`, {
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
                                counter = {}
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
                                                    won: !opponentWon
                                                })
                                                counter[key].won += Number(!opponentWon)
                                                counter[key].lost += Number(opponentWon)
                                            }
                                            else{
                                                counter[key] = {
                                                    name: player['nickname'],
                                                    matches: [{
                                                        url: match['faceit_url'].replace('{lang}', 'en'),
                                                        won: !opponentWon
                                                    }],
                                                    won: Number(!opponentWon),
                                                    lost: Number(opponentWon)
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
                                        let rosterContainer = document.querySelector(`div[name="${rosterContainerName}"]`)
                                        let divs = rosterContainer.querySelectorAll('div')
                                        for (let i = 0; i < divs.length; i++) {
                                            if((divs[i].innerText == playerName) && (divs[i].previousSibling === null)){
                                                let historyContainer = divs[i].cloneNode()
                                                historyContainer.innerHTML = `<span style="color: #32d35a">Your Ws</span>: ${playerHistory.won}&emsp;<span style="color: #ff6c20">Your Ls</span>: ${playerHistory.lost}`
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
            let playerNameLink = document.querySelector('div[data-popper-escaped] a[class^="UserCard__NicknameContainer"]')
            let statsContainer = document.querySelector('div[class^="UserCard__Section-"]')
            let statsContainerReady = statsContainer
            let historyContainerExists = Boolean(document.getElementById('history-container'))
            if(playerNameLink && !historyContainerExists && statsContainerReady && counterReady){
                if(!historyShield){
                    historyShield = true
                    let historyContainer = statsContainer.cloneNode(true)
                    historyContainer.setAttribute('id', 'history-container')
                    let playerName = playerNameLink.href.split('/').slice(-1)[0]
                    let playerId = Object.keys(counter).find(userId => {
                        return counter[userId].name == playerName
                    });
                    if(!counter[playerId]){
                        historyShield = false
                        return
                    }

                    let historyHtml = ''
                    counter[playerId].matches.forEach(match => {
                        let span = `<span style="color: ${match.won ? '#32d35a' : '#a7a7a7'}; font-weight: bold; line-height: 20px;">${match.won ? 'W' : 'L'}</span>`
                        let link = `<a href="${match['url']}" target="_blank" style="margin: 0 4px 0 0;">${span}</a>`
                        historyHtml += link
                    });
                    historyContainer.children[0].textContent = 'Your history against them'
                    historyContainer.querySelector('div').children[0].querySelector('span').textContent = counter[playerId].won + counter[playerId].lost
                    historyContainer.querySelector('div').children[1].querySelector('span').textContent = Math.round(counter[playerId].won * 100 / (counter[playerId].won + counter[playerId].lost))
                    let historyListContainer = historyContainer.querySelector('div').children[2]
                    historyListContainer.children[0].style.display = 'flex'
                    historyListContainer.children[0].style.flexWrap = 'wrap'
                    historyListContainer.children[0].innerHTML = historyHtml
                    historyListContainer.children[1].textContent = 'Matchrooms'
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
