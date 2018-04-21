<?php           
class Model_Dao_Thread extends Model_Dao {

    public static $_table = 'threads';
    public static $_fields = array('id','title','description','subject_type','subject_id','num_posts','date_created','date_updated','is_primary','reply_to_post_id');
    
    public $id;
    public $title;
    public $description;
    public $subject_type;
    public $subject_id;
    public $num_posts = 0;
    public $date_created;
    public $date_updated;
    public $is_primary;
    public $reply_to_post_id = 0;
    
    public static function isTreeEnabled()
    {
        return true;
    }
    
    public function save()
    {
        if (!$this->date_created) {
            $this->date_created = time();
        }
        if (!$this->date_updated) {
            $this->date_updated = time();
        }
        return parent::save();
    }
    
    /**
    * пока выбираем посты без учета древовидной структуры. Как будто все ответы линейны
    * 
    * @param int $limit
    * @param int $offset
    * @param bool $add_votes
    */
    public function get_tree_posts($limit = 10, $offset = 0, $add_votes = true)
    {
        $results = array();
        $sql = 'SELECT `child_post_id` FROM `'.Model_Dao_Post::$_tableRelations.'` 
            WHERE thread_id = :thread_id AND `level` = 1 
            ORDER BY `child_post_id` DESC
            LIMIT :offset, :limit';
        $expr = DB::query(Database::SELECT, $sql)->parameters(array(
            ':thread_id' => $this->id,
            ':offset' => $offset,
            ':limit' => $limit
        ));
        $postIds = array();
        $rows = $expr->execute()->as_array();
        foreach($rows as $row){
            $postIds[] = $row['child_post_id'];
        }
        if (!empty($postIds)){
            $idsS = implode(', ', $postIds);
            $sql = 'SELECT * FROM `'.Model_Dao_Post::$_table.'` WHERE `id` IN ('.$idsS.') ORDER BY `id` DESC';
            $rows = DB::query(Database::SELECT, $sql)->execute()->as_array();
            foreach($rows as $row){
                $post = new Model_Dao_Post($row);
                $results[] = $post;
            }
            if (!empty($results) && $add_votes){
                $this->add_votes($results);
            }
        }
        return $results;
    }
    
    /**
    * Возвращает список постов в обсуждении
    * 
    * @param int $limit
    * @param int $offset
    */
    public function get_posts($limit = 10, $offset = 0, $add_votes = true)
    {
        if (self::isTreeEnabled()){
            return $this->get_tree_posts($limit, $offset, $add_votes);
        }
        $res = DB::query(Database::SELECT, 'SELECT * FROM `'.Model_Dao_Post::$_table.'` WHERE `thread_id` = '.intval($this->id).' ORDER BY sort'.(($limit)?(' LIMIT '.$offset.','.$limit):''))
            ->execute()
            ->as_array();
        $results = array();
        foreach ($res as $row) {
            $post = new Model_Dao_Post($row);
            $results[] = $post;
        }
        if ($results) {
            if ($add_votes) {
                $this->add_votes($results);
            }
        }
        return $results;
    }
    
    public function add_votes(&$posts)
    {
        $ids = array();
        foreach ($posts as $post) {
            /**
            * @var $post Model_Dao_Post
            */
            $ids[] = $post->id;
        }
        $auth_user = Auth::instance()->get_user();
        if ($auth_user) {
            $votes = Model_Dao_Vote::get_from_user($auth_user->id,Service_Subject::TYPE_POST,$ids);
            foreach ($votes as $postId=>$vote) {
                foreach ($posts as $i=>$post) {
                    if ($post->id == $postId) {
                        $posts[$i]->voted = true;
                        break;
                    }
                }
            }
        }
    }
    
    /**
    * Возвращает посты рядом с определенным постом (максимум после него и добираем до лимита до него)
    * 
    * @param int $limit
    * @param int $post_sort
    */
    public function get_posts_near($post_sort, $limit = 10)
    {
        $res = DB::query(Database::SELECT, 'SELECT count(1) as cnt FROM `'.Model_Dao_Post::$_table.'` WHERE `thread_id` = '.intval($this->id).' AND `sort` < '.intval($post_sort))
            ->execute()->as_array();
        if (!$res) return array();
        $cnt = (int)$res[0]['cnt'];
        $from = floor($cnt / $limit);
        $res = DB::query(Database::SELECT, 'SELECT * FROM `'.Model_Dao_Post::$_table.'` WHERE `thread_id` = '.intval($this->id).' ORDER BY sort LIMIT '.$from.','.$limit)
            ->execute()
            ->as_array();
        $results = array();
        $found_cnt = count($res);
        if ($found_cnt<$limit) {
            $res_before = DB::query(Database::SELECT, 'SELECT * FROM `'.Model_Dao_Post::$_table.'` WHERE `thread_id` = '.intval($this->id).' AND `sort` < '.intval($post_sort).' ORDER BY sort DESC LIMIT '.($limit - $found_cnt))
                ->execute()
                ->as_array();
            $before_cnt = count($res_before);
            for ($i=$before_cnt-1;$i>=0;$i--) {
                $results[] = new Model_Dao_Post($res_before[$i]);
            }
        }
        for ($i=0;$i<$found_cnt;$i++) {
            $results[] = new Model_Dao_Post($res[$i]);
        }
        $this->add_votes($results);
        return $results;
    }
    
