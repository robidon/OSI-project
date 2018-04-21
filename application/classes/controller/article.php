<?php
class Controller_Article extends Controller_Website {
    public function action_index ()
    {
        $textName = $this->request->param('name',false);
        if (!$textName) {
            throw new Exception_404();
        }
        $text = Model_Dao_Text::by_name($textName);
        if (!$text) {
            if (!$this->auth_user || $this->auth_user->status != Model_User::STATUS_ADMIN) {
                throw new Exception_403();
            }
        }
        $this->view->set('name',$textName);
    }
}
