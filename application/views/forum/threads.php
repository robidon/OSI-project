<?
    $thread_id = 0;
?><div class='threads' type='<?=$subject_type?>' rel='<?=$subject_id?>'>
<? if (!$threads) : ?>
    <div class='posts' rel='0'>
        <div class='info'>Эту тему ешё никто не обсуждает. Хотите быть первым?</div>
    </div>
<? else: ?>
    <?/* if (count($threads)>1) : ?>
        <div class='list'>
            <? foreach ($threads as $thread) : ?>
            <div class='thread' rel="<?=$thread->id?>">
                <?=Helper_String::r_date($thread->date_created)?>
                <a href='#'><?=$thread->title?></a>
            </div>
            <? endforeach; ?>
        </div>
    <? endif; */?>
    <?  
        $thread = reset($threads);
        $posts = $thread->get_posts(Controller_Forum::POSTS_LIMIT + 1, 0);
        if (count($posts)>Controller_Forum::POSTS_LIMIT) {
            $next_page = true;
            $posts = array_slice($posts,0,Controller_Forum::POSTS_LIMIT);
        } else {
            $next_page = false;
        }
        $prev_page = false;
    ?>
    <div class='posts' rel='<?=$thread->id?>'>
        <? include "thread.php"; ?>
    </div>
<? endif; ?>
    <? if ($auth_user) : ?>
        <div class='newpost modified'>
            <div class='message'><textarea autocomplete='off'></textarea></div>
            <div class='submitButtonWrap'><span class='submit button buttonGreen'><em></em>Отправить</span></div>
        </div>
        <ul class='vote_reasons positive h'>
            <? foreach (Service_Karma::$reasons as $id=>$reason) : ?>
                <? if ($reason['points']<0) continue; ?>
                <li rel="<?=$id?>"><?=$reason['title']?></li>
            <? endforeach; ?>
        </ul>
        <ul class='vote_reasons negative h'>
            <? foreach (Service_Karma::$reasons as $id=>$reason) : ?>
                <? if ($reason['points']>0) continue; ?>
                <li rel="<?=$id?>"><?=$reason['title']?></li>
            <? endforeach; ?>
        </ul>
    <? else : ?>
        <div class="info">
            Только <a href="/profile/register">зарегистрированные</a> пользователи могут учавствовать в обсуждении материалов.
        </div>
    <? endif ; ?>
</div>

