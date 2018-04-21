<?php
class Model_Dao_UserAuth_VK extends Model_Dao {
    
    public static $client_id = '4553929'; // ID приложения
    public static $client_secret = 'BACiraPDlvOHoeOoHIUA'; // Защищённый ключ
    public static $redirect_uri = 'http://opensbor.org/profile/register_vk'; // Адрес сайта
    
    public static $_table = 'users_auth_vk';
    public static $_fields = array('id','uid','user_id','create_date','update_date','first_name','last_name','screen_name','sex','bdate','photo_big');

    public $id;
    public $uid;
    public $user_id;
    public $create_date;
    public $update_date;
    public $first_name;
    public $last_name;
    public $screen_name;
    public $sex;
    public $bdate;
    public $photo_big;
    
    private $_user;

    /**
    * @param mixed $id
    * @return Model_Dao_UserAuth_VK
    */
    static public function get_by_id($id)
    {
        return parent::get_by_id($id);
    }
    
    static public function get_by_user($user_id)
    {
        $sql = 'SELECT * FROM `'.self::$_table.'` WHERE `user_id` = '.intval($user_id);
        $data = DB::query(Database::SELECT,$sql)->execute()->as_array();
        $result = array();
        foreach ($data as $row) {
            $result[$row['id']] = new Model_Dao_UserAuth_VK($row);
        }
        return $result;
    }

    static public function get_by_uid($uid)
    {
        $sql = 'SELECT * FROM `'.self::$_table.'` WHERE `uid` = '.intval($uid);
        $data = DB::query(Database::SELECT,$sql)->execute()->as_array();
        if ($data) {
            return new Model_Dao_UserAuth_VK($data[0]);
        }
        return null;
    }
    
    static public function oauth_vk_url() {
        $url = 'http://oauth.vk.com/authorize';

        $params = array(
            'client_id'     => self::$client_id,
            'redirect_uri'  => self::$redirect_uri,
            'response_type' => 'code'
        );
        return $url . '?' . urldecode(http_build_query($params));
    }

    
    public function get_user() {
        if (!$this->_user) {
            $this->_user = new Model_User($this->user_id);
        }
        return $this->_user;
    }
    
    public function save()
    {
        if (!$this->create_date) {
            $this->create_date = time();
        }
        parent::save();
    }
    
    public function update_user() {
        $this->get_user();
        $this->_user->username = $this->first_name.(($this->last_name&&$this->first_name)?' ':'').$this->last_name;
        
        $tempPath = DOCROOT."photos/temp/".$this->_user->id;
        $realPath = DOCROOT."photos/".$this->_user->id;
        $data = file_get_contents($this->photo_big);
        file_put_contents($tempPath,$data);
        chmod($tempPath,0777);
        $image = Image::factory($tempPath);
        $sizes = array(200,100,35,24);
        foreach ($sizes as $size) {
            $image->resize($size,$size,Image::AUTO);
            $image->save($realPath."_".$size.".jpg");
            chmod($realPath."_".$size.".jpg",0777);
        }
        unlink($tempPath);

        $this->_user->photo_ver = time();
        $this->update_date = time();
        $this->save();
        $this->_user->save();
    }
    
    public function updateAva() {
        
    }
}
?>
