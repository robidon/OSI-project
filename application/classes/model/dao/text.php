<?php
class Model_Dao_Text extends Model_Dao {

    public static $_table = 'texts';
    public static $_fields = array('id','crc','name','text','date_modified','date_added','user_id','status','location');
    
    public $id;
    public $crc;
    public $name;
    public $text;
    public $date_modified;
    public $date_added;
    public $user_id;
    public $status;
    public $location;
    
    private $_author;
    
    public function __construct($data = null) {
        parent::__construct($data);
    }
    
    public function get_author() {
        if (!$this->_author) {
            $this->_author = new Model_User($this->user_id);
        }
        return $this->_author;
    }
    
    /**
    * @param mixed $id
    * @return Model_Dao_Text
    */
    static public function get_by_id($id) {
        return parent::get_by_id($id);
    }
    
    static public function get_all($limit, $offset) {
        $data = DB::query(Database::SELECT,"SELECT * FROM `".self::$_table."` WHERE `status` < 2 LIMIT ".(int)$offset.", ".(int)$limit)
            ->execute()->as_array();
        if (!$data) return array();
        $results = array();
        foreach ($data as $row) {
            if (isset($results[$row['name']])) {
                if ($row['status'] != 0) {
                    continue;
                }
            }
            $results[$row['name']] = new Model_Dao_Text($row);
        }
        return $results;
    }
    
    static public function get_by_crc($crc, $status = 1) {
        $data = DB::query(Database::SELECT,"SELECT * FROM `".self::$_table."` WHERE `crc` = ".$crc." AND `status` = ".intval($status))
            ->execute()->as_array();
        if (!$data) return null;
        return new Model_Dao_Text($data[0]);
    }
    /**
    * Возвращает модель текста по его названию
    * 
    * @param string $name
    * @param int $status
    * @return Model_Dao_Text
    */
    static public function by_name($name,$status = 1)
    {
        return self::get_by_crc(crc32($name), $status);
    }
    static public function deleteByName($name)
    {
        return DB::query(Database::DELETE,"DELETE FROM `".self::$_table."` WHERE `crc` = ".crc32($name))->execute();
    }
    public function save()
    {
        $this->crc = crc32($this->name);
        $this->date_modified = date('Y-m-d H:i:s');
        if (!$this->date_added) {
            $this->date_added = date('Y-m-d H:i:s');
        }
        return parent::save();
    }
    public function publish()
    {
        $this->save();
        $crc = crc32($this->name);
        DB::delete(self::$_table)
            ->where("crc","=",$crc)
            ->where("status",">=",10)
            ->execute();
        DB::query(Database::UPDATE,"UPDATE `".self::$_table."` SET `status` = `status`+1 WHERE `crc` = ".$crc)
            ->execute();
    }
}
