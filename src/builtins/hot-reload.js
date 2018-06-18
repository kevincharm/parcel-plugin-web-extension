;(function(window) {
    var browser = window.browser || window.chrome
    var hostname = process.env.HMR_HOSTNAME || location.hostname
    var protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    var ws = new WebSocket(
        protocol + '://' + hostname + ':' + process.env.HMR_PORT + '/'
    )
    ws.onmessage = function(event) {
        var data = JSON.parse(event.data)
        if (data.type === 'update' || data.type === 'reload') {
            browser.runtime.reload()
        }
    }
})(window)
