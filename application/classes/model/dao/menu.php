<?php
class Model_Dao_Menu extends Model_Dao {

    public static $_table = 'menus';
    public static $_fields = array('id','parent','menu_id','name','title','tooltip','link','target','more','visibility','order');

    public $id;
    public $parent;
    public $menu_id;
    public $name;
    public $title;
    public $tooltip;
    public $link;
    public $target;
    public $more;
    public $visibility;
    public $order;
    
    /**
    * @param mixed $id
    * @return Model_Dao_Menu
    */
    static public function get_by_id($id)
    {
        return parent::get_by_id($id);
    }
    public static function get_visible($menu = 0, $min_menu_visibility = 0) {
        $min_menu_visibility = intval($min_menu_visibility);
        $sql = 'SELECT * FROM `'.self::$_table.'` WHERE `visibility` <= '.$min_menu_visibility;
        if ($menu) {
            $sql.= ' AND `menu_id`='.(int)$menu;
        }
        $sql.= ' ORDER BY `menu_id`, `parent`, `order`';
        $data = DB::query(Database::SELECT,$sql)->execute()->as_array();
        $result = array();
        foreach ($data as $row) {
            $result[$row['id']] = new Model_Dao_Menu($row);
        }
        return $result;
    }
}

