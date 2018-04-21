<?php defined('SYSPATH') or die('No direct script access.');
class Controller_Profile extends Controller_Website {
    
    const VOTE_LOG_LIMIT = 15;
    const MAX_PHOTO_SIZE = 2000000;
    
	public function before()
    {
        parent::before();
        $no_user_actions = array(
            'login',
            'register',
            'register_vk',
            'test_vk',
            'confirmemail',
            'testmail',
        );
        if ( ! in_array($this->request->action, $no_user_actions) && ! $this->auth_user ) {
            throw new Exception_403();
            return;
        }
    }

    public function action_index()
	{
        $user_id = (int)$this->p('user_id');
        if (!$user_id) {
            $user = $this->auth_user;
            $user_id = $user->id;
        } else {
            $user = new Model_User($user_id);
            if (!$user->loaded()) {
                throw new Exception_404();
            }
        }
        $this->view->set('user', $user);
        $me = $user->id == $this->auth_user->id;
        $this->view->set('me', $me);
        if ($me) {
            $votelog = Model_Dao_Vote::get_to_user($user->id, 0, self::VOTE_LOG_LIMIT+1);
            $next_page = false;
            if (count ($votelog) > self::VOTE_LOG_LIMIT) {
                $next_page = true;
                $votelog = array_slice($votelog,0,count ($votelog)-1);
            }
            $this->view->set('votelog', $votelog);
            $this->view->set('next_page', $next_page);
            $this->view->set('prev_page', false);
            $this->view->set('page', 0);
        }
	}
    
    public function action_votelog()
    {
        $page = (int)$this->p('page');
        $votelog = Model_Dao_Vote::get_to_user($this->auth_user->id, $page * self::VOTE_LOG_LIMIT, self::VOTE_LOG_LIMIT+1);
        $next_page = false;
        if (count ($votelog) > self::VOTE_LOG_LIMIT) {
            $next_page = true;
            $votelog = array_slice($votelog,0,count ($votelog)-1);
        }
        $view = new View();
        $view->set('votelog', $votelog);
        $view->set('next_page', $next_page);
        $view->set('prev_page', $page>0);
        $view->set('page', $page);
        $this->json_data = $view->render('profile/ajax/votelog');
        $this->json_status = 'ok';
    }
    
    public function action_votelink()
    {
        
    }
    
    public function action_login()
    {
        $this->is_json = true;
        if (Auth_ORM::instance()->login($this->p("email"),$this->p("password"),true)) {
            $this->json_status = 1;
        } else {
            $this->json_status = 2;
            $this->json_data = 'Не правильно указаны email или пароль.';
        }
    }
    
    public function action_logout()
    {
        if ($this->auth_user) {
            Auth::instance()->logout();
        }
        $this->request->redirect('/');
    }
    
    public function action_register()
    {
        if ($this->is_json) {
            
            $errors = array();
            $userName = trim($this->p("username"));
            $email = trim($this->p("email"));
            $password = trim($this->p("password"));
            $referrer = trim($this->p("referrer"));
            
            if (!Validate::email($email)) {
                $errors[] = array("email","Не правильно указан email адрес");
            }
            if ($userName == '') {
                $errors[] = array("username","Не указано имя");
            }
            if ($password == '') {
                $errors[] = array("password","Не указан пароль");
            }
            if (empty($errors)) {
                $user = new Model_User();

                if ($user->unique_key_exists($email,'email')) {
                    $errors[] = array("email","Такой адрес уже зарегистрирован.");
                } else {
                    $user->email = $email;
                    $user->password = $password;
                    $user->username = $userName;
                    $user->referrer = urldecode($referrer);
                    $user->last_login = time();
                    try {
                        $user_id = $user->save();
                        $token = new Model_User_Token();
                        $token->user_id = $user_id;
                        $token->expires = time()+60*60*48;
                        $token_id = $token->save();
                        if ($token->saved()) {
                            //$mailer = new Mailer_Register();
                            $link = Route::url('default',array('controller'=>'profile','action'=>'confirmemail'), true)
                                ."?user_id=".$user_id."&token="
                                .$token->token;
                            //$mailer->welcome($user, $link);
                            $res = Mailer::factory('register')->send_welcome(array('user'=>$user, 'link'=>$link));
                            //$mailer->send();
                            $this->json_status = 1;
                            if (Helper_Common::isOurIp()) {
                                $this->json_data['success'] = $link;
                            }
                            return;
                        } else {
                            throw new Exception();
                        }
                    } catch (Exception $e) {
                        $errors[] = array('error',$e->getMessage());//"Произошла ошибка, приносим свои извинения.");
                    }
                }
            }
            if (!empty($errors)) {
                $this->json_status = 2;
                $this->json_data['errors'] = $errors;
                return;
            }
             
        } else {
            if ($this->p('referrer','')) {
                $referrer = $this->p('referrer');
            } else {
                $referrer = Kohana_Request::$referrer;
            }
            $this->view->set('referrer',urlencode($referrer));
        }
    }
    
