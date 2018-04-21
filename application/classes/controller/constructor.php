<?php
class Controller_Constructor extends Controller_Website
{
    public function before()
    {
        parent::before();
        if (!$this->auth_user) {
            throw new Exception_403();
            $this->after();
            return;
        }
    }    
}
?>
