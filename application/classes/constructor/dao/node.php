<?php
class Constructor_Dao_Node extends Model_Dao {
    
    public static $_table = 'c_nodes';
    public static $_connections_table = 'c_nodes_connections';
    public static $_fields = array('id', 'file_uid', 'type', 'name', 'description', 'operator_uid', 'formula', 'x', 'y', 'position', 'style', 'rotation', 'full_desc', 'date_modified');

    public $id;
    public $file_uid;
    public $type;
    public $name;
    public $description;
    public $operator_uid;
    public $formula = '';
    public $x;
    public $y;
    public $position = 0;
    public $style = 0;
    public $rotation = 0;
    public $full_desc = '';
    public $date_modified = 0;
    
    public $connections = null;
    public $data = null;
    public $thread = null;
    
    const TYPE_DATA = 1;
    const TYPE_FORMULA = 2;
    const TYPE_OPERATOR_DATA = 3;
    const TYPE_OPERATOR = 4;
    
    const POSITION_INNER  = 0;
    const POSITION_INPUT  = 1;
    const POSITION_OUTPUT = 2;
    
    public static $styles = array(
        0 => 'none',
        1 => 'red',
        2 => 'green',
        3 => 'blue',
        4 => 'blue',
        5 => 'blue',
        6 => 'blue',
    );
    
    private static $_nodes = array();
    
    /**
    * @param mixed $id
    * @return Constructor_Dao_Node
    */
    public static function get_by_id($id) {
        if (is_array($id)){
            $toReturn = array();
            foreach($id as $_id){
                if (array_key_exists($_id, self::$_nodes)){
                    $toReturn[$_id] = self::$_nodes[$_id];
                }else{
                    $toReturn[$_id] = parent::get_by_id($_id);
                    $thread = Model_Dao_Thread::get_by_subject(2, $_id);
                    if (!empty($thread)){
                        $thread = reset($thread);
                    }
                    $toReturn[$_id]->thread = $thread;
                }
            }
            return $toReturn;
        }else{
            if (!array_key_exists($id, self::$_nodes)){
                self::$_nodes[$id] = parent::get_by_id($id);
                $thread = Model_Dao_Thread::get_by_subject(2, $id);
                if (!empty($thread)){
                    $thread = reset($thread);
                }
                self::$_nodes[$id]->thread = $thread;
            }
            return self::$_nodes[$id];
        }
    }
    public static function get_by_data($data) {
        if (!isset($data['id'])) return false;
        $_id = $data['id'];
        if (!array_key_exists($_id, self::$_nodes))
            self::$_nodes[$_id] = new Constructor_Dao_Node($data);
        return self::$_nodes[$_id];
    }
    
