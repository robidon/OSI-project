$.fn.extend({
	multicomplete:function (options) {
		var $elf = this;
		var self = $elf.get(0);
		var defaults = {
			splitter:'.',
			can_edit:false,
			source:{}
		}
		$.extend(defaults, options);
		options = defaults;
		function getDepth(src) {
			var md = 0, nd;
			for(var i in src) {
				if ($.isPlainObject(src[i])) {
					nd = getDepth(src[i]);
					if (nd > md) md = nd;
				}
			}
			return md+1;
		}
		options.maxDepth = getDepth(options.source);
		var $container = $(".multiComplete");
		if (!$container.length) {
			$container = $('<div class="multiComplete"></div>');
			$(document.body).append($container);
		}
		$container.empty();
		var $list = $('<div class="multiComplete-list"></div>');
		$container.append($list);
		$container.css({
			top:$elf.height() + $elf.offset().top,
			left:$elf.offset().left,
			width:$elf.width()
		});
		var curItem = '';
		var matchCount = 0;
		var matchedItem = '';
		var matchedItemChildren = false;
		var depth = 0;
		var path = [];
		if ($container.data('posInt')) {
			clearInterval($container.data('posInt'));
		}
		$container.data('posInt', setInterval(function () {
			$container.css({
				top:$elf.height() + $elf.offset().top,
				left:$elf.offset().left,
				width:$elf.width()
			});
			if (!$elf.length || !$elf.is(':visible')) {
				clearInterval($container.data('posInt'));
				$list.hide();
			}
		},100));
		function updateList() {
			var caretPos = $elf.getSelection().start;
			var cpos = 0, ppos = -1;
			var val = self.value;
			depth = 0;
			path = [];
			while ((cpos = val.indexOf(options.splitter,cpos)) !=-1) {
				path.push(val.substr(ppos + 1, cpos - ppos - 1));
				ppos = cpos;
				cpos+=1;
				if (cpos > caretPos) break;
				depth++;
				if (depth >= options.maxDepth) break;
			}
			curItem = val.substr(ppos+1);
			var curList = options.source;
			var i;
			for(i = 0;i<depth;i++){
				if (!curList[path[i]]) continue;
				curList = curList[path[i]];
			}
			$list.empty();
			var newItem;
			matchCount = 0;
			matchedItem = '';
			matchedItemChildren = false;
			var cnt = 0;
			if (depth > 0) {
				$list.append('<div class="multiComplete-list-caption">'+path[depth-1]+'.</div>')
			}
			if (!$.isPlainObject(curList)) {
				$list.append('<div class="multiComplete-list-empty">Нет вариантов</div>')
			}
			for (i in curList) {
				newItem = $('<div class="multiComplete-list-item">'+i+'</div>');
				newItem.data('value',i);
				newItem.data('hasChildren',$.isPlainObject(curList[i]));
				newItem.data('index',cnt);
				if (i.toLowerCase().indexOf(curItem.toLowerCase()) != -1) {
					newItem.addClass('highlighted');
					if (curSelection == matchCount) {
						newItem.addClass('selected');
					}
					matchCount++;
					matchedItem = i;
					if ($.isPlainObject(curList[i])) {
						matchedItemChildren = true;
					}
				}
				newItem.bind({
					'mouseenter':function () {
						$('.multiComplete-list-item',$list).removeClass('selected');
						$(this).addClass('selected');
					},
					'mouseleave':function () {
						$(this).removeClass('selected');
					},
					'mousedown':function() {
						curSelection = $(this).data('index');
						fill();
						curSelection = -1;
						updateList();
						return false;
					},
					'click':function (evt) {
						//curSelection = $(this).data('index');
						//$elf.focus();
					}
				});
				$list.append(newItem);
				cnt++;
			}
			$list.show();
		}
		function fill(val) {
			var newVal = '';
			for (var i=0;i<depth;i++) {
				newVal += path[i] + options.splitter;
			}
			var item = $(".selected",$list);
			if (item.length) {
				newVal += item.data('value') + (item.data('hasChildren') ? options.splitter : '');
			}
			self.value = newVal;
		}
		var curSelection = -1;
		$elf.bind({
			'click':function (event) {
				updateList();
			},
			'focus':function (event) {
				updateList();
			},
			'blur':function (event) {
				/*if (!options.can_edit) {
					var curList = options.source;
					for(i = 0;i<path.length;i++){
						if (!curList[path[i]]) {
							self.value = $elf.data('prev');
							return;
						}
						curList = curList[path[i]];
					}
					if (curItem) {
						if (!curList[curItem]) {
							self.value = $elf.data('prev');
							return;
						}
					}
				}*/
				$list.hide();
			},
			'keydown':function (event) {
				switch(event.keyCode) {
					case $.ui.keyCode.UP:
					case $.ui.keyCode.DOWN:
						event.preventDefault();
						event.stopPropagation();
						$(".multiComplete-list-item",$list).removeClass('selected');
						var $items = $(".multiComplete-list-item.highlighted",$list);
						if ($items.length) {
							if (event.keyCode == $.ui.keyCode.UP) {
								curSelection--;
								if (curSelection < 0) {
									curSelection = $items.length-1;
								}
							} else {
								curSelection++;
								if (curSelection >= $items.length) {
									curSelection = 0;
								}
							}
							$items.eq(curSelection).addClass('selected');
						}
						return false;
					case $.ui.keyCode.ENTER:
					case $.ui.keyCode.TAB:
						event.preventDefault();
						event.stopPropagation();
						if (curSelection != -1) {
							fill();
						} else if (matchCount === 1) {
							$(".highlighted",$list).addClass('selected');
							fill();
						}
						curSelection = -1;
						return false;
						break;
					default:
						curSelection = -1;
				}
			},
			'keyup': function( event ) {
				updateList();
				return;
			}
		});
		if ($elf.is(':focus')) {
			$elf.setSelection(self.value.length,self.value.length);
			updateList();
		}
	}
});