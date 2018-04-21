<?
    /** @var $report Constructor_Model_Report */
?>
<? Helper_Html::jsStart() ; ?>
<script>
var report = {
    initFilters:function (T, val) {
        $(">ul>li",T).each(function() {
            if (val) {
                $(".filter_checkbox:first",this).attr('checked','checked');
            }
            $(this).data('parent',T);
            report.initFilters($(this), $(".filter_checkbox:first",this).attr('checked')=='checked');
        });
    },
    updateFilters:function (inp) {
        var T = $(inp).parent().parent();
        if ($(inp).attr('checked')) {
            $(".filter_checkbox",T).attr('checked',true);
            var C = T;
            <?/*
            можно разкоментить, чтобы при выборе всех потомков выделялся так же парент
            while(C.data('parent')) {
                var allTrue = true;
                $("ul .filter_checkbox",C.data('parent')).each(function () {
                    if (!$(this).attr('checked')) allTrue = false;
                });
                if (allTrue) $(".filter_checkbox:first",C.data('parent')).attr('checked',true);
                C = C.data('parent');
            }*/?>
        } else {
            var allTrue = true;
            $("ul .filter_checkbox",T).each(function () {
                if (!$(this).attr('checked')) allTrue = false;
            });
            if (allTrue) $(".filter_checkbox",T).attr('checked',false);
            var C = T;
            while (C.data('parent')) {
                $(".filter_checkbox:first",C.data('parent')).attr('checked',false);
                C = C.data('parent');
            }
        }
    },
    filter:function (filter) {
        document.location = '/index/report?filter[]='+filter;
    },
    makeFilter: function(){
        var sels = $('.filter_checkbox:checked');
        var params = '';
        if (sels.length > 0){
            sels.each(function(){
                params += 'filter[]='+this.value+'&';
            });
            
        }
        document.location = '/index/report?'+params;
    }
}
$(function () {
    report.initFilters($("#filters"), false);
});
</script>
<? Helper_Html::jsEnd() ; ?>
<div class="fl-l w-260">
<div id="filters">
<h3>Фильтры</h3>
<?
    global $_curFilter;
    $_curFilter = $curFilter;
    $tree = $report->getFilters();
    buildTree($tree);
    function buildTree($subTree, $filter = '') {
        global $_curFilter;
        ?><ul><?
        foreach($subTree as $tag) {
            ?><li>
                <div class="tagItem">
                <input type="checkbox" onchange="report.updateFilters(this);" class="filter_checkbox" name="filter_sel[]" value="<?=$tag->id?>" <? if (is_array($_curFilter) && in_array($tag->id, $_curFilter)):?>checked="" <? endif;?> />
                <a href="#" onclick="report.filter('<?=$tag->id?>'); return false;"><?=$tag->name?></a></div>
                <? if (isset($tag->children)) {
                    buildTree($tag->children, $tag->id);
                }?>
            </li><?
        }
        ?></ul><?
    }
?>
<a class="button" href="#" onclick="report.makeFilter(); return false;"><em></em>Фильтровать</a>
</div>
</div>
<div class="fl-l w-700">
    <h2>Прогноз макропараметров (от редакции OSI Project)</h2>
    <?
        if (!isset($osiEditors)) $osiEditors = true;
        $data = $report->getDataByTag($curFilter, $osiEditors);
        if ($osiEditors){
            $reportData = Constructor_Dao_File::getReportData(Constructor_Dao_File::ROOT_USER_ID);
            if ($reportData) {
                ?>
                <div class="info">
                <?=nl2br(@$reportData['desc'])?>
                </div>
                <?  
            }
        }
    ?>
    <h3>
        История и прогноз макропараметров
        <a class="btn" href="/macroparams/"><span class="btnIn"><span class="ico desktop_settings"></span>Настроить поля</span></a>
        <a class="btn"><span class="btnIn"><span class="ico desktop_refresh"></span>Пересчитать</span></a>
    </h3>
    <table class="data">
        <tr>
            <td rowspan="2"></td>
            <th colspan="<?=$yearTypes['fact']?>">Факт</th>
            <th colspan="<?=$yearTypes['future']?>">Прогноз</th>
        </tr>
        <tr>
            <? foreach($availableYears as $year):?>
            <th><?=$year?></th>
            <? endforeach;?>
        </tr>
        
        <? foreach($availableParams as $param):?>
        <tr>
            <td><strong><?=$param->title?></strong></td>
            <? $count = 0;?>
            <? if (array_key_exists($param->id, $userParams)):?>
                <? foreach($availableYears as $year):?>
                <? $count++;?>
                <? $val = (array_key_exists($year, $userParams[$param->id])) ? $userParams[$param->id][$year] : 0; ?>
                <td class="<?=($count <= $yearTypes['fact']) ? 'colGroup1' : 'colGroup2';?>"><?=$val?></td>
                <? endforeach;?>
            <? else:?>
                <? foreach($availableYears as $year):?>
                <? $count++;?>
                <td class="<?=($count <= $yearTypes['fact']) ? 'colGroup1' : 'colGroup2';?>">0</td>
                <? endforeach;?>
            <? endif;?>
        </tr>
        <? endforeach;?>
    </table>

    <h2>Рейтинг компаний<? if (!$curFilter) {?>(от редакции OSI Project)<?}?></h2>
    <? if (!empty($data)):?>
    <table class="data">
        <tr>
            <th rowspan="2">Компания</th>
            <th rowspan="2">Потенциал роста</th>
            <th rowspan="2">Текущая цена акции</th>
            <th rowspan="2">Справедливая цена</th>
            <th colspan="3">P/E (EV/EBITDA,..)</th>
            <th rowspan="2">Команда</th>
            <th rowspan="2">Аналитик</th>
            <th rowspan="2">Последнее обновление</th>
        </tr>
        <tr>
            <th>2010</th><th>2011</th><th>2012</th>
        </tr>
    <?
        foreach ($data as $row) {
    ?>
        <tr>
            <td><strong><a href="/constructor/file/<?=$row['file_id']?>"><?=$row['title']?></a></strong></td>
            <td><strong class="txt-green"><?=isset($row['results']['potential']) ? $row['results']['potential'] : 'N/A'?></strong></td>
            <td><?=$row['current_price']?></td>
            <td><?=isset($row['results']['fair_price'])?$row['results']['fair_price'] : 'N/A'?></td>
            <td class="colGroup1"><?=isset($row['results']['p/e'][2010]) ? $row['results']['p/e'][2010] : 'N/A'?></td>
            <td class="colGroup1"><?=isset($row['results']['p/e'][2011]) ? $row['results']['p/e'][2011] : 'N/A'?></td>
            <td class="colGroup1"><?=isset($row['results']['p/e'][2012]) ? $row['results']['p/e'][2012] : 'N/A'?></td>
            <td nowrap="nowrap"><?=$row['team']['name']?> (<?=$row['team']['rating']?>)</td>
            <td nowrap="nowrap"><a href="/profile/<?=$row['author']['id']?>"><?=$row['author']['name']?></a> (<?=$row['author']['rating']?>)</td>
            <td><?=date('Y-m-d H:i:s',$row['update_time'])?></td>
        </tr>
    <?
        }
    ?>
    <? else:?>
    <h3>Файлов по заданным параметрам не обнаружено</h3>
    <? endif;?>
    </table>

</div>
<div class='clearer'></div>

