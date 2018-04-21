(function ($) {
  "use strict";
  /**
   * Handsontable EditColumns extension. See `demo/buttons.html` for example usage
   * @param {Object} instance
   * @param {Array|Boolean} [labels]
   */
  Handsontable.PluginHooks.add('beforeInitWalkontable', function (walkontableConfig) {
    var instance = this;
    if (instance.getSettings().EditColumns) {

        var selectedIndex = -1;
        var getColumnPlace = function (td) {
            return instance.rootElement.find('.columnPlace').eq(selectedIndex);
            //return $(td).parents('tr').find('th.htRemoveRow').eq(0).find('.btn');
        };

        var offsetElement = instance.rootElement.parent().parent();
        var offset = instance.rootElement.position();
        instance.rootElement.on('mouseover', 'tbody th, tbody td', function () {
            if ($(this).index()>1) {
                selectedIndex = $(this).index();
                var place = getColumnPlace(this).show();
                movable.css({
                    left:place.offset().left - offsetElement.offset().left - offset.left + offsetElement.scrollLeft() + 'px',
                    top:(place.offset().top - offsetElement.offset().top - offset.top - 17) + 'px',
                    width:place.width()+'px'
                }).show();
            }
        });
        offsetElement.mouseleave(function () {
            movable.hide();
            selectedIndex = -1;
        });
        instance.rootElement.addClass('htEditColumns');
        var movable = $("<div/>")
            .addClass("editColumnsBtns")
            .append('<div class="btnAddLeft"></div><div class="btnAddRight"></div><div class="btnRemove"></div>')
        offsetElement.prepend(movable);
        
        $(".btnRemove",movable).bind('click', function () {
            if (selectedIndex!=-1) {
                instance.alter("remove_col", selectedIndex);
            }
        });
        $(".btnAddLeft",movable).bind('click', function () {
            if (selectedIndex!=-1) {
                instance.alter("insert_col", selectedIndex);
            }
        });
        $(".btnAddRight",movable).bind('click', function () {
            if (selectedIndex!=-1) {
                instance.alter("insert_col", selectedIndex+1);
            }
        });

        var baseColHeaders = walkontableConfig.columnHeaders;
        walkontableConfig.columnHeaders = function () {
            var pluginEnabled = Boolean(instance.getSettings().EditColumns);
            var newColHeader = function (col, elem) {
                var child, div;
                while (child = elem.lastChild) {
                    elem.removeChild(child);
                }
                //elem.className = 'htNoFrame htRemoveRow';
                if (col > -1) {
                    $(elem).append($('<div class="columnPlace"></div>'));

                    $(div).on('mouseup', function () {
                        instance.alter("remove_col", col);
                    });
                }
            };

            return pluginEnabled ? Array.prototype.concat.call([], newColHeader, baseColHeaders()) : baseColHeaders();
        }
    }
    /*
    var that = this;
    this.priority = 1;
    this.className = 'htEditColumns';
    this.instance = instance;
    this.labels = labels;
    
    instance.blockedRows.main.on('click', 'th.htEditColumns .btnRemove', function () {
      instance.alter("remove_col", $(this).parents('th').index());
    });
    instance.blockedRows.main.on('click', 'th.htEditColumns .btnAddLeft', function () {
      instance.alter("insert_col", $(this).parents('th').index());
    });
    instance.blockedRows.main.on('click', 'th.htEditColumns .btnAddRight', function () {
      instance.alter("insert_col", $(this).parents('th').index()+1);
    });
    instance.container.on('mouseenter', 'th, td', function () {
        if ($(this).index())
            that.getButtons(this).show();
    });
    instance.container.on('mouseleave', 'th, td', function () {
        if ($(this).index())
            that.getButtons(this).hide();
    });

    instance.container.addClass('htEditColumns');
    instance.blockedRows.addHeader(this);
  };

  Handsontable.extension.EditColumns.prototype.columnLabel = function (index) {
      if (index==0) return '';
    return '<div class="editColumnsBtns"><div class="btnAddLeft"></div><div class="btnAddRight"></div><div class="btnRemove"></div></div>';
  };


  Handsontable.extension.EditColumns.prototype.getButtons = function (td) {
    return this.instance.blockedRows.main.find('th.htEditColumns .editColumnsBtns').eq($(td).index()-1);
  };*/
  });
})(jQuery);
