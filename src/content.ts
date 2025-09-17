'use strict'
const banners = {
    leetcodeStarted: 'banners/new-problem-discovered.webp',
    testCasesPassed: 'banners/test-cases-passed.webp',
    testCasesFailed: 'banners/wrong-answer.webp',
    submissionPassed: 'banners/submission-accepted.webp',
    submissionFailed: 'banners/wrong-answer.webp',
    compileFailed: 'banners/compile-error.webp',
    runtimeError: 'banners/runtime-error.webp',
    tleError: 'banners/time-limit-exceeded.webp'
} as const

export type Actions = keyof typeof banners

const sounds = {
    newItem: 'sounds/new-item.mp3',
    enemyFailed: 'sounds/enemy-failed.mp3'
} as const
const bannerSounds = {
    leetcodeStarted: 'newItem',
    testCasesPassed: 'newItem',
    testCasesFailed: 'enemyFailed',
    submissionPassed: 'newItem',
    submissionFailed: 'enemyFailed',
    compileFailed: 'enemyFailed',
    runtimeError: 'enemyFailed',
    tleError: 'enemyFailed'
} as const satisfies { [image in Actions]: keyof typeof sounds }
const animations = {
    duration: 1e3,
    span: 3500,
    easings: {
        easeOutQuart: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }
} as const
const delays = {
    leetcodeStarted: 1e3,
    testCasesPassed: 1e3,
    testCasesFailed: 1e3,
    submissionPassed: 1e3,
    submissionFailed: 1e3,
    compileFailed: 1e3,
    runtimeError: 1e3,
    tleError: 1e3
} as const satisfies Partial<{ [delay in Actions]: number }>
const lastShownTimes = new Map<Actions, number>()

function setupLeetcodeListeners() {
    console.log('Setting up LeetCode listeners on:', window.location.href)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return
                const element = node as Element
                const resultElements = element.querySelectorAll(
                    '[data-e2e-locator="console-result"]'
                )
                resultElements.forEach((resultElement: Element) => {
                    const text = resultElement.textContent || ''
                    if (
                        text.includes('Accepted') ||
                        text.includes('Runtime:')
                    ) {
                        console.log('Test cases passed detected')
                        show('testCasesPassed')
                    } else if (text.includes('Wrong Answer')) {
                        console.log('Wrong Answer detected')
                        show('testCasesFailed')
                    } else if (text.includes('Runtime Error')) {
                        console.log('Runtime Error detected')
                        show('runtimeError')
                    } else if (text.includes('Time Limit Exceeded')) {
                        console.log('Time Limit Exceeded detected')
                        show('tleError')
                    } else if (
                        text.match(
                            /Compile Error|Compilation Error|Syntax Error/i
                        )
                    ) {
                        console.log('Compile Error detected')
                        show('compileFailed')
                    } else if (text.includes('Output Limit Exceeded')) {
                        console.log('Output Limit Exceeded detected')
                        show('testCasesFailed')
                    }
                })
                const submissionElements = element.querySelectorAll(
                    '[data-e2e-locator*="submission"], [class*="result"]'
                )
                submissionElements.forEach((submissionElement: Element) => {
                    const text = submissionElement.textContent?.trim() || ''
                    if (/^Accepted$|Success|Submission Accepted/i.test(text)) {
                        console.log('Submission passed detected')
                        show('submissionPassed')
                    } else if (text.includes('Wrong Answer')) {
                        console.log('Submission Wrong Answer detected')
                        show('submissionFailed')
                    } else if (text.includes('Runtime Error')) {
                        console.log('Submission Runtime Error detected')
                        show('runtimeError')
                    } else if (text.includes('Time Limit Exceeded')) {
                        console.log('Submission Time Limit Exceeded detected')
                        show('tleError')
                    } else if (
                        text.match(
                            /Compile Error|Compilation Error|Syntax Error/i
                        )
                    ) {
                        console.log('Submission Compile Error detected')
                        show('compileFailed')
                    } else if (text.includes('Failed')) {
                        console.log('Submission failed (general) detected')
                        show('submissionFailed')
                    }
                })
            })
        })
    })
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    })
}

if (window.location.hostname.includes('leetcode.com')) {
    setupLeetcodeListeners()
}

function show(action: Actions, delay = delays[action] ?? 1000) {
    chrome.storage.local.get('choice', ({ choice }) => {
        if (choice !== 'yes') {
            console.log('Banners disabled by user choice, skipping:', action)
            return
        }
        try {
            console.log('Showing banner:', action)
            if (!(action in banners)) {
                console.error('Unknown action:', action)
                return
            }
            const now = Date.now()
            const lastShown = lastShownTimes.get(action)
            if (lastShown && now - lastShown < 2000) {
                console.log('Banner shown too recently, skipping:', action)
                return
            }
            lastShownTimes.set(action, now)
            const banner = document.createElement('img')
            banner.src = chrome.runtime.getURL(banners[action])
            banner.style.position = 'fixed'
            banner.style.top = '0px'
            banner.style.right = '0px'
            banner.style.zIndex = '9999'
            banner.style.width = '100%'
            banner.style.height = '100vh'
            banner.style.objectFit = 'cover'
            banner.style.objectPosition = 'center'
            banner.style.opacity = '0'
            banner.style.pointerEvents = 'none'
            const audio = new Audio(
                chrome.runtime.getURL(sounds[bannerSounds[action]])
            )
            audio.volume = 0.25
            setTimeout(() => {
                requestIdleCallback(() => {
                    document.body.appendChild(banner)
                    console.log('Banner added to DOM')
                    banner.animate([{ opacity: 0 }, { opacity: 1 }], {
                        duration: animations.duration,
                        easing: animations.easings.easeOutQuart,
                        fill: 'forwards'
                    })
                    audio.play().catch((error) => {
                        console.log('Audio play failed:', error)
                    })
                })
            }, delay)
            setTimeout(() => {
                banner.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: animations.duration,
                    easing: animations.easings.easeOutQuart,
                    fill: 'forwards'
                })
                setTimeout(() => {
                    if (banner.parentNode) {
                        banner.remove()
                        console.log('Banner removed from DOM')
                    }
                }, animations.duration)
            }, animations.span + delay)
        } catch (e) {
            console.warn('Extension context invalidated or other error:', e)
        }
    })
}

// Define the type for the message object
interface EldenMessage {
    action: Actions
}

chrome.runtime.onMessage.addListener((request: EldenMessage) => {
    const action = request.action as Actions | undefined
    if (action && Object.prototype.hasOwnProperty.call(delays, action)) {
        show(action)
    }
})
