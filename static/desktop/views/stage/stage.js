var Desktop_View_Stage = Backbone.Model.extend({
    canvas:null,
    context:null,
    hitmap:null,
    hitmapContext:null,
    zoomScale:1,
    canvasWidth:0,
    canvasHeight:0,
    dragObject:null,
    mouseView:null,
    containerDOM:null,
    initialize:function (file, containerSelector) {
        Backbone.Model.prototype.initialize.apply(this,[file]);
        var T = this;
        this._offset = {
            x:0, y:0
        };
        
        var container;
        var zeroX;
        var zeroY;
        // основной канвас для рисования нод
        this._redraw = 0;
        
        var requestAnimFrame = (function(){
          return  window.requestAnimationFrame       || 
                  window.webkitRequestAnimationFrame || 
                  window.mozRequestAnimationFrame    || 
                  window.oRequestAnimationFrame      || 
                  window.msRequestAnimationFrame     || 
                  function( callback ){
                    window.setTimeout(callback, 1000 / 60);
                  };
        })();

        var redraw = function () {
            if (T._redraw) {
                T._redraw = 0;
                T.draw();
            }
            requestAnimFrame(redraw);
        }
        
        $(document).bind({
            mousemove:function (e) {
                if (mouseDragStarted) 
                    pointerMove(e);
                mouseoverView = hitTest(e.clientX-zeroX,e.clientY-zeroY);
                T.mouseView.setPosition((e.clientX - zeroX - T.canvasWidth/2)/T.zoomScale-T._offset.x,(e.clientY - zeroY - T.canvasHeight/2)/T.zoomScale -T._offset.y);
                T.mouseView.trigger('move');
                if (mouseoverView != mouseoverOldView) {
                    if (mouseoverView != null) {
                        if (T.dragObject) {
                            if (mouseoverView instanceof Desktop_View_Droppable && mouseoverView.checkElementDrop(T.dragObject)) {
                                mouseoverView.trigger('mouseenter', e);
                                T.queueRedraw();
                            }
                        } else {
                            mouseoverView.trigger('mouseenter', e);
                            T.queueRedraw();
                        }
                    }
                    if (mouseoverOldView != null && mouseoverOldView!=T.dragObject) {
                        mouseoverOldView.trigger('mouseleave', e);
                        T.queueRedraw();
                    }
                    T.queueRedraw();
                }
                mouseoverOldView = mouseoverView;
            },
            touchmove:function (e) {
                e.preventDefault();
                if (e.targetTouches.length != 1) return; //только одним пальцем
                debug.log('document touchmove');
                if (touchDragStarted) {
                    
                    pointerMove(e);
                    e.stopPropagation();
                    return false;
                }
            },
            mouseup:function (e,b,s) {
                if (mouseDragStarted) {
                    mouseDragStarted = false;
                    pointerUp(e);
                }
            },
            touchend:function (e) {
                e.preventDefault();
                debug.log('document touchend');
                if (touchDragStarted) {
                    touchDragStarted = false;
                    pointerUp(e);
                }
            }
        });
        
        // карта кликов
        var mouseDragStarted = false;
        var touchDragStarted = false;

        var hitTestData,hitTestColor;
        var hitTest = function(x,y) {
            hitTestData = T.hitmapContext.getImageData(x, y, 1, 1).data;
            hitTestColor = '#'+Draw.rgbToHex(hitTestData[0], hitTestData[1], hitTestData[2]);
            if (hitmapObjects[hitTestColor]) {
                return hitmapObjects[hitTestColor];
            }
            return null;
        };
        var dblclickTimeout = 0, clickTimeout = 0;
        var pointerDown = function(e) {
            clearTimeout(clickTimeout);
            clickTimeout = setTimeout(function () {
                clickTimeout = 0;
            },300);
            var view = hitTest(e.clientX-zeroX,e.clientY-zeroY);
            if (view) {
                view.trigger('mousedown', e);
                if (view instanceof Desktop_View_Draggable && view.dragEnabled) {
                    dragInit(view);
                }
            } else {
                dragInit();
            }
            dragStart(e, view);
        }
        var pointerMove = function (e) {
            dragMove(e, T.dragObject);
            if (T.dragObject) {
                T.dragObject.trigger('move', e);
                T.dragObject.trigger('dragMove', e);
            }
        }
        var pointerUp = function (e) {
            clearTimeout(dragDelayTimeout);
            if (e.target != $("canvas",container).get(0)) {
                if ($(e.target).is(".layer *")) {
                    return;
                }
                if (T.dragObject) {
                    T.dragObject.setzIndex(0);
                    T.dragObject.dragging = false;
                    T.dragObject = null;
                } else {
                    T.dragObject = null;
                }
                T.queueRedraw();
                return;
            }
            var view = hitTest(e.clientX-zeroX,e.clientY-zeroY);
            if (view) {
                if (T.dragObject && view!=T.dragObject) {
                    if (view instanceof Desktop_View_Droppable && view.checkElementDrop(T.dragObject)) {
                        view.dropElement(T.dragObject);
                        T.dragCancel(e, T.dragObject);
                        T.dragObject.setzIndex(0);
                        T.dragObject.dragging = false;
                        T.dragObject = null;
                        T.queueRedraw();
                        return;
                    }
                } else {
                    view.trigger('mouseup', e);
                }
            }
            if (T.dragObject) {
                dragStop(e, T.dragObject);
                T.dragObject.setzIndex(0);
                T.dragObject.dragging = false;
            } else {
                dragStop(e);
            }
            T.queueRedraw();
            T.dragObject = null;
        }
        var mouseoverView = null;
        var mouseoverOldView = null;

        var hitmapObjects = {};
        this.registerHitObject = function (view) {
            view.hitmapColor = Draw.randHitmapColor();
            hitmapObjects[view.hitmapColor] = view;
        }
        this.deregisterHitObject = function (view) {
            if (typeof(hitmapObjects[view.hitmapColor]) != 'undefined') {
                hitmapObjects[view.hitmapColor] = null;
            }
        }
        
        container = $(containerSelector);
        this.containerDOM = container.get(0);
        this.mouseView = new Desktop_View_Abstract(file, this);
        zeroX = 0;
        zeroY = 50;//$("#fileInfo").height();
        container.bind('mousewheel',function (e, delta) {
            file.zoomAction(T.controller.view.getZoomValue() + delta/5,e.offsetX-T.canvasWidth/2,e.offsetY-T.canvasHeight/2);
            return false;
        });
        container.css({
            //left:0,top:zeroY+'px',
            //width:$("#canvasWrap").width() - $("#layoutRightPanel").outerWidth() + 'px',
            //height:$("#canvasWrap").height() - $("#fileInfo").height() + 'px'
        });
        T.canvasWidth = container.width();
        T.canvasHeight = container.height();
        // основной канвас для рисования нод
        this.canvas = $("<canvas width='"+T.canvasWidth+"px' height='"+T.canvasHeight+"px'></canvas>")[0];
        container.append(this.canvas);
        this.context = this.canvas.getContext('2d');
        this.hitmap = $("<canvas width='"+T.canvasWidth+"px' height='"+T.canvasHeight+"px'></canvas>")[0];
        this.hitmapContext = this.hitmap.getContext('2d');
        
        var dblClickView = null;
        $(this.canvas).bind({
            mousedown:function (e) {
                mouseDragStarted = true;
                pointerDown(e);
                return false;
            },
            touchstart:function (e) {
                e.preventDefault();
                debug.log('canvas touchstart');
                touchDragStarted = true;
                pointerDown(e);
                return false;
            },
            click:function (e) {
                document.activeElement.blur();//нужно, что б после этого body ловил кнопки
                if (dblclickTimeout) return false;
                dblclickTimeout = setTimeout(function () {
                    dblclickTimeout = 0;
                    dblClickView = null;
                },300);
                if (T.controller.dao.user_access.edit) {
                    selectNodeType.hide(e);
                }
                var view = hitTest(e.clientX-zeroX,e.clientY-zeroY);
                if (view) {
                    dblClickView = view;
                    view.trigger('click', e);
                } else {
                    if (!T.dragMoved) {
                        T.trigger('backgroundClick');//клик на бекграунд нужно отрабатывать только если не перетаскиваем чего-то.
                        var sel = T.controller.getSelection();
                        if (sel && sel.length) {
                            T.controller.clearSelectionAction();
                        } else {
                            if (T.controller.dao.user_access.edit) {
                                selectNodeType.show(e);
                            }
                        }
                    }
                    T.queueRedraw();
                }
            },                   
            dblclick:function (e) {
                if (dblClickView) {
                    dblClickView.trigger('dblclick', e);
                    dblClickView = null;
                };
            },
            mouseup:function (e) {
                T.trigger('focus');
                DialogsManager.blurAll();
            }
        });
        
        var zoomValue = 0;

        var zoomIntl = 0;
        /**
        * Зумировать экран
        * @param {number} value - значение, на которое нужно зумировать
        */
        this.zoom = function (value,x,y) {
            
            var nextScale = ((value+11)/10);
            var prevScale = ((zoomValue+11)/10);
            clearInterval(zoomIntl);
            var i = 0;
            zoomIntl = setInterval(function () {
                i++;
                T.zoomScale = i*(nextScale - prevScale) / 10 + prevScale;
                if (i>=10) {
                    clearInterval(zoomIntl);
                }
                T.queueRedraw();
            },10);
            
            zoomValue = value;
            /*container.addClass('zoom-'+value);
            desktopDrag.css({
                'left':-container.position().left+'px',
                'top':-container.position().top+'px'
            });*/
        }
        this.getZoomValue = function () {
            return zoomValue;
        }
        this.convertXFromPage = function (pageX) {
            return (pageX - $(this.canvas).width()/2)/this.zoomScale - this.controller.dao.x;
        }
        this.convertYFromPage = function (pageY) {
            return (pageY - $(this.canvas).height()/2)/this.zoomScale - this.controller.dao.y;
        }
        this.convertXToPage = function (localX) {
            return (localX + this.controller.dao.x) * this.zoomScale + $(this.canvas).width()/2;
        }
        this.convertYToPage = function (localY) {
            return (localY + this.controller.dao.y) * this.zoomScale + $(this.canvas).height()/2;
        }
        var dragX = 0, dragY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragMoved = false;
        var dragDelayed = false;
        var dragRetention = false;
        var dragDelayTimeout = null;
        var dragRetentionTimeout = null;
        var dragInit = function (view) {
            if (view) {
                T.dragObject = view;
                T.dragObject.setzIndex(1);
            }
            var dragDelay = (view) ? view.dragDelay : 100;
            if (dragDelay) {
                dragDelayed = true;
                dragDelayTimeout = setTimeout(function () {dragDelayed = false;}, dragDelay);
            } else if (view && view.dragRetention) {
                dragRetention = true;
                view.dragXScale = 0.1;
                view.dragYScale = 0.1;
                dragRetentionTimeout = setTimeout(function () {
                    view.dragXScale = 1;
                    view.dragYScale = 1;
                    T.dragObject.trigger('dragRetentionExpired');
                    dragRetention = false;
                }, view.dragRetention);
            } else {
                dragDelayed = false;
            }
        }
        var rectSelection = false;
        var selRect = $("<div class='selectionRect'>").appendTo('body');
        var rectSelectionItems = [];
        var dragStart = function (evt, object) {
            dragX = evt.clientX;
            dragY = evt.clientY;
            if (object && object.dragEnabled) {
                T.dragStartX = object.x;
                T.dragStartY = object.y;
                object.trigger('dragStart');
            } else if (evt.ctrlKey) {
                rectSelection = true;
                rectSelectionItems = [];
                T.dragStartX = dragX;
                T.dragStartY = dragY;
                selRect.css({left:dragX+'px', top:dragY+'px', width:'1px', height:'1px'}).show();
            } else {
                T.dragStartX = T._offset.x;
                T.dragStartY = T._offset.y;
            }
            T.dragMoved = false;
        }
        var dragMove = function (evt, object) {
            if (!dragDelayed) {
                T.dragMoved = true;
                if (object) {
                    object.dragging = true;
                    if (!object.dragXDisabled)
                        object.x = (evt.clientX - dragX)/T.zoomScale * object.dragXScale + T.dragStartX;
                    if (!object.dragYDisabled)
                        object.y = (evt.clientY - dragY)/T.zoomScale * object.dragYScale + T.dragStartY;
                } else if (rectSelection) {
                    var x1 = Math.min(dragX, evt.clientX);
                    var y1 = Math.min(dragY, evt.clientY);
                    var x2 = Math.max(dragX, evt.clientX);
                    var i,y2 = Math.max(dragY, evt.clientY);
                    selRect.css({left:x1+'px', top:y1+'px', width:(x2-x1)+'px', height:(y2-y1)+'px'});
                    rectSelectionItems = [];
                    x1 = (x1 - zeroX- T.canvasWidth/2) / T.zoomScale - T._offset.x;
                    x2 = (x2 - zeroX- T.canvasWidth/2) / T.zoomScale - T._offset.x;
                    y1 = (y1 - zeroY- T.canvasHeight/2) / T.zoomScale - T._offset.y;
                    y2 = (y2 - zeroY- T.canvasHeight/2) / T.zoomScale - T._offset.y;
                    for (i=0;i<T.nodes.items.length;i++) {
                        if (T.nodes.items[i].x>=x1 && T.nodes.items[i].x<=x2 && T.nodes.items[i].y>=y1 && T.nodes.items[i].y<=y2) {
                            rectSelectionItems.push(T.nodes.items[i]);
                            T.nodes.items[i].data.setHighlighted(true);
                        } else {
                            T.nodes.items[i].data.setHighlighted(false);
                        }
                    }
                    for (i=0;i<T.groups.items.length;i++) {
                        if (T.groups.items[i].x>=x1 && T.groups.items[i].x<=x2 && T.groups.items[i].y>=y1 && T.groups.items[i].y<=y2) {
                            rectSelectionItems.push(T.groups.items[i]);
                            T.groups.items[i].data.setHighlighted(true);
                        } else {
                            T.groups.items[i].data.setHighlighted(false);
                        }
                    }
                } else {
                    T._offset.x = (evt.clientX - dragX)/T.zoomScale + T.dragStartX;
                    T._offset.y = (evt.clientY - dragY)/T.zoomScale + T.dragStartY;
                }
            }
            T.queueRedraw();
        };
        var dragStop = function (evt, object) {
            clearTimeout(dragRetentionTimeout);
            if (T.dragMoved) {
                if (object && object instanceof Desktop_View_Draggable) {
                    if (object.dragRevert || dragRetention) {
                        object.animate({x:T.dragStartX,y:T.dragStartY},1000,0,function () {
                            object.trigger('move');
                        });
                    } else {
                        object.trigger('dragStop');
                    }
                } else if (rectSelection) {
                    selRect.hide();
                    rectSelection = false;
                    var i;
                    for (i=0;i<rectSelectionItems.length;i++) {
                        rectSelectionItems[i].data.setHighlighted(false);
                        rectSelectionItems[i].select();
                        T.controller.addToSelectionAction(rectSelectionItems[i]);
                    }
                } else {
                    T.move(T._offset.x,T._offset.y);
                }
                T.queueRedraw();
            }
        };
        var selectNodeType = {
            clickX:0,clickY:0,
            hideTimeout:0,
            hide:function () {
                clearTimeout(selectNodeType.hideTimeout);
                selectNodeType.popup.fadeOut(100);
            },
            popup:0,
            init:function () {
                selectNodeType.popup = $("#selectNodeType").bind({
                    'show':function () {
                        clearTimeout(selectNodeType.hideTimeout);
                    },
                    'mouseover':function () {
                        clearTimeout(selectNodeType.hideTimeout);
                    },
                    'mouseleave':function() {
                        clearTimeout(selectNodeType.hideTimeout);
                        selectNodeType.hideTimeout = setTimeout(selectNodeType.hide,500);
                    }
                });
                $(".popupMenuItem",selectNodeType.popup).unbind('click').click(function () {
                    selectNodeType.popup.hide();
                    var type = parseInt($(this).attr('rel'));
                    switch (type) {
                        case Desktop_Dao_Factory.TYPE_DATA:
                        case Desktop_Dao_Factory.TYPE_FORMULA:
                            var x = T.convertXFromPage(selectNodeType.clickX);
                            var y = T.convertYFromPage(selectNodeType.clickY);
                            T.controller.newNodeAction({
                                type:type,
                                x:x,
                                y:y,
                            });
                            break;
                        default:
                            //file.searchOp(type, selectNodeType.clickX, selectNodeType.clickY);
                    }
                })
            },
            show:function (e) {
                if (!T.controller.dao.readonly) {
                    if (selectNodeType.popup.css('display')=='block') {
                        selectNodeType.hide();
                        return;
                    }
                    selectNodeType.clickX = e.pageX - $(T.canvas).offset().left;
                    selectNodeType.clickY = e.pageY - $(T.canvas).offset().top;
                    selectNodeType.popup.css({
                        'left':e.pageX,
                        'top':e.pageY,
                    }).show();
                }
            }
        }
        selectNodeType.init();

        redraw();
    },
    setOffset:function (x,y) {
        this._offset.x = x;
        this._offset.y = y;
    },
    dragCancel:function (evt, object) {
        if (this.dragMoved) {
            if (object) {
                object.x = this.dragStartX;
                object.y = this.dragStartY;
                object.trigger('dragCancel');
                object.trigger('move');
            } else {
                this._offset.x = this.dragStartX;
                this._offset.y = this.dragStartY;
            }
            this.queueRedraw();
        }
    },
    queueRedraw:function () {
        this._redraw++;
    },
    draw: function () {
        // очистим канвасы
        var w = this.containerDOM.scrollWidth;
        var h = this.containerDOM.scrollHeight;
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.canvas.width = w;
        this.hitmap.width = w;
        this.canvas.height = h;
        this.hitmap.height = h;
        this.context.translate(w/2,h/2);
        this.hitmapContext.translate(w/2,h/2);
        this.context.scale(this.zoomScale,this.zoomScale);
        this.hitmapContext.scale(this.zoomScale,this.zoomScale);

        this.context.translate(this._offset.x,this._offset.y);
        this.hitmapContext.translate(this._offset.x,this._offset.y);
        
        var minX = -this._offset.x-this.canvasWidth/2/this.zoomScale - 200;
        var maxX = -this._offset.x+this.canvasWidth/2/this.zoomScale + 200;
        var minY = -this._offset.y-this.canvasHeight/2/this.zoomScale - 200;
        var maxY = -this._offset.y+this.canvasHeight/2/this.zoomScale + 200;
        var i;
        for (i=0;i<this.connections.items.length;i++) {
            this.connections.items[i].draw(this.context);
        }
        if (this.newConnection) {
            this.newConnection.draw(this.context);
            this.queueRedraw();
        }
        var zIndexes = {};
        var z,j,st;
        for (i=0;i<this.nodes.items.length;i++) {
            z = this.nodes.items[i].zIndex();
            if (!zIndexes[z]) {
                zIndexes[z] = [];
            };
            zIndexes[z].push(this.nodes.items[i]);
        }
        for (i=0;i<this.groups.items.length;i++) {
            z = this.groups.items[i].zIndex();
            if (!zIndexes[z]) {
                zIndexes[z] = [];
            };
            zIndexes[z].push(this.groups.items[i]);
        }
        var node;
        for (z in zIndexes) {
            for (j=0;j<zIndexes[z].length;j++){
                node = zIndexes[z][j];
                // проверяем, попадает ли нода в экран.
                if (node.x < minX || node.x > maxX) continue;
                if (node.y < minY || node.y > maxY) continue;

                node.draw(this.context);
                //node.drawHitmap(this.context);
                node.drawHitmap(this.hitmapContext);//this.hitmapContext);
                //this.nodes.items[i].drawHitmap(this.context);//this.hitmapContext);
            }
        }
    }

});