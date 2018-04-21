<? Helper_Html::cssFile(STATIC_URL."/desktop.css"); ?>
<? Helper_Html::jsFile(STATIC_URL."/desktop.js"); ?>
<? Helper_Html::cssFile(STATIC_URL."/multicomplete.css"); ?>
<? Helper_Html::jsFile(STATIC_URL."/multicomplete.js"); ?>
<? Helper_Html::jsFile(STATIC_URL."/jquery.textselect.js"); ?>
<? Helper_Html::jsStart(); ?><script>
$(function () {
    desktop.initTags(<?=json_encode($tags)?>);
    $(".btnNewFile").click(function () {
        desktop.face.fileSettings(0)
    });
});
</script><? Helper_Html::jsEnd(); ?>
<?/*<div class="fl-l w-400">
    <h1>Проекты:</h1>
    <div class="info">Пока нет проектов</div>
</div>*/?>
<div class="fl-l w-500">
    <h1>Мои файлы:</h1>
    <? if (empty($myfiles)) :?>
        <div class="info">Пока файлов нет.</div>
    <? else : ?>
    <span class="btnNewFile button buttonGreen"><em></em>Новый файл</span>
        <h2>Опубликованые файлы</h2>
        <? foreach ($myfiles as $file) : 
            if ($file->published) {
                include "index/filelistitem.php";
            }
        endforeach; ?>
        <h2>Неопубликованые файлы</h2>
        <? foreach ($myfiles as $file) : 
            if (!$file->published) {
                include "index/filelistitem.php";
            }
        endforeach; ?>
    <? endif; ?>
    <span class="btnNewFile button buttonGreen"><em></em>Новый файл</span>
</div>
<div class="fl-l w-500 content-r">
    <h1>Другие файлы (Опубликованые):</h1>
    <? if (empty($allfiles)) :?>
        <div class="info">Пока файлов нет.</div>
    <? else : ?>
        <? foreach ($allfiles as $file) : 
            if (!$file->published || $file->editor_type == Constructor_Service_File::EDITOR_TYPE_USER && $file->editor_id == $auth_user->id) continue;
            include "index/filelistitem.php";
        endforeach; ?>
    <? endif; ?>
</div>
<div class="cl"></div>
<div class='h'>
    <? include "dialogs/fileSettings.php"; ?>
</div>