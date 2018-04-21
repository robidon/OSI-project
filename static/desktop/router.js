var Desktop_Router = Backbone.Router.extend({
    routes: {
        'select(/nodes/:nodeIds)(/groups/:groupIds)': 'setSelection',
        'table/:nodeIds': 'showTable'
    },
    initialize:function () {
        DialogsManager.bind('add', function (dialog) {
            if (dialog instanceof Desktop_View_Dialog_Nodes) {
                dialog.bind('focus', function () {
                    var ids = [];
                    this.model.nodes.each(function (node) {
                        ids.push(node.id);
                    });
                    router.navigateToTable(ids);
                });
                dialog.bind('blur', function () {
                    router.navigateToSelection();
                });
            }
        });
        cf.bind('change:selection', function () {
            router.navigateToSelection();
        });
        this.debouncedNavigate = _.debounce(this.debounceNavigate,100);
    },
    getSelectionUrl:function (fileId,nodeIds,groupIds){
        var url="#select";
        if (nodeIds.length) 
            url += '/nodes/'+nodeIds.join('.');
        if (groupIds.length) 
            url += '/groups/'+groupIds.join('.');
        return url;
    },
    getTableUrl:function (fileId,nodeIds){
        return '#table/'+nodeIds.join('.');
    },
    nextUrl:'',
    debounceNavigate:function () {
        router.navigate(router.nextUrl,{trigger:false});
    },
    navigateToRoot:function () {
        this.nextUrl = '';
        this.debouncedNavigate();
    },
    navigateToSelection:function () {
        var selection = cf.getSelection();
        if (!selection.length) {
            this.navigateToRoot();
            return;
        }
        var i, nodeIds = [], groupIds = [];
        for (i=0;i<selection.length;i++) {
            if (selection[i] instanceof Desktop_View_Group) {
                groupIds.push(selection[i].id);
            } else {
                nodeIds.push(selection[i].id);
            }
        }
        this.nextUrl = this.getSelectionUrl(cf.dao.id,nodeIds,groupIds);
        this.debouncedNavigate();
    },
    navigateToTable:function (nodeIds) {
        this.nextUrl = this.getTableUrl(cf.dao.id,nodeIds);
        this.debouncedNavigate();
    },
    setSelection:function(nodeIds, groupIds) {
        if (nodeIds) {
            nodeIds = nodeIds.split('.');
        } else nodeIds =[];
        if (groupIds) {
            groupIds = groupIds.split('.');
        } else groupIds=[];
        var i=0;
        cf.clearSelectionAction();
        for (i=0;i<groupIds.length;i++) {
            cf.showGroupAction(groupIds[i]);
            var v = cf.view.groups.get(groupIds[i]);
            if (v) cf.addToSelectionAction(v);
        }
        for (i=0;i<nodeIds.length;i++) {
            cf.showNodeAction(nodeIds[i]);
            var v = cf.view.nodes.get(nodeIds[i]);
            if (v) cf.addToSelectionAction(v);
        }
        cf.zoomAction(-2);
        cf.scrollToSelectionAction();
    },
    showTable: function(nodeIds){
        var nodeIds = nodeIds.split(".");
        var i=0,added=0;
        cf.clearSelectionAction();
        for(i=0;i<nodeIds.length;i++) {
            cf.showNodeAction(nodeIds[i]);
            var v = cf.view.nodes.get(nodeIds[i]);
            if (!v) continue;
            cf.addToSelectionAction(v);
            added++;
        }
        if (added) {
            cf.zoomAction(-2);
            cf.scrollToSelectionAction();
            cf.showSelectionDetailsAction();
        }
    }
});
