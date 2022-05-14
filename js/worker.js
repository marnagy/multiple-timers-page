let fading = false
const updateInterval = 1_000
self.addEventListener('message', function(e){
    switch (e.data) {
        case 'start':
            if (!fading){
                fading = true;
                interval = setInterval(
                    () => self.postMessage('tick'),
                    updateInterval)
            }
            break;
        case 'stop':
            clearInterval(interval);
            fading = false;
            break;
    };
}, false);
