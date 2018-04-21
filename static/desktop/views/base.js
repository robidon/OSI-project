/**
* @constructor
* @extends Bindable
*/
var Desktop_View_Abstract = Backbone.Model.extend({
    constructor: function Desktop_View_Abstract() {
        Backbone.Model.apply(this, arguments);
    },
    defaults:{
        x:0,
        y:0
    },
    initialize:function (file, stage) {
        Backbone.Model.prototype.initialize.apply(this, [file]);
        var chlength = 0;
        this.controller = file;
        this.parent = undefined;
        this.children = [];
        this.stage = stage;
        /** @public */ this.layer = 0;
        /** @public */ this.element = false;             
        this.state = 0; // normal
        this.bind('change:x',function (v,value) {
            this.x = value;
        });
        this.bind('change:y', function (v,value) {
            this.y = value;
        });
        this.x = 0;
        this.y = 0;
        this.scale = 1;
        this.scaleX = undefined;
        this.scaleY = undefined;
        this.rotation = 0;
        this.hitmapColor = 0;
        this.dragging = false; // флаг того, что объект перетаскивается
        var _zIndex = 0;
        this.tooltip = '';
        /** @private */ var _visible = true;
        /** @private */ var _selected = false;
        /** @private */ var _active = false;
        /** @private */ var _width = 0;
        /** @private */ var _height = 0;
        /** @private */ var _cssClasses = {};

        var T = this;
        var i,st;
        this.destroy = function () {
            if (_tooltipObject) {
                _tooltipObject.destroy();
            }
            for (i=0;i<chlength;i++) {
                this.children[i].destroy();
            }
            this.stage.deregisterHitObject(this);
        }
        var _tooltipObject;
        this.showTooltip = function () {
            if (_visible && this.tooltip) {
                if (!_tooltipObject) {
                    _tooltipObject = new Desktop_View_Tooltip('',this.stage);
                    _tooltipObject.init();
                }
                _tooltipObject.setText(this.tooltip);
                var p = this.getPagePosition();
                _tooltipObject.showAt(p.left,p.top);
            }        
        }
        this.hideTooltip = function () {
            if (_tooltipObject) {
                _tooltipObject.hide();
            }
        }
        this.bind('mouseenter', function () { T.showTooltip(); });
        this.bind('mouseleave', function () { T.hideTooltip(); });
        this.draw = function(ctx) {
            if (!_visible) return;
            st = ctx.fillStyle;
            ctx.translate(T.x,T.y);
            var sx=this.scale,sy=this.scale;
            if (T.scaleX) sx=T.scaleX;
            if (T.scaleY) sy=T.scaleY;
            ctx.scale(sx,sy);
            ctx.rotate(T.rotation);
            this._draw(ctx);
            ctx.rotate(-T.rotation);
            ctx.scale(1/sx,1/sy);
            ctx.translate(-T.x,-T.y);
            ctx.fillStyle = st;
        }
        this._draw = function (ctx) {
            if (!_visible) return;
            for (i=0;i<chlength;i++) {
                this.children[i].draw(ctx);
            }
        }
        this.drawHitmap = function(ctx) {
            if (!_visible) return;
            if (!this.dragging) { // перетаскиваемые объекты не ловятся
                st = ctx.fillStyle;
                ctx.translate(T.x,T.y);
                var sx=T.scale,sy=T.scale;
                if (T.scaleX) sx=T.scaleX;
                if (T.scaleY) sy=T.scaleY;
                ctx.scale(sx,sy);
                ctx.rotate(T.rotation);
                this._drawHitmap(ctx);
                ctx.rotate(-T.rotation);
                ctx.scale(1/sx,1/sy);
                ctx.translate(-T.x,-T.y);
                ctx.fillStyle = st;
            }
        }
        this._drawHitmap = function (ctx) {
            if (!_visible) return;
            if (!this.dragging) { // перетаскиваемые объекты не ловятся
                ctx.fillStyle = this.hitmapColor;
                for (i=0;i<chlength;i++) {
                    this.children[i].drawHitmap(ctx);
                }
            }
        }

        this.addChild = function (child) {
            child.parent = T;
            this.children.push(child);
            chlength = this.children.length;
        }
        this.removeChild = function (child) {
            //child.parent = undefined;
            for (i=0;i<chlength;i++) {
                if (this.children[i] == child) {
                    chlength = this.children.length-1;
                    return this.children.splice(i,1);
                }
            }
        }

        this.width = function (flush) {
            return _width;
        }
        this.height = function (flush) {
            return _height;
        }
        this.zIndex = function () {
            return _zIndex;
        }
        this.setzIndex = function (z) {
            for (i=0;i<chlength;i++) {
                this.children[i].setzIndex(z);
            }
            _zIndex = z;
        }
        this.show = function () {
            if (_visible) return;
            _visible = true;
            /*for (i=0;i<chlength;i++) {
                this.children[i].show();
            }*/
            this.trigger('show');
        }
        this.hide = function () {
            if (!_visible) return;
            _visible = false;
            this.hideTooltip();
            /*for (i=0;i<chlength;i++) {
                this.children[i].hide();
            }*/
            this.trigger('hide');
        }
        this.setPosition = function(x,y) {
            this.x = x;
            this.y = y;
        }
        this.getPosition = function getPosition() {
            return new Point(this.x,this.y);
        }
        this.localToGlobal = function (p) {
            if (this.rotation) {
                var c = Math.cos(this.rotation);
                var s = Math.sin(this.rotation);
                var x = p.x, y = p.y;
                p.x = x*c-y*s;
                p.y = x*s+y*c;
            }
            p.x = this.x + p.x*this.scale;
            p.y = this.y + p.y*this.scale;
            if (this.parent) p = this.parent.localToGlobal(p);
            return p;
        }
        this.getPagePosition = function () {
            var p = new Point(0,0);
            p = this.localToGlobal(p);
            p.x = this.stage.convertXToPage(p.x);
            p.y = this.stage.convertYToPage(p.y);
            return {left:p.x,top:p.y};
        }
        this.isSelected = function () {
            return _selected;
        }
        this.select = function () {
            if (_selected) return false;
            this.trigger('selected');
            _selected = true;
            return true;
        }
        this.deselect = function () {
            if (!_selected) return false;
            this.trigger('deselected');
            _selected = false;
            return true;
        }
        this.stopAnimate = function () {
            $(this).stop();
        }
        this.animate = function (params, duration, easing, stepFunction) {
            if (!duration) duration = 250;
            if (!easing) easing = 'easeOutQuint';
            $(this).animate(params,{
                duration:duration,
                easing:easing,
                step:function () {
                    T.stage.queueRedraw();
                    if (stepFunction) {
                        stepFunction.call(this);
                    }
                }
            });
        }
        this.stage.registerHitObject(this);
    }
});

