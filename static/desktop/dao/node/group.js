/**
* @constructor
* @class
* @param {array} data 
* @extends Desktop_Dao_Note
*/
var Desktop_Dao_Group = Desktop_Dao_Note.extend({
    constructor: function Desktop_Dao_Group() {
        Desktop_Dao_Note.apply(this, arguments);
    },
    initialize: function (id, fileDao) {
        Desktop_Dao_Note.prototype.initialize.apply(this, arguments);
        var T = this;
        var nodeAddedHandler = function (node) {
            node.bind('destroy', nodeDestroyedHandler)
            if (node.group) {
                var oldGroup = fileDao.groups.get(node.group);
                if (oldGroup) {
                    oldGroup.nodes.remove(node);
                }
            }
            node.setGroup(T.id);
            T.trigger('addNode', node);
            T.trigger('update');
        }
        var nodeRemovedHandler = function (node) {
            node.unbind('destroy', nodeDestroyedHandler)
            if (node.group == T.id) {
                node.setGroup(0);
            }
            T.trigger('removeNode', node);
            T.trigger('update');
            if (!T.groups.items.length && !T.nodes.items.length) {
                T.setOpened(false);
            }
        }
        var groupAddedHandler = function (group) {
            group.bind('destroy', groupDestroyedHandler)
            if (group.group) {
                var oldGroup = fileDao.groups.get(group.group);
                if (oldGroup) {
                    oldGroup.groups.remove(group);
                }
            }
            group.setGroup(T.id);
            T.trigger('addGroup', group);
            T.trigger('update');
        }
        var groupRemovedHandler = function (group) {
            group.unbind('destroy', groupDestroyedHandler)
            if (group.group == T.id) {
                group.setGroup(0);
            }
            T.trigger('removeGroup', group);
            T.trigger('update');
            if (!T.groups.items.length && !T.nodes.items.length) {
                T.setOpened(false);
            }
        }
        var nodeDestroyedHandler = function () {
            T.nodes.remove(this);
        }
        var groupDestroyedHandler = function () {
            T.groups.remove(this);
        }
        var _oldInit = this.init;
        this.nodes = new Collection();
        this.groups = new Collection();
        this.nodes.bind('add', nodeAddedHandler);
        this.nodes.bind('remove', nodeRemovedHandler);
        this.groups.bind('add', groupAddedHandler);
        this.groups.bind('remove', groupRemovedHandler);
        this.opened = 0;
        this.groupIds = [];
        this.nodeIds = [];
        this.init = function (data) {
            _oldInit.call(this,data);
            this.opened = data['opened'] ? parseInt(data['opened']) : 0;
            this.groupIds = data.inner_groups ? data.inner_groups : [];
            this.nodeIds = data.nodes ? data.nodes : [];
            if (!this.nodeIds.length && !this.groupIds.length) {
                this.opened = false; // нельзя открыть пустую группу
            }
            this.once('initComplete', function () {
                // должна вызваться после того, как все группы добавлены - необходимо, чтобы настроить связи к группам, в которых другие группы
                var j;
                var node;
                var removeEmpty = [];
                for (j=0;j<T.nodeIds.length;j++) {
                    node = fileDao.nodes.get(T.nodeIds[j]);
                    if (!node) {
                        removeEmpty.push(j);
                        continue;
                        //throw 'No node found while group initialisation:'+this.nodeIds[j];
                    }
                    T.nodes.add(node);
                }
                for (j=removeEmpty.length-1;j>=0;j--) {
                    T.nodeIds.splice(removeEmpty[j],1);
                }
                removeEmpty = [];
                for (j=0;j<T.groupIds.length;j++) {
                    node = fileDao.groups.get(T.groupIds[j]);
                    if (!node) {
                        removeEmpty.push(j);
                        continue;
                    }
                    T.groups.add(node);
                }
                for (j=removeEmpty.length-1;j>=0;j--) {
                    T.groupIds.splice(removeEmpty[j],1);
                }
            });
        }
        this.setOpened = function(opened) {
            if (this.opened == opened) return;
            var i, len;
            len = this.groups.items.length;
            for (i=0;i<len;i++) {
                if (!opened) { 
                    this.groups.items[i].setOpened(opened);
                }
                this.groups.items[i].setHidden(opened);
            }
            len = this.nodes.items.length;
            for (i=0;i<len;i++) {
                this.nodes.items[i].setHidden(opened);
            }
            this.setHidden(!opened);
            this.opened = opened;
            this.trigger('update:opened');
            this.trigger('update');
        }
        var _oldDestroy = this.destroy;
        this.destroy = function () {
            _oldDestroy.call(this);
            this.nodes.clear();
            this.groups.clear();
            this.nodes.unbind('add', nodeAddedHandler);
            this.nodes.unbind('remove', nodeRemovedHandler);
            this.groups.unbind('add', groupAddedHandler);
            this.groups.unbind('remove', groupRemovedHandler);
        }
        var _oldGetSaveData = this.getSaveData;
        this.getSaveData = function () {
            var res = _oldGetSaveData.call(this);
            var nodeIds = [], groupIds = [];
            var i;
            for (i=0;i<T.nodes.items.length;i++) {
                nodeIds.push(T.nodes.items[i].id);
            }
            for (i=0;i<T.groups.items.length;i++) {
                groupIds.push(T.groups.items[i].id);
            }
            return $.extend({
                opened:T.opened,
                nodes:nodeIds,
                inner_groups:groupIds
            }, res);
        }
    }
});
