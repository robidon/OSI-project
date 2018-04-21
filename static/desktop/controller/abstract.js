var Controller = Backbone.Model.extend({
    initialize: function () {
        //Controller.superclass.constructor.apply(this, []);
    },
    inherit: function () {
        var T = this;
        if (!T.preDispatch) {
            T.preDispatch = function () {
                //debug.log('default preDispatch');
            }
        }
        if (!T.postDispatch) {
            T.postDispatch = function () {
                //debug.log('default postDispatch');
            }
        }
        var i;
        var updateAction = function (i) {
            var tmp = T[i];
            T[i] = function () {
                T.preDispatch();
                var log = Array.prototype.slice.call( arguments, 0 );
                log.unshift('Action: ' + T.constructor.name + '.' + i + '()', 'Args:');
                debug.log.apply(debug,log);
                tmp.apply(T, arguments);
                T.postDispatch();
            };
        }
        var updateHandler = function (i) {
            var tmp = T[i];
            T[i] = function () {
                debug.error('Handler: ' + T.constructor.name + ' / ' + i);
                tmp.apply(T, arguments);
            };
        }
        for (i in T) {
            if (typeof(T[i])==='function') {
                if (i.match(/.*Action$/)) {
                    updateAction(i);
                } else if (i.match(/.*Handler$/)) {
                    updateHandler(i);
                }
            }
        }
    }
});