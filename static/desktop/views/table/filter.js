var Desktop_View_Filter = Backbone.View.extend({
    constructor: function Desktop_View_Filter() {
        Backbone.View.apply(this, arguments);
    },
    initialize:function (params) {
        var T = this;
        T.controller = params.controller;
        T.table = params.table;
        T.newNode = params.newNode;
        T.keysFilter = new Backbone.Model(T.controller.dao.keysFilter.attributes);
        this.listenTo(T.controller.dao.keysFilter, 'change', function () {
            this.keysFilter.set({
                enabled:T.controller.dao.keysFilter.get('enabled'),
                keysSort:T.controller.dao.keysFilter.get('keysSort'),
                keysFilter:T.controller.dao.keysFilter.get('keysFilter'),
                keysMinBound:T.controller.dao.keysFilter.get('keysMinBound'),
                keysMaxBound:T.controller.dao.keysFilter.get('keysMaxBound')
            });
        });
        this.listenTo(T.keysFilter,'change',T.render);
    },
    render:function () {
        var T = this;
        var params = $.extend({},this.keysFilter.attributes);
        $.extend(params,{user_access:T.controller.dao.user_access});
        this.$el.html($('#keysFilterTemplate').tmpl(params));
        var T = this;
        this.$(".addDataNode").click(function () {
            T.newNode(Desktop_Dao_Factory.TYPE_DATA);
        });
        this.$(".addFormulaNode").click(function () {
            T.newNode(Desktop_Dao_Factory.TYPE_FORMULA);
        });
        this.$(".keysFilterTrigger").one('click', function () {
            var enabled = 1-T.controller.dao.keysFilter.get('enabled');
            T.controller.dao.keysFilter.set('enabled',enabled);
            //T.render();
        });
        this.$(".keysSortTrigger").one('click', function () {
            var sort = -T.controller.dao.keysFilter.get('keysSort');
            if (!sort) sort = 1;
            T.controller.dao.keysFilter.set('keysSort',sort);
            //T.render();
        });
        this.$(".keysFilter").bind('keyup', _.debounce(function () {
            var val = $(this).val();
            T.keysFilter.set('keysFilter',val,{silent:true});//ставим, что б не обновлялось
            T.controller.dao.keysFilter.set('keysFilter',val);
        },400));
        this.$(".keysMinBound").bind('keyup', _.debounce(function () {
            var val = $(this).val();
            if (val=='' || val == undefined) {
                val = undefined;
            } else {
                val = Utils_String.toNumber(val);
            }
            T.keysFilter.set('keysMinBound',val,{silent:true});//что б не обновлялось
            T.controller.dao.keysFilter.set('keysMinBound',val);
        },400));
        this.$(".keysMaxBound").bind('keyup', _.debounce(function () {
            var val = $(this).val();
            if (val=='' || val == undefined) {
                val = undefined;
            } else {
                val = Utils_String.toNumber(val);
            }
            T.keysFilter.set('keysMaxBound',val,{silent:true});//что б не обновлялось
            T.controller.dao.keysFilter.set('keysMaxBound',val);
        },400));
        return this;
    }
});