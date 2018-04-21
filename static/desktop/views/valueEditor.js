/**
* Редактор значений: данные, формулы
* 
* @constructor
* @class
* @extends Desktop_View_HTML
*/
function Desktop_View_ValueEditor (params) {
    Desktop_View_ValueEditor.superclass.constructor.apply(this, []);
    Desktop_View_ValueEditor.VALUE_TYPE_VAR = 0;
    Desktop_View_ValueEditor.VALUE_TYPE_FORMULA = 1;
    var T = this;
    var onChangeCallback = null;
    T.onChange = function () {
        if (onChangeCallback) {
            onChangeCallback(T.value);
        }
    }
    T.value = '';
    T.valueType = 0;
    T.node = null;
    var prevInit = this.init;
    this.init = function (controller, params) {
        prevInit(controller);
        T.controller = controller;
        T.settings = params;
        T.valueType = params.valueType ? params.valueType : 0;
        var editorAttrs = {'class':'valueEditor'}
        if (!T.settings.readonly) {
            editorAttrs['contentEditable']='true';
        }
        T.editor = $("<div/>",editorAttrs).bind({
            keyup:function () {
                T.updateValue(T.editor.html());
            },
            blur:function () {
                T.setValue(T.value,T.valueType,T.node);
            }
        });
        T.html = $("<div>",{'class':'editor'}).append(T.editor).append(T.valueInput);
        if (params.value && params.node) {
            T.setValue(params.value,params.node);
        }
    }
    this.updateValue = function(newValue) {
        newValue = T.prepareValue(newValue);
        if (T.value!=newValue) {
            T.value = newValue;
            T.onChange.call(T);
        }
        return newValue;
    }
    this.prepareValue = function (value) {
        value = value + '';
        value = value.replace(/ +/g,' ');
        value = value.replace(/<br\/?>/g,'\n');
        value = value.replace(/<div>/g,'\n');
        value = value.replace(/<[^>]*>/g,'');
        return $.trim(value);
    }
    this.colors = ['#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF','#800000','#008000','#000080','#808000','#800080','#008080','#C0C0C0','#808080','#9999FF','#993366','#FFFFCC','#CCFFFF','#660066','#FF8080','#0066CC','#CCCCFF','#000080','#FF00FF','#FFFF00'];
    this.updateEditor = function (value) {
        if (T.valueType == Desktop_View_ValueEditor.VALUE_TYPE_FORMULA) {
            var html = value.replace(/\n/g,'<br>');
            var expr = T.node.getExpression();
            var vars = expr.get_vars(value);
            var slot = 0, i;
            for (slot=0;slot<vars.length;slot++) {
                html = html.replace(new RegExp("\\b("+vars[slot]+")\\b","ig"),"<span class='formula-var' id='slot"+slot+"' rel='"+slot+"'>$1</span>");
            }
            var consts = expr.getConstants();
            for (i=0; i<consts.length;i++) {
                html = html.replace(new RegExp("\\b("+consts[i]+")\\b","ig"),"<span class='formula-const' rel='"+consts[i]+"'>$1</span>");
            }
            
            T.editor.html(html);
            for (var slot=0;slot<vars.length;slot++) {
                $("#slot"+slot,T.editor).hover(function () {
                    var slot = parseInt($(this).attr('rel'));
                    var conn = T.controller.dao.connections.findWhere({
                        toNodeId:T.node.id,
                        toSlotId:slot
                    });
                    if (conn)
                        T.controller.dao.nodes.get(conn.get('fromNodeId')).setHighlighted(true);
                },function () {
                    var slot = parseInt($(this).attr('rel'));
                    var conn = T.controller.dao.connections.findWhere({
                        toNodeId:T.node.id,
                        toSlotId:slot
                    });
                    if (conn)
                        T.controller.dao.nodes.get(conn.get('fromNodeId')).setHighlighted(false);
                });
            }
        } else {
            T.editor.html(value);
        }
    }
    this.setValue = function (value, valueType, nodeDao) {
        value = T.updateValue(value);
        T.valueType = valueType;
        T.node = nodeDao;
        T.updateEditor(value);
    }
    this.getValue = function () {
        return T.value;
    }                                          
    this.edit = function (value, valueType, nodeDao, onChange) {
        onChangeCallback = null;
        T.setValue(value, valueType, nodeDao);
        onChangeCallback = onChange;
    }
    this.cancel = function () {
        onChangeCallback = null;
        T.setValue('', 0, null);
    }
    
    
    
}
extend(Desktop_View_ValueEditor, Desktop_View_HTML);