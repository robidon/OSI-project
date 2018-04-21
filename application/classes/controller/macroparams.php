<?php
class Controller_Macroparams extends Controller_Website
{
    public function action_index()
    {
        if (empty($this->auth_user)){
            throw new Exception_403();
        }
        $availableYears = Constructor_Dao_Macroparams::$availableYears;
        $availableParams = Constructor_Dao_Macroparams::getParams();
        $userParams = Constructor_Dao_Macroparams::getUserParams($this->auth_user->id);
        if ($this->is_json) {
            $this->json_data = array(
                'years'=>$availableYears,
                'availableParams'=>$availableParams,
                'userParams'=>$userParams
            );
        } else {
            $this->view->set('years', $availableYears);
            $this->view->set('availableParams', $availableParams);
            $this->view->set('userParams', $userParams);
        }
    }
    
    public function action_save()
    {
        $params = $this->p('params');
        Constructor_Dao_Macroparams::setUserParams($this->auth_user->id, $params);
        if ($this->is_json) {
            $this->json_data = Constructor_Dao_Macroparams::getUserParams($this->auth_user->id);
            $this->json_status = 'ok';
        } else {
            $this->request->redirect('/macroparams/');
        }
    }
}