<?php
class Controller_Admin_Text extends Controller_Admin {
    
    private function save($publish)
    {
        $id = $this->p("id",0);
        if ($id) {
            $text = Model_Dao_Text::get_by_id($id);
            if ($text) {
                if ($text->status != 0) {
                    $text = new Model_Dao_Text();
                    $text->status = 0;
                }
            }
        } else {
            $text = new Model_Dao_Text();
            $text->status = 0;
        }
        $text->text = $this->p('text');
        if (!$text->text) {
            $text->text = 'Содержимое редактируется';
        }
        $text->name = $this->p('name');
        $text->user_id = $this->auth_user->id;
        $text->location = '';
        $ref = $_SERVER['HTTP_REFERER'];
        $host = 'http://'.$_SERVER['HTTP_HOST'];
        if (strpos($ref, $host)!==-1) {
            $location = substr($ref,strlen($host));
            if (strpos($location,'/article/')!==0) {
                $text->location = $location;
            }
        }
        if ($publish) {
            $text->publish();
        } else {
            $text->save();
        }
        return $text->id;
    }
    public function action_publish()
    {
        $this->is_json = true;
        $id = $this->save(1);
        $this->json_status = 1;
        $this->json_data = $id;
    }
    
    public function action_save()
    {
        $this->is_json = true;
        $id = $this->save(0);
        $this->json_status = 1;
        $this->json_data = $id;
    }
    public function action_revert()
    {
        $this->is_json = true;
        $id = $this->p("id",0);
        if ($id) {
            $text = Model_Dao_Text::get_by_id($id);
            if ($text) {
                if ($text->status == 0) {
                    $text->delete();
                }
            }
        }
    }
    
    public function action_index()
    {
        $perPage = 30;
        $page = (int)$this->p('page',0);
        $texts = Model_Dao_Text::get_all($perPage,$perPage*$page);
        $this->view->set('texts',$texts);
        $this->view->set('page', $page);
        $this->tpl = 'admin/texts';
    }

}

