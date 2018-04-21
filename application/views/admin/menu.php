<? include "inc/top.php"; ?>
<style>
.menu li {
    list-style:none;
    margin-bottom:4px;
}
.iteminfo {
    padding:4px 10px;
    margin-bottom:4px;
}
.iteminfo div {
    font-size:11px;
    font-family:Tahoma;
}
.iteminfo:hover {
    background:#c0c0c0;
}
.iteminfo.link {
    overflow:hidden;
}
</style>
<h1>Настройка меню сайта</h1>
<?
    $menus = array();
    foreach ($menu as $item) {
        if (!isset($menus[$item->menu_id])) {
            $menus[$item->menu_id] = array();
        }
        if (!isset($menus[$item->menu_id][$item->parent])) {
            $menus[$item->menu_id][$item->parent] = array();
        }
        $menus[$item->menu_id][$item->parent][] = $item;
    }
?>
<? function render(&$menus, $menu_id, $parent) {
    ?><ul class="sub">
        <? if (isset($menus[$menu_id][$parent])) : ?>
        <? foreach ($menus[$menu_id][$parent] as $item) : ?>
            <?
            /**
            * @var $item Model_Dao_Menu
            */
            ?>
            <li id="item_<?=$item->id?>" rel="<?=$item->id?>">
                <div class="iteminfo" rel="<?=$item->id?>">
                    <div class="button fl-l"><em></em>Edit</div>
                    <div class='id fl-l w-20'>&nbsp;(<?=$item->id?>) &nbsp;</div>
                    <div title="<?=htmlspecialchars($item->title)?>" class='title fl-l w-200'><?=$item->title?></div>
                    <div title="<?=htmlspecialchars($item->link)?>" class='link fl-r w-200'><?=$item->link?></div>
                    <div class="h more"><?=$item->more?></div>
                    <div class="h target"><?=$item->target?></div>
                    <div class="h tooltip"><?=$item->tooltip?></div>
                    <div class="h parent"><?=$item->parent?></div>
                    <div class="h menu_id"><?=$item->menu_id?></div>
                    <div class="h order"><?=$item->order?></div>
                    <div class="h visibility"><?=$item->visibility?></div>
                    <div class='cl'></div>
                </div>
                <? render($menus, $menu_id, $item->id); ?>
            </li>
        <? endforeach; ?>
        <? endif; ?>
    </ul><?
} 
?>
<?/*<span id="saveButton" class="button"><em></em>Сохранить</span>*/?>
<div class="cl"></div>
<div class="menu fl-l w-550" rel="1">
    <h3>Основное меню</h3>
    <span class="addMenu button buttonBlue"><em></em>Добавить</span>
    <? render($menus, 1, 0); ?>
</div>
<div class="menu fl-l w-550" rel="2">
    <h3>Дополнительное меню</h3>
    <span class="addMenu button buttonBlue"><em></em>Добавить</span>
    <? render($menus, 2, 0); ?>
</div>
<div class="clearer"></div>
<div id="menuItemDialog" class="h" title="Редактирование пункта меню">
    <form class="w-500">
        <fieldset>
            <label for="item_title">Название</label>
            <input type="text" id="item_title"/>
        </fieldset>

        <fieldset>
            <label for="item_link">Ссылка</label>
            <input type="text" id="item_link"/>
        </fieldset>
        
        <fieldset>
            <label for="item_tooltip">Подсказка</label>
            <input type="text" id="item_tooltip"/>
        </fieldset>

        <fieldset>
            <label for="item_parent">Parent ID</label>
            <input type="text" id="item_parent"/>
        </fieldset>

        <fieldset>
            <label for="item_menu_id">Menu ID</label>
            <input type="text" id="item_menu_id"/>
        </fieldset>

        <fieldset>
            <label for="item_order">Сортировка</label>
            <input type="text" id="item_order"/>
        </fieldset>
        
        <fieldset>
            <label for="item_target">В новом окне</label>
            <input type="checkbox" id="item_target" value="on"/>
        </fieldset>

        <fieldset>
            <label for="item_visibility">Доступ</label>
            <select id="item_visibility">
                <option value="0">Для всех</option>
                <option value="1">Для залогиненых</option>
                <option value="127">Для админа</option>
            </select>
        </fieldset>

        <fieldset>
            <label for="item_more">Добавочно</label>
            <input type="text" id="item_more"/>
        </fieldset>

        <fieldset>
            <span class="button buttonGreen save"><em></em>Сохранить</span>
            <span class="button buttonRed remove"><em></em>Удалить</span>
        </fieldset>
    </form>
    </div>
