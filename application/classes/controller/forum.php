<?php
class Controller_Forum extends Controller_Website {
    const POSTS_LIMIT = 10;
    public function action_newpost () 
    {
        if (!$this->auth_user) {
            $this->json_status = 'error';
            return;
        }
        $message = $this->p('message');
        $message = Model_Dao_Post::sanitize($message);
        if (!$message) {
            $this->json_status = 'error';
            return;
        }
        $post = new Model_Dao_Post();
        $post->text = $message;
        $post->author_id = $this->auth_user->id;
        $post->reply_to_id = intval($this->p('reply_to',0));
        $post->sub_thread_id = 0;
        $thread_id = intval($this->p('thread_id',0));
        $thread = false;
        $subject_type = intval($this->p('subject_type'),0);
        $subject_id = intval($this->p('subject_id'),0);
        if ($thread_id) {
            $new_thread = false;
            if ($post->reply_to_id) {
                /**
                * @var Model_Dao_Post
                */
                $reply_post = Model_Dao_Post::get_by_id($post->reply_to_id);
                if (!$reply_post) {
                    $this->json_status = 'error';
                    return;
                }
                if ($reply_post->sub_thread_id) {
                    $this->json_status = 'error';
                    return;
                }
                /*if ($reply_post->num_children >= 3) {
                    $new_thread = true;
                    $thread = new Model_Dao_Thread();
                    $thread->description = $reply_post->text;
                    $thread->title = substr(strip_tags($reply_post->text), 0, 50);
                    $thread->subject_type = $subject_type;
                    $thread->subject_id = $subject_id;
                    $thread->is_primary = 0;
                    $thread->reply_to_post_id = $reply_post->id;
                    $thread->save();
                    $thread_id = $thread->id;
                    Model_Dao_Post::move_posts($reply_post->thread_id, $reply_post->id, $thread_id);

                    $post->reply_to_id = 0;
                    $reply_post->sub_thread_id = $thread_id;
                    $reply_post->save();
                } else {*/
                $reply_post->num_children++;
                $reply_post->save();
                /*}*/
            }
            if (!$new_thread) {
                /**
                * @var Model_Dao_Thread
                */
                $thread = Model_Dao_Thread::get_by_id($thread_id);
                $thread->num_posts++;
                $thread->date_updated = time();
                $thread->save();
            }
        }
        if (!$thread_id || !$thread) {
            $threads = Model_Dao_Thread::get_by_subject($subject_type, $subject_id);
            if ($threads) {
                $this->json_status = 'error';
                return;
            } else {
                $new_thread = true;
                $thread = new Model_Dao_Thread();
                $thread->description = '';
                $thread->title = 'Обсуждение материала';
                $thread->subject_type = $subject_type;
                $thread->subject_id = $subject_id;
                $thread->is_primary = 1;
                $thread->save();
                $thread_id = $thread->id;
            }
        }
        $post->thread_id = $thread_id;
        if (!$post->save()) {
            if ($new_thread) {
                $thread->delete();
            }
            $this->json_status = 'error';
            return;
        }
        $post->updateRelations();
        $this->json_status = 'ok';
        $view = new View();
        $view->set('auth_user',$this->auth_user);
        $view->set('readonly',intval($this->p('readonly',0)));
        $view->set('thread',$thread);
        $view->set('parent_thread_page', intval($this->p('prev_page',0)));
        $page = intval($this->p('page',0));
        $posts = $thread->get_posts(self::POSTS_LIMIT+1, $page*self::POSTS_LIMIT);
        $next_page = false;
        if (count($posts) > self::POSTS_LIMIT) {
            $next_page = true;
            $posts = array_slice($posts,0,self::POSTS_LIMIT);
        }
        $prev_page = $page > 0;
        $view->set('prev_page',$prev_page);
        $view->set('next_page',$next_page);
        $view->set('posts',$posts);
        $this->json_data['html'] = $view->render("forum/thread");
        $this->json_data['thread_id'] = $thread->id;
        $this->json_data['page'] = $page;
    }
    
    public function action_thread()
    {
        $thread_id = intval($this->p('id',0));
        $readonly = intval($this->p('readonly', 0));
        if ($thread_id) {
            $thread = Model_Dao_Thread::get_by_id($thread_id);
            if (!$thread) {
                $this->json_status = 'error';
                return;
            }
        }
        if (!$thread_id) {
            $subj_type = intval($this->p('stype',0));
            $subj_id = intval($this->p('sid',0));
            $thread = Model_Dao_Thread::get_by_subject($subj_type, $subj_id);
            if (!$thread) {
                $this->json_status = 'error';
                return;
            }
            $thread = reset($thread);
        }
        $this->json_status = 'ok';
        $view = new View();
        $view->set('auth_user',$this->auth_user);
        $view->set('thread', $thread);
        $view->set('readonly', $readonly);
        $page = intval($this->p('page',0));
        $view->set('parent_thread_page', intval($this->p('from_page',0)));
        $posts = $thread->get_posts(self::POSTS_LIMIT+1,$page*self::POSTS_LIMIT);
        $next_page = false;
        if (count($posts) > self::POSTS_LIMIT) {
            $next_page = true;
            $posts = array_slice($posts,0,self::POSTS_LIMIT);
        }
        $prev_page = $page > 0;
        $view->set('page',$page);
        $view->set('next_page',$next_page);
        $view->set('prev_page',$prev_page);
        $view->set('posts',$posts);
        $this->json_data['html'] = $view->render("forum/thread");
        $this->json_data['thread_id'] = $thread->id;
        $this->json_data['page'] = $page;
    }
    
    public function action_vote()
    {
        if (!$this->auth_user) {
            $this->json_status = 'error';
            return;
        }
        $post_id = (int) $this->p('post',0);
        $reason_id = (int) $this->p('reason',0);
        if ((!$post_id) || (!$reason_id) || ( ! isset(Service_Karma::$reasons[$reason_id])) || ( ! $post = Model_Dao_Post::get_by_id($post_id))) {
            $this->json_status = 'error';
            return;
        }
        
        $points = Service_Karma::$reasons[$reason_id]['points'];
        
        $author = $post->get_author();
        if ($author->id == $this->auth_user->id) {
            $this->json_status = 'error';
            return;
        }

        $post->rating += $points;
        $post->save();

        $res = Service_Karma::vote_user($this->auth_user, $author, $points, $reason_id, Service_Subject::TYPE_POST, $post->id);
        
        $this->json_status = 'ok';
        $this->json_data = array(
            'rating'=>$post->rating,
            'karma'=>$author->karma,
        );
    }
    
    public function action_deletepost()
    {
        if (!$this->auth_user || $this->auth_user->status!=Model_User::STATUS_ADMIN) {
            $this->json_status = 'error';
            return;
        }
        $post_id = (int) $this->p('post',0);
        if ((!$post_id) || ( ! $post = Model_Dao_Post::get_by_id($post_id))) {
            $this->json_status = 'error';
            return;
        }
        
        $post->delete();

        $this->json_status = 'ok';
    }
}
