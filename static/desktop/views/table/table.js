var Desktop_View_Table = Backbone.View.extend({
    handlers:{
        afterSelection:function (r,c,r2,c2) {
            var T = this.tableView;
            if (r == r2 && c==c2 && r > 0) {
                var row = T.getRowAt(r,0);
                var cell = T.model.getCell(r-1,c-2);
                var node = row.get('node');
                $(".selected",this.view.TBODY).removeClass('selected');
                $(".active",this.view.TBODY).removeClass('active');
                $(this.view.TBODY.childNodes[r]).addClass('selected');
                $(this.view.TBODY.childNodes[r].childNodes[c]).addClass('active');
                T.trigger('selectRow', row);
                if (r>0) {
                    if (c==0 || c==1) { // type || name cell
                        T.trigger('selectInfo', row);
                    } else if (node instanceof Desktop_Dao_FormulaNode) {
                        T.trigger('selectFormula', row);
                    } else {
                        //var headerFields = T.model.keys.models;
                        //var key = headerFields[c-2];
                        T.trigger('selectData', this, r-1, c-2);
                    }
                } else {
                    T.trigger('clearSelection');
                    deselectNodes();
                    if (c<2) {
                    } else {
                        editHeaderField(c-2);
                    }
                }
            } else {
                $(".selected",this.view.TBODY).removeClass('selected');
                $(".active",this.view.TBODY).removeClass('active');
                T.trigger('clearSelection');
            }
        },
        afterDeselect: function () {
            var T = this.tableView;
            T.trigger('clearSelection');
        },
        afterRender: function () {
            var T = this.tableView;
            var newW = $(this.view.TBODY).width();
            var maxW = parseInt(T.$el.css('max-width'));
            var minW = parseInt(T.$el.css('min-width'));
            newW = Math.max(minW,Math.min(maxW,newW));
            T.$el.width(newW+8);
        },
        beforeChange: function  (data) {
            var T = this.tableView;
            // здесь надо проверить формат
            var val,i,ilen=data.length,j,jlen;
            var prevValue, newValue, row,col;
            for (i=0;i<ilen;i++){
                prevValue = data[i][2];
                newValue = data[i][3];
                row = data[i][0];
                col = data[i][1];
                if (prevValue == newValue) {
                    data.splice(i,1);
                    i--;
                    ilen--;
                    continue;
                }
                if (col <= 1) { // редактирование названия ноды, или попытка редактировать тип ноды
                    data[i][3] = newValue +''; // на всякий случай - приведем к строке
                } else {
                    if (row === 0) { // редактирование заголовка столбца
                        // если значение получилось одинаковое - не трогаем его
                        if (!T.model.canModifyKey(col-2,newValue)) {
                            data.splice(i,1);
                            T.dialog.notifyError();
                            i--;
                            ilen--;
                            continue;
                        }
                    } else {
                        // редактирование данных или заголовка
                        data[i][3] = Utils_String.toNumber(newValue) +'';
                    }
                }
            }
        },
        removeCol: function (index,amount) {
            var T = this.tableView;
            var key = T.model.keys.at(index-2);
            if (key) {
                key.set('value', undefined);
                T.model.keys.remove(key);
            }
        },
        afterCreateCol:function(index, amount) {
            var T = this.tableView;
            if (index != undefined) index = index-2;
            T.model.insertEmptyCol(index, amount);
        },
        afterCreateRow:function(index, amount) {
            console.log('afterCreateRow');
        },
        /**
        * Вызывается при изменении данных в таблице
        * 
        * @param data - данные, которые поменялись
        * @param source - источник, вызвавший изменения: loadData, paste, populateFromArray (edit), alter (при редактировании столбца целиком или строки целиком);
        */
        change: function (data, source) {
            var T = this.tableView;
            if (source === 'loadData') return;
            var node, dataUpdatedNodes = {}, infoUpdatedNodes = {},
                i, ilen = data.length, j, val, d, col, row, prevVal, newVal;
            if (source != 'edit' && source != 'paste') {
                T.trigger('clearSelection');
            }
            for (i=0;i<ilen;i++){
                d = data[i];
                row = d[0];
                col = d[1];
                prevVal = d[2];
                newVal = d[3];
                if (row === 0) { // редактирование заголовка столбца - меняем все ноды
                    if (col < 2) continue; // заголовок первого и второго столбца менять нельзя - там названия
                    //headerFields.splice(col-2,1,newVal);
                    T.model.modifyKey(col-2,newVal);
                    /*if (!newVal) continue; // значения, у которых не определен заголовок - не сохраняются
                    // А НАДО БЫ УДАЛЯТЬ ИХ, наверное?
                    for (j=0;j<nodes.length;j++) {
                        if (source !== 'alter') {
                            val = nodes[j].data[prevVal];
                            if (nodes[j].getData(newVal) == val) continue; // не обновляем лишний раз данные
                            if (typeof(val)!=='undefined') {
                                nodes[j].deleteData(prevVal);
                                if (typeof(newVal)!=='undefined') {
                                    nodes[j].setData(newVal, val);
                                }
                            } else {
                                nodes[j].setData(newVal,'');
                            }
                            dataUpdatedNodes[j] = 1;
                        }
                    }*/
                } else { // редактирование данных
                    if (col === 1) { // редактирование названия ноды
                        var rowModel = T.model.rows.at(row-1);
                        rowModel.set('name', newVal);
                    } else {
                        // редактирование данных
                        T.model.modifyCell(col-2,row-1,newVal);
                    }
                }
            }
            /*for (i in dataUpdatedNodes) {
                nodes[i].trigger('update:data');
                nodes[i].trigger('update');
            }*/
            for (i in infoUpdatedNodes) {
                //nodes[i].trigger('update:info', T);
                //nodes[i].trigger('update', T)
            }
        }
        
    },
    getRowAt:function (row,col) {
        return this.model.rows.at(row-1);
    },
    renderers:{
        header:function (instance, td, row, col, prop, value, cellProperties) {
            Handsontable.renderers.TextRenderer.apply(this, arguments);
            td.className = 'header';
            if (!value && col==instance.countCols()-1) {
                td.className += ' new';
            } else if (!value) {
                td.className += ' invalid';
            }
        },
        formulaResult: function (instance, td, row, col, prop, value, cellProperties) {
            var rowObj = instance.tableView.getRowAt(row,col);
            var node = rowObj.get('node');
            var className = 'formulaResult';
            if (node) {
                var state = node.getState();
                switch (state) {
                    case Desktop_Dao_FormulaNode.STATE_INIT:
                    case Desktop_Dao_FormulaNode.STATE_CALC:
                        value = '...';
                        className += ' calcProgress';
                        break;
                    case Desktop_Dao_FormulaNode.STATE_ERROR:
                        value = 'Ошибка';
                        className += ' calcError';
                        break;
                    case Desktop_Dao_FormulaNode.STATE_UNDEFINED_VARS:
                    case Desktop_Dao_FormulaNode.STATE_NODATA:
                        value = 'Нет данных';
                        className += ' calcError';
                        break;
                }
            }
            td.className = className;
            instance.tableView.renderers.td(instance, td, row, col, prop, value, cellProperties);
        },
        nodeType: function (instance, td, row, col, prop, value, cellProperties) {
            value = '';
            td.className = 'nodeType';
            var rowObj = instance.tableView.getRowAt(row,col);
            var node = rowObj.get('node');
            if (node) {
                if (node instanceof Desktop_Dao_DataNode) {
                    td.className += ' typeData';
                } else if (node instanceof Desktop_Dao_FormulaNode) {
                    td.className += ' typeFormula';
                }
            }
            instance.tableView.renderers.td.apply(this, arguments);
        },
        td:function (instance, td, row, col, prop, value, cellProperties) {
            if (Utils_String.isNumber ( value )) {
                cellProperties.language = 'ru';
                if (value >= 200) {
                    //value = Util_Number.round(value);
                    cellProperties.format = "0,0";
                    //value = Util_Number.addSpaces(value);
                } else if (value >= 100) {
                    //value = Util_Number.round(value,1);
                    cellProperties.format = "0,0[.]0";
                } else if (value >= 2) {
                    //value = Util_Number.round(value,2);
                    cellProperties.format = "0,0[.]00";
                } else {
                    //value = Util_Number.round(value,4);
                    cellProperties.format = "0,0[.]0000";
                }
                Handsontable.renderers.NumericRenderer.apply(this, arguments);
                return;
            };
            Handsontable.renderers.TextRenderer.apply(this, arguments);
        },
        formula:function (instance, td, row, col, prop, value, cellProperties) {
            instance.tableView.renderers.td(instance, td, row, col, prop, value, cellProperties);
        }
    },
    editors:{
        nodeName: function (instance, td, row, col, prop, keyboardProxy, cellProperties) {
            // мультикомплит пока можно не использовать для названий нод
            //$(keyboardProxy[0]).multicomplete({source:file.mtags[1]});
            // надо удалять мультикомплит при закрытии редактирования
            return Handsontable.editors.TextEditor(instance, td, row, col, prop, keyboardProxy, cellProperties);
        },
        formula: function (instance, td, row, col, prop, keyboardProxy, cellProperties) {
            return Handsontable.editors.TextEditor(instance, td, row, col, prop, keyboardProxy, cellProperties);
        }
    },
    initialize:function (params) {
        this.controller = params.controller;
        this.dialog = params.dialog;
        this.listenTo(this.model,'cellsChange',this.render);
        this.listenTo(this.model,'cellDataChange', function (x,y,value) {
            tableInstance.setDataAtCell(y+1, x+2, value);
        });
        var T = this;
        var tableContainer = $("<div class='tableContainer'/>")
        this.table = $("<div/>");
        tableContainer.append(this.table);
        this.$el.addClass('tableWrap');
        this.$el.append(tableContainer);
        function configCell (row, col, prop) {
            var data = this.instance.getData();
            if (row === 0) {
                if (col < 2) {
                    this.readOnly = true;
                }
                this.renderer = T.renderers.header;
            } else {
                if (col === 0) {
                    this.readOnly = true;
                    this.renderer = T.renderers.nodeType;
                } else if (col === 1) {
                    this.renderer = T.renderers.td
                } else {
                    var cell = T.model.getCell(row-1,col-2);
                    if (cell) {
                        if (cell.get('readonly')) {
                            this.readOnly = true;
                        }
                        if (cell.get('type') == Desktop_Dao_Factory.TYPE_FORMULA) {
                            this.renderer = T.renderers.formulaResult;
                        } else {
                            this.renderer = T.renderers.td;
                        }
                    }
                }
            }
            if (!T.controller.dao.user_access.edit) {
                this.readOnly = true;
            }
        }
        
        this.selectNode = function (node) {
            if (selectedNodeId != node.id) {
                var row = this.model.nodes.indexOf(node);
                if (row==-1) return;
                this.table.handsontable('selectCell',row+1,2);
            }
        }
        var selectedNodeId = 0;
        var selectedNode = null;
        var deselectNodes = function () {
            selectedNodeId = 0;
            selectedNode = null;
        }
        
        var handsontableParams = {
            startRows:1,
            startCols:1,
            rowHeaders: false,
            colHeaders: false,
            width:0,
            colWidths:function (i) {
                switch (i) {
                    case 0: return 30;
                    case 1: return 250;
                    default: return 67;
                }
            },
            outsideClickDeselects:false,
            minSpareCols: 1,
            //minSpareRows: 0,
            //fixedColumnsLeft: 2,
            afterSelection: this.handlers.afterSelection,
            afterDeselect: this.handlers.afterDeselect,
            afterRender: this.handlers.afterRender,
            beforeChange: this.handlers.beforeChange,
            afterChange: this.handlers.change,
            afterCreateCol: this.handlers.afterCreateCol,
            afterCreateRow: this.handlers.afterCreateRow,
            afterRemoveCol: this.handlers.removeCol,
            cells: configCell
        };
        if (T.controller.dao.user_access.edit) {
            handsontableParams['EditColumns'] = true;
        }
        this.table.handsontable(handsontableParams);
        
        var tableInstance = this.table.handsontable('getInstance');
        tableInstance.tableView = this;
        this.deselectCell = function () {
            tableInstance.destroyEditor();
            tableInstance.deselectCell();
        }
        var onNodeHighlighted = function (source) {
            for (var i=0;i<nodes.length;i++) {
                if (nodes[i] == this) {
                    if (this.isHighlighted()) {
                        $(tableInstance.view.TBODY.childNodes[i+1]).addClass('highlighted');
                    } else {
                        $(tableInstance.view.TBODY.childNodes[i+1]).removeClass('highlighted');
                    }
                    break;
                }
            }
        }
    },
    render:function () {
        var i,j,data = [['Тип', 'Название элемента']];
        var nodeData;
        var headerFields = this.model.keys.pluck('value');
        var T = this;
        for (i=0;i<headerFields.length;i++) {
            data[0][i+2] = headerFields[i];
        }
        var len = 1;
        
        this.model.rows.each(function (row) {
            data[len] = [row.get('type'),row.get('name')];
            var j=0;
            for (j=0;j<headerFields.length;j++) {
                data[len][j+2] = T.model.getCell(len-1,j).get('value');
            }
            len++;
        });
        this.table.handsontable("loadData", data);
        return this;
    }
});