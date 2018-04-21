<?php
class Model_Dao_Vote extends Model_Dao {

    public static $_table = 'votes';
    public static $_fields = array('from_user_id','subject_type','subject_id','date','to_user_id','reason','points');
    static public $_primary_key = '';

    public $from_user_id;
    public $subject_type;
    public $subject_id;
    public $date;
    public $to_user_id;
    public $reason;
    public $points;
    
    private $_from_user = false;
    private $_to_user = false;
    
    public function from_user()
    {
        if ($this->_from_user === false) {
            $this->_from_user = new Model_User($this->from_user_id);
        }
        return $this->_from_user;
    }
    public function to_user()
    {
        if ($this->_to_user === false) {
            $this->_to_user = new Model_User($this->to_user_id);
        }
        return $this->_from_user;
    }
    public function info()
    {
        if ($this->subject_type == Service_Subject::TYPE_POST) {
            $post = Model_Dao_Post::get_by_id($this->subject_id);
            if ($post) {
                return 'Пост: '.$post->text;
            }
        }
        return Service_Subject::get_type_name($this->subject_type);
    }
    /**
    * Возвращает голоса юзеру. лог
    * 
    * @param mixed $user_id
    */
    static public function get_to_user($user_id, $offset=0, $limit=10) {
        $sql = "SELECT * FROM `".self::$_table."` WHERE `to_user_id` = ".(int)$user_id." ORDER BY `date` DESC LIMIT ".$offset.",".$limit;
        $res = DB::query(Database::SELECT, $sql)->execute()->as_array();
        $results = array();
        foreach ($res as $row) {
            $results[] = new Model_Dao_Vote($row);
        }
        return $results;
    }
    
    /**
    * Возвращает голоса, которые сделал юзер. по определенным субъектам
    * 
    * @param mixed $user_id
    * @param mixed $subject_type
    * @param mixed $subject_ids
    */
    static public function get_from_user($user_id, $subject_type, $subject_ids)
    {
        $sql = "SELECT * FROM `".self::$_table."` WHERE `from_user_id` = ".(int)$user_id." AND `subject_type` = ".(int)$subject_type." AND `subject_id` IN (".implode(',',$subject_ids).")";
        $res = DB::query(Database::SELECT, $sql)->execute()->as_array();
        $results = array();
        foreach ($res as $row) {
            $results[$row['subject_id']] = new Model_Dao_Vote($row);
        }
        return $results;
    }
    
}
