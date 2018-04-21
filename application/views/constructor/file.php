<? Helper_Html::jsFile(STATIC_URL."/multicomplete.js"); ?>
<? Helper_Html::cssFile(STATIC_URL."/multicomplete.css"); ?>
<? Helper_Html::cssFile(STATIC_URL."/desktop.css"); ?>
<? Helper_Html::jsFile(STATIC_URL."/desktop.js"); ?>
<? Helper_Html::jsFile(STATIC_URL."/desktopModels.js"); ?>
<? Helper_Html::cssFile(STATIC_URL."/search.css"); ?>
<? Helper_Html::jsFile(STATIC_URL."/search.js"); ?>
<? Helper_Html::jsFile(STATIC_URL."/jquery.textselect.js"); ?>
<?/**
  * @var Constructor_Dao_File $file
  */?>
<script>
$(function () {
    setTimeout(function () {
        <?
        $file_data = $file->as_json();
        //UTF8::array_to_utf($file_data);
        //UTF8::array_to_utf($tags);
        ?>
        expression.ops = <?=json_encode(Constructor_Model_Expression::get_keywords())?>;
        desktop.nodeStyles = <?=json_encode(Constructor_Dao_Node::$styles)?>;
        desktop.settings = <?=$fileSettings?>;
        desktop.readonly = <?=$readonly ? '1':'0'?>;
        desktop.init();
        desktop.initFile(<?=json_encode($file_data)?>);
        desktop.initTags(<?=json_encode($tags)?>);
    },500);
});
</script>

<div id="desktopWrap">
    <div id="fileInfo">
        <div id="fileTitle">
            <div class="label">Файл:</div>
            <div class="value"><?=htmlspecialchars($file->title)?></div>
        </div>
        <div id="filePublic">
            <div class="label">Публикация:</div>
            <div class="value"><input type="checkbox"<?=$file->published?" checked='checked'":""?><?=$readonly?" disabled='disabled'":""?>/> для всех</div>
        </div>
        <div id="fileActions">
            <?/*<span id="fileSaveButton" class="button buttonGreen"><em></em>Сохранить</span>*/?>
            <a id="macroparams" class="btn"><span class="btnIn"><?/*<span class="ico desktop_macro"></span>*/?>Макропараметры</span></a>
            <a id="constants" class="btn"><span class="btnIn"><span class="ico desktop_const"></span>Константы</span></a>
            <? if (!$readonly) : ?>
            <a id="fileSettingsButton" class="btn"><span class="btnIn"><span class="ico desktop_settings"></span>Настройки файла</span></a>
            <? endif; ?>
            <a id="copyLink" class="btn"><span class="btnIn"><?/*<span class="ico desktop_link"></span>*/?>Скопировать линк</span></a>
            <a class="btn" href="/constructor"><span class="btnIn">Назад к списку</span></a>
        </div>
    </div>
    <div id="canvasOuter">
        <div id="canvasWrap">
            <canvas id='canvas'></canvas>
            <? if (!$readonly) : ?>
            <div id="fileIncomings">Перетащите сюда элементы - входящие параметры</div>
            <div id="fileOutgoings">Перетащите сюда элементы - исходящие параметры</div>
            <? endif; ?>
            <div id="fileLayersPanel">
                <div class="desktopPanelTitle">Слои</div>
                <div id="fileLayers"></div>
                <div id="layerControls">
                    <a id="toggleAllLayers" class="btn" title="Показать / скрыть все слои"><span class="btnIn"><span class="ico visibility desktop_layer_show"></span></span></a>
                    <a id="addLayer" class="btn" title="Добавить слой"><span class="btnIn"><span class="ico desktop_layer_add"></span></span></a>
                </div>
            </div>
            <div id="fileControlPanel">
                <a id="zoomIn" class="btn" title="Приблизить"><span class="btnIn"><span class="ico desktop_zoom_in"></span></span></a>
                <a id="zoomOut" class="btn" title="Отдалить"><span class="btnIn"><span class="ico desktop_zoom_out"></span></span></a>
                <a id="copy" class="btn" title="Скопировать"><span class="btnIn"><span class="ico desktop_copy"></span></span></a>
                <? if (!$readonly) : ?>
                <a id="paste" class="btn" title="Вставить"><span class="btnIn"><span class="ico desktop_paste"></span></span></a>
                <?/*<a id="nodesArrangeButton" class="btn" title="Упорядочить"><span class="btnIn"><span class="ico desktop_align"></span></span></a>*/?>
                <a id="nodesGroupButton" class="btn" title="Сгруппировать"><span class="btnIn"><span class="ico desktop_group"></span></span></a>
                <a id="nodesUngroupButton" class="btn" title="Убрать из группы"><span class="btnIn"><span class="ico desktop_ungroup"></span></span></a>
                <? endif; ?>
                <a id="editCell" class="btn" title="Свойства"><span class="btnIn"><span class="ico desktop_properties"></span></span></a>
            </div>
            <div id="desktop">
                <div id="desktopDrag"></div>
            </div>
        </div>
    </div>
</div>

<? include "dialogs/popupMenu.php"; ?>
<div class='h'>
    <? include "dialogs/fileSettings.php"; ?>
    <? include "dialogs/nodeInfo.php"; ?>
    <? include "dialogs/nodeData.php"; ?>
    <? include "dialogs/nodeResults.php"; ?>
    <? include "dialogs/layerSettings.php"; ?>
</div>
<? include "dialogs/nodeDetails.php"; ?>