    public function action_test_vk() {
        echo Model_Dao_UserAuth_VK::oauth_vk_url();
    }
    
    public function action_register_vk() {

        $errors = array();
        $referrer = trim($this->p("referrer"));
        
        $this->layout = '';
        
        if ($this->p('error')) {
            $this->view->set('errors','auth failed');
            return;
        }

        $result = false;
        $params = array(
            'client_id' => Model_Dao_UserAuth_VK::$client_id,
            'client_secret' => Model_Dao_UserAuth_VK::$client_secret,
            'code' => $_GET['code'],
            'redirect_uri' => Model_Dao_UserAuth_VK::$redirect_uri
        );

        $token = json_decode(file_get_contents('https://oauth.vk.com/access_token' . '?' . urldecode(http_build_query($params))), true);

        if (isset($token['access_token'])) {
            $params = array(
                'uids'         => $token['user_id'],
                'fields'       => 'uid,first_name,last_name,screen_name,sex,bdate,photo_big',
                'access_token' => $token['access_token']
            );

            $userInfo = json_decode(file_get_contents('https://api.vk.com/method/users.get' . '?' . urldecode(http_build_query($params))), true);
            if (isset($userInfo['response'][0]['uid'])) {
                $userInfo = $userInfo['response'][0];
                $result = true;
            }
        }

        $this->view->set('errors','');
        if (!$result) {
            $this->view->set('errors','auth failed');
            return;
        } else {
            
            $authVK = Model_Dao_UserAuth_VK::get_by_uid($userInfo['uid']);
            if ($authVK) {
                Service_Auth::login_with_vk($authVK);
                return;
            }
            $authVK = new Model_Dao_UserAuth_VK($userInfo);
            $user = new Model_User();
            $user->status = Model_User::STATUS_USER;
            $user_id = $user->save();
            $authVK->user_id = $user_id;
            $authVK->update_date = time();
            $authVK->save();
            $authVK->update_user();
            Service_Auth::login_with_vk($authVK);
            return;
        }
        
    }
    
    public function action_confirmchangepassword()
    {
        $token_token = @$_GET['token'];
        $user_id = (int)@$_GET["user_id"];
        $user = new Model_User();
        $user->find($user_id);
        if (!$user->loaded()) {
            $this->request->redirect("/profile/register");
            return;
        }
        $token = $user->user_tokens->where('token', '=', $token_token)->find();
        if (!$token->loaded()) {
            $this->request->redirect("/profile/register");
            return;
        }
        $token->delete();
        if ($user->new_password) {
            $user->password = $user->new_password;
            $user->new_password = '';
        }
        $user->save();
        Kohana_Auth_ORM::instance()->force_login($user);
        $this->request->redirect("/");
    }
    
    public function action_confirmemail ()
    {
        $token_token = @$_GET['token'];
        $user_id = (int)@$_GET["user_id"];
        $user = new Model_User();
        $user->find($user_id);
        if (!$user->loaded()) {
            $this->request->redirect("/profile/register");
            return;
        }
        $token = $user->user_tokens->where('token', '=', $token_token)->find();
        if (!$token->loaded()) {
            $this->request->redirect("/profile/register");
            return;
        }
        $token->delete();
        if ($user->new_email) {
            $user->email = $user->new_email;
            $user->new_email = '';
        }
        $user->status = Model_User::STATUS_USER;
        $user->save();
        Kohana_Auth_ORM::instance()->force_login($user);
        $redirect = $user->referrer;
        if ($redirect) { 
            preg_match('@^(?:https?://)?([^/]+)@i',
                $redirect, $matches);
            if (isset($matches[1])) {
                $host = $matches[1];
                if ($host != DOMAIN_NAME && $host!='www.'.DOMAIN_NAME) {
                    $redirect = "/";
                }
            }
        }
        if (!$redirect) 
            $redirect = "/";
        $this->request->redirect($redirect);
    }
    
    public function action_uploadPhoto()
    {
        if (!$this->auth_user) {
            throw new Exception_403();
            return;
        }
        $file = $_FILES["file"];
        $allowedTypes = array("image/gif", "image/png", "image/jpeg", "image/pjpeg");
        if ($file["error"] > 0) {
            $this->request->redirect("/profile");
            return;
        }
        if ((in_array($file["type"],$allowedTypes)) && ($file["size"] < self::MAX_PHOTO_SIZE)) {
            $tempPath = DOCROOT."photos/temp/".$this->auth_user->id;
            $realPath = DOCROOT."photos/".$this->auth_user->id;
            move_uploaded_file($file["tmp_name"], $tempPath);
            chmod($tempPath,0777);
            $image = Image::factory($tempPath);
            $sizes = array(200,100,35,24);
            foreach ($sizes as $size) {
                $image->resize($size,$size,Image::AUTO);
                $image->save($realPath."_".$size.".jpg");
                chmod($realPath."_".$size.".jpg",0777);
            }
            unlink($tempPath);
            $this->auth_user->photo_ver = time();
            $this->auth_user->save();
            $this->request->redirect("/profile");
            return;
        } else {
            $this->request->redirect("/profile");
            return;
        }
    }
    
