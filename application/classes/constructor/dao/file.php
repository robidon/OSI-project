<?php
class Constructor_Dao_File extends Model_Dao {
    
    const ROOT_USER_ID = 10;
    
    public static $_table = 'c_files';
    public static $_connections_table = 'c_nodes_connections';
    public static $_data_table = 'c_nodes_data';
    public static $_settings_table = 'c_files_settings';
    public static $_constants_table = 'c_constants';
    public static $_layers_table = 'c_layers';
    public static $_layers_nodes_table = 'c_layers_nodes';
    
    
    public static $_report_table = 'report_files';
    public static $_user_reports = 'user_reports';
    
    public static $_primary_key = 'uid';
    public static $_fields = array('uid', 'id', 'version', 'is_latest', 'title', 'description', 'date_created', 'date_modified', 'editor_type', 'editor_id', 'published', 'namespace_id', 'published_access');

    public $uid;
    public $id;
    public $version;
    public $is_latest;
    public $title;
    public $description;
    public $date_created;
    public $date_modified;
    public $editor_type;
    public $editor_id;
    public $published = 0;
    public $namespace_id = 1;
    public $published_access = 0;
    
    private static $_files = array();
    private $_nodes = false;
    private $_groups = false;
    private $_data = false;
    private $_connections = false;
    private $_connections_by_node = false;
    private $_constants = false;
    
    public function __construct($data = null) {
        parent::__construct($data);
        if ($this->published) // временный костыль для того, чтобы правильно выставлялся уровень доступа TODO: надо просто правильно проставить всем файлам published_access
            $this->published_access = $this->published_access | Constructor_Service_File::ACCESS_LEVEL_READ;
    }
    
    /**
    * @param int $uid
    * @return Constructor_Dao_File
    */
    static public function get_by_uid($uid)
    {
        if (!isset(self::$_files[$uid])) {
            self::$_files[$uid] = parent::get_by_id($uid);;
        }
        return self::$_files[$uid];
    }
    
    public function save()
    {
        if (!$this->date_created) {
            $this->date_created = time();
        }
        if ($this->published_access & Constructor_Service_File::ACCESS_LEVEL_READ) {
            $this->published = 1;
        } else {
            $this->published = 0;
        }
        $this->date_modified = time();
        if (!$this->description) {
            $this->description = '';
        }
        if ($this->uid == -1) {
            $this->uid = 0;
            $this->id = $this->get_next_id();
            $this->is_latest = 1;
        }
        return parent::save();
    }
    
    /**
    * Возвращает файл по id и версии
    * 
    * @param int $id
    * @param int $version
    * @return Constructor_Dao_File
    */
    static public function get_by_id($id, $version = -1)
    {
        $sql = "SELECT * FROM `".self::$_table."` WHERE `id`=".intval($id);
        if ($version < 0) {
            $sql .= " AND `is_latest`=1";
        } else {
            $sql .= " AND `version`=".intval($version);
        }
        $sql .= " LIMIT 1";
        $res = DB::query(Database::SELECT,
            $sql)
            ->execute()
            ->as_array();
        if (!$res) return null;
        $res = $res[0];
        $file = new Constructor_Dao_File($res);
        self::$_files[$res['uid']] = $file;
        return $file;
    }
    
    /**
    * Возвращает модели пользователя
    * 
    * @param int $user_id
    * @return array
    */
    static public function get_by_user($user_id) {
        $sql = "SELECT * FROM `".self::$_table."` 
            WHERE `editor_type`=".Constructor_Service_File::EDITOR_TYPE_USER." AND `editor_id`=".intval($user_id)." AND ";
        $sql .= " `is_latest` = 1 ORDER BY `date_modified` DESC";
        $res = DB::query(Database::SELECT, $sql)
            ->execute()
            ->as_array();
        $results = array();
        if (!$res) return $results;
        foreach ($res as $row) {
            $results[$row['uid']] = new Constructor_Dao_File($row);
        }
        return $results;
    }
    static public function get_all_published() {
        $sql = "SELECT * FROM `".self::$_table."` WHERE `published` = 1 AND";
        $sql .= " `is_latest` = 1 ORDER BY `date_modified` DESC";
        $res = DB::query(Database::SELECT, $sql)
            ->execute()
            ->as_array();
        $results = array();
        if (!$res) return $results;
        foreach ($res as $row) {
            $results[$row['uid']] = new Constructor_Dao_File($row);
        }
        return $results;
    }
    
    public function get_editor_user() {
        if ($this->editor_type == Constructor_Service_File::EDITOR_TYPE_USER) {
            return new Model_User($this->editor_id);
        }
    }
    
    public function get_next_id() {
        $sql = "SELECT id FROM `".self::$_table."` ORDER BY `id` DESC LIMIT 1";
        $res = DB::query(Database::SELECT, $sql)
            ->execute()
            ->as_array();
        if (!$res) return 1;
        return $res[0]['id'] + 1;
    }
    
