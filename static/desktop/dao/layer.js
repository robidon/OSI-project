/**
* @class
* @param data
*/
var Desktop_Dao_Layer = Backbone.Model.extend({
    constructor: function Desktop_Dao_Layer() {
        Backbone.Model.apply(this, arguments);
    },
    initialize:function () {
        Backbone.Model.prototype.initialize.apply(this,arguments);
        var T = this;
        var file;
        var nodeAddedHandler = function (node) {
            node.setLayer(T.id);
            var ind = T.node_ids.indexOf(node.id);
            if (ind != -1) return;
            T.node_ids.push(node.id);
            T.setHighlighted(false);
            T.trigger('update:nodes');
            T.trigger('update');
        }
        var nodeRemovedHandler = function (node) {
            node.setLayer(0);
            var ind = T.node_ids.indexOf(node.id);
            if (ind == -1) return;
            T.node_ids.splice(ind,1);
            T.setHighlighted(false);
            T.trigger('update:nodes');
            T.trigger('update');
        }
        this.init = function(data, fileDao) {
            file = fileDao;
            this.id = parseInt(data['id']);
            this.title = data['title'];
            this.shown = (parseInt(data['shown'])==1);
            this.nodes = new Collection();
            this.order = data['order'];
            this.nodes.bind('add', nodeAddedHandler);
            this.nodes.bind('remove', nodeRemovedHandler);
            //this.nodes.bind('add', addNodeHandler);
            this.highlighted = false;
            this.node_ids = data.node_ids ? Util_Array.parseInt(data.node_ids) : [];
            var i, node;
            if (this.node_ids) {
                for (i=0;i<this.node_ids.length;i++) {
                    node = file.nodes.get(this.node_ids[i]);
                    if (!node) continue;
                    T.nodes.add(node);
                }
            }
        }
        this.setTitle = function (title) {
            if (this.title == title) return;
            this.title = title;
            this.trigger('update:title');
            this.trigger('update');
        }
        this.setShown = function (shown) {
            if (this.shown == shown) return;
            this.shown = shown;
            var i, len = this.nodes.items.length;
            for (i=0;i<len;i++) {
                this.nodes.items[i].setHidden(this.shown);
            }
            this.trigger('update:shown');
            this.trigger('update');
        }
        this.setHighlighted = function (highlighted) {
            if (this.highlighted == highlighted) return;
            this.highlighted = highlighted;
            this.trigger('set:highlighted');
            this.trigger('set');
        }
    }
});