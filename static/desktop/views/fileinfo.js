var Desktop_View_FileInfo = function Desktop_View_FileInfo() {
    Desktop_View_FileInfo.superclass.constructor.apply(this, []);
    var T = this;
    var macroparamsClickHandler = function () {
        $.post('/macroparams', {json: 1}, function(data){
            var win = new TabbedPopup({
                tabsLeft:[{
                    title:'Макропараметры',
                    active: true, 
                    display: function(){
                        var html = $('<form></form>').attr('id', 'macroparamsTable');
                        html.append('<input type="hidden" name="json" value="1" />');
                        var table = $('<table class="data" width="100%"></table>');
                        var i,j,k;
                        var tr = $("<tr><th>ID</th><th>Название</th></tr>");
                        for (i in data.data.years) {
                            tr.append("<th>"+data.data.years[i]+"</th>");
                        }
                        table.append(tr);
                        for (i in data.data.availableParams) {
                            tr = $("<tr></tr>");
                            tr.append("<th>"+i+"</th><th>"+data.data.availableParams[i].title+"</th>")
                            if (data.data.userParams[i]) {
                                for (k in data.data.years) {
                                    j = data.data.years[k];
                                    if (typeof (data.data.userParams[i][j]) == 'undefined') {
                                        val = '';
                                    } else {
                                        val = data.data.userParams[i][j];
                                    }
                                    tr.append("<td width='50px'><input type='text' name='params["+i+"]["+j+"]' id='macroparam_"+i+"_"+j+"' value='"+val+"'/></td>");
                                }
                            }
                            table.append(tr);
                        }
                        html.append(table)
                        return html;
                    }
                }],
                buttons: (function () {
                    var btns = $('<div></div>');
                    btns.append($('<div class="button buttonGreen"><em></em>Сохранить</div>').click(function (e) {
                        var postData = $('#macroparamsTable').serializeArray();
                        $.post('/macroparams/save', postData, function(data){
                            if (data.status =='ok') {
                                win.hide();
                                cf.initMacroparams(data.data);
                                cf.fullRecalcAction();
                            }
                        }, 'json');
                    }));
                    btns.append('&nbsp;');
                    btns.append($('<div class="button buttonGrey"><em></em>Закрыть</div>').click(function (e) {
                        e.stopPropagation();
                        win.hide();
                    }));
                    return btns;
                })
            });
            win.show();
                
        });
    }
    var constantsClickHandler = function () {
        $.post('/constructor/file/'+T.controller.dao.id+'/constants', {json: 1}, function(data){
            T.controller.dao.constants = data;
            var constLine = $('<div class="constLine"><input name="constants[]" type="text" /><input name="values[]" type="text" /><input type="button" value="-" onclick="$(this).parent().remove();" /></div>');
            var win = new TabbedPopup({
                tabsLeft:[{
                    title: 'Константы',
                    active: true,
                    display: function(){
                        if (T.controller.dao.readonly) {
                            var html = $("<table class='data'></table>");
                            for(var cnst in data.data){
                                html.append('<tr><th>'+cnst+'</td><td>'+data.data[cnst]+'</td></tr>');
                            }
                        } else {
                            var html = $('<form></form>').attr('id', 'constantsAreaWrap');
                            html.append('<input type="hidden" name="json" value="1" />');
                            var res = $('<div></div>').attr('id', 'constantsArea');
                            for(var cnst in data.data){
                                var vl = data.data[cnst];
                                var line = constLine.clone();
                                line.find('input:eq(0)').val(cnst);
                                line.find('input:eq(1)').val(vl);
                                res.append(line);
                            }
                            var btnPlus = $('<input type="button" value=" + " />');
                            btnPlus.bind('click', function(){
                                var line = constLine.clone();
                                $('#constantsArea').append(line);
                            });
                            html.append(res);
                            html.append(btnPlus);                        
                        }
                        return html;
                    }
                }],
                buttons:(function () {
                    var btns = $('<div></div>');
                    btns.append($('<div class="button buttonGrey"><em></em>Закрыть</div>').click(function (e) {
                        e.stopPropagation();
                        win.hide();
                    }));
                    if (!T.controller.dao.readonly) {
                        btns.append('&nbsp;');
                        btns.append($('<div class="button buttonGreen"><em></em>Сохранить</div>').click(function (e) {
                            var postData = $('#constantsAreaWrap').serializeArray();
                            $.post('/constructor/file/'+T.controller.dao.id+'/saveconstants', postData, function(data){
                                if (data.status =='ok') {
                                    T.controller.dao.constants = data.data;
                                }
                            }, 'json');
                        }));
                    }
                    return btns;
                })
            });
            win.show();
        });
    }
    var settingsClickHandler = function () {
        var fields = ['title','description', 'namespace_id'];
        var prevValues;
        osi.dialog($("#fileSettingsDialog"), {
            title:'Свойства',
            open:function(){
                prevValues = {'title':$("#file_title", this).val(),'description':$("#file_description", this).val(), 'namespace_id': $("#file_namespace_id", this).val()};
                //$("#file_title",this).multicomplete({source:desktop.mtags[1]});
            },
            buttons:{
                'Сохранить':function () {
                    var title = $('#file_title', this).val();
                    var description = $('#file_description', this).val();
                    var namespace_id = $('#file_namespace_id', this).val();
                    if (!title) title = 'Новый файл';
                    if (title != prevValues.title || description!=prevValues.description || namespace_id!=prevValues.namespace_id) {
                        $.post('/constructor/file/'+T.controller.dao.id+'/save', {
                            'json':1,'ajax':1,
                            'data[title]':title,'data[description]':description,'data[namespace_id]':namespace_id
                        }, function(resp) {
                            if (resp['status']!='ok') {
                                osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
                                    document.location = "/constructor";
                                });
                            } else {
                                document.location = "/constructor/file/"+resp['data'];
                            }
                        },'json');
                    }
                    $(this).dialog('close');
                },
                'Отмена':function () {
                    $(this).dialog('close');
                }
            },
            close:function () {
            },
            width:550
        });
    }
    var fileCopyClickHandler = function fileCopyClickHandler () {
        document.location.href = '/constructor/file/'+T.controller.dao.id+'/filecopy';
    }
    var recalcClickHandler = function recalcClickHandler () {
        T.controller.fullRecalcAction();
    }
    var shareClickHandler = function shareClickHandler () {
        var dialog = new Desktop_View_Share({
            controller:T.controller
        });
        dialog.open();
        /*osi.dialog($("#fileShareDialog"), {
            title:'Настройки совместного доступа',
            open:function () {
                
            },
            buttons:{
                'Сохранить':function () {
                    $(this).dialog('close');
                },
                'Отмена': function () {
                    $(this).dialog('close');
                }
            },
            close:function () {
                
            },
            width:550
        });*/
    }
    this.init = function(file) {
        this.controller = file;
        this.html = $("#fileInfoTemplate").tmpl(file.dao);
        
        this.btnMacroparams = $("#macroparams", this.html).click(macroparamsClickHandler);
        this.btnConstants = $("#constants", this.html).click(constantsClickHandler);
        this.btnRecalc = $("#recalc", this.html).click(recalcClickHandler);
        this.btnFileCopy = $("#fileCopy", this.html).click(fileCopyClickHandler);
        this.btnSettings = $("#fileSettingsButton", this.html).click(settingsClickHandler);
        this.btnShare = $("#fileShareButton", this.html).click(shareClickHandler);
        
    }
}
extend(Desktop_View_FileInfo, Desktop_View_HTML)
