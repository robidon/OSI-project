<?
    /**
    * @var $thread Model_Dao_Thread
    */
    if (!$thread->is_primary) : 
        $post = Model_Dao_Post::get_by_id($thread->reply_to_post_id);
        $hide_answers = true;
        ?>
        <a class='back button' rel='<?=$post->thread_id?>' page='<?=$parent_thread_page?>' href="#"><em></em>Назад</a>
        <? include "post.php"; ?>
        <?
    endif;
    $thread_id = $thread->id;
    $posts = array_reverse($posts);
    $prev_reply_to_id = -1;
    foreach ($posts as $post) {
        /**
        * @var $post Model_Dao_Post
        */
        if ($post->reply_to_id != $prev_reply_to_id) {
            $post->last = true;
            $prev_reply_to_id = $post->reply_to_id;
        } else {
            $post->last = false;
        }
    }
    $posts = array_reverse($posts);
    $hide_answers = false;
    if (!$thread->is_primary) : ?>
        <div class='info'>
    <? endif;
    foreach ($posts as $post) {
        include "post.php";
    }
    if (!$thread->is_primary) :?>
        </div>
    <? endif;
    if ($prev_page) :
        ?><a class="button prev_page fl-l" rel="<?=$posts[0]->sort?>" href="#"><em></em>&laquo; Ранее</a><?
    endif;
    if ($next_page) :
        ?><a class="button next_page fl-r" rel="<?=$posts[count($posts)-1]->sort?>" href="#"><em></em>Позднее &raquo;</a><?
    endif;
    ?>
    <div class="cl"></div>

