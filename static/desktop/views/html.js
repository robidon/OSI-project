/**
* Абстрактный класс для всех представлений, которые рендерят html код
* 
* @constructor
* @class
* @extends Bindable 
*/
var Desktop_View_HTML = function Desktop_View_HTML() {
    Desktop_View_HTML.superclass.constructor.apply(this, []);
    var T = this;
    this.html = '';
    this.controller = {};
    this.init = function (controller) {
        this.controller = controller;
    }
    this.destroy = function () {
        this.html.remove();
    }
    this.getHTML = function () {
        return this.html;
    }
}
extend(Desktop_View_HTML, Bindable)