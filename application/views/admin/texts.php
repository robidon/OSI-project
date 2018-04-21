<? include "inc/top.php"; ?>
<h1>Материалы</h1>
<table class="data" cellspacing="1">
    <thead>
        <tr>
            <th>id</th>
            <th>Статус</th>
            <th>Автор</th>
            <th>Изменено</th>
            <th>Текст</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        <? foreach ($texts as $text) : ?>
        <?
            /**
            * @var $text Model_Dao_Text
            */
        ?>
        <tr id="text_<?=$text->crc?>" rel="<?=$text->crc?>">
            <td><a href="<? if ($text->location) : ?><?=$text->location?><? else : ?>/article/<?=$text->name?><? endif; ?>"><?=$text->name?></a></td>
            <td><?=$text->status == 0 ? "Редактируется" : "Опубликовано"?></td>
            <td><?=$text->get_author()->username?></td>
            <td><?=$text->date_modified?></td>
            <td><?=htmlspecialchars(substr($text->text,0,100))?></td>
        </tr>
        <? endforeach; ?>
    </tbody>
    <tfoot>
    </tfoot>
</table>
<br/>
<? if ($page>0) : ?>
<a class="button" href="/admin/text?page=<?=$page-1?>"><em></em>&laquo; Назад</a> &nbsp; 
<? endif; ?>
<a class="button" href="/admin/text?page=<?=$page+1?>"><em></em>Вперед &raquo;</a>