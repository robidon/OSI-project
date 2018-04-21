function getInputSelection(el) {
    var start = 0, end = 0, normalizedValue, range,
        textInputRange, len, endRange;

    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        start = el.selectionStart;
        end = el.selectionEnd;
    } else {
        range = document.selection.createRange();

        if (range && range.parentElement() == el) {
            len = el.value.length;
            normalizedValue = el.value.replace(/\r\n/g, "\n");

            // Create a working TextRange that lives only in the input
            textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());

            // Check if the start and end of the selection are at the very end
            // of the input, since moveStart/moveEnd doesn't return what we want
            // in those cases
            endRange = el.createTextRange();
            endRange.collapse(false);

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart("character", -len);
                start += normalizedValue.slice(0, start).split("\n").length - 1;

                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    end = len;
                } else {
                    end = -textInputRange.moveEnd("character", -len);
                    end += normalizedValue.slice(0, end).split("\n").length - 1;
                }
            }
        }
    }

    return {
        start: start,
        end: end
    };
}
var EditableVector = {
    generate:function(data, settings) {
        var defaults = {
			readonly:false,
            height:2
        }
        $.extend(defaults,settings);
		settings = defaults;
        var cells = [];
        var rows = [];
        var tHeight = settings.height;
        var tWidth = 0;
        var wrapper = $('<div class="ediTableWrap"></div>');
        wrapper.data('settings', settings);
        wrapper.data('data', data);
        wrapper.data('cells', cells);
		if (!settings.readonly) {
			wrapper.append($('<div class="ediTableAdd ediTableAddLeft">+</div>').click(function () {
				var y,x;
				setCell(tWidth,0,0);
				setCell(tWidth-1,1,0);
				for (x=tWidth-1;x>0;x--) {
					setCell(x,0,getCell(x-1,0));
					setCell(x,1,getCell(x-1,1));
				}
			}));
			wrapper.append($('<div class="ediTableAdd ediTableAddRight">+</div>').click(function () {
				var y,x;
				setCell(tWidth,0,0);
				//setCell(tWidth-1,1,0);
			}));
			wrapper.append($('<div class="ediTableSub">-</div>').click(function () {
				var y,x,rx = $(this).data('x');
				tWidth--;
				for (y=0;y<tHeight;y++) {
					cells[y][rx].parent().remove();
					cells[y].splice(rx,1);
					for (x=rx;x<tWidth;x++) {
						cells[y][x].data('x',x);
					}
				}
			}));
		}
        var table = $('<table class="ediTable" cellspacing="1"></table>');
        wrapper.append(table);
        
        var curCellX = -1;
        var curCellY = -1;
        var editCell = $('<textarea id="ediCellValue'+Math.random()+'" class="ediCellValue"></textarea>').css({
            resize:'none'
        });
        editCell.bind({
            'keydown':function (e) {
                var el = $(this);
                var x = el.parent().data('x');
                var y = el.parent().data('y');
                switch (e.keyCode) {
                    case 37: //left;
                        var caretPos = $(this).getSelection().start;
                        if (caretPos == 0) {
                            if (x==0) break;
                            focusCell(x-1,y);
                            var len = $(this).val().length;
                            $(this).setSelection(len,len)
                            return false;
                        }
                        break;
                    case 39: //right;
                        var caretPos = $(this).getSelection().end;
                        if (caretPos == $(this).val().length) {
                            if (x==tWidth-1) break;
                            focusCell(x+1,y);
                            $(this).setSelection(0,0)
                            return false;
                        }
                        break;
                    case 38: //up;
                        if (y==0) break;
                        focusCell(x,y-1);
                        break;
                    case 40: //down;
                        if (y==tHeight-1) break;
                        focusCell(x,y+1);
                        break;
                    case 9: // tab
                        if (e.shiftKey) {
                            if (x == 0) {
                                y--; x = tWidth-1;
                            } else {
                                x--;
                            }
                        } else {
                            if (x >= tWidth-1) {
                                y++; x = 0;
                            } else {
                                x++;
                            }
                        }
                        if (x >=0 && x < tWidth && y>=0 && y<tHeight) {
                            focusCell(x,y);
                            var sel = window.getSelection();
                            var range = sel.getRangeAt(0);
                            range.selectNodeContents(sel.focusNode);
                            sel.removeAllRanges();
                            sel.addRange(range);
                            return false;
                        }
                        break;
                    default:
                        if ((e.keyCode < 48 || e.keyCode>57) && e.keyCode!=44 && e.keyCode!=189 && e.keyCode!=109 && e.keyCode!=46 && e.keyCode!=189 && e.keyCode!=188
                            && e.keyCode!=9 && e.keyCode!=8 && e.keyCode!=46 && e.keyCode!=36 && e.keyCode!=35
                            && !e.ctrlKey) {
                            //return false;
                        }
                        break;
                }/**/
            },
            'keypress':function (e) {
                if ((e.charCode < 48 || e.charCode>57) && e.charCode!=44 && e.charCode!=45 && e.charCode!=46
                    && e.keyCode!=9 && e.keyCode!=8 && e.keyCode!=46 && e.keyCode!=36 && e.keyCode!=35 && e.keyCode!=37 && e.keyCode!=38 && e.keyCode!=39 && e.keyCode!=40
                    && !e.ctrlKey) {
                    return false;
                }
            },
            'paste':function (e) {
                var el = $(this);
                el.val('');
                setTimeout(function() {
                    var text = el.val();
                    text = text.replace(/[^\s\-\d,\.\r]/g,'');
                    text = text.replace(/,/g,'.');
                    el = el.parent();
                    var lines = text.split(/\n/);
                    var i,j,clls;
                    var cur = el, next;
                    var x = curCellX, y = curCellY;
                    unfocusCell(false);
                    for (i=0;i<lines.length;i++) {
                        clls = lines[i].split(/\s*[\;\t]+\s*/);
                        if (!clls || !lines[i]) continue;
                        for (j=0;j<clls.length;j++){
                            if (i==0 && j==0) {
                                el.val(parseFloat(clls[j]));
                            }
                            setCell(x + j,y+i,parseFloat(clls[j]));
                        }
                    }
                }, 50);
                return true;
            }
        });
        function focusCell(x,y) {
            unfocusCell(true);
			if (settings.readonly) return false;
            var cell = cells[y][x];
            var w = cell.width()+'px'; h = cell.height()+'px';
            editCell.css({'width':w,'height':h,'max-width':w,'max-height':h,'min-width':w,'min-height':h});
            cell.data('prevValue',cell.data('value')).empty().append(editCell);
            curCellX = x;
            curCellY = y;
            editCell.val(cell.data('prevValue')).focus().keyup(function () {
                cells[curCellY][curCellX].data('value',$(this).val());
            });
            var len = editCell.val().length;
            editCell.setSelection(len,len);
        }
        function unfocusCell(doUpdate) {
            if (curCellX==-1 && curCellY==-1) return;
            if (typeof(cells[curCellY])=='undefined' || typeof(cells[curCellY][curCellX])=="undefined") return;
            if (typeof(doUpdate)=='undefined') doUpdate = true;
            editCell.detach();
            var val = doUpdate ? editCell.val() : cells[curCellY][curCellX].data('prevValue');
            cells[curCellY][curCellX].text(val).data('value',val);
            checkDuplicates(curCellX, curCellY);
            curCellX=-1;
            curCellY=-1;
        }
        function checkDuplicates(x,y) {
            if (y==0) {
                cells[y][x].removeClass('duplicateKey');
                cells[y][x].attr('title','')
                var value = cells[y][x].data('value');
                for (var i=0;i<cells[y].length;i++) {
                    if (i!=x && cells[y][i].data('value') == value && !cells[y][i].hasClass('duplicateKey')) {
                        cells[y][x].addClass('duplicateKey');
                        cells[y][x].attr('title','Повторение значения. Будет удалено.')
                        break;
                    }
                }
            }
        }
        function setEvents(cell) {
            cell.bind({
                'click':function(e) {
                    focusCell($(this).data('x'),$(this).data('y'));
                }
            }).mouseenter(function () {
                var el = $(this);
                $(".ediTableSub").show().stop().animate({
                    left:Math.round(el.position().left + el.outerWidth()/2)+'px'
                }).data('x',el.data('x'));
            });
        };
        function setCell(x,y,value) {
            if (x >= tWidth) {
                var i,j;
                for (i=tWidth;i<=x;i++) {
                    for(j=0;j<tHeight;j++) {
                        cells[j][i] = $('<div class="ediCell"></div>').data({'x':i,'y':j,'value':0}).text(0);
                        setEvents(cells[j][i]);
                        rows[j].append($('<td class="ediCellWrap"></td>').append(cells[j][i]));
                    }
                }
                tWidth = x+1;
            }
            cells[y][x].text(value).data('value',value);
            checkDuplicates(x,y);
        }
        function getCell(x,y) {
            return cells[y][x].data('value');
        }
        
        rows[0] = $('<tr class="ediRow"></tr>');
        rows[1] = $('<tr class="ediRow"></tr>');
        table.append(rows[0]);
        table.append(rows[1]);
        cells[0] = [];cells[1] = [];
        var x=0;
        for (var key in data) {
            setCell(x,0,key);
            setCell(x,1,data[key]);
            x++;
        }
        
        return wrapper;
    },
    fetch:function(wrapper) {
        var cells = wrapper.data('cells');
        var data = {};
        for (var j in cells[0]) {
            data[cells[0][j].data('value')] = cells[1][j].data('value');
        }
        return data;
    }
}
