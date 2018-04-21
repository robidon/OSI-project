var debug = {
    _started:false,
    _status:false,
    start:function () {
        if (debug._started) return;
        debug._started = true;
        if (!debug._status) {
            debug._status = $("#debugInfo");
        }
        debug.log('debug started');
        debug._status.show();
    },
    stop:function () {
        if (!debug._started) return;
        debug.log('debug ended');
        debug._started = false;
        if (!debug._status) {
            debug._status = $("#debugInfo");
        }
        debug._status.hide();
    },
    status:function (statusText) {
        if (!debug._status) {
            debug._status = $("#debugInfo");
        }
        debug._status.text(statusText);
    },
    log:function () {
        if (!debug._started) return;
        console.log.apply(console,arguments);
    },
    error:function () {
        if (!debug._started) return;
        console.error.apply(console,arguments);
    },
    info:function () {
        if (!debug._started) return;
        console.info.apply(console,arguments);
    }
}