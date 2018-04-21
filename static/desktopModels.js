var logEnabled = false;
/** для наследования классов */
function extend(Child, Parent) {
    var F = function() { }
    F.prototype = Parent.prototype
    Child.prototype = new F()
    Child.prototype.constructor = Child
    Child.superclass = Parent.prototype
}
/** Для событий */
var Bindable = function () {
	this.element = {}; // jquery объект, определяемый в конструкторе
}
Bindable.prototype = $.extend(Bindable.prototype, {
    bind:function () { this.element.bind.apply(this.element,arguments); },
    one:function () { this.element.one.apply(this.element,arguments); },
    trigger:function () {this.element.trigger.apply(this.element,arguments); }
});
/** Базовый класс ячейки на столе*/
var Cell = function (data, container) {
	Cell.superclass.constructor.apply(this);
    this.id = data['id']?data['id']:0;
	this._positionChanged = false;
    if (!data['css_class'])   data.css_class = '';
    if (!data['x'])           data.x = desktop.scaleDragX(100);
    if (!data['y'])           data.y = desktop.scaleDragX(100);
    if (!data['hidden'])      data.hidden = false;
	data.x = parseInt(data.x);
	data.y = parseInt(data.y);
    this.data = data;
    this.container = container;
    this.incomings = [];
    this.outgoings = [];
    this.slotsData = [];
    this.group = {};
    this._visible = true;
    this._selected = false;
	this._highlighted = false;
    this._active = false;
	this.layer = 0;
	this._visibleLayer = true;
	this._cssClasses = {};
    this.lowlightTimeout = 0;
    var T = this;
    this.element = $('<div class="cellWrap '+data.css_class+'"></div>')
    .append('<div class="inWrap"></div>')
    .append(this.display())
    .append('<div class="outWrap"></div>')
    .css({
        position:'absolute',
        left:desktop.scaleDataX(data.x)+'px',
        top:desktop.scaleDataX(data.y)+'px'
    })
    .data('model',this);
	if (!desktop.readonly) {
		this.element.draggable({
			'delay':100,
			'revert':function (event) {
				if (event) {
					var ui = $(this).data("draggable");
					ui.position.left = ui.originalPosition.left;
					ui.position.top = ui.originalPosition.top;
					$(this).css({
						left:ui.originalPosition.left,
						top:ui.originalPosition.top
					});
					T.element.trigger('drag',ui);
				}
				return false;
			},
			'revertDuration': 0,
			'start':function (event, ui) {
				if (!T._selected) {
					desktop.clearSelection();
					T.select();
				}
				T.element.trigger('dragStart');
			},
			'drag':function (event, ui) {
				T.element.trigger('drag',ui);
			},
			'stop':function () {
				if (!T._visible) return;
				var pos = T.element.position();
				T.data.x = desktop.scaleDragX(pos.left);
				T.data.y = desktop.scaleDragX(pos.top);
				T._positionChanged = true;
				T.element.trigger('dragStop');
			}
		});
	}
    this.element.dblclick(function (e) {
        e.stopPropagation();
        T.select();
        T.element.trigger('open');
    })
    .click(function (e) {
        e.stopPropagation();
        if (T._selected) {
            if (e.ctrlKey || e.shiftKey) {
                T.deselect();
            }
        } else {
            if (!(e.ctrlKey || e.shiftKey) && !$.isEmptyObject(desktop.selection)) {
                desktop.clearSelection();
            }
            T.select();
        }
    });
    T.bind('hide', function () {
        T.deselect();
    });
    this.container.append(this.element);
    if (data.hidden) {
        this.hide();
    }
}
extend(Cell,Bindable);
Cell.CLASS_NODE = 0;
Cell.CLASS_GROUP = 1;
Cell.prototype = $.extend(Cell.prototype,{
    display:function () {
        return '';
    },
    save:function () {
    },
    width: function (flush) {
        if (typeof(this._width)=="undefined" || flush)
            this._width = this.element.outerWidth();
        return this._width;
    },
    height: function (flush) {
        if (typeof(this._height)=="undefined" || flush)
            this._height = this.element.outerHeight();
        return this._height;
    },
    updatePos:function () {
        this.element.css({
            'left':desktop.scaleDataX(this.data.x)+'px',
            'top':desktop.scaleDataX(this.data.y)+'px',
        });
    },
    onSlotClick:function (e) {
        e.stopPropagation();
		if (desktop.readonly) return false;
        if (desktop.freezed) return false;
        return true;
    },
    addSlot: function (id, type, title) {
        var slot = new Slot(id, this, $('.'+(type == Slot.TYPE_IN ? 'in' : 'out')+'Wrap',this.element), title, type);
        slot.bind('click',this.onSlotClick);
        return slot;
    },
    setGroup: function (group) {
        this.group = group;
		var T = this;
		$('.groupsInfo',T.element).remove();
		$('.groupCollapse',T.element).remove();
		desktop.ready(function () {
			var grInfo = $("<div class='groupsInfo'></div>");
			var gr = group;
			while (!$.isEmptyObject(gr)) {
				grInfo.prepend($('<div class="groupInfo '+desktop.nodeStyles[gr.data.style]+'"></div>'));
				gr = gr.group;
			}
			T.element.prepend(grInfo);
		});
        this.element.append($('<div class="groupCollapse"></div>').click(function (e) {
            e.stopPropagation();
            if (desktop.freezed) return false;
            group.collapse();
        }).mouseover(function () {
			group.highlightcells();
		}).mouseout(function () {
			group.lowlightcells();
		}));
        var updateCells = [],i,j,c,found;
        for(i in this.outgoings) {
            for (j in this.outgoings[i].connections) {
                found = false;
                for (c in updateCells) {
                    if (updateCells[c] == this.outgoings[i].connections[j].to.cell) {
                        found = true;
                        break;
                    }
                }
                if (found) continue;
                updateCells.push(this.outgoings[i].connections[j].to.cell);
            }
        }
        for (c in updateCells) {
            updateCells[c].updateConnections();
        }
        this.hide();
		var self = this;
		this.bind('cell_remove', function () {
			self.clearGroup();
		});
    },
    clearGroup: function () {
        if ($.isEmptyObject(this.group)) return;
        this.group.removeCell(this);
        this.group = {};
        $(".groupCollapse",this.element).remove();
        this.show();
    },
    remove:function () {
		this.element.draggable('destroy');
		this.trigger('cell_remove');
        var i;
        for (i in this.incomings) {
            this.incomings[i].remove();
        }
        for (i in this.outgoings) {
            this.outgoings[i].remove();
        }
        this.element.remove();
    },
    show:function () {
        if (this._visible) return;
        this._visible = true;
        this.element.show();
        var i;
        for (i in this.incomings) {
            this.incomings[i].show();
        }
        for (i in this.outgoings) {
            this.outgoings[i].show();
        }
        this.trigger('show');
    },
    hide:function () {
        if (!this._visible) return;
        this._visible = false;
        var i;
        for (i in this.incomings) {
            this.incomings[i].hide();
        }
        for (i in this.outgoings) {
            this.outgoings[i].hide();
        }
        this.element.hide();
        this.trigger('hide');
    },
    highlightConnections:function () {
        var slots = this.incomings.concat(this.outgoings);
        for (var i in slots) {
            for (var j in slots[i].connections) {
                slots[i].connections[j].highlight();
            }
        }
    },
    lowlightConnections:function () {
        var slots = this.incomings.concat(this.outgoings);
        for (var i in slots) {
            for (var j in slots[i].connections) {
                slots[i].connections[j].lowlight();
            }
        }
    },
    select:function () {
        if (this._selected) return;
        if (!this._visible) return
        this._selected = true;
        this.element.addClass('selected');
        this.highlightConnections();
        this.element.trigger('select');
		this.addCssClass('highlightSelection');
    },
    deselect:function () {
        if (!this._selected) return;
        this._selected = false;
        this.element.removeClass('selected');
        this.lowlightConnections();
        this.element.trigger('deselect');
		this.removeCssClass('highlightSelection');
    },
	addCssClass:function (cls) {
		if (this._cssClasses[cls]) return;
		this._cssClasses[cls] = 1;
		this.element.addClass(cls);
		this.element.trigger('addClass',cls);
	},
	removeCssClass:function (cls) {
		if (!this._cssClasses[cls]) return;
		this._cssClasses[cls] = 0;
		this.element.removeClass(cls);
		this.element.trigger('removeClass',cls);
	},
	hasCssClass:function (cls) {
		if (this._cssClasses[cls]) return true;
		return false;
	},
    highlight:function () {
        if (this._highlighted) return;
        if (!this._visible) return
        this._highlighted = true;
        this.element.addClass('highlighted');
        this.element.trigger('highlighted');
        clearTimeout(this.lowlightTimeout);
        var self = this;
        this.lowlightTimeout = setTimeout(function () {
            self.lowlight();
        },1500);
    },
    lowlight:function () {
        if (!this._highlighted) return;
        this._highlighted = false;
        this.element.removeClass('highlighted');
        this.element.trigger('lowlighted');
    },
    activate:function() {
        if (this._active) return;
        if (!this._visible) return
        this._active = true;
        this.element.addClass('active');
        this.element.trigger('activated');
    },
    deactivate:function () {
        if (!this._active) return;
        this._active = false;
        this.element.removeClass('active');
        this.element.trigger('deactivated');
    },
	showLayer:function () {
		if (this._visibleLayer) return false;
		this._visibleLayer = true;
		this.element.removeClass('invisibleLayer');
		this.element.trigger('layerShown');
	},
	hideLayer:function () {
		if (!this._visibleLayer) return false;
		this._visibleLayer = false;
		this.element.addClass('invisibleLayer');
		this.element.trigger('layerHidden');
	},
});

