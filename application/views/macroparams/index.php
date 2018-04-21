<h2>Макропараметры</h2>
<form id="paramsForm" action="/macroparams/save" method="post">
<table class="data w-100p" cellspacing="1">
    <thead>
        <tr>
            <th class="w-50">ID</th>
            <th class="w-150">Название</th>
            <? foreach($years as $year):?>
            <th class="w-100"><?=$year?></th>
            <? endforeach;?>
        </tr>
    </thead>
    <tbody>
        <? foreach($availableParams as $param):?>
        <tr>
            <td><?=$param->id?></td>
            <td><?=$param->title?></td>
            <? foreach($years as $year):?>
            <td>
                <?
    $value = 0;
    if (array_key_exists($param->id, $userParams) && array_key_exists($year, $userParams[$param->id])) $value = $userParams[$param->id][$year];
?>
                <input name="params[<?=$param->id?>][<?=$year?>]" class="w-100" type="text" value="<?=$value?>" />
            </td>
            <? endforeach;?>
        </tr>
        <? endforeach;?>
    </tbody>
</table>
<br />
<span onclick="$('#paramsForm').submit();" class="addParam button buttonBlue"><em></em>Сохранить</span>
</form>