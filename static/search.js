var search = {
    popup:false,
    view:{
        form:false,
        searchQuery:false,
        searchResults:false
    },
    settings:{},
    searchTimeout:0,
    request:function (query) {
        var self = this;
        self.view.searchResults.empty();
        var params = {json:1,query:query};
        clearTimeout(self.searchTimeout);
        self.searchTimeout = setTimeout(function () {
            $.post('/constructor/search/operators',params,function (results) {
                if (results.status == 'ok') {
                    for (var i in results.data.operators) {
                        self.view.searchResults.append($('<div class="searchResultsItem">'+results.data.operators[i].title+'</div>').data('data',results.data.operators[i]).click(function () {
                            var data = $(this).data('data');
                            desktop.face.newNode({
                                operator_uid:data.id,
                                'type':Node.TYPE_OPERATOR,
                                name:data.title,
                                x:self.settings.mouseX,
                                y:self.settings.mouseY
                            });
                            self.popup.hide();
                        }));
                    }
                }
            },'json');
        },500);
    },
    show:function (settings) {
        var self = this;
        self.settings = settings;
		self.popup = new TabbedPopup({
			tabsLeft:[
				{
					cssClass:'',
					title:'Поиск оператора',
					display:function () {
						self.view.form = $('<div class="popupForm searchForm"></div>');
						self.view.searchQuery = $('<input class="formString searchQuery" type="text"/>')
							.bind('keyup',function () {
								self.request($(this).val());
							});
						self.view.catalogue = $("<div class='catalogue'></div>");
						function addItems(tags, container, path) {
							for (var id in tags) {
								var item = $("<div class='item'></div>");
								item.append($("<div class='title' rel='"+id+"'>"+tags[id].name+"</div>")).data({
									'item':tags[id],
									'path':path + tags[id].name
								});
								container.append(item);
								if (tags[id]['children']) {
									var children = $("<div class='children'></div>");
									item.click(function (e) {
										$("> .children",this).toggle();
										e.stopPropagation();
									});
									item.append(children);
									addItems(tags[id].children,children,path + tags[id].name + '.');
								} else {
									item.click(function (e) {
										self.view.searchQuery.val($(this).data('path'));
										self.request($(this).data('path'));
										e.stopPropagation();
									});
								}
							}
						}
						self.view.searchResults = $('<div class="formTable searchResults"></div>');
						self.view.form.append(self.view.searchQuery);
						self.view.form.append(self.view.catalogue);
						addItems(desktop.tags[1], self.view.catalogue,'');
						self.view.form.append(self.view.searchResults);
						return self.view.form;
					},
					fetch:function () {
						return 1;
					}
				}
			],
			autoShow:false,
			buttons:(function () {
				var btns = $('<div></div>')
				.append($('<div class="button buttonGrey"><em></em>Отмена</div>').click(function (e) {
					e.stopPropagation();
					self.popup.hide();
				}));
				return btns;
			})()
		});
        self.popup.show();
    }
}