    /**
    * возвращает ноды
    */
    public function get_nodes($ids = null) {
        if ($this->_nodes === false) {
            $sql = "SELECT * FROM `".Constructor_Dao_Node::$_table."` WHERE `file_uid`=".intval($this->uid);
            $res = DB::query(Database::SELECT, $sql)
                ->execute()
                ->as_array();
            $this->_nodes = array();
            if (!$res) return $this->_nodes;
            foreach ($res as $row) {
                $this->_nodes[$row['id']] = Constructor_Dao_Node::get_by_data($row);
            }
        }
        if (!$ids) {
            return $this->_nodes;
        } else {
            $result = array();
            Helper_Array::intval($ids);
            foreach ($ids as $id) {
                if (!isset($this->_nodes[$id])) continue;
                $result[$id] = $this->_nodes[$id];
            }
            return $result;
        }
    }
    
    public function add_node($data, $save = true) {
        $nn = new Constructor_Dao_Node($data);
        $nn->file_uid = $this->uid;
        $this->_nodes[] = $nn;
        if($save) {
            $this->save_nodes();
        }
    }
    
    public function set_nodes($data, $save = true) {
        $this->_nodes = array();
        foreach ($data as $row) {
            $nn = new Constructor_Dao_Node($row);
            $nn->file_uid = $this->uid;
            $this->_nodes[] = $nn;
        }
        if ($save) {
            $this->save_nodes();
        }
    }
    
    public function get_groups($ids = null) {
        if ($this->_groups === false) {
            $sql = "SELECT * FROM `".Constructor_Dao_Group::$_table."` WHERE `file_uid`=".intval($this->uid);
            $res = DB::query(Database::SELECT, $sql)
                ->execute()
                ->as_array();
            $this->_groups = array();
            if (!$res) return $this->_groups;
            foreach ($res as $row) {
                $this->_groups[$row['id']] = new Constructor_Dao_Group($row);
            }
        }
        if (!$ids) {
            return $this->_groups;
        } else {
            $result = array();
            foreach ($ids as $id) {
                if (!isset($this->_groups[$id])) continue;
                $result[$id] = $this->_groups[$id];
            }
            return $result;
        }
    }

    
    public static function wrap($a,$symb = "'") {return $symb.$a.$symb;}
    public static function wrapA($a) {return self::wrap($a,"`");}
    public function save_nodes() {
        if ($this->_nodes === false) return false;
        $sql = "DELETE FROM `".Constructor_Dao_Node::$_table."` WHERE `file_uid` = ".intval($this->uid);
        DB::query(Database::DELETE, $sql)->execute();
        if (!$this->_nodes) return true;
        $sql = "INSERT INTO `".Constructor_Dao_Node::$_table."` (".implode(',',array_map(array("Constructor_Dao_File","wrapA"),Constructor_Dao_Node::$_fields)).") VALUES ";
        $comma = '';
        foreach ($this->_nodes as $node) {
            /**
            * @var Constructor_Dao_Node $node
            */
            $node->file_uid = $this->uid;
            $vals = array_map(array("Constructor_Dao_File","wrap"),array_values($node->as_array()));
            $vals[0] = 'DEFAULT';
            $sql .= $comma."(".implode(',',$vals).")";
            $comma = ",";
        }
        $sql .= " ON DUPLICATE KEY UPDATE ";
        $comma = '';
        foreach(Constructor_Dao_Node::$_fields as $field) {
            if ($field == 'id') continue;
            $sql .= $comma.$field."=VALUES(".$field.")";
            $comma = ',';
        }
        $this->_nodes = false;
        return DB::query(Database::INSERT,$sql)->execute();
    }
    public function save_connections() {
        if ($this->_connections === false) return false;
        $sql = "DELETE FROM `".Constructor_Dao_Node::$_connections_table."` WHERE `file_uid` = ".intval($this->uid);
        DB::query(Database::DELETE, $sql)->execute();
        if (!$this->_connections) return true;
        $sql = "INSERT INTO `".Constructor_Dao_Node::$_connections_table."` (`from_node_id`,`to_node_id`,`to_slot`,`file_uid`) VALUES ";
        $comma = '';
        foreach ($this->_connections as $con) {
            $sql .= $comma."(".intval($con['from_node_id']).",".intval($con['to_node_id']).",".intval($con['to_slot']).",".intval($this->uid).")";
            $comma = ",";
        }
        $sql .= " ON DUPLICATE KEY UPDATE `from_node_id` = VALUES(from_node_id)";
        $this->_connections = false;
        return DB::query(Database::INSERT,$sql)->execute();
    }
    
    public function set_nodes_pos($nodesPos)
    {
        $sql = "INSERT INTO `".Constructor_Dao_Node::$_table."` (id, formula, x, y) VALUES ";
        //formula does not have a default value;
        $comma = '';
        foreach ($nodesPos as $nodeId=>$pos) {
            $sql .= $comma."(".intval($nodeId).",'',".intval($pos['x']).",".intval($pos["y"]).")";
            $comma = ",";
        }
        $sql .= " ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y)";
        return DB::query(Database::INSERT,$sql)->execute();
    }
    
