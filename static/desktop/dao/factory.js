Desktop_Dao_Factory = {
    TYPE_DATA:1,
    TYPE_FORMULA:2,
    TYPE_OPERATOR:3,
    newNode:function(data, fileDao) {
        var defaults = {
            x:-cf.dao.x,
            y:-cf.dao.y,
            id:0,
            style:0,
            hidden:false,
            type:Desktop_Dao_Factory.TYPE_DATA,
            name:'Новые данные',
            group:0,
            project:''
        }
        if (typeof(data)!="undefined") {
            if (data.type == Desktop_Dao_Factory.TYPE_FORMULA) {
                defaults.name = 'Новая формула';
            }
            defaults = $.extend(defaults,data);
        }
        var n = this.node(defaults.type, 0, fileDao);
        n.init(defaults);
        return n;
    },
    node:function (type, id, fileDao) {
        var node;
        switch (parseInt(type)) {
            case Desktop_Dao_Factory.TYPE_OPERATOR:
            case Desktop_Dao_Factory.TYPE_DATA:
                node = new Desktop_Dao_DataNode(id, fileDao);
                return node;
            case Desktop_Dao_Factory.TYPE_FORMULA:
                node = new Desktop_Dao_FormulaNode(id, fileDao);
                return node;
        }
        return false;
    }
}