    public function get_posts_after($post_sort, $limit = 10)
    {
        $res = DB::query(Database::SELECT, 'SELECT * FROM `'.Model_Dao_Post::$_table.'` WHERE `thread_id` = '.intval($this->id).' AND `sort` > '.intval($post_sort).' ORDER BY sort LIMIT '.$limit)
            ->execute()
            ->as_array();
        $results = array();
        $found_cnt = count($res);
        for ($i=0;$i<$found_cnt;$i++) {
            $results[] = new Model_Dao_Post($res[$i]);
        }
        $this->add_votes($results);
        return $results;
    }
    public function get_posts_before($post_sort, $limit = 10)
    {
        $res = DB::query(Database::SELECT, 'SELECT * FROM `'.Model_Dao_Post::$_table.'` WHERE `thread_id` = '.intval($this->id).' AND `sort` <= '.intval($post_sort).' ORDER BY sort LIMIT '.$limit)
            ->execute()
            ->as_array();
        $results = array();
        $found_cnt = count($res);
        for ($i=0;$i<$found_cnt;$i++) {
            $results[] = new Model_Dao_Post($res[$i]);
        }
        $this->add_votes($results);
        return $results;
    }
    
    /**
    * Выдает следующий id для сортировки
    * 
    * @param Model_Dao_Post $reply_post - если сортируем ответ на сообщение
    */
    public function get_next_sort($reply_post = false)
    {
        $res = DB::query(Database::SELECT, 'SELECT * FROM `'.Model_Dao_Post::$_table.'` WHERE `thread_id` = '.intval($this->id).(($reply_post)?" AND `reply_to_id`= ".$reply_post->id:"").' ORDER BY sort DESC LIMIT 1')
            ->execute()
            ->as_array();
        if ($res) {
            $sort = intval($res[0]['sort']) + ($reply_post?1:100);
        } else {
            if ($reply_post) {
                $sort = $reply_post->sort + 1;
            } else {
                $sort = 100;
            }
        }
        return $sort;
        
    }
    
    /**
    * Вызывается при добавлении поста
    * 
    * @param Model_Dao_Post $post
    */
    public function added_post($post)
    {
        $this->num_posts++;
        $this->date_updated = time();
        if ($this->reply_to_post_id) {
            /**
            * @var Model_Dao_Post
            */
            $reply_post = Model_Dao_Post::get_by_id($this->reply_to_post_id);
            $reply_post->num_children++;
            $reply_post->save();
        }
        $this->save();
    }
    
    /**
    * Вызывается при удалении поста
    * 
    * @param Model_Dao_Post $post
    */
    public function removed_post($post)
    {
        $this->num_posts--;
        $this->date_updated = time();
        if ($this->reply_to_post_id) {
            /**
            * @var Model_Dao_Post
            */
            $reply_post = Model_Dao_Post::get_by_id($this->reply_to_post_id);
            $reply_post->num_children--;
            $reply_post->save();
        }
        $this->save();
    }
    
    public function delete()
    {
        $posts = $this->get_posts(0,0,false);
        foreach ($posts as $post) {
            $post->delete();
        }
        parent::delete();
    }
    
    /**
    * @return Model_Dao_Thread $id
    */
    static public function get_by_id($id) {
        return parent::get_by_id($id);
    }
    
    /**
    * Возвращает обсуждения по субъекту
    * 
    * @param int $type - тип субъекта (запись в блоге, статья и т п)
    * @param int $id - id субъекта
    * @return Model_Dao_Thread[]
    */
    static public function get_by_subject($type, $id, $limit=5, $offset=0) {
        $res = DB::query(Database::SELECT, 'SELECT * FROM `'.self::$_table.'` WHERE `subject_type` = '.intval($type).' AND `subject_id` = '.intval($id).' ORDER BY `is_primary` DESC, `date_updated` LIMIT '.intval($offset).','.intval($limit))
            ->execute()
            ->as_array();
        if (!$res) return array();
        $cnt = count($res); 
        $results = array();
        for($i=0;$i<$cnt;$i++) {
            $results[$res[$i]['id']] = new Model_Dao_Thread($res[$i]);
        }
        return $results;
    }
    