var Node = function (data, container, noUpdate) {
    var T = this;
    if (!data['name'])        data['name'] = 'node';
    if (!data['class'])       data['class'] = '';
    if (!data['description']) data['description'] = 'Новый элемент';
    if (!data['x'])           data['x'] = 100;
    if (!data['y'])           data['y'] = 100;
    if (!data['hidden'])      data['hidden'] = false;
    Node.superclass.constructor.apply(this, [data, container]);
    this.bind('show',function () {
        //T.update();
    });
    this.bind('open',function () {
        var nodeDetails = new NodeDetails(T,{});
    });
    desktop.ready(function () {
        T.update();
    });
}
extend(Node,Cell);
Node.TYPE_DATA = 1;
Node.TYPE_FORMULA = 2;
Node.TYPE_OPERATOR_DATA = 3;
Node.TYPE_OPERATOR = 4;
Node.POSITION_INNER = 0;
Node.POSITION_INPUT = 1;
Node.POSITION_OUTPUT = 2;
Node.prototype = $.extend(Node.prototype,{
    display: function () {
        return '<div class="node '+this.data['class']+'"><div class="nodeInner"><div class="name">'+this.data['name']+'</div><div class="title">'+this.data['description']+'</div></div></div>';
    },
    save:function () {
		if (desktop.readonly) return false;
        var params = {json:1};
        params.data = this.data;
        var self = this;
        $.post('/constructor/file/'+desktop.file.id+'/save_node',params,function (res) {
            if (res['status']=='ok') {
                if (self.data.id == 0) {
                    self.data.id = res.data.id;
                    self.id = self.data.id;
                }
                if (res.data['connections']) {
                    self.data.connections = res.data.connections;
                }
                self.update();
                self.updateConnections();
                if (self._selected) {
                    self._selected = false;
                    self.select();
                }
                self.trigger('save');
                desktop.updateConnections();
            } else {
                self.trigger('save_error');
            }
        },'json');        
    },
    onSlotClick:function(e) {
        if (!Node.superclass.onSlotClick.apply(this,[e])) return false;
		if (desktop.readonly) return false;
        var S = $(this);
        var T = S.data('model');
        if (T.type==Slot.TYPE_IN) {
            if (T.connections.length) {
                osi.confirm('Разъединить?', function () {
                    desktop.disconnectNodes(T);
                });
            }
        } else {
            desktop.face.connect(T);
        }
        return true;
    },
    getSlotsData:function () {
        var i, vars, slotsData = [];
        return slotsData;
    },
    update: function () {
        var T = this;
        this.element.attr('class','cellWrap '+desktop.nodeStyles[this.data.style]);
        if (this.data.type == Node.TYPE_DATA) {
            this.element.addClass('typeData');
        }
        if (!this.data['name']) this.data['name'] = 'node';
        if (!this.data['description']) this.data['description'] = 'Новый элемент';
        $('.node .name',this.element).html(this.data.name);
        $('.node .title',this.element).html(this.data.description);
        $('.node',this.element).attr('class','node '+this.data['class']);
        
        if (!T.outgoings.length) {
            T.outgoings.push(T.addSlot(0, Slot.TYPE_OUT, T.data.name));
        }

        var i,vars;
        for (i in T.incomings) T.incomings[i].remove();
        T.incomings = [];
        $('.inWrap',T.element).empty();
        if (T.data.type == Node.TYPE_FORMULA && T.data.formula) {
            vars = expression.get_vars(T.data.formula);
            for(i in vars) {
                slot = T.addSlot(i, Slot.TYPE_IN, vars[i]);
                T.incomings.push(slot);
            }
        }
        desktop.ready(function () {
            T.updateConnections();
        });
    },
    updateConnections: function () {
        var T = this, slot,c,fromCell,cell,fromSlot,toSlot,i;
        for (i in T.incomings) T.incomings[i].clear();
        for (slot in T.data['connections']) {
			if (!T.incomings[slot]) {
				continue;
			}
            c = T.data['connections'][slot];
            fromCell = desktop._getNodeById(c);
            if (fromCell) {
                cell = fromCell;
                while (!$.isEmptyObject(cell.group)) {
                    conn = new Connection(cell.group.outgoings[0], T.incomings[slot]);
                    cell = cell.group;
                }
                conn = new Connection(fromCell.outgoings[0], T.incomings[slot]);
            }
        }
    }
});

