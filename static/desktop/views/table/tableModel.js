var Desktop_ViewModel_Table = Backbone.Model.extend({
    constructor: function Desktop_ViewModel_Table() {
        Backbone.Model.apply(this, arguments);
    },
    defaults:{
        keysFilter:'',
        keysMinBound:undefined,
        keysMaxBound:undefined,
        keysSortOnce:1,
    },
    nodes:null,
    keys:null,
    cells:null,
    rows:null,
    view:null,
    initialize:function (params) {
        var T = this;   
        this.controller = params.controller;
        this.keys = new Backbone.Collection();
        this.rows = new Backbone.Collection();
        this.nodes = new Desktop_Dao_Nodes();
        this.cells = [];
        this.bind({
            'change:keysFilter':this._updateFilters,
            'change:keysMinBound':this._updateFilters,
            'change:keysMaxBound':this._updateFilters,
            'change:keysSortOnce':this._updateFilters,
        });
        this.controller.dao.keysFilter.bind('change',function(fileFilter) {
            if (fileFilter.get('enabled')) {
                T.set('keysFilter',fileFilter.get('keysFilter'));
                T.set('keysMinBound',fileFilter.get('keysMinBound'));
                T.set('keysMaxBound',fileFilter.get('keysMaxBound'));
            } else {
                T.set('keysFilter',T.defaults.keysFilter);
                T.set('keysMinBound',T.defaults.keysMinBound);
                T.set('keysMaxBound',T.defaults.keysMaxBound);
            }
            T.set('keysSortOnce',fileFilter.get('keysSort'));
        });
        var fileFilter = this.controller.dao.keysFilter;
        if (fileFilter.get('enabled')) {
            T.set('keysFilter',fileFilter.get('keysFilter'));
            T.set('keysMinBound',fileFilter.get('keysMinBound'));
            T.set('keysMaxBound',fileFilter.get('keysMaxBound'));
            T.set('keysSortOnce',fileFilter.get('keysSort'));
        }
        this.cells = [];
        
        this.keys.comparator = function (a,b) {
            var needSort = T.get('keysSortOnce');
            if (needSort != 0) {
                var av = a.get('value');
                var bv = b.get('value');
                if (Utils_String.isNumber(av)) av = parseFloat(av);
                if (Utils_String.isNumber(bv)) bv = parseFloat(bv);
                if (av!=undefined && bv != undefined) {
                    var direction = (needSort == -1) ? -1 : 1;
                    if (av>bv) {
                        return direction;
                    } else {
                        return -direction;
                    }
                    T.set('keysSortOnce',0,{silent:true});
                }
            }
        }
        this.keys.bind('add', this.keyAdded, this);
        this.keys.bind('remove', this.keyRemoved, this);
        this.keys.bind('reset', this.keysReset, this);
        
        this.rows.bind('add', this.rowAdded, this);
        this.rows.bind('remove', this.rowRemoved, this);
        
        this.nodes.bind('add', this.nodeAdded, this);
        this.nodes.bind('remove', this.nodeRemoved, this);
        this.nodes.bind('reset', this.nodesReset, this);
        //this.nodes.bind('sort', this.collectionChanged, this);
    },
    sortKeys:function (sort) {
        this.set('keysSortOnce',sort);
    },
    _updateFilters:function() {
        var allKeyValues = this._getNodesKeyValuesFiltered(this.nodes.models);
        allKeyValues = _(allKeyValues).map(function (kv) {
            return {value:kv};
        });
        this.keys.reset(allKeyValues);
    },
    _checkFilter:function(key) {
        var filters = this.get('keysFilter').split(',');
        if (!filters.length) return true;
        var pCount = 0, pSuccess = 0, nCount = 0, nSuccess = 0;
        _(filters).each(function (filter) {
            filter = filter.trim().toLowerCase();
            if (!filter) return;
            filter = RegExp.escape(filter);
            filter = filter.replace(/\\\*/ig,'\.*');
            if (filter.indexOf('\!')==0) {
                nCount++;
                filter = filter.slice(1);
                filter = "^"+filter+"$";
                if (key.match(filter)) nSuccess++;
            } else {
                pCount++;
                filter = "^"+filter+"$";
                if (key.match(filter)) pSuccess++;
            }
        });
        if (pCount==0 && nCount==0) return true;
        if (pCount >0 && pSuccess>0) {
            if (nSuccess==0) return true;
        }
        if (pCount==0 && nCount>0 && nSuccess==0) {
            return true;
        }
        return false;
    },
    _addKey:function (value, index) {
        var newKey;
        if (value == undefined) {
            newKey = new Desktop_ViewModel_Table_Col({value:value});
        } else {
            var oldKeys = this.keys.where({value:value});
            if (oldKeys.length) {
                return oldKeys[0];
            } else {
                newKey = new Desktop_ViewModel_Table_Col({value:value});
            }
        }
        var options = {};
        if (!isNaN(index) && index != undefined) options.at = index;
        this.keys.add(newKey, options);
        return newKey;
    },
    _getNodesKeyValuesFiltered:function (nodes) {
        if (!$.isArray(nodes)) nodes = [nodes];
        var keyValues = [], T = this;
        _(nodes).each(function (node) {
            var nodeData = node.getData();
            if (nodeData) {
                for (j in nodeData) {
                    if (typeof(T.get('keysMinBound'))!="undefined" && j<T.get('keysMinBound')) continue;
                    if (typeof(T.get('keysMaxBound'))!="undefined" && j>T.get('keysMaxBound')) continue;
                    if (keyValues.indexOf(j)!=-1) continue;
                    if (!T._checkFilter(j)) continue;
                    keyValues.push(j);
                }
            }
        });
        return keyValues;
    },
    rowAdded:function (row, coll, options) {
        
        var y = coll.indexOf(row);
        if (y==-1) return;
        
        this.listenTo(row,'change', function () {
            this.trigger('cellsChange');
        });
        
        this.cells.splice(y,0,[]);
        var x = 0, T = this;
        var kv, val;
        var data = {};
        var T = this;
        if (row.node) data = row.node.getData();
        this.keys.each(function (key) {
            kv = key.get('value');
            val = '';
            if (kv && data[kv] != undefined) val = data[kv];
            T.cells[y][x] = T._newCell({key: key, row:row, value:val});
            x++;
        });
        
        this.trigger('cellsChange');
        
    },
    rowRemoved:function (row, coll, options) {
        
        this.stopListening(row);
        var y = options.index;
        this.cells.splice(y,1);
        this.trigger('cellsChange');
        
    },
    nodeAdded:function (node, coll, options) {
        var T = this;
        node.bind('update:data', function () {
            T.nodeUpdated(this);
        });
        var keyValues = this._getNodesKeyValuesFiltered(node);
        _(keyValues).each(function (keyValue) {
            T._addKey(keyValue);
        });
        this.rows.add(new Desktop_ViewModel_Table_Row({
            node:node
        }));
        
    },
    nodeUpdated:function (node) {
        var T = this;
        var keyValues = this._getNodesKeyValuesFiltered(node);
        _(keyValues).each(function (keyValue) {
            T._addKey(keyValue);
        });
    },
    nodeRemoved:function (node, coll, options) {

        var rows = this.rows.where({node:node});
        this.rows.remove(rows);

    },
    nodesReset:function (coll, options) {
    },
    _newCell:function (options) {
        var cell = new Desktop_ViewModel_Table_Cell(options);
        this.listenTo(cell,'change:value', function (cell, value, options) {
            var x = this.keys.indexOf(cell.get('key'));
            var y = this.rows.indexOf(cell.get('row'));
            if (x!=-1 && y != -1)
                this.trigger('cellDataChange', x, y, value);
        });
        return cell;
    },
    keyAdded:function(key, coll, options) {
        
        var x = coll.indexOf(key);
        if (x==-1) return;
        var y = 0;
        for (y=0;y<this.rows.length;y++) {
            this.cells[y].splice(x,0,this._newCell({key: key, row:this.rows.at(y)}));
        }
        
        this.trigger('cellsChange');
        
    },
    keyRemoved:function(key, coll, options) {
        
        var x = options.index;
        var y = 0;
        for (y=0;y<this.cells.length;y++) {
            this.cells[y].splice(x,1);
        }
        
        this.trigger('cellsChange');
        
    },
    keysReset:function (coll, options) {

        var x = 0;
        var y = 0;
        for (y=0;y<this.cells.length;y++) {
            for(x=0;x<this.cells[y].length;x++) {
                this.cells[y][x].destroy();
            }
        }
        for (y=0;y<this.rows.length;y++) {
            this.cells[y] = [];
            for (x=0;x<coll.length;x++) {
                this.cells[y].splice(x,0,this._newCell({key: coll.at(x), row:this.rows.at(y)}));
            }
        }
        
        this.trigger('cellsChange');
        
    },
    getCell:function (y,x) {
        return this.cells[y][x];
    },
    onNodeUpdate:function () {
        //this.trigger('cellsChange');
    },
    destroy:function () {
        var T = this;
        this.nodes.each(function (el) {
            T.stopListening(el);
        });
    },
    insertEmptyCol:function (index, amount) {
        if (isNaN(index)) return;
        var i=0;
        for(i=0;i<amount;i++) {
            this._addKey(undefined, index+i);
        }
    },
    modifyCell:function (x, y, value) {
        var row = this.cells[y];
        if (row != undefined) {
            var cell = row[x];
            if (cell != undefined) {
                this.cells[y][x].set('value', value);
            } else {
                this._addKey(undefined,x);
                this.cells[y][x].set('value', value);
            }
        } else {
            // TODO: создаем новую ноду
        }
    },
    canModifyKey:function(x,value) {
        
        var key = this.keys.at(x);
        if (key == undefined) return true;

        var valueKeys = this.keys.where({value:value});
        if (valueKeys.length) return false;
        
        return true;
    },
    modifyKey:function (x, value) {
        var key = this.keys.at(x);
        if (key != undefined) {
            var valueKeys = this.keys.where({value:value});
            if (valueKeys.length) value = undefined;
            key.set('value',value);
        } else {
            this._addKey(value, x);
        }
    },
    addNodes:function (newnodes) {
        var T = this;
        this.nodes.add(newnodes);
        var ilen = newnodes.length;
        for (i=0;i<ilen;i++) {
            T.listenTo(newnodes[i],'update:data', T.onNodeUpdate)
            T.listenTo(newnodes[i],'update:info', T.onNodeUpdate)
            T.listenTo(newnodes[i],'update:name', T.onNodeUpdate)
            //T.listenTo(newnodes[i],'desrtoy', T.onNodeUpdate)
            //newnodes[i].bind('set:highlighted', onNodeHighlighted);
        }
        //T.onNodeUpdate();
    },
    remodeNodes: function (removeNodes) {
        this.nodes.remove(removeNodes);
        if (!$.isArray(removeNodes)) {
            removeNodes = [removeNodes];
        }
        var ilen = removeNodes.length;
        for (i=0;i<ilen;i++) {
            this.stopListening(removeNodes[i])
        }
    }
    
});