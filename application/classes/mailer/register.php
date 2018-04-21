<?php
class Mailer_Register extends Mailer{
    public function welcome($args)
    {
        $user = $args[0]['user'];
        $link = $args[0]['link'];
        $this->to             = array($user->email => $user->username);
        $this->from           = Helper_Common::mailer_sender();
        Swift_Preferences::getInstance()->setCharset('utf8');
        $this->subject        = 'Complete your registration at '.(IN_SBOR ? 'OpenSbor.org':'OSI-Project');
        $this->charset        = 'utf8';
        //$this->attachments    = array('/path/to/file/file.txt', '/path/to/file/file2.txt');
        $this->body_data      = array(
            'user_name' => $user->username,
            'link' => $link
        );
        //$this->body_data = $args;        
    }
    public function test($args)
    {
        $this->to             = array("dfdsfdf@mailforspam.com" => "test");
        $this->from           = Helper_Common::mailer_sender();
        $this->subject        = 'Complete your registration at '.(IN_SBOR ? 'OpenSbor.org':'OSI-Project');
        $this->charset        = 'utf8';
    }
}
?>
