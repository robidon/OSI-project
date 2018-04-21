var Desktop_View_Layer = function Desktop_View_Layer() {
    Desktop_View_Layer.superclass.constructor.apply(this, []);
    var T = this;
    this.id = 0;
    this.dao = {};
    var daoUpdateHandler = function () {
        T.update();
    }
    var itemClickHandler = function () {
        T.controller.scrollToLayerAction(T.dao);
    }
    var visibilityClickHandler = function () {
        T.controller.toggleLayerShownAction(T.dao);
    }
    var editBtnClickHandler = function () {
        osi.dialog($("#layerSettingsDialog"), {
            title:'Свойства',
            open:function () {
                $("#layer_title", this).val(T.dao.title);
            },
            buttons:{
                'Сохранить':function () {
                    var title = $("#layer_title", this).val();
                    if (!title) title = 'Новый слой';
                    var dialog = $(this);
                    T.dao.setTitle(title);
                    dialog.dialog('close');
                },
                'Отмена':function () {
                    $(this).dialog('close');
                },
                'Удалить':function () {
                    var dialog = $(this);
                    T.controller.removeLayerAction(T.dao, function (status) {
                        dialog.dialog('close');
                    });
                }
            },
            width:550
        });
    }
    var mouseupHandler = function (e) {
        T.trigger('mouseup', e);
    }
    var mouseenterHandler = function (e) {
        debug.status('layerId = '+T.id);
        for (var i in T.dao.nodes.items) {
            T.dao.nodes.items[i].setHighlighted(true);
        }
        $(this).addClass('droppable');
    }
    var mouseleaveHandler = function (e) {
        for (var i in T.dao.nodes.items) {
            T.dao.nodes.items[i].setHighlighted(false);
        }
        $(this).removeClass('droppable');
    }
    this.init = function (file, layerDao) {
        this.controller = file;
        this.dao = layerDao;
        this.id = layerDao.id;
        this.html = $("<div/>").attr('id','layer_'+layerDao.id);
        var templated = $("#layerTemplate").tmpl(_.extend(this.dao,{editable:(this.id && file.dao.user_access.edit) ? true : false}));
        this.html.append(templated);
        this.tmplItem = $.tmplItem(templated);

        layerDao.bind('update', daoUpdateHandler);
        layerDao.bind('set', daoUpdateHandler);
        $(this.html).delegate(".layer", 'mouseup', mouseupHandler);
        $(this.html).delegate(".layer", 'mouseenter', mouseenterHandler);
        $(this.html).delegate(".layer", 'mouseleave', mouseleaveHandler);
        $(this.html).delegate('.visibility', 'click', visibilityClickHandler);
        $(this.html).delegate(".title", 'click', itemClickHandler);
        $(this.html).delegate(".desktop_layer_edit", 'click', editBtnClickHandler);
    }
    var oldDestroy = this.destroy;
    this.destroy = function () {
        oldDestroy.call(this);
        if (this.dao) {
            this.dao.unbind('update', daoUpdateHandler);
        }
    }
    this.update = function () {
        this.tmplItem.update();
    }
}
extend(Desktop_View_Layer, Desktop_View_HTML);

var Desktop_View_LayersList = function Desktop_View_LayersList() {
    Desktop_View_LayersList.superclass.constructor.apply(this, []);
    var T = this;
    this.dao = {};
    this.layers = new Collection();
    this.html = '';
    var container;
    var layerMouseupHandler = function (e) {
        T.trigger('layerMouseup', e, this);
    }
    this.getLayersOrder = function () {
        var i,ids = container.sortable("toArray");
        for(i=0;i<ids.length;i++) {
            ids[i] = ids[i].substr(6);
        }
        return ids;
    }
    this.init = function (file,fileDao) {
        this.controller = file;
        this.dao = fileDao;
        this.html = $("#layersListTemplate").tmpl(this.dao);
        container = $("#fileLayers", this.html);
        container.sortable({ stop:function () {
            T.controller.saveLayersOrderAction();
        }});
        var i, layer;
        for (i=0;i<this.dao.layers.length;i++) {
            layer = new Desktop_View_Layer();
            layer.init(this.controller,this.dao.layers.at(i));
            layer.bind('mouseup', layerMouseupHandler);
            this.addLayer(layer);
        }
        this.dao.layers.bind('add', function (layerDao) {
            var layer = new Desktop_View_Layer();
            layer.init(T.controller,layerDao);
            layer.bind('mouseup', layerMouseupHandler);
            T.addLayer(layer);
        });
        this.dao.layers.bind('remove', function (layerDao) {
            var layer = T.layers.get(layerDao.id);
            if (layer) {
                layer.unbind('mouseup', layerMouseupHandler);
                T.removeLayer(layer);
            }
        });
        
        $("#toggleAllLayers", this.html).click(function () {
            T.controller.toggleAllLayersShownAction();
        });
        $("#addLayer",this.html).click(function () {
            osi.dialog($("#layerSettingsDialog"), {
                title:'Новый слой',
                open:function () {
                    $("#layer_title", this).val('Новый слой');
                },
                buttons:{
                    'Сохранить':function () {
                        var title = $("#layer_title", this).val();
                        if (!title) title = 'Новый слой';
                        var dialog = $(this);
                        T.controller.addLayerAction(title, function (status) {
                            //callback on save;
                            dialog.dialog('close');
                        });
                    },
                    'Отмена':function () {
                        $(this).dialog('close');
                    }
                },
                width:550
            });
        });
    }
    this.addLayer = function (layer) {
        if (!this.layers.add(layer)) return 0;
        container.append(layer.getHTML());
        return 1;
    }
    this.removeLayer = function (layer) {
        if (!this.layers.remove(layer)) return 0;
        layer.html.remove();
        return 1;
    }
    this.getHTML = function () {
        return this.html;
    }
}
extend(Desktop_View_LayersList, Bindable);