<?php
class Constructor_Dao_Macroparams extends Model_Dao
{
    public static $_table = 'macroparams';
    public static $_tableUsers = 'user_macroparams';
    
    public static $_fields = array('id', 'title', 'enabled');
    
    public $id;
    public $title;
    public $enabled;
    
    public static $availableYears = array(2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018);
    
    public function __construct($data = null)
    {
        parent::__construct($data);
    }
    
    /**
    * 
    * @return Constructor_Dao_Macroparams
    */
    public static function get_by_id($id)
    {
        return parent::get_by_id($id);
    }
    
    public static function getParams($enabled = 1)
    {
        $sql = 'SELECT * FROM `'.self::$_table.'` ';
        if ($enabled){
            $sql .= ' WHERE `enabled` = 1 ';
        }
        $rows = DB::query(Database::SELECT, $sql)->execute()->as_array();
        $result = array();
        foreach($rows as $row){
            $result[$row['id']] = new self($row);
        }
        return $result;
    }
    
    private static $userParamsCache = array();
    public static function getUserParams($userId)
    {
        if (isset(self::$userParamsCache[$userId])) {
            return self::$userParamsCache[$userId];
        }
        $sqlSelect = 'SELECT * FROM `'.self::$_tableUsers.'` WHERE user_id = :user_id';
        $result = array();
        $rows = DB::query(Database::SELECT, $sqlSelect)->parameters(array(':user_id' => $userId))->execute();
        foreach($rows as $row){
            $result[$row['param_id']][$row['param_key']] = $row['param_value'];
        }
        self::$userParamsCache[$userId] = $result;
        return $result;
    }
    
    public static function setUserParams($userId, $params)
    {
        unset(self::$userParamsCache[$userId]);
        $sql = 'REPLACE INTO `'.self::$_tableUsers.'` (`user_id`, `param_id`, `param_key`, `param_value`) 
                VALUES (:user_id, :param_id, :param_key, :param_value)';
        $expr = DB::query(Database::INSERT, $sql);
        foreach($params as $paramId => $rows){
            foreach($rows as $year => $val){
                $expr->parameters(array(
                    ':user_id' => $userId,
                    ':param_id' => $paramId,
                    ':param_key' => $year,
                    ':param_value' => $val,
                ))->execute();
            }
        }
        return true;
    }
}