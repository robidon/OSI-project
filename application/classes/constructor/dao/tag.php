<?php
class Constructor_Dao_Tag extends Model_Dao
{
    public static $_table = 'tags';
    public static $_tableItems = 'tags_items';
    
    public static $_fields = array('id', 'namespace_id', 'name', 'description', 'parent_tag_id', 'crc');
    
    public $id;
    public $namespace_id;
    public $name;
    public $description;
    public $parent_tag_id;
    public $crc;
    
    
    const ITEM_TYPE_FILE = 1;
    const ITEM_TYPE_NODE = 2;
    
    /**
    * @param mixed $id
    * @return Constructor_Dao_Tag
    */
    public static function get_by_id($id)
    {
        return parent::get_by_id($id);
    }
    
    public static function get_by_namespace($namespaceId)
    {
        $sql = 'SELECT * FROM `'.self::$_table.'` 
                WHERE `namespace_id` = :namespace_id';
        $expr = DB::query(Database::SELECT, $sql)
                ->parameters(array(':namespace_id' => $namespaceId)); 
        $res = $expr->execute()->as_array();
        $results = array();
        foreach ($res as $row) {
            $results[] = new Constructor_Dao_Tag($row);
        }
        return $results;
    }
    
    public static function searchTags($namePart, $namespaceId = 0, $parentTagId)
    {
        $sql = 'SELECT * FROM `'.self::$_table.'` 
                WHERE `namespace_id` = :namespace_id AND `name` LIKE :name_part AND `parent_tag_id` = :parent_tag_id';
        $expr = DB::query(Database::SELECT, $sql)
                ->parameters(array(':namespace_id' => $namespaceId, ':name_part' => $namePart.'%', ':parent_tag_id' => $parentTagId)); 
        return $expr->execute()->as_array();
    }
    
    private static function prepareStructuredTags(&$data)
    {
        if (is_array($data)){
            if (empty($data)){
                $data = 1;
            } else {
                foreach($data as &$el){
                    self::prepareStructuredTags($el);
                }
            }
        }
    }
    
    private static function addTagToStruct($structure, $tag)
    {
        if (!is_array($structure)){
            $structure = array(
                'title'=>$tag['name'],
                'children'=>array()
            );
        } elseif($tag['parent_tag_id'] == 0) { 
            $structure[$tag['name']] = array(
                'title'=>$tag['name'],
                'children'=>array()
            );
        }else {
            foreach($structure as $tagName => &$item){
                if (is_array($item)){
                    $item = array(
                        'title'=>$tag['name'],
                        'children'=>self::addTagToStruct($item, $tag)
                    );
                } else {
                    $parentTag = self::get_by_id($tag['parent_tag_id']);
                    if ($tagName == $parentTag->name){
                        $item = array(
                            'title'=>$tag['name'],
                            'children'=>array()
                        );
                    }
                }
            }
        }
        return $structure;
    }
    
    public static function getAllTags($structured = false)
    {
        $sql = 'SELECT * FROM `'.self::$_table.'`';
        $tags = DB::query(Database::SELECT, $sql)->execute()->as_array();
        $result = array();
        if (!$structured){
            foreach($tags as $tag){
                $result[$tag['id']] = $tag;
            }
        } else {
            $children = array();
            $namespaceIds = array();
            foreach ($tags as $tag) {
                /** @var $tag Constructor_Dao_Tag */
                if (!isset($children[$tag['parent_tag_id']])) {
                    $children[$tag['parent_tag_id']] = array($tag);
                } else {
                    $children[$tag['parent_tag_id']][] = $tag;
                }
                if (!isset($namespaceIds[$tag['namespace_id']])) {
                    $namespaceIds[$tag['namespace_id']] = 1;
                }
            }
            function createTree(&$list, $parentId, $namespaceId) {
                $tree = array();
                foreach ($list[$parentId] as $k=>$l){
                    if ($l['namespace_id'] != $namespaceId) continue;
                    if(isset($list[$l['id']])){
                        $l['children'] = createTree($list, $l['id'], $namespaceId);
                    }
                    $tree[] = array(
                        'children'=>@$l['children'],
                        'title'=>$l['description'],
                        'name'=>$l['name'],
                        'id'=>$l['id']
                    );
                } 
                return $tree;
            }
            foreach ($namespaceIds as $id=>$val) {
                $result[$id] = createTree($children, 0, $id);
            }
            /*
            foreach($tags as $tag){
                if (!isset($result[$tag['namespace_id']])) {
                    $result[$tag['namespace_id']] = array();
                }
                $result[$tag['namespace_id']][$tag['id']] = $tag;
            }
            foreach ($result as $namespaceId=>$tags) {
                $structuredResult = 1;
                foreach($tags as $tagId => $tag) {
                    $structuredResult = self::addTagToStruct($structuredResult, $tag);
                }
                $result[$namespaceId] = array (
                    'title'=>$namespaceId,
                    'children'=>$structuredResult
                );
            }*/
        }
        return $result;
    }
    
