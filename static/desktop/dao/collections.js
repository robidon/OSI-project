var Desktop_Dao_Nodes = Backbone.Collection.extend ({
    constructor: function Desktop_Dao_Nodes() {
        Backbone.Collection.apply(this, arguments);
    },
    model: Desktop_Dao_AbstractNode
});

var Desktop_Dao_Groups = Backbone.Collection.extend ({
    constructor: function Desktop_Dao_Groups() {
        Backbone.Collection.apply(this, arguments);
    },
    model: Desktop_Dao_Group
});

var Desktop_Dao_Relations = Backbone.Collection.extend ({
    constructor: function Desktop_Dao_Relations() {
        Backbone.Collection.apply(this, arguments);
    },
    model: Desktop_Dao_Relation
});

var Desktop_Dao_Connections = Backbone.Collection.extend ({
    constructor: function Desktop_Dao_Connections() {
        Backbone.Collection.apply(this, arguments);
    },
    model: Desktop_Dao_Connection
});

var Desktop_Dao_Layers = Backbone.Collection.extend ({
    constructor: function Desktop_Dao_Layers() {
        Backbone.Collection.apply(this, arguments);
    },
    model: Desktop_Dao_Layer
});