var Group = function (data, container, noUpdate) {
    var T = this;
    if (!data['opened'])      data.opened = false;    
    if (!data['name'])        data.name = "Новая группа";
    if (!data['description']) data.description = "Новая группа";
    Group.superclass.constructor.apply(this, [data, container]);
    this.data.opened = parseInt(this.data.opened);
    this.bind('show',function () {
        //this.update();
    });
    $('.groupExpand',T.element).bind('click', function (e) {
        e.stopPropagation();
        T.expand();
    });
    this.bind('open',function () {
        var groupDetails = new GroupDetails(T,{});
    });
    this.element.droppable({
        accept:function (obj) {
            if (!obj.hasClass('cellWrap')) return false;
            var cell = obj.data('model');
            //if (!cell instanceof Node) return false;
            return true;
        },
        greedy:true,
        hoverClass:'droppable',
        drop:function (event,ui) {
            event.stopPropagation();
			for (var i in desktop.selection) {
				T.addCell(desktop._cells[i]);
			}
        }
    });
	this.saveTimeout= 0;
    this.cells = [];
    desktop.ready(function () {
        T.update();
    });
}
extend(Group,Cell);
Group.prototype = $.extend(Group.prototype,{
    display:function () {
        return '<div class="groupExpand"></div><div class="group"><div class="groupInner"><div class="name">'+this.data.name+'</div></div></div>';
    },
	queueSave:function(update) {
		var self = this;
		clearTimeout(this.saveTimeout);
		this.saveTimeout = setTimeout(function () {
			self.save(update);
		},500);
	},
    cancelSave:function() {
        clearTimeout(this.saveTimeout);
    },
    save:function (update) {
		if (desktop.readonly) return false;
        var self = this;
        var params = {json:1};
        params.data = this.data;
        if (typeof(update)=='undefined') update = true;
        $.post('/constructor/file/'+desktop.file.id+'/save_group',params,function (res) {
            if (res['status']=='ok') {
                if (update) {
                    if (self.data.id == 0) {
                        self.data.id = res.data.id;
                        self.id = self.data.id;
                    }
                    self.update();
                    self.updateConnections();
                    if (self._selected) {
                        self._selected = false;
                        self.select();
                    }
                }
                self.trigger('save');
            } else {
                self.trigger('save_error');
            }
        },'json');                
    },
    expand:function (animate, save) {
        var i;
        if (typeof(animate)=='undefined') animate = true;
        for(i in this.cells) {
            if (animate) {
                var l = this.cells[i].element.css('left');
                var t = this.cells[i].element.css('top');
                this.cells[i].element.css({
                    'left':this.element.css('left'),
                    'top':this.element.css('top')
                }).animate({
                    left:l,top:t
                },{duration:200, step:function () {
                    desktop._redraw++;
                }});
            }
			if (!this.cells[i] instanceof Group || !this.cells[i].data.opened) {
				this.cells[i].show();
			} else {
				this.cells[i].expand(animate, save);
			}
        }
        this.hide();
        this.data.opened = true;
		if (typeof(save)=="undefined" || save) {
			this.save(false);
		}
        this.trigger('expand');
    },
    collapse:function (animate, save) {
        var d = $.Deferred();
        if (!this.data.opened) {
            d.resolve();
            return d.promise();
        }
        var i;
        if (typeof(animate)=='undefined') animate = true;
        var defs = [];
        for(i in this.cells) {
            (function (cell) {
                if (cell instanceof Group) {
                    nd = $.Deferred();
                    (function (nd) {
                        cell.collapse(animate, false).done(function () {
                            nd.resolve();
                        });
                    })(nd);
                    defs.push(nd);
                }
            })(this.cells[i]);
        }
        var self = this;
        $.when.apply(null, defs).done(function() {
            var defs = [];
            var nd;
            for(i in self.cells) {     
                nd = $.Deferred();
                (function(nd){
                    if (animate) {
                        self.cells[i].element.data('prevPos',{
                            left:self.cells[i].element.css('left'),
                            top:self.cells[i].element.css('top'),
                        }).animate({
                            left:self.element.css('left'),top:self.element.css('top')
                        },{duration:200, step:function () {
                            desktop._redraw++;
                        },complete:function () {
                            $(this).data('model').hide();
                            $(this).css($(this).data('prevPos'));
                            nd.resolve();
                        }});
                    } else {
                        self.cells[i].hide();
                        nd.resolve();
                    }
                })(nd);
                defs.push(nd);
            }
            $.when.apply(null, defs).done(function () { d.resolve(); });
        });
        this.data.opened = false;
        if (typeof(save)=="undefined" || save) {
			this.save(false);
		}
        d.done(function () {
            self.show();
        });
        this.trigger('collapse');
        return d.promise();
    },
    remove:function () {
        Group.superclass.remove.apply(this);
        var i;
		for (i=this.cells.length-1;i>=0;i--) {
            this.cells[i].clearGroup();
        };
        this.cancelSave();
        this.cells = [];
    },
    addCell:function (cell) {
        var params = {group_id: this.id,  json: 1};
        if (cell instanceof Node) {
            this.data.nodes.push(cell.id);
            params.node_id = cell.id;
        } else if (cell instanceof Group) {
            this.data.inner_groups.push(cell.id);
            params.inner_group_id = cell.id;
        }
        this.update();
        this.updateConnections();
		if (desktop.readonly) return false;
        $.post(document.location.href + '/add_group_item', params, function(data){});
    },
    removeCell:function(cell) {
        for (var i in this.data.nodes) {
            if (this.data.nodes[i] == cell.id) {
                this.data.nodes.splice(i,1);
                break;
            }
        }
        this.update();
        this.updateConnections();
		this.queueSave();
    },
    update: function () {
        var T = this;
        this.element.attr('class','cellWrap '+desktop.nodeStyles[this.data.style]);
        if (!this.data['name']) this.data['name'] = 'group';
        if (!this.data['description']) this.data['description'] = 'Новая группа';
        $('.group .name',this.element).html(this.data.name);
        $('.group .desc',this.element).html(this.data.description);
        var i,j,c,cell,conn;
        this.cells = [];
        if (!this.incomings.length) {
            this.incomings.push(this.addSlot(0,Slot.TYPE_IN,''));
        }
        if (!this.outgoings.length) {
            this.outgoings.push(this.addSlot(0,Slot.TYPE_OUT,''));
        }
        for (i in this.incomings) {
            this.incomings[i].clear();
        }
        for (i in this.outgoings) {
            this.outgoings[i].clear();
        }
        for(j in T.data.nodes) {
            cell = desktop._getNodeById(T.data.nodes[j]);
            if (!cell) continue;
            //cell.setGroup(T);
            T.cells.push(cell);
        }
        for(j in T.data.inner_groups) {
            cell = desktop._getGroupById(T.data.inner_groups[j]);
            if (!cell) continue;
            //cell.setGroup(T);
            T.cells.push(cell);
        }
        desktop.ready(function () {
            T.updateConnections();
            desktop.ready(function () {
                for (j in T.cells) {
                    T.cells[j].setGroup(T);
                }
				desktop.ready(function () {
					if (T.data.opened && ($.isEmptyObject(T.group) || T.group.data.opened)) {
						T.expand(false, false);
					}
				});
            });
        });
    },
    updateConnections:function () {
        var j,i,c,cell,groupCell,conn;
        for (i in this.incomings) this.incomings[i].clear();
        //for (i in this.outgoings) this.outgoings[i].clear();
        for (j in this.cells) {
            cell = this.cells[j];
            for (i in cell.incomings) {
                for (c in cell.incomings[i].connections) {
                    groupCell = cell.incomings[i].connections[c].from.cell;
                    while (!$.isEmptyObject(groupCell.group) && groupCell.group != this) {
                        conn = new Connection(groupCell.group.outgoings[0],this.incomings[0]);
                        groupCell = groupCell.group;
                    }
                    conn = new Connection(cell.incomings[i].connections[c].from,this.incomings[0]);
                }
            }
        }
    },
	highlightcells:function () {
		var i;
		for(i=0;i<this.cells.length;i++) {
			this.cells[i].highlight();
			if (this.cells[i] instanceof Group) {
				this.cells[i].highlightcells();
			}
		}
	},
	lowlightcells:function() {
		var i;
		for(i=0;i<this.cells.length;i++) {
			this.cells[i].lowlight();
			if (this.cells[i] instanceof Group) {
				this.cells[i].lowlightcells();
			}
		}
	}
});
var Connection = function (fromSlot, toSlot) {
	Connection.superclass.constructor.apply(this);
    this.element = $("<span></span>");
    this.from = fromSlot;
    this.from.connect(this);
    this.to = toSlot;
    this.to.connect(this);
    this._highlighted = 0;
    this._visible = true;
    desktop.addConnection(this);
}
extend(Connection,Bindable);
Connection.prototype = $.extend(Connection.prototype,{
    show: function () {
        this._visible = true;
        desktop._redraw++;
    },
    hide: function () {
        this._visible = false;
        desktop._redraw++;
    },
    remove: function () {
        this.from.disconnect(this);
        this.to.disconnect(this);
        this.trigger('connection_remove');
        this.element.remove();
    },
    highlight: function () {
        this._highlighted ++;
        desktop._redraw++;
		if (this._visible) {
			this.from.cell.addCssClass('highlightSelection');
			this.to.cell.addCssClass('highlightSelection');
		}
    },
    lowlight: function () {
        this._highlighted = Math.max(0,this._highlighted-1);
        desktop._redraw++;
		if (this._visible) {
			this.to.cell.removeCssClass('highlightSelection');
			this.from.cell.removeCssClass('highlightSelection');
		}
    }
});
var Slot = function (id, cell, container, title, type) {
	Slot.superclass.constructor.apply(this);
    this.id = parseInt(id);
    this.cell = cell;
    this.container = container;
    this.title = title;
    this.type = type;
    this.element = $('<div class="'+(type===Slot.TYPE_OUT ? 'outSlot':'inSlot')+'"></div>');
    container.append(this.element);
    this.element.data('model',this);
    this.element.addClass('empty');
    this.connections = [];
    this._visible = true;
    if (title) {
        this.element.attr('title',title);
        this.element.tooltip();
    }
    var self = this;
    this.bind('click',function () {
        console.log(self);
    });
}
extend(Slot,Bindable);
Slot.TYPE_IN = 1;
Slot.TYPE_OUT = 2;
Slot.prototype = $.extend(Slot.prototype, {
    position:function () {
        var off = this.element.offset();
        return {
            left: off.left + this.element.outerWidth() / 2,
            top: off.top + this.element.outerHeight() / 2
        };
    },
    hide: function () {
        this._visible = false;
        this.element.hide();
        var i;
        for (i in this.connections) {
            this.connections[i].hide();
        }
    },
    show: function () {
        this._visible = true;
        this.element.show();
        var i;
        for (i in this.connections) {
            if (!this.connections[i].from._visible || !this.connections[i].to._visible) continue;
            this.connections[i].show();
        }
    },
    remove:function () {
        this.clear();
        this.trigger('slot_remove');
        this.element.remove();
    },
    clear:function () {
        var conns = this.connections;
        this.connections = [];
        for(var i in conns) {
            conns[i].remove();
        }
        this.element.addClass('empty');
        this.trigger('clear');
    },
    connect:function (connection) {
        this.element.removeClass('empty');
        this.connections.push(connection);
        this.trigger('connect');
    },
    disconnect:function(connection) {
        for(var i in this.connections) {
            if (this.connections[i] == connection) {
                this.connections[i] = undefined;
                this.connections.splice(i,1);
                i--;
            }
        }
        if (!this.connections.length) {
            this.clear();
        }
    }
});
