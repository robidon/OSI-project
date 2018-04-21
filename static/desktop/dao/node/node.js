/**
* @constructor
* @class
* @property {Desktop_Dao_Connection[]} connections
* @param {array} data 
* @extends Desktop_Dao_Note
*/
var Desktop_Dao_AbstractNode = Desktop_Dao_Note.extend({
    constructor: function Desktop_Dao_AbstractNode() {
        Desktop_Dao_Note.apply(this, arguments);
    },
    initialize:function (id, fileDao) {
        Desktop_Dao_Note.prototype.initialize.apply(this, arguments);
        var _oldInit = this.init;
        var T = this;
        this.type = 0;
        this.project = '';
        this.connections = [];
        this.init = function (data) {
            _oldInit.call(this,data);
            this.type = data['type'] ? parseInt(data['type']) : 1;
            this.project = data['project'] ? data['project'] : '';
            this.connections = data['connections'] ? data['connections'] : [];
        }
        var _oldGetSaveData = this.getSaveData;
        this.getSaveData = function () {
            var res = _oldGetSaveData.call(this);
            return $.extend({
                type:this.type,
                project:this.project,
                connections:this.connections
            }, res);
        }
        this.getData = function (key) {
            return undefined;
        }
    }
});