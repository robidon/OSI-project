var uniqueNodeId = 0;
/**
* @constructor
* @param {array} data 
* @class
*/
var Desktop_Dao_Abstract = Backbone.Model.extend({
    defaults:{
        name:'',
        x:0,
        y:0,
        layerId:0,
        style:0,
    },
    constructor: function Desktop_Dao_Abstract() {
        Backbone.Model.apply(this, arguments);
    },
    initialize:function(id, fileDao) {
        Backbone.Model.prototype.initialize.apply(this, arguments);
        Desktop_Dao_Abstract.STATUS_SAVE_COMPLETE = 0;
        Desktop_Dao_Abstract.STATUS_SAVE_PROGRESS = 1;
        Desktop_Dao_Abstract.STATUS_SAVE_ERROR = 2;
        this.uniqueId = ++uniqueNodeId;
        this.saveStatus = Desktop_Dao_Abstract.STATUS_SAVE_PROGRESS;
        var T = this;
        this.id = parseInt(id);// нужно установить id что б создать объект, занести его в коллекцию и после была возможность искать его по id
        this.name = '';
        this.x = 0;
        this.y = 0;
        this.fileDao = fileDao;
        this.layerId = 0;
        this.style = 0;
        this.setSaveStatus = function (status) {
            if (this.saveStatus == status) return;
            if (!this.fileDao.user_access.edit) return;
            this.saveStatus = status;
            this.trigger('set:saveStatus');
            this.trigger('set');
        }
        this.setName = function (newName) {
            if (this.name == newName) return;
            this.name = newName;
            this.trigger('update:name');
            this.trigger('update');
        }
        this.init = function (data) {
            this.id = data['id'] ? parseInt(data['id']) : 0;
            this.name = data['name'] ? data['name'] : 0;
            this.x = (!data['x']) ? 0 : parseInt(data['x']);
            this.y = (!data['y']) ? 0 : parseInt(data['y']);
            this.style = data['style'] ? data['style'] : 0;
            //this.color = data['color'] ? data['color'] : '#fff';
            this.layerId = 0; // по хорошему, здесь сейчас может быть список слоёв, но пока - нет смысла.
            this.saveStatus = Desktop_Dao_Abstract.STATUS_SAVE_COMPLETE;
        }
        this.setStyle = function (style) {
            if (this.style == style) return;
            this.style = style;
            this.trigger('update:style');
            this.trigger('update');
        }

        this.setLayer = function (layerId) {
            if (this.layerId == layerId) return;
            this.layerId = layerId;
            this.trigger('set:layer'); // layer - это свойство слоя, там его и нужно обрабатывать
            this.trigger('set');
        }
        this.setPosition = function (x,y) {
            if (this.x == x && this.y == y) return;
            this.set({x:x,y:y});
            this.x = x;
            this.y = y;
            this.trigger('update:position');
            this.trigger('update');
        }
        this.getSaveData = function () {
            return {
                id:this.id,
                name:this.name,
                x:this.x,
                y:this.y,
                style:this.style
            };
        }
        this.destroy = function () {
            this.trigger('destroy');
        }
    }
});