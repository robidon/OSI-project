var Desktop_View_Connection = function Desktop_View_Connection(file, fromCell, toCell, fromSlot, toSlot) {
    Desktop_View_Connection.superclass.constructor.apply(this, []);
    var T = this;
    //this.dao = conn;
    this.fromCell = fromCell;//file.nodes.get(conn.get('fromNodeId'));
    this.toCell = toCell;//file.nodes.get(conn.get('toNodeId'));
    this.fromSlot = fromSlot;//this.fromNode.outgoings[0];
    this.toSlot = toSlot;//this.toNode.incomings[conn.get('toSlotId')];
    var from={x:0,y:0},to={x:0,y:0};
    var updatePos = function updatePos() {
        from = T.fromCell.localToGlobal({
            x: T.fromSlot ? T.fromSlot.getConnectX() : 0,
            y: T.fromSlot ? T.fromSlot.getConnectY() : 0
        });
        to = T.toCell.localToGlobal({
            x: T.toSlot ? T.toSlot.getConnectX() : 0,
            y: T.toSlot ? T.toSlot.getConnectY() : 0
        });
    }
    if (T.toSlot) {
        T.toSlot.bind('move', updatePos);
        T.toSlot.registerConnection(this);
    }
    if (T.fromSlot) {
        T.fromSlot.bind('move', updatePos);
        T.fromSlot.registerConnection(this);
    }
    this.fromCell.bind('move', updatePos);
    this.toCell.bind('move', updatePos);
    

    this.draw = function (ctx) {
        updatePos();
        var d = Math.min(100,Math.max(Math.abs(from.x-to.x),Math.abs(from.y-to.y))/3 * (1+Math.abs(T.fromCell.rotation - T.toCell.rotation)/2));//учитываем разницу поворотов, что б немного подлиннее была связь
        var sc = T.fromSlot ? T.fromSlot.localToGlobal({x:0,y:d}) : from;
        var ec = T.toSlot ? T.toSlot.localToGlobal({x:0,y:-d}) : to; 
        // TODO: тут ec не может найти своего parent-а, по-этому не правильно считает localtoglobal
        
        Draw.link({
            ctx:ctx,
            sx:from.x,
            sy:from.y,
            scx:sc.x,
            scy:sc.y,
            ex:to.x,
            ey:to.y,
            ecx:ec.x,
            ecy:ec.y,
            highlighted:this.fromCell.isSelected() || this.toCell.isSelected(),
            fadeDirection:0
        });
    }
    this.destroy = function () {
        T.toSlot.unregisterConnection(this);
        T.toSlot.unbind('move',updatePos);
        T.fromSlot.unregisterConnection(this);
        T.fromSlot.unbind('move',updatePos);
    }
}

extend(Desktop_View_Connection, Bindable);
