<? include "inc/top.php"; ?>
<h1>Отчеты</h1>
<form id="reportForm" action="/admin/report/saveData" method="post">
    <div class="left multiselect">
        <h4>Все файлы</h4>
        <select class="m" multiple="" id="allFiles" name="allFiles">
            <? foreach($allFiles as $file):?>
            <? if (in_array($file->uid, $selectedIds)) continue;?>
            <option value="<?=$file->uid?>"><?=$file->title?></option>
            <? endforeach;?>
        </select>
    </div>

    <div class="left buttons">
        <input id="moveRight" type="button" name="" value="<<" />
        <input id="moveLeft" type="button" name="" value=">>" />
        
    </div>

    <div class="left multiselect">
        <h4>Файлы от редакции OSI-project</h4>
        <select class="m" multiple="" id="selectedFiles" name="selectedFiles[]">
            <? foreach($selectedIds as $id):?>
            <option value="<?=$allFiles[$id]->uid?>"><?=$allFiles[$id]->title?></option>
            <? endforeach;?>
        </select>
    </div>
    
    <h4 class="txt">Описание</h4>
    <textarea name="textDesc"><?=array_key_exists('desc', $reportData) ? $reportData['desc'] : ''; ?></textarea>
    <br /><br />
    <input type="button" id="btnSubmit" value="Сохранить" />
    <div class="clearer"></div>
</form>


<style type="text/css">
.left{float: left;}
.multiselect{width: 500px;}
.buttons{width: 100px;}
select.m{width: 450px; height: 200px;}
textarea{width: 1048px; height: 100px;}
</style>
<script type="text/javascript">
$(function(){
    $('#moveLeft').bind('click', function(){
        var items = $('#allFiles option:selected');
        $('#selectedFiles').append(items);
    });
    $('#moveRight').bind('click', function(){
        var items = $('#selectedFiles option:selected');
        $('#allFiles').append(items);
    });
    $('#btnSubmit').bind('click', function(){
        $('#selectedFiles option').attr('selected', 'selected');
        $('#reportForm').submit();
    });
})
</script>