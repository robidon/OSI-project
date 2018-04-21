/**
* @class
* @extends Bindable
* @param {Desktop_Controller_File} file
*/
var Desktop_View_File = Desktop_View_Stage.extend({
    initialize:function (file) {
        this.controller = file;
        this.element = $("#desktopWrap");
        this.element.empty();
        $("#canvasTemplate").tmpl(file.dao).appendTo(this.element);
        
        Desktop_View_Stage.prototype.initialize.apply(this, [file, '#canvas']);
        var T = this;
        
        var collapsedNodeIds = {};
        var collapsedGroupIds = {};

        var layerUpdatedShownHandler = function () {
            var layer = this; // вызывается в контексте дао слоя
            var i,len = layer.nodes.items.length;
            if (layer.shown) {
                var checkVisible = function (node) {
                    if (node.group) {
                        var gr = T.controller.dao.groups.get(node.group);
                        if (!gr.opened) return false;
                        return checkVisible(gr);
                    } else {
                        return true;
                    }
                }
                var added = [];
                for (i=0;i<len;i++) {
                    if (checkVisible(layer.nodes.items[i])) {
                        var view = Desktop_View_Factory.node(layer.nodes.items[i], T.controller, T);
                        T.addNode(view);
                        added.push(view);
                    }
                }
                for (i=0;i<added.length;i++) {
                    T.addNodeConnections(added[i]);
                }
            } else {
                for (i=0;i<len;i++) {
                    var node = T.nodes.get(layer.nodes.items[i].id);
                    if (node) T.removeNode(node);
                }
            }
        }
        var setNodeLayer = function (node, layer) {
            if (node instanceof Desktop_Dao_Group) {
                var i;
                for (i=0;i<node.groups.items.length;i++) {
                    setNodeLayer(node.groups.items[i], layer);
                }
                for (i=0;i<node.nodes.items.length;i++) {
                    setNodeLayer(node.nodes.items[i], layer);
                }
                return;                           
            }
            var curLayer = T.controller.dao.layers.get(node.layerId);
            if (curLayer) {
                curLayer.nodes.remove(node);
            }
            layer.dao.nodes.add(node);
        }
        var layerMouseupHandler = function (e,layer) {
            if (T.dragObject) {
                if (T.dragObject instanceof Desktop_View_AbstractNode) {
                    setNodeLayer(T.dragObject.data, layer);// нода могла быть не выделена
                    var i,sel = T.controller.getSelection(); // добавляем все элементы, что выделены на слой
                    for (i=0;i<sel.length;i++) {
                        setNodeLayer(sel[i].data, layer);
                    }
                }
                T.dragCancel(e, T.dragObject);
                T.dragObject.setzIndex(0);
                T.dragObject.dragging = false;
                T.dragObject = null;
                T.queueRedraw();
            } else {
                //T.dragCancel(e);
            }
        }
        var layerAddedHandler = function (layer) {
            layer.bind('update:shown', layerUpdatedShownHandler);
            layer.nodes.bind('add', function () { layerUpdatedShownHandler.apply(layer); });
            layer.nodes.bind('remove', function () { layerUpdatedShownHandler.apply(layer); });
        }
        var layerRemovedHandler = function (layer) {
            layer.unbind('update:shown', layerUpdatedShownHandler);
        }
        var startNewConnection = function (fromSlot) {
            if (!T.controller.dao.user_access.edit) return;
            T.newConnection = new Desktop_View_Connection(T.controller, fromSlot.node, T.mouseView, fromSlot, undefined);
            var i,j;
            for (i=0;i<T.nodes.items.length;i++) {
                for (j=0;j<T.nodes.items[i].incomings.length;j++) {
                    T.nodes.items[i].incomings[j].dragEnabled = false;
                }
            }
            T.bind('backgroundClick', backgroundClickHandler);
        }
        var backgroundClickHandler = function () {
            T.unbind('backgroundClick', backgroundClickHandler);
            stopNewConnection();
        }
        var stopNewConnection = function (toSlot) {
            if (!T.controller.dao.user_access.edit) return;
            if (toSlot) {
                T.controller.addConnectionAction(T.newConnection.fromCell, toSlot);
            }
            T.newConnection = undefined;
            var i,j;
            for (i=0;i<T.nodes.items.length;i++) {
                for (j=0;j<T.nodes.items[i].incomings.length;j++) {
                    T.nodes.items[i].incomings[j].dragEnabled = true;
                }
            }
        }
        var outgoingSlotClickHandler = function outgoingSlotClickHandler(slot) {
            startNewConnection(slot);
            T.queueRedraw();
        }
        var incomingSlotClickHandler = function incomingSlotClickHandler(slot) {
            if (T.newConnection) {
                stopNewConnection(slot);
            } else {
                if (slot.connections.length == 1) {
                    var node = slot.connections[0].fromSlot.node;
                    T.animove(-node.x,-node.y);        
                }
            }
            T.queueRedraw();
        }
        var nodeStopDragHandler = function nodeStopDragHandler() {
            file.moveNode(this.data, this, this.x, this.y);
            var i,sel = T.controller.getSelection();
            for (i=0;i<sel.length;i++) {
                if (sel[i]!=this) {
                    file.moveNode(sel[i].data,sel[i],sel[i].x,sel[i].y);
                }
            }
            this.unbind('dragMove',selectedNodeMoveHandler);
        }
        var selectedNodeDragCancelHandler = function selectedNodeDragCancelHandler() {
            var i,sel = T.controller.getSelection();
            for (i=0;i<sel.length;i++) {
                if (sel[i]!=this) {
                    sel[i].setPosition(sel[i].moveStartX,sel[i].moveStartY);
                    sel[i].trigger('move');
                }
            }
            this.unbind('dragCancel',selectedNodeDragCancelHandler);
            this.unbind('dragMove',selectedNodeMoveHandler);
        }
        var selectedNodeMoveHandler = function selectedNodeMoveHandler() {
            var i,sel = T.controller.getSelection();
            for (i=0;i<sel.length;i++) {
                if (sel[i]!=this) {
                    sel[i].setPosition(sel[i].moveStartX+this.x-this.moveStartX,sel[i].moveStartY+this.y-this.moveStartY);
                    sel[i].trigger('move');
                }
            }
        }                             
        var nodeStartDragHandler = function nodeStartDragHandler() {
            var i,sel = T.controller.getSelection();
            this.moveStartX = this.x;
            this.moveStartY = this.y;
            for (i=0;i<sel.length;i++) {
                sel[i].moveStartX = sel[i].x;
                sel[i].moveStartY = sel[i].y;
            }
            this.bind('dragMove',selectedNodeMoveHandler);
            this.bind('dragCancel', selectedNodeDragCancelHandler);
        }
        this.addNode = function (view) {
            if (T.nodes.get(view.id)) return;
            T.nodes.add(view);
            view.bind('update', T.queueRedraw);
            view.bind('outgoingSlotClick', outgoingSlotClickHandler);
            view.bind('incomingSlotClick', incomingSlotClickHandler);
            view.bind('dragStop', nodeStopDragHandler);
            //view.bind('selected', nodeStartDragHandler);
            view.bind('dragStart', nodeStartDragHandler);
            T.queueRedraw();
        }
        this.addNodeConnections = function (view) {
            var connsFrom = T.controller.dao.connections.where({fromNodeId:view.id});
            var connsTo = T.controller.dao.connections.where({toNodeId:view.id});
            var i,j;
            for (i in connsFrom) {
                connectionAddedHandler.call(T.controller.dao.connections, connsFrom[i]);
            }
            for (i in connsTo) {
                connectionAddedHandler.call(T.controller.dao.connections, connsTo[i]);
            }
            T.queueRedraw();
        }
        
        this.removeNode = function (view) {
            var connsFrom = getConns(view, undefined);
            var connsTo = getConns(undefined, view);
            var i;
            for (i in connsFrom) {
                this.removeConnection(connsFrom[i]);
            }
            for (i in connsTo) {
                this.removeConnection(connsTo[i]);
            }
            view.unbind('update', T.queueRedraw);
            view.unbind('dragStop', nodeStopDragHandler);
            this.nodes.remove(view);
            T.queueRedraw();
        }
        var nodeAddedHandler = function (node) {
            // надо проверить, можно ли показывать ноду.
            // она может быть на скрытом слое, может быть в закрытой группе.
            if (!node.id || !node.type) {
                node.bind('initComplete', function () {
                    nodeAddedHandler(this);
                });return;
            }
            var layer = T.controller.dao.layers.get(node.layerId);
            if (layer && !layer.shown) return;
            var group = T.controller.dao.groups.get(node.group);
            if (group && !group.opened) return;
            var view = Desktop_View_Factory.node(node, T.controller, T);
            T.addNode(view);
            T.addNodeConnections(view);
        }
        var nodeRemovedHandler = function (node) {
            var view = T.nodes.get(node.id);
            if (!view) {
                return false;
            }
            T.removeNode(view);
        }
        var groupAddedNodeHandler = function (node) {
            nodeRemovedHandler.call(T.controller.dao.nodes, node);
            nodeAddedHandler.call(T.controller.dao.nodes, node);
            groupRemovedHandler.call(T.controller.dao.groups, this);
            groupAddedHandler.call(T.controller.dao.groups, this);
        }
        var groupRemovedNodeHandler = function (node) {
            nodeRemovedHandler.call(T.controller.dao.nodes, node);
            nodeAddedHandler.call(T.controller.dao.nodes, node);
            groupRemovedHandler.call(T.controller.dao.groups, this);
            groupAddedHandler.call(T.controller.dao.groups, this);
        }
        var groupAddedGroupHandler = function (group) {
            groupRemovedHandler.call(T.controller.dao.groups, group);
            groupAddedHandler.call(T.controller.dao.groups, group);
            groupRemovedHandler.call(T.controller.dao.groups, this);
            groupAddedHandler.call(T.controller.dao.groups, this);
        }
        var groupRemovedGroupHandler = function (group) {
            groupRemovedHandler.call(T.controller.dao.groups, group);
            groupAddedHandler.call(T.controller.dao.groups, group);
            groupRemovedHandler.call(T.controller.dao.groups, this);
            groupAddedHandler.call(T.controller.dao.groups, this);
        }
        
        var groupAddedHandler = function(group) {
            var layer = T.controller.dao.layers.get(group.layerId);
            if (layer && !layer.shown) return;
            group.unbind('update:position', T.queueRedraw);
            group.bind('update:position', T.queueRedraw);
            group.unbind('update:opened', groupOpenedHandler)
            group.bind('update:opened', groupOpenedHandler)
            group.unbind('addNode', groupAddedNodeHandler)
            group.bind('addNode', groupAddedNodeHandler);
            group.unbind('removeNode', groupRemovedNodeHandler);
            group.bind('removeNode', groupRemovedNodeHandler);
            group.unbind('addGroup', groupAddedGroupHandler);
            group.bind('addGroup', groupAddedGroupHandler);
            group.unbind('removeGroup', groupRemovedGroupHandler);
            group.bind('removeGroup', groupRemovedGroupHandler);
            if (group.opened) return;
            if (group.group) {
                var grgroup = T.controller.dao.groups.get(group.group);
                if (grgroup && !grgroup.opened) return;
            }
            var view = Desktop_View_Factory.group(group, T.controller, T);
            view.bind('dragStop', nodeStopDragHandler);
            view.bind('dragStart', nodeStartDragHandler);
            T.groups.add(view);
            var connsFrom = getGroupFroms(group);
            var connsTo = getGroupTos(group);
            var i, len;
            len = connsFrom.length;
            for (i=0;i<len;i++) {
                var toNode = T.getTopVisibleCell(connsFrom[i].get('toNodeId'));
                if (!toNode) continue;
                var toSlotId = connsFrom[i].get('toSlotId');
                if (toNode instanceof Desktop_View_Group) toSlotId = 0;
                if (getConn(view, toNode, toNode.incomings[toSlotId])) continue;
                var connection = new Desktop_View_Connection(T, view, toNode, view.outgoings[0],toNode.incomings[toSlotId]);
                T.addConnection(connection);
            }
            len = connsTo.length;
            for (i=0;i<len;i++) {
                var fromNode = T.getTopVisibleCell(connsTo[i].get('fromNodeId'));
                if (!fromNode) continue;
                if (getConn(fromNode, view, view.incomings[0])) continue;
                var connection = new Desktop_View_Connection(T, fromNode, view, fromNode.outgoings[0], view.incomings[0]);
                T.addConnection(connection);
            }
            T.queueRedraw();
        }
        this.getTopVisibleCell = function(nodeId) {
            var node = T.nodes.get(nodeId);
            if (node) return node;
            node = T.controller.dao.nodes.get(nodeId);
            if (!node) return undefined;
            group = this.getTopVisibleGroup(node.group);
            if (group) return group;
            return undefined;
        }
        this.getTopVisibleGroup = function(groupId) {
            var group = T.groups.get(groupId);
            if (group) return group;
            var parent = T.controller.dao.groups.get(groupId);
            if (!parent) return false;
            return T.getTopVisibleGroup(parent.group);
        }
        var getGroupFroms = function (group) {
            var i,j,k,len = group.nodes.items.length;
            var connsFrom = [];
            for (i=0;i<len;i++) {
                var c = T.controller.dao.connections.where({fromNodeId:group.nodes.items[i].id});
                if (!c) continue;
                for (j in c) {
                    connsFrom.push(c[j]);
                }
            }
            len = group.groups.items.length;
            for (i=0;i<len;i++) {
                connsFrom=connsFrom.concat(getGroupFroms(group.groups.items[i]));
            }
            return connsFrom;
        }
        var getGroupTos = function (group) {
            var i,j,len = group.nodes.items.length;
            var connsTo = [];
            for (i=0;i<len;i++) {
                var c = T.controller.dao.connections.where({toNodeId:group.nodes.items[i].id});
                if (!c) continue
                for (j in c) {
                    connsTo.push(c[j]);
                }
            }
            len = group.groups.items.length;
            for (i=0;i<len;i++) {
                connsTo = connsTo.concat(getGroupTos(group.groups.items[i]));
            }
            return connsTo;
        }
        this.removeGroup = function (view) {
            if (!view) return;
            var i;
            var fromConns = getConns(view, undefined);
            var toConns = getConns(undefined, view);
            for (i=0;i<fromConns.length;i++) {
                this.removeConnection(fromConns[i]);
            }
            for (i=0;i<toConns.length;i++) {
                this.removeConnection(toConns[i]);
            }
            this.groups.remove(view);
            T.queueRedraw();
        }
        var groupRemovedHandler = function (group) {
            group.unbind('update', T.queueRedraw);
            group.unbind('update:opened', groupOpenedHandler)
            group.unbind('addNode', groupAddedNodeHandler)
            group.unbind('removeNode', groupRemovedNodeHandler);
            group.unbind('addGroup', groupAddedGroupHandler);
            group.unbind('removeGroup', groupRemovedGroupHandler);
            var view = T.groups.get(group.id);
            T.removeGroup(view);
        }
        var groupOpenedQueue = [];
        var groupOpenedHandler = function () {
            groupOpenedQueue.push(this);
            startGroupOpenedAnimation();
        }
        var groupOpenedAnimationStarted = false;
        var startGroupOpenedAnimation = function () {
            if (groupOpenedAnimationStarted) return;
            if (!groupOpenedQueue.length) return;
            groupOpenedAnimationStarted = true;
            var group = groupOpenedQueue[0];
            if (group) {
                groupOpenedAnimation.call(group, function () {
                    groupOpenedQueue.shift();
                    groupOpenedAnimationStarted = false;
                    startGroupOpenedAnimation();
                });
            }
        }
        var groupOpenedAnimation = function (callback) {
            var view = T.groups.get(this.id);
            var timeToAnimate = 250;
            var animateView = function(view, from, to, callback) {
                var toX = to.x;
                var toY = to.y;
                view.x = from.x;
                view.y = from.y;
                $({x:view.x,y:view.y}).animate({'x':toX,'y':toY}, {
                    duration:timeToAnimate,
                    step:function (nw,tw) {
                        view[tw.prop] = nw;
                        view.trigger('move');
                        T.queueRedraw();
                    },
                    complete:callback
                });
            }
            if (this.opened) {
                var i, len = this.nodes.items.length;
                var added = [];
                for (i=0;i<len;i++) {
                    var node = this.nodes.items[i];
                    var view = Desktop_View_Factory.node(node, T.controller, T);
                    T.addNode(view);
                    added.push(view);
                }
                for (i=0;i<added.length;i++) {
                    T.addNodeConnections(added[i]);
                    animateView(added[i], this, added[i]);
                }
                len = this.groups.items.length;
                for (i=0;i<len;i++) {
                    var group = this.groups.items[i];
                    groupAddedHandler.call(T.controller.dao.groups, group);
                    var view = T.groups.get(group.id);
                    if (view) {
                        animateView(view, this, view);
                    }
                }
                var view = T.groups.get(this.id);
                T.removeGroup(view);
                callback();
            } else {
                var i, len, self = this;
                
                var allSubNodes = [];
                var allSubGroups = [];
                var getAllSubs = function (group) {
                    var i, len;
                    len = group.nodes.items.length;
                    for (i=0;i<len;i++) {
                        allSubNodes.push(group.nodes.items[i]);
                    }
                    len = group.groups.items.length;
                    for (i=0;i<len;i++) {
                        var gr = group.groups.items[i];
                        if (!gr.opened) {
                            allSubGroups.push(gr);
                        } else {
                            getAllSubs(gr);
                        }
                    }
                }
                getAllSubs(this);
                var d = $.Deferred();
                var cnt = 0;
                for (i=0;i<allSubGroups.length;i++) {
                    var view = T.groups.get(allSubGroups[i].id);
                    if (!view) continue;
                    cnt++;
                    (function (view, self, group, d) {
                        animateView(view, view, self, function () {
                            T.removeGroup(view);
                            cnt--;
                            if (!cnt) {
                                d.resolve();
                            }
                        });
                    })(view, self, allSubGroups[i], d);
                }
                for (i=0;i<allSubNodes.length;i++) {
                    var view = T.nodes.get(allSubNodes[i].id);
                    if (!view) continue;
                    cnt++;
                    (function (view, self, node) {
                        animateView(view, view, self, function () {
                            T.removeNode(view);
                            cnt--;
                            if (!cnt) {
                                d.resolve();
                            }
                        });
                    })(view, self, allSubNodes[i]);
                }
                d.done(function () {
                    groupAddedHandler.call(T.controller.dao.groups, self);
                    callback();
                });
                if (!allSubGroups.length && !allSubNodes.length) {
                    d.resolve();
                }
            }
        }
        this.addConnection = function (view) {
            this.connections.add(view);
            addConn(view.fromCell, view.toCell, view.toSlot, view);
        }
        this.removeConnection = function (view) {
            removeConn(view.fromCell,view.toCell,view.toSlot);
            this.connections.remove(view);
        }
        var connectionAddedHandler = function (conn) {
            // надо проверить, есть ли ноды для связей и добавить их
            if (conn.get('fromNodeId') === 0) return; // проверка на баги
            
            var fromNode = T.getTopVisibleCell(conn.get('fromNodeId'));
            if (!fromNode) return;
            var toNode = T.getTopVisibleCell(conn.get('toNodeId'));
            if (!toNode) return;
            if (fromNode == toNode) return;
            var checkSlotInd = (toNode instanceof Desktop_View_FormulaNode) ? conn.get('toSlotId') : 0;
            if (!toNode.incomings[checkSlotInd]) {
                return;
            }
            if (getConn(fromNode,toNode,toNode.incomings[checkSlotInd])) return; // уже есть такая
            var connection = new Desktop_View_Connection(T, fromNode, toNode, fromNode.outgoings[0], toNode.incomings[checkSlotInd]);
            T.addConnection(connection);
        }
        var connectionRemovedHandler = function (conn) {
            if (!conn.get('fromNodeId')) return;
            var fromNode = T.getTopVisibleCell(conn.get('fromNodeId'));
            if (!fromNode) return;
            if (!conn.get('toNodeId')) return;
            var toNode = T.getTopVisibleCell(conn.get('toNodeId'));
            if (!toNode) return;
            var connView = getConn(fromNode,toNode,toNode.incomings[conn.get('toSlotId')]);
            if (!connView) return;
            T.removeConnection(connView);
        }
        var conns = [];
        var addConn = function (fromNode, toNode, toSlot, connView) {
            if (getConnIndex(fromNode, toNode, toSlot)==-1) {
                conns.push({fromNode:fromNode,toNode:toNode,toSlot:toSlot,view:connView});
            }
        }
        var removeConn = function (fromNode, toNode, toSlot) {
            var i = getConnIndex(fromNode, toNode, toSlot);
            if (i>=0) {
                conns.splice(i,1);
            }
        }
        var getConnIndex = function (fromNode, toNode, toSlot) {
            var i,len = conns.length;
            for (i=0;i<len;i++) {
                if (
                    conns[i].fromNode.id == fromNode.id &&
                    conns[i].toNode.id == toNode.id &&
                    conns[i].toSlot.ind == toSlot.ind
                ) {
                    return i;
                }
            }
            return -1;
        }
        var getConn = function (fromNode, toNode, toSlot) {
            var i = getConnIndex(fromNode, toNode, toSlot);
            if (i>=0) return conns[i].view;
            return false;
        }
        var getConns = function (fromNode, toNode) {
            var i,len = conns.length;
            var result = [];
            for (i=0;i<len;i++) {
                if (
                    (fromNode == undefined || conns[i].fromNode == fromNode) &&
                    (toNode == undefined || conns[i].toNode == toNode)
                ) {
                    result.push(conns[i].view);
                }
            }
            return result;
        }
        this.publishConns = function() {
            return conns;
        }
        var selectionChangedHandler = function selectionChangedHandler() {
            var sel = file.getSelection();
            var i=0, f;
            if (!sel.length) {
                for (i=0;i<T.nodes.items.length;i++) {
                    if (T.nodes.items[i]) {
                        T.nodes.items[i].setLowlighted(false);
                    }
                }
                for (i=0;i<T.groups.items.length;i++) {
                    if (T.groups.items[i]) {
                        T.groups.items[i].setLowlighted(false);
                    }
                }
                return;
            }
            for (i=0;i<T.nodes.items.length;i++) {
                if (T.nodes.items[i]) {
                    T.nodes.items[i].setLowlighted(true);
                }
            }
            for (i=0;i<T.groups.items.length;i++) {
                if (T.groups.items[i]) {
                    T.groups.items[i].setLowlighted(true);
                }
            }
            for (i=0;i<sel.length;i++) {
                if (sel[i]) {
                    sel[i].setLowlighted(false);
                }
            }
            for (i=0;i<T.connections.items.length;i++) {
                if ((T.connections.items[i].fromSlot.parent && T.connections.items[i].fromSlot.parent.isSelected()) ||
                (T.connections.items[i].toSlot.parent && T.connections.items[i].toSlot.parent.isSelected())) {
                    if (T.connections.items[i].fromSlot.parent) {
                        T.connections.items[i].fromSlot.parent.setLowlighted(false);
                    }
                    if (T.connections.items[i].toSlot.parent) {
                        T.connections.items[i].toSlot.parent.setLowlighted(false);
                    }
                }
            }
        }
        
        this.newConnection = undefined;
        
        this.nodes = new Collection();
        this.groups = new Collection();
        this.connections = new List();
        this.init = function init() {
            
            this.layersList = new Desktop_View_LayersList();
            this.layersList.init(file, file.dao);
            this.layersList.bind('layerMouseup', layerMouseupHandler);
            $('#fileLayersPanelWrap', this.element).append(this.layersList.getHTML());
            
            this.controls = new Desktop_View_Controls();
            this.controls.init(file);
            $('#layoutControlsPanel', this.element).append(this.controls.getHTML());
            
            this.fileinfo = new Desktop_View_FileInfo();
            this.fileinfo.init(file);
            $('#layoutTopPanel', this.element).append(this.fileinfo.getHTML());

            Desktop_View_File.backgroundColor = $("#canvasWrap").css('background-color');
            this.setOffset(file.dao.x,file.dao.y)
            
            this.latestComments = new Desktop_View_LatestComments();
            this.latestComments.init(file);
            $('#latestCommentsPanelWrap', this.element).append(this.latestComments.getHTML());
            
            this.descriptionsList = new Desktop_View_DescriptionsList();
            this.descriptionsList.init(file);
            $('#descriptionsListPanelWrap', this.element).append(this.descriptionsList.getHTML());
            
            $("#layoutRightPanel").tabs();
            
            var i, j, len;
            file.dao.nodes.bind('add', nodeAddedHandler);
            file.dao.nodes.bind('remove', nodeRemovedHandler);
            file.dao.groups.bind('add', groupAddedHandler);
            file.dao.groups.bind('remove', groupRemovedHandler);
            file.dao.layers.bind('add', layerAddedHandler)
            file.dao.layers.bind('remove', layerRemovedHandler)
            file.dao.connections.bind('add', connectionAddedHandler);
            file.dao.connections.bind('remove', connectionRemovedHandler);
            len = file.dao.layers.length;
            for (i=0;i<len;i++) {
                layerAddedHandler.call(file.dao.layers, file.dao.layers.at(i));
            }
            len = file.dao.groups.length;
            for (i=0;i<len;i++) {
                groupAddedHandler.call(file.dao.groups, file.dao.groups.at(i));
            }
            len = file.dao.nodes.length;
            for (i=0;i<len;i++) {
                nodeAddedHandler.call(file.dao.nodes, file.dao.nodes.at(i));
            }
            file.bind('change:selection', selectionChangedHandler);

            T.queueRedraw();

            
        }
        $("body").bind({
            'keyup': function (event) {
                // отслеживаем удаление. нужно порефакторить - общий какой-то объект, который ловит фокус
                switch(event.keyCode) {
                    case $.ui.keyCode.DELETE:
                        if (event.target!=document.body && event.target.className != 'copyPaste') break;
                        // в инпутах пропускаем, в блоке для копипасты hansdontable пускаем
                        if (!DialogsManager.getFocused()) { // где-то в диалоговом окне
                            osi.confirm('Удалить?',function() {
                                T.controller.deleteSelectionAction();
                            });
                        }
                        break;
                }
                return true;
            },
            'copy': function (e) {
                if (e.target!=document.body && e.target.className != 'copyPaste') return true;
                if (!DialogsManager.getFocused()) {
                    T.controller.copyAction();
                    return false;
                }
            },
            'paste': function (e) {
                if (e.target!=document.body && e.target.className != 'copyPaste') return true;
                if (!DialogsManager.getFocused()) {
                    T.controller.pasteAction();
                    return false;
                }
            }
        });
        this.animove = function(x,y) {
            $(this._offset).animate({x:x,y:y}, {
                duration:500,
                step:function () {
                    T.queueRedraw();
                },
                complete:function () {
                    T.move(x,y);
                }
            });
        }
        this.move = function (x,y) {
            T._offset.x = x;
            T._offset.y = y;
            T.controller.moveAction(x,y);
            T.queueRedraw();
        }
        
        Desktop_Dao_FormulaNode.calcListener.bind('start', function () {
            $("#fileTitle .value").text('calculation...');
        });
        Desktop_Dao_FormulaNode.calcListener.bind('stop', function () {
            $("#fileTitle .value").text('complete');
        });
        //setInterval(redraw,15);
    }
});