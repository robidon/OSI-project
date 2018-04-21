<? Helper_Html::jsFile('/static/editable.js'); ?>
<? Helper_Html::cssFile('/static/editable.css'); ?>
<div class="ediTableWrap">
    <div class="ediTableAdd ediTableAddLeft">+</div>
    <div class="ediTableAdd ediTableAddRight">+</div>
    <div class="ediTableSub">-</div>
    <table class="ediTable" cellspacing="1">
        <tr class='ediRow'>
            <td><div class='ediCell'>10</div></td>
            <td><div class='ediCell'>10</div></td>
            <td><div class='ediCell'>10</div></td>
        </tr>
        <tr class='ediRow'>
            <td><div class='ediCell'>20</div></td>
            <td><div class='ediCell'>20</div></td>
            <td><div class='ediCell'>1</div></td>
        </tr>
    </table>
</div>
<? Helper_Html::jsStart(); ?>
<script>
$(function () {
    $(".ediTableWrap").ediTable();
});
</script>
<? Helper_Html::jsEnd(); ?>