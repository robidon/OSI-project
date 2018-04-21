<?php
class Constructor_Dao_Namespace extends Model_Dao
{
    public static $_table = 'namespace';
    
    public static $_fields = array('id', 'name', 'description');
    
    public $id;
    public $name;
    public $description;
    
    const ID_ACTIONS = 1;
    const ID_MACRO = 2;
    
    /**
    * @param mixed $id
    * @return Constructor_Dao_Namespace
    */
    public static function get_by_id($id)
    {
        return parent::get_by_id($id);
    }
    
    public static function getAllNamespaces()
    {
        $sql = 'SELECT * FROM `'.self::$_table.'`';
        return DB::query(Database::SELECT, $sql)->execute()->as_array();
    }
    
    public function delete()
    {
        $sql = 'SELECT * FROM `'.Constructor_Dao_Tag::$_table.'` WHERE `namespace_id` = :namespace_id';
        $rows = DB::query(Database::SELECT, $sql)->parameters(array(':namespace_id' => $this->id))->execute()->as_array();
        foreach($rows as $row){
            $tag = Constructor_Dao_Tag::get_by_id($row['id']);
            $tag->delete();
        }
        parent::delete();
    }
}