    public function action_edit()
    {
        if (!$this->auth_user) {
            throw new Exception_403();
            return;
        }
        if ($this->is_json) {
            $errors = array();
            $userName = trim($this->p("profile_username"));
            $email = trim($this->p("profile_email"));
            
            $newEmail = ($this->auth_user->email != $email);
            $newUserName = ($this->auth_user->username != $userName);
            if (!$newEmail && !$newUserName) {
                $this->json_status = 2;
                return;
            }
            
            if ($newEmail && !Validate::email($email)) {
                $errors[] = array("email","Не правильно указан email адрес");
            }
            if ($userName == '') {
                $errors[] = array("username","Не указано имя");
            }
            if (empty($errors)) {
                if ($newUserName) {
                    $this->auth_user->username = $userName;
                }
                if ($newEmail) {
                    if ($this->auth_user->unique_key_exists($email,'email')) {
                        $errors[] = array("email","Такой адрес уже зарегистрирован.");
                    } else {
                        try {
                            $token = new Model_User_Token();
                            $token->user_id = $this->auth_user->id;
                            $token->expires = time()+60*60*48;
                            $token_id = $token->save();
                            if ($token->saved()) {
                                //$mailer = new Mailer_Register();
                                $link = Route::url('default',array('controller'=>'profile','action'=>'confirmemail'), true)
                                    ."?user_id=".$this->auth_user->id."&token="
                                    .$token->token;
                                //$mailer->welcome($user, $link);
                                Mailer::factory('profile')->send_changeemail(array('user'=>$this->auth_user, 'link'=>$link));
                                //$mailer->send();
                                if (Helper_Common::isOurIp()) {
                                    $this->json_data['success'] = $link;
                                }
                            } else {
                                throw new Exception();
                            }
                        } catch (Exception $e) {
                            $errors[] = array('error',$e->getMessage());//"Произошла ошибка, приносим свои извинения.");
                        }
                    }
                }
            }
            if (empty($errors)) {
                $this->auth_user->save();
                $this->json_status = 1;
            } else {
                $this->json_status = 0;
                $this->json_data = $errors;
            }
        }
        //$this->request->redirect("/profile");
    }
    
    public function action_changepassword()
    {
        if (!$this->auth_user) {
            throw new Exception_403();
            return;
        }
        if ($this->is_json) {
            $errors = array();
            //$oldPass = trim($this->p("profile_oldpassword"));
            $newPass = trim($this->p("profile_newpassword"));
            $newPassCheck = trim($this->p("profile_newpasswordcheck"));
            
            if (!$newPass) {
                $this->json_status = 2;
                return;
            }
            
            
            //if ($oldPass != $this->auth_user->password) {
                //$errors[] = array("oldpassword","Старый пароль введен не верно.");
            //}
            
            if ($newPass != $newPassCheck) {
                $errors[] = array("newpasswordcheck","Повторный пароль введен не правильно.");
            }
            if (empty($errors)) {
                try {
                    $this->auth_user->new_password = $newPass;
                    //
                    // ALTER TABLE `users` ADD COLUMN `new_password`  char(100) NOT NULL DEFAULT '' AFTER `photo_ver`;
                    // dc7e7422e3df80567b7a6ec2fbd59e7d32e1dcaee388316d3d

                    //Mailer::factory('profile')->send_changepassword(array('user'=>$this->auth_user,'password'=>$newPass));
                    $token = new Model_User_Token();
                    $token->user_id = $this->auth_user->id;
                    $token->expires = time()+60*60*48;
                    $token_id = $token->save();
                    if ($token->saved()) {
                        $link = Route::url('default',array('controller'=>'profile','action'=>'confirmchangepassword'), true)
                            ."?user_id=".$this->auth_user->id."&token="
                            .$token->token;
                        Mailer::factory('profile')->send_changepassword(array('user'=>$this->auth_user, 'link'=>$link, 'password'=>$newPass));
                    } else {
                        throw new Exception('test');
                    }
                } catch (Exception $e) {
                    $errors[] = array('error',$e->getMessage());//"Произошла ошибка, приносим свои извинения.");
                }
            }
            if (empty($errors)) {
                $this->auth_user->save();
                $this->json_status = 1;
            } else {
                $this->json_status = 0;
                $this->json_data = $errors;
            }
        }
        //$this->request->redirect("/profile");
    }

    public function action_testmail()
    {
        try {
            Mailer::factory('register')->send_test();
        } catch (Exception $e) {
            die;
        }
    }
}
