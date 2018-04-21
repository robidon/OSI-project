<? include "inc/top.php"; ?>
<? include "inc/top_tags.php";?>
<h1>Нэймспейсы</h1>
<span class="addNamespace button buttonBlue"><em></em>Добавить</span>
<table class="data" cellspacing="1">
    <thead>
        <tr>
            <th>ID</th>
            <th>Нэймспейс</th>
            <th>Описание</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        <? foreach ($namespaces as $namespace) : ?>
        <tr id="namespace_<?=$namespace['id']?>" rel="<?=$namespace['id']?>">
            <td><?=$namespace['id']?></td>
            <td class="field field_name" rel="<?=htmlspecialchars($namespace['name'])?>"><?=$namespace['name']?></td>
            <td class="field field_description" rel="<?=htmlspecialchars($namespace['description'])?>"><?=$namespace['description']?></td>
            <td><span class="button" onclick="editItem('namespace_<?=$namespace['id']?>')"><em></em>Edit</span></td>
        </tr>
        <? endforeach; ?>
    </tbody>
    <tfoot>
    </tfoot>
</table>

<?
    $edit_item = array(
        'title'=>'Редактирование нэймспейса',
        'action_save'=>'/admin/tags/saveNamespace',
        'action_remove'=>'/admin/tags/removeNamespace',
        'fields'=>array(
            'name'=>array(
                'type'=>'text',
                'title'=>'Нэймспейс',
            ),
            'description'=>array(
                'type'=>'text',
                'title'=>'Описание',
            ),
        )
    );
?>
<? include "inc/edit_item.php"; ?>

<script type="text/javascript">
$(".addNamespace").click(function () {
    $(".remove",editItemDialog).hide();
    $(".save",editItemDialog).unbind('click').one('click',function () {
        var params = {
            json:1,
            data:{
                'name':$("#item_name",editItemDialog).val(),
                'description':$("#item_description",editItemDialog).val(),
            }
        }
        $.post('/admin/tags/addnamespace',params,function (resp) {
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