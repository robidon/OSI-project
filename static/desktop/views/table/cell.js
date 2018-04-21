var Desktop_ViewModel_Table_Col = Backbone.Model.extend({
    constructor: function Desktop_ViewModel_Table_Col() {
        Backbone.Model.apply(this, arguments);
    },
    defaults:{
        value:''
    }
});
var Desktop_ViewModel_Table_Row = Backbone.Model.extend({
    constructor: function Desktop_ViewModel_Table_Row() {
        Backbone.Model.apply(this, arguments);
        this.bind('change:name', function (row, value, options) {
            var node = row.get('node');
            if (node) {
                node.setName(row.get('name'));
            }
        },this);
        this.bind('change:node', function (row, node, options) {
            row._setNode(node);
        }, this);
    },
    _setNode:function(node) {
        var T = this;
        var oldNode = this.previous('node');
        if (oldNode) {
            this.stopListening(oldNode);
        }
        if (node) {
            /*this.listenTo(node,'change:name', function (row, name) {
                this.set('name',name);
            });*/
            node.bind('update:name', function (attrs) {
                T.set('name',this.name);
            });
            this.set('name',node.name);
            this.set('type',node.type);
        } else {
            this.set('name', this.defaults.name);
            this.set('type', this.defaults.type);
        }
    },
    defaults:{
        name:'',
        type:undefined,
        node:undefined
    },
    initialize:function(options) {
        if (options.node) {
            this._setNode(options.node);
        }
    }
});
var Desktop_ViewModel_Table_Cell = Backbone.Model.extend({
    constructor: function Desktop_ViewModel_Table_Cell() {
        Backbone.Model.apply(this, arguments);
        this.bind('change:row', function (cell, row, options) {
            cell._setRow(row);
        });
        this.bind('change:key', function (cell, key, options) {
            cell._setKey(key);
        });
        this.bind('change:value', function (cell, val, options) {
            var node = this._getNode();
            var kv = this._getKeyValue();
            if (kv!= undefined && node) {
                if (node instanceof Desktop_Dao_DataNode) {
                    node.setData(kv, val);
                    node.trigger('update');
                    node.trigger('update:data');
                }
            }
        });
    },
    defaults:{
        value:undefined,
        readonly:false,
        key:undefined,
        row:undefined
    },
    _getKeyValue:function () {
        var key = this.get('key');
        if (key == undefined) return undefined;
        return key.get('value');
    },
    _getNode:function () {
        var row = this.get('row');
        if (row == undefined) return undefined;
        return row.get('node');
    },
    _updateValue:function () {
        var kv = this._getKeyValue();
        var node = this._getNode();
        var val = this.defaults.value;
        if (kv!=undefined && node!=undefined)
            val = node.getData(kv);
        this.set('value', val);
    },
    _updateNode:function (row) {
        var oldNode = row.previous('node');
        if (oldNode) this.stopListening(oldNode);
        var node = row.get('node');
        var T = this;
        T.set('readonly', false);
        if (node) {
            this.listenTo(node, 'change', function (node, options) {
                this._updateValue();
            });
            // пока дублируем, т.к. нода - всё ещё не бекбоновская модель
            node.bind('update', function () {
                T._updateValue();
            });
            if (node instanceof Desktop_Dao_FormulaNode) {
                T.set('readonly', true);
            }
        }
        T._updateValue();
    },
    _setRow:function (row) {
        var oldRow = this.previous('row');
        if (oldRow) {
            this.stopListening(oldRow);
            var oldNode = oldRow.get('node');
            if (oldNode) this.stopListening(oldNode);
        }
        this.listenTo(row, 'change:node', function (row, value, options) {
            this._updateNode(row);
        });
        this._updateNode(row);
    },
    _setKey:function (key) {
        var oldKey = this.previous('key');
        if (oldKey) {
            this.stopListening(oldKey);
        }
        this.listenTo(key, 'change:value', function (key, keyValue, options) {
            var prevKeyValue = key.previous('value');
            var node = this._getNode();
            if (node && node instanceof Desktop_Dao_DataNode) {
                if (prevKeyValue!=undefined) {
                    node.deleteData(prevKeyValue);
                }
                if (keyValue != undefined) {
                    node.setData(keyValue, this.get('value'));
                }
                node.trigger('update');
                node.trigger('update:data');
            }
        });
    },
    /*setNode:function(node) {
        this.node = node;
        node.bind('change',function (node) {
            this.setValue(node.getData(this.get('key')));
        },this);
        if (node instanceof Desktop_Dao_DataNode) {
            // при изменении ячейки - пытаемся обновить ноду (если не поменяется - change не будет);
            this.bind('change:value', function (cell) {
                this.setData(cell.get('key'),cell.get('value'));
                this.trigger('update');
                this.trigger('update:data');
            }, node);
            // при изменении ключа - трем старые данные, восстанавливаем в новый ключ
            this.bind('change:key', function (cell) {
                var oldKey = cell.previous('key');
                if (oldKey != undefined) {
                    var oldData = this.getData(oldKey);
                    this.deleteData(oldKey);
                    this.setData(cell.get('key'),oldData);
                    this.trigger('update');
                    this.trigger('update:data');
                }
            }, node);
        }
    },*/
    initialize:function(options) {
        if (options.row) this._setRow(options.row);
        if (options.key) this._setKey(options.key);
        this._updateValue();
    }
});
Desktop_ViewModel_Table_Cell.STATE_UNDEFINED = 0;
Desktop_ViewModel_Table_Cell.STATE_VALUE = 1;
Desktop_ViewModel_Table_Cell.STATE_ERROR = 2;
