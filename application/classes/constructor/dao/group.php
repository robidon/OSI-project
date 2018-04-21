<?php
class Constructor_Dao_Group extends Model_Dao
{
    public static $_table =             'c_groups';
    public static $_tableGroupItems =   'c_groups_items';
    
    public static $_fields = array('id', 'file_uid', 'name', 'description', 'x', 'y', 'opened', 'style', 'rotation', 'full_desc', 'date_modified');
    
    public $id;
    public $file_uid;
    public $name;
    public $description;
    public $x;
    public $y;
    public $opened;
    public $style = 0;
    public $rotation = 0;
    public $full_desc = '';
    public $date_modified = 0;
    
    public $nodeIds = array();
    public $innerGroupIds = array();
    private $nodes = null;
    private $innerGroups = null;
    
    const ITEM_TYPE_NODE = 0;
    const ITEM_TYPE_GROUP = 1;
    
    /**
    * @param mixed $id
    * @return Constructor_Dao_Group
    */
    public static function get_by_id($id)
    {
        return parent::get_by_id($id);
    }
    
    public function __construct($data = null)
    {
        parent::__construct($data);
        $sql = 'SELECT `item_id`, `item_type` FROM `'.self::$_tableGroupItems.'` WHERE `group_id` = '.intval($this->id);
        $res = DB::query(Database::SELECT, $sql)->execute()->as_array();
        foreach($res as $row){
            if ($row['item_type'] == self::ITEM_TYPE_NODE){
                $this->nodeIds[] = (int)$row['item_id'];
            }elseif($row['item_type'] == self::ITEM_TYPE_GROUP){
                $this->innerGroupIds[] = (int)$row['item_id'];
            }
        }
    }
    
    public function save() {
        $this->date_modified = date("Y-m-d H:i:s");
        parent::save();
    }
    
    public function getNodes()
    {
        if ($this->nodes !== null) return $this->nodes;
        $this->nodes = array();
        foreach($this->nodeIds as $id){
            $this->nodes[$id] = Constructor_Dao_Node::get_by_id($id);
        }
        return $this->nodes;
    }
    
    public function getInnerGroups()
    {
        if ($this->innerGroups !== null) return $this->innerGroups;
        $this->innerGroups = array();
        foreach($this->innerGroupIds as $id){
            $this->innerGroups[$id] = Constructor_Dao_Group::get_by_id($id);
        }
        return $this->innerGroups;
    }
    
    public function setNodes($nodeIds)
    {
        if ($this->nodeIds) {
            $this->removeItems($this->nodeIds, self::ITEM_TYPE_NODE);
        }
        $this->addNodes($nodeIds);
    }
    
    public function setInnerGroups($groupIds)
    {
        if ($this->innerGroupIds) {
            $this->removeItems($this->innerGroupIds, self::ITEM_TYPE_GROUP);
        }
        $this->addInnerGroups($groupIds);
    }
    
    public function addNodes($nodeIds)
    {
        if (!empty($nodeIds)){
            $sqlInsert = 'REPLACE INTO `'.self::$_tableGroupItems.'` (`group_id`, `item_id`, `item_type`) VALUES ';
            foreach($nodeIds as $id){
                $sqlInsert .= ' ("'.(int)$this->id.'", "'.(int)$id.'", "'.(int)self::ITEM_TYPE_NODE.'"), ';
            }
            $sqlInsert = trim($sqlInsert,', ');
            //$sqlInsert .= ' ON DUPLICATE KEY UPDATE `item_id` = `item_id`';
            DB::query(Database::INSERT, $sqlInsert)->execute();
            $this->nodeIds = array_merge($this->nodeIds, $nodeIds);
            $this->nodeIds = array_unique($this->nodeIds);
            $this->nodes = null;
        }
    }
    
