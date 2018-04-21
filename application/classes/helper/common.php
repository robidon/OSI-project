<?php
class Helper_Common {    
    static public function isOurIp()
    {
        if (!IN_PRODUCTION) return true;
        $ourIPs = array(
            '127.0.0.1',
            '91.215.122.35',// rodion - home
            '188.134.68.111',// dima - home
        );
        if (array_search(Request::$client_ip, $ourIPs)!==false){
            return true;
        }
        return false;
    }
    static public function mailer_sender() {
        if (IN_SBOR) return array("open@opensbor.org"=>"OpenSbor.org");
        return array("register@osi-project.ru"=>"OSI-Project");
    }
}
?>
