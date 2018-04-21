/**
* @class
* @property {Desktop_Dao_File} dao 
* @property {Desktop_View_File} view 
*/
var Desktop_Controller_File = Backbone.Model.extend({
    initialize:function () {
        var T = this;
        //this.dao = undefined;
        //this.view = undefined;
        var lastClickX=0,lastClickY = 0;
        $(document).click(function (e) {
            lastClickX = e.clientX;
            lastClickY = e.clientY;
        });
        
        
        this.fullRecalcAction = function () {
            var i,j;
            for (i=0;i<this.dao.nodes.items.length;i++) {
                if (this.dao.nodes.items[i] instanceof Desktop_Dao_FormulaNode) {
                    this.dao.nodes.items[i].recalc();
                };
            }
        }
        this.saveNodeAction = function(node, callback) {
            node.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_PROGRESS);
            saveNode(node, callback);
        }
        this.newNodeAction = function(data, callback) {
            if (!data['type']) data['type'] = Desktop_Dao_Factory.TYPE_DATA;
            var newNode = Desktop_Dao_Factory.newNode(data, T.dao);
            T.saveNodeAction(newNode, function () {
                T.dao.nodes.add(newNode);
                if (callback) callback(newNode);
            });
        }
        this.copyAction = function () {
            if (!this.dao.user_access.copy_nodes) return;
            if (!selectedNodes.length) return;
            var nodeIds = [],i,groupIds = [];
            for (var i in selectedNodes) {
                if (selectedNodes[i] instanceof Desktop_View_Group) {
                    groupIds.push(selectedNodes[i].id);
                } else if (selectedNodes[i] instanceof Desktop_View_AbstractNode) {
                    nodeIds.push(selectedNodes[i].id);
                }
            }
            if (!nodeIds.length && !groupIds.length) return;
            $.post('/constructor/file/'+T.dao.id+'/copy', {json: 1, node_ids: nodeIds, group_ids:groupIds}, function(data){
                T.clipboard = {nodes:nodeIds, groups:groupIds};
                T.trigger('change:clipboard');
                T.trigger('change');
            });
        }
        this.pasteAction = function () {
            if (!this.dao.user_access.edit) return;
            var doPaste = function (copyComments) {
                var params = {json:1, copyComments:copyComments};
                $.post('/constructor/file/'+T.dao.id+'/paste', params, function(res) {
                    T.clearSelectionAction();
                    if (res.status == 'ok') {
                        var i,v,newItems = T.dao.addItems(res.data);
                        T.clearSelectionAction();
                        for (i=0;i<newItems.length;i++) {
                            if (newItems[i] instanceof Desktop_Dao_AbstractNode) {
                                v = T.view.nodes.get(newItems[i].id);
                                if (v) {
                                    v.select();
                                    T.addToSelectionAction(v);
                                }
                            } else if (newItems[i] instanceof Desktop_Dao_Group) {
                                v = T.view.groups.get(newItems[i].id);
                                if (v) {
                                    v.select();
                                    T.addToSelectionAction(v);
                                }
                            }
                        }
                    }
                });
            }
            osi.confirmYNC('Скопировать так же и коментарии?',
                function () {
                    doPaste(1);
                },
                function () {
                    doPaste(0);
                },
                function () {
                    
                },
                'Копирование');
            
        }
        this.addConnectionAction = function (fromCell, toSlot) {
            var toNodeView = toSlot.node;
            var toSlotId = toNodeView.incomings.indexOf(toSlot);
            if (toSlotId==-1) return;
            var toNode = T.dao.nodes.get(toNodeView.id);
            var oldConnections = T.dao.connections.where({toNodeId:toNode.id});
            if (oldConnections) {
                var oldConn = _.find(oldConnections,function(conn) { return conn.attributes.toSlotId == toSlotId;});
                if (oldConn) {
                    if (oldConn.get('fromNodeId')==fromCell.id) return;
                    T.dao.removeConnection(oldConn);
                }
            }
            var connection = new Desktop_Dao_Connection({
                fromNodeId:fromCell.id,
                toNodeId:toNodeView.id,
                toSlotId:toSlotId
            });
            toNode.setConnection(toSlotId,fromCell.id);
            T.dao.addConnection(connection);
        }
        this.removeConnectionAction = function (toSlot) {
            var toNodeView = toSlot.node;
            var toSlotId = toNodeView.incomings.indexOf(toSlot);
            var toNode = T.dao.nodes.get(toNodeView.id);
            var oldConnections = T.dao.connections.where({toNodeId:toNode.id});
            if (oldConnections) {
                var oldConn = _.find(oldConnections,function(conn) { return conn.attributes.toSlotId == toSlotId;});
                if (oldConn) { 
                    T.dao.removeConnection(oldConn);
                }
            }
        }
        
        this.shareUsersAction = function shareUsersAction(emailList, access) {
            if (!this.dao.user_access.admin) return;
            var T = this;
            $.post('/constructor/file/'+this.dao.id+'/shareUsers', {
                'json':1,'ajax':1,
                'emails':emailList,
                'access':access
            }, function (resp) {
                if (resp['status']!='ok') {
                    osi.alertReload();
                } else {
                    T.dao.personal_access.reset(resp.data);
                }
            });
        }
        
        this.savePublicAccessAction = function savePublicAccessAction(publicAccess) {
            if (!this.dao.user_access.admin) return;
            var T = this;
            $.post('/constructor/file/'+this.dao.id+'/savePublicAccess', {
                'json':1,'ajax':1,
                'access':publicAccess,
            }, function (resp) {
                if (resp['status']!='ok') {
                    osi.alertReload();
                } else {
                    T.dao.published_access = resp.data;
                }
            });
        }
        
        this.savePersonalAccessAction = function savePersonalAccessAction(userId,personalAccess) {
            if (!this.dao.user_access.admin) return;
            var T = this;
            $.post('/constructor/file/'+this.dao.id+'/savePersonalAccess', {
                'json':1,'ajax':1,
                'user':userId,
                'access':personalAccess,
            }, function (resp) {
                if (resp['status']!='ok') {
                    osi.alertReload();
                } else {
                    var acc = T.dao.personal_access.where({user_id:userId})[0];
                    acc.set(resp.data);
                }
            });
        }

        this.removePersonalAccessAction = function removePersonalAccessAction(userId) {
            if (!this.dao.user_access.admin) return;
            var T = this;
            $.post('/constructor/file/'+this.dao.id+'/removePersonalAccess', {
                'json':1,'ajax':1,
                'user':userId
            }, function (resp) {
                if (resp['status']!='ok') {
                    osi.alertReload();
                } else {
                    var acc = T.dao.personal_access.where({user_id:userId})[0];
                    T.dao.personal_access.remove(acc);
                }
            });
        }
        
        this.addLayerAction = function (title, callback) {
            if (!this.dao.user_access.edit) return;
            $.post('/constructor/file/'+this.dao.id+'/saveLayer', {
                'json':1,'ajax':1,
                'data[id]':0,
                'data[title]':title,
                'data[shown]':1
            }, function (resp) {
                if (resp['status']!='ok') {
                    if (typeof(callback)!="undefined") {
                        callback.call(T,0);
                    }
                    osi.alertReload();
                } else {
                    var layer = new Desktop_Dao_Layer();
                    layer.init(resp.data);
                    T.dao.layers.add(layer);
                    T.saveLayersOrderAction();
                    if (typeof(callback)!="undefined") {
                        callback.call(T,1);
                    }
                }
            },'json');
        }
        this.saveLayersOrderAction = function () {
            if (!this.dao.user_access.edit) return;
            var i, data = [], order;
            var ids = T.view.layersList.getLayersOrder();
            order = -ids.indexOf('0');
            for (i=0;i<ids.length;i++) {
                data.push({
                    'id':ids[i],
                    'order':order++
                });
            }
            var params = {
                'json':1,'ajax':1,'data':data
            }
            $.post('/constructor/file/'+this.dao.id+'/saveLayersOrder', params, function (resp) {
                if (resp['status']!='ok') {
                    if (typeof(callback)!="undefined") {
                        callback.call(T,0);
                    }
                    osi.alertReload();
                } else {
                    
                }
            },'json');
        }
        this.removeLayerAction = function (layer, callback) {
            if (!this.dao.user_access.edit) return;
            $.post('/constructor/file/'+T.dao.id+'/removeLayer', {
                'json':1,'ajax':1,
                'layer_id':layer.id,
            }, function (resp) {
                if (resp['status']!='ok') {
                    if (typeof(callback)!="undefined") {
                        callback.call(T,0);
                    }
                    osi.alertReload();
                } else {
                    T.saveLayersOrderAction();
                    if (typeof(callback)!="undefined") {
                        callback.call(T,1);
                    }
                    T.dao.layers.remove(layer);
                }
            },'json');
        }
        this.saveLayerAction = function (layer) {
            if (!this.dao.user_access.edit) return;
            $.post('/constructor/file/'+this.dao.id+'/saveLayer', {
                'json':1,'ajax':1,
                'data[id]':layer.id,
                'data[title]':layer.title,
                'data[shown]':layer.shown?1:0
            }, function (resp) {
                if (resp['status']!='ok') {
                    osi.alertReload();
                }
            },'json');
        }
        this.toggleLayerShownAction = function (layerDao) {
            layerDao.setShown(!layerDao.shown);
        }
        this.toggleAllLayersShownAction = function () {
            var i, len = this.dao.layers.length, hide = true;
            for (i=0;i<len;i++){
                if (!this.dao.layers.at(i).shown) {
                    this.dao.layers.at(i).setShown(true);
                    hide = false;
                }
            }
            if (hide) {
                for (i=0;i<len;i++){
                    this.dao.layers.at(i).setShown(false);
                }
            }
        }
        this.scrollToLayerAction = function (layer) {
            var i, len = layer.nodes.items.length;
            if (!len) return;
            var x = 0, y = 0;
            for (i=0;i<len;i++) {
                x += layer.nodes.items[i].x;
                y += layer.nodes.items[i].y;
            }
            x = x/len;
            y = y/len;
            T.view.animove(-x,-y);
        }
        this.scrollToGroupIdAction = function (groupId) {
            var group = this.dao.groups.get(groupId);
            if (!group) return;
            this.scrollToNodeAction(group);
        }
        this.scrollToNodeIdAction = function (nodeId) {
            var node = this.dao.nodes.get(nodeId);
            if (!node) return;
            this.scrollToNodeAction(node);
        }
        this.scrollToNodeAction = function (node) {
            var x = 0, y = 0;
            x = node.x;
            y = node.y;
            T.view.animove(-x,-y);
        }
        this.scrollToSelectionAction = function () {
            var sel = T.getSelection();
            if (!sel.length) return false;
            var x = 0, y = 0;
            for (var i in sel) {
                x+=sel[i].x;
                y+=sel[i].y;
            }
            x = x/sel.length;
            y = y/sel.length;
            T.view.animove(-x,-y);
        }
        this.rotateSelectionAction = function() {
            var sel = T.getSelection();
            if (!sel.length) return false;
            _.each(sel,function (el) {
                el.data.incRotation();
            });
        }
        this.moveAction = function (x,y) {
            this.dao.x = x;
            this.dao.y = y;
            this.queueSavePos();
        }
        this.zoomAction = function (value, zoomToX, zoomToY) {
            if (value > 4 || value < -10) return false;
            if (!zoomToX) zoomToX = 0;
            if (!zoomToY) zoomToY = 0;
            this.view.zoom(value,zoomToX,zoomToY);
            this.dao.zoom = value;
            this.queueSavePos();
        }
        this.showHiddenNodeAction = function (nodeDao) {
            var layer = this.dao.layers.get(nodeDao.layerId);
            if (layer && !layer.shown) {
                this.toggleLayerShownAction(layer);
            }
            var group = this.view.getTopVisibleCell(nodeDao.id);
            if (group instanceof Desktop_View_Group) {
                this.openGroupAction(group.id);
                this.showHiddenNodeAction(nodeDao);
            }
        }
        this.showSelectionDetailsAction = function () {
            var i, j;
            var nodes = [];
            for (i=0;i<selectedNodes.length;i++) {
                if (selectedNodes[i] instanceof Desktop_View_Group) {
                    var gr = T.dao.groups.get(selectedNodes[i].data.id);
                    if (gr) {
                        //добавляем к сравнению все ноды первого уровня в группе
                        for (j in gr.nodes.items) {
                            nodes.push(gr.nodes.items[j]);
                        }
                    }
                } else if (selectedNodes[i] instanceof Desktop_View_AbstractNode) {
                    nodes.push(selectedNodes[i].data);
                }
            }
            if (nodes.length) {
                var nodeDetailsView = new Desktop_View_Dialog_Nodes({
                    title:'Редактирование',
                    x:Math.min(T.view.canvasWidth-100,lastClickX),
                    y:Math.min(T.view.canvasHeight-100,lastClickY)
                }, T);
                nodeDetailsView.model.addNodes(nodes);
                if (nodes.length == 1) {
                    nodeDetailsView.table.selectNode(nodes[0]);
                }
                nodeDetailsView.focus();
            }
        }
        this.groupSelectionAction = function () {
            if (!selectedNodes.length) return;
            var i,nodes = [];
            var newGroup = new Desktop_Dao_Group(0, T.dao);
            newGroup.init({name:'Новая группа'});
            newGroup.trigger('initComplete');
            newGroup.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_PROGRESS);
            saveGroup(newGroup, function () {
                var x = 0, y = 0;
                for (i=0;i<selectedNodes.length;i++) {
                    x+=selectedNodes[i].x;
                    y+=selectedNodes[i].y;
                }
                x = parseInt(x/selectedNodes.length);
                y = parseInt(y/selectedNodes.length);
                newGroup.setPosition(x,y);
                
                T.dao.groups.add(newGroup);
                
                for (i=0;i<selectedNodes.length;i++) {
                    if (selectedNodes[i] instanceof Desktop_View_Group) {
                        newGroup.groups.add(selectedNodes[i].data);
                    } else if (selectedNodes[i] instanceof Desktop_View_AbstractNode) {
                        newGroup.nodes.add(selectedNodes[i].data);
                    }
                }
                T.clearSelectionAction();
            });
        }
        this.ungroupSelectionAction = function () {
            if (!selectedNodes.length) return;
            for (var i in selectedNodes) {
                var dao = selectedNodes[i].data;
                if (dao.group) {
                    var gr = T.dao.groups.get(dao.group);
                    if (dao instanceof Desktop_Dao_Group) {
                        gr.groups.remove(dao);
                    } else if (dao instanceof Desktop_Dao_AbstractNode) {
                        gr.nodes.remove(dao);
                    }
                }
            }
        }
        this.addGroupToGroupAction = function (toGroupId, groupId) {
            var toGroup = T.dao.groups.get(toGroupId);
            if (!toGroup) return false;
            var group = T.dao.groups.get(groupId);
            if (!group) return false;
            return toGroup.groups.add(group);
        }
        this.addNodeToGroupAction = function (toGroupId, nodeId) {
            var toGroup = T.dao.groups.get(toGroupId);
            if (!toGroup) return false;
            var node = T.dao.nodes.get(nodeId);
            if (!node) return false;
            return toGroup.nodes.add(node);
        }    
        this.closeGroupAction = function(groupId) {
            var group = T.dao.groups.get(groupId);
            if (group) {
                group.setOpened(false);
            }
        }
        this.openGroupAction = function(groupId) {
            var group = T.dao.groups.get(groupId);
            if (group) {
                group.setOpened(true);
            }
        }
        this.setNodeNameAction = function setNodeNameAction(node, name) {
            node.setName(name);
        }
        this.setDataAction = function setDataAction(dataNode, key, value) {
            dataNode.setData(key,value);
            dataNode.trigger('update:data');
            dataNode.trigger('update');
        }
        this.setFormulaAction = function setFormulaAction(formulaNode, newFormula) {
            var i;
            var connections = T.dao.connections.where({toNodeId:formulaNode.id});
            var vars = formulaNode.getVars();
            var oldConnections = formulaNode.connections.slice();
            var view = T.view.nodes.get(formulaNode.id);
            if (view) {
                for (i=0;i<view.incomings.length;i++) {
                    T.removeConnectionAction(view.incomings[i]);
                }
            }
            formulaNode.setFormula(newFormula);
            var newVars = formulaNode.getVars();
            var fromCell, ind;
            for (i=0;i<newVars.length;i++) {
                ind = -1;
                for (j=0;j<vars.length;j++) {
                    if (vars[j] == newVars[i]) {
                        ind = j;
                        break;
                    }
                }
                if (ind==-1) continue;
                if (!oldConnections[ind]) continue;
                fromCell = T.view.nodes.get(''+oldConnections[ind]);
                if (!fromCell) continue;
                if (!view.incomings[i]) continue;
                T.addConnectionAction(fromCell,view.incomings[i]);
            }
        }

        
        
        function nodeCreatedHandler(node) {
            node.bind('update', nodeUpdatedHandler);
        }
        function nodeRemovedHandler(node) {
            node.unbind('update', nodeUpdatedHandler);
        }
        function groupCreatedHandler(node) {
            node.bind('update', groupUpdatedHandler);
        }
        function groupRemovedHandler(node) {
            node.unbind('update', groupUpdatedHandler);
        }
        function nodeUpdatedHandler() {
            if (T.initState) return;
            if (this.removing) return;
            this.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_PROGRESS);
            queueSaveNode(this);
        }
        function groupUpdatedHandler() {
            if (T.initState) return;
            if (this.removing) return;
            this.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_PROGRESS);
            queueSaveGroup(this);
        }
        function layerAddedHandler(layer) {
            layer.bind('update:nodes', layerUpdatedNodesHandler);
            layer.bind('update', layerUpdatedHandler);
        }
        function layerRemovedHandler(layer) {
            layer.unbind('update:nodes', layerUpdatedNodesHandler);
            layer.unbind('update', layerUpdatedHandler);
        }
        function layerUpdatedNodesHandler() {
            if (T.initState) return;
            saveLayersNodes.push(this.id);
            T.queueSavePos();
        }
        function layerUpdatedHandler() {
            if (T.initState) return;
            if (!this.id) return; // базовый слой не нужно сохранять
            T.saveLayerAction(this,this.title);
        }
        
        var T = this;
        this.initState = false;
        this.initMacroparams = function (macro) {
            Desktop_Model_Expression.macroparams = macro;
        }
        this.parseFile = function (fileInfo,userFileSettings) {
            this.dao = new Desktop_Dao_File();
            T.initState = true;
            T.dao.layers.bind('add', layerAddedHandler);
            T.dao.layers.bind('remove', layerRemovedHandler);
            T.dao.nodes.bind('add', nodeCreatedHandler);
            T.dao.nodes.bind('remove', nodeRemovedHandler);
            T.dao.groups.bind('add', groupCreatedHandler);
            T.dao.groups.bind('remove', groupRemovedHandler);
            T.dao.bind('init_complete', function () {
                T.view = new Desktop_View_File(T);
                T.view.init();
                T.view.zoom(T.dao.zoom);
                T.initState = false;
            });
            this.clipboard = fileInfo.clipboard;
            this.dao.init(fileInfo,userFileSettings);
            this.dao.keysFilter.bind('change', function () { T.queueSavePos(); });
        }
        
        var saveNodesQueue = [];
        var saveGroupsQueue = [];
        var saveNodesPos = [];
        var saveGroupsPos = [];
        var saveLayersNodes = [];
        var saveLayers = [];
        this.save = function () {
            //if (!this.dao.user_access.edit) return false;
            var params = {'json':1};
            if (this.dao.user_access.edit) {
                params.nodes = {};
                params.groups = {};
                params.layers = {};
                var i;
                var node, group;
                for (i in saveNodesPos) {
                    node = this.dao.nodes.get(saveNodesPos[i]);
                    if (!node) continue;
                    params.nodes[node.id] = {
                        x:node.x,
                        y:node.y
                    };
                }
                for (i in saveGroupsPos) {
                    node = this.dao.groups.get(saveGroupsPos[i]);
                    if (!node) continue;
                    params.groups[node.id] = {
                        x:node.x,
                        y:node.y,
                        opened:node.opened
                    };
                }
                for (i in saveLayersNodes) {
                    layer = this.dao.layers.get([saveLayersNodes[i]]);
                    if (!layer) continue;
                    params.layers[layer.id] = {id:layer.id, node_ids:layer.node_ids};
                }
            };
            params.x = T.dao.x;
            params.y = T.dao.y;
            params.zoom = T.dao.zoom;
            params.keysFilter = _.clone(T.dao.keysFilter.attributes);
            /*params.layers = [];
            //params.layers = desktop.file.layers;
            for (i in desktop.file.layers) {
                if (desktop.file.layers[i].hasChanges) {
                    desktop.file.layers[i].hasChanges = false;
                    params.layers.push(desktop.file.layers[i]);
                }
            }*/
            $.post('/constructor/file/'+T.dao.id+'/save_pos',params,function (res) {
                if (res['status'] == 'ok') {
                    saveNodesPos = [];
                    saveGroupsPos = [];
                    saveLayersNodes = [];
                    //desktop.initFile(res['data']);
                } else {
                    osi.alertReload();
                }
            },'json');
        }
        var queueSaveNode = function (node) {
            if (saveNodesQueue.indexOf(node)!=-1) return;
            saveNodesQueue.push(node);
            debounceSaveNodes();
        }
        var debounceSaveNodes = function() {
            clearTimeout(saveNodesTimeout);
            saveNodesTimeout = setTimeout(saveNodes, 2000);
        }
        var queueSaveGroup = function (group) {
            if (saveGroupsQueue.indexOf(group)!=-1) return;
            saveGroupsQueue.push(group);
            debounceSaveGroups();
        }
        var debounceSaveGroups = function() {
            clearTimeout(saveGroupsTimeout);
            saveGroupsTimeout = setTimeout(saveGroups, 2000);
        }
        var saveNodesTimeout = 0;
        var saveGroupsTimeout = 0;
        var saveNodes = function () {
            if (!T.dao.user_access.edit) return;
            if (!saveNodesQueue.length) return;
            var params = {json:1};
            params.nodes = {};
            var node,nodesSaved = [];
            for (var i=0;i<35;i++) {// сохраняем не более 35 нод
                node = saveNodesQueue.shift();
                if (!node) break;
                params.nodes[node.id] = node.getSaveData();
                nodesSaved.push(node);
            }
            //var nodesSaved = saveNodesQueue.slice();
            //saveNodesQueue = [];
            $.post('/constructor/file/'+T.dao.id+'/save_nodes',params,function (res) {
                if (res['status']=='ok') {
                    if (saveNodesQueue.length) {
                        debounceSaveNodes();
                    }
                    for (var i in res['data']) {
                        if (res['data'][i]) {
                            var node = T.dao.nodes.get(parseInt(i));
                            node.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_COMPLETE);
                        } else {
                            var node = T.dao.nodes.get(parseInt(i));
                            node.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_ERROR);
                        }
                    }
                } else {
                    for (var i in nodesSaved) {
                        nodesSaved[i].setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_ERROR);
                    }
                }
            },'json');
        }
        var saveNode = function (node,callback) {
            if (!T.dao.user_access.edit) return;
            var params = {json:1};
            params.data = node.getSaveData();
            $.post('/constructor/file/'+T.dao.id+'/save_node',params,function (res) {
                if (res['status']=='ok') {
                    if (!node.id) {
                        node.id = res.data.id;
                    }
                    node.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_COMPLETE);
                    if (typeof (callback)!="undefined") callback();
                    //node.init();
                    //node.trigger('update:info');
                    //node.trigger('update:data');
                    //node.trigger('update:formula');
                    //node.trigger('update');
                    /*if (node.data.id == 0) {
                        self.data.id = res.data.id;
                        self.id = self.data.id;
                    }                           node
                    if (res.data['connections']) {
                        self.data.connections = res.data.connections;
                    }
                    self.update();
                    self.updateConnections();
                    if (self._selected) {
                        self._selected = false;
                        self.select();
                    }
                    desktop.updateConnections();*/
                } else {
                    node.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_ERROR);
                    //self.trigger('save_error');
                }
            },'json');
        }
        this.saveGroupAction = function (group, name, description, callback) {
            group.setName(name);
            group.set('full_desc', description);
            callback();
            //saveGroup(group, callback);
        }
        this.deleteGroup = function (group) {
            group.removing = true;
            group.setOpened(true);
            group.destroy();
            T.dao.groups.remove(group);        
        }
        this.deleteNode = function (node) {
            node.removing = true;
            node.destroy();
            T.dao.nodes.remove(node);
        }
        this.removeGroupAction = function (group, callback) {
            if (!this.dao.user_access.edit) return;
            $.post('/constructor/file/'+T.dao.id+'/delete_group', {
                'json':1,'ajax':1,
                'group':group.id,
            }, function (resp) {
                if (resp['status']!='ok') {
                    if (typeof(callback)!="undefined") {
                        callback.call(T,0);
                    }
                    osi.alertReload();
                } else {
                    T.deleteGroup(group);
                    if (typeof(callback)!="undefined") {
                        callback.call(T,1);
                    }
                }
            },'json');
        }
        var saveGroups = function () {
            if (!T.dao.user_access.edit) return;
            var params = {json:1};
            params.groups = {};
            for (var i in saveGroupsQueue) {
                params.groups[saveGroupsQueue[i].id] = saveGroupsQueue[i].getSaveData();
            }
            var groupsSaved = saveGroupsQueue.slice();
            saveGroupsQueue = [];
            $.post('/constructor/file/'+T.dao.id+'/save_groups',params,function (res) {
                if (res['status']=='ok') {
                    for (var i in res['data']) {
                        if (res['data'][i]) {
                            var group = T.dao.groups.get(parseInt(i));
                            group.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_COMPLETE);
                        } else {
                            group.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_ERROR);
                        }
                    }
                } else {
                    for (var i in groupsSaved) {
                        groupsSaved[i].setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_ERROR);
                    }
                }
            },'json');
        }
        var saveGroup = function (group, callback) {
            if (!T.dao.user_access.edit) return;
            var params = {json:1};
            params.data = group.getSaveData();
            $.post('/constructor/file/'+T.dao.id+'/save_group',params,function (res) {
                if (res['status']=='ok') {
                    if (!group.id) {
                        group.id = res.data.id;
                    }
                    group.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_COMPLETE);
                    if (typeof (callback)!="undefined") callback();
                } else {
                    group.setSaveStatus(Desktop_Dao_Abstract.STATUS_SAVE_ERROR);
                    //self.trigger('save_error');
                }
            },'json');
        }    
        this.cancelSavePos = function () {
            clearTimeout(savePosTimeout);
        }
        var savePosTimeout = 0;
        this.queueSavePos = function () {
            this.cancelSavePos();
            savePosTimeout = setTimeout(function () {
                T.save();
            },500);
        }
        var queueSaveNodePos = function (nodeDao) {
            if (nodeDao instanceof Desktop_Dao_AbstractNode) {
                saveNodesPos.push(nodeDao.id);
            } else {
                saveGroupsPos.push(nodeDao.id);
            }
        }
        this.moveNode = function (nodeDao, nodeView, x, y) {
            nodeDao.x = x;
            nodeDao.y = y;
            nodeView.x = x;
            nodeView.y = y;
            queueSaveNodePos(nodeDao);
            this.queueSavePos();
        }
        var selectedNodes = [];
        this.getSelection = function () {
            return selectedNodes;
        }
        this.showGroupAction = function (groupId) {
            var groupView = this.view.groups.get(groupId);
            if (groupView) return groupView;
            var group = this.dao.groups.get(groupId);
            if (!group) return undefined;
            group.setOpened(false);
            openParent(group);
        }
        var openParent = function (group) {
            var group = T.dao.groups.get(group.group);
            if (group) {
                openParent(group);
                group.setOpened(true);
            }
        }
        this.showNodeAction = function (nodeId) {
            var nodeView = this.view.nodes.get(nodeId);
            if (nodeView) return nodeView;
            var node = this.dao.nodes.get(nodeId);
            if (!node) return undefined;
            var layer = this.dao.layers.get(node.layerId);
            if (layer && !layer.shown) {
                layer.setShown(true);
            }
            openParent(node);
        }
        this.clearSelectionAction = function () {
            var i=0;
            for (i=0;i<selectedNodes.length;i++) {
                selectedNodes[i].deselect();
            }
            selectedNodes = [];
            T.trigger('change:selection');
            T.trigger('change');
        }
        this.addToSelectionAction = function (node) {
            if ($.inArray(node, selectedNodes) == -1) {
                if (!node.isSelected()) 
                    node.select();
                selectedNodes.push(node);
                console.log('Add to selection:', node);
                var txt = '';
                for (var i in selectedNodes) {
                    txt += selectedNodes[i].id+', ';
                }
                debug.status(txt);
                T.trigger('change:selection');
                T.trigger('change');
            }
        }
        this.removeFromSelectionAction = function (node) {
            var i = $.inArray(node, selectedNodes);
            if (i!=-1) {
                selectedNodes.splice(i,1);
                T.trigger('change:selection');
                T.trigger('change');
            }
        }    
        this.deleteSelectionAction = function () {
            if (!this.dao.user_access.edit) return;
            if (!selectedNodes) return;
            var nodeIds = [];
            var groupIds = [];
            var removeCells = [];
            for (var i in selectedNodes) {
                var view = selectedNodes[i];
                if (view instanceof Desktop_View_DataNode || view instanceof Desktop_View_FormulaNode) {
                    nodeIds.push(view.id);
                } else if (view instanceof Desktop_View_Group) {
                    groupIds.push(view.id);
                }
            }
            var params = {json:1,nodes:nodeIds,groups:groupIds};
            T.clearSelectionAction();
            $.post('/constructor/file/'+T.dao.id+'/delete_multiple',params,function (res) {
                if (res['status']=='ok') {
                    var node, i;
                    for (i=nodeIds.length-1;i>=0;i--){
                        node = T.dao.nodes.get(nodeIds[i]);
                        if (!node) continue;
                        T.deleteNode(node);
                        nodeIds[i] = undefined;
                    }
                    for (i=groupIds.length-1;i>=0;i--){
                        node = T.dao.groups.get(groupIds[i]);
                        if (!node) continue;
                        T.deleteGroup(node);
                        groupIds[i] = undefined;
                    }
                } else {
                    osi.alertReload();
                }
            },'json');
        }

        this.showNodeDetailsAction = function (nodeId) {
            var node = T.dao.nodes.get(nodeId);
            if (node) {
                //var nodeDetailsController = 
                var nodeDetailsView = new Desktop_View_Dialog_Nodes({
                    title:'Редактирование',
                    x:Math.min(T.view.canvasWidth-100,lastClickX),
                    y:Math.min(T.view.canvasHeight-100,lastClickY)
                }, T);
                nodeDetailsView.model.addNodes([node]);
                nodeDetailsView.table.selectNode(node);
                nodeDetailsView.focus();
                //var nodeDetailsController = new Desktop_Controller_Dialog_Node(nodeDetailsView);
            }
        }
        this.showGroupDetailsAction = function (groupId) {
            var group = T.dao.groups.get(groupId);
            if (group) {
                /*var btns = {};
                if (T.dao.user_access.edit) {
                    btns = {
                        'Сохранить':function () {
                            var name = $("#group_name", this).val();
                            if (!name) name = 'Новая группа';
                            var description = $("#group_description", this).val();
                            if (!description) description = '';
                            var dialog = $(this);
                            T.saveGroupAction(group, name, description, function (status) {
                                dialog.dialog('close');
                            });
                        },
                        'Закрыть':function () {
                            $(this).dialog('close');
                        },
                        'Удалить':function () {
                            var dialog = $(this);
                            T.removeGroupAction(group, function (status) {
                                dialog.dialog('close');
                            });
                        }
                    };
                };
                osi.dialog($("#groupSettingsDialog"), {
                    title:'Свойства',
                    open:function () {
                        $("#group_name", this).val(group.name);
                        $("#group_description", this).val(group.description);
                        if (!T.dao.user_access.edit) {
                            $("#group_name", this).attr('disabled','disabled');
                            $("#group_description", this).attr('disabled','disabled');
                        }
                    },
                    buttons:btns,
                    width:550
                });*/
                var groupDetailsView = new Desktop_View_Dialog_Group({
                    title:'Информация о группе',
                    x:lastClickX,
                    y:lastClickY,
                    group:group
                }, T);
            }
        }
        this.initTags = function(tags) {
            this.tags = tags;
            this.mtags = {};
            for (var nsId in this.tags) {
                this.mtags[nsId] = parseChildren(this.tags[nsId]);
            }
            function parseChildren(list) {
                var res = {};
                for(var i in list) {
                    if ( list[i].children ) {
                        res[list[i].name] = parseChildren(list[i].children);
                    } else {
                        res[list[i].name] = 1;
                    }
                }
                return res;
            }
        }
    }
});
//extend(Desktop_Controller_File, Controller);