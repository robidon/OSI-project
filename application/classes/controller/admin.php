<?
class Controller_Admin extends Controller_Website {
    public function before()
    {
        parent::before();
        
        if (!$this->auth_user || $this->auth_user->status!=Model_User::STATUS_ADMIN) {
            if (!$this->is_json) {
                throw new Exception_403();
                parent::after();
                die;
            } else {
                $this->json_status = 'error';
                parent::after();
                die;
            }
        }
    }
}