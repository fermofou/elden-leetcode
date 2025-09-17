'use strict'
const recentDispatches = /* @__PURE__ */ new Map()
let lastProblemSlug: string | null = null

function dispatch(action: string, details: { tabId: number; url: string }) {
    const tabId = details.tabId
    if (typeof tabId !== 'number' || !tabId) return
    const dispatchKey = `${tabId}-${action}-${details.url}`
    const now = Date.now()
    if (recentDispatches.has(dispatchKey)) {
        const lastDispatch = recentDispatches.get(dispatchKey)
        if (now - lastDispatch < 3e3) {
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
        const cutoff = now - 1e4
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

// Function to get the problem slug from the URL
function getProblemSlug(url: string) {
    try {
        const path = new URL(url).pathname
        const parts = path.split('/').filter((p) => p)
        // Assumes URL format is /problems/{slug}/
        const problemsIndex = parts.indexOf('problems')
        if (problemsIndex !== -1 && problemsIndex + 1 < parts.length) {
            return parts[problemsIndex + 1]
        }
    } catch (e) {
        console.error('Failed to parse URL:', url, e)
    }
    return null
}

// Listen for LeetCode problem page navigation (full reloads and SPA navigations)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return
    const currentProblemSlug = getProblemSlug(details.url)

    if (currentProblemSlug && currentProblemSlug !== lastProblemSlug) {
        console.log('New LeetCode problem page detected:', details.url)
        lastProblemSlug = currentProblemSlug
        chrome.storage.local.get('choice', (data) => {
            if (data.choice === 'yes') {
                setTimeout(() => {
                    dispatch('leetcodeStarted', details)
                }, 100)
            } else {
                console.log('Extension disabled, skipping dispatch.')
            }
        })
    }
})

// For initial page load
chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.frameId !== 0) return
    const currentProblemSlug = getProblemSlug(details.url)
    if (currentProblemSlug && currentProblemSlug !== lastProblemSlug) {
        lastProblemSlug = currentProblemSlug
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
                console.log('Extension disabled, skipping dispatch.')
            }
        })
    }
})
