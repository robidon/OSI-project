(function ($) {
    $.fn.ediTable = function (params) {
        this.each(function () {
            var T = this;
            var $T = $(this);
            var def = {
                
            };
            var cells = [];
            var rows = [];
            function setCell(x,y,value) {
                cells[y][x].text(value);
            }
            function focusCell(x,y) {
                cells[y][x].focus();
            }
            var tHeight = $(".ediRow",T).length;
            var tWidth = 0;
            $(".ediRow",T).each(function(y) {
                cells[y] = [];
                rows[y] = $(this);
                tWidth = $(".ediCell",this).length;
                $(".ediCell",this).each(function (x) {
                    cells[y][x] = $(this).data({'x':x,'y':y});
                });
            });
            function setEvents(cells) {
                cells.each(function (i) {
                    this.contentEditable = 'true';
                }).bind({
                    'keypress':function (e) {
                        //console.log(e.charCode+' '+e.keyCode);
                        var el = $(this);
                        var x = el.data('x');
                        var y = el.data('y');
                        switch (e.keyCode) {
                            case 37: //left;
                                var sel = window.getSelection();
                                if (sel.getRangeAt(0).startOffset == 0) {
                                    if (x==0) break;
                                    focusCell(x-1,y);
                                    sel = window.getSelection();
                                    var range = sel.getRangeAt(0);
                                    range.selectNodeContents(sel.focusNode);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    sel.collapseToEnd();
                                    return false;
                                }
                                break;
                            case 39: //right;
                                var sel = window.getSelection();
                                if (sel.getRangeAt(0).startOffset == $(this).text().length) {
                                    if (x==tWidth-1) break;
                                    focusCell(x+1,y);
                                    sel = window.getSelection();
                                    var range = sel.getRangeAt(0);
                                    range.selectNodeContents(sel.focusNode);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    sel.collapseToStart();
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
                                if ((e.charCode < 48 || e.charCode>57) && e.charCode!=44 && e.charCode!=46
                                    && e.keyCode!=9 && e.keyCode!=8 && e.keyCode!=46 && e.keyCode!=36 && e.keyCode!=35
                                    && !e.ctrlKey) {
                                    return false;
                                }
                                break;
                        }
                    },
                    'paste':function (e) {
                        var el = $(this);
                        setTimeout(function() {
                            var text = el.text();
                            el = el.parent();
                            var lines = text.split(/\s*<br\/?>\s*/);
                            var i,j,clls;
                            var cur = el, next;
                            for (i=0;i<lines.length;i++) {
                                lines[i] = lines[i].replace(/[^\d,\.]/g,' ');
                                lines[i] = lines[i].replace(/,/g,'.');
                                clls = lines[i].split(/\s*[\;\t ]+\s*/);
                                for (j=0;j<clls.length;j++){
                                    cur.children().first().html(parseFloat(clls[j]));
                                    cur = cur.next();
                                    if (!cur) break;
                                }
                                next = el.parent().next();
                                if (!next) break;
                                cur = next.children().eq(el.prevAll().length);
                            }
                        }, 50);
                    }
                }).mouseenter(function () {
                    var el = $(this);
                    $(".ediTableSub").show().stop().animate({
                        left:Math.round(el.position().left + el.outerWidth()/2)+'px'
                    }).data('x',el.data('x'));
                });
            };
            setEvents($(".ediCell",T));
            
            $(".ediTableAddRight",T).click(function () {
                var y;
                for (y=0;y<tHeight;y++) {
                    var nc = $('<td><div class="ediCell">0</div></td>');
                    rows[y].append(nc);
                    cells[y].push($('.ediCell',nc).data({'x':tWidth,'y':y}));
                    setEvents($('.ediCell',nc));
                }
                tWidth++;
            });
            $(".ediTableAddLeft",T).click(function () {
                var y,x;
                for (y=0;y<tHeight;y++) {
                    var nc = $('<td><div class="ediCell">0</div></td>');
                    rows[y].prepend(nc);
                    for(x=0;x<tWidth;x++) {
                        cells[y][x].data('x',x+1);
                    }
                    cells[y].unshift($('.ediCell',nc).data({'x':0,'y':y}));
                    setEvents($('.ediCell',nc));
                }
                tWidth++;
            });
            $(".ediTableSub",T).click(function () {
                var y,x,rx = $(this).data('x');
                tWidth--;
                for (y=0;y<tHeight;y++) {
                    cells[y][rx].parent().remove();
                    cells[y].splice(rx,1);
                    for (x=rx;x<tWidth;x++) {
                        cells[y][x].data('x',x);
                    }
                }
            })
        });
        return this;
    };
})(jQuery);