<?php
class Constructor_Dao_Operator extends Model_Dao {
    
    public static $_table = 'c_operators';
    public static $_fields = array('uid', 'id', 'version', 'is_latest', 'type', 'name', 'file_id', 'date_published', 'formula', 'title', 'description', 'publisher_type', 'publisher_id');

    public $uid;
    public $id;
    public $version;
    public $is_latest;
    public $type;
    public $name;
    public $file_id;
    public $date_published;
    public $formula;
    public $title;
    public $description;
    public $publisher_type;
    public $publisher_id;
    
    const TYPE_DATA = 1;
    const TYPE_FORMULA = 2;
    const TYPE_MODEL = 3;
    
    /**
    * все доступные для пользователя операторы
    * 
    * @param int $user_id
    */
    static public function get_avaliable($user_id)
    {
        $sql = "SELECT * FROM `".self::$_table."`";
        $res = DB::query(Database::SELECT, $sql)->execute()->as_array();
        $results = array();
        foreach ($res as $row) {
            $results[$row['uid']] = new Constructor_Dao_Operator($row);
        }
        return $results;
    }
    
    /**
    * @param mixed $id
    * @return Constructor_Dao_Operator
    */
    static public function get_by_id($id)
    {
        return parent::get_by_id($id);
    }
}
?>