    public function set_groups_pos($groupsPos)
    {
        $sql = "INSERT INTO `".Constructor_Dao_Group::$_table."` (id, x, y) VALUES ";
        //formula does not have a default value;
        $comma = '';
        foreach ($groupsPos as $groupId=>$pos) {
            $sql .= $comma."(".intval($groupId).",".intval($pos['x']).",".intval($pos["y"]).")";
            $comma = ",";
        }
        $sql .= " ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y)";
        return DB::query(Database::INSERT,$sql)->execute();
    }
    
    public function set_connection($to, $slot, $from) {
        /*
        Иногда не соединяются ноды, т.к. в базе отсутствует слот, а в файле отображается, как пустой
        $sql = "UPDATE `".self::$_connections_table."` SET `from_node_id` = ".intval($from)." WHERE `to_node_id` = ".intval($to)." AND `to_slot` = ".intval($slot);
        return DB::query(Database::UPDATE, $sql)->execute();
        */
        $sql = 'INSERT INTO `'.self::$_connections_table.'` (`from_node_id`, `to_node_id`, `to_slot`, `file_uid`) VALUES (:from, :to, :slot, :file_uid) ON DUPLICATE KEY UPDATE `from_node_id` = :from';
        $expr = DB::query(Database::INSERT, $sql)->parameters(
            array(
                ':from' => $from,
                ':to' => $to,
                ':slot' => $slot,
                ':file_uid' => $this->uid,
            )
        );
        return $expr->execute();
    }
    
    public function get_connections($to_node_id = null) {
        if ($this->_connections === false) {
            $sql = "SELECT * FROM `".self::$_connections_table."` WHERE `file_uid` = ".intval($this->uid);
            $res = DB::query(Database::SELECT, $sql)->execute()->as_array();
            $this->_connections = $res;
            $this->_connections_by_node = array();
            foreach ($res as $conn) {
                if (!isset($this->_connections_by_node[intval($conn['to_node_id'])])) {
                    $this->_connections_by_node[intval($conn['to_node_id'])] = array();
                }
                $this->_connections_by_node[intval($conn['to_node_id'])][] = $conn;
            }
        }
        if ($to_node_id) {
            if (!isset($this->_connections_by_node[intval($to_node_id)])) {
                return array();
            }
            return $this->_connections_by_node[$to_node_id];
        }
        return $this->_connections;
    }
    public function get_data($node_id = null)
    {
        if ($this->_data === false) {
            $sql = "SELECT * FROM `".self::$_data_table."` WHERE `file_uid` = ".intval($this->uid);
            $res = DB::query(Database::SELECT, $sql)->execute()->as_array();
            $results = array();
            foreach ($res as $row) {
                $nodeId = intval($row['node_id']);
                if (!isset($results[$nodeId])) {
                    $results[$nodeId] = array();
                }
                $results[$nodeId][$row['key']] = $row['value'];
            }
            $this->_data = $results;
        }            
        if ($node_id) {
            return isset($this->_data[$node_id]) ? $this->_data[$node_id] : array();
        }
        return $this->_data;
    }
    
    public function modified($save = true)
    {
        $this->date_modified = time();
        if ($save) {
            $this->save();
        }
    }
    
    public function getLayers($layerId = null)
    {
        $sql = 'SELECT * FROM `'.self::$_layers_table.'` WHERE `file_uid` = :file_uid ORDER BY `order`';
        $params = array(':file_uid' => $this->uid);
        if ($layerId) {
            $sql .= " AND `id` = :layer_id";
            $params[':layer_id'] = $layerId;
        }
        $layers = DB::query(Database::SELECT, $sql)->parameters($params)->execute()->as_array();
        return $layers;
    }
    
    public function getLayersData()
    {
        $layers = $this->getLayers();
        $sqlNodes = 'SELECT * FROM `'.self::$_layers_nodes_table.'` WHERE `layer_id` = :layer_id';
        $expr = DB::query(Database::SELECT, $sqlNodes);
        foreach($layers as &$layerData){
            $nodeIds = array();
            $rows = $expr->parameters(array(':layer_id' => $layerData['id']))->execute()->as_array();
            foreach($rows as $row){
                $nodeIds[] = $row['node_id'];
            }
            $layerData['node_ids'] = $nodeIds;
            unset($layerData['file_uid']);
        }
        return $layers;
    }
    
    public function addLayer($title, $shown)
    {
        $sqlInsert = 'INSERT INTO `'.self::$_layers_table.'` (`file_uid`, `title`, `shown`) VALUES (:file_uid, :title, :shown)';
        $expr = DB::query(Database::INSERT, $sqlInsert);
        $id = $expr->parameters(array(
            ':file_uid' => $this->uid,
            ':title' => $title,
            ':shown' =>  $shown
            ))->execute();
        return $id[0];
    }
    