Desktop_View_Abstract.nodeStyles = {
    0:{ fill:'#DEDDDF', textFill:'#000000' },
    1:{ fill:'#191220', textFill:'#FFFFFF' },
    2:{ fill:'#DF1C1A', textFill:'#FFFFFF' },
    3:{ fill:'#f7807f', textFill:'#000000' },
    4:{ fill:'#89C644', textFill:'#FFFFFF' },
    5:{ fill:'#c2ff7f', textFill:'#000000' },
    6:{ fill:'#2B99CA', textFill:'#FFFFFF' },
    7:{ fill:'#87d3f4', textFill:'#000000' },
    8:{ fill:'#f93', textFill:'#ffffff' },
    9:{ fill:'#ff6', textFill:'#000000' }
}

var Desktop_View_CloseGroup = Desktop_View_Abstract.extend({
    constructor: function Desktop_View_CloseGroup() {
        Desktop_View_Abstract.apply(this, arguments);
    },
    initialize: function (file, stage) {
        Desktop_View_Abstract.prototype.initialize.apply(this, [file, stage]);
        this._width = 30;
        this._height = 30;
        var T = this;
        var mover = false;
        this.bind('mouseenter', function () {
            mover = true;
            T.stage.queueRedraw();
        });
        this.bind('mouseleave', function () {
            mover = false;
            T.stage.queueRedraw();
        });
        if (!Desktop_View_CloseGroup.source) {
            var pic = new Image();
            pic.src = '/static/img/collapse.png';
            Desktop_View_CloseGroup.source = pic;
            var picOver = new Image();
            picOver.src = '/static/img/collapse_over.png';
            Desktop_View_CloseGroup.sourceOver = picOver;
        }
        var oldDraw = this._draw;
        this._draw = function (ctx) {
            oldDraw.apply(this,[ctx]);
            ctx.drawImage(mover ? Desktop_View_CloseGroup.sourceOver : Desktop_View_CloseGroup.source,-23,-15);
        }
        var oldDrawHitmap = this._drawHitmap;
        this._drawHitmap = function (ctx) {
            oldDrawHitmap.apply(this,[ctx]);
            ctx.beginPath();
            ctx.rect(-23, -15, 28, 29);
            ctx.fill();
        }
    }
});

