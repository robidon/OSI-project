var Desktop_View_FormulaNode = Desktop_View_AbstractNode.extend({
    constructor: function Desktop_View_FormulaNode() {
        Desktop_View_AbstractNode.apply(this, arguments);
    },
    initialize: function (nodeDao, file, stage) {
        Desktop_View_AbstractNode.prototype.initialize.apply(this, [nodeDao,file, stage]);
        var T = this;
        $.extend(this.style,{
            cornerRadius:17
        });
        var slot = new Desktop_View_Slot(this,file, Desktop_View_Slot.TYPE_OUTGOING, 0, stage);
        slot.set({
            x:0,
            y:25
        });
        slot.bind('click', function () {
            T.trigger('outgoingSlotClick', this);
        });
        this.addChild(slot);
        this.outgoings.push(slot);
        var i;
        var updateIncomings = function () {
            for (i=0;i<T.incomings.length;i++) {
                T.removeChild(T.incomings[i]);
                T.incomings[i].destroy();
            }
            T.incomings = [];

            var vars = nodeDao.getVars();
            var maxI = vars.length;
            for (i=0;i<vars.length;i++) {
                var slot = new Desktop_View_Slot(T,file, Desktop_View_Slot.TYPE_INCOMING, i, stage);
                slot.direction = -1;
                slot.scaleY = -1;
                slot.set({
                    x:i*35 - (maxI / 2 - 0.5) * 35,
                    y:-25
                });
                slot.tooltip = vars[i];
                var conn = T.controller.dao.connections.where({toNodeId:nodeDao.id,toSlotId:i});
                if (!conn.length || !conn[0].get('fromNodeId')) {
                    slot.empty = true;
                }
                slot.bind('mousedown', function () {
                    T.trigger('incomingSlotMouseDown', this);
                })
                slot.bind('click', function () {
                    T.trigger('incomingSlotClick', this);
                })
                if (file.dao.user_access.edit) {
                    slot.bind('dragRetentionExpired', function () {
                        T.controller.removeConnectionAction(this);
                    });
                    slot.dragEnabled = true;
                    slot.dragRetention = 500;
                    slot.dragDelay = 0;
                }
                T.addChild(slot);
                T.incomings.push(slot);
            }
        }
        nodeDao.bind('change:connections', function () {
            updateIncomings();
            T.stage.queueRedraw();
        });
        updateIncomings();
    }
});
