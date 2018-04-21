<?php defined('SYSPATH') or die('No direct access allowed.');

class Model_User extends Model_Auth_User {

    const STATUS_REGISTER = 0;
    const STATUS_USER = 1;
    const STATUS_ADMIN = 127;
    
    
    static public $statuses = array(
        self::STATUS_REGISTER => 'Не подтвердил мыло',
        self::STATUS_USER => 'Пользователь',
        self::STATUS_ADMIN => 'Админ',
    );
	// This class can be replaced or extended
    
    public function get_photo($size = 24) {
        if ($this->photo_ver == 0) {
            return STATIC_URL.'/img/user_'.$size.'.png';
        } else {
            return "/photos/".$this->id."_".$size.".jpg?".$this->photo_ver;
        }
    }
     
    public static function find_id_by_email($email) {
        $results = DB::select()->from('users')->where('email','=',$email)->execute()->as_array();
        if (!$results) return false;
        $results = reset($results);
        return $results['id'];
    }
    
    public function get_profile_url($full = false) {
        return '/profile/'.$this->id;
    }

} // End User Model