    public function delete()
    {
        $sql = "DELETE FROM `".Constructor_Dao_File::$_connections_table."` WHERE `from_node_id`=".intval($this->id);
        $res = DB::query(Database::DELETE, $sql)->execute();
        $sql = "DELETE FROM `".Constructor_Dao_File::$_connections_table."` WHERE `to_node_id`=".intval($this->id);
        $res = DB::query(Database::DELETE, $sql)->execute();
        $sql = "DELETE FROM `".Constructor_Dao_File::$_data_table."` WHERE `node_id`=".intval($this->id);
        $res = DB::query(Database::DELETE, $sql)->execute();
        $sql = "DELETE FROM `".Constructor_Dao_File::$_layers_nodes_table."` WHERE `node_id`=".intval($this->id);
        $res = DB::query(Database::DELETE, $sql)->execute();
        $res = parent::delete();
        unset(self::$_nodes[$this->id]);
        return $res;
    }
    static public function delete_multiple($ids = array(), $file_uid = null) {
        if (!$ids) return;
        $sql = "DELETE FROM `".self::$_table."` WHERE ";
        $sql1 = "DELETE FROM `".Constructor_Dao_File::$_connections_table."` WHERE ";
        $sql2 = "DELETE FROM `".Constructor_Dao_File::$_connections_table."` WHERE ";
        $sql3 = "DELETE FROM `".Constructor_Dao_File::$_data_table."` WHERE ";
        $sql4 = "DELETE FROM `".Constructor_Dao_File::$_layers_nodes_table."` WHERE ";
        $where = $where1 = $where2 = $where3 = $where4 = '';
        if ($file_uid) {
            $where = "`file_uid` = ".intval($file_uid);
            if ($ids) {
                $where .= " AND ";
            }
        }
        if ($ids) {
            Helper_Array::intval($ids);
            $sids = implode(',',$ids);
            $where1 = $where."`to_node_id` IN (".$sids.")";
            $where2 = $where."`from_node_id` IN (".$sids.")";
            $where3 = $where."`node_id` IN (".$sids.")";
            $where4 = "`node_id` IN (".$sids.")";
            $where .= "`id` IN (".$sids.")";
        }
        $res = DB::query(Database::DELETE, $sql.$where)->execute();
        $res = DB::query(Database::DELETE, $sql1.$where1)->execute();
        $res = DB::query(Database::DELETE, $sql2.$where2)->execute();
        $res = DB::query(Database::DELETE, $sql3.$where3)->execute();
        $res = DB::query(Database::DELETE, $sql4.$where4)->execute();
    }
    public function get_connections() {
        if ($this->connections === null) {
            $sql = "SELECT * FROM `".Constructor_Dao_File::$_connections_table."` WHERE `to_node_id` = ".intval($this->id);
            $res = DB::query(Database::SELECT, $sql)->execute()->as_array();
            $results = array();
            foreach ($res as $row) {
                $results[$row['to_slot']] = $row['from_node_id'];
            }
            $this->connections = $results;
        }
        return $this->connections;
    }
    public function set_connections($data) {
        $sql = "DELETE FROM `".Constructor_Dao_File::$_connections_table."` WHERE `to_node_id`=".intval($this->id);
        DB::query(Database::DELETE, $sql)->execute();
        if ($data) {
            $sql = "INSERT INTO `".Constructor_Dao_File::$_connections_table."` (`from_node_id`,`to_node_id`,`to_slot`,`file_uid`) VALUES ";
            $comma = '';
            foreach ($data as $slot=>$from) {
                $sql .= $comma."(".intval($from).",".intval($this->id).",".intval($slot).",".intval($this->file_uid).")";
                $comma = ',';
            }
            DB::query(Database::INSERT, $sql)->execute();
        }
        $this->connections = null;
        return true;
    }
    public function delete_connection($slot)
    {
        $sql = "UPDATE `".Constructor_Dao_File::$_connections_table."` SET `from_node_id`=0 WHERE `to_node_id`=".intval($this->id)." AND `to_slot` = ".intval($slot);
        $this->connections = null;
        return DB::query(Database::UPDATE, $sql)->execute();
    }
    public function get_data()
    {
        if ($this->data !== null) return $this->data;
        $sql = "SELECT * FROM `".Constructor_Dao_File::$_data_table."` WHERE `node_id` = ".intval($this->id);
        $res = DB::query(Database::SELECT, $sql)->execute()->as_array();
        $results = array();
        foreach ($res as $row) {
            $results[$row['key']] = floatVal($row['value']);
        }
        
        $this->data = $results;
        return $results;
    }
    public function set_data($data)
    {
        $sql = "DELETE FROM `".Constructor_Dao_File::$_data_table."` WHERE `node_id` = ".intval($this->id);
        DB::query(Database::DELETE, $sql)->execute();
        if ($data) {
            $sql = "INSERT INTO `".Constructor_Dao_File::$_data_table."` (`node_id`,`key`,`value`,`file_uid`,`keyHash`) VALUES ";
            $comma = "";
            foreach ($data as $key=>$value) {
                $sql .= $comma."(".intval($this->id).",'".$key."',".floatVal($value).",".intval($this->file_uid).",CRC32('".$key."'))";
                $comma = ",";
            }
            $sql .= " ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)";
            return DB::query(Database::INSERT, $sql)->execute();
        }
        $this->data = null;
        return true;
    }
    
    public function calcOperator()
    {
        if($this->type != self::TYPE_OPERATOR){
            return false;
        }
        $operatorUid = $this->operator_uid;
        $operator = Constructor_Dao_Operator::get_by_id($operatorUid);
        $fileId = $operator->file_id;
        $file = Constructor_Dao_File::get_by_id($fileId);
        $inputNodes = $file->getInputNodes();
        $outputNode = $file->getOutputNode();
        $connections = $this->get_connections();
        for($i=0; $i<sizeof($inputNodes); $i++){
            if (!isset($connections[$i]) || !$connections[$i]) {
                return false;
            }
            $connNode = self::get_by_id($connections[$i]);
            $connRes = $connNode->calc();
            $inputNodes[$i]->data = $connRes;
        }
        return $outputNode->calc();
    }
    
    public function calc()
    {
        if ($this->type == self::TYPE_DATA) {
            $file = Constructor_Dao_File::get_by_uid($this->file_uid);
            $data = $file->get_data($this->id);
            return $data;//$this->get_data();
        } elseif($this->type == self::TYPE_OPERATOR){
            return $this->calcOperator();
        }
        $exp = new Constructor_Model_Expression();
        $exp->fileUid = $this->file_uid;
        $file = Constructor_Dao_File::get_by_uid($this->file_uid);
        $this->parseConstants();
        $this->parseMacro($exp, $file);
        $vars = $exp->get_vars($this->formula);
        $old_data = $file->get_data($this->id);
        if (!$this->connections) {
            $conns = $file->get_connections($this->id);
            $connections = array();
            foreach ($conns as $conn) {
                $connections[$conn['to_slot']] = $conn['from_node_id'];
            }
        } else {
            $connections = $this->connections;
        }
        // = $this->get_connections($this->id);
        foreach ($vars as $slot=>$varName) {
            if (!isset($connections[$slot]) || !$connections[$slot]) {
                return false;
            }
            $connNode = self::get_by_id($connections[$slot]);
            $connRes = $connNode->calc();
            if ($connRes===false) {
                return false;
            }
            
            if (is_array($connRes)){
                $res = 'vector(';
                $comma = '';
                foreach ($connRes as $key=>$val) {
                    $res .= $comma.$key.",".$val;
                    $comma = ',';
                }
                $res .= ')';
            } else {
                $res = $connRes;
            }
            $exp->evaluate($varName."=".$res);
        }
        $res = $exp->evaluate($this->formula);
        if ($res!==false && $this->id && $this->id != -1) {
            $save = true;
            if ($old_data) {
                ksort($old_data);
                Helper_Array::strkeyval($old_data);
                $new_data = $res;
                ksort($new_data);
                Helper_Array::strkeyval($new_data);
                if ($old_data == $new_data) {
                    $save = false;
                }
            }
            if ($save) $this->set_data($res);
        }
        return $res;
    }
    
