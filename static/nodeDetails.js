var NodeDetails = function (node, settings) {
    var self = this;
    this.node = node;
    this.settings = settings;
    this.prevData = $.extend(true, {}, node.data);
    this.popup = new TabbedPopup({
        width:600,
        autoShow:false,
        cssClass:'nodeDetails',
        tabsLeft:[{
            title:node.data.type==Node.TYPE_DATA ? 'Данные' : 'Формула',
            cssClass:'nodeDetailsData',
            active:true,
            display:function () {
                var name = self.node ? self.node.data.name : "Напишите название элемента"
                var objName = $('<input class="formString nodeName" type="text"/>');
                var res = $('<div class="popupForm nodeDetails_Data"></div>');
                res.append(objName);
                objName.val(name);
                switch(parseInt(self.node.data.type)) {
                    case Node.TYPE_DATA:
                        res.append(EditableVector.generate(self.node.data.data, {readonly:desktop.readonly}));
                        break;
                    case Node.TYPE_FORMULA:
                        res.append(EditFormula.generate(self.node,{readonly:desktop.readonly}));
                        break;
                }
				if (desktop.readonly) {
					$("input, textarea",res).attr('disabled','disabled');
				}
                return res;
            },
            hide:function() {
                self.node.data.name = $('.nodeName',self.popup.object).val();
                switch (parseInt(self.node.data.type)) {
                    case Node.TYPE_DATA :
                        self.node.data.data = EditableVector.fetch($('.ediTableWrap',self.popup.object));
                        break;
                    case Node.TYPE_FORMULA :
                        self.node.data.formula = $('.nodeFormula',self.popup.object).val();
                        break;
                }
            }
        },{
            title:'Описание',
            cssClass:'nodeDetailsDesc',
            display:function () {
                var name = self.node ? self.node.data.name : "Напишите название элемента"
                var objName = $('<input class="formString nodeName" type="text"/>');
                var res = $('<div class="popupForm nodeDetails_Desc"></div>');
                res.append(objName);
                objName.val(name);
                res.append($('<textarea class="formText nodeDesc"></textarea>').val(self.node.data.description));
				if (desktop.readonly) {
					$("input, textarea",res).attr('disabled','disabled');
				}
                return res;
            },
            hide:function() {
                self.node.data.name = $('.nodeName',self.popup.object).val();
                self.node.data.description = $('.nodeDesc',self.popup.object).val();
            }
        },{
            title:'Настройки',
            cssClass:'nodeDetailsSettings',
            display:function () {
                var div = $('<div class="settingsLine"></div>');
                var label = $('<label>Стиль:</label>');
                var settings = '<select name="nodeStyle">';
                for (var id in desktop.nodeStyles){
                    settings += '<option value="'+id+'" '+((id == self.node.data.style) ? 'selected=""' : '')+'>'+desktop.nodeStyles[id]+'</option>';
                }
                settings += '<select>';
                settings = $(settings);
                div.append(label);
                div.append(settings);
                settings.bind('change', function(){
                    self.node.data.style = settings.val();
                });
				if (desktop.readonly) {
					$("input, textarea, select",div).attr('disabled','disabled');
				}
                return div;
            }
        }],
        tabsRight:[{
            title:'Обсуждение',
            cssClass:'nodeDetailsDiscussion',
            display:function () {
                return "обсуждение";
            }
        }],
        buttons:(function () {
            var btns = $('<div></div>');
			if (desktop.readonly) {
				btns.append($('<div class="button buttonGrey"><em></em>Закрыть</div>').click(function (e) {
					self.popup.hide();
					return true;
				}));
			} else {
				btns.append($('<div class="button buttonGreen"><em></em>Сохранить</div>').click(function (e) {
					self.popup.hide();
					self.node.one('save',function () {
						if (typeof(self.settings.ok)!="undefined") self.settings.ok();
					});
					self.node.one('save_error',function () {
						osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
							document.location.reload();
						});
					});
					self.node.save();
					return true;
				}))
				.append('&nbsp;')
				.append($('<div class="button buttonGrey"><em></em>Отмена</div>').click(function (e) {
					//e.stopPropagation();
					self.popup.hide();
					self.node.data = $.extend(true, {}, self.prevData);
					if (typeof(self.settings.cancel)!="undefined") self.settings.cancel();
					return true;
				}))
				.append('&nbsp;')
				.append($('<div class="button buttonRed"><em></em>Удалить</div>').click(function (e) {
					//e.stopPropagation();
					osi.confirm('Удалить?',function() {
						self.popup.hide();
						var params = {json:1,node:node.id};
						$.post('/constructor/file/'+desktop.file.id+'/delete_node',params,function (res) {
							if (res['status']=='ok') {
								self.node.remove();
								self.node = undefined;
								if (typeof(self.settings.remove)!="undefined") self.settings.remove();
							} else {
								osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
									document.location.reload();
								});
							}
						},'json');                
					});
					return true;
				}));
			}

            return btns;
        })()
    });
    this.popup.bind('focus',function () {
        node.activate();
    });
    this.popup.bind('blur',function () {
        node.deactivate();
    });
    this.popup.show();
    $(".nodeName").each(function(){
        $(this).multicomplete({source:desktop.mtags[1]});
    });
    var Jthreads = $('<div class="threads" type="2" rel="'+node.id+'"><div class="posts"><div class="newpost modified"><div class="message"><textarea autocomplete="off"></textarea></div><div class="submitButtonWrap"><span class="submit button buttonGreen"><em></em>Отправить</span></div></div></div></div>');
	this.popup.content.after(Jthreads);
	threads.updHash = false;
	var th = threads.add(Jthreads);
	//threads.initActions(Jthreads);
	th.loadpagesubj(2, node.id, 0);
}