    public function saveLayer($layerId, $title, $shown)
    {
        $sqlUpdate = 'UPDATE `'.self::$_layers_table.'` SET `title` = :title, `shown` = :shown WHERE `id` = :id';
        return DB::query(Database::UPDATE, $sqlUpdate)->parameters(array(':title' => $title, ':shown' => $shown, ':id' => $layerId))->execute();
    }
    
    public function saveLayersOrder($layers)
    {
        $sqlInsert = 'INSERT INTO `'.self::$_layers_table.'` (`id`,`order`) VALUES ';
        $comma = '';
        foreach ($layers as $layer) {
            $sqlInsert .= $comma."(".$layer['id'].",".$layer['order'].")";
            $comma = ',';
        }
        $sqlInsert .= " ON DUPLICATE KEY UPDATE `order` = VALUES(`order`);";
        return DB::query(Database::INSERT, $sqlInsert)->execute();
    }
    
    public static function removeLayer($layerId)
    {
        $sqlNodes = 'DELETE FROM `'.self::$_layers_nodes_table.'` WHERE `layer_id` = :layer_id';
        DB::query(Database::DELETE, $sqlNodes)->parameters(array(':layer_id' => $layerId))->execute();
        $sqlDelete = 'DELETE FROM `'.self::$_layers_table.'` WHERE `id` = :layer_id';
        DB::query(Database::DELETE, $sqlDelete)->parameters(array(':layer_id' => $layerId))->execute();
        return true;
    }
    
    public static function setLayerNodes($layerId, $nodeIds)
    {
        $layerId = intval($layerId);
        Helper_Array::intval($nodeIds);
        $sqlDelete = 'DELETE FROM `'.self::$_layers_nodes_table.'` WHERE `layer_id` = :layer_id';
        DB::query(Database::DELETE, $sqlDelete)->parameters(array(':layer_id' => $layerId))->execute();
        
        if ($nodeIds) {
            $sqlDelete = 'DELETE FROM `'.self::$_layers_nodes_table.'` WHERE `node_id` IN ('.implode(',',$nodeIds).')';
            DB::query(Database::DELETE, $sqlDelete)->execute();
        
            if ($layerId) {
                $sqlInsert = 'INSERT INTO `'.self::$_layers_nodes_table.'` (`layer_id`, `node_id`) VALUES ';
                $comma = '';
                foreach($nodeIds as $id){
                    $sqlInsert .= $comma."(".intval($layerId).",".intval($id).")";
                    $comma = ',';
                }
                $expr = DB::query(Database::INSERT, $sqlInsert)->execute();
            }
        }
        return true;
    }
    
    public function as_json($access = Constructor_Service_File::ACCESS_LEVEL_READ) {
        $arr = array(
            'id' => $this->id,
            'title' => $this->title,
            'namespace' => $this->namespace_id,
            'description' => $this->description,
            'version' => $this->version,
            'nodes' => array(),
            //'published' => $this->published,
            'groups' => array(),
            'layers' => $this->getLayersData(),
            'constants' => $this->getConstants(),
            'clipboard'=> array('nodes'=>Session::instance()->get('node_ids'),'groups'=>Session::instance()->get('group_ids')),
            'user_access' => Constructor_Service_File::parse_access_level($access),
            'latest_comments' => Constructor_Service_File::get_latest_comments($this->uid)
        );
        if ($access & Constructor_Service_File::ACCESS_LEVEL_ADMIN) {
            $arr['published_access'] = Constructor_Service_File::parse_access_level($this->published_access);
            $arr['personal_access'] = Constructor_Service_File::parse_access_list(Constructor_Service_File::get_file_access($this));
        }
        $conns = $this->get_connections();
        $connections = array();
        foreach ($conns as $conn) {
            $to_node_id = $conn['to_node_id'];
            if (!isset($connections[$to_node_id])) $connections[$to_node_id] = array();
            $connections[$to_node_id][intval($conn['to_slot'])] = $conn['from_node_id'];
        }
        $data = $this->get_data();
        
        /**
        * @var $node Constructor_Dao_Node
        */
        $nodes = $this->get_nodes();
        foreach ($nodes as $node_id=>$node) {
            $narr = Constructor_Service_Base::nodeAsJSON($node, $data,$connections);
            $arr['nodes'][] = $narr;
        }
        /**
        * @var $group Constructor_Dao_Group
        */
        foreach ($this->get_groups() as $group_id=>$group) {
            $narr = Constructor_Service_Base::groupAsJSON($group);
            $arr['groups'][] = $narr;
        }
        return $arr;
    }
    
    public function delete()
    {
        $sql = "DELETE FROM `".self::$_data_table."` WHERE `file_uid` = ".intval($this->uid);
        DB::query(Database::DELETE, $sql)->execute();
        $sql = "DELETE FROM `".self::$_connections_table."` WHERE `file_uid` = ".intval($this->uid);
        DB::query(Database::DELETE, $sql)->execute();
        $sql = "DELETE FROM `".Constructor_Dao_Node::$_table."` WHERE `file_uid` = ".intval($this->uid);
        DB::query(Database::DELETE, $sql)->execute();
        parent::delete();
    }
    
