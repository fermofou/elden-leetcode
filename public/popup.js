document.addEventListener('DOMContentLoaded', function () {
    const yesOption = document.getElementById('yes-option')
    const noOption = document.getElementById('no-option')

    yesOption.addEventListener('click', function () {
        chrome.storage.local.set({ choice: 'yes' }, () => {
            console.log('Choice saved as yes')
            window.close()
        })
    })

    noOption.addEventListener('click', function () {
        chrome.storage.local.set({ choice: 'no' }, () => {
            console.log('Choice saved as no')
            window.close()
        })
    })

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            window.close()
        } else if (e.key === 'Enter') {
            yesOption.click()
        }
    })
})
