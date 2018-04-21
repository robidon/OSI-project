<?php
class Mailer_Profile extends Mailer{
    public function changeemail($args)
    {
        $user = $args[0]['user'];
        $link = $args[0]['link'];
        $this->to             = array($user->email => $user->username);
        $this->from           = Helper_Common::mailer_sender();
        Swift_Preferences::getInstance()->setCharset('utf8');
        $this->subject        = 'Подтверждение email на '.(IN_SBOR ? 'OpenSbor.org':'OSI-Project');
        $this->charset        = 'utf8';
        //$this->attachments    = array('/path/to/file/file.txt', '/path/to/file/file2.txt');
        $this->body_data      = array(
            'user_name' => $user->username,
            'link' => $link
        );
        //$this->body_data = $args;        
    }
    public function changepassword($args)
    {
        $user = $args[0]['user'];
        $link = $args[0]['link'];
        $password = $args[0]['password'];
        $this->to             = array($user->email => $user->username);
        $this->from           = Helper_Common::mailer_sender();
        Swift_Preferences::getInstance()->setCharset('utf8');
        $this->subject        = 'Смена пароля на '.(IN_SBOR ? 'OpenSbor.org':'OSI-Project');
        $this->charset        = 'utf8';
        //$this->attachments    = array('/path/to/file/file.txt', '/path/to/file/file2.txt');
        $this->body_data      = array(
            'user_name' => $user->username,
            'link' => $link,
            'password' => $password
        );
        //$this->body_data = $args;        
    }
}
?>
