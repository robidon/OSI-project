/**
* @class
*/
var Bindable = function Bindable() {
    this.bindData = {};
    this.oneCall = {};
    var T = this;
    this.bind = function (event, func) {
        if (!T.bindData[event]) {
            T.bindData[event] = [];
            T.oneCall[event] = [];
        }
        T.bindData[event].push(func);
        T.oneCall[event].push(0);
    }
    this.one = function (event, func) {
        if (!T.bindData[event]) {
            T.bindData[event] = [];
            T.oneCall[event] = [];
        }
        T.bindData[event].push(func);
        T.oneCall[event].push(1);
    }
    this.unbind = function (event, func) {
        if (!T.bindData[event]) 
            return;
        if (typeof(func)=="undefined") {
            delete T.bindData[event];
            delete T.oneCall[event]
            return;
        }
        var ind = T.bindData[event].indexOf(func);
        if (ind == -1) return;
        T.bindData[event].splice(ind,1);
        T.oneCall[event].splice(ind,1);
    }
    var asyncCall = function (func, data) {
        //var asyncCallFunc = function () {
            return func.apply(T, data);
        //}
        //setTimeout(asyncCallFunc,0);
    }
    this.trigger = function(event) {
        var i;
        var args = Array.prototype.slice.call(arguments);
        args = args.slice(1);
        var result = Bindable.RESULT_OK;
        if (T.bindData[event]) {
            for (i=0;i<T.bindData[event].length;i++) {
                debug.log('Event: ' + T.constructor.name + '.' + event + '; Handler: ' + T.bindData[event][i].name + '; Args: ',args);
                result = asyncCall(T.bindData[event][i], args);
                if (T.oneCall[event][i]) {
                    T.bindData[event].splice(i,1);
                    T.oneCall[event].splice(i,1);
                    i--;
                }
                if (result == Bindable.RESULT_CANCEL) {
                    break;
                } else if (result == Bindable.RESULT_STOP) {
                    break;
                }
            }
        }
        if (result == Bindable.RESULT_CANCEL) {
            return false;
        } else if (result == Bindable.RESULT_STOP) {
            return true;
        }
        i = event.lastIndexOf(':');
        if (i<=0) return true;
        var parentEvent = event.substring(0,i);
        if (!args) args = [];
        args.unshift(parentEvent);
        return this.trigger.apply(this, args);
    }
}
Bindable.RESULT_OK = 0;
Bindable.RESULT_CANCEL = 1;
Bindable.RESULT_STOP = 2;