    /**
    * deprecated
    * 
    * Публикация файла
    * изменение версии, публикация в оператор
    */
    public function publish()
    {
        /*
        // получаем старые ноды и связи, что б потом восстановить связи
        $prev_nodes = array_values($this->get_nodes());
        $this->get_connections();
        
        $this->is_latest = false;
        $this->save();

        $this->uid = 0;
        $this->version++;
        $this->is_latest = true;
        $this->published = false;
        $this->save();
        $this->save_nodes();
        $new_nodes = array_values($this->get_nodes());
        
        // восстанавливаем связи между линками
        foreach ($this->_connections as &$con) {
            $from = $con['from_node_id'];
            $to = $con['to_node_id'];
            $c = 2; // просто что б пораньше выйти из цикла
            foreach ($prev_nodes as $i=>$node) {
                if ($node->id == $from) {
                    $con['from_node_id'] = $new_nodes[$i]->id;
                    if (!--$c) break;
                } elseif ($node->id == $to) {
                    $con['to_node_id'] = $new_nodes[$i]->id;
                    if (!--$c) break;
                }
            }
        }
        $this->save_connections();
        Model_Dao_Thread::duplicateNodeThreads($prev_nodes, $new_nodes);
        $groups = $this->get_groups();
        Constructor_Dao_Group::duplicateGroups($groups, $this->uid, $prev_nodes, $new_nodes);
        // создаем 
        */
    }
    
    /**
    * Создать копию файла со всеми нодами и конекшенами
    * 
    * @param int $newEditor
    * @param int $newEditorType
    * @return Constructor_Dao_File
    */
    public function copy($newEditor = false, $newEditorType = false)
    {
        $prev_nodes = array_values($this->get_nodes());
        $newFile = new Constructor_Dao_File;
        $class_name = get_called_class();
        $vars = get_class_vars($class_name);
        foreach($vars['_fields'] as $field){
            $newFile->$field = $this->$field;
        }
        $newFile->uid = -1;
        $newFile->published = 0;
        $newFile->published_access = 0;
        if ($newEditor){
            $newFile->editor_id = $newEditor;
        }
        if ($newEditorType){
            $newFile->editor_type = $newEditorType;
        }
        $newFile->title .= ' copy';
        
        $newFile->save();
        
        // duplicate all nodes
        $nodeFields = Constructor_Dao_Node::$_fields;
        $idKey = array_search('id', $nodeFields);
        unset($nodeFields[$idKey]);
        $sql = 'INSERT INTO `'.Constructor_Dao_Node::$_table.'` (`'.implode('`, `', $nodeFields).'`) 
                SELECT "'.$newFile->uid.'" as `file_uid`, ';
        $idKey = array_search('file_uid', $nodeFields);
        unset($nodeFields[$idKey]);
        $sql .= '`'.implode('`, `', $nodeFields).'` FROM `'.Constructor_Dao_Node::$_table.'`';
        $sql .= ' WHERE `file_uid` = "'.(int)$this->uid.'"';
        DB::query(Database::INSERT, $sql)->execute();
        $new_nodes = array_values($newFile->get_nodes());
        // duplicate all data in nodes
        foreach($prev_nodes as $k => $prevNode){
            $newNodeId = $new_nodes[$k];
            $data = $prevNode->get_data();
            $newNode = $new_nodes[$k];
            $newNode->set_data($data);
        }
        
        // duplicate all connections
        $this->get_connections();
        foreach ($this->_connections as $con) {
            $from = $con['from_node_id'];
            $newFrom = 0;
            $to = $con['to_node_id'];
            $newTo = 0;
            $c = 2; // просто что б пораньше выйти из цикла
            foreach ($prev_nodes as $i=>$node) {
                if ($node->id == $from) {
                    $newFrom = $new_nodes[$i]->id;
                    if (!--$c) break;
                } elseif ($node->id == $to) {
                    $newTo = $new_nodes[$i]->id;
                    if (!--$c) break;
                }
            }
            if ($newFrom && $newTo){
                $sqlInsertConnection = 'INSERT INTO `'.Constructor_Dao_Node::$_connections_table.'`
                    (from_node_id, to_node_id, to_slot, file_uid) VALUES 
                    ("'.(int)$newFrom.'", "'.(int)$newTo.'", "'.(int)$con['to_slot'].'", "'.(int)$newFile->uid.'")';
                DB::query(Database::INSERT, $sqlInsertConnection)->execute();
            }
        }
        $new_nodes = array_values($newFile->get_nodes());
        Model_Dao_Thread::duplicateNodeThreads($prev_nodes, $new_nodes);
        $groups = $this->get_groups();
        Constructor_Dao_Group::duplicateGroups($groups, $newFile->uid, $prev_nodes, $new_nodes);
        
        $constants = $this->getConstants();
        $newFile->setConstants($constants);
        
        $layers = $this->getLayersData();
        foreach ($layers as $layer) {
            $sql = "INSERT INTO `".self::$_layers_table."` (file_uid,title) VALUES ";
            $sql .= "(".(int)$newFile->uid.",'".$layer['title']."')";
            $res = DB::query(Database::INSERT, $sql)->execute();
            $layer_id = $res[0];
            $newNodeIds = array();
            foreach ($layer['node_ids'] as $old_node_id) {
                $ind = false;
                foreach ($prev_nodes as $i =>$prev_node) {
                    if ($prev_node->id == $old_node_id) {
                        $ind = $i;
                        break;
                    }
                }
                if ($ind!== false) {
                    $newNodeIds[] = $new_nodes[$i]->id;
                }
            }
            $newFile->setLayerNodes($layer_id, $newNodeIds);
        }
        
        $settings = $this->getSettings($this->editor_id);
        $newFile->updateSettings($settings['x'], $settings['y'], $settings['zoom'], $newFile->editor_id);
        return $newFile;
    }
    
