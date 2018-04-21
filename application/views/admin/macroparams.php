<? include "inc/top.php"; ?>
<h1>Макропараметры</h1>
<span class="addParam button buttonBlue"><em></em>Добавить</span>
<table class="data" cellspacing="1">
    <thead>
        <tr>
            <th>ID</th>
            <th>Параметр</th>
            <th>Включен</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        <? foreach ($macroparams as $param) : ?>
        <tr id="param_<?=$param->id?>" rel="<?=$param->id?>">
            <td><?=$param->id?></td>
            <td class="field field_title" rel="<?=htmlspecialchars($param->title)?>"><?=$param->title?></td>
            <td class="field field_enabled" rel="<?=$param->enabled?>"><?=$param->enabled?></td>
            <td><span class="button" onclick="editItem('param_<?=$param->id?>')"><em></em>Edit</span></td>
        </tr>
        <? endforeach; ?>
    </tbody>
    <tfoot>
    </tfoot>
</table>

<?
    $edit_item = array(
        'title'=>'Редактирование макропараметра',
        'action_save'=>'/admin/macroparams/save',
        'action_remove'=>'/admin/macroparams/remove',
        'fields'=>array(
            'title'=>array(
                'type'=>'text',
                'title'=>'Название',
            ),
            'enabled'=>array(
                'type'=>'select',
                'title'=>'Включен',
                'select_from'=>array(0 => 0, 1 => 1),
            ),
        )
    );
?>
<? include "inc/edit_item.php"; ?>
<script type="text/javascript">
$(".addParam").click(function () {
    $(".remove",editItemDialog).hide();
    $(".save",editItemDialog).unbind('click').one('click',function () {
        var params = {
            json:1,
            data:{
                'title':$("#item_title",editItemDialog).val(),
                'enabled':$("#item_enabled",editItemDialog).val()
            }
        }
        $.post('/admin/macroparams/additem',params,function (resp) {
            if (resp['status']=='ok') {
                document.location.reload();
            } else {
                alert('Не получилось.')
            }
        },'json');
    });
    editItemDialog.dialog({width:555});
});
</script>