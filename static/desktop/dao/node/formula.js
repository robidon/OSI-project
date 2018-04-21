/**
* @constructor
* @param {array} data 
* @class
* @extends Desktop_Dao_DataNode
*/
var Desktop_Dao_FormulaNode = Desktop_Dao_AbstractNode.extend({
    constructor: function Desktop_Dao_FormulaNode() {
        Desktop_Dao_AbstractNode.apply(this, arguments);
    },
    initialize: function (id, fileDao) {
        Desktop_Dao_AbstractNode.prototype.initialize.apply(this, arguments);
        var T = this;
        var _formula;
        var _oldInit = this.init;
        this._state = 0;
        this.init = function (data) {
            _oldInit.call(this,data);
            _formula = data['formula'] ? data['formula'] : '';
            this.data = data['data'] ? data['data'] : {};
            //debug.log(data);
            //fileDao.bind('init_complete', updateDependences);
            //TODO: если включено - работают тултипы, но не работают клики на слоты. 
            // если выключено - наоборот (и пересчет тоже видимо не пашет). нужно будет разобраться.
            this.bind('update:connections', function () {
                //updateDependences();
                _recalc();
            });
            this._state = Desktop_Dao_FormulaNode.STATE_INIT;
            if (this.data) {
                this._state = Desktop_Dao_FormulaNode.STATE_COMPLETE;
            }
            //debug.log(this._state);
        }
        var _oldGetSaveData = this.getSaveData;
        this.getSaveData = function () {
            var res = _oldGetSaveData.call(this);
            res = $.extend({
                formula:_formula
            }, res);
            if (this._state == Desktop_Dao_FormulaNode.STATE_COMPLETE) {
                res.data = this.data;
            }
            return res;
        }
        //this._childNodes = [];
        this._state = 0; // создана, посчитана, идёт пересчет, не достаточно данных, ошибка в формуле
        this.data = {};
        this.recalc = function () {
            //if (this._state == Desktop_Dao_FormulaNode.STATE_CALC) return;
            this._state = Desktop_Dao_FormulaNode.STATE_INIT;
            Desktop_Dao_FormulaNode.calculator.add(this);
            //setTimeout(function () {T.calc();},10);
        }
        var _recalc = function() {
            T.recalc();
        }
        this.setFormula = function (formula) {
            if (formula == _formula) return false;
            this._state = Desktop_Dao_FormulaNode.STATE_INIT;
            _formula = formula;
            //updateDependences();
            _recalc();
            this.trigger('update:formula', T);
            this.trigger('update',T);
            return true;
        }
        this.setConnection = function (slotId, fromNodeId) {
            this.connections[slotId] = fromNodeId;
            this.trigger('update:connections');
            this.trigger('update');
        }
        this.getFormula = function () {
            return _formula;
        }
        this.getVars = function getVars() {
            return this.getExpression().get_vars(_formula);
        }
        this.getExpression = function getExpression () {
            var expr = new Desktop_Model_Expression();
            expr.setConstants(fileDao.constants);
            return expr;
        }
        this.getState = function () {
            return this._state;
        }
        /*var updateDependences = function() {
            var i, node;
            var vars = T.getVars();
            //for (i=0;i<T._childNodes.length;i++) {
                //T._childNodes[i].unbind('update:data', _recalc);
            //}
            for (i=T.connections.length-1;i>=0;i--) {
                if (parseInt(T.connections[i])===0) {
                    delete T.connections[i];
                }
            }
            //T._childNodes = [];
            for (i in vars) {
                if (typeof(T.connections[i])=='undefined' || !parseInt(T.connections[i])) {
                    T.connections[i] = 0;
                    T._state = Desktop_Dao_FormulaNode.STATE_UNDEFINED_VARS;
                    continue;
                }
                node = fileDao.nodes.get(T.connections[i]);
                //T._childNodes.push(node);
                
                node.bind('update:data', _recalc);
            }
            //T.trigger('change:connections');
            //T.trigger('change');
            //debug.log(T.name,T._childNodes);
        }*/
        var calcTimes = 0;
        this.calc = function () {
            //debug.log('start calc:', this);
            if (this._state == Desktop_Dao_FormulaNode.STATE_UNDEFINED_VARS) {
                //throw 'Некоторые переменные не определены';
                if (!$.isEmptyObject(this.data)) {
                    this.data = {};
                    T.trigger('update:data');
                    T.trigger('update');
                }
                return;
                //Desktop_Dao_FormulaNode.calculator.add(this);
            }
            calcTimes ++;
            //debug.log('start calc:', this.name, this, this.uniqueId);
            if (this._state == Desktop_Dao_FormulaNode.STATE_CALC) {
                if (!$.isEmptyObject(this.data)) {
                    this.data = {};
                    T.trigger('update:data');
                    T.trigger('update');
                }
                return;
                //throw 'Нода в процессе пересчета';
            }                           
            if (calcTimes>1) {
                //debug.log('calcTimes');
                //throw 'Повторный пересчет ноды';
            }
            //Desktop_Dao_FormulaNode.calcStart();
            this._state = Desktop_Dao_FormulaNode.STATE_CALC;
            var expr = this.getExpression();
            var formula = _formula.replace(/\n/g,' ');
            var vars = expr.get_vars(formula);
            var slot, node, value, res, comma;
            var conns = fileDao.connections.where({'toNodeId':this.id});
            var childNodes = {};
            _.each(conns, function (conn) {
                childNodes[conn.get('toSlotId')] = fileDao.nodes.get(conn.get('fromNodeId'));
            });
            for (slot in vars) {
                try {
                    value = childNodes[slot].getData();
                } catch (e) {
                    T._state == Desktop_Dao_FormulaNode.STATE_NODATA;
                    calcTimes--
                    Desktop_Dao_FormulaNode.calcStop();
                    if (!$.isEmptyObject(this.data)) {
                        this.data = {};
                        T.trigger('update:data');
                        T.trigger('update');
                    }
                    return;
                }
                if (isNaN(value)) {
                    res = 'vector(';
                    comma = '';
                    for(key in value) {
                        res += comma+"'"+key+"',"+value[key];
                        comma = ',';
                    }
                    res += ')';
                } else {
                    res = value;
                }
                try {
                    expr.evaluate(vars[slot]+"="+res);
                } catch (e) {
                    T._state = Desktop_Dao_FormulaNode.STATE_ERROR;
                    calcTimes--
                    Desktop_Dao_FormulaNode.calcStop();
                    if (!$.isEmptyObject(this.data)) {
                        this.data = {};
                        T.trigger('update:data');
                        T.trigger('update');
                    }
                    return;
                }
            }
            try {
                for (var key in fileDao.constants) {
                    expr.evaluate(key.toLowerCase()+"="+fileDao.constants[key]);
                }
                formula = expr.replaceMacroparams(formula);
                this.data = expr.evaluate(formula);
            } catch (e) {
                this._state = Desktop_Dao_FormulaNode.STATE_ERROR;
                calcTimes--
                Desktop_Dao_FormulaNode.calcStop();
                if (!$.isEmptyObject(this.data)) {
                    this.data = {};
                    T.trigger('update:data');
                    T.trigger('update');
                }
                return;
                //throw e;
            }
            this._state = Desktop_Dao_FormulaNode.STATE_COMPLETE;
            //debug.log('end calc:', this.name, calcTimes, this.data);
            //debug.log('update.data', T);
            T.trigger('update:data');
            T.trigger('update');
            calcTimes--;
            //Desktop_Dao_FormulaNode.calcStop();
            return this.data;
        }
        this.getData = function (key) {
            if (this._state != Desktop_Dao_FormulaNode.STATE_COMPLETE) {
                T.recalc();
                return;
                /*setTimeout(function () {
                    try {
                        T.calc();
                    } catch (e) {
                        throw e;
                    }
                },10);*/
                //throw "Данные по формуле не посчитаны";
            }
            if (typeof(key)=='undefined') {
                return this.data;
            }
            return this.data[key];
        }
    }
});
Desktop_Dao_FormulaNode.STATE_INIT = 0;
Desktop_Dao_FormulaNode.STATE_COMPLETE = 1;
Desktop_Dao_FormulaNode.STATE_CALC = 2;
Desktop_Dao_FormulaNode.STATE_NODATA = 3;
Desktop_Dao_FormulaNode.STATE_ERROR = 4;
Desktop_Dao_FormulaNode.STATE_UNDEFINED_VARS = 5;