    public static function getTagsByItem($itemId, $itemType)
    {
        $tags = array();
        $sql = 'SELECT * FROM `'.self::$_tableItems.'` WHERE `item_id` = :item_id AND `item_type` = :item_type';
        $expr = DB::query(Database::SELECT, $sql)->parameters(array(':item_id' => $itemId, ':item_type' => $itemType));
        $rows = $expr->execute()->as_array();
        foreach($rows as $row){
            $tags[$row['id']] = Constructor_Dao_Tag::get_by_id($row['id']);
        }
        return $tags;
    }
    
    public static function addTagToItem($itemId, $itemType, $tagId)
    {
        $sql = 'INSERT INTO `'.self::$_tableItems.'` (`item_type`, `item_id`, `tag_id`) 
                VALUES (:item_type, :item_id, :tag_id) ON DUPLICATE KEY UPDATE `tag_id` = `tag_id`';
        DB::query(Database::INSERT, $sql)->parameters(array(':item_type' => $itemType, ':item_id' => $itemId, ':tag_id' => $tagId))->execute();
    }
    
    public static function removeTagFromItem($itemId, $itemType, $tagId)
    {
        $sql = 'DELETE FROM `'.self::$_tableItems.'` 
                WHERE `item_type` = :item_type AND `item_id` = :item_id AND `tag_id` = :tag_id';
        DB::query(Database::DELETE, $sql)->parameters(array(':item_type' => $itemType, ':item_id' => $itemId, ':tag_id' => $tagId))->execute();
    }
    
    public static function removeAllTagsFromItem($itemId, $itemType)
    {
        $sql = 'DELETE FROM `'.self::$_tableItems.'` 
                WHERE `item_type` = :item_type AND `item_id` = :item_id';
        DB::query(Database::DELETE, $sql)->parameters(array(':item_type' => $itemType, ':item_id' => $itemId))->execute();
    }
    
    public static function getTagByCrc($crc)
    {
        $sql = 'SELECT * FROM `'.self::$_table.'` WHERE `crc` = :crc';
        $res = DB::query(Database::SELECT, $sql)->parameters(array(':crc' => $crc))->execute()->as_array();
        if (!empty($res)){
            return new Constructor_Dao_Tag($res[0]);
        }else{
            return false;
        }
    }
    
    public function delete()
    {
        $sqlDelete = 'DELETE FROM `'.self::$_tableItems.'` WHERE `tag_id` = :tag_id';
        DB::query(Database::DELETE, $sqlDelete)->parameters(array(':tag_id' => $this->id))->execute();
        parent::delete();
    }
    
    public function save()
    {
        $this->crc = sprintf("%u",crc32(mb_strtolower(trim($this->name))));
        return parent::save();
    }
    
    public function getChildren()
    {
        $sqlSelect = 'SELECT * FROM `'.self::$_table.'` WHERE `parent_tag_id` = :parent_tag_id';
        $expr = DB::query(Database::SELECT, $sqlSelect)->parameters(array('parent_tag_id' => $this->id));
        return $expr->execute()->as_array();
    }
    
    public function getElementsByType($typeId = self::ITEM_TYPE_FILE)
    {
        $result = array();
        $sql = 'SELECT `item_id` FROM `'.self::$_tableItems.'` WHERE `tag_id` = :tag_id AND `item_type` = :item_type ';
        $itemsRows = DB::query(Database::SELECT, $sql)->parameters(array(':tag_id' => $this->id, ':item_type' => $typeId))->execute()->as_array();
        foreach($itemsRows as $row){
            $result[] = $row['item_id'];
        }
        return $result;
    }
    
    public function getParent()
    {
        if ($this->parent_tag_id){
            return self::get_by_id($this->parent_tag_id);
        }else{
            return false;
        }
    }
    
    public function getFullPath()
    {
        $path = array();
        $path[] = $this;
        $obj = $this;
        while($obj->parent_tag_id){
            $parentNode = $obj->getParent();
            if ($parentNode == false){
                break;
            }
            $path[] = $parentNode;
            $obj = $parentNode;
        }
        return $path;
    }
}
