<? /** @var Constructor_Dao_File $file */?>
<div class="fileListItem">
    <hr/>
    <a href="/constructor/file/<?=$file->id?>"><?=htmlspecialchars($file->title)?></a>
    <div class="fl-r">
    <? $myAccess = Constructor_Service_File::get_user_access($file, $auth_user); ?>
    <? if ($myAccess & Constructor_Service_File::ACCESS_LEVEL_READ) : ?>
        <a class="button" href="/constructor/file/<?=$file->id?>"><em></em>Просмотр</a>
    <? endif; ?>
    <? if ($myAccess & Constructor_Service_File::ACCESS_LEVEL_COPY) : ?>
        <a class="button" href="/constructor/file/<?=$file->id?>/filecopy"><em></em>Копировать</a>
    <? endif; ?>
    <? if ($myAccess & Constructor_Service_File::ACCESS_LEVEL_ADMIN) : ?>
        <a class="button buttonRed" onclick="return confirm('Точно?')" href="/constructor/file/<?=$file->id?>/delete"><em></em>Удалить</a>
    <? endif; ?>
    </div>
    <div>
    <span class="small">Автор: <a href="/profile/<?=$file->get_editor_user()->id?>"><?=$file->get_editor_user()->username?></a></span>
    <br/>
    <span class="small">Изменен: <?=Helper_String::human_date($file->date_modified)?></span>
    <br/>
    <span class="small">Создан: <?=Helper_String::r_date($file->date_created)?></span>
    </div>
    
</div>