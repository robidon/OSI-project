<div id="dataNodeInfoDialog">
    <form class="w-500">
        <fieldset>
            <label for='node_name'>Название</label>
            <input type='text' name='name' id='node_name' class='w-300'/>
        </fieldset>
        <fieldset>
            <label for='node_description'>Описание</label>
            <textarea name='description' id='node_description' class='w-300'></textarea>
        </fieldset>
        <div class="data"></div>
    </form>
</div>
<div id="formulaNodeInfoDialog">
    <form class="w-500">
        <fieldset>
            <label for='node_name'>Название</label>
            <input type='text' name='name' id='node_name' class='w-300'/>
        </fieldset>
        <fieldset>
            <label for='node_description'>Описание</label>
            <textarea name='description' id='node_description' class='w-300'></textarea>
        </fieldset>
        <fieldset>
            <label for='node_formula'>Формула</label>
            <textarea name='formula' id='node_formula' class='w-300'></textarea>
            <div>Можно использовать функции:
            <?=implode(', ',array_merge(array_keys(Constructor_Model_Expression::$fc), Constructor_Model_Expression::$fb))?>
            </div>
        </fieldset>
    </form>
</div>
