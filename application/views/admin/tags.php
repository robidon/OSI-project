<? include "inc/top.php"; ?>
<? include "inc/top_tags.php";?>
<h1>Тэги</h1>
<span class="addTag button buttonBlue"><em></em>Добавить</span>
<span id="tagsRecalc" class="button buttonGreen"><em></em>Пересчет файлов</span>
<table class="data" cellspacing="1">
    <thead>
        <tr>
            <th>ID</th>
            <th>Тэг</th>
            <th>Описание</th>
            <th>Нэймспейс</th>
            <th>ID родительского тэга</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        <? foreach ($tags as $tag) : ?>
        <tr id="tag_<?=$tag['id']?>" rel="<?=$tag['id']?>">
            <td><?=$tag['id']?></td>
            <td class="field field_name" rel="<?=htmlspecialchars($tag['name'])?>"><?=$tag['name']?></td>
            <td class="field field_description" rel="<?=htmlspecialchars($tag['description'])?>"><?=$tag['description']?></td>
            <td class="field field_namespace_id" rel="<?=$tag['namespace_id']?>"><?=$namespaces[$tag['namespace_id']]?></td>
            <td class="field field_parent_tag_id" rel="<?=$tag['parent_tag_id']?>"><?=$tag['parent_tag_id']?></td>
            <td><span class="button" onclick="editItem('tag_<?=$tag['id']?>')"><em></em>Edit</span></td>
        </tr>
        <? endforeach; ?>
    </tbody>
    <tfoot>
    </tfoot>
</table>

<?
    $edit_item = array(
        'title'=>'Редактирование тэга',
        'action_save'=>'/admin/tags/save',
        'action_remove'=>'/admin/tags/remove',
        'fields'=>array(
            'name'=>array(
                'type'=>'text',
                'title'=>'Тэг',
            ),
            'description'=>array(
                'type'=>'text',
                'title'=>'Описание',
            ),
            'namespace_id'=>array(
                'type'=>'select',
                'select_from'=>$namespaces,
                'title'=>'Нэймспейс',
            ),
            'parent_tag_id'=>array(
                'type'=>'text',
                'title'=>'ID родительского тэга',
            ),
        )
    );
?>
<? include "inc/edit_item.php"; ?>
<script type="text/javascript">
$(".addTag").click(function () {
    $(".remove",editItemDialog).hide();
    $(".save",editItemDialog).unbind('click').one('click',function () {
        var params = {
            json:1,
            data:{
                'name':$("#item_name",editItemDialog).val(),
                'description':$("#item_description",editItemDialog).val(),
                'namespace_id':$("#item_namespace_id",editItemDialog).val(),
                'parent_tag_id':$("#item_parent_tag_id",editItemDialog).val(),
            }
        }
        $.post('/admin/tags/additem',params,function (resp) {
            if (resp['status']=='ok') {
                document.location.reload();
            } else {
                alert('Не получилось.')
            }
        },'json');
    });
    editItemDialog.dialog({width:555});
});
$('#tagsRecalc').click(function(){
    if (confirm('Будет выполнен пересчет тэгов. Выполнять аккуратно, если сайт под нагрузкой')){
        $.post('/admin/utils/tagsrecalcfiles', {json: 1}, function(data){
            if (data.data.result){
                alert('Пересчет тэгов успешно завершен');
            } else {
                alert('Произошла ошибка');
            }
        }, 'json');
    }
});
</script>