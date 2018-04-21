<div id="fileSettingsDialog">
    <form class="w-500">
        <fieldset>
            <label for='file_title'>Название</label>
            <input type='text' name='title' id='file_title' class='w-300' value="<?=htmlspecialchars($file->title)?>"/>
        </fieldset>
        <fieldset>
            <label for='file_namespace_id'>Тип файла</label>
            <select name="namespace_id" id="file_namespace_id" onchange="$('#fileSettingsDialog #file_title').multicomplete({source:desktop.mtags[this.value]});">
                <? $allNamespaces = Constructor_Dao_Namespace::getAllNamespaces();?>
                <? foreach($allNamespaces as $row):?>
                <option value="<?=$row['id']?>" <? if($row['id'] == $file->namespace_id):?>selected=""<?endif;?> ><?=$row['name']?></option>
                <? endforeach;?>
            </select>
        </fieldset>
        <fieldset>
            <label for='file_description'>Описание</label>
            <textarea name='description' id='file_description' class='w-300'><?=htmlspecialchars($file->description)?></textarea>
        </fieldset>
    </form>
</div>