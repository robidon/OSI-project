var texts = {
	actions : [{
			'css':'save',
			'title':'Сохранить',
			'click':function(event){
				event.stopPropagation();
				texts.save($(this).data('text'),false);
			}
		},{
			'css':'publish',
			'title':'Публиковать',
			'click':function(event){
				event.stopPropagation();
				texts.save($(this).data('text'),true);
			}
		},{
			'css':'cancel',
			'title':'Отменить изменения',
			'click':function(event){
				event.stopPropagation();
				$(".edit_content",$(this).data('text')).html($(this).data('text').data('htmlCode'));
				texts.initText($(this).data('text'));
			}
		}],
	init:function() {
		//hljs.initHighlightingOnLoad();
		$(".edit_text").each(function() {
			texts.initText($(this));
		});
	},
	initText:function(T) {
		T.removeClass('edit');
		if (!T.data('htmlCode')) {
			T.data('htmlCode',T.attr('value'));
		}
		if (!T.data('overlay')) {
            var w = T.width() + 10;
            var h = T.height() + 10;
			T.data('overlay',$("<div class='edit_text_overlay'></div>").css({'width':w+'px'}));
			T.prepend(T.data('overlay'));
		}
		T.data('overlay').html('');
		if (!T.data('tools')) {
			T.data('tools',$("<div class='edit_text_tools'></div>"));
			T.prepend(T.data('tools'));
		}
		T.data('tools').empty();
		T.data('tools').html('<em>'+T.attr('notice')+'</em>');
		T.bind({
			'mouseenter':function () {
				T.data('overlay').show().stop().animate({'opacity':1},300);
				T.data('tools').show().stop().animate({'opacity':1},600);
			},
			'mouseleave':function () {
				T.data('overlay').stop().animate({'opacity':0},300, function(){$(this).hide()});
				T.data('tools').stop().animate({'opacity':0},300, function(){$(this).hide()});
			},
			'dblclick':function() {
				T.unbind('mouseenter');
				T.unbind('mouseleave');
				T.unbind('dblclick');
				texts.editText(T);
			}
		});
	},
	editText:function(T) {
		T.addClass('edit');
		T.data('tools').empty();
		var newTools = $('<ul/>');
		T.data('tools').append(newTools);
		var i=0;
		for (i=0;i<texts.actions.length;i++) {
			var obj = $('<li class="'+texts.actions[i].css+'">'+texts.actions[i].title+'</li>');
			obj.click(texts.actions[i].click);
			obj.data('text',T);
			newTools.append(obj);
		}
		$(".edit_text_overlay",T).append($('<textarea class="htmlsource"></textarea>'));
		$(".edit_text_overlay .htmlsource", T).val(T.data('htmlCode')).show().width(T.width()-2).height(T.height()-2);
		$(".edit_text_overlay .htmlsource", T).wysiwyg();
		$(".edit_content",T).empty();
	},
	save:function(T, publish) {
		T.removeClass('edit');
		var val = $(".edit_text_overlay .htmlsource", T).val();
		var params = {
			'json':1,
			'name':T.attr('name'),
			'id':T.attr('rel'),
			'text':val
		}
		$.post("/admin/text/"+((publish)?"publish":"save"),params,function(resp) {
			if (resp["status"]==1) {
				$(".edit_text_tools",T).remove();
				$(".edit_text_overlay",T).remove();
				$(".edit_content",T).empty().html(val);
				T.removeClass('modified');
				if (!publish) {
					T.addClass('modified');
				}
				T.attr('value',val);
				T.removeData('htmlCode');
				T.removeData('overlay');
				T.removeData('tools');
				T.attr('rel',resp['data']);
				texts.initText(T);
			} else {
				alert('Произошла ошибка. Приносим свои извинения.');
			}
		},"json");
	}
}
$(function () {
    setTimeout(function () {
	texts.init();
    },1000);
});