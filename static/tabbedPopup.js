var TabbedPopup = function (settings) {
    var self = this, i;
    this.popupId = TabbedPopup.popups.length;
    TabbedPopup.popups[this.popupId] = this;
    this.s = {
        cssClass:'',
        width:600,
        tabsLeft:[],
        tabsRight:[],
        buttons:'',
        hideButtons:false,
        autoShow:true
    };
    $.extend(this.s, settings);
    this.object = $('<div class="tabbedPopupWrap h"></div>').addClass(this.s.cssClass).data('object',this);
	this.object.append('<div class="tabbedPopupBck"></div>');
    this.object.click(function () { self.focus(); });
    var popup = $('<div class="tabbedPopup"></div>');
    var tabs = $('<div class="tabsLeft"></div>');
    this.activeTab = -1;
    var generateTab = function (tab) {
        return $('<div class="tab"></div>').data('tab',tab).addClass(tab.cssClass).html(tab.title).click(function () {
            if ($(this).hasClass('activeTab')) return;
            var prevTab = $(".tab.activeTab", self.object).removeClass('activeTab').data('tab');
            if(prevTab && typeof (prevTab.hide)!='undefined') {
                prevTab.hide.call(prevTab);
            }
            $(this).addClass('activeTab');
            self.content.html(tab.display.call(tab));
        });    
    }
    for (i in this.s.tabsLeft) {
        if (this.activeTab == -1 && typeof (this.s.tabsLeft[i].active) != "undefined" && this.s.tabsLeft[i].active) this.activeTab = i;
        tabs.append(generateTab(this.s.tabsLeft[i]));
    }
    popup.append(tabs);
    tabs = $('<div class="tabsRight"></div>');
    for (i in this.s.tabsRight) {
        if (this.activeTab == -1 && typeof (this.s.tabsRight[i].active) != "undefined" && this.s.tabsRight[i].active) this.activeTab = this.s.tabsLeft.length + parseInt(i);
        tabs.append(generateTab(this.s.tabsRight[i]));
    }
    if (this.activeTab == -1) this.activeTab = 0;
    popup.append(tabs);
    this.content = $('<div class="tabbedPopupContent"></div>');
    popup.append(this.content);
    this.object.append(popup);
    this.object.append($('<div class="tabbedPopupButtons'+(this.s.hideButtons ? ' h' :'')+'"></div>').append(this.s.buttons));
    if (typeof (this.s.x)=='undefined') {
        this.s.x = ($(document).width() - this.s.width) / 2;
    }
    if (typeof (this.s.y)=='undefined') {
        this.s.y = 100 + $(document).scrollTop();
    }
    this.object.css({left:this.s.x + 'px', top:this.s.y + 'px', 'min-width':this.s.width + 'px'});
    $(document.body).append(this.object);
    this.object.draggable({
		'handle':'.tabbedPopupBck'
	});
    if (this.s.autoShow) {
        this.show();
    }
}
TabbedPopup.popups = [];
TabbedPopup.activePopupId = -1;
TabbedPopup.prototype = {
    bind:function (eventName, func) {
        this.object.bind(eventName, func);
    },
    one:function (eventName, func) {
        this.object.one(eventName, func);
    },
    focus:function () {
        if (TabbedPopup.activePopupId == this.popupId) return;
        if (TabbedPopup.activePopupId!=-1 && TabbedPopup.popups[TabbedPopup.activePopupId]) {
            TabbedPopup.popups[TabbedPopup.activePopupId].blur();
        }
        TabbedPopup.activePopupId = this.popupId
        this.object.addClass('tabbedPopupWrapActive').trigger('focus');
    },
    blur:function () {
        TabbedPopup.activePopupId = -1;
        this.object.removeClass('tabbedPopupWrapActive').trigger('blur');
    },
    show:function () {
        this.object.show();
        $('.tab',this.object).eq(this.activeTab).click();
        this.object.trigger('show');
        this.focus();
    },
    hide:function () {
        var prevTab = $(".tab.activeTab", this.object).removeClass('activeTab').data('tab');
        if(prevTab && typeof (prevTab.hide)!='undefined') {
            prevTab.hide.call(prevTab);
        }
        this.object.hide();
        TabbedPopup.popups[this.popupId] = null;
        if (TabbedPopup.activePopupId == this.popupId) TabbedPopup.activePopupId = -1;
        this.blur();
        this.object.trigger('hide');
        // удаляем объект, чтобы корректно отобразить комментарии
        this.object.remove();
    },
    showButtons: function () {
        $(".tabbedPopupButtons",this.object).show();
    },
    hideButtons: function () {
        $(".tabbedPopupButtons",this.object).hide();
    }
};
