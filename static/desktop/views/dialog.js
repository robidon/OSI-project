/**
* Базовый класс для диалоговых окон.
* + статичный factory для хранения ссылок на все актуальные окна (для переключения z-indexов при активации, например).
* 
* @constructor
* @class
* @param params - width, height, x, y, css_class, title
* @extends Bindable
*/
var Desktop_View_Dialog = Backbone.Model.extend({
    constructor:function Desktop_View_Dialog(params) {
        var T = this;
        this.width = params['width'] ? parseInt(params.width) : 100;
        this.height = params['height'] ? parseInt(params.height) : 20;
        this.x = params['x'] ? parseInt(params.x) : 300;
        this.y = params['y'] ? parseInt(params.y) : 200;
        var _focusOn = false;
        var element = $("<div/>")
            .attr('class', 'dialog '+params['css_class'])
            .css({
                'left':this.x+'px',
                'top':this.y+'px'
            });
        element.click(function () {
            if (!_focusOn) {
                T.focus();
            }
        });
        var titleElement = $("<div class='title'/>");
        var closeElement = $("<div class='close'/>");
        var contentElement = $("<div class='content'/>")
            .css({
                'min-width':this.width+'px',
                'min-height':this.height+'px'
            });
        var resizeElement = $("<div class='resize'/>")
            .css({
                'position':'absolute',
                'right':'0px','bottom':'0px',
                'margin':'3px 0 0 3px',
                'width':'10px', 'height':'10px',
                'cursor':'e-resize'
            });
        
        element.append(titleElement).append(closeElement);
        element.append(contentElement);
        element.append(resizeElement);
        
        element.hide();
        element.appendTo('body');
        element.show();
        element.draggable({handle:'.title'})
        
        resizeElement.draggable({
            axis: "x",
            drag:function (p1,p2,p3) {
                var pos = resizeElement.position();
                element.css ( {
                    'width':pos.left + resizeElement.width()
                });
            }
        });
        
        closeElement.bind('click', function () {
            T.close();
        });
        
        this.getElement = function() {
            return element;
        }
        this.getContentElement = function () {
            return contentElement;
        }
        this.setTitle = function(title) {
            T.title = title;
            titleElement.text(title);
        }
        this.close = function () {
            this.blur('')
            T.trigger('close');
            element.remove();
        }
        this.move = function (x,y) {
            T.x = x;
            T.y = y;
            element.css({
                'left':x+'px','top':y+'px'
            });
            T.trigger('move');
        }
        this.focus = function () {
            if (_focusOn) return;
            DialogsManager.blurAll();
            _focusOn = true;
            element.addClass('focus');
            this.trigger('focus');
        }
        this.blur = function () {
            if (!_focusOn) return;
            _focusOn = false;
            element.removeClass('focus');
            this.trigger('blur');
        }
        this.hasFocus = function () {
            return _focusOn;
        }
        this.notifyError = function () {
            element.animate({'margin-left':'-6px'},40)
            .animate({'margin-left':'6px'},80)
            .animate({'margin-left':'-3px'},60)
            .animate({'margin-left':'3px'},40)
            .animate({'margin-left':'0px'},20);
        }

        Backbone.Model.apply(this, arguments);
    },
    initialize:function(params) {
        var T = this;
        var title = '';
        
        T.setTitle(params['title'] ? params.title : '');
        
        DialogsManager.addDialog(this);
        
    }
});
var Dialogs_Manager = Backbone.Collection.extend({
    addDialog: function (dialog) {
        this.add(dialog);
    },
    removeDialog:function (dialog) {
        this.remove(dialog);
    },
    blurAll:function () {
        this.each(function (dialog) {
            dialog.blur();
        });
    },
    getFocused : function () {
        var filtered = this.filter(function (dialog) {
            if (dialog.hasFocus()) {
                return true;
            }
            return false;
        })
        return filtered.pop();
    }
});
var DialogsManager = new Dialogs_Manager();