    public function searchNodeIds($query = '')
    {
        $nodeIds = array();
        $sql = 'SELECT `id` FROM `'.Constructor_Dao_Node::$_table.'` 
                WHERE `file_uid` = "'.(int)$this->id.'" AND (`name` LIKE :query OR `description` LIKE :query)';
        $expr = DB::query(Database::SELECT, $sql)->param(':query', '%'.$query.'%');
        $result = $expr->execute()->as_array();
        if (!empty($result)){
            foreach($result as $row){
                $nodeIds[] = $row['id'];
            }
        }
        return $nodeIds;
    }
    
    public function searchGroupIds($query = '')
    {
        $groupIds = array();
        $sql = 'SELECT `id` FROM `'.Constructor_Dao_Group::$_table.'`
                WHERE `file_uid` = "'.(int)$this->id.'" AND (`name` LIKE :query OR `description` LIKE :query)';
        $expr = DB::query(Database::SELECT, $sql)->param(':query', '%'.$query.'%');
        $result = $expr->execute()->as_array();
        if (!empty($result)){
            foreach($result as $row){
                $groupIds[] = $row['id'];
            }
        }
        return $groupIds;
    }
    
    public static function searchOperatorIds($query = '')
    {
        $operatorIds = array();
        $sql = 'SELECT `id` FROM `'.Constructor_Dao_File::$_table.'`
                WHERE (`title` LIKE :query OR `description` LIKE :query) AND published = 1';
        $expr = DB::query(Database::SELECT, $sql)->param(':query', '%'.$query.'%');
        $result = $expr->execute()->as_array();
        if (!empty($result)){
            foreach($result as $row){
                $operatorIds[] = $row['id'];
            }
        }
        return $operatorIds;
    }
    
    public function getTags()
    {
        return Constructor_Dao_Tag::getTagsByItem($this->id, Constructor_Dao_Tag::ITEM_TYPE_FILE);
    }
    
    public function getInputNodes()
    {
        $inputNodes = array();
        $nodes = $this->get_nodes();
        foreach($nodes as $node){
            if ($node->position == Constructor_Dao_Node::POSITION_INPUT){
                $inputNodes[] = $node;
            }
        }
        return $inputNodes;
    }
    
    public function getOutputNode()
    {
        $outputNodes = array();
        $nodes = $this->get_nodes();
        foreach($nodes as $node){
            if ($node->position == Constructor_Dao_Node::POSITION_OUTPUT){
                return $node;
            }
        }
    }
    
    public function getSettings($editorId)
    {
        $sql = 'SELECT * FROM `'.self::$_settings_table.'` 
                WHERE `file_id` = :file_id AND `editor_id` = :editor_id ';
        $expr = DB::query(Database::SELECT, $sql)->parameters(
            array(':file_id' => $this->id, ':editor_id' => $editorId));
        $res = $expr->execute()->as_array();
        if (!$res) {
            return array(
                'zoom'=>1,
                'x'=>0,
                'y'=>0,
                'keysFilter'=>array()
            );
        };
        $res = reset($res);
        return array(
            'zoom'=>$res['zoom'],
            'x'=>$res['x'],
            'y'=>$res['y'],
            'keysFilter'=>array(
                'enabled' => $res['keys_filter_enabled'],
                'keysFilter' => $res['keys_filter'],
                'keysSort' => $res['keys_sort'],
                'keysMinBound' => $res['keys_min_bound'],
                'keysMaxBound' => $res['keys_max_bound'],
            )
        );
        return reset($res);
    }
    
