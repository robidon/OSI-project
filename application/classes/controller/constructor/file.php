<?php
class Controller_Constructor_File extends Controller_Constructor {

    private function new_file()
    {
        $file = new Constructor_Dao_File();
        $file->title = 'Новый файл';
        $file->version = 1;
        $file->is_current = 1;
        $file->uid = -1;
        $file->date_created = time();
        $file->date_modified = time();
        $file->editor_id = $this->auth_user->id;
        $file->editor_type = Constructor_Service_File::EDITOR_TYPE_USER;
        return $file;
    }
    public function action_index()
    {
        if (!$this->view_file()) {
            throw new Exception_404();
        }
        $fileSettings = $this->file->getSettings($this->auth_user->id);
        $this->view->macroparams = Constructor_Dao_Macroparams::getUserParams($this->auth_user->id);
        $this->view->fileSettings = json_encode($fileSettings);
        $this->view->tags = Constructor_Dao_Tag::getAllTags(true);;
        $this->view->fileJSON = $this->file->as_json($this->access);
        $this->tpl = 'constructor/newfile';
    }
    public function action_delete()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) {
            throw new Exception_404();
        }
        $this->file->delete();
        $this->request->redirect("/constructor");
    }

    
    public function action_save()
    {
        $file_id = intval($this->p('id'));
        
        if (!$this->auth_user) {
            $this->json_status = 'error';
            $this->json_data = 'forbidden';
            return;
        }

        $file = ($file_id) ? Constructor_Dao_File::get_by_id($file_id) : $this->new_file();
        /** @var Constructor_Dao_File $file */

        if ($file->id && !$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) {
            $this->json_status = 'error';
            $this->json_data = 'forbidden';
            return;
        }
        
        $data = $this->p('data');
        $strValues = array('title','description', 'namespace_id', 'access');
        $changed = false;
        foreach ($strValues as $key) {
            if (!isset($data[$key]) || !$data[$key]) continue;
            $file->$key = $data[$key];
            $changed = true;
        }
        if ($changed) {
            try {
                $file->modified(false);
                if (!$file->save()) {
                    $this->json_status = 'error';
                    $this->json_data = 'wrong parameters specified';
                    return;
                }else{
                    // assign tags to file
                    Constructor_Dao_Tag::removeAllTagsFromItem($file->uid, Constructor_Dao_Tag::ITEM_TYPE_FILE);
                    $tags = explode('.', $file->title);
                    foreach($tags as $tag){
                        $tagObj = Constructor_Dao_Tag::getTagByCrc(sprintf("%u",crc32(mb_strtolower($tag))));
                        
                        
                        if ($tagObj !== false){
                            Constructor_Dao_Tag::addTagToItem($file->uid, Constructor_Dao_Tag::ITEM_TYPE_FILE, $tagObj->id);
                        }
                    }
                }
            } catch (Exception $e) {
                $this->json_status = 'error';
                $this->json_data = !IN_PRODUCTION ? $e->getMessage() : 'internal error';
                return;
            }
        }
        $this->json_status = 'ok';
        $this->json_data = $file_id ? $file_id : $file->id;
    }
    
    /**
    * @var Constructor_Dao_File
    */
    private $file;
    private $access;
    private function view_file()
    {
        $file_id = intval($this->p('id'));
        $this->file = Constructor_Dao_File::get_by_id($file_id);
        /** @var Constructor_Dao_File $file */
        if (!$this->file) {
            $this->json_status = 'error';
            $this->json_data = 'no file';
            return false;
        }
        if (true || IN_PRODUCTION) {
            $this->access = Constructor_Service_File::get_user_access($this->file, $this->auth_user);
        } else {
            $this->access = Constructor_Service_File::ACCESS_LEVEL_ADMIN |
            Constructor_Service_File::ACCESS_LEVEL_EDIT |
            Constructor_Service_File::ACCESS_LEVEL_COMMENT |
            Constructor_Service_File::ACCESS_LEVEL_COPY |
            Constructor_Service_File::ACCESS_LEVEL_COPY_NODES |
            Constructor_Service_File::ACCESS_LEVEL_READ;
        }
        if (!($this->access & Constructor_Service_File::ACCESS_LEVEL_READ)) {
            $this->json_status = 'error';
            $this->json_data = 'forbidden';
            return false;
        }
        if ($this->view) {
            $this->view->set('file',$this->file);
        }
        return true;
    }
    
    /**
    * Получаем данные о редактируемом файле
    */
    private function edit_file($accessRequired = Constructor_Service_File::ACCESS_LEVEL_EDIT) {
        if (!$this->view_file()){
            return false;
        }
        if (!($this->access & $accessRequired)) {
            $this->json_status = 'error';
            $this->json_data = 'forbidden';
            return false;
        }
        return true;
    }

    /**
    * Сохраняем только позиции существующих нод
    * 
    */
    public function action_save_pos()
    {
        if (!$this->view_file()) return false;

        $x = (int)$this->p('x', 0);
        $y = (int)$this->p('y', 0);
        $zoom = (int)$this->p('zoom', 0);
        $filter = $this->p('keysFilter');
        
        $keysFilter = isset($filter['keysFilter'])?mysql_real_escape_string($filter['keysFilter']):'';
        $keysMinBound = (isset($filter['keysMinBound']) && $filter['keysMinBound']!="null") ? floatval($filter['keysMinBound']) : null;
        $keysMaxBound = (isset($filter['keysMaxBound']) && $filter['keysMaxBound']!="null") ? floatval($filter['keysMaxBound']) : null;
        $keysFilterEnabled = isset($filter['enabled']) ? ($filter['enabled']==1 ? 1 : 0) : 0;
        $keysSort = isset($filter['keysSort']) ? intval($filter['keysSort']) : 0;
        $this->file->updateSettings($x, $y, $zoom, $this->auth_user->id, $keysFilterEnabled, $keysFilter, $keysMinBound, $keysMaxBound, $keysSort);
        
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) {
            $this->json_status = 'ok';
            return true;
        }

        $nodesPos = $this->p('nodes');
        $rows = array();
        if (!empty($nodesPos)){
            foreach ($nodesPos as $id=>$row) {
                $rows[intval($id)] = array(
                    'x'=>intval(@$row['x']),
                    'y'=>intval(@$row['y']),
                );
            }
        }
        // проверяем, что ноды из нашего файла
        $nodes = Constructor_Dao_Node::get_by_id(array_keys($rows));
        foreach ($nodes as $node) {
            if ($node->file_uid != $this->file->uid) {
                $this->json_status = 'error';
                return false;
            }
        }
        if (!empty($rows)){
            $this->file->set_nodes_pos($rows);
        }
        $groupsPos = $this->p('groups', array());
        if ($groupsPos) {
            $rows = array();
            foreach ($groupsPos as $id=>$row) {
                $rows[intval($id)] = array(
                    'x'=>intval(@$row['x']),
                    'y'=>intval(@$row['y']),
                );
            }
            // проверяем, что группы из нашего файла
            $groups = Constructor_Dao_Group::get_by_id(array_keys($rows));
            foreach ($groups as $group) {
                if ($group->file_uid != $this->file->uid) {
                    $this->json_status = 'error';
                    return false;
                }
            }
            if (!empty($rows)){
                $this->file->set_groups_pos($rows);
            }
        }
        
        $this->file->modified();
        $layers = $this->p('layers', array());
        foreach($layers as $layerData){
            if (is_array($layerData) && array_key_exists('node_ids', $layerData)){
                Constructor_Dao_File::setLayerNodes($layerData['id'], $layerData['node_ids']);
            }
        }
        $this->json_status = 'ok';
        return true;
    }
    
    public function action_connect () {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $fromNodeId = intval($this->p('from'));
        $toNodeId = intval($this->p('to'));
        $slot = intval($this->p('slot'));
        // проверяем, что ноды из нашего файла
        $nodes = Constructor_Dao_Node::get_by_id(array($toNodeId, $fromNodeId));
        if (!@$nodes[$toNodeId] || !@$nodes[$fromNodeId] || $nodes[$toNodeId]->file_uid != $this->file->uid || $nodes[$fromNodeId]->file_uid != $this->file->uid) {
            $this->json_status = 'error1';
            return false;
        }
        $toNode = $nodes[$toNodeId];
        if ($toNode->type == Constructor_Dao_Node::TYPE_DATA || $toNode->type == Constructor_Dao_Node::TYPE_OPERATOR_DATA) {
            $this->json_status = 'error2';
            return false;
        }
        if ($this->file->set_connection($toNodeId, $slot, $fromNodeId)) {
            $this->file->modified();
            $this->json_status = 'ok';
            return true;
        }
        $this->json_status = 'error';
        return false;
    }

    public function action_disconnect() {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $toNode = intval($this->p('node',0));
        $slot = intval($this->p('slot',0));
        $node = Constructor_Dao_Node::get_by_id($toNode);
        if (!$node || $node->file_uid != $this->file->uid) {
            $this->json_status = 'failed';
            return false;
        }
        if (!$node->delete_connection($slot)) {
            $this->json_status = 'failed';
            return false;
        }
        $this->file->modified();
        $this->json_status = 'ok';
        return true;
    }
    
    private function saveNode($data) {
        $results = array();
        if (@$data['id']) {
            $newNode = false;
            // модификация старой ноды
            $node = Constructor_Dao_Node::get_by_id(intval($data['id']));
            if ($node->file_uid != $this->file->uid) {
                return false;
            }
        } else {
            // новая нода
            $node = new Constructor_Dao_Node();
            $node->file_uid = $this->file->uid;
            $newNode = true;
        }
        $node->type = intval(@$data['type']);
        $node->name = strval(@$data['name']);
        $node->description = strval(@$data['description']);
        $node->operator_uid = intval(@$data['operator_uid']);
        $node->position = intval(@$data['position']);
        $formula = @$data['formula'] | '';
        $newFormula = false;
        if ($node->formula!=$formula) {
            $oldFormula = $node->formula;
            $node->formula = $formula;
            $newFormula = true;
        }
        $node->x = intval(@$data['x']);
        $node->y = intval(@$data['y']);
        $node->style = intval(@$data['style']);
        $node->rotation = intval(@$data['rotation']);
        $node->full_desc = @$data['full_desc'];
        
        $node->save($dataInserted);
        
        $newData = @$data['data'];
        $newData = (is_array($newData))?$newData:array();
        $node->set_data($newData);
        
        $this->file->modified();
        $results = array('id'=>$node->id);
        if (!empty($dataInserted)){
            $results['node_data'] = $dataInserted;
        }

        if ($newFormula) {
            $exp = new Constructor_Model_Expression();
            $exp->fileUid = $node->file_uid;
            $oldVars = $exp->get_vars($oldFormula);
            $newVars = $exp->get_vars($node->formula);
            $conv = array();
            foreach($newVars as $newSlot => $newVar) {
                $found = false;
                foreach($oldVars as $oldSlot => $oldVar) {
                    if ($newVar == $oldVar) {
                        $conv[$newSlot] = $oldSlot;
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    $conv[$newSlot] = -1;
                }
            }
            $fileNodes = $this->file->get_nodes();
            $connections = $node->get_connections();
            $newcons = array();
            foreach ($conv as $newSlot=>$oldSlot) {
                if ($oldSlot!=-1) {
                    $newcons[$newSlot] = intval(@$connections[$oldSlot]);
                } else {
                    $newcons[$newSlot] = 0;
                    foreach ($fileNodes as $otherNode) {
                        if ($otherNode->id == $node->id) continue;
                        if (mb_strtolower($otherNode->name) == mb_strtolower($newVars[$newSlot])) {
                            $newcons[$newSlot] = $otherNode->id;
                            break;
                        }
                    }
                }
            }
            $node->set_connections($newcons);
            $results['connections'] = $newcons;
            
            try {
                if (!Helper_Migration::isNewConstructorEnabled()) { // пока для старой версии
                    $node->calc();
                }
            } catch (Exception $e) {
                
            }
        }
        $conns = @$data['connections'];
        if ($conns) {
            $node->set_connections($conns);
        }
        return $results;
    }
    public function action_save_nodes() {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $nodes = $this->p('nodes');
        $result = array();
        foreach ($nodes as $nodeId=>$data) {
            try {
                $result[$nodeId] = $this->saveNode($data);
            } catch (Exception $e) {
                $result[$nodeId] = false;
            }
        }
        $this->json_status = 'ok';
        $this->json_data = $result;
        return true;
        
    }
    public function action_save_node () {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $data = $this->p('data');
        $results = $this->saveNode($data);
        if (!$results) {
            $this->json_status = 'failed';
            return false;
        } else {
            $this->json_status = 'ok';
            $this->json_data = $results;
            return true;
        }
    }
    
    private function saveGroup($data) {
        $results = array();
        if (@$data['id']) {
            $newGroup = false;
            // модификация старой группы
            $group = Constructor_Dao_Group::get_by_id(intval($data['id']));
            if ($group->file_uid != $this->file->uid) {
                return false;
            }
        } else {
            // новая группа
            $group = new Constructor_Dao_Group();
            $group->file_uid = $this->file->uid;
            $newGroup = true;
        }
        $group->name = @$data['name'];
        $group->description = @$data['description'];
        $group->x = intval(@$data['x']);
        $group->y = intval(@$data['y']);
        $group->opened = intval(@$data['opened'] == 'true' || @$data['opened'] == '1');
        $group->style = intval(@$data['style']);
        $group->rotation = intval(@$data['rotation']);
        $group->full_desc = @$data['full_desc'];
        $group->save();
        $newNodeIds = @$data['nodes'];
        $newGroupIds = @$data['inner_groups'];
        if (!$newNodeIds) $newNodeIds = array();
        if (!$newGroupIds) $newGroupIds = array();
        $group->setNodes(Helper_Array::intval($newNodeIds));
        $group->setInnerGroups(Helper_Array::intval($newGroupIds));
        $this->file->modified();
        $results = array('id'=>$group->id);
        return $results;
    }
    public function action_save_groups() {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $groups = $this->p('groups');
        $result = array();
        foreach ($groups as $groupId=>$data) {
            try {
                $result[$groupId] = $this->saveGroup($data);
            } catch (Exception $e) {
                $result[$groupId] = false;
            }
        }
        $this->json_status = 'ok';
        $this->json_data = $result;
        return true;
        
    }
    public function action_save_group () {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $data = $this->p('data');
        $results = $this->saveGroup($data);
        if (!$results) {
            return false;
        } else {
            $this->json_status = 'ok';
            $this->json_data = $results;
            return true;
        }
    }
    
    public function action_delete_node() {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $nodeId = intval($this->p('node',0));
        $node = Constructor_Dao_Node::get_by_id($nodeId);
        if (!$node || $node->file_uid != $this->file->uid) {
            $this->json_status = 'failed';
            return false;
        }
        if (!$node->delete()) {
            $this->json_status = 'failed';
            return false;
        }
        $this->file->modified();
        $this->json_status = 'ok';
    }
    
    public function action_delete_group() {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $groupId = intval($this->p('group',0));
        $group = Constructor_Dao_Group::get_by_id($groupId);
        if (!$group || $group->file_uid != $this->file->uid) {
            $this->json_status = 'failed';
            return false;
        }
        if (!$group->delete()) {
            $this->json_status = 'failed';
            return false;
        }
        $this->file->modified();
        $this->json_status = 'ok';
    }
    
    public function action_delete_multiple() {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $groupIds = $this->p('groups',array());
        $nodeIds = $this->p('nodes',array());
        $groupIds = Helper_Array::intval($groupIds);
        $nodeIds = Helper_Array::intval($nodeIds);
        if ($nodeIds) {
            Constructor_Dao_Node::delete_multiple($nodeIds,$this->file->uid);
        }
        if ($groupIds) {
            $groups = $this->file->get_groups($groupIds);
            foreach ($groups as $group) {
                $group->delete();
            }
            $this->file->modified();
        }
        $this->json_status = 'ok';
    }
    
    public function action_set_node_data() {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $nodeId = intval($this->p('node',0));
        $node = Constructor_Dao_Node::get_by_id($nodeId);
        if (!$node || $node->file_uid != $this->file->uid || $node->type != Constructor_Dao_Node::TYPE_DATA) {
            $this->json_status = 'failed';
            return false;
        }
        $data = $this->p('data',array());
        if (!$node->set_data($data)) {
            $this->json_status = 'failed';
            return false;
        }
        $this->file->modified();
        $this->json_status = 'ok';
        return true;
    }
    
    public function action_calc()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $nodeId = intval($this->p('node',0));
        $node = Constructor_Dao_Node::get_by_id($nodeId);
        if (!$node) {
            $this->json_status = 'failed';
            return false;
        }
        $this->file->modified();
        $this->json_status = 'ok';
        $this->json_data['data'] = $node->calc();
    }
    
    public function action_precalc()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $data = $this->p('data');
        if (empty($data)) return false;
        $node = new Constructor_Dao_Node($data);
        if (!$node->id) {
            $node->id = -1;
        }
        $node->file_uid = $this->file->uid;
        $node->connections = $this->p('connections');
        if (!$node) {
            $this->json_status = 'failed';
            return false;
        }
        $this->json_status = 'ok';
        $resData = array();
        $allNodes = $this->file->get_nodes();
        $allConnections = $this->file->get_connections();
        $allData = $this->file->get_data();
        try{
            $resData = $node->calc();
            if (!$resData) {
                trigger_error('Не достаточно данных');
            }
            $this->json_data['data'] = $resData;
        }
        catch(ErrorException $e){
            $this->json_status = 'error';
            $this->json_data['data'] = $e->getMessage();
        }
    }
    
    /*public function action_publish()
    {
        if (!$this->edit_file()) return false;
        if ($this->p('publish')) {
            $this->file->published = 1;
        } else {
            $this->file->published = 0;
        }
        $this->file->save();
        $this->json_status = 'ok';
        //$this->json_data = 
        //$this->file->publish();
    }*/
    
    public function action_add_group_item()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $nodeId = intval($this->p('node_id'));
        $innerGroupId = intval($this->p('inner_group_id'));
        $groupId = $this->p('group_id');
        $group = Constructor_Dao_Group::get_by_id($groupId);
        if ($nodeId) {
            $group->addNodes(array($nodeId));
        } else if ($innerGroupId) {
            $group->addInnerGroups(array($innerGroupId));
        }
        $this->json_status = 'ok';
    }
    
    public function action_arrange()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $this->file->arrange();
        $this->json_status = 'ok';
    }
    
    public function action_copy()
    {
        if (!$this->view_file()) return;
        if ($this->access & Constructor_Service_File::ACCESS_LEVEL_COPY_NODES) {
            $nodeIds = $this->p('node_ids');
            $groupIds = $this->p('group_ids');
            Session::instance()->set('node_ids', $nodeIds);
            Session::instance()->set('group_ids', $groupIds);
            Session::instance()->set('paste_count', 0);
            $this->json_status = 'ok';
        } else {
            $this->json_status = 'error';
            $this->json_data = 'forbidden';
        }
    }
    
    public function action_paste()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $nodeIds = Session::instance()->get('node_ids');
        $groupIds = Session::instance()->get('group_ids');
        $copyComments =intval($this->p('copycomments',0));
        if (!$nodeIds) $nodeIds = array();
        if (!$groupIds) $groupIds = array();
        $pasteCount = Session::instance()->get('paste_count');
        $pasteCount++;
        
        $result = $this->file->paste($nodeIds, $groupIds, $pasteCount, $copyComments);
        if ($result['nodes'] || $result['groups']){
            Session::instance()->set('paste_count', $pasteCount);
        }
        $nodes = array();
        $groups = array();
        $data = $this->file->get_data();
        $conns = $this->file->get_connections();
        $connections = array();
        foreach ($conns as $conn) {
            $to_node_id = $conn['to_node_id'];
            if (!isset($connections[$to_node_id])) $connections[$to_node_id] = array();
            $connections[$to_node_id][intval($conn['to_slot'])] = $conn['from_node_id'];
        }
        foreach($result['nodes'] as $node) {
            $nodes[] = Constructor_Service_Base::nodeAsJSON($node, $data, $connections);
        }
        foreach($result['groups'] as $group) {
            $groups[] = Constructor_Service_Base::groupAsJSON($group, $data, $connections);
        }
        $this->json_data['nodes'] = $nodes;
        $this->json_data['groups'] = $groups;
        $this->json_status = 'ok';
    }
    
    public function action_constants()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $this->json_data = $this->file->getConstants();
        $this->json_status = 'ok';
    }
    
    public function action_saveconstants()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $update = array();
        $constants = $this->p('constants');
        $values = $this->p('values');
        foreach($constants as $k => $val){
            $update[$val] = $values[$k];
        }
        $this->file->setConstants($update);
        $this->json_status = 'ok';
        $this->json_data = $this->file->getConstants();
    }
    
    public function action_filecopy()
    {
        if (!$this->view_file()) return false;
        if ($this->access & Constructor_Service_File::ACCESS_LEVEL_COPY) {
            $this->file->copy($this->auth_user->id, 1);
        }
        $this->request->redirect('/constructor/');
    }
    
    public function action_search()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_READ)) return false;
        $name = $this->p('name', '');
        $nodes = Constructor_Dao_Node::search($name, $this->file->uid);
        $this->json_status = 'ok';
        $result = array();
        if (!empty($nodes)){
            foreach($nodes as $node){
                $result[] = $node->id;
            }
        }
        $this->json_data = $result;
    }
    
    public function action_saveLayer()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $data = $this->p('data');
        $id = $data['id'];
        $title = $data['title'];
        $shown = intval($data['shown']);
        if (!$id) {
            //new
            $layerId = $this->file->addLayer($title, $shown);
            $data['id'] = $layerId;
        } else {
            $this->file->saveLayer($id, $title, $shown);
        }
        $this->json_data = $data;
        $this->json_status = 'ok';
    }
    
    public function action_saveLayersOrder()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $layersData = $this->p('data');
        $layers = array();
        foreach ($layersData as $layer) {
            if (!$layer['id']) continue;
            $layers[] = array (
                'id'=>intval($layer['id']),
                'order'=>intval($layer['order']),
            );
        }
        try {
            $this->file->saveLayersOrder($layers);
            $this->json_status = 'ok';
        } catch (Exception $e) {
            $this->json_status = 'error';
        }
    }

    public function action_removeLayer()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_EDIT)) return false;
        $id = $this->p('layer_id');
        Constructor_Dao_File::removeLayer($id);
        $this->json_status = 'ok';
    }
    
    public function action_shareUsers()
    {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_ADMIN)) return false;
        $emails = $this->p('emails');
        $emails = explode(',',$emails);
        $emails = array_map('trim', $emails);
        $accessArr = $this->p('access');
        $accessLevel = Constructor_Service_File::combine_access_level($accessArr);
        $editors = array();
        foreach ($emails as $email) {
            $userId = Model_User::find_id_by_email($email);
            if (!$userId) continue;
            $editors[] = array('type'=>Constructor_Service_File::EDITOR_TYPE_USER, 'id'=>$userId);
        }
        Constructor_Service_File::add_file_access($this->file->uid, $editors, $accessLevel);
        $this->json_status = 'ok';
        $this->json_data = Constructor_Service_File::parse_access_list(Constructor_Service_File::get_file_access($this->file));
    }
    
    public function action_savePublicAccess() {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_ADMIN)) return false;
        $accessArr = $this->p('access');
        $accessLevel = Constructor_Service_File::combine_access_level($accessArr);
        $this->file->published_access = $accessLevel;
        $this->file->save();
        $this->json_status = 'ok';
        $this->json_data = Constructor_Service_File::parse_access_level($this->file->published_access);
    }
    
    public function action_savePersonalAccess() {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_ADMIN)) return false;
        $accessArr = $this->p('access');
        $accessLevel = Constructor_Service_File::combine_access_level($accessArr);
        $userId = intval($this->p('user'));
        if (!$userId) return false;
        $user = new Model_User($userId);
        if (!$user) return false;
        $editors[] = array("type"=>Constructor_Service_File::EDITOR_TYPE_USER, 'id'=>$userId);
        Constructor_Service_File::add_file_access($this->file->uid, $editors, $accessLevel);
        $this->json_status = 'ok';
        $this->json_data = Constructor_Service_File::parse_access_level($accessLevel);
    }
    
    public function action_removePersonalAccess() {
        if (!$this->edit_file(Constructor_Service_File::ACCESS_LEVEL_ADMIN)) return false;
        $userId = intval($this->p('user'));
        if (!$userId) return false;
        $user = new Model_User($userId);
        if (!$user) return false;
        $editor = array("type"=>Constructor_Service_File::EDITOR_TYPE_USER, 'id'=>$userId);
        Constructor_Service_File::remove_file_access($this->file->uid, $editor);
        $this->json_status = 'ok';
    }    
}
