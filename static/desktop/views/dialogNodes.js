var lastDialog = undefined;
var Desktop_View_Dialog_Nodes = Desktop_View_Dialog.extend({
    constructor:function Desktop_View_Dialog_Nodes() {
        Desktop_View_Dialog.apply(this, arguments);
    },
    initialize:function (params, file) {
        lastDialog = this;
        var T = this;
        T.controller = file;
        T.model = new Desktop_ViewModel_Table({
            controller:file
        });
        T.table = new Desktop_View_Table({
            controller:file,
            model:T.model,
            dialog:T
        });
        T.filter = new Desktop_View_Filter({
            controller:file,
            table:T.table,
            newNode: function newNode(type) {
                var x = T.controller.view.convertXFromPage(T.getElement().position().left - 30);
                var y = T.controller.view.convertYFromPage(T.getElement().position().top + (T.model.nodes.length + 0.5) * 22 + 27);
                var params = {
                    type:type,
                    x:x,
                    y:y
                };
                T.controller.newNodeAction(params, function (newNode) {
                    T.model.addNodes([newNode]);
                });
            }
        });
        T.filter.render();
        
        //var nodes = [];
        //var headerFields = [];
        var i,j, ilen,jlen;
        T.getElement().addClass('dialogNodes');
        var contentElement = T.getContentElement();
        var valueEditorContainer = $("<div class='valueEditorContainer'/>");
        var valueEditor = new Desktop_View_ValueEditor();
        var valueEditorParams = {};
        if (!T.controller.dao.user_access.edit) {
            valueEditorParams['readonly'] = true;
        }
        valueEditor.init(file, valueEditorParams);
        valueEditorContainer.append(valueEditor.getHTML());
        contentElement.append(T.filter.$el);
        contentElement.append(T.table.$el);
        contentElement.append(valueEditorContainer);
        T.table.bind('clearSelection', function () {
            if (valueEditorContainer.find(document.activeElement).length) {
                return;
            }
            valueEditorContainer.removeClass('enabled');
            valueEditor.cancel();
            selectedNodeInfo.hide();
            selectedNode = undefined;
        });
        T.table.bind('selectInfo', function (row) {
            valueEditorContainer.removeClass('enabled');
            valueEditor.cancel();
        });
        T.table.bind('selectData', function (tableModel, row, col) {
            editDataValue(this.model, row, col);
        });
        T.table.bind('selectFormula', function(row) {
            editFormula(row);
        });
        T.table.bind('selectRow', function (row) {
            var node = row.get('node');
            if (node && node != selectedNode) {
                showNodeInfo(node);
            }
        });
        var selectedNode;
        var descriptionPlaceholder = "Укажите краткое описание элемента ...";
        var showNodeInfo = function(node) {
            selectedNode = node;
            selectedNodeInfo.show();
            selectedNodeTitle.text(node.name);
            selectedNodeDescriptionEdit.val(node.get('full_desc'));
            selectedNodeDescription.html(node.get('full_desc'));
            if (T.controller.dao.user_access.edit) {
                if (!node.get('full_desc')) {
                    selectedNodeDescription.html(descriptionPlaceholder);
                }
                selectedNodeDescription.addClass("editable");
                selectedNodeDescription.bind('click', function () {
                    selectedNodeDescriptionEdit.show();
                    selectedNodeDescription.hide();
                    var editor = new wysihtml5.Editor(selectedNodeDescriptionEdit.get(0), { // id of textarea element
                      //toolbar:      "wysihtml5-toolbar", // id of toolbar element
                      parserRules:  wysihtml5ParserRules // defined in parser rules set 
                      //placeholderText: 'Описание отсутствует'
                    });
                    var saveFullDesc = _.debounce(function () {
                        node.set('full_desc', editor.getValue());
                    },500);
                    editor.on('load', function () {
                        $('.wysihtml5-sandbox', contentElement).contents().find('body').on("keydown",saveFullDesc);
                        /*var ifrm = $(editor.composer.iframe).css({border:0,width:'100%'});
                        var ifrmContent = $(ifrm[0].contentWindow.document);
                        ifrmContent = ifrmContent.find("html").css({width:"100%",height:"100%",margin:0,padding:0,overflow:"hidden"}).find("body").css({height:"auto",width:"100%",margin:0,padding:0});*/
                    });
                });
            }
            th.loadpagesubj(2, node.id, 0);
        }

        this.removeNodes = function (removeNodes) {
            renderTable();
        }
        
        var selectedNodeInfo = $("<div>",{'class':'nodeInfo'}).css('display','none');
        contentElement.append(selectedNodeInfo);
        var selectedNodeTitle = $("<div class='selectedNodeTitle'></div>")
        selectedNodeInfo.append(selectedNodeTitle);
        var selectedNodeDescriptionWrap = $("<div class='selectedNodeDescriptionWrap'></div>")
        var selectedNodeDescriptionEdit = $("<textarea id='dialogNodes"+this.cid+"' placeholder='"+descriptionPlaceholder+"'></textarea>");
        var selectedNodeDescription = $("<div class='selectedNodeDescription'></div>");
        selectedNodeDescriptionWrap.append(selectedNodeDescription);
        if (T.controller.dao.user_access.edit) {
            selectedNodeDescriptionWrap.append(selectedNodeDescriptionEdit);
        }
        selectedNodeInfo.append(selectedNodeDescriptionWrap);
        var msgTemplate = '<div class="threads" type="2" rel="">';
        if (T.controller.dao.user_access.comment) {
            msgTemplate += '<div class="newpost modified"><div class="message"><p><strong>Ваш комментарий</strong></p><textarea autocomplete="off"></textarea></div><div class="submitButtonWrap"><span class="submit button buttonGreen"><em></em>Отправить</span></div></div>';
        }
        msgTemplate += '<div class="posts"></div></div>';
        var Jthreads = $(msgTemplate);
        selectedNodeInfo.append(Jthreads);
        threads.updHash = false;
        valueEditorContainer.find(".valueEditor").bind('focus', function () {
            T.table.deselectCell();
        });
        var th = threads.add(Jthreads, (!T.controller.dao.user_access.comment) ? true : false);
        th.prependNewMessageForm = true;
        var editDataValue = function (tableModel, row, col) {
            valueEditorContainer.addClass('enabled');
            var cell = tableModel.getCell(row,col);
            var val = '';
            if (cell) {
                val = cell.get('value');
                if (val==undefined) {
                    val = '';
                }
            }
            valueEditor.edit(val, 0, undefined, function (newValue) {
                tableModel.modifyCell(col,row,newValue);
            });
        }
        var editFormula = function (row) {
            var node = row.get('node');
            if (!node) return;
            valueEditorContainer.addClass('enabled');
            valueEditor.edit(node.getFormula(), 1, node, function (newValue) {
                T.controller.setFormulaAction(node, newValue);
            });
        }
        var editHeaderField = function (fieldId) {
            if (typeof(headerFields[fieldId]) == 'undefined') {
                alert('headerFields edit not implemented');
            } else {
                valueEditorContainer.addClass('enabled');
                valueEditor.edit(headerFields[fieldId], 0, null, function (newValue) {
                    //node.setFormula(newValue);
                });
            }
        }
        
        Desktop_View_Dialog.prototype.initialize.apply(this, [params]);

        var oldClose = this.close;
        this.close = function () {
            this.model.destroy();
            this.table.remove();
            oldClose.apply(this,[]);
        }
    }
});
//extend(Desktop_View_Dialog_Nodes, Desktop_View_Dialog);
