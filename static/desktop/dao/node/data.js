/**
* @constructor
* @param {array} data 
* @class
* @extends Desktop_Dao_NoteNode
*/
var Desktop_Dao_DataNode = Desktop_Dao_AbstractNode.extend({
    constructor: function Desktop_Dao_DataNode() {
        Desktop_Dao_AbstractNode.apply(this, arguments);
    },
    initialize: function (id, fileDao) {
        Desktop_Dao_AbstractNode.prototype.initialize.apply(this, arguments);
        var _oldInit = this.init;
        this.data = {};
        this.init = function (data) {
            _oldInit.call(this,data);
            this.data = (data['data'] && (typeof (data['data']) == 'object') )? data['data'] : {};
            if (Util_Array.isArray(this.data)) {
                this.data = {};
            }
        }
        var _oldGetSaveData = this.getSaveData;
        this.getSaveData = function () {
            var res = _oldGetSaveData.call(this);
            return $.extend({
                data:this.data
            }, res);
        }
        this.getData = function (key) {
            if (typeof(key) == 'undefined') {
                return this.data;
            }
            return this.data[key];
        }
        this.setData = function (key, value) {
            if (this.data[key] == value) return false;
            if (typeof (value) == 'undefined') return false;
            if (typeof (key) == 'undefined') return false;
            this.data[key] = value;
            return true;
        }
        this.deleteData = function (key) {
            delete this.data[key];
        }
    }
});