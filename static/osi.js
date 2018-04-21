jQuery.ajaxSetup({dataFilter: function(data, type){
    var prPos = data.indexOf('###PROFILER###');
    if (prPos > 0){
        var profile = data.slice(prPos);
        $('body .kohana:last').after(profile);
        data = data.slice(0, prPos);
    }
    return data;
} });
$(function () {
    osi.init();
});


var osi = {
    init: function () {
        histogram.init();
        this.menu.init();
        this.auth.init();
        threads.init();
        ajaxMngr.init();
    },
    menu:{
        init:function () {
            var submenu = $("#submenu");
            var submenuMenu = $(".menu",submenu);
            var submenuWrap = $(".wrap",submenu);
            var submenuCorners = $(".ctr, .cbr",submenu);
            var submenuSub = $(".sub",submenu);
            $("#menuMain li").each(function () {
                var T = $(this);
                var contents = $($("a",T).attr('rel'));
                if (!contents.length) return;
                T.mouseenter(function (e) {
                    clearTimeout(submenu.ht);
                    submenu.ht = 0;
                    submenuMenu.html(contents.html());
                    submenuWrap.removeClass('expanded');
                    submenuSub.hide().empty();
                    $("li",submenu).each(function(){
                        var TT = $(this);
                        var subcontents = $($("a",TT).attr('rel'));
                        if (!subcontents.length) return;
                        TT.mouseenter(function (e) {
                            TT.addClass('selected');
                            clearTimeout(submenu.sht);
                            submenuWrap.addClass('expanded');
                            submenuSub.html(subcontents.html());
                            submenuSub.show();
                            submenuCorners.css('width',submenuWrap.width()-2);
                            submenuSub.mouseenter(function () {
                                clearTimeout(submenu.sht);
                            }).mouseleave(function () {
                                clearTimeout(submenu.sht);
                                submenu.sht = setTimeout(function () {
                                    TT.removeClass('selected');
                                    submenuWrap.removeClass('expanded');
                                    submenuSub.fadeOut(100, function () {submenuSub.empty();});
                                    submenuCorners.css('width',submenuMenu.width()-2);
                                },500);
                            });
                        }).mouseleave(function (e) {
                            clearTimeout(submenu.sht);
                            submenu.sht = setTimeout(function () {
                                TT.removeClass('selected');
                                submenuWrap.removeClass('expanded');
                                submenuSub.fadeOut(100, function () {submenuSub.empty();});
                                submenuCorners.css('width',submenuMenu.width()-2);
                            },500);
                        });
                    });
                    submenu.css({
                        left:T.position().left,
                        top:T.position().top
                    });
                    submenu.show();
                    submenuCorners.css('width',submenuMenu.width()-2);
                    submenu.mouseenter(function (e) {
                        clearTimeout(submenu.ht);
                        submenu.ht = 0;
                    }).mouseleave(function(e) {
                        clearTimeout(submenu.ht);
                        submenu.ht = setTimeout(function () {
                            submenu.fadeOut(100);
                        },500);
                    });
                }).mouseleave(function (e) {
                    clearTimeout(submenu.ht);
                    submenu.ht = setTimeout(function () {
                        submenu.fadeOut(100);
                    },500);
                });
            });
        }
    },
    auth: {
        init: function () {
            $("#form_login input").keydown(function (e) {
                if (e.keyCode == 13) {
                    osi.auth.login($("#form_login #email").val(), $("#form_login #password").val());
                }
            });
            $("#form_login #btn_login").click(function() {
                osi.auth.login($("#form_login #email").val(), $("#form_login #password").val());
            });
        },
        login: function (email, psw) {
            var params = {
                'json':1,
                'email':email,
                'password':psw
            }
            $.post('/profile/login',params,function(resp){
                if (resp["status"]==1) {
                    if (osi.auth.referrer) {
                        document.location.href = osi.auth.referrer;
                    } else {
                        document.location.reload();
                    }
                } else {
                    osi.alert(resp["data"]);
                }
            },"json");
        }
    },
    dialog: function (html, params) {
        var dp = {
            width:'300px',
            title:'Внимание!',
            draggable:true,
            resizable:false,
            buttons:{'ok':function() {obj.dialog('close');}},
            open:function () {},
            close:function () {
				$(this).dialog('destroy');
				$("body").focus();
			}
        }
        $.extend(dp,params);
        var obj;
        if (typeof(html)=='object') {
            obj = html;
        } else {
            obj = $('<div>'+html+'</div>');
        }
        obj.dialog(dp);
        return obj;
    },
    alert: function (html, onclose, title) {
        this.dialog('<div align="center">'+html+'</div>', {'close':onclose,'title':title, draggable:false});
    },
    alertReload: function (message, url) {
        if (!message) { message = 'Что-то пошло не так... Страница будет перезагружена'; }
        var reload = false;
        if (!url) {
            reload = true;
        }
        this.alert(message, function () {
            if (reload) {
                document.location.reload();
            } else {
                document.location = url
            }
        });
    },
    confirm: function (html, onok, oncancel, title) {
        this.dialog('<div align="center">'+html+'</div>', {'close':oncancel,'title':title,draggable:false, buttons:{'Ok':function () {
            if (typeof(onok)!="undefined") onok();
            $(this).dialog('destroy');
			$("body").focus();
			//$(this).dialog('close');
        }}});
    },
    confirmYNC: function (html, onY, onN, onCancel, title) {
        this.dialog('<div align="center">'+html+'</div>', {'close':onCancel,'title':title,draggable:false, buttons:{'Да':function () {
            if (typeof(onY)!="undefined") onY();
            $(this).dialog('destroy');
            $("body").focus();
            //$(this).dialog('close');
        }, 'Нет':function() {
            if (typeof(onN)!="undefined") onN();
            $(this).dialog('destroy');
            $("body").focus();
        }}});
    },
    staticUrl: function(url) {
        return url;
    }
}

var User = function (data) {
    this.id = 0;
    this.name = '';
    this.photo = osi.staticUrl('/static/img/user_ava.jpg');
    this.profile_link = '/profile';
    $(this).extend(data);
}

var ajaxMngr = {
    messages:null,
    ajaxMessage: null,
    init: function(){
        var self = this;
        self.messages = new Array();
        $('#ajaxMessages div').each(function(){
            self.messages[this.id] = this.innerHTML;
        });
        self.ajaxMessage = $('#globalAjaxMessage');
        self.ajaxMessage.ajaxSend(function(){
            $(this).html('<p>'+self.messages['ajax_message_loading']+'</p>').show();
        });
        self.ajaxMessage.ajaxSuccess(function(){
            $(this).hide();
        });
        self.ajaxMessage.ajaxError(function(){
            $(this).html('<p>'+self.messages['ajax_message_error']+'</p>').show();
            setTimeout(function(){self.ajaxMessage.hide();}, 2000);
        });
        
        $(window).scroll(function() {
            if($(window).scrollTop() > (self.ajaxMessage.parent().offset().top) &&
            (self.ajaxMessage.parent().height() + self.ajaxMessage.parent().position().top - 30) > ($(window).scrollTop() + self.ajaxMessage.height())){
                self.ajaxMessage.animate({ top: ($(window).scrollTop() - self.ajaxMessage.parent().offset().top) + "px" },
                { duration: 100 });
            }
            else if($(window).scrollTop() <= (self.ajaxMessage.parent().offset().top)){
                self.ajaxMessage.animate({ top: "0px" },{ duration: 100 });
            }
        });
        
    }
}