var Desktop_View_OpenGroup = Desktop_View_Abstract.extend({
    constructor: function Desktop_View_OpenGroup() {
        Desktop_View_Abstract.apply(this, arguments);
    },
    initialize: function (file, stage) {
        Desktop_View_Abstract.prototype.initialize.apply(this, [file, stage]);
        this._width = 30;
        this._height = 30;
        var T = this;
        var mover = false;
        this.bind('mouseenter', function () {
            mover = true;
            file.view.queueRedraw();
        });
        this.bind('mouseleave', function () {
            mover = false;
            file.view.queueRedraw();
        });
        if (!Desktop_View_OpenGroup.source) {
            var pic = new Image();
            pic.src = '/static/img/expand.png';
            Desktop_View_OpenGroup.source = pic;
            var picOver = new Image();
            picOver.src = '/static/img/expand_over.png';
            Desktop_View_OpenGroup.sourceOver = picOver;
        }
        var oldDraw = this._draw;
        this._draw = function (ctx) {
            oldDraw.apply(this,[ctx]);
            ctx.drawImage(mover ? Desktop_View_OpenGroup.sourceOver : Desktop_View_OpenGroup.source,-5,-15);
        }
        var oldDrawHitmap = this._drawHitmap;
        this._drawHitmap = function (ctx) {
            oldDrawHitmap.apply(this,[ctx]);
            ctx.beginPath();
            ctx.rect(-5, -15, 28, 29);
            ctx.fill();
        }
    }
});

var Desktop_View_Droppable = Desktop_View_Abstract.extend({
    constructor: function Desktop_View_Droppable() {
        Desktop_View_Abstract.apply(this, arguments);
    },
    initialize: function (file, stage) {
        Desktop_View_Abstract.prototype.initialize.apply(this, [file, stage]);
        this.checkElementDrop = function (view) { // проверяем, можем ли принять (нужно для подсветки)
            //debug.log('ckeck element not implemented', view);
        }
        this.dropElement = function (view) { // дропаем элемент
            //debug.log('drop element not implemented', view);
        }
    }
});

var Desktop_View_Draggable = Desktop_View_Droppable.extend({
    constructor: function Desktop_View_Draggable() {
        Desktop_View_Droppable.apply(this, arguments);
    },
    initialize: function (file, stage) {
        Desktop_View_Droppable.prototype.initialize.apply(this, [file, stage]);
        this.dragEnabled = false; // можно ли таскать элемент. по дефолту - нет
        this.dragDelay = 100; // задержка по времени после mousedown для перетаскивания элемента
        this.dragRetention = 0; // задержка по времени, после которого элемент становится отвязанным от позиции
        this.dragSnap = 0; // радиус "прискока" к начальной позиции
        this.dragXDisabled = false;
        this.dragYDisabled = false;
        this.dragBounds = []; // границы "таскания" элемента - дальше них нельзя.
        this.dragXScale = 1; // сила таскания
        this.dragYScale = 1; // сила таскания
        this.dragRevert = false; // возвращать, или нет на место после таскания
    }
});

