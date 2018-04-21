/**
* Тултип
* 
* @constructor
* @class
* @extends Desktop_View_HTML
*/
var Desktop_View_Tooltip = function Desktop_View_Tooltip(text, controller) {
    Desktop_View_Tooltip.superclass.constructor.apply(this, []);
    var T = this;
    this.setText = function (text) {
        this.content.text(text);
        this.html.css('margin-left','-'+parseInt(this.html.outerWidth()/2)+'px');
        this.html.css('margin-top','-'+parseInt(this.html.outerHeight() + 10)+'px');
    }
    var _init = this.init;
    this.init = function (controller) {
        _init(controller);
        this.html.appendTo($("body"));
    }
    this.html = $("<div class='tooltipWrap'/>")
    this.content = $("<div class='tooltip'/>").appendTo(this.html);
    this.setText(text);

    this.show = function show() {
        this.html.stop().fadeIn(300);
    }
    this.showAt = function (x,y) {
        this.html.css({
            left:x+'px',top:y+50+'px'
        });
        this.show();
    }
    this.hide = function hide() {
        this.html.stop().fadeOut(300);
    }
}
extend(Desktop_View_Tooltip, Desktop_View_HTML)