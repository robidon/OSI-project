<?php
class Model_Dao {

    static public $_table;
    static public $_fields;
    static public $_primary_key = 'id';

    public function __construct($data = null) {
        if ($data!=null) {
            foreach ($data as $key=>$value) {
                $this->$key = $value;
            }
        }
    }
    
    public function save()
    {   
        $class_name = get_class($this);
        $vars = get_class_vars($class_name);
        $pk = $vars['_primary_key'];
        $cnt = count($vars['_fields']);
        if ($pk && $this->$pk) {
            $pairs = array();
            for ($i=0;$i<$cnt;$i++) {
                $f = $vars['_fields'][$i];
                $pairs[$f] = $this->$f;
            }
            return DB::update($vars['_table'])
                ->where($pk,"=",$this->$pk)
                ->set($pairs)
                ->execute();
        } else {
            $values = array();
            for ($i=0;$i<$cnt;$i++) {
                $f = $vars['_fields'][$i];
                $values[] = $this->$f;
            }
            $res = DB::insert($vars['_table'],$vars['_fields'])
                ->values($values)
                ->execute();
            if ($res) {
                if ($pk) {
                    $this->$pk = $res[0];
                    return $this->$pk;
                } else {
                    return $res;
                }
            }
            return false;
        }
    }
    
    public function delete()
    {
        $class_name = get_class($this);
        $vars = get_class_vars($class_name);
        $pk = $vars['_primary_key'];
        if ($pk) {
            return DB::delete($vars['_table'])
                ->where($pk,'=',$this->$pk)
                ->execute();
        }
    }
    
    static public function get_by_id($id) {
        $class_name = get_called_class();
        $vars = get_class_vars($class_name);
        if (!is_array($id)) {
            $fetch_one = true;
            $ids = intval($id);
        } else {
            $fetch_one = false;
            $cnt = count($id);
            $ids = '';
            for ($i=0;$i<$cnt;$i++) {
                $ids.=$id[$i].",";
            }
            $ids = rtrim($ids,',');
        }
        $sql = 'SELECT * FROM `'.$vars['_table'].'` WHERE `'.$vars['_primary_key'].'` IN ('.$ids.')';
        $res = DB::query(Database::SELECT,
                $sql)
                ->execute()
                ->as_array();
        if ($fetch_one) {
            if (!$res) return null;
            $res = $res[0];
            return new $class_name($res);
        } else {
            if (!$res) return array();
            $ress = array();
            foreach ($res as $r) {
                $ress[$r[$vars['_primary_key']]] = new $class_name($r);
            }
            return $ress;
        }
    }
    
    public function as_array()
    {
        $class_name = get_class($this);
        $vars = get_class_vars($class_name);
        $result = array();
        foreach ($vars['_fields'] as $f) {
            $result[$f] = $this->$f;
        }
        return $result;
    }
}