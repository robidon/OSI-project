<div id="edit_item" class="h" title="<?=$edit_item['title']?>">
    <form class="w-500">
        <? foreach ($edit_item['fields'] as $fieldName=>$fieldInfo) : ?>
        <fieldset>
            <label for="item_<?=$fieldName?>"><?=$fieldInfo['title']?></label>
            <?
            $width = (@$fieldInfo['width']) ? $fieldInfo['width'] : 200;
            switch ($fieldInfo['type']) {
                case "select":
                    ?><select id="item_<?=$fieldName?>" class="w-<?=$width?>"><?
                        foreach ($fieldInfo['select_from'] as $val=>$title) :
                            ?><option value="<?=$val?>"><?=$title?></option><?
                        endforeach;
                    ?></select><?
                    break;
                case "checkbox":
                    ?><input type="checkbox" id="item_<?=$fieldName?>"/><?
                case "int":
                case "text":
                default:
                    ?><input type="text" id="item_<?=$fieldName?>" class="w-<?=$width?>"/><?
            }
            ?>
        </fieldset>
        <? endforeach; ?>
        <fieldset>
            <span class="button buttonGreen save"><em></em>Сохранить</span>
            <span class="button buttonRed remove"><em></em>Удалить</span>
        </fieldset>
    </form>
</div>
<script>
var editItemDialog = $("#edit_item");
var editItem = function (item_obj_id) {
    var obj = $("#"+item_obj_id);
    var itemId = obj.attr('rel');
    <? foreach ($edit_item['fields'] as $fieldName=>$fieldInfo) : ?>
        $("#item_<?=$fieldName?>").val($(".field_<?=$fieldName?>",obj).attr('rel'));
    <? endforeach; ?>
    $(".save",editItemDialog).unbind('click').one('click',function() {
        var params = {
            'ajax':1,
            'json':1,
            'item':itemId,
            'data':{<?
                $comma = '';
                foreach ($edit_item['fields'] as $fieldName=>$fieldInfo) : 
                    ?><?=$comma?>'<?=$fieldName?>':$("#item_<?=$fieldName?>",editItemDialog).val()<?
                    $comma = ',';
                endforeach;
            ?>}
        }
        $.post('<?=$edit_item['action_save']?>',params,function (resp) {
            if (resp['status']=='ok') {
                document.location.reload();
            } else {
                alert('Не получилось.')
            }
        },'json');
    });
    $(".remove", editItemDialog).unbind('click').one('click',function () {
        if (!confirm("Точно?")) return;
        var params = {
            'json':1,
            'item':itemId
        }
        $.post('<?=$edit_item['action_remove']?>',params,function (resp) {
            if (resp['status']=='ok') {
                document.location.reload();
            } else {
                alert('Не получилось');
            }
        },"json");        
    });
    editItemDialog.dialog({width:555});
}
</script>