    public function addInnerGroups($groupsIds)
    {
        if (!empty($groupsIds)){
            $sqlInsert = 'INSERT INTO `'.self::$_tableGroupItems.'` (`group_id`, `item_id`, `item_type`) VALUES ';
            foreach($groupsIds as $id){
                $sqlInsert .= ' ("'.(int)$this->id.'", "'.(int)$id.'", "'.(int)self::ITEM_TYPE_GROUP.'"), ';
            }
            $sqlInsert = trim($sqlInsert,', ');
            $sqlInsert .= ' ON DUPLICATE KEY UPDATE `item_id` = `item_id`';
            DB::query(Database::INSERT, $sqlInsert)->execute();
            $this->innerGroupIds = array_merge($this->innerGroupIds, $groupsIds);
            $this->innerGroupIds = array_unique($this->innerGroupIds);
            $this->innerGroups = null;
        }
    }
    
    public function removeItems($itemsIds, $type)
    {
        if (!empty($itemsIds)){
            foreach($itemsIds as &$id){
                $id = (int)$id;
            }
            $sqlDelete = 'DELETE FROM `'.self::$_tableGroupItems.'` 
                        WHERE `group_id` = "'.(int)$this->id.'" AND `item_id` IN ('.implode(', ', $itemsIds).') AND `item_type` = "'.(int)$type.'"';
            DB::query(Database::DELETE, $sqlDelete)->execute();
            switch($type){
                case self::ITEM_TYPE_NODE:
                    $this->nodeIds = array_diff($this->nodeIds, $itemsIds);
                    $this->nodes = null;
                    break;
                case self::ITEM_TYPE_GROUP:
                    $this->innerGroupIds = array_diff($this->innerGroupIds, $itemsIds);
                    $this->innerGroups = null;
                    break;
            }
        }
    }
    
    public function delete($removeNodes = false, $removeGroups = false)
    {
        if ($removeNodes){
            $nodes = $this->getNodes();
            if (!empty($nodes)){
                foreach($nodes as $node){
                    $node->delete();
                }
            }
        }
        if ($removeGroups){
            $groups = $this->getInnerGroups();
            if (!empty($groups)){
                foreach($groups as $group){
                    $group->delete($removeNodes, $removeGroups);
                }
            }
        }
        $sqlDelete = 'DELETE FROM `'.self::$_tableGroupItems.'` WHERE `group_id` = "'.(int)$this->id.'"';
        DB::query(Database::DELETE, $sqlDelete)->execute();
        return parent::delete();
    }
    
    public static function duplicateGroups($oldGroups, $fileId, $prevNodes, $newNodes)
    {
        $oldGroupsToNew = array();
        foreach($oldGroups as $group){
            $oldGroupNodes = array_keys($group->getNodes());
            
            $oldGroupId = $group->id;
            $group->id = false;
            $group->file_uid = $fileId;
            $group->save();
            $newGroupId = $group->id;
            $oldGroupsToNew[$oldGroupId] = $newGroupId;
            
            // add nodes 
            if (!empty($oldGroupNodes)){
                foreach($oldGroupNodes as $ognId){
                    foreach($prevNodes as $k => $prNode){
                        if ($prNode->id == $ognId){
                            $group->addNodes(array($newNodes[$k]->id));
                        }
                    }                    
                }
            }            
        }
        foreach($oldGroups as $k => $_group){
            $group = Constructor_Dao_Group::get_by_id($k);
            $newOuterGroupId = $oldGroupsToNew[$group->id];
            $newOuterGroup = Constructor_Dao_Group::get_by_id($newOuterGroupId);
            $oldInnerGroupIds = array_keys($group->getInnerGroups());
            if (!empty($oldInnerGroupIds)){
                $newInnerGroupsToAdd = array();
                foreach($oldGroupsToNew as $oldG => $newG){
                    if (in_array($oldG, $oldInnerGroupIds)){
                        $newInnerGroupsToAdd[] = $newG;
                    }
                }
                if (!empty($newInnerGroupsToAdd)){
                    $newOuterGroup->setInnerGroups($newInnerGroupsToAdd);
                }
            }
        }
    }
}
