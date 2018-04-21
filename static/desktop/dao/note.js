/**
* @constructor
* @param {array} data 
* @class
* @extends Desktop_Dao_Abstract
*/
var Desktop_Dao_Note = Desktop_Dao_Abstract.extend({
    constructor: function Desktop_Dao_Note() {
        this.defaults = _.extend({}, this.defaults, this.extendDefaults);
        Desktop_Dao_Abstract.apply(this, arguments);
    },
    extendDefaults:{
        rotation:0,
        full_desc:'',
        date_modified:0
    },
    initialize:function (id, fileDao) {
        Desktop_Dao_Abstract.prototype.initialize.apply(this, arguments);
        var T = this;
        this.setDescription = function (value) {
            T.description = value;
            T.trigger('update:description');
            T.trigger('update');
        }
        this.description = '';
        this.group = 0;
        this.hidden = false;
        var _oldInit = this.init;
        this.init = function (data) {
            _oldInit.call(this,data);
            this.description = data['description'] ? data['description'] : '';
            this.hidden = data['hidden'] ? ( data['hidden']!=false ) : false;
            this.group = data['group'] ? parseInt(data['group']) : 0;
            if (data['rotation'] != undefined) {
                this.set('rotation',data.rotation, {silent:true});
            } else {
                this.set('rotation',this.defaults.rotation, {silent:true});
            }
            if (data['full_desc'] != undefined) {
                this.set('full_desc',data.full_desc, {silent:true});
            } else {
                this.set('full_desc',this.defaults.full_desc, {silent:true});
            }
            if (data['date_modified'] != undefined) {
                this.set('date_modified',data.date_modified, {silent:true});
            } else {
                this.set('date_modified',this.defaults.date_modified, {silent:true});
            }
            this.bind('change', function (){
                T.trigger('update');
            });
        }
        this.incRotation = function () {
            var r = this.get('rotation');
            if (!r) r=0;
            r = (r + 1) % 8;
            this.set('rotation', r);
        }
        this.setHidden = function (value) {
            if (this.hidden == value) return;
            this.hidden = value;
            //this.trigger('set:hidden'); // это не update, в теории - не нужно
        }
        this.setGroup = function (groupId) {
            if (this.group == groupId) return;
            if (groupId == this.id) return;
            if (groupId) {
                var allParents = {};
                allParents[this.id] = 1;
                var getTopParent = function (grId) {
                    allParents[grId] = 1;
                    var gr = T.fileDao.groups.get(grId);
                    if (!gr) return false;
                    if (!gr.group) return gr;
                    if (typeof (allParents[gr.group])!="undefined") return false;
                    return getTopParent(gr.group);
                }
                if (!getTopParent(groupId)) return;
            }
            this.group = groupId;
            this.trigger('set:group'); // это не update, в теории - не нужно
            this.trigger('set');
        }
        var _oldGetSaveData = this.getSaveData;
        this.getSaveData = function () {
            var res = _oldGetSaveData.call(this);
            return $.extend({
                hidden:parseInt(this.hidden),
                group:this.group,
                description:this.description,
                rotation:this.get('rotation'),
                full_desc:this.get('full_desc')
            }, res);
        }
        var _highlighted = false;
        this.setHighlighted = function (h) {
            if (_highlighted == h) return;
            _highlighted = h;
            T.trigger('set:highlighted');
            T.trigger('set');
        }
        this.isHighlighted = function () {
            return _highlighted;
        }
    }
});
