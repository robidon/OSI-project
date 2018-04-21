var desktop = {
    freezed:false,
    container:'',
    _connections:[],
    _cells:[],
    incomings:[],
    outgoings:[],
    nodes:'',
    zoom:0,
    selection:{},
    clipboard:{nodes:[],groups:[]},
    nodeStyles:null,
    _zoomCorrectionLeft: 100,
    _zoomCorrectionTop: 50,
	readonly:0,
    face: {
        fileSettings: function (fileId) {
            var fields = ['title','description', 'namespace_id'];
            var prevValues;
            osi.dialog($("#fileSettingsDialog"), {
                title:'Свойства',
                open:function(){
                    prevValues = {'title':$("#file_title", this).val(),'description':$("#file_description", this).val(), 'namespace_id': $("#file_namespace_id", this).val()};
					$("#file_title",this).multicomplete({source:desktop.mtags[1]});
                },
                buttons:{
                    'Сохранить':function () {
                        var title = $('#file_title', this).val();
                        var description = $('#file_description', this).val();
                        var namespace_id = $('#file_namespace_id', this).val();
                        if (!title) title = 'Новый файл';
                        if (title != prevValues.title || description!=prevValues.description || namespace_id!=prevValues.namespace_id) {
                            $.post('/constructor/file/'+fileId+'/save', {
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
                    desktop.unfreeze();
                    desktop.clearSelection();
                },
                width:550
            });
        },
        filePublish: function (fileId, publish) {
            $.post('/constructor/file/'+fileId+'/publish', {
                'json':1,'ajax':1,'publish':publish
            }, function(resp) {
                if (resp['status']!='ok') {
                    osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
                        document.location = "/constructor";
                    });
                } else {
                    //document.location = "/constructor/file/"+resp['data'];
                }
            },'json');
        },
        connect: function (slot) {
            desktop.freeze();
            var activeCell = slot.cell;
            var inSlots = $(".inSlot",desktop.container).not($(".inSlot",activeCell.element));
            inSlots.bind('click.connect',function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                var cell = $(this).data('model').cell;
                desktop.connectNodes(activeCell, cell, $(this).data('model').id);
                inSlots.unbind('click.connect');
                desktop.unfreeze();
                //desktop._redraw++;
            });
            desktop.bind('click.connect', function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                inSlots.unbind('click.connect');
                desktop.unfreeze();
            });
        },
        searchOp: function (mouseX,mouseY,type) {
            search.show({
                mouseX:mouseX,
                mouseY:mouseY
            });
            /*$.post('/constructor/index/oplist',{json:1,'type':type},function (data) {
                osi.dialog(data.data, {
                    title:'Выбор оператора',
                    open:function () {
                        var T = $(this);
                        $(".operator").click(function (e) {
                            T.dialog('close');
                            desktop.face.newNode({
                                operator_uid:$(this).attr('rel'),
                                'type':type,
                                name:$('.operator_name',this).text(),
                                x:mouseX,
                                y:mouseY
                            });
                        });
                    },
                    buttons:{
                        'Отмена':function () {
                            $(this).dialog('close');
                        }
                    },
                    close:function () {
                    },
                    width:550
                });
            }, 'json');*/
        },
        newNode: function (params) {
            var data = {
                id:0,
                name:'node',
                description:'Новый элемент',
                type:1,
                group:'',
                project:'',
                formula:'',
                data:{},
                x:100,
                y:100,
                operator_uid:0,
                connections:[]
            };
            if (typeof(params)!="undefined") {
                data = $.extend(data,params);
            }
            var nn = new Node(data, desktop.container);
            desktop._setCellEvents(nn);
            var nodeDetails = new NodeDetails(nn,{
                ok:function () {
                    //nn.index = desktop._cells.length;
                    desktop._cells.push(nn);
                },
                cancel:function () {
                    nn.element.remove();
                    delete nn;
                }
            });
        },
        newGroup : function (params) {
            var cells = [], nodeIds = [], groupIds = [], i;
            var summTop = 0;
            var summLeft = 0;
            for (i in desktop.selection) {
                cells.push(desktop._cells[i]);
                if (desktop._cells[i] instanceof Node) {
                    nodeIds.push(desktop._cells[i].id);
                } else {
                    groupIds.push(desktop._cells[i].id);
                }
                summTop += desktop._cells[i].data.y;
                summLeft += desktop._cells[i].data.x;
            }
            summTop = parseInt(summTop / cells.length);
            summLeft = parseInt(summLeft / cells.length);
            if (!cells.length) {
                return false;
            }
            var data = {
                id:0,
                title:'group',
                description:'Новая группа',
                x:summLeft,
                y:summTop,
                nodes:nodeIds,
                inner_groups:groupIds
            };
            if (typeof(params)!="undefined") {
                data = $.extend(data,params);
            }
            var ng = new Group(data, desktop.container);
            desktop._setCellEvents(ng);
            var groupDetails = new GroupDetails(ng,{
                ok:function () {
                    //ng.index = desktop._cells.length;
                    desktop._cells.push(ng);
                },
                cancel:function () {
                    ng.remove();
                    delete ng;
                }
            });
        },
		editLayer:function (layer_id, layer_title) {
			var prevValues = {'title':layer_title};
			osi.dialog($("#layerSettingsDialog"), {
				title:'Свойства',
				open:function () {
					$("#layer_title", this).val(layer_title);
				},
				buttons:{
					'Сохранить':function () {
						var title = $("#layer_title", this).val();
						if (!title) title = 'Новый слой';
						$(this).dialog('close');
						if (title != prevValues.title) {
							$.post('/constructor/file/'+desktop.file.id+'/saveLayer', {
								'json':1,'ajax':1,
								'data[id]':layer_id,
								'data[title]':title,
								'data[shown]':1
							}, function (resp) {
								if (resp['status']!='ok') {
									osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
                                        document.location = "/constructor";
                                    });
								} else {
									desktop.updateLayer(resp.data.id,resp.data);
								}
							},'json');
						}
					},
					'Отмена':function () {
						$(this).dialog('close');
					},
					'Удалить':function () {
						$(this).dialog('close');
						$.post('/constructor/file/'+desktop.file.id+'/removeLayer', {
							'json':1,'ajax':1,
							'layer_id':layer_id,
						}, function (resp) {
							if (resp['status']!='ok') {
								osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
									document.location = "/constructor";
								});
							} else {
								desktop.removeLayer(layer_id);
							}
						},'json');
					}
				},
				width:550
			});
		},
        arrange: function(fileId){
			if (desktop.readonly) return false;
            $.post('/constructor/file/'+fileId+'/arrange/', {json: 1}, function(data){
                if (data.status == 'ok'){
                    document.location.reload();
                }
            }, 'json');
        }
    },
    scaleDragX:function(x) {
        // zoom 4 - в 2 раза
        return parseInt(x / (this.zoom/2 + 4) * 4);
    },
    scaleDataX:function(x) {
        return parseInt(x * (this.zoom/2+ 4) / 4);
    },
    editConstants: function(fileId){
        $.post('/constructor/file/'+fileId+'/constants', {json: 1}, function(data){
            desktop.constants = data;
            var constLine = $('<div class="constLine"><input name="constants[]" type="text" /><input name="values[]" type="text" /><input type="button" value="-" onclick="$(this).parent().remove();" /></div>');
            var win = new TabbedPopup({
                tabsLeft:[{
                    title: 'Константы',
                    active: true,
                    display: function(){
						if (desktop.readonly) {
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
					if (!desktop.readonly) {
						btns.append('&nbsp;');
						btns.append($('<div class="button buttonGreen"><em></em>Сохранить</div>').click(function (e) {
							var postData = $('#constantsAreaWrap').serializeArray();
							$.post('/constructor/file/'+fileId+'/saveconstants', postData, function(data){
								if (data.status =='ok') {
									desktop.constants = data.data;
								}
							}, 'json');
						}));
					}
                    return btns;
                })
            });
            win.show();
        });
    },
    editMacroparams: function(){
        $.post('/macroparams', {json: 1}, function(data){
            console.log(data);
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
                                //desktop.constants = data.data;
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
                
            /*var constLine = $('<div class="constLine"><input name="macro[]" type="text" /><input name="values[]" type="text" /><input type="button" value="-" onclick="$(this).parent().remove();" /></div>');
            var win = new TabbedPopup({
                tabsLeft:[{
                    title: 'Макропараметры',
                    active: true,
                    display: function(){
                        if (desktop.readonly) {
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
                    if (!desktop.readonly) {
                        btns.append('&nbsp');
                        btns.append($('<div class="button buttonGreen"><em></em>Сохранить</div>').click(function (e) {
                            var postData = $('#constantsAreaWrap').serializeArray();
                            $.post('/constructor/file/'+fileId+'/saveconstants', postData, function(data){
                                if (data.status =='ok') {
                                    desktop.constants = data.data;
                                }
                            }, 'json');
                        }));
                    }
                    return btns;
                })
            });
            win.show();*/
        });
    },
    copy: function(){
        if ($.isEmptyObject(desktop.selection)) return;
        var nodeIds = [],i,groupIds = [];
        for (i in desktop.selection) {
            if (desktop._cells[i] instanceof Node) {
                nodeIds.push(desktop._cells[i].id);
            } else if (desktop._cells[i] instanceof Group) {
				groupIds.push(desktop._cells[i].id);
			}
        }
        if (!nodeIds.length && !groupIds.length) return;
        $.post('/constructor/file/copy', {json: 1, node_ids: nodeIds, group_ids:groupIds}, function(data){
            desktop.clipboard = {nodes:nodeIds, groups:groupIds};
            desktop.trigger('clipboardChange');
        });
    },
    paste: function(fileId){
        $.post('/constructor/file/'+fileId+'/paste', {json: 1}, function(res) {
			desktop.clearSelection();
			if (res.status == 'ok') {
				if (res.data.nodes) {
					for(var i in res.data.nodes) {
						var nn = new Node(res.data.nodes[i],desktop.container);
						desktop._setCellEvents(nn);
						desktop._cells.push(nn);
						nn.select();
						if (i==0) {
							desktop.scrollTo(
								desktop.scaleDataX(-nn.data.x) + (desktop.container.width()-200)/2,
								desktop.scaleDataX(-nn.data.y) + (desktop.container.height()-200)/2
							);
						}
					}
				}
				if (res.data.groups) {
					for(var i in res.data.groups) {
						var ng = new Group(res.data.groups[i],desktop.container);
						desktop._setCellEvents(ng);
						desktop._cells.push(ng);
						ng.select();
					}
				}
                desktop.ready();
			}
        });
    },
	setZoom:function (zoom, doSave) {
		desktop.container.removeClass('zoom-'+desktop.zoom);
		var lastZoom = desktop.zoom;
		this.zoom = Math.max(-4,Math.min(4, zoom));
		var changed = (lastZoom != desktop.zoom);
        desktop.container.addClass('zoom-'+desktop.zoom);
        for(var i in desktop._cells) {
            desktop._cells[i].updatePos();
        }
		if (typeof(doSave)=="undefined" || doSave) {
			desktop.queueSavePos();
		}
        desktop._redraw++;
        if (changed){
            desktop.trigger('zoomChange');
            var lastLeft = parseInt(desktop.container.css('left'));
            var lastTop = parseInt(desktop.container.css('top'));
            desktop.container.css({
				left: lastLeft - desktop._zoomCorrectionLeft * (desktop.zoom-lastZoom),
				top: lastTop - desktop._zoomCorrectionTop * (desktop.zoom-lastZoom)
			});
			desktop.desktopDrag.css({
				'left':-desktop.container.position().left+'px',
				'top':-desktop.container.position().top+'px'
			});
        }
	},
    zoomIn: function () {
		this.setZoom(this.zoom+1);
    },
    zoomOut: function () {
		this.setZoom(this.zoom-1);
        /*this.container.removeClass('zoom-'+this.zoom);
        var lastZoom = this.zoom;
        this.zoom = Math.max(-4, this.zoom-1);
        var changed = (lastZoom != this.zoom);
        this.container.addClass('zoom-'+this.zoom);
        for(var i in this._cells) {
            this._cells[i].updatePos()
        }
        this.queueSavePos();
        this._redraw++;
        if (changed){
            this.trigger('zoomChange');
            var lastLeft = parseInt(this.container.css('left'));
            var lastTop = parseInt(this.container.css('top'));
            this.container.css({left: lastLeft + desktop._zoomCorrectionLeft, top: lastTop + desktop._zoomCorrectionTop});
			this.desktopDrag.css({
				'left':-this.container.position().left+'px',
				'top':-this.container.position().top+'px'
			});
        }*/
    },
    freeze: function () {
        this.freezed = true;
        $(".cellWrap",this.container).draggable('disable');
    },
    unfreeze: function () {
        this.freezed = false;
        $(".cellWrap",this.container).draggable('enable');
    },
    _getNodeById: function (id) {
        for(var i in this._cells) {
            if ( (this._cells[i] instanceof Node) && this._cells[i].id == id) {
                return this._cells[i];
            }
        }
        return false;
    },
    _getGroupById: function (id) {
        for(var i in this._cells) {
            if ( (this._cells[i] instanceof Group) && this._cells[i].id == id) {
                return this._cells[i];
            }
        }
        return false;
    },
    setNodes: function (nodes) {
        var i,c,j,nn, fromNode,fromSlot, toNode, toSlot,slot;
        var self = this;
        if (this._cells) {
            for (i in this._cells) {
                if (this._cells[i] instanceof Node) {
                    delete this._cells[i];
                }
            }
            this._cells = [];
        }
        for (i in nodes) {
            nn = new Node(nodes[i],this.container);
            //nn.index = this._cells.length;
            desktop._setCellEvents(nn);
            this._cells.push(nn);
            if (nn.data.position == Node.POSITION_INPUT) {
                this.incomings.push(nn);
            }
        }
        this.updateIncomings();
        this._redraw++;
    },
    setGroups: function (groups) {
        var i,c,j,ng, from, to,slot,node,nodesIndeces;
        if (this._cells) {
            for (i in this._cells) {
                if (this._cells[i] instanceof Group) {
                    delete this._cells[i];
                }
            }
        }
        //надо организовать группы по иерархии, что б сначала прошли те, кто может быть свернуты внутри других групп
        
        for (i in groups) {
            ng = new Group(groups[i],this.container);
            //ng.index = this._cells.length;
            desktop._setCellEvents(ng);
            this._cells.push(ng);
        }
        this._redraw++;
    },
	_layers:{},
	setLayers:function(layers) {
		var i,j;
		for (i=0;i<layers.length;i++) {
			for (j =0;j<layers[i].node_ids.length;j++) {
				var cell = desktop._getNodeById(layers[i].node_ids[j]);
				if (cell) {
					cell.layer = layers[i].id;
				}
			}
		}
		for (i=0;i<desktop._cells.length;i++) {
			if (desktop._cells[i] instanceof Node) {
				desktop._cells[i].bind({
					'mouseenter':function () {
						var cell = $(this).data('model');
						$('#fileLayers .layer').removeClass('highlighted');
						desktop._layers[cell.layer].addClass('highlighted');
					},
					'mouseleave':function () {
						$('#fileLayers .layer').removeClass('highlighted');
					}
				});
			}
		}
		desktop.addLayer({id:0,title:'Основной слой',shown:1, editable:false});
		for (i=0;i<layers.length;i++) {
			layers[i].id = parseInt(layers[i].id);
			layers[i].shown = parseInt(layers[i].shown);
			desktop.addLayer(layers[i]);
		}
	},
	addLayer:function(data) {
		var nl = $("<div class='layer'></div>")
			.data({'id':data.id,'title':data.title,'shown':data.shown})
			.append($('<div class="ico visibility '+( data.shown ? 'desktop_layer_show' : 'desktop_layer_hide')+'"></div>').click(function (e) {
				e.stopPropagation();
				if ($(this).hasClass('desktop_layer_show')) {
					desktop.hideLayer(data.id);
				} else {
					desktop.showLayer(data.id);
				}
			}));
		if (data.editable !== false) {
			nl.append($('<div class="ico desktop_layer_edit"></div>').click(function (e) {
				e.stopPropagation();
				desktop.face.editLayer(nl.data('id'),nl.data('title'));
			}))
		}
		nl.append($('<div class="title">'+data.title+'</div>'));
		nl.click(function () {
			var x=0,y=0,c=0;
			for (var i in desktop._cells) {
				if (desktop._cells[i].layer == data.id) {
					x += desktop._cells[i].element.position().left;
					y += desktop._cells[i].element.position().top;
					c++;
				}
			}
			x = - parseInt(x/c) + (desktop.container.width()-200)/2;// + desktop.container.position().left;
			y = - parseInt(y/c) + (desktop.container.height()-50)/2;// + desktop.container.position().top;
			desktop.scrollTo(x,y);
		});
		nl.droppable({
			accept:function (obj) {
                if (!obj.hasClass('cellWrap')) return false;
                return true;
            },
            greedy:true,
            hoverClass:'droppable',
            drop:function (event,ui) {
                event.stopPropagation();
				var cell;
				for (var i in desktop.selection) {
					cell = desktop._cells[i];
					setCellLayer(cell, data.id);
				}
				function setCellLayer(cell, newLayer) {
					if (cell instanceof Group) {
						for (var i in cell.cells) {
							setCellLayer(cell.cells[i], newLayer);
						}
					} else {
						var prevLayer = cell.layer;
						cell.layer = newLayer;
						if (prevLayer != cell.layer) {
							for (var i in desktop.file.layers) {
								if (desktop.file.layers[i].id == prevLayer && typeof(desktop.file.layers[i].node_ids)!="undefined") {
									desktop.file.layers[i].hasChanges = true;
									for(var c in desktop.file.layers[i].node_ids) {
										if (desktop.file.layers[i].node_ids[c]==cell.id) {
											desktop.file.layers[i].node_ids.splice(c,1);
											break;
										}
									}
								} else if (desktop.file.layers[i].id == cell.layer) {
									desktop.file.layers[i].hasChanges = true;
									if (typeof(desktop.file.layers[i].node_ids)=="undefined") {
										desktop.file.layers[i].node_ids = [];
									}
									var found = false;
									for (var j in desktop.file.layers[i].node_ids) {
										if (desktop.file.layers[i].node_ids[j] == cell.id) {
											found = true;
											break;
										}
									}
									if (!found) desktop.file.layers[i].node_ids.push(cell.id);
								}
							}
						}
					}
				}
				return false;
            }
		});
		$("#fileLayers").append(nl);
		if (!data.shown) {
			desktop.ready(function () {
				desktop.hideLayer(data.id,false);
			});
		}
		desktop._layers[data.id] = nl;
	},
	updateLayer:function(id,data) {
		if (typeof(desktop._layers[id])=='undefined') {
			desktop.file.layers.push({
				id:id,title:data.title,shown:1
			});
			desktop.addLayer(data);
		} else {
			desktop._layers[id].data({
				'id':id,'title':data.title,'shown':data.shown
			});
			$(".title",desktop._layers[id]).text(data.title);
		}
	},
	removeLayer:function(id) {
		for(i=0;i<desktop._cells.length;i++) {
			if (desktop._cells[i].layer == id) {
				desktop._cells[i].layer = 0;
			}
		}
		desktop._layers[id].remove();
	},
	showLayer:function(id, doSave) {
		var i;
		if (typeof (doSave) == 'undefined' || doSave) {
			for (i in desktop.file.layers) {
				if (desktop.file.layers[i].id == id) {
					desktop.file.layers[i].shown = 1;
					this.saveLayer(desktop.file.layers[i]);
					break;
				}
			}
		}
		$(".ico.visibility",desktop._layers[id]).removeClass('desktop_layer_hide').addClass('desktop_layer_show');
		$("#toggleAllLayers .ico").removeClass('desktop_layer_hide').addClass('desktop_layer_show');
		desktop._layers[id].data({'shown':1});
		function showItem(item) {
			item.showLayer();
			if (!$.isEmptyObject(item.group) && !item.group.data.opened) {
				showItem(item.group);
			}
		}
		for(i=0;i<desktop._cells.length;i++) {
			if (desktop._cells[i].layer == id) {
				showItem(desktop._cells[i]);
			}
		}
		desktop._redraw++;
	},
	saveLayer:function (layer) {
		$.post('/constructor/file/'+desktop.file.id+'/saveLayer', {
			'json':1,'ajax':1,
			'data[id]':layer.id,
			'data[title]':layer.title,
			'data[shown]':layer.shown
		}, function (resp) {
			if (resp['status']!='ok') {
				osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
					document.location = "/constructor";
				});
			}
		},'json');
	},
	hideLayer:function(id,doSave) {
		var i;
		if (typeof (doSave) == 'undefined' || doSave) {
			for (i in desktop.file.layers) {
				if (desktop.file.layers[i].id == id) {
					desktop.file.layers[i].shown = 0;
					this.saveLayer(desktop.file.layers[i]);
					break;
				}
			}
		}
		$(".ico.visibility",desktop._layers[id]).removeClass('desktop_layer_show').addClass('desktop_layer_hide');
		desktop._layers[id].data({'shown':0});
		function checkGroupHide(group) {
			for (var i in group.cells) {
				if (group.cells[i]._visibleLayer) {
					return false;
				} else if (group.cells[i] instanceof Group && !checkGroupHide(group.cells[i])) {
					return false;
				}
			}
			return true;
		}
		function hideItem(item) {
			item.hideLayer();
			if (!$.isEmptyObject(item.group) && !item.group.data.opened) {
				if (checkGroupHide(item.group)) {
					hideItem(item.group);
				}
			}
		}
		for(i=0;i<desktop._cells.length;i++) {
			if (desktop._cells[i] instanceof Node && desktop._cells[i].layer == id) {
				hideItem(desktop._cells[i]);
			}
		}
		desktop._redraw++;
	},
    addConnection:function(conn) {
        var self = this;
        conn.bind('connection_remove', function () {
            for (var i in desktop._connections) {
                if (desktop._connections[i] == conn) {
                    delete conn;
                    self._connections.splice(i,1);
                    break;
                }
            }
            desktop._redraw++;
        });
        if (!conn.to._visible || !conn.from._visible) {
            conn.hide();
        }
        self._connections.push(conn);
    },
    connectNodes:function(fromNode, toNode, toSlot) {
        // доступен ли такой слот?
        //if (typeof(toNode.data.connections[toSlot])=="undefined") return false;
        var params = {
            json:1,
            from:fromNode.id,
            to:toNode.id,
            slot:toSlot
        };
        // сохраняем
        $.post('/constructor/file/'+desktop.file.id+'/connect',params,function (res) {
            if (res['status'] == 'ok') {
                toNode.data.connections[toSlot] = fromNode.id;
                toNode.update();
                toNode.updateConnections();
                desktop._redraw++;                
            } else {
                osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
                    document.location.reload();
                });
            }
            // чтобы исчезали тултипы со слотов после соединения ноды со слотом
            // чтобы менее костыльно убирать - надо переписать tooltip
            $('div.tooltip').remove();
        },'json');
    },
    disconnectNodes:function(slot) {
        // доступен ли такой слот?
        var params = {
            json:1,
            node:slot.cell.id,
            slot:slot.id
        };
        // сохраняем
        $.post('/constructor/file/'+desktop.file.id+'/disconnect',params,function (res) {
            if (res['status'] == 'ok') {
                slot.cell.data.connections[slot.id] = 0;
                slot.cell.update();
                slot.cell.updateConnections();
                desktop._redraw++;
            } else {
                osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
                    document.location.reload();
                });
            }
        },'json');
    },
    _saveTimeout:0,
    queueSavePos:function () {
        if (desktop._saveTimeout) clearTimeout(desktop._saveTimeout);
        desktop._saveTimeout = setTimeout(desktop.savePos,1000);
    },
    cancelSavePos: function () {
        if (desktop._saveTimeout) clearTimeout(desktop._saveTimeout);
    },
    savePos:function() {
        var params = {'json':1};
        params.nodes = {};
        params.groups = {};
		var i;
        for (i in desktop._cells) {
            if (desktop._cells[i]._visible && desktop._cells[i]._positionChanged) {
				desktop._cells[i]._positionChanged = false;
                if (desktop._cells[i] instanceof Node) {
                    params.nodes[desktop._cells[i].id] = {
                        x:desktop._cells[i].data.x,
                        y:desktop._cells[i].data.y
                    };
                } else {
                    params.groups[desktop._cells[i].id] = {
                        x:desktop._cells[i].data.x,
                        y:desktop._cells[i].data.y
                    };
                }
            }
        }
        params.x = desktop.container.position().left;
        params.y = desktop.container.position().top;
        params.zoom = desktop.zoom;
		params.layers = [];
        //params.layers = desktop.file.layers;
		for (i in desktop.file.layers) {
			if (desktop.file.layers[i].hasChanges) {
				desktop.file.layers[i].hasChanges = false;
				params.layers.push(desktop.file.layers[i]);
			}
		}
        $.post('/constructor/file/'+desktop.file.id+'/save_pos',params,function (res) {
            if (res['status'] == 'ok') {
                //osi.alert('Saved');
                //desktop.initFile(res['data']);
            } else {
                osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
                    document.location.reload();
                });
            }
        },'json');
    },
    updateConnections:function () {
        for (var i in this._cells) {
            this._cells[i].updateConnections();
        }
    },
    prevDeferred:false,
    readyDeferred:false,
    initFile:function (file) {
        this.readyDeferred = $.Deferred();
        this.file = file;
        this.constants = file.constants ? file.constants : [];
        this.clipboard = {
            nodes:file.clipboard.nodes ? file.clipboard.nodes : [],
            groups:file.clipboard.groups? file.clipboard.groups: [],
        }
        this.setNodes(file.nodes);
        this.setGroups(file.groups);
		this.setLayers(file.layers);
        this.ready();
        this._startDrawing();
		this.bind('selectionChange', function () {
			//console.log(desktop.selection);
			console.log('selection change');
			for (var i in desktop.selection) {
				var cell = desktop._cells[i];
				if (cell instanceof Node) {
					console.log('node : '+cell.id);
				} else if (cell instanceof Group) {
					console.log('group : '+cell.id);
				}
				console.log(cell);
			}
		});
		$("body").bind('keyup', function (event) {
			switch(event.keyCode) {
				case $.ui.keyCode.DELETE:
					if (event.target!=document.body) break;
					desktop.deleteSelection();
					break;
			}
			return true;
		});
        this.trigger('zoomChange');
        this.trigger('clipboardChange');
        this.trigger('selectionChange');
    },
	deleteSelection:function () {
		var cnt = 0;
		for (var j in desktop.selection) {
			cnt++;
		}
		if (!cnt) return;
		osi.confirm('Удалить?',function() {
			var nodeIds = [];
			var groupIds = [];
			var removeCells = [];
			for (var i in desktop.selection) {
				removeCells.push(i);
				var cell = desktop._cells[i];
				if (cell instanceof Node) {
					nodeIds.push(cell.data.id);
				} else if (cell instanceof Group) {
					groupIds.push(cell.data.id);
				}
			}
			removeCells = removeCells.sort();// сортируем, т.к. при удалении потом _cells будет splice-иться
			var params = {json:1,nodes:nodeIds,groups:groupIds};
			desktop.clearSelection(); // чистим selection что б потом не было багов
			$.post('/constructor/file/'+desktop.file.id+'/delete_multiple',params,function (res) {
				if (res['status']=='ok') {
					for (var i=removeCells.length-1; i >=0;i--) {
						desktop._cells[removeCells[i]].remove();
					}
				} else {
					osi.alert('Произошла ошибка. Приносим свои извинения.', function () {
						document.location.reload();
					});
				}
			},'json');                
		});
	},
    readyFuncs:[],
    isReady:false,
    ready:function (func) {
        if ($.isFunction(func)) {
            this.readyFuncs.push(func);
            if (this.isReady && this.readyFuncs.length === 1) {
                desktop.ready();
            }
        } else {
            this.isReady = true;
            if (this.readyFuncs.length) {
                this.readyFuncs[0].call();
                this.readyFuncs.shift();
                desktop.ready();
            }
        }
    },
	initTags:function(tags) {
		desktop.tags = tags;
		desktop.mtags = {};
		for (var nsId in desktop.tags) {
			desktop.mtags[nsId] = parseChildren(desktop.tags[nsId]);
		}
		function parseChildren(list) {
			var res = {};
			for(var i in list) {
				if ( list[i].children ) {
					res[list[i].name] = parseChildren(list[i].children);
				} else {
					res[list[i].name] = 1;
				}
			}
			return res;
		}
	},
	scrollTo:function(x,y){
		desktop.container.animate({
			'left':x+'px',
			'top':y+'px'
		},{duration:500, step:function () {
			desktop._redraw++;
		}, complete:function () {
			desktop.desktopDrag.css({
				'left':-desktop.container.position().left+'px',
				'top':-desktop.container.position().top+'px'
			});
			desktop._redraw++;
		}});
		desktop.queueSavePos();
	},
	parseHash:function () {
		var params = {};
		var hash = document.location.hash;
		if (hash) {
			hash = hash.substr(1);
			var items = hash.split('&');
			for(var i in items) {
				var kv = items[i].split('=',2);
				params[kv[0]] = (typeof (kv[1])!= "undefined") ? kv[1] : null;
			}
			document.location.hash = '';
		}
		return params;
	},
	updateByParams:function(params) {
		if (typeof params.zoom !="undefined" && typeof params.x !="undefined" && typeof params.y != "undefined") {
			desktop.setZoom(params.zoom, false);
			desktop.scrollTo(parseInt(params.x),parseInt(params.y));
		}
	},
    init:function () {
        this.container = $("#desktop");
        this.desktopDrag = $("#desktopDrag");
		var params = {};
		$(window).bind('hashchange', function() {
			var hash = document.location.hash;
			if (hash && hash!="#") {
				desktop.updateByParams(desktop.parseHash());
			}
		});
		params = desktop.parseHash();
		if (typeof params.x !="undefined") { this.settings.x = params.x };
		if (typeof params.y !="undefined") { this.settings.x = params.y };
		if (typeof params.zoom !="undefined") { this.settings.zoom = params.zoom };
        this.container.draggable({
            delay:100,
            handle:this.desktopDrag,
            drag:function (e) {
                desktop._redraw++;
            },
            start:function (event, ui) {
				console.log('drag start');
                desktop.cancelSavePos();
            },
            stop:function () {
                desktop.desktopDrag.css({
                    'left':-desktop.container.position().left+'px',
                    'top':-desktop.container.position().top+'px'
                });
                desktop.queueSavePos();
            },
            create: function(event, ui) { 
                desktop.container.css({
                    'left':desktop.settings.x+'px',
                    'top':desktop.settings.y+'px'
                });
            }
        });
        this.zoom = parseInt(desktop.settings.zoom);
        this.container.addClass('zoom-'+this.zoom);
        this.desktopDrag.css({
            'left':-desktop.container.position().left+'px',
            'top':-desktop.container.position().top+'px'
        });
        this.incomingsHelper = $("#fileIncomings").droppable({
            accept:function (obj) {
                if (!obj.hasClass('cellWrap')) return false;
                var cell = obj.data('model');
                if (!cell instanceof Node) return false;
                if (cell.data.type!=Node.TYPE_DATA) return false;
                if (cell.data.position!=Node.POSITION_INNER) return false;
                return true;
            },
            greedy:true,
            hoverClass:'droppable',
            drop:function (event,ui) {
                event.stopPropagation();
                var cell = ui.draggable.data('model');
                cell.data.position = Node.POSITION_INPUT;
                cell.save();
                desktop.incomings.push(cell);
                desktop.updateIncomings();
            }
        });
        this.outgoingsHelper = $("#fileOutgoings").droppable({
            accept:function (obj) {
                if (!obj.hasClass('cellWrap')) return false;
                var cell = obj.data('model');
                if (!cell instanceof Node) return false;
                if (cell.data.type!=Node.TYPE_FORMULA) return false;
                if (cell.data.position!=Node.POSITION_INNER) return false;
                return true;
            },
            greedy:true,
            hoverClass:'droppable',
            drop:function (event,ui) {
                event.stopPropagation();
                var cell = ui.draggable.data('model');
                cell.data.position = Node.POSITION_OUTPUT;
                cell.save();
                desktop.outgoings.push(cell);
                desktop.updateOutgoings();
            }
        });
        this.selectTypePopup = $("#selectNodeType").bind({
            'show':function () {
                var T = $(this);
                clearTimeout(T.data('hideTimeout'));
                T.data('hideTimeout',setTimeout(function() {
                    T.fadeOut(100);
                },2000));
            },
            'mouseover':function () {
                clearTimeout($(this).data('hideTimeout'));
            },
            'mouseleave':function() {
                var T = $(this);
                clearTimeout(T.data('hideTimeout'));
                T.data('hideTimeout',setTimeout(function() {
                    T.fadeOut(100);
                },2000));
            }
        });
        $(".popupMenuItem",this.selectTypePopup).unbind('click').click(function () {
            desktop.selectTypePopup.hide();
            var type = parseInt($(this).attr('rel'));
            switch (type) {
                case Node.TYPE_DATA:
                    desktop.face.newNode({
                        type:type,
                        x:desktop.scaleDragX(desktop.clickX),
                        y:desktop.scaleDragX(desktop.clickY)
                    });
                    break;
                case Node.TYPE_FORMULA:
                    desktop.face.newNode({
                        type:type,
                        x:desktop.scaleDragX(desktop.clickX),
                        y:desktop.scaleDragX(desktop.clickY)
                    });
                    break;
                default:
                    desktop.face.searchOp(desktop.clickX,desktop.clickY,type);
            }
        });
        this.container.click(function (e) {
            if (desktop.freezed) return;
            if (!$.isEmptyObject(desktop.selection)) {
                desktop.clearSelection();
                return;
            }
			if (!desktop.readonly) {
				desktop.clickX = e.pageX - desktop.container.offset().left;
				desktop.clickY = e.pageY - desktop.container.offset().top;
				desktop.selectTypePopup.css({
					'left':e.pageX,
					'top':e.pageY,
				}).show().trigger('show');
			}
        });
        this.canvas = document.getElementById('canvas');
        this.$canvas = $(this.canvas);
        this.canvasPos = this.$canvas.offset();
        this.canvas.width = this.container.width();
        this.canvas.height = this.container.height();
        this.ctx = this.canvas.getContext('2d');

        this._startDrawing();
		$("#copyLink").click(function () {
			var link = document.location.origin + document.location.pathname;
			link += "#zoom="+desktop.zoom;
			link += "&x="+desktop.container.position().left;
			link += "&y="+desktop.container.position().top;
			window.prompt ("Скопируйте линк: Ctrl+C, Enter", link);
		});
		$("#addLayer").click(function () {
			desktop.face.editLayer(0, '');
		});
		$("#toggleAllLayers").click(function () {
			var someShown = false;
			for (var i in desktop._layers) {
				if (desktop._layers[i].data('shown')===1) {
					someShown = true;
					break;
				}
			}
			if (someShown) {
				$(".ico",this).removeClass('desktop_layer_show').addClass('desktop_layer_hide');
			} else {
				$(".ico",this).removeClass('desktop_layer_hide').addClass('desktop_layer_show');
			}
			for (i in desktop._layers) {
				if (someShown) {
					if (desktop._layers[i].data('shown')===1) {
						desktop.hideLayer(i);
					}
				} else {
					if (desktop._layers[i].data('shown')===0) {
						desktop.showLayer(i);
					}
				}
			}
		});
        $('#constants').click(function(){
            desktop.editConstants(desktop.file.id);
        });
        $('#macroparams').click(function () {
            desktop.editMacroparams();
        });
        $('#copy').click(function(){
            desktop.copy();
        });
        $('#paste').click(function(){
            desktop.paste(desktop.file.id);
        });
        $("#zoomOut").click(function () {
            desktop.zoomOut();
        });
        $("#zoomIn").click(function () {
            desktop.zoomIn();
        });
		$("#editCell").click(function () {
			var cnt = 0;
			for (var i in desktop.selection) {cnt++}
			if (cnt == 1) {
				desktop._cells[i].element.trigger('open');
			}
		});
        $("#fileSettingsButton").click(function () {
            desktop.face.fileSettings(desktop.file.id);
        });
        $("#filePublic .value input").change(function () {
            desktop.face.filePublish(desktop.file.id, ($(this).attr('checked')=='checked')?1:0);
        });
        $("#nodesGroupButton").click(function () {
            desktop.face.newGroup();
        });
		$("#nodesUngroupButton").click(function () {
			var i,removeGroup = [];
			for (i in desktop.selection) {
				removeGroup.push(i);
			}
			for (i=0;i<removeGroup.length;i++) {
				desktop._cells[removeGroup[i]].clearGroup();
			}
		});
        $("#nodesArrangeButton").click(function(){
            desktop.face.arrange(desktop.file.id);
        });
        this.bind('zoomChange', function () {
            if (desktop.zoom == 4) {
                $("#zoomIn").addClass('inactive');
            } else if (desktop.zoom == -4) {
                $("#zoomIn").removeClass('inactive');
                $("#zoomOut").addClass('inactive');
            } else {
                $("#zoomIn").removeClass('inactive');
                $("#zoomOut").removeClass('inactive');
            }
        });
        this.bind('selectionChange', function () {
            if (!$.isEmptyObject(desktop.selection)) {
                $("#copy").removeClass('inactive');
                $("#nodesGroupButton").removeClass('inactive');
				var cnt = 0, group_items_cnt = 0;
				for(var i in desktop.selection){
					cnt++;
					if (!$.isEmptyObject(desktop._cells[i].group)) {
						group_items_cnt++;
					}
				};
				if (group_items_cnt > 0) {
					$("#nodesUngroupButton").removeClass('inactive');
				} else {
					$("#nodesUngroupButton").addClass('inactive');
				}
				if (cnt == 1) {
					$("#editCell").removeClass('inactive');
				} else {
					$("#editCell").addClass('inactive');
				}
				desktop.container.addClass('hasSelection');
            } else {
                $("#copy").addClass('inactive');
                $("#nodesGroupButton").addClass('inactive');
				$("#nodesUngroupButton").addClass('inactive');
				$("#editCell").addClass('inactive');
				desktop.container.removeClass('hasSelection');
            }
        });
        this.bind('clipboardChange', function () {
            if (desktop.clipboard.nodes.length || desktop.clipboard.groups.length) {
                $("#paste").removeClass('inactive');
            } else {
                $("#paste").addClass('inactive');
            }
        });
    },
    clearSelection : function () {
        for (var i in this._cells) {
            this._cells[i].deselect();
        }
    },
    updateIncomings: function () {
        var self = this;
        self.incomingsHelper.empty();
        if (!self.incomings.length) {
            self.incomingsHelper.html('Перетащите сюда элементы - входящие параметры');
            return;
        }
        for (var i in self.incomings) {
            self.incomingsHelper.append($('<div class="paramNode"></div>').text(self.incomings[i].data.name).data('model',self.incomings[i]).bind({
                'mouseenter':function () {
                    var cell = $(this).data('model');
                    cell.highlight();
                },
                'mouseleave':function () {
                    var cell = $(this).data('model');
                    cell.lowlight();
                },
                'click':function () {
                    var cell = $(this).data('model');
                    for (var i in self.incomings) {
                        if (self.incomings[i] == cell) {
                            cell.data.position = Node.POSITION_INNER;
                            cell.save();
                            self.incomings.splice(i,1);
                            break;
                        }
                    }
                    self.updateIncomings();
                }
            }));
        }
    },
    updateOutgoings: function () {
        var self = this;
        self.outgoingsHelper.empty();
        if (!self.outgoings.length) {
            self.outgoingsHelper.html('Перетащите сюда элементы - исходящие параметры');
            return;
        }
        for (var i in self.outgoings) {
            self.outgoingsHelper.append($('<div class="paramNode"></div>').text(self.outgoings[i].data.name).data('model',self.outgoings[i]).bind({
                'mouseenter':function () {
                    var cell = $(this).data('model');
                    cell.highlight();
                },
                'mouseleave':function () {
                    var cell = $(this).data('model');
                    cell.lowlight();
                },
                'click':function () {
                    var cell = $(this).data('model');
                    for (var i in self.outgoings) {
                        if (self.outgoings[i] == cell) {
                            cell.data.position = Node.POSITION_INNER;
                            cell.save();
                            self.outgoings.splice(i,1);
                            break;
                        }
                    }
                    self.updateOutgoings();
                }
            }));
        }
    },
    _getCellIndex:function (cell) {
        for (var i in this._cells) {
            if (this._cells[i] == cell) {
                return i;
            }
        }
        return -1;
    },
    _setCellEvents:function(cell) {
        cell.bind('select',function () {
            desktop.selection[desktop._getCellIndex(cell)] = true;
            desktop.trigger('selectionChange');
        });
        cell.bind('deselect',function () {
            delete desktop.selection[desktop._getCellIndex(cell)];
            desktop.trigger('selectionChange');
        });
        var dragStartPos = {};
        cell.bind('dragStart',function () {
            desktop.cancelSavePos();
            var cellIndex = desktop._getCellIndex(cell);
            for (var i in desktop.selection) {
                if (i!=cellIndex) {
                    dragStartPos[i] = desktop._cells[i].element.position();
                }
            }
        });
        cell.bind('drag',function (event, ui) {
            desktop._redraw++;
            for (var i in dragStartPos) {
                desktop._cells[i].element.css({
                    left:(dragStartPos[i].left + ui.position.left - ui.originalPosition.left)+'px',
                    top:(dragStartPos[i].top + ui.position.top - ui.originalPosition.top)+'px'
                });
            }
        });
        cell.bind('dragStop', function () {
            desktop._redraw++;
            for (var i in dragStartPos) {
                desktop._cells[i].data.x = desktop.scaleDragX(desktop._cells[i].element.position().left);
                desktop._cells[i].data.y = desktop.scaleDragX(desktop._cells[i].element.position().top);
                desktop._cells[i]._positionChanged = true;
            }
            dragStartPos = {};
            desktop.queueSavePos();
        });
        cell.bind('cell_remove', function () {
            var i;
            for (i in desktop.selection) {
                if (desktop._cells[i] == cell) {
                    delete desktop.selection[i];
					desktop.trigger('selectionChange');
                    break;
                }
            }
            for (i in desktop._cells) {
                if (desktop._cells[i] == cell) {
                    desktop._cells.splice(i,1);
					desktop.clearSelection();
                    break;
                }
            }
        });
    },
    _redraw:0,
    _drawing:0,
    _startDrawing:function () {
        if (desktop._drawing) return;
        desktop._drawing = 1;
        desktop._draw();
    },
    _draw:function() {
        if (desktop._redraw) {
            desktop._redraw = 0;
            desktop.clear();
            var i,j,k,shiftSlot,cons, con;
            for (i in desktop._connections) {
                con = desktop._connections[i];
                desktop._drawConnect(con);
            }
        }
        window.requestAnimationFrame(desktop._draw);
    },
    clear: function () {
        this.canvas.width = this.canvas.width;
    },
    _drawConnect: function (conn) {
        if (!conn._visible) return;
        var from = conn.from,to = conn.to;
        if (from == to) return;
        var pos1 = from.position();
        var pos2 = to.position();
        var cpos = this.canvasPos;
        var sx = pos1.left - cpos.left;
        var sy = pos1.top - cpos.top;
        var ex = pos2.left - cpos.left;
        var ey = pos2.top - cpos.top;
        var d = Math.max(Math.abs(ex-sx),Math.abs(ey-sy));
        var cx = Math.min(20,(ex-sx)/8);
        var cy = Math.min(100,d/6);
        this.ctx.beginPath();
		gradient = this.ctx.createLinearGradient(sx, sy, ex, ey);
		
		if (conn._highlighted) {
			if (!from.cell._visibleLayer) {
				gradient.addColorStop("0","#949494");
				gradient.addColorStop("0.5","#949494");
			} else {
				gradient.addColorStop("0","#ccc");
			}
			if (!to.cell._visibleLayer) {
				gradient.addColorStop("0.5","#949494");
				gradient.addColorStop("1","#949494");
			} else {
				gradient.addColorStop("1","#ccc");
			}
		} else {
			if (!from.cell._visibleLayer) {
				gradient.addColorStop("0","#949494");
				gradient.addColorStop("0.5","#949494");
			} else {
				gradient.addColorStop("0","#333");
			}
			if (!to.cell._visibleLayer) {
				gradient.addColorStop("0.5","#949494");
				gradient.addColorStop("1","#949494");
			} else {
				gradient.addColorStop("1","#333");
			}
		}
        /*if (conn._highlighted) {
            this.ctx.strokeStyle = '#000';
        } else {
            this.ctx.strokeStyle = '#ccc';
        }*/
		this.ctx.strokeStyle = gradient;
        this.ctx.moveTo(sx,sy);
        this.ctx.quadraticCurveTo(sx+cx,sy+cy,(ex+sx)/2,(ey+sy)/2);
        this.ctx.quadraticCurveTo(ex-cx,ey-cy,ex,ey);
        this.ctx.stroke();
    },
    _parseNodeName: function(name) {
        var matches = name.match(/^([A-Za-zа-яА-Я\s0-9]+?)([0-9]*)$/);
        if (matches) {
            matches.shift();
            if (!matches[1]) {
                matches[1] = 0;
            } else {
                matches[1] = parseInt(matches[1]);
            }
            return matches;
        }
        return [name,0];
    },
    bind:function () { this.container.bind.apply(this.container,arguments); },
    one:function () { this.container.one.apply(this.container,arguments); },
    trigger:function () { this.container.trigger.apply(this.container,arguments); }
}
var expression = {
    ops:[],
    get_vars:function (expr) {
        expr = $.trim(expr.toLowerCase());
        var p, i, j, res;
        for (i in desktop.constants) {
            expr = expr.replace(new RegExp("\\b"+$.trim(i.toLowerCase())+"\\b","g"),desktop.constants[i]);
        }
        for (i in expression.ops) {
            expr = expr.replace(new RegExp(expression.ops[i],"g")," ");
        }
        expr = $.trim(expr).replace(/\s\s+/g," ");
        var all = expr.split(' ');
        var res = [];
        for (i in all) 
            if(res.indexOf(all[i]) == -1)
                res.push(all[i])
        return res;
    }
}
// унификация для всех браузеров - callback, вызываемый при перерисовке canvas
if ( !window.requestAnimationFrame ) {
  window.requestAnimationFrame = ( function() {
    return window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
      window.setTimeout( callback, 1000 / 60 );
    };
  })();
}
