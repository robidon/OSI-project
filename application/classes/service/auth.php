<?php
class Service_Auth {
    
    static public function login_with_vk($vkAuth) {
        $user = $vkAuth->get_user();
        Auth::instance()->force_login($user);
        return true;
    }
}
?>