var Desktop_View_Slot = Desktop_View_Draggable.extend({
    constructor: function Desktop_View_Slot() {
        Desktop_View_Draggable.apply(this, arguments);
    },
    initialize: function (node, file, type, ind, stage) {
        Desktop_View_Draggable.prototype.initialize.apply(this, [file, stage]);
        Desktop_View_Slot.TYPE_INCOMING = 1;
        Desktop_View_Slot.TYPE_OUTGOING = 2;
        this.type = type;
        this.ind = ind;
        this._width = 34;
        this._height = 14;
        this.empty = false;
        this.direction = 1;
        this.node = node;
        this.bind('change:x',function (v,value) {
            this.connectX = value;
        });
        this.bind('change:y', function (v,value) {
            this.connectY = value + this.direction*this._height/2;
        });
        this.getConnectX = function() {
            return this.x;
        }
        this.getConnectY = function() {
            return this.y + this.direction*(this._height/2);
        }
        var T = this;
        var initFillStyle = '#ffffff';
        var overFillStyle = '#c0c0c0';
        var emptyFillStyle = '#ffcccc';
        var overEmptyFillStyle = '#d0c0c0';
        var mouseOver = false;
        this.connections = [];
        T.fillStyle = initFillStyle;
        this.bind('mouseenter', function () {
            mouseOver = true;
            file.view.queueRedraw();
        });
        this.bind('mouseleave', function () {
            mouseOver = false;
            file.view.queueRedraw();
        });

        var oldDraw = this._draw;
        this._draw = function (ctx) {
            oldDraw.apply(this,[ctx]);
            if (this.empty) {
                ctx.fillStyle = mouseOver ? overEmptyFillStyle : emptyFillStyle;
            } else {
                ctx.fillStyle = mouseOver ? overFillStyle : initFillStyle;
            }
            var arrowsize = (this._height+10)/6;
            var z = arrowsize - 4;
            Draw.roundRect(ctx, -this._width/2, -this._height/2,this._width, this._height, arrowsize+1);
            ctx.beginPath();
            ctx.strokeStyle = '#999';
            ctx.lineWidth = arrowsize/4;
            if (this.direction>=0) {
                ctx.moveTo(-arrowsize,z);
                ctx.lineTo(0,arrowsize + z);
                ctx.lineTo(arrowsize,z);
            } else {
                ctx.moveTo(-arrowsize,arrowsize + z);
                ctx.lineTo(0, z);
                ctx.lineTo(arrowsize,arrowsize + z);
            }
            ctx.stroke();
        }
        var oldDrawHitmap = this._drawHitmap;
        this._drawHitmap = function (ctx) {
            oldDrawHitmap.apply(this,[ctx]);
            Draw.roundRect(ctx, -this._width/2, -this._height/2,this._width, this._height, 5);
        }
        this.registerConnection = function(view) {
            this.connections.push(view);
        }
        this.unregisterConnection = function (view) {
            var i = this.connections.indexOf(view);
            if (i==-1) return;
            delete this.connections[i];
        }
        this.checkElementDrop = function (view) { // проверяем, можем ли принять (нужно для подсветки)
            //debug.log('ckeck element not implemented', view);
            if (node && !node instanceof Desktop_View_Group && this.type == Desktop_View_Slot.TYPE_INCOMING) {
                if (file.view.newConnection) {
                    return true;
                }
            }
            return false;
        }
        this.dropElement = function (view) { // дропаем элемент
            //debug.log('drop element not implemented', view);
        }
        var oldDestroy = this.destroy;
        this.destroy = function () {
            oldDestroy.call(this);
            var i;
            for (i=this.connections.length-1;i>=0;i--) {
                this.connections[i].destroy();
            }
        }
    }
});

var Desktop_View_Factory = {
    group:function(groupDao,file, stage) {
        return new Desktop_View_Group(groupDao,file, stage);
    },
    node:function (nodeDao,file, stage) {
        switch (parseInt(nodeDao.type)) {
            case Desktop_Dao_Factory.TYPE_OPERATOR:
            case Desktop_Dao_Factory.TYPE_DATA:
                return new Desktop_View_DataNode(nodeDao,file, stage);
                break;
            case Desktop_Dao_Factory.TYPE_FORMULA:
                return new Desktop_View_FormulaNode(nodeDao,file, stage);
                break;
        }
        return false;
    }
}