//очередь на пересчет - надо использовать для пересчета

Desktop_Dao_FormulaNode.calculator = {
    queue:[],
    lock:false,
    enabled:false,
    add:function(node) {
        if (!this.enabled) return;
        this.lock = true; // лок пока плохо продуман
        // если нода есть в очереди на пересчет, передвигаем её в конец очереди
        // если нет - просто добавляем в конец очереди
        var i = this.queue.indexOf(node);
        if (i!==-1) {
            this.queue.splice(i,1);
        }
        this.queue.push(node);
        this.lock = false;
        this.start();
    },
    processing:false,
    start:function () {
        if (!this.processing) {
            this.next();
        }
    },
    cancel:false,
    stop:function () {
        this.cancel = true;
    },
    wait:function (callback) { // ждем, пока не закончится модификация очереди
        if (!this.lock) { callback.call(this); return; }
        var T = this;
        setTimeout(function () { T.wait(callback); }, 1);
    },
    next:function () {
        var T = this;
        if (!T.queue.length || T.cancel) {
            T.cancel = false;
            T.processing = false
            return;
        }
        T.processing = true;
        this.wait(function() {
            T.queue.shift().calc();
            T.next();
        });
    }
}
Desktop_Dao_FormulaNode._calcCounter = 0;
Desktop_Dao_FormulaNode.calcListener = new Bindable();
Desktop_Dao_FormulaNode.calcStart = function () {
    if (Desktop_Dao_FormulaNode._calcCounter === 0) {
        Desktop_Dao_FormulaNode.calcListener.trigger('start');
    }
    Desktop_Dao_FormulaNode._calcCounter ++;
}
Desktop_Dao_FormulaNode.calcStop = function () {
    Desktop_Dao_FormulaNode._calcCounter --;
    if (Desktop_Dao_FormulaNode._calcCounter === 0) {
        Desktop_Dao_FormulaNode.calcListener.trigger('stop');
    }
}