<?php
class Controller_Admin_Macroparams extends Controller_Admin
{
    public function action_index()
    {
        $macroparams = Constructor_Dao_Macroparams::getParams(0);
        $this->view->set('macroparams', $macroparams);
        $this->tpl = 'admin/macroparams';
    }
    
    public function action_additem()
    {
        $data = $this->p('data');
        $param = new Constructor_Dao_Macroparams();
        $param->title = $data['title'];
        $param->enabled = (array_key_exists('enabled', $data) && $data['enabled']) ? 1 : 0;
        $param->save();
        $this->json_status = 'ok';
    }
    
    public function action_save()
    {
        $id = $this->p('item');
        $param = Constructor_Dao_Macroparams::get_by_id($id);
        $data = $this->p('data');
        $param->title = $data['title'];
        $param->enabled = $data['enabled'];
        $param->save();
        $this->json_status = 'ok';
    }
    
    public function action_remove()
    {
        $id = $this->p('item');
        $param = Constructor_Dao_Macroparams::get_by_id($id);
        $param->delete();
        $this->json_status = 'ok';
    }
}
