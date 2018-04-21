var Thread = function (container, readonly) {
    var self = this;
    self.container = container;
    if (!self.container.length) return;
    
    self.readonly = false;
    if (typeof(readonly)!="undefined" && readonly) self.readonly = true;
    
    self.subject_type = self.container.attr('type');
    self.subject_id = self.container.attr('rel');
    self.current_thread_id = $('.posts',self.container).attr('rel');
    self.current_thread = '';
    self.direction = 1;//animation
    self.prependNewMessageForm = false;
    self.current_page = 0;
    self.reply_to_id = 0;
    $(".posts", self.container).each(function () {
        self.initActions($(this));
    });
    self.post_form = $(".newpost", self.container);
    self.processing = false;
    self.post_form.send = function () {
        if (!$(this).hasClass('modified')) return;
        if (self.processing) return;
        self.processing = true;
        var message = $("textarea",self.post_form).val();
        message = message.replace(/\n/g,"<br>");

        var params = {
            'json':1,
            'message':message,
            'subject_type':self.subject_type,
            'subject_id':self.subject_id,
            'thread_id':self.current_thread_id,
            'prev_page':self.current_page,
            'page':self.current_page
        }
        if (self.readonly) {
            params.readonly = 1;
        }
        if (self.reply_to_id) {
            params.reply_to = self.reply_to_id;
            self.reply_to_id = 0;
        }
        $.post('/forum/newpost',params, function (resp) {
            if (resp.status == 'ok') {
                $('textarea',self.post_form).val('');
                //self.post_form.removeClass('modified',false);
                self.current_thread_id = resp.data.thread_id;
                self.current_page = resp.data.page;
                self.updatethread(resp.data.html);
                //self.updatehash();
            } else {
                osi.alert(threads.default_error);
            }
            self.processing = false;
        },'json');
    }
    /*$('textarea',self.post_form).focus(function () {
        if (!self.post_form.hasClass('modified')) {
            $(this).val('');
        }
    }).blur(function () {
        if (!self.post_form.hasClass('modified')) {
            $(this).val(self.default_string);
        }
    }).keyup(function (e) {
        if ($(this).val()) {
            self.post_form.addClass('modified');
            if (e.ctrlKey && e.keyCode==13) {
                self.post_form.send.call(self.post_form);
            }
        } else {
            self.post_form.removeClass('modified',false);
        }
    });*/
    $('.submit',self.post_form).click(function() {self.post_form.send.call(self.post_form)});

}
Thread.prototype = {
    initActions: function (jObj, _updHash) {
        if (typeof(_updHash) == 'undefined'){_updHash = true;}
        var self = this;
        if (!self.current_thread_id) {
            self.current_thread_id = jObj.attr('rel');
        }
        self.current_thread = jObj;
        var posts = $(".post",jObj);
        posts.each(function () {
            var post = $(this);
            $(".reply",this).click(function () {
                self.reply_to_id = post.attr('rel');
                self.post_form.detach();
                var userId = $(this).parent().parent().parent().find('.author_ava').attr('rel');
                $('textarea', self.post_form).val('@user_'+userId+', ').parent().parent().addClass('modified');
                post.append(self.post_form);
                return false;
            });
            $(".sub_thread_link",this).click(function () {
                self.loadpage($(this).attr('rel'),0,_updHash);
                return false;

                });
            $(".vote_add",this).click(function () {
                post.prepend(threads.vote_reasons_add);
                threads.vote_reasons_add.show();
            });
            $(".vote_sub",this).click(function () {
                post.prepend(threads.vote_reasons_sub);
                threads.vote_reasons_sub.show();
            });
        });
        $(".back", jObj).click(function () {
            self.direction = -1;
            self.loadpage($(this).attr('rel'), $(this).attr('page'),_updHash);
            return false;
        });
        $(".next_page", jObj).click(function () {
            self.loadpage(self.current_thread_id, self.current_page+1,_updHash);
            return false;
        });
        $(".prev_page", jObj).click(function () {
            self.direction = -1;
            self.loadpage(self.current_thread_id, self.current_page-1,_updHash);
            return false;
        });
    },
    updatethread: function(html) {
        var self = this;
        self.post_form.detach();
        var params = {direction:'left'}
        if (self.direction===-1) params.direction = 'right';
        self.current_thread.hide('fade', params, 150, function () {
            self.current_thread.html(html);
            self.initActions(self.current_thread);
            var params = {direction:'right'}
            if (self.direction===-1) params.direction = 'left';
            self.current_thread.show('fade', params, 300, function () {
                if (self.prependNewMessageForm) {
                    self.current_thread.prepend(self.post_form);
                } else {
                    self.current_thread.append(self.post_form);
                }
            });
        });
    },
    loadpagesubj:function(subjecttype,subjectid, page, _updHash) {
        var params = {
            'json':1,
            'stype':subjecttype,
            'sid':subjectid,
            'page':page,
            'from_page':this.current_page
        };
        this._load(params,page,_updHash);
        this.subject_id = subjectid;
        this.subject_type = subjecttype;
    },
    loadpage:function(threadid, page, _updHash) {
        var params = {
            'json':1,
            'id':threadid,
            'page':page,
            'from_page':this.current_page
        };
        this._load(params,page,_updHash);
    },
    _load:function (params,page,_updHash) {
        if (typeof(_updHash) == 'undefined'){ _updHash = true; }
        var self = this;
        if (self.processing) return;
        self.processing = true;
        if (self.readonly) {
            params.readonly = 1;
        }
        $.post('/forum/thread',params, function (resp) {
            if (resp.status == 'ok') {
                self.current_thread_id = parseInt(resp.data.thread_id);
                self.current_page = parseInt(page);
                self.updatethread(resp.data.html);
                if (_updHash){threads.updatehash(self.id, self.current_thread_id, self.current_page);}
            } else {
                console.error('Ошибка загрузки поста',resp);
                //osi.alert('Ошибка загрузки поста');
            }
            self.processing = false;
        },'json');
    }
}
var threads = {
    updHash: true,
    threads:[],
    activeThreadId:-1,
    add:function (obj, readonly) {
        var self = threads;
        var id = obj.attr('rel');
        var type = obj.attr('type');
        if (typeof (self.threads[type])=="undefined") {
            self.threads[type] = [];
        }
        var th = new Thread(obj, readonly);
        self.threads[type][id] = th;
        return th;
    },
    init:function () {
        var self = threads;
        $(".threads").each(function () {
            self.add($(this));
        });
        self.vote_reasons_add = $(".vote_reasons.positive");
        self.vote_reasons_sub = $(".vote_reasons.negative");
        self.vote_reasons_add.detach();
        self.vote_reasons_sub.detach();
        var showReasonsTimeout = 0;
        self.vote_reasons_add.add(self.vote_reasons_sub).mouseleave(function () {
            var T = $(this);
            clearTimeout(showReasonsTimeout);
            showReasonsTimeout = setTimeout(function () {
                T.hide();
                T.detach();
            },1500);
        }).mouseenter(function () {
            clearTimeout(showReasonsTimeout);
        });
        $("li",self.vote_reasons_add).add("li",self.vote_reasons_sub).click(function () {
            var post_id = $(this).parent().parent().attr('id');
            post_id = post_id.substr(post_id.indexOf('_')+1);
            self.votepost(post_id, $(this).attr('rel'));
        });
        
        var params = document.location.hash.substr(1).split("&");
        var load_thread_id = 0, subject_type = 0, subject_id = 0, load_page = 0;
        for (var i=0;i<params.length;i++) {
            var pp = params[i].split('=');
            switch (pp[0]) {
                case "subject_id":
                    subject_id = pp[1];
                    break;
                case "subject_type":
                    subject_type = pp[1];
                    break;
                case "thread":
                    load_thread_id = pp[1];
                    break;
                case "page":
                    load_page = pp[1];
                    break;
            }
        }
        if (load_thread_id) {
            if (typeof (threads[subject_type][subject_id]!="undefined")) {
                threads[subject_type][subject_id].loadpage(load_thread_id, load_page, false);
            }
        }

    },
    default_string:'Напишите свой комментарий здесь',
    default_error:'Произошел сбой. Приносим свои извинения. Попробуйте обновить страницу.',
    updatehash:function (subject_id, subject_type, thread_id, current_page) {
        if (threads.updHash){
            document.location.hash = 'subject_id='+subject_id+'&subject_type='+subject_type+'&thread='+thread_id+'&page='+current_page;
        }
    },
    votepost: function (postId, reason) {
        var self = threads;
        if (self.processing) return;
        self.processing = true;
        self.vote_reasons_add.hide().detach();
        self.vote_reasons_sub.hide().detach();
        $.post('/forum/vote',{ajax:1,json:1,post:postId,reason:reason},function (resp) {
            self.processing = false;
            if (resp['status'] == 'ok') {
                $("#post_"+postId+" .rating").text(resp['data']['rating']);
                $("#post_"+postId+" .vote_add, #post_"+postId+" .vote_sub").hide();
            } else {
                osi.alert('Произошла ошибка. Приносим свои извинения. Попробуйте обновить страницу.');
            }
        },'json')
    }
}
