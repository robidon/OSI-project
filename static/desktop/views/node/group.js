var Desktop_View_Group = Desktop_View_AbstractNode.extend({
    constructor: function Desktop_View_Group() {
        Desktop_View_AbstractNode.apply(this, arguments);
    },
    initialize: function (groupDao, file, stage) {
        Desktop_View_AbstractNode.prototype.initialize.apply(this, [groupDao,file, stage]);
        var T = this;

        this.outslot = new Desktop_View_Slot(null,file, Desktop_View_Slot.TYPE_OUTGOING, 0, stage);
        this.outslot.set({
            x:0,y:25
        });
        this.addChild(this.outslot);
        this.outgoings = [this.outslot];

        this.inslot = new Desktop_View_Slot(null,file, Desktop_View_Slot.TYPE_INCOMING, 0, stage);
        this.inslot.direction = -1;
        this.inslot.scaleY = -1;
        this.inslot.set({
            x:0,y:-25
        });
        this.addChild(this.inslot);
        this.incomings = [this.inslot];
        
        this.openGroup = new Desktop_View_OpenGroup(file, stage);
        //this.close.x = -100;
        this.openGroup.y = 0;
        var getScale = function () {
            return Math.max(T.scale,0.7/stage.zoomScale);
        }
        var oldDraw = this.draw;
        this.draw = function(ctx) {
            var oldScale = this.scale;
            this.scale = getScale();
            oldDraw.call(this,ctx);
            this.scale = oldScale;
        }
        var oldLTG = this.localToGlobal
        this.localToGlobal = function (p) {
            var os = this.scale;
            this.scale = getScale();
            p = oldLTG.call(this,p);
            this.scale = os;
            return p;
        }
        var oldDrawHitmap = this.drawHitmap;
        this.drawHitmap = function(ctx) {
            var oldScale = this.scale;
            this.scale = getScale();
            oldDrawHitmap.call(this,ctx);
            this.scale = oldScale;
        }
        var openGroupHandler = function () {
            T.controller.openGroupAction(T.id);
        }
        var groupUpdatedHandler = function groupUpdatedHandler() {
            if (!groupDao.nodes.items.length && !groupDao.groups.items.length) {
                T.openGroup.hide();
            } else {
                T.openGroup.show();
            }
        }
        groupUpdatedHandler();
        groupDao.nodes.bind('add', groupUpdatedHandler);
        groupDao.nodes.bind('remove', groupUpdatedHandler);
        groupDao.groups.bind('add', groupUpdatedHandler);
        groupDao.groups.bind('remove', groupUpdatedHandler);
        this.openGroup.bind('click', openGroupHandler);
        this.addChild(this.openGroup);
        
        this.checkElementDrop = function (view) {
            if (view instanceof Desktop_View_AbstractNode) return true;
            return false;
        }
        this.dropElement = function (view) {
            function addToGroup(view) {
                if (view instanceof Desktop_View_Group) {
                    return T.controller.addGroupToGroupAction(T.id, view.id);
                } else if (view instanceof Desktop_View_AbstractNode) {
                    return T.controller.addNodeToGroupAction(T.id, view.id);
                }
            }
            if (view instanceof Desktop_View_AbstractNode) {
                addToGroup(view);
                var i,sel = T.controller.getSelection();
                for (i=0;i<sel.length;i++) {
                    if (view != sel[i]) {
                        addToGroup(sel[i]);
                    }
                }
            }
            return false;
        }
        
        this.bind('mouseenter', function (e) {
            if (!T.stage.dragObject || !T.checkElementDrop(T.stage.dragObject)) return;
            T.scale = 1.2;
        });
        this.bind('mouseleave', function (e) {
            T.scale = 1;
        });
        
        this.bind('dblclick', function (e) {
            T.controller.showGroupDetailsAction(this.data.id);
        });
        
        $.extend(this.style,{
            cornerRadius:17,
            fill:'#fee',
            strokeWidth:3,
        });
        
        var _oldRender = this.render;
        this.render = function (ctx, canvas) {
            _oldRender.apply(this,[ctx,canvas]);
            T.openGroup.x = canvas.width/2;
        }
    }
});
