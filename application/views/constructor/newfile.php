<?
Helper_Html::jsFile(STATIC_URL."/jquery.tmpl.js");
Helper_Html::jsFile(STATIC_URL."/lib/backbone/underscore.js");
Helper_Html::jsFile(STATIC_URL."/lib/backbone/backbone.js");
Helper_Html::jsFile(STATIC_URL."/lib/backbone/backbone.stickit.js");
//"http://ajax.aspnetcdn.com/ajax/jquery.templates/beta1/jquery.tmpl.js");
//Helper_Html::jsFile(STATIC_URL."/lib/kinetic-v4.0.4.js");
Helper_Html::cssFile(STATIC_URL."/lib/handsontable/jquery.handsontable.full.css");
Helper_Html::jsFile(STATIC_URL."/lib/handsontable/jquery.handsontable.full.js");
Helper_Html::jsFile(STATIC_URL."/lib/handsontable/jquery.handsontable.editcolumns.js");
Helper_Html::jsFile(STATIC_URL."/lib/numeral/numeral.min.js");
Helper_Html::jsFile(STATIC_URL."/lib/numeral/languages/ru.min.js");

Helper_Html::jsFile(STATIC_URL."/lib/jquery.ui.touch-punch.js");

Helper_Html::jsFile(STATIC_URL."/lib/colorpicker/spectrum.js");
Helper_Html::cssFile(STATIC_URL."/lib/colorpicker/spectrum.css");

Helper_Html::jsFile(STATIC_URL."/lib/wysihtml5/parser_rules/advanced.js");
Helper_Html::jsFile(STATIC_URL."/lib/wysihtml5/dist/wysihtml5-0.3.0.min.js");

Helper_Html::jsFile(STATIC_URL."/jquery.textselect.js");
Helper_Html::jsFile(STATIC_URL."/multicomplete.js");

Helper_Html::jsFile(STATIC_URL."/desktop/service/utils.js");
Helper_Html::jsFile(STATIC_URL."/desktop/service/draw.js");
Helper_Html::jsFile(STATIC_URL."/desktop/service/calculator.js");

Helper_Html::jsFile(STATIC_URL."/desktop/models/expression.js");
Helper_Html::jsFile(STATIC_URL."/desktop/models/bindable.js");
Helper_Html::jsFile(STATIC_URL."/desktop/models/collection.js");
Helper_Html::jsFile(STATIC_URL."/desktop/models/shareuser.js");

Helper_Html::jsFile(STATIC_URL."/desktop/service/debug.js");

Helper_Html::jsFile(STATIC_URL."/desktop/dao/base.js");
Helper_Html::jsFile(STATIC_URL."/desktop/dao/note.js");
Helper_Html::jsFile(STATIC_URL."/desktop/dao/node/node.js");
Helper_Html::jsFile(STATIC_URL."/desktop/dao/node/data.js");
Helper_Html::jsFile(STATIC_URL."/desktop/dao/node/formula.js");
Helper_Html::jsFile(STATIC_URL."/desktop/dao/node/group.js");
Helper_Html::jsFile(STATIC_URL."/desktop/dao/factory.js");
Helper_Html::jsFile(STATIC_URL."/desktop/dao/relation.js");
Helper_Html::jsFile(STATIC_URL."/desktop/dao/connection.js");
Helper_Html::jsFile(STATIC_URL."/desktop/dao/layer.js");
Helper_Html::jsFile(STATIC_URL."/desktop/dao/collections.js");
Helper_Html::jsFile(STATIC_URL."/desktop/dao/file.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/table/cell.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/table/tableModel.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/table/table.js");
Helper_Html::jsFile(STATIC_URL."/desktop/controller/abstract.js");
Helper_Html::jsFile(STATIC_URL."/desktop/controller/file.js");
Helper_Html::jsFile(STATIC_URL."/desktop/controller/editor.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/html.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/valueEditor.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/fileinfo.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/dialog.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/table/filter.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/dialogNodes.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/dialogGroup.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/stage/stage.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/file.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/base.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/node/abstract.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/node/data.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/node/formula.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/node/group.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/connection.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/layer.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/controls.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/latestComments.js");
Helper_Html::jsFile(STATIC_URL."/desktop/views/descriptionsList.js");
Helper_Html::jsFile(STATIC_URL.'/desktop/views/tooltip/tooltip.js');
Helper_Html::jsFile(STATIC_URL."/desktop/views/share.js");
Helper_Html::jsFile(STATIC_URL."/desktop/router.js");