    public function parseConstants()
    {
        $file = Constructor_Dao_File::get_by_uid($this->file_uid);
        $constants = $file->getConstants();
        $this->formula = str_replace(array_keys($constants), $constants, $this->formula);
    }
    
    public function parseMacro($exp)
    {
        $file = Constructor_Dao_File::get_by_uid($this->file_uid);
        $formula = $this->formula;
        $i=0;
        $user = Auth::instance()->get_user();
        if ($user) {
            $userId = $user->id;
        } else {
            $userId = $file->editor_id;
        }
        $userMacroparams = Constructor_Dao_Macroparams::getUserParams($userId);
        while (preg_match("/macro\((\d+)\)/i", $formula, $matches)) {
            $macroparamsId = $matches[1];
            $i++;
            $vector = "vector(";
            if (array_key_exists($macroparamsId, $userMacroparams)){
                $comma = '';
                foreach ($userMacroparams[$macroparamsId] as $key=>$val) {
                    $vector .= $comma.$key.",".$val;
                    $comma = ',';
                }
                //$this->set_data($userMacroparams[$macroparamsId]);
                //$dataInserted = $userMacroparams[$macroparamsId];
            }
            $vector .= ")";
            $formula = preg_replace("/macro\((\d+)\)/i", $vector, $formula, 1);//'macroNUMBER'.$i);
        }
        /*if (preg_match_all("/(macro\((\d+)\))/i", $formula, $matches)){
            $macroparamsId = $matches[1];
            $file = Constructor_Dao_File::get_by_uid($this->file_uid);
            $userMacroparams = Constructor_Dao_Macroparams::getUserParams($file->editor_id);
            if (array_key_exists($macroparamsId, $userMacroparams)){
                $this->set_data($userMacroparams[$macroparamsId]);
                $dataInserted = $userMacroparams[$macroparamsId];
            }
        }*/
        $this->formula = $formula;
    }
    
    public function save(&$dataInserted = null)
    {
        $create = false;
        $dataInserted = false;
        if (empty($this->id)) $create = true;
        $this->date_modified = date("Y-m-d H:i:s");
        parent::save();
        if($create){
            $thread = new Model_Dao_Thread();
            $thread->is_primary = 1;
            $thread->subject_type = 2;
            $thread->subject_id = $this->id;
            $thread->title = $this->name;
            $thread->description = $this->description;
            $thread->save();
            $this->thread = $thread;
        }
/*        if (preg_match("/macro\((\d+)\)/", $this->name, $matches)){
            $macroparamsId = $matches[1];
            $file = Constructor_Dao_File::get_by_uid($this->file_uid);
            $userMacroparams = Constructor_Dao_Macroparams::getUserParams($file->editor_id);
            if (array_key_exists($macroparamsId, $userMacroparams)){
                $this->set_data($userMacroparams[$macroparamsId]);
                $dataInserted = $userMacroparams[$macroparamsId];
            }
        }*/
        // assign tags
        Constructor_Dao_Tag::removeAllTagsFromItem($this->id, Constructor_Dao_Tag::ITEM_TYPE_NODE);
        $tags = explode('.', $this->name);
        foreach($tags as $tagName){
            $crc = sprintf("%u",crc32(mb_strtolower(trim($tagName))));
            $tag = Constructor_Dao_Tag::getTagByCrc($crc);
            if ($tag !== false){
                Constructor_Dao_Tag::addTagToItem($this->id, Constructor_Dao_Tag::ITEM_TYPE_NODE, $tag->id);
            }
        }
    }
    
    public static function search($name, $fileUid = null)
    {
        $sqlSelect = 'SELECT * FROM `c_nodes` WHERE `name` LIKE :name ';
        if (!empty($fileUid)){
            $sqlSelect .= ' AND `file_uid` = :file_uid';
        }
        $expr = DB::query(Database::SELECT, $sqlSelect)->parameters(array(':name' => '%'.$name.'%', ':file_uid' =>$fileUid));
        $result = array();
        $rows = $expr->execute()->as_array();
        if (!empty($rows)){
            foreach($rows as $row){
                $result[$row['id']] = Constructor_Dao_Node::get_by_id($row['id']);
            }
        }
        return $result;
    }
    
}
?>
