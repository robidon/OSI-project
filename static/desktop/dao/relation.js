/**
* Отношения между нодами и группами, и группами и группами. Пока в разработке (вроде не особо нужно)
* 
*/
var Desktop_Dao_Relation = Backbone.Model.extend({
    defaults:{
        child:null,
        parent:null
    },
    constructor:function Desktop_Dao_Relation() {
        Backbone.Model.constructor.apply(this,arguments);
    },
    initialize:function(attrs, options) {
        Backbone.Model.prototype.initialize.apply(this,attrs,options);
        
    }
});