Helper_Html::cssFile(STATIC_URL."/multicomplete.css");
Helper_Html::cssFile(STATIC_URL."/desktop.css");
Helper_Html::cssFile(STATIC_URL."/search.css");

Helper_Html::jsFile(STATIC_URL.'/tabbedPopup.js');
Helper_Html::cssFile(STATIC_URL.'/tabbedPopup.css');


?>
<script>
var cf, router, src_data;
var context = { value: 42 };
$(function () {

    /*var test = function () {
        console.log('====testing started')
        var t = (new Date()).getTime();
        var exp = new Desktop_Model_Expression();
        var formula = '{12,cnst+boo*max(12,534),343,33}*2+{323,23,343,22}';
        console.log(exp.get_vars(formula));
        console.log(formula);
        console.log(exp.evaluate('cnst=23'));
        console.log(exp.evaluate('boo=232'));
        console.log(exp.evaluate(formula));
        console.log('====testing finished:'+((new Date()).getTime()-t));
    }
    $(function () {
        //test();
    });*/
    <?
    $file_data = $fileJSON;
    ?>
    var ms = (new Date()).getTime();
    
    cf = new Desktop_Controller_File();
    cf.initTags(<?=json_encode($tags)?>);
    cf.initMacroparams(<?=json_encode($macroparams)?>);
    src_data = <?=json_encode($file_data)?>;
    cf.parseFile(src_data,<?=$fileSettings?>);
    
    router = new Desktop_Router();
    Backbone.history.start({root:'/constructor/file/<?=$file_data['id']?>/'});
    
    ms = (new Date()).getTime() - ms;
    //debug.start();
});
</script>

<div id="desktopWrap"></div>

<? include "dialogs/popupMenu.php"; ?>
<? include "dialogs/fileSettings.php"; ?>
<? include "dialogs/fileShare.php"; ?>
<? include "dialogs/layerSettings.php"; ?>
<? include "dialogs/groupSettings.php"; ?>

<script id="fileInfoTemplate" type="text/x-jquery-tmpl">
    <div id="fileInfo">
        <div id="fileTitle">
            <div class="label">Файл:</div>
            <div class="value">${title}</div>
        </div>
        <div id="fileActions">
            {{if user_access.edit}}
            <a id="macroparams" class="btn"><span class="btnIn"><?/*<span class="ico desktop_macro"></span>*/?>Макропараметры</span></a>
            <a id="constants" class="btn"><span class="btnIn"><span class="ico desktop_const"></span>Константы</span></a>
            {{/if}}
            {{if user_access.copy}}<a id="fileCopy" class="btn"><span class="btnIn"><span class="ico access_list_header_item_copy"></span>Копировать файл</span></a>
            {{/if}}
            {{if user_access.edit}}
            <a id="recalc" class="btn"><span class="btnIn"><span class="ico desktop_recalc"></span>Пересчитать</span></a>
            {{if user_access.admin}}
            <a id="fileSettingsButton" class="btn"><span class="btnIn"><span class="ico desktop_settings"></span>Настройки файла</span></a>
            <a id="fileShareButton" class="btn"><span class="btnIn"><span class="ico desktop_settings"></span>Открыть доступ</span></a>
            {{/if}}
            {{/if}}
            <?/*<a id="copyLink" class="btn"><span class="btnIn"><span class="ico desktop_link"></span>Скопировать линк</span></a>*/?>
            <a class="btn" href="/constructor"><span class="btnIn">Назад к списку</span></a>
        </div>
    </div>
