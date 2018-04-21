var Desktop_View_DescriptionsList = function Desktop_View_DescriptionsList() {
    Desktop_View_DescriptionsList.superclass.constructor.apply(this, []);
    this.render = function () {
        var T = this;
        if (!this.html) this.html = $("<div/>");
        var oh = this.html;
        this.html = $("#descriptionsListTemplate").tmpl();
        oh.replaceWith(this.html);
        var nodes,groups;
        var selection = this.controller.getSelection();
        var i,selNodes = [], selGroups = [];
        if (selection.length) {
            for (i=0;i<selection.length;i++) {
                if (!(selection[i] instanceof Desktop_View_Group)) {
                    selNodes.push(selection[i].id);
                } else {
                    selGroups.push(selection[i].id);
                }
            }
        }
        var id;
        if (selNodes.length || selGroups.length) {
            nodes = T.controller.dao.nodes.filter(function (node) {
                return selNodes.indexOf(node.id)!=-1
            });
            groups = T.controller.dao.groups.filter(function (group) {
                return selGroups.indexOf(group.id)!=-1
            });
        } else {
            nodes = T.controller.dao.nodes.clone().models;
            groups = T.controller.dao.groups.clone().models;
        }
        if (nodes.length || groups.length) {
            var items = [];
            _(nodes).each(function (node) {
                if (!node.get('full_desc')) return;
                items.push({
                    id:node.id,
                    type:1,
                    name:node.name,
                    full_desc:node.get('full_desc'),
                    date_modified:node.get('date_modified'),
                    single:false
                });
            });
            _(groups).each(function (group) {
                if (!group.get('full_desc')) return;
                items.push({
                    id:group.id,
                    type:2,
                    name:group.name,
                    full_desc:group.get('full_desc'),
                    date_modified:group.get('date_modified'),
                    single:false
                });
            });
            if (items.length==1) {
                items[0].single = true;
            } else {
                items = _(items).sortBy(function (item) { return -item.date_modified; });
            }
            var descsHtml = $("#descriptionsListItemTemplate").tmpl(items);
            $("#descriptionsList",this.html).append(descsHtml);
            $(".descriptionsListItem",this.html).each(function () {
                var id = $(this).attr('itemId');
                var type = $(this).attr('itemType');
                var item;
                if (type == 1) {
                    item = T.controller.dao.nodes.get(id);
                } else {
                    item = T.controller.dao.groups.get(id);
                }
                $(".descriptionsListItemBody",this).bind({
                    'mouseenter':function () {
                        item.setHighlighted(true);
                    },
                    'mouseleave':function () {
                        item.setHighlighted(false);
                    },
                    'click':function () {
                        T.controller.showHiddenNodeAction(item);
                        var view;
                        if (item instanceof Desktop_Dao_Group) {
                            view = T.controller.view.groups.get(id);
                        } else {
                            view = T.controller.view.nodes.get(id);
                        }
                        T.controller.clearSelectionAction();
                        T.controller.scrollToNodeAction(item);
                        T.controller.zoomAction(-2);
                        if (view) {
                            view.select();
                            T.controller.addToSelectionAction(view);
                        }
                    },
                    'dblclick':function () {
                        var view;
                        if (item instanceof Desktop_Dao_Group) {
                            view = T.controller.view.groups.get(id);
                            if (view) {
                                T.controller.showGroupDetailsAction(id);
                            }
                        } else {
                            view = T.controller.view.nodes.get(id);
                            if (view) {
                                T.controller.showNodeDetailsAction(id);
                            }
                        }
                        return false;
                    }
                })
            });
        }
    }
    this.init = function(file) {
        var T = this;
        this.controller = file;
        this.render();
        file.bind('change:selection', function () {
            setTimeout(function () {
                T.render(); 
            },500);
        });
    }
}
extend(Desktop_View_DescriptionsList, Desktop_View_HTML)
