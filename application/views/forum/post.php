<?
/**
* @var $post Model_Dao_Post
*/
?><div id="post_<?=$post->id?>" class='post' rel='<?=$post->id?>'>
    <div class='author_ava' rel='<?=$post->get_author()->id?>'><img src="<?=$post->get_author()->get_photo(24);?>"/></div>
    <div class='author_name'><a href="<?=$post->get_author()->get_profile_url()?>"><?=$post->get_author()->username?></a></div>
    <div class='date' title='<?=Helper_String::r_date(strtotime($post->date))?>'><?=Helper_String::human_date(strtotime($post->date))?></div>
    <ul class='actions'>
        <? if (!$post->sub_thread_id) : ?>
            <? if ($auth_user && !$readonly) : ?>
                <li><a class='reply' href='javascript:void(0)'>Ответить</a></li>
            <? endif; ?>
            <li>Голоса: <span class='rating'><?=$post->rating?></span></li>
            <? if ($auth_user && $auth_user->id != $post->get_author()->id) : ?>
                <? if (!$post->voted) : ?>
                    <li><a class='vote_add' href='javascript:void(0)'><strong>&nbsp;+&nbsp;</strong></a></li>
                    <li><a class='vote_sub' href='javascript:void(0)'><strong>&nbsp;-&nbsp;</strong></a></li>
                <? endif; ?>
            <? endif; ?>
        <? endif; ?>
        <? if ($auth_user && $auth_user->status == Model_User::STATUS_ADMIN) : ?>
            <li><a class="delete" href="javascript:void(0)" onclick="if (!confirm('Точно?')) return; $.post('/forum/deletepost',{ajax:1,json:1,post:<?=$post->id?>},function(resp){if (resp['status']=='ok'){$('#post_<?=$post->id?>').detach(); $('.post[rel=<?=$post->id?>]').detach();}},'json')">Убить</a></li>
        <? endif; ?>
    </ul>
    <div class='text'><?=$post->textShow?></div>
    <? if ( ! @$hide_answers && $post->sub_thread_id) : ?>
    <a class='sub_thread_link' href="#" rel='<?=$post->sub_thread_id?>'>Ответы (<?=$post->num_children?>)</a>
    <? endif; ?>
</div>