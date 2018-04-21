<?

$ordered = array(0=>array());
foreach ($items as $item) {
    if (!isset($ordered[$item->parent])) {
        $ordered[$item->parent] = array();
    }
    $ordered[$item->parent][] = $item;
}

?>
<ul id="menuSite">
    <? foreach ($ordered[0] as $item) : ?>
    <li class="item"><em></em>
        <a<?
        if ($item->tooltip) {?> title="<?=htmlspecialchars($item->tooltip)?>"<?}
        if ($item->target) {?> target="<?=$item->target?>"<?}
        if ($item->more) {?> <?=$item->more?><?}
        ?> href="<?=$item->link?>"><?=$item->title?></a>
    </li>
    <? endforeach; ?>
    <?/*<li><em></em><a href="/">Главная</a></li>
    <li><em></em><a href="/">Форум</a></li>
    <li><em></em><a href="/index/about">О проекте</a></li>
    <? if ($auth_user) : ?>
        <li><em></em><a href="/profile">Профиль</a></li>
    <? endif; ?>*/?>
</ul>