    public function updateSettings($x, $y, $zoom, $editorId, $keysFilterEnabled = 0, $keysFilter = '', $keysMinBound = NULL, $keysMaxBound = NULL, $keysSort = 0)
    {
        $sql = 'INSERT INTO `'.self::$_settings_table.'` (`file_id`, `editor_id`, `x`, `y`, `zoom`, `keys_filter`, `keys_min_bound`, `keys_max_bound`, `keys_filter_enabled`, `keys_sort`) 
                VALUES (:file_id, :editor_id, :x, :y, :zoom, :keys_filter, :keys_min_bound, :keys_max_bound, :keys_filter_enabled, :keys_sort)
                ON DUPLICATE KEY UPDATE `x` = :x, `y` = :y, `zoom` = :zoom, `keys_filter` = :keys_filter, `keys_min_bound` = :keys_min_bound, `keys_max_bound` = :keys_max_bound, `keys_filter_enabled` = :keys_filter_enabled, `keys_sort` = :keys_sort';
        $expr = DB::query(Database::INSERT, $sql)->parameters(
            array(':file_id' => $this->id,  ':editor_id' => $editorId, ':x' => $x, ':y' => $y, ':zoom' => $zoom, ':keys_filter' => $keysFilter, ':keys_min_bound' => $keysMinBound, ':keys_max_bound' => $keysMaxBound, ':keys_filter_enabled' => $keysFilterEnabled, ':keys_sort'=> $keysSort));
        return $expr->execute();
    }
    
    public function arrange()
    {
        $width = 160;
        $heigth = 150;
        $nodes = $this->get_nodes();
        foreach($nodes as $node){
            $node->get_connections();
        }
        $levels = array(0 => array());
        foreach($nodes as $node){
            if (empty($node->connections)){
                $levels[0][$node->id] = $node;
            } else {
                $maxLastLvl = 0;
                foreach($node->connections as $fromNodeId){
                    foreach($levels as $lvlId => $lvlNodes){
                        if (array_key_exists($fromNodeId, $lvlNodes)){
                            if ($maxLastLvl < $lvlId) $maxLastLvl = $lvlId;
                        }
                    }
                }
                $maxLastLvl++;
                if (!array_key_exists($maxLastLvl, $levels)) $levels[$maxLastLvl] = array();
                $levels[$maxLastLvl][$node->id] = $node;
            }
        }
        $numRow = 0;
        foreach($levels as $lvlId => $nodes){
            $numInLine = 0;
            foreach($nodes as $nodeId => $node){
                $node->x = $numInLine * $width;
                $node->y = $numRow * $heigth;
                $node->save();
                $numInLine++;
            }
            $numRow++;
        }
    }
    
    private function getAllNodes(&$allNodeIds, &$allGroupIds, $groupIds) {
        $allGroupIds = array_merge($allGroupIds, $groupIds);
        foreach ($groupIds as $groupId) {
            $group = Constructor_Dao_Group::get_by_id($groupId);
            if (!$group) continue;
            $allNodeIds = array_merge($allNodeIds, $group->nodeIds);
            $this->getAllNodes($allNodeIds, $allGroupIds, $group->innerGroupIds);
        }
    }
    
    public function paste($nodeIds = array(), $groupIds = array(), $pasteCount = 1, $copyComments = 0)
    {
        $oldToNews = array();
        $newNodes = array();
        $allNodeIds = array();
        $allGroupIds = array();
        $this->getAllNodes($allNodeIds, $allGroupIds, $groupIds);
        $allNodeIds = array_merge($allNodeIds, $nodeIds);
        Constructor_Dao_Node::get_by_id($allNodeIds); // для кеширования
        $newNodes = array();
        foreach($allNodeIds as $nodeId){
            $oldNode = Constructor_Dao_Node::get_by_id($nodeId);
            $node = new Constructor_Dao_Node($oldNode->as_array());
            $oldId = $node->id;
            $oldFileUid = $node->file_uid;
            $oldData = $node->get_data();
            // new values
            $node->id = null;
            $node->file_uid = $this->uid;
            $node->name = $node->name.' copy';
            $node->x += 10 * $pasteCount;
            $node->y += 10 * $pasteCount;
            
            $node->save();
            if ($node->type == Constructor_Dao_Node::TYPE_DATA) {
                $node->set_data($oldData); // копируем данные, но не результаты рассчетов
            }
            $newNodeId = $node->id;
            $oldToNews[$oldId] = $newNodeId;
            if ($copyComments) {
                Model_Dao_Thread::copyPosts(0,$oldNode->thread->id,$node->thread->id);
            }
            //$oldNode->thread->copyNodeThread($node->id);
        }
        foreach($allNodeIds as $nodeId){
            $node = Constructor_Dao_Node::get_by_id($nodeId);
            $newConns = array();
            $conns = $node->get_connections();
            if (!empty($conns)){
                foreach($conns as $slot => $fromId){
                    if (array_key_exists($fromId, $oldToNews)){
                        $newFromId = $oldToNews[$fromId];
                        $newConns[$slot] = $newFromId;
                    }
                }
            }
            $newNode = Constructor_Dao_Node::get_by_id($oldToNews[$nodeId]);
            if (!empty($newConns)){
                $newNode->set_connections($newConns);
            }
            $newNodes[] = $newNode;
        }
        //Model_Dao_Thread::duplicateNodeThreads($oldNodes, $newNodes);

        $oldToNewsGroups = array();
        // копируем группы
        foreach ($allGroupIds as $groupId) {
            $group = Constructor_Dao_Group::get_by_id($groupId);
            $oldId = $group->id;
            $group->id = null;
            $group->file_uid = $this->uid;
            $group->name = $group->name.' copy';
            $group->x += 10 * $pasteCount;
            $group->y += 10 * $pasteCount;
            $newNodesIds = array();
            foreach ($group->nodeIds as $nodeId) {
                $newNodesIds[] = $oldToNews[$nodeId];
            }
            //$group->nodeIds = $newNodesIds;
            $group->save();
            $group->setNodes($newNodesIds);
            $oldToNewsGroups[$oldId] = $group->id;
        }
        $newGroups = array();
        // заменяем id внутренних групп на новые
        foreach ($allGroupIds as $groupId) {
            $oldgroup = Constructor_Dao_Group::get_by_id($groupId);
            $oldId = $oldgroup->id;
            $newInnerGroups = array();
            foreach ($oldgroup->innerGroupIds as $innerId) {
                $newInnerGroups[] = $oldToNewsGroups[$innerId];
            }
            $group = Constructor_Dao_Group::get_by_id($oldToNewsGroups[$oldId]);
            $group->setInnerGroups($newInnerGroups);
            $newGroups[] = $group;
        }
        return array('nodes'=>$newNodes, 'groups'=>$newGroups);
    }
    
