<?php
class Controller_Constructor_Index extends Controller_Constructor {

    public function action_test()
    {
        $test = 'Тест';
        var_dump(mb_strtolower($test));
        //die;
        $exp = new Constructor_Model_Expression();
        $res = $exp->evaluate('2 * vector(1+22,12+34*sqrt(23)) / vector(23,2)+1');
        $vars = $exp->get_vars('exp(12) + 23 - (2ssw) + sds1');
        var_dump($res);
        //die;
        $this->tpl = '';
    }
    
    public function action_testTable()
    {
        $this->tpl = 'constructor/test/table';
    }
    
    public function action_index()
    {
        $myFiles = Constructor_Dao_File::get_by_user($this->auth_user->id);
        $allFiles = Constructor_Dao_File::get_all_published();
        $this->view->set('myfiles', $myFiles);
        $this->view->set('allfiles', $allFiles);
        $this->view->set('tags', Constructor_Dao_Tag::getAllTags(true));
        $this->tpl = 'constructor/index';
    }
    
    public function action_oplist()
    {
        $operators = Constructor_Dao_Operator::get_avaliable($this->auth_user->id);
        $view = new View();
        $view->set('operators', $operators);
        $this->json_status = 'ok';
        $this->json_data = $view->render('constructor/oplist');
    }
    
}
?>
