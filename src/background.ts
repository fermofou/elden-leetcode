import type { Actions } from './content' // Assuming content.ts exports Actions type

// Track recent dispatches to prevent duplicates
const recentDispatches = new Map<string, number>()

function dispatch(
    action: Actions,
    details: chrome.webNavigation.WebNavigationFramedCallbackDetails
) {
    const tabId = details.tabId
    if (typeof tabId !== 'number' || !tabId) return

    const dispatchKey = `${tabId}-${action}-${details.url}`
    const now = Date.now()

    if (recentDispatches.has(dispatchKey)) {
        const lastDispatch = recentDispatches.get(dispatchKey)!
        if (now - lastDispatch < 3000) {
            console.log(
                'Preventing duplicate dispatch:',
                action,
                'for tab:',
                tabId
            )
            return
        }
    }

    recentDispatches.set(dispatchKey, now)

    if (recentDispatches.size > 50) {
        const cutoff = now - 10000
        for (const [key, timestamp] of recentDispatches.entries()) {
            if (timestamp < cutoff) {
                recentDispatches.delete(key)
            }
        }
    }

    console.log('Dispatching action:', action, 'to tab:', tabId)

    chrome.tabs.sendMessage(tabId, { action }).catch((error) => {
        console.log('Failed to send message to tab:', error)
    })
}

// Listen for LeetCode problem page navigation (full reloads)
chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.frameId !== 0) return // Only main frame

    if (details.url && details.url.includes('leetcode.com/problems/')) {
        console.log(
            'LeetCode problem page detected (onCompleted):',
            details.url
        )
        chrome.storage.local.get('choice', (data) => {
            if (data.choice === 'yes') {
                setTimeout(() => {
                    dispatch('leetcodeStarted', details)
                }, 1000)
            } else {
                console.log(
                    'Extension disabled (selectedOption=No), skipping dispatch.'
                )
            }
        })
    }
})

// Listen for SPA navigations (next/previous problem buttons)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return // Only main frame
    if (details.url && details.url.includes('leetcode.com/problems/')) {
        console.log(
            'LeetCode problem page detected (onHistoryStateUpdated):',
            details.url
        )
        chrome.storage.local.get('choice', (data) => {
            if (data.choice === 'yes') {
                setTimeout(() => {
                    dispatch('leetcodeStarted', details)
                }, 100) // Shorter delay for a more responsive feel
            } else {
                console.log(
                    'Extension disabled (selectedOption=No), skipping dispatch.'
                )
            }
        })
    }
})
