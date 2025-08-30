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

const suspiciousKeywords = ["-rep", "wall", "hack", "cheat"];
function isSuspicious(comment) {
    return suspiciousKeywords.some(keyword =>
      comment.toLowerCase().includes(keyword)
    );
}

function updateSuspiciousComments(playerId, text){
    let commentsContainer = document.getElementById(`suspicious-comments-${playerId}`)
    commentsContainer.innerHTML = `<span style="color: #a7a7a7; font-size: 12px;">Sus comments: ${text}</span>`
}

window.onload = () => {
    // wait for match
    chrome.runtime.sendMessage({'type': 'alert', 'data': 'mute'});
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
                chrome.runtime.sendMessage({'type': 'alert', 'data': 'play'});
            }
        }
        else{
            if(shield){
                shield = false
            }
        }
    })
    mutationObserver.observe(document.body, {attributes: true, subtree: true, childList: true, characterData: true})

    let reportShield = false
    let ipShield = false
    let countShield = false
    let historyShield = false
    
    let counter = {}
    let counterReady = false
    let steamIdMapping = {}
    var mutationObserverForReport = new MutationObserver(function (){
        if(Boolean(document.querySelector('div[name="info"]') && Boolean(document.querySelector('div[name="info"]').querySelector('button')))){
            // report all opponents in room
            // if(!reportShield){
            //     reportShield = true
            //     setTimeout(() => {
            //         let infoContainer = document.querySelector('div[name="info"]')
            //         let newButton = infoContainer.querySelectorAll('button')[infoContainer.querySelectorAll('button').length - 1].cloneNode(true)
            //         newButton.removeAttribute('href')
            //         newButton.style.marginTop = '10px';
            //         (newButton.querySelector('span') || newButton).innerText = 'Report all opponents'
            //         newButton.addEventListener('click', function(){
            //             fetch("https://www.faceit.com/api/users/v1/sessions/me", {
            //                 "headers": getHeaders(),
            //                 "mode": "cors",
            //                 "credentials": "include"
            //             })
            //             .then(r => r.json())
            //             .then(r => {
            //                 let userId = r['payload']['id']
            //                 let matchId = location.href.split('room/')[1]
            //                 fetch(`https://api.faceit.com/match/v2/match/${matchId}`)
            //                 .then(r => r.json())
            //                 .then(r => {
            //                     const { faction1, faction2 } = r['payload']['teams']
            //                     let opponentFaction = (
            //                         faction1['roster'].find(player => {
            //                             return player['id'] == userId
            //                         }) === undefined
            //                     ) ? faction1 : faction2
            //                     opponentFaction['roster'].forEach(player => {
            //                         fetch(`https://api.faceit.com/fbi/v1/matches/${matchId}/report`, {
            //                             headers: {
            //                                 "accept": "application/json, text/plain, */*",
            //                                 "accept-language": "en-US,en;q=0.9",
            //                                 "content-type": "application/json",
            //                             },
            //                             referrer: "https://api.faceit.com/proxy.html",
            //                             referrerPolicy: "strict-origin-when-cross-origin",
            //                             body: JSON.stringify({
            //                                 "matchId": matchId,
            //                                 "reportedUserId": player['id'],
            //                                 "category": "cheat",
            //                                 "subCategory": "cheating",
            //                                 "comment": ""
            //                             }),
            //                             method: "POST",
            //                             mode: "cors",
            //                         });
            //                     });
            //                     alert('All opponents reported!')
            //                 })
            //             })
            //         })
            //         infoContainer.append(newButton)
            //     }, 1000);
            // }
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
                                    let opponentFactions = []
                                    let opponentFactionIs1 = faction1['roster'].find(player => {
                                            return player['id'] == userId
                                    }) === undefined
                                    let opponentFactionIs2 = faction2['roster'].find(player => {
                                            return player['id'] == userId
                                    }) === undefined
                                    if(opponentFactionIs1){
                                        opponentFactions.push({opponentFaction: faction1, rosterContainerName: 'roster1'})
                                    }
                                    if(opponentFactionIs2){
                                        opponentFactions.push({opponentFaction: faction2, rosterContainerName: 'roster2'})
                                    }
                                    opponentFactions.forEach(opponentFactionObject => {
                                        opponentFactionObject.opponentFaction['roster'].forEach(player => {
                                            let playerName = player['nickname']
                                            let playerHistory = counter[player['id']] || { matches: [], won: 0, lost: 0 }
                                            // update player history
                                            let rosterContainer = document.querySelector(`div[name="${opponentFactionObject.rosterContainerName}"]`)
                                            let divs = rosterContainer.querySelectorAll('div')
                                            for (let i = 0; i < divs.length; i++) {
                                                if((divs[i].innerText == playerName) && (divs[i].previousSibling === null)){
                                                    let historyContainer = divs[i].cloneNode()
                                                    historyContainer.innerHTML = `<span style="color: #32d35a">Your Ws</span>: ${playerHistory.won}&emsp;<span style="color: #ff6c20">Your Ls</span>: ${playerHistory.lost}`
                                                    divs[i].after(historyContainer)

                                                    let node = divs[i]
                                                    while (node && node !== document) {
                                                        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'DIV' && [...node.classList].some(cls => cls.startsWith('ListContentPlayer__Body'))) {
                                                            let eloNumber = node.querySelector('div[class^="TextBlock__Holder"]')
                                                            let eloContainer = eloNumber.cloneNode()
                                                            eloContainer.setAttribute('id', `max-level-${player['id']}`)
                                                            eloContainer.style.flexDirection = 'row'
                                                            eloContainer.style.justifyContent = 'space-evenly'
                                                            eloNumber.appendChild(eloContainer)
                                                            break
                                                        }
                                                        node = node.parentNode;
                                                    }
                                                    steamIdMapping[player['id']] = player['gameId']
                                                    
                                                    let commentsContainer = divs[i].cloneNode()
                                                    commentsContainer.setAttribute('id', `suspicious-comments-${player['id']}`)
                                                    divs[i].after(commentsContainer)

                                                    let csWatchContainer = divs[i].cloneNode()
                                                    csWatchContainer.setAttribute('id', `cs-watch-${player['id']}`)
                                                    divs[i].after(csWatchContainer)
                                                    break
                                                }
                                            }
                                            
                                            // get and update max level
                                            let promises = []
                                            fetch(`https://api.faceit.com/stats/v1/stats/users/${player['id']}/games/cs2`)
                                            .then(r => r.json())
                                            .then(r => {
                                                // scan all matches of player
                                                let numberOfMatches = Math.min(Number(r['lifetime']['m1']), 1000) // max 1000
                                                let limit = 100 // max 100
                                                let offset = 0
                                                while (offset < numberOfMatches) {
                                                    let promise = fetch(`https://open.faceit.com/data/v4/players/${player['id']}/history?game=cs2&offset=${offset}&limit=${limit}`, {
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
                                                    let maxLevel = 0
                                                    results.forEach(result => {
                                                        result['items'].forEach(match => {
                                                            const { faction1, faction2 } = match['teams']
                                                            let opponentFaction = faction1['players'].find(factionPlayer => {
                                                                return factionPlayer['player_id'] == player['id']
                                                            }) === undefined
                                                            let selfFaction;
                                                            if(opponentFaction){
                                                                selfFaction = faction2
                                                            }
                                                            else{
                                                                selfFaction = faction1
                                                            }
                                                            selfFaction['players'].forEach(factionPlayer => {
                                                                if (factionPlayer['player_id'] == player['id']){
                                                                    maxLevel = Math.max(maxLevel, factionPlayer['skill_level'])
                                                                }
                                                            });
                                                        });
                                                    });
                                                    let levelColor = maxLevel == 1 ? '#ffffff' : maxLevel < 4 ? '#32d35a' : maxLevel < 8 ? '#efd02a' : maxLevel < 10 ? '#ff6309' : '#e24d14';
                                                    let eloContainer = document.getElementById(`max-level-${player['id']}`)
                                                    eloContainer.innerHTML = `<span style="font-size: 10px; color: #a7a7a7;">Max</span>&nbsp;<span style="font-size: 10px; color: ${levelColor};">${maxLevel}</span>`
                                                });
                                                chrome.runtime.sendMessage({'type': 'comments-first', 'data': {profile: steamIdMapping[player['id']]}}, firstHtml => {
                                                    const parser = new DOMParser();
                                                    const htmlDocument = parser.parseFromString(firstHtml, "text/html");
                                                    if(htmlDocument.getElementsByClassName('profile_private_info').length){
                                                        updateSuspiciousComments(player['id'], 'Private')
                                                    }
                                                    else{
                                                        const script = Array.from(htmlDocument.querySelectorAll("script")).find(s => s.textContent.includes("InitializeCommentThread"));
                                                        if(script){
                                                            const totalCommentCount = parseInt(script.textContent.match(/"total_count"\s*:\s*(\d+)/)[1], 10)
                                                            const pageSize = parseInt(script.textContent.match(/"pagesize"\s*:\s*(\d+)/)[1], 10)
                                                            const totalPages = Math.ceil(totalCommentCount / pageSize);
                                                            chrome.runtime.sendMessage({'type': 'comments', 'data': {profile: steamIdMapping[player['id']], totalPages: totalPages}}, htmlPages => {
                                                                htmlPages.push(firstHtml)
                                                                let suspiciousCount = 0
                                                                for (const html of htmlPages) {
                                                                    const htmlDocument = parser.parseFromString(html, "text/html");
                                                                    let comments = Array.from(htmlDocument.getElementsByClassName('commentthread_comment_text')).map(el => el.textContent.trim())
                                                                    suspiciousCount += comments.filter(isSuspicious).length
                                                                }
                                                                updateSuspiciousComments(player['id'], suspiciousCount)
                                                            })
                                                        }
                                                        else{
                                                            updateSuspiciousComments(player['id'], 'Off')
                                                        }
                                                    }
                                                    
                                                });
                                                // get CS Watch message
                                                let csWatchUrl = `https://cswatch.in/api/players/${steamIdMapping[player['id']]}`
                                                fetch(`https://whateverorigin.org/get?url=${encodeURIComponent(csWatchUrl)}`)
                                                .then(r => r.json())
                                                .then(r => JSON.parse(r['contents']))
                                                .then(r => {
                                                    let csWatchContainer = document.getElementById(`cs-watch-${player['id']}`)
                                                    csWatchContainer.innerHTML = `<span style="color: #a7a7a7; font-size: 12px;"><a style="color: aqua;" target="_blank" href="${csWatchUrl}">CSW</a>: ${r['csWatchAnalysis']['message']}</span>`
                                                })
                                            })
                                        }); 
                                    });
                                    counterReady = true
                                })
                            })
                        })
                    })
                }, 1000);
            }
            // show history in player modal
            let playerNameContainer = document.querySelector('div[class^="styles__NameContainer"] h5')
            let statsContainer = document.querySelector('div[class^="RatingsAndStats__Container"]')
            let statsContainerReady = statsContainer
            let historyContainerExists = Boolean(document.getElementById('history-container'))
            if(playerNameContainer && !historyContainerExists && statsContainerReady && counterReady){
                if(!historyShield){
                    historyShield = true
                    let historyContainer = statsContainer.cloneNode(true)
                    historyContainer.setAttribute('id', 'history-container')
                    let playerName = playerNameContainer.textContent
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
                    historyContainer.children[0].children[1].textContent = counter[playerId].won + counter[playerId].lost
                    historyContainer.children[1].children[1].textContent = Math.round(counter[playerId].won * 100 / (counter[playerId].won + counter[playerId].lost))
                    let historyListContainer = historyContainer.children[2]
                    historyListContainer.children[0].textContent = 'Matchrooms'
                    historyListContainer.children[1].style.display = 'flex'
                    historyListContainer.children[1].style.flexWrap = 'wrap'
                    historyListContainer.children[1].innerHTML = historyHtml
                    statsContainer.after(historyContainer)
                    statsContainer.after(`Your history against them`)
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