</div>
<script>
$(function () {
    var editItemDialog = $("#menuItemDialog");
    $(".menu").each(function () {
        var menu_id = $(this).attr('rel');
        $(".addMenu",this).click(function () {
            $("#item_menu_id",editItemDialog).val(menu_id);
            $(".remove",editItemDialog).hide();
            $(".save",editItemDialog).unbind('click').one('click',function () {
                var params = {
                    json:1,
                    data:{
                        'title':$("#item_title",editItemDialog).val(),
                        'link':$("#item_link",editItemDialog).val(),
                        'tooltip':$("#item_tooltip",editItemDialog).val(),
                        'more':$("#item_more",editItemDialog).val(),
                        'target':$("#item_target",editItemDialog).attr('checked') ? "1":"0",
                        'menu_id':$("#item_menu_id",editItemDialog).val(),
                        'parent':$("#item_parent",editItemDialog).val(),
                        'order':$("#item_order",editItemDialog).val(),
                        'visibility':$("#item_visibility",editItemDialog).val()
                    }
                }
                $.post('/admin/menu/additem',params,function (resp) {
                    if (resp['status']=='ok') {
                        document.location.reload();
                    } else {
                        alert('Не получилось.')
                    }
                },'json');
            });
            editItemDialog.dialog({width:555});
        });
    });
    /*
    $( ".menu" ).sortable({
        items:'li',
        connectWith: "ul.sub",
        placeholder:'place',
        stop:function (e,ui) {
            res = $( ".menu" ).sortable("toArray");
        }
    });
    */
    $(".iteminfo").each(function () {
        var T = this;
        var menuId = $(T).attr('rel');
        $(".button", this).click(function () {
            $("#item_title",editItemDialog).val($('.title',T).html());
            $("#item_link",editItemDialog).val($('.link',T).html());
            $("#item_tooltip",editItemDialog).val($('.tooltip',T).html());
            $("#item_more",editItemDialog).val($('.more',T).html());
            $("#item_parent",editItemDialog).val($('.parent',T).html());
            $("#item_menu_id",editItemDialog).val($('.menu_id',T).html());
            $("#item_order",editItemDialog).val($('.order',T).html());
            $("#item_target",editItemDialog).val(($('.target',T).html()==1)?["on"]:[]);
            $("#item_visibility",editItemDialog).val($('.visibility',T).html());
            $(".remove",editItemDialog).show().unbind('click').one('click',function () {
                if (!confirm("Точно?")) return;
                var params = {
                    json:1,
                    'id':menuId
                }
                $.post('/admin/menu/removeitem',params,function (resp) {
                    if (resp['status']=='ok') {
                        document.location.reload();
                    } else {
                        alert('Не получилось');
                    }
                },"json");
            });
            $(".save",editItemDialog).unbind('click').one('click',function () {
                var params = {
                    json:1,
                    'id':menuId,
                    'title':$("#item_title",editItemDialog).val(),
                    'link':$("#item_link",editItemDialog).val(),
                    'tooltip':$("#item_tooltip",editItemDialog).val(),
                    'more':$("#item_more",editItemDialog).val(),
                    'target':$("#item_target",editItemDialog).attr('checked') ? "1":"0",
                    'menu_id':$("#item_menu_id",editItemDialog).val(),
                    'parent':$("#item_parent",editItemDialog).val(),
                    'order':$("#item_order",editItemDialog).val(),
                    'visibility':$("#item_visibility",editItemDialog).val()
                }
                $.post('/admin/menu/saveitem',params,function (resp) {
                    if (resp['status']=='ok') {
                        /*
                        $('.title',T).html($("#item_title",editItemDialog).val());
                        $('.link',T).html($("#item_link",editItemDialog).val());
                        $('.tooltip',T).html($("#item_tooltip",editItemDialog).val());
                        $('.more',T).html($("#item_more",editItemDialog).val());
                        $('.menu_id',T).html($("#item_menu_id",editItemDialog).val());
                        $('.parent',T).html($("#item_parent",editItemDialog).val());
                        $('.order',T).html($("#item_order",editItemDialog).val());
                        $('.target',T).html($("#item_target",editItemDialog).val() ? "1":"0");
                        $('.visibility',T).html($("#item_visibility",editItemDialog).val());
                        editItemDialog.dialog('close');
                        */
                        document.location.reload();
                    } else {
                        alert('Не получилось.')
                    }
                },'json');
            });
            editItemDialog.dialog({width:555});
        });
    });
    $("#saveButton").click(function () {
        var savedItems = [];
        var parentId = 0;
        var recMenu = function (menuId, ulObj, parentId) {
            var subOrder = 0;
            $(">li",ulObj).each(function () {
                var itemId = $(this).attr('rel');
                subOrder++;
                savedItems.push([menuId, itemId, parentId, subOrder]);
                $(">ul",this).each(function () {
                    recMenu(menuId, this, itemId);
                });
            });
        }
        $(".menu").each(function () {
            var menuId = $(this).attr('rel');
            parentId = 0;
            $(">ul",this).each(function () {
                recMenu(menuId, this, 0);
            });
        });
        if (typeof('console')!="undefined") {
            console.log(savedItems);
        }
        var params = {
            json:1,
            order:savedItems
        }
        $.post('/admin/menu/saveorder', params, function (resp) {
            if (resp['status']=='ok') {
                document.location.reload();
            }
        },"json")
    });
});
</script>