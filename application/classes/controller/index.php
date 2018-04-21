<?php defined('SYSPATH') or die('No direct script access.');

class Controller_Index extends Controller_Website {
    public function action_index()
    {
         /*if (!$this->auth_user || !$this->auth_user->loaded() || $this->auth_user->status != Model_User::STATUS_ADMIN) {
             $this->request->redirect('/index/about');
         }*/
        //$this->view->
        //$this->request->response = 'hello, world!';
    }
    
    public function action_about()
    {
        
    }
    
    public function action_report()
    {
        $report_name = 'main';
        $report = new Constructor_Model_Report($report_name);
        $this->view->set('report', $report);
        $curFilter = $this->p('filter', false);
        if ($curFilter !== false){
            $this->view->set('osiEditors', false);
        }
        $this->view->set('curFilter', $curFilter);
        
        $availableParams = Constructor_Dao_Macroparams::getParams();
        $availableYears = Constructor_Dao_Macroparams::$availableYears;
        $this->view->set('availableParams', $availableParams);
        $this->view->set('availableYears', $availableYears);
        $yearTypes = array('fact' => 0, 'future' => 0);
        foreach($availableYears as $year){
            if ($year <= date('Y')){
                $yearTypes['fact']++;
            } else {
                $yearTypes['future']++;
            }
        }
        $this->view->set('yearTypes', $yearTypes);
        $userParams = Constructor_Dao_Macroparams::getUserParams($this->auth_user->id);
        $this->view->set('userParams', $userParams);
    }
    
    public function action_subject()
    {
        $subject_type = (int)$this->p('type');
        $subject_id = (int)$this->p('id');
        $this->request->redirect(Service_Subject::get_subject_link($subject_type, $subject_id));
    }
    
    public function action_test()
    {
    }

} // End Index