    public function getConstants()
    {
        if ($this->_constants === false) {
            $constants = array();
            $sql = 'SELECT * FROM `'.self::$_constants_table.'` WHERE `file_id` = :file_id';
            $expr = DB::query(Database::SELECT, $sql)->parameters(array(':file_id' => $this->id));
            $rows = $expr->execute();
            foreach($rows as $row){
                $constants[$row['const']] = $row['value'];
            }
            $this->_constants = $constants;
        }
        return $this->_constants;
    }
    
    public function addConstant($const, $val)
    {
        $sql = 'INSERT INTO `'.self::$_constants_table.'` (`file_id`, `const`, `value`) VALUES (:file_id, :constant, :value)';
        $expr = DB::query(Database::INSERT, $sql)->parameters(
            array(':file_id' => $this->id, ':constant' => $const, ':value' => $val));
        $expr->execute();
        return true;
    }
    
    public function setConstants($data)
    {
        $sqlDel = 'DELETE FROM `'.self::$_constants_table.'` WHERE `file_id` = :file_id';
        $expr = DB::query(Database::DELETE, $sqlDel)->parameters(array(':file_id' => $this->id));
        $rows = $expr->execute();
        foreach($data as $c => $v){
            $this->addConstant($c, $v);
        }
        return true;
    }
    
    /** 
    * очень плохой метод выбирает из таблички файлы с определенным именем
    * 
    * @param string $name
    */
    static public function get_by_name($name = '') {
        $sql = "SELECT * FROM `".self::$_table."` WHERE ";
        if (!empty($name)){
            $sql .= " `title` LIKE :name AND";
        }
        $sql .= " `is_latest` = 1";
        $expr = DB::query(Database::SELECT, $sql)->param(':name', $name.'%');
        $res = $expr->execute()->as_array();
        $results = array();
        if (!$res) return $results;
        foreach ($res as $row) {
            $results[$row['uid']] = new Constructor_Dao_File($row);
        }
        return $results;
    }
    
    
    static public function getReportFiles($userId)
    {
        $fileIds = array();
        $sqlSelect = 'SELECT * FROM `'.self::$_report_table.'` WHERE `user_id` = :user_id';
        $rows = DB::query(Database::SELECT, $sqlSelect)->parameters(array(':user_id' => $userId))->execute()->as_array();
        foreach($rows as $row){
            $fileIds[] = $row['file_uid'];
        }
        return $fileIds;
    }
    
    static public function getReportData($userId)
    {
        $sqlSelect = 'SELECT * FROM `'.self::$_user_reports.'` WHERE `user_id` = :user_id';
        $row = DB::query(Database::SELECT, $sqlSelect)->parameters(array(':user_id' => $userId))->execute()->as_array();
        return (empty($row)) ? array() : reset($row);
    }
    
    public function setReportFiles($userId, $fileIds = array())
    {
        $sqlDelete = 'DELETE FROM `'.self::$_report_table.'` WHERE `user_id` = :user_id';
        DB::query(Database::DELETE, $sqlDelete)->parameters(array(':user_id' => $userId))->execute();
        
        $sqlInsert = 'INSERT INTO `'.self::$_report_table.'` (`user_id`, `file_uid`) VALUES (:user_id, :file_uid);';
        if (!empty($fileIds)){
            foreach($fileIds as $fileId){
                DB::query(Database::INSERT, $sqlInsert)->parameters(array(':user_id' => $userId, ':file_uid' => $fileId))->execute();
            }
        }
        return true;
    }
    
    public function setReportData($userId, $desc = '')
    {
        $sqlInsert = 'INSERT INTO `'.self::$_user_reports.'` (`user_id`, `desc`) VALUES (:user_id, :desc) ON DUPLICATE KEY UPDATE `desc` = :desc';
        DB::query(Database::INSERT, $sqlInsert)->parameters(array(':user_id' => $userId, ':desc' => $desc))->execute();
        return true;
    }
    
}
?>