</script>
<script id="canvasTemplate" type="text/x-jquery-tmpl">
    <div id="layoutTopPanel">
    </div>
    <div id="canvasOuter">
        <div id="canvasWrap">
            <div id='canvas'></div>
            <?/*{{if user_access.edit}}
            <div id="fileIncomings">Перетащите сюда элементы - входящие параметры</div>
            <div id="fileOutgoings">Перетащите сюда элементы - исходящие параметры</div>
            {{/if}}*/?>
            <div id="layoutRightPanelWrap">
                <div id="layoutRightPanel">
                    <ul>
                        <li><a href="#fileLayersPanelWrap">Слои</a></li>
                        <li><a href="#latestCommentsPanelWrap">Обсуждения</a></li>
                        <li><a href="#descriptionsListPanelWrap">Описания</a></li>
                    </ul>
                    <div id="fileLayersPanelWrap"></div>
                    <div id="latestCommentsPanelWrap"></div>
                    <div id="descriptionsListPanelWrap"></div>
                </div>
            </div>
            <div id="layoutControlsPanel">
            </div>
            <div id="debugInfo" style="position:absolute; padding:5px; left:0; bottom:0; min-width:300px; background:rgba(0,0,0,0.2); color:#fff;z-index:100;">
                
                debug info;
            </div>
        </div>
    </div>
</script>

<script id="layersListTemplate" type="text/x-jquery-tmpl">
    <div id="fileLayersPanel" class="tabbedPanelItem">
        <div id="fileLayers"></div>
        <div id="layerControls">
            <a id="toggleAllLayers" class="btn" title="Показать / скрыть все слои"><span class="btnIn"><span class="ico visibility desktop_layer_show"></span></span></a>
            {{if user_access.edit}}<a id="addLayer" class="btn" title="Добавить слой"><span class="btnIn"><span class="ico desktop_layer_add"></span></span></a>{{/if}}
        </div>
    </div>
</script>

<script id="layerTemplate" type="text/x-jquery-tmpl">
    <div class="layer {{if highlighted}}highlighted{{/if}}">
        <div class="ico visibility {{if shown}}desktop_layer_show{{else}}desktop_layer_hide{{/if}}"></div>
        {{if editable}}<div class="ico desktop_layer_edit"></div>{{/if}}
        <div class="title">${title}</div>
    </div>
</script>

<script id="controlsTemplate" type="text/x-jquery-tmpl">
    <div id="fileControlPanel">
        <a id="zoomIn" class="btn" title="Приблизить"><span class="btnIn"><span class="ico desktop_zoom_in"></span></span></a>
        <a id="zoomOut" class="btn" title="Отдалить"><span class="btnIn"><span class="ico desktop_zoom_out"></span></span></a>
        {{if user_access.copy_nodes}}
        <a id="copy" class="btn" title="Скопировать"><span class="btnIn"><span class="ico desktop_copy"></span></span></a>
        {{/if}}
        {{if user_access.edit}}
        <a id="paste" class="btn" title="Вставить"><span class="btnIn"><span class="ico desktop_paste"></span></span></a>
        <?/*<a id="nodesArrangeButton" class="btn" title="Упорядочить"><span class="btnIn"><span class="ico desktop_align"></span></span></a>*/?>
        <a id="nodesGroupButton" class="btn" title="Сгруппировать"><span class="btnIn"><span class="ico desktop_group"></span></span></a>
        <a id="nodesUngroupButton" class="btn" title="Убрать из группы"><span class="btnIn"><span class="ico desktop_ungroup"></span></span></a>
        {{/if}}
        <a id="editCell" class="btn" title="Свойства"><span class="btnIn"><span class="ico desktop_properties"></span></span></a>
        {{if user_access.edit}}
        <a id="removeCell" class="btn" title="Удалить"><span class="btnIn"><span class="ico desktop_remove"></span></span></a>
        <a id="colorPicker" class="btn" title="Цвет"><span class="btnIn"><span class="ico desktop_colorpicker nocolor"></span></span></a>
        <a id="nodeRotate" class="btn" title="Поворот"><span class="btnIn"><span class="ico desktop_rotate nocolor"></span></span></a>
        {{/if}}
    </div>
