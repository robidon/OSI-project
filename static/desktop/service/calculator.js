/**
* Объект подписывается на изменение всех списков и моделей и запускает пересчет в нужный момент.
* 
*/
var Desktop_Service_Calculator = Backbone.Model.extend ({
    fileDao:null,
    constructor: function Desktop_Service_Calculator() {
        Backbone.Model.apply(this, arguments);
    },
    initialize:function (arguments, options) {
        Backbone.Model.prototype.initialize.apply(this,arguments);
        this.fileDao = options.fileDao;
        this.listenTo(this.fileDao.nodes, {
            'add':this.nodeAdded
        });
        this.listenTo(this.fileDao.connections, {
            'add':this.connectionAdded,
            'remove':this.connectionRemoved
        })
    },
    
    nodeDataUpdate: function (node) {
        var conns = this.fileDao.connections.where({'fromNodeId':node.id});
        var nodes = [];
        var T = this;
        _.each(conns,function (conn) {
            nodes.push(T.fileDao.nodes.get(conn.get('toNodeId')));
        });
        nodes = _.uniq(nodes);
        _.invoke(nodes,'recalc')
    },
    
    nodeFormulaUpdate: function (node) {
        node.trigger('change:connections');
    },
    
    connectionChanged: function (connection) {
        console.log('connection changed', arguments);
    },
    
    nodeAdded:function (node, nodes, options) {
        var T = this;
        this.listenTo(node, {
            'update:data':function nodeDataUpdate () {
                T.nodeDataUpdate(this);
            },
            'update:formula':function nodeFormulaUpdate() {
                T.nodeFormulaUpdate(this);
            },
            'destroy': function nodeRemoved() {
                T.nodeRemoved(this);
            }
        }, node);
    },

    connectionAdded:function (connection, connections, options) {
        var T = this;
        var node = this.fileDao.nodes.get(connection.get('toNodeId'));
        if (node) {
            node.setConnection(connection.get('toSlotId'), connection.get('fromNodeId'));
            node.recalc();
            node.trigger('change:connections');
        }
        this.listenTo(connection, {
            'change': function connectionChanged() {
                T.connectionChanged(this);
            },
            'destroy': function connectionChanged() {
                var node = T.fileDao.nodes.get(this.get('toNodeId'));
                node.setConnection(this.get('toSlotId'),0);
                node.trigger('change:connections');
            }
        }, connection);
    },

    nodeRemoved:function (node) {
        this.stopListening(node);
    },
    connectionRemoved:function(connection, connections, options) {
        var node = this.fileDao.nodes.get(connection.get('toNodeId'));
        if (node) {
            node.recalc();
            node.trigger('change:connections');
        }
        this.stopListening(connection);
    }
    
});