var GroupDetails = function (group, settings) {
    var self = this;
    this.group = group;
    this.settings = settings;
    this.prevData = $.extend(true, {}, group.data);
    console.log(group);
    this.popup = new TabbedPopup({
        width:600,
        autoShow:false,
        cssClass:'groupDetails',
        tabsLeft:[{
            title:'Группа',
            cssClass:'groupDetailsData',
            active:true,
            display:function () {
                var name = self.group ? self.group.data.name : "Напишите название элемента"
                var res = $('<div class="popupForm groupDetails_Data"></div>');
                var objName = $('<input class="formString groupName" type="text"/>');
                res.append(objName)
                    .append($('<textarea class="formText groupDesc"></textarea>').val(self.group.data.description));
                objName.val(name);
				if (desktop.readonly) {
					$("input, textarea, select",res).attr('disabled','disabled');
				}
                return res;
            },
            hide:function() {
                self.group.data.name = $('.groupName',self.popup.object).val();
                self.group.data.description = $('.groupDesc',self.popup.object).val();
            }
        },{
            title:'Настройки',
            cssClass:'nodeDetailsSettings',
            display:function () {
                var div = $('<div class="settingsLine"></div>');
                var label = $('<label>Стиль:</label>');
                var settings = '<select name="nodeStyle">';
                for (var id in desktop.nodeStyles){
                    settings += '<option value="'+id+'" '+((id == self.group.data.style) ? 'selected=""' : '')+'>'+desktop.nodeStyles[id]+'</option>';
                }
                settings += '<select>';
                settings = $(settings);
                div.append(label);
                div.append(settings);
                settings.bind('change', function(){
                    self.group.data.style = settings.val();
                });
				if (desktop.readonly) {
					$("input, textarea, select",div).attr('disabled','disabled');
				}
                return div;
            }
        }],
        buttons:(function () {
            var btns = $('<div></div>');
			if (desktop.readonly) {
				btns.append($('<div class="button buttonGrey"><em></em>Закрыть</div>').click(function (e) {
					self.popup.hide();
					return true;
				}));
			} else {
				btns.append($('<div class="button buttonGreen"><em></em>Сохранить</div>').click(function (e) {
					e.stopPropagation();
					self.popup.hide();
					
					self.group.one('save',function () {
						if (typeof(self.settings.ok)!="undefined") self.settings.ok();
					});
					self.group.one('save_error',function () {
						osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
							document.location.reload();
						});
					});
					self.group.save();
				}))
				.append('&nbsp;')
				.append($('<div class="button buttonGrey"><em></em>Отмена</div>').click(function (e) {
					e.stopPropagation();
					self.popup.hide();
					self.group.data = $.extend(true, {}, self.prevData);
					if (typeof(self.settings.cancel)!="undefined") self.settings.cancel();
				}))
				.append('&nbsp;')
				.append($('<div class="button buttonRed"><em></em>Удалить</div>').click(function (e) {
					e.stopPropagation();
					osi.confirm('Удалить?',function() {
						self.popup.hide();
						var params = {json:1,group:group.id};
						$.post('/constructor/file/'+desktop.file.id+'/delete_group',params,function (res) {
							if (res['status']=='ok') {
								self.group.remove();
								self.group = undefined;
								if (typeof(self.settings.remove)!="undefined") self.settings.remove();
							} else {
								osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
									document.location.reload();
								});
							}
						},'json');                
					})
				}));
			}
            return btns;
        })()
    });
    this.popup.bind('focus',function () {
        group.activate();
    });
    this.popup.bind('blur',function () {
        group.deactivate();
    });
    this.popup.show();
}