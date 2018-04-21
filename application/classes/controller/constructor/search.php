<?php
class Controller_Constructor_Search extends Controller_Constructor
{
    public function action_operators()
    {
        $query = $this->p('query', '');
        $data = array('operators' => array());
        $operators = Constructor_Service_Search::searchOperators($query);
        if (!empty($operators)){
            foreach($operators as $operator){
                $data['operators'][$operator->id] = array('id' => $operator->id, 'title' => $operator->title);
            }
        }
        $this->json_status = 'ok';
        $this->json_data = $data;
        return true;
    }
    
    public function action_tags()
    {
        $query = $this->p('query', '');
        $namespaceId = (int)$this->p('namespace_id', 0);
        $tags = Constructor_Dao_Tag::searchTags($query, $namespaceId);
        $this->json_status = 'ok';
        $this->json_data = $tags;
        return true;
    }
}