<?php
class Model_Dao_Post extends Model_Dao {

    static public $_table = 'posts';
    public static $_tableRelations = 'posts_relations';
    static public $_fields = array('id','thread_id','text','date','author_id','reply_to_id','rating','sort','num_children','sub_thread_id');
    
    public $id;
    public $thread_id;
    public $text;
    public $date;
    public $author_id;
    public $reply_to_id;
    public $rating;
    public $sort;
    public $num_children;
    public $sub_thread_id;
    private $_thread = false;
    private $_author = false;
    
    public $textShow;
    
    public $voted = false;
    
    public function __construct($data = null)
    {
        parent::__construct($data);
        $this->textShow = self::add_links($this->text);
        $this->textShow = self::parseUsers($this->textShow);
    }
    
    public function parseUsers($text)
    {
        if (preg_match('/@user_(\d+)/', $text, $matches)){
            $user = new Model_User($matches[1]);
            $text = preg_replace('/@user_\d+/', '<b>'.$user->username.'</b>', $text);
        }
        return $text;
    }
    
    /**
    * @return Model_Dao_Thread
    */
    public function get_thread()
    {
        if ($this->_thread === false) {
            $this->_thread = Model_Dao_Thread::get_by_id($this->thread_id);
        }
        return $this->_thread;
    }
    public function get_author()
    {
        if ($this->_author === false) {
            $this->_author = new Model_User($this->author_id);
        }
        return $this->_author;
    }
    
    static public function get_last_reply($thread_id, $id)
    {
        $res = DB::query(Database::SELECT, 'SELECT * FROM `'.Model_Dao_Post::$_table.'` WHERE `thread_id` = '.intval($thread_id).' AND `reply_to_id`= '.intval($id).' ORDER BY sort DESC LIMIT 1')
            ->execute()
            ->as_array();
        if ($res) {
            return new Model_Dao_Post(reset($res));
        }
        return false;
    }
    
    public function save()
    {
        $adding = false;
        if (!$this->sort) {
            $adding = true;
            $reply_post = Model_Dao_Post::get_by_id($this->reply_to_id);
            $this->sort = $this->get_thread()->get_next_sort($reply_post);
        }
        if (!$this->date) $this->date = date('Y-m-d H:i:s');
        if (!$this->rating) $this->rating = 0;
        if (!$this->num_children) $this->num_children = 0;
        $res = parent::save();
        if ($res && $adding) {
            $this->get_thread()->added_post($this);
        }
        return $res;
    }
    
    public function updateRelations()
    {
        if (Model_Dao_Thread::isTreeEnabled()){
            $relations = array();
            if ($this->reply_to_id){
                $sql = 'SELECT * FROM `'.self::$_tableRelations.'` WHERE `child_post_id` = :child_post_id';
                $expr = DB::query(Database::SELECT, $sql)->parameters(array(':child_post_id' => $this->reply_to_id));
                $rows = $expr->execute()->as_array();
                foreach($rows as $row){
                    $row['child_post_id'] = $this->id;
                    $row['level'] = $row['level'] + 1;
                    $relations[] = $row;
                }
            }
            $newRelation = array('parent_post_id' => $this->reply_to_id, 'child_post_id' => $this->id, 'thread_id' => $this->thread_id, 'level' => 1);
            $relations[] = $newRelation;
            self::addRelations($relations);
        }
    }
    
    public static function addRelations($relations)
    {
        $sql = 'INSERT INTO `'.self::$_tableRelations.'` (parent_post_id, child_post_id, thread_id, level)
            VALUES (:parent_post_id, :child_post_id, :thread_id, :level)';
        $expr = DB::query(Database::INSERT, $sql);
        foreach($relations as $rel){
            $expr->parameters(array(
                ':parent_post_id' => $rel['parent_post_id'],
                ':child_post_id' => $rel['child_post_id'],
                ':thread_id' => $rel['thread_id'],
                ':level' => $rel['level'],
            ))->execute();
        }
    }
    
    public static function deleteRelationsForPost($childPostId)
    {
        $sql = 'DELETE FROM `'.self::$_tableRelations.'` WHERE `child_post_id` = :child_post_id';
        $expr = DB::query(Database::DELETE, $sql)->parameters(array(':child_post_id' => $childPostId));
        $expr->execute();
    }
    
    public function delete()
    {
        if ($this->num_children > 0) {
            if ($this->sub_thread_id) {
                $thread = Model_Dao_Thread::get_by_id($this->sub_thread_id);
                if ($thread) {
                    $thread->delete();
                }
            } else {
                $res = DB::query(Database::SELECT, "SELECT * FROM ".self::$_table." WHERE reply_to_id = ".(int)$this->id)->execute()->as_array();
                foreach ($res as $row) {
                    $post = new Model_Dao_Post($row);
                    $post->delete();
                }
            }
        }
        self::deleteRelationsForPost($this->id);
        parent::delete();
    }
    /**
    * @return Model_Dao_Post $id
    */
    static public function get_by_id($id) {
        return parent::get_by_id($id);
    }

    static public function move_posts($from_thread_id, $from_reply_to_id, $to_thread_id)
    {
        $query = 'UPDATE posts SET thread_id = '.intval($to_thread_id).', reply_to_id = 0, sort = sort % 100 * 100 WHERE thread_id = '.intval($from_thread_id).' AND reply_to_id = '.intval($from_reply_to_id).';';
        $res = DB::query(Database::UPDATE, $query)->execute();
        return $res;
    }
    
    static public function sanitize($message) {
        $white_list = array("br","b","em","i","li","ol","strong","stroke","sup","sub","u","ul","a");
        $message = UTF8::trim($message);
        $items = explode('<',$message);
        $cnt = count($items);
        if ($cnt <= 1) return $message;
        $result = '';
        for($i = 0; $i < $cnt; $i++) {
            if (!$items[$i]) continue;
            $entry = explode('>',$items[$i],2);
            if (count($entry) == 1) {
                $result .= $entry[0];
                continue;
            }
            $tag = UTF8::ltrim($entry[0],'/');
            if (array_search($tag,$white_list)===false) {
                $result .= $entry[1];
                continue;
            }
            $result .= '<'.$entry[0].'>'.$entry[1];
        }
        return $result;
    }
    
    static public function add_links($message) {
        return preg_replace("/((http\:\/\/|https\:\/\/|ftp\:\/\/)|(www.))+(([a-zA-Z0-9\.-]+\.[a-zA-Z]{2,4})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(\/[a-zA-Z0-9%:\/\-_\#\|\\\?\.\,'~]*)?/i","<a href='$0' target='_blank'>$0</a>",$message);
    }
}