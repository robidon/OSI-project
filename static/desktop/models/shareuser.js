var Desktop_Model_ShareUser = Backbone.Model.extend({
    defaults:{
        user_id:0,
        user_name:'No username',
        user_ava:'',
        access:0
    }
});
var Access = Backbone.Model.extend({
    defaults:{
        read:0,
        comment:0,
        edit:0,
        admin:0,
        copy:0,
        copy_nodes:0
    }
});
var Desktop_Model_ShareUserList = Backbone.Collection.extend ( {
    model:Desktop_Model_ShareUser
});