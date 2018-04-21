var Desktop_View_DataNode = Desktop_View_AbstractNode.extend({
    constructor: function Desktop_View_DataNode() {
        Desktop_View_AbstractNode.apply(this, arguments);
    },
    initialize: function (nodeDao, file, stage) {
        Desktop_View_AbstractNode.prototype.initialize.apply(this, [nodeDao,file, stage]);
        $.extend(this.style,{
            cornerRadius:2,
            padding:8,
            lineDash:[8,2]
        });
        var T = this;
        var slot = new Desktop_View_Slot(this,file,Desktop_View_Slot.TYPE_OUTGOING, 0, stage);
        slot.set({
            x:0,y:20
        });
        slot.bind('click', function () {
            T.trigger('outgoingSlotClick', this);
        });
        this.addChild(slot);
        this.outgoings.push(slot);
    }
});
