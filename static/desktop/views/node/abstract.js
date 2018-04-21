/**
* @constructor
* @extends Desktop_View_Abstract
* @this {Desktop_View_AbstractNode}
* @class
* @param {Dao_AbstractNode} nodeDao
*/
var Desktop_View_AbstractNode = Desktop_View_Draggable.extend( {
    constructor: function Desktop_View_AbstractNode() {
        Desktop_View_Draggable.apply(this, arguments);
    },
    initialize: function (nodeDao, file, stage) {
        Desktop_View_Draggable.prototype.initialize.apply(this, [file, stage]);
        var T = this;
        this.dragEnabled = true;
        this._positionChanged = false;
        this.data = nodeDao;
        this.id = nodeDao.id;
        this.style = {
            cornerRadius:10,
            padding: 15,
            textFill: "#000",
            fill:'#fff',
            overfill:'#f0f0f0',
            selectedfill:'#c9c9c9',
            highlightedfill:'f0f0f0',
            stroke:'#000',
            overStroke:'#555',
            selectedStroke:'#f0f0f0',
            highlightedStroke:'#f0f0f0',
            strokeWidth:1.5
        };
        this.incomings = [];
        this.outgoings = [];
        this.slotsData = [];
        this._visibleLayer = true;
        this.lowlightTimeout = 0;
        this.x = nodeDao.x;
        this.y = nodeDao.y;
        this.rotation = -Math.PI/4*nodeDao.get('rotation');
        var _mouseover = false;
        
        var _state = 0;
        
        var closeGroupClickHandler = function () {
            T.controller.closeGroupAction(nodeDao.group);
        }
        var highlightedElements = [];
        var highlightGroup = function (gr) {
            if(!gr.opened) return;
            var i=0;
            for(i=0;i<gr.nodes.items.length;i++) {
                gr.nodes.items[i].setHighlighted(1);
                highlightedElements.push(gr.nodes.items[i]);
            }
            for(i=0;i<gr.groups.items.length;i++) {
                gr.groups.items[i].setHighlighted(1);
                highlightedElements.push(gr.groups.items[i]);
                highlightGroup(gr.groups.items[i]);
            }
        }
        var closeGroupMouseEnterHandler = function () {
            var gr = T.controller.dao.groups.get(nodeDao.group);
            highlightGroup(gr);
        }
        var closeGroupMouseLeaveHandler = function () {
            var i=0;
            for(i=0;i<highlightedElements.length;i++) {
                highlightedElements[i].setHighlighted(0);
            }
            highlightedElements = [];
        }
        T.close = false;
        var setGroupHandler = function () {
            if (this.group) {
                T.close = new Desktop_View_CloseGroup(file, stage);
                T.close.y = 0;
                T.close.bind('mouseenter', closeGroupMouseEnterHandler);
                T.close.bind('mouseleave', closeGroupMouseLeaveHandler);
                T.close.bind('click', closeGroupClickHandler);
                T.addChild(T.close);            
            } else {
                if (T.close) {
                    T.close.unbind('mouseenter', closeGroupMouseEnterHandler);
                    T.close.unbind('mouseleave', closeGroupMouseLeaveHandler);
                    T.close.unbind('click', closeGroupClickHandler);
                    T.removeChild(T.close);
                    T.close = false;
                }
            }
        }
        //nodeDao.bind('update.group', setGroupHandler);
        this.close = false;
        setGroupHandler.call(nodeDao);
        
        nodeDao.bind('update', function () {
            cache = undefined;
            T.x = nodeDao.x;
            T.y = nodeDao.y;
            T.stage.queueRedraw();
        });
        nodeDao.bind('set:group', setGroupHandler);
        nodeDao.bind('set:highlighted', function () {
            cache = undefined;
            T.stage.queueRedraw();
            if (nodeDao.isHighlighted()) {
                T.stopAnimate();
                T.animate({scale:1.05});
            } else {
                T.stopAnimate();
                T.animate({scale:1});
            }
        });
        nodeDao.bind('set:saveStatus', function () {
            cache = undefined;
            T.stage.queueRedraw();
        });
        nodeDao.bind('change:rotation', function (dao, val) {
            T.stopAnimate();
            T.animate({rotation:-val*Math.PI/4});
        });
        
        var T = this;
        this.bind('mouseenter', function (e) {
            _mouseover = true;
            cache = undefined;
            if (T instanceof Desktop_View_Group) return;
            var layer = T.controller.dao.layers.get(nodeDao.layerId);
            if (layer) {
                layer.setHighlighted(true);
            }
            T.stage.queueRedraw();
        });
        this.bind('mouseleave', function (e) {
            _mouseover = false;
            cache = undefined;
            var layer = T.controller.dao.layers.get(nodeDao.layerId);
            if (layer) {
                layer.setHighlighted(false);
            }
            T.stage.queueRedraw();
        });
        this.setState = function(state) {
            _state = state;
            cache = undefined;
        }
        this.getState = function() {
            return _state;
        }
        var _lowlighted = false;
        this.setLowlighted = function (l) {
            if (_lowlighted == l) return;
            _lowlighted = l;
            cache = undefined;
            T.stage.queueRedraw();
        }
        this.getLowlighted = function () {
            return _lowlighted;
        }
        
        var cache = undefined;

        this.bind('click', function (e) {
            if (this.isSelected()) {
                if (e.ctrlKey || e.shiftKey) {
                    this.deselect();
                    T.controller.removeFromSelectionAction(this);
                }
            } else {
                if (!e.ctrlKey && !e.shiftKey) {
                    T.controller.clearSelectionAction();
                }
                this.select();
                T.controller.addToSelectionAction(this);
            }
        });
        this.bind('dblclick', function (e) {
            T.controller.showNodeDetailsAction(this.data.id);
        });
        
        var _rendered;
        var self = this;
        this.render = function (ctx, canvas) {
            
            var params = self.style;
            $.extend(params,{
                text:T.data.name,
                fontFamily: "Helvetica",
                fontSize: 15,
                align:'center',
                x:2,y:2
            });
            if (Desktop_View_Abstract.nodeStyles[self.data.style]) {
                $.extend(params,Desktop_View_Abstract.nodeStyles[self.data.style]);
            }
            ctx.font = params.fontSize+'px '+params.fontFamily;
            var metrics = ctx.measureText(params.text);
            var w = Math.max(metrics.width, Math.max(1,T.incomings.length) * 35);
            var wid = w+params.padding*2 + params.strokeWidth*2
            var hei = params.padding*2 + params.fontSize + params.strokeWidth*2
            canvas.width = wid;
            canvas.height = hei;
            ctx.beginPath();
            ctx.font = params.fontSize+'px '+params.fontFamily;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            if (T.close) {
                T.close.x = -wid/2;
            }
            if (params.lineDash && ctx.setLineDash) {
                ctx.setLineDash(params.lineDash);
            }
            if (T.isSelected()) {
                ctx.strokeStyle = params.selectedStroke;
                //ctx.fillStyle = params.selectedfill;
            } else if (_mouseover) {
                ctx.strokeStyle = params.overStroke;
                //ctx.fillStyle = params.overfill;
            } else if (nodeDao.isHighlighted()){
                ctx.strokeStyle = params.highlightedStroke;
                //ctx.fillStyle = params.highlightedfill;
            } else {
                ctx.strokeStyle = params.stroke;
            }
            ctx.fillStyle = params.fill;
            
            ctx.lineWidth = params.strokeWidth;
            Draw.roundRect(ctx, params.strokeWidth, params.strokeWidth,w+params.padding*2, hei - params.strokeWidth*2, params.cornerRadius)
            if (T.data.saveStatus == Desktop_Dao_Abstract.STATUS_SAVE_PROGRESS) {
                ctx.fillStyle = '#2B99CA';
                Draw.roundRect(ctx, 3, 3, 7, 7, 4);
            } else if (T.data.saveStatus == Desktop_Dao_Abstract.STATUS_SAVE_ERROR) {
                ctx.fillStyle = '#DF1C1A';
                Draw.roundRect(ctx, 3, 3, 7, 7, 4);
            }
            //ctx.rect(0, 0, metrics.width+params.padding*2, canvas.height);
            //ctx.stroke();
            ctx.fillStyle = params.textFill;
            ctx.fillText(params.text, params.padding + params.strokeWidth, params.padding+params.fontSize/2-1 + params.strokeWidth);
            //ctx.restore();
            /*var tmpl = new Kinetic.Group();
            var text = new Kinetic.Text(params);
            tmpl.add(text);
            var tW = text.getBoxWidth();
            var tH = text.getBoxHeight();
            var st = new Kinetic.Stage({
                container:document.createElement('canvas'),
                width:tW+4,
                height:tH+4
            });
            var l = new Kinetic.Layer();
            l.add(tmpl);
            st.add(l);
            if (!_rendered) _rendered = new Kinetic.Image({});
            T.element.add(_rendered);
            tmpl.toImage({
                callback:function(img) {
                    _rendered.setWidth(tW+4);
                    _rendered.setHeight(tH+4);
                    _rendered.setImage(img);
                    _rendered.setX(-tW/2-2);
                    _rendered.setY(-tH/2-2);
                }
            });*/
        }

        var olddraw = this._draw;
        var _width = 0, _height = 0, _prevAlpha = 1;
        this.scale = .5;
        this.animate({scale:1});
        this._draw = function (ctx) {
            if (_lowlighted) {
                _prevAlpha = ctx.globalAlpha;
                ctx.globalAlpha = 0.3;
            }
            olddraw.apply(this, [ctx]);
            if (cache == undefined) {
                // перерисовываем картинку 
                cache = Draw.cacheAsCanvas(this.render);
                _width = cache.width;
                _height = cache.height;
            }
            ctx.drawImage(cache,-cache.width/2,-cache.height/2);
            if (_lowlighted) {
                ctx.globalAlpha = _prevAlpha;
            }
        }
        var oldhitmapDraw = this._drawHitmap;
        this._drawHitmap = function (ctx) {
            oldhitmapDraw.apply(this,[ctx]);
            ctx.fillRect(-_width/2,-_height/2,_width,_height);
        }
        this.show = function () {
            Desktop_View_AbstractNode.superclass.show.apply(this, []);
            var i;
            for (i in this.incomings) {
                this.incomings[i].show();
            }
            for (i in this.outgoings) {
                this.outgoings[i].show();
            }
        }
        this.hide = function () {
            this.animate({scale:.5});
            Desktop_View_AbstractNode.superclass.hide.apply(this, []);
            var i;
            for (i in this.incomings) {
                this.incomings[i].hide();
            }
            for (i in this.outgoings) {
                this.outgoings[i].hide();
            }
        }
        var _oldSelect = this.select;
        this.select = function () {
            if (!_oldSelect.apply(this)) return false;
            cache = undefined;
            var i;
            this.animate({scale:1.1});
            for (i=0;i<this.outgoings.length;i++) {
                $(this.outgoings[i]).animate({_height:30},{
                    duration:200,
                    step:function(){
                        T.stage.queueRedraw();
                    }
                });
            }
            for (i=0;i<this.incomings.length;i++) {
                $(this.incomings[i]).animate({_height:30},{
                    duration:200,
                    step:function(){
                        T.stage.queueRedraw();
                    }
                });
            }
            return true;
        }
        var _oldDeselect = this.deselect;
        this.deselect = function () {
            if (!_oldDeselect.apply(this)) return false;
            cache = undefined;
            this.animate({scale:1});
            for (i=0;i<this.outgoings.length;i++) {
                $(this.outgoings[i]).animate({_height:14},{
                    duration:100,
                    step:function(){
                        T.stage.queueRedraw();
                    }
                });
            }
            for (i=0;i<this.incomings.length;i++) {
                $(this.incomings[i]).animate({_height:14},{
                    duration:100,
                    step:function(){
                        T.stage.queueRedraw();
                    }
                });
            }
            return true;
        }
        this.init = function () {
        }
    }
});