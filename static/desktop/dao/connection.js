/**
* @class
*/
var Desktop_Dao_Connection = Backbone.Model.extend ({
    defaults: {
        fromNodeId:null,
        toNodeId:null,
        toSlotId:null,
    },
    constructor: function Desktop_Dao_Connection() {
        Backbone.Model.apply(this, arguments);
    },
    initialize:function (attributes, options) {
        Backbone.Model.prototype.initialize.call(this,attributes,options);
    },
    set:function (attributes, options) {
        if (_.isString(attributes)) {
            options = parseInt(options);
        } else {
            for (var i in attributes) {
                attributes[i] = parseInt(attributes[i]);
            }
        }
        return Backbone.Model.prototype.set.call(this, attributes, options);
    }
});