</script>

<script id="latestCommentsTemplate" type="text/x-jquery-tmpl">
    <div id="latestCommentsPanel" class="tabbedPanelItem">
        <div id="latestCommentsList"></div>
    </div>
</script>

<script id="latestCommentTemplate" type="text/x-jquery-tmpl">
    <div class="latestComment" nodeId="${node.id}">
        <div class="latestCommentTitle">
            <a class="authorName" href="${post.author_profile_url}" target=="_blank">${post.author_name}</a>
            <span class="postDate">${post.date}</span>
        </div>
        <div class="latestCommentBody">
            <span class="nodeName">${node.name}</span>
            <span class="postText">{{html post.textShow}}</span>
        </div>
    </div>
</script>

<script id="keysFilterTemplate" type="text/x-jquery-tmpl">
    {{if user_access.edit}}
    <div class="keysFilterContainer{{if enabled}} enabled{{/if}}{{if user_access.edit}} editable{{/if}}">
        <div class="keysFilterWrap">
            Фильтр:
            <input class="keysFilter" value="${keysFilter}"/>
        </div>
        <div class="keysMinBoundWrap">
            Min:
            <input class="keysMinBound" value="${keysMinBound}"/>
        </div>
        <div class="keysMaxBoundWrap">
            Max:
            <input class="keysMaxBound" value="${keysMaxBound}"/>
        </div>
        <div class="keysFilterOverlay"></div>
        <div class="actions">
            {{if user_access.edit}}
            <div class="action addDataNode" title="Добавить данные">
                Добавить
                <div class="ico desktop_node_data"></div>
            </div>
            <div class="action addFormulaNode" title="Добавить формулу">
                Добавить
                <div class="ico desktop_node_formula"></div>
            </div>
            {{/if}}
            <div class="action ico keysFilterTrigger" title="Включить / выключить фильтр"></div>
            <div class="action ico keysSortTrigger{{if keysSort==1}} asc{{/if}}{{if keysSort==-1}} desc{{/if}}" title="Сортировка"></div>
        </div>
    </div>
    {{/if}}
</script>

<script id="descriptionsListTemplate" type="text/x-jquery-tmpl">
    <div id="descriptionsListPanel" class="tabbedPanelItem">
        <div id="descriptionsList"></div>
    </div>
</script>
<script id="descriptionsListItemTemplate" type="text/x-jquery-tmpl">
    <div class="descriptionsListItem" itemId="${id}" itemType="${type}">
        <?/*<div class="descriptionsListItemTitle">
        </div>*/?>
        <div class="descriptionsListItemBody">
            <span class="itemName">${name}</span>
            <span class="itemContent{{if single==false}} shortDesc{{/if}}">{{html full_desc}}</span>
        </div>
    </div>
</script>

<div id="wysihtml5-toolbar" style="display: none;">
  <a data-wysihtml5-command="bold">bold</a>
  <a data-wysihtml5-command="italic">italic</a>
  
  <!-- Some wysihtml5 commands require extra parameters -->
  <a data-wysihtml5-command="foreColor" data-wysihtml5-command-value="red">red</a>
  <a data-wysihtml5-command="foreColor" data-wysihtml5-command-value="green">green</a>
  <a data-wysihtml5-command="foreColor" data-wysihtml5-command-value="blue">blue</a>
  
  <!-- Some wysihtml5 commands like 'createLink' require extra paramaters specified by the user (eg. href) -->
  <a data-wysihtml5-command="createLink">insert link</a>
  <div data-wysihtml5-dialog="createLink" style="display: none;">
    <label>
      Link:
      <input data-wysihtml5-dialog-field="href" value="http://" class="text">
    </label>
    <a data-wysihtml5-dialog-action="save">OK</a> <a data-wysihtml5-dialog-action="cancel">Cancel</a>
  </div>
</div>
