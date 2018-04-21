var Desktop_View_Controls = function Desktop_View_Controls() {
    Desktop_View_Controls.superclass.constructor.apply(this, []);
    var T = this;
    
    var zoomInClickHandler = function () {
        T.controller.zoomAction(T.controller.view.getZoomValue()+1);
    }
    var zoomOutClickHandler = function () {
        T.controller.zoomAction(T.controller.view.getZoomValue()-1);
    }
    var editCellClickHandler = function () {
        T.controller.showSelectionDetailsAction();
    }
    var removeCellClickHandler = function () {
        osi.confirm('Удалить?',function() {
            T.controller.deleteSelectionAction();
        });
    }
    var groupSelectionClickHandler = function () {
        T.controller.groupSelectionAction();
    }
    var ungroupSelectionClickHandler = function () {
        T.controller.ungroupSelectionAction();
    }
    var selectionChangeHandler = function () {
        T.update();
    }
    var copyClickHandler = function () {
        T.controller.copyAction();
    }
    var pasteClickHandler = function () {
        T.controller.pasteAction();
    }
    var setPickerColor = function (color) {
        if (typeof(color)=='undefined') {
            $(".ico",T.btnColorPicker).addClass('nocolor').css('background-color','none');
        } else {
            $(".ico",T.btnColorPicker).removeClass('nocolor').css('background-color',color);
            T.btnColorPicker.spectrum('set',color.toLowerCase());
        }
    }
    var rotateClickHandler = function () {
        T.controller.rotateSelectionAction();
    }
    this.update = function () {
        var selection = this.controller.getSelection();
        var showUngroup = false;
        if (selection.length > 0) {
            this.btnGroup.show();
            this.btnEditData.show();
            this.btnRemoveCell.show();
            var style = undefined;
            var multipleStyles = false;
            for (var i in selection) {
                if (selection[i].data.group) {
                    showUngroup = true;
                }
                if (style == undefined) {
                    style = selection[i].data.style;
                } else if (style != selection[i].data.style) {
                    multipleStyles = true;
                }
            }
            this.btnCopy.show();
            this.btnColorPicker.show();
            this.btnNodeRotate.show();
            if (multipleStyles) {
                setPickerColor();
            } else {
                setPickerColor(Desktop_View_Abstract.nodeStyles[style].fill.toLowerCase());
            }
        } else {
            this.btnCopy.hide();
            this.btnGroup.hide();
            this.btnEditData.hide();
            this.btnRemoveCell.hide();
            this.btnColorPicker.hide();
            this.btnNodeRotate.hide();
        }
        if (showUngroup) {
            this.btnUngroup.show();
        } else {
            this.btnUngroup.hide();
        }
        if ((this.controller.clipboard.nodes && this.controller.clipboard.nodes.length) || (this.controller.clipboard.groups && this.controller.clipboard.groups.length)) {
            this.btnPaste.show().css('display','block');
        } else {
            this.btnPaste.hide();
        }
    }
    this.init = function(file) {
        this.controller = file;
        this.controller.bind('change:selection', selectionChangeHandler);
        this.controller.bind('change:clipboard', selectionChangeHandler);
        this.html = $("#controlsTemplate").tmpl(file.dao);
        this.btnZoomIn = $("#zoomIn",T.html).click(zoomInClickHandler);
        this.btnZoomOut = $("#zoomOut",T.html).click(zoomOutClickHandler);
        this.btnEditData = $("#editCell",T.html).click(editCellClickHandler);
        this.btnRemoveCell = $("#removeCell",T.html).click(removeCellClickHandler);
        this.btnGroup = $("#nodesGroupButton",T.html).click(groupSelectionClickHandler);
        this.btnUngroup = $("#nodesUngroupButton",T.html).click(ungroupSelectionClickHandler);
        this.btnCopy = $("#copy",T.html).click(copyClickHandler);
        this.btnPaste = $("#paste",T.html).click(pasteClickHandler);
        this.btnColorPicker = $("#colorPicker", T.html);
        this.btnNodeRotate = $("#nodeRotate",T.html).click(rotateClickHandler);
        var i,j=-1, cnt = 0;
        var palette = [];
        for (i in Desktop_View_Abstract.nodeStyles) {
            if (cnt%4===0) {
                j++;
                palette[j] = [];
            };
            cnt++;
            palette[j].push(Desktop_View_Abstract.nodeStyles[i]['fill'].toLowerCase());
        }
        this.btnColorPicker.spectrum({
            showPaletteOnly: true,
            showPalette:true,
            color: palette[0][0],
            palette: palette,
            change: function (color, ind) {
                setPickerColor(color.toHexString().toLowerCase())
                var style = 0;
                for (var i in Desktop_View_Abstract.nodeStyles) {
                    if (Desktop_View_Abstract.nodeStyles[i].fill.toLowerCase() == color.toHexString().toLowerCase()) {
                        style = i;
                    }
                }
                var selection = T.controller.getSelection();
                for (var i in selection) {
                    selection[i].data.setStyle(style);
                }
            }
        });
        this.update();
    }
}
extend(Desktop_View_Controls, Desktop_View_HTML)