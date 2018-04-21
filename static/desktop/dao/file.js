/**
* @class
* @param data
*/
var Desktop_Dao_File = Backbone.Model.extend({
    constructor: function Desktop_Dao_File() {
        Backbone.Model.apply(this, arguments);
    },
    initialize:function () {
        Backbone.Model.prototype.initialize.apply(this, arguments);
        var T = this;
        this.connections = new Desktop_Dao_Connections(); // там нет id
        this.nodes = new Desktop_Dao_Nodes();
        this.groups = new Desktop_Dao_Groups();
        this.relations = new Desktop_Dao_Relations();
        this.layers = new Desktop_Dao_Layers();
        this.calculator = new Desktop_Service_Calculator({}, {fileDao:this});
        
        this.addItems = function (data) {
            var i, newItems = [];
            if (data.nodes) {
                for(i in data.nodes) {
                    var nn = Desktop_Dao_Factory.node(data.nodes[i].type, data.nodes[i].id, T)
                    this.nodes.add(nn);
                    newItems.push(nn);
                }
                for(i in data.nodes) {
                    var nn = this.nodes.get(data.nodes[i].id);
                    nn.init(data.nodes[i]);
                }
                for(i in data.nodes) {
                    var nn = this.nodes.get(data.nodes[i].id);
                    nn.trigger('initComplete');
                }
            }
            if (data.groups) {
                for(i in data.groups) {
                    var nn = new Desktop_Dao_Group(data.groups[i].id, T);
                    this.groups.add(nn);
                    newItems.push(nn);
                }
                for(i in data.groups) {
                    var nn = this.groups.get(data.groups[i].id);
                    nn.init(data.groups[i]);
                }
                for(i in data.groups) {
                    var nn = this.groups.get(data.groups[i].id);
                    nn.trigger('initComplete');
                }
            }
            if (data.nodes) {
                var node, k;
                for (i=0;i<data.nodes.length;i++) {
                    node = this.nodes.get(data.nodes[i].id);
                    for (k in node.connections) {
                        this.addConnection(new Desktop_Dao_Connection({
                            fromNodeId:node.connections[k],
                            toNodeId:node.id,
                            toSlotId:k
                        }));
                    }
                }
            }
            return newItems;
        }
        this.init = function (data, userSettings) {
            
            this.id = parseInt(data['id']);
            this.namespace = parseInt(data['namespace']);
            this.title = data['title'];
            this.description = data['description'];
            this.version = parseInt(data['version']);
            this.readonly = parseInt(data['readonly']);
            this.user_access = data['user_access'];
            //debug.log(data);
            this.zoom = parseInt(userSettings['zoom'] ? userSettings['zoom'] : 0);
            this.x = parseInt(userSettings['x'] ? userSettings['x'] : 0);
            this.y = parseInt(userSettings['y'] ? userSettings['y'] : 0);
            this.keysFilter = new Backbone.Model({
                enabled:0,
                keysFilter:'',
                keysMinBound:undefined,
                keysMaxBound:undefined,
                keysSort:1
            });
            if (userSettings.keysFilter != undefined) {
                if (userSettings.keysFilter.enabled != undefined) {
                    userSettings.keysFilter.enabled = parseInt(userSettings.keysFilter.enabled);
                } else {
                    userSettings.keysFilter.enabled = 0;
                }
                if (userSettings.keysFilter.keysSort != undefined) {
                    userSettings.keysFilter.keysSort = parseInt(userSettings.keysFilter.keysSort);
                } else {
                    userSettings.keysFilter.keysSort = 0;
                }
                if (userSettings.keysFilter.keysMinBound == null) {
                    userSettings.keysFilter.keysMinBound = undefined;
                } else {
                    userSettings.keysFilter.keysMinBound = parseFloat(userSettings.keysFilter.keysMinBound);                    
                }
                if (userSettings.keysFilter.keysMaxBound == null) {
                    userSettings.keysFilter.keysMaxBound = undefined;
                } else {
                    userSettings.keysFilter.keysMaxBound = parseFloat(userSettings.keysFilter.keysMaxBound);                    
                }
                this.keysFilter = new Backbone.Model(userSettings.keysFilter);
            }
            this.constants = data.constants;
            this.published_access = data['published_access'];
            this.personal_access = new Desktop_Model_ShareUserList(data['personal_access']);
            this.addItems(data);
            
            var nl, j, i;
            var baseLayer = new Desktop_Dao_Layer();
            var nlNodes = T.nodes.clone();
            baseLayer.init({
                id:0,
                title:'Основной слой',
                shown:1,
                node_ids:[]
            });
            var addLayer = function (layerDao) {
                nl = new Desktop_Dao_Layer();
                nl.init(layerDao, T);
                T.layers.add(nl);
                for (j=0;j<nl.nodes.items.length;j++) {
                    nlNodes.remove(nl.nodes.items[j]);
                }
            }
            for (i=0;i<data.layers.length;i++) {
                if (data.layers[i].order < 0) {
                    addLayer(data.layers[i]);
                }
            }
            T.layers.add(baseLayer);
            for (i=0;i<data.layers.length;i++) {
                if (data.layers[i].order >= 0) {
                    addLayer(data.layers[i]);
                }
            }
            for (i=0;i<nlNodes.length;i++) {
                baseLayer.nodes.add(nlNodes.at(i));
            }
            this.latest_comments = data.latest_comments ? data.latest_comments : [];
            for (i=0;i<this.latest_comments.length;i++) {
                this.latest_comments[i].node = T.nodes.get(this.latest_comments[i].node_id);
            }
            T.trigger('init_complete');
            Desktop_Dao_FormulaNode.calculator.enabled = true;
        }
        
        this.addConnection = function (conn) {
            this.connections.add(conn);
        }
        this.removeConnection = function(conn) {
            conn.destroy();
        }
    }
});