    static public function get_by_subjects($type, $ids) {
        Helper_Array::intval($ids);
        $res = DB::query(Database::SELECT, 'SELECT * FROM `'.self::$_table.'` WHERE `subject_type` = '.intval($type).' AND `subject_id` IN ('.implode(',',$ids).') ORDER BY `is_primary` DESC, `date_updated` DESC')
            ->execute()
            ->as_array();
        if (!$res) return array();
        $cnt = count($res); 
        $results = array();
        for($i=0;$i<$cnt;$i++) {
            $results[$res[$i]['id']] = new Model_Dao_Thread($res[$i]);
        }
        return $results;
    }
    
    static public function copyThreadPosts($fromThread, $toThread)
    {
        $oldPosts = $fromThread->get_posts(10000);
        $oldThreadId = $fromThread->id;
        $oldPostsIds = array();
        $newPostsIds = array();
        
        /**
        * @todo Создать системного юзера
        */
        /*$introPost = new Model_Dao_Post();
        $introPost->thread_id = $newThreadId;
        $introPost->text = 'Создана новая ветка обсуждений';
        $introPost->author_id = 10;
        $introPost->reply_to_id = 0;
        $introPost->sub_thread_id = 0;
        $introPost->save();
        $introPostId = $introPost->id;
        $introPost->updateRelations();*/
        
        self::copyPosts(0, $fromThread->id, $newThreadId);
        
        /*foreach($oldPosts as $post){
            $post->thread_id = $newThreadId;
            $oldPostsIds[] = $post->id;
            $post->id = 0;
            
            $post->save();
            $newPostsIds[] = $post->id;
            if ($post->reply_to_id != 0){
                $postKey = array_search($post->reply_to_id, $oldPostsIds);
                $post->reply_to_id = $newPostsIds[$postKey];
                $post->save();
            }else{
                $post->reply_to_id = $introPostId;
                $post->save();
            }
        }*/
    }
    
    static public function copyPosts($introPostId, $oldThreadId, $newThreadId)
    {
        $sql = 'SELECT * FROM `'.Model_Dao_Post::$_tableRelations.'` WHERE `thread_id` = :thread_id';
        $expr = DB::query(Database::SELECT, $sql)->parameters(array(':thread_id' => $oldThreadId));
        $rows = $expr->execute()->as_array();
        if (!empty($rows)){
            $sqlInsert = 'INSERT INTO `'.Model_Dao_Post::$_tableRelations.'` (`parent_post_id`, `child_post_id`, `thread_id`, `level`) VALUES ';
            foreach($rows as $row){
                $parent = ($row['parent_post_id'] == 0) ? $introPostId : $row['parent_post_id'];
                $level = $row['level'];
                $sqlInsert .= ' ("'.$parent.'", "'.$row['child_post_id'].'", "'.$newThreadId.'", "'.$level.'"), ';
                /*$sqlInsert .= ' ("0", "'.$row['child_post_id'].'", "'.$newThreadId.'", "'.($level + 1).'"), ';*/
            }
            $sqlInsert = trim($sqlInsert, ', ');
            DB::query(Database::INSERT, $sqlInsert)->execute();
        }
        
    }
    
    static public function duplicateNodeThreads($prevNodes, $newNodes)
    {
        foreach($prevNodes as $k => $prevNode){
            $newNode = $newNodes[$k];
            /** @var $oldThread Model_Dao_Thread */
            $oldThread = self::get_by_subject(2, $prevNode->id);
            /** @var $newThread Model_Dao_Thread */
            $newThread = self::get_by_subject(2, $newNode->id);
            if (!empty($oldThread)){
                $newThread = reset($newThread);
                $oldThread = reset($oldThread);
                if (empty($newThread)) {
                    $newThread = new Model_Dao_Thread($oldThread->as_array());
                    $newThread->id = 0;
                    $newThread->subject_id = $newNode->id;
                    $newThread->save();
                }
                self::copyPosts(0,$oldThread->id,$newThread->id);
                //self::copyNodeThread($oldThread,$newNode->id);
                //$oldThread->copyNodeThread($newNode->id);
            }
        }
    }
    
}

