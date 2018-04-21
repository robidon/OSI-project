var Desktop_View_Share = Backbone.View.extend({
    shareusers:null,
    template:null,
    file:null,
    initialize:function (options) {
        this.template = $("#fileShareDialogTemplate");
        this._opened = false;
        this.controller = options.controller;
        this.file = this.controller.dao;
        this.listenTo(this.file.personal_access, 'add', this.renderContent);
        this.listenTo(this.file.personal_access, 'change', this.renderContent);
        this.listenTo(this.file.personal_access, 'remove', this.renderContent);
        this.listenTo(this.file.personal_access, 'reset', this.renderContent);
    },
    savePublic: function () {
        var  T = this;
        T.file.published_access = T.parseAccess($('.access_publish',T.html));
        T.controller.savePublicAccessAction(T.file.published_access);
        //T.file.personal_access access_personal
    },
    savePersonal:function (userId) {
        var access = this.parseAccess($('.access_list_item_'+userId,this.html));
        this.file.personal_access.where({user_id:userId})[0].set({
            access:access
        });
        this.controller.savePersonalAccessAction(userId, access);
    },
    removePersonal:function (userId) {
        this.controller.removePersonalAccessAction(userId);
    },
    addUsers: function (newUsersString, access) {
        this.controller.shareUsersAction(newUsersString, access);
    },
    open:function () {
        this.render();
    },
    close: function () {
        if (this.dialog) {
            this.dialog.dialog('destroy');
            this.html.detach();
        }
    },
    renderContent:function () {
        var T = this;
        if (!this.html) this.html = $("<div/>");
        var oh = this.html;
        this.html = this.template.tmpl({
            publish:T.file.published_access,
            users:T.file.personal_access.toJSON(),
            newAccess:{ read:1, comment:0, edit:0, copy:0, copy_nodes:0, admin:0 }
        });
        oh.replaceWith(this.html);
        $(".access_list_item",this.html).each(function () {
            var T = this;
            $("#access_list_item_read",this).bind('change',function (){
                if (!this.checked) {
                    $(".access_list_item_check",T)
                        .not(this)
                        .attr('disabled','disabled')
                        .removeAttr('checked');
                } else {
                    $(".access_list_item_check",T)
                        .removeAttr('disabled');
                }
            } );
            $("#access_list_item_admin",T).bind('change',function (){
                if (this.checked) {
                    $(".access_list_item_check",T)
                        .not(this)
                        .attr('disabled','disabled')
                        .attr('checked','checked');
                } else {
                    $(".access_list_item_check",T)
                        .removeAttr('disabled');
                }
            } );
        });
        $(".access_publish .access_list_item_check",this.html).bind('change', function () {
            T.savePublic();
        });
        $(".access_personal",this.html).each(function () {
            var id = $(this).attr('userId');
            $(".access_list_item_check",this).bind('change', function () {
                T.savePersonal(id);
            });
            $(".access_list_item_remove", this).bind('click', function () {
                T.removePersonal(id);
            });
        });
        $("#addUsersAccess", this.html).click(function () {
            var txtArea = $(".access_list_additems_area", T.html);
            T.addUsers(txtArea.val(),T.parseAccess($(".access_list_additems", T.html)));
            txtArea.val('');
        });
        return this.html;
    },
    parseAccess:function (parent) {
        var res = {};
        $(".access_list_item_check",parent).each(function () {
            var key = $(this).attr('value');
            res[key] = $(this).attr('checked') ? 1 : 0;
        });
        return res;
    },
    render:function () {
        var T = this;
        T.renderContent();
        var html = $("<div/>").append(this.html);
        this.dialog = osi.dialog(html, {
            title:'Настройки совместного доступа',
            buttons:{},
            width:550
        });
    }
});
var Desktop_View_ShareUser  = Backbone.View.extend({
    initialize:function () {
        this.template = $("#fileShareUserTemplate");
        this.listenTo(this.model, "change", this.render);
    },
    render:function () {
        this.html = this.template.tmpl(this.model.attributes);
        return this.html;
    }
});