<? /*if ($auth_user && $auth_user->loaded() && $auth_user->status == Model_User::STATUS_ADMIN) :*/ ?>
<?

$ordered = array(0=>array());
foreach ($items as $item) {
    if (!isset($ordered[$item->parent])) {
        $ordered[$item->parent] = array();
    }
    $ordered[$item->parent][] = $item;
}

?>
<ul id="menuMain">
    <? foreach ($ordered[0] as $item) : ?>
    <li class="item"><em></em>
        <a rel="#menuMain_<?=$item->id?>" <? if ($item->target) {?> target="<?=$item->target?>"<?}?> href="<?=$item->link?>"><?=$item->title?></a>
    </li>
    <? endforeach; ?>
</ul>
<? foreach ($ordered as $id=>$items) : ?>
<? if ($id==0) continue; ?>
<div id="menuMain_<?=$id?>" class="submenu"><ul>   
    <? foreach ($items as $item) : ?>
        <li><a rel="#menuMain_<?=$item->id?>" <? if ($item->target) {?> target="<?=$item->target?>"<?}?> href="<?=$item->link?>"><?=$item->title?></a></li>
    <? endforeach; ?>
</ul></div>
<? endforeach; ?>

<div id="submenu">
    <em class="ctl"></em><em class="ctr"></em>
    <div class="wrap">
        <div class="menu"></div>
        <div class="sub"></div>
    </div>
    <em class="cbl"></em><em class="cbr"></em>
</div>
<?/* endif; */?>