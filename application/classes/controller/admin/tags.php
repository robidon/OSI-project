<?php
class Controller_Admin_Tags extends Controller_Admin
{
    public function action_index()
    {
        $this->view->set('tags', Constructor_Dao_Tag::getAllTags());
        $rows = Constructor_Dao_Namespace::getAllNamespaces();
        $namespaces = array();
        foreach($rows as $row){
            $namespaces[$row['id']] = $row['name'];
        }
        $this->view->set('namespaces', $namespaces);
        $this->tpl = "admin/tags";
    }
    
    public function action_save()
    {
        $tagId = (int)$this->p('item');
        $tag = Constructor_Dao_Tag::get_by_id($tagId);
        if (!$tag) {
            $this->json_status = 'error';
            return;
        }
        $data = $this->p('data');
        $tag->name = $data['name'];
        $tag->description = $data['description'];
        $tag->namespace_id = $data['namespace_id'];
        $tag->parent_tag_id = $data['parent_tag_id'];
        $tag->save();
        $this->json_status = 'ok';
    }
    
    public function action_remove()
    {
        $tagId = (int)$this->p('item');
        $tag = Constructor_Dao_Tag::get_by_id($tagId);
        if (!$tag) {
            $this->json_status = 'error';
            return;
        }
        $tag->delete();
        $this->json_status = 'ok';
    }
    
    public function action_namespaces()
    {
        $this->view->set('namespaces', Constructor_Dao_Namespace::getAllNamespaces());
        $this->tpl = "admin/namespaces";
    }
    
    public function action_saveNamespace()
    {
        $namespaceId = (int)$this->p('item');
        $namespace = Constructor_Dao_Namespace::get_by_id($namespaceId);
        if (!$namespace) {
            $this->json_status = 'error';
            return;
        }
        $data = $this->p('data');
        $namespace->name = $data['name'];
        $namespace->description = $data['description'];
        $namespace->save();
        $this->json_status = 'ok';
    }
    
    public function action_removeNamespace()
    {
        $namespaceId = (int)$this->p('item');
        $namespace = Constructor_Dao_Namespace::get_by_id($namespaceId);
        if (!$namespace) {
            $this->json_status = 'error';
            return;
        }
        $namespace->delete();
        $this->json_status = 'ok';
    }
    
    public function action_additem()
    {
        $data = $this->p('data');
        if (!isset($data['name'])) {
            $data['name'] = '';
        }
        $newItem = new Constructor_Dao_Tag($data);
        $newItem->save();
        $this->json_status = 'ok';
    }
    
    public function action_addnamespace()
    {
        $data = $this->p('data');
        if (!isset($data['name'])) {
            $data['name'] = '';
        }
        $newItem = new Constructor_Dao_Namespace($data);
        $newItem->save();
        $this->json_status = 'ok';
    }
}