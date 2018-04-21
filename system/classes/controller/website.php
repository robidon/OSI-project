<?php defined('SYSPATH') or die('No direct script access.');

abstract class Controller_Website extends Controller {
    public $view;
    public $is_json = false;
    public $json_data = array();
    public $json_status = 1;
    public $tpl = '';
    public $layout = 'default';
    public $page_title = 'OSI-Project';
    /**
    * “екущий авторизованный пользователь
    * 
    * @var Model_User
    */
    public $auth_user = false;
    public function before()
    {
        parent::before();
        
        if (IN_SBOR) {
            $this->page_title = 'OpenSbor';
        }
        
        $this->auth_user = Auth::instance()->get_user();
        
        if (isset($_REQUEST['json']) && $_REQUEST['json']) {
            $this->is_json = true;
        }
        
        if (!$this->is_json) {
            $this->tpl = $this->request->controller."/".$this->request->action;
            $this->view = View::factory();
            $this->view->set('auth_user', $this->auth_user);
        }
    }    
    public function after()
    {
        parent::after();
        
        $response = '';
        
        if (!$this->is_json) {
            if ($this->tpl) {
                if ($this->layout) {
                    $layout = new View("layouts/".$this->layout);
                    $layout->set('page_title',$this->page_title);
                    $layout->set('auth_user',$this->auth_user);
                    $layout->set('content',$this->view->render($this->tpl));
                    $response = $layout->render();
                } else {
                    $this->view->set('page_title',$this->page_title);
                    $response = $this->view->render($this->tpl);
                }
            }
        } else {
            //UTF8::array_to_utf($this->json_data);
            $this->request->headers['Content-type'] = 'application/json';
            $response = json_encode(array('status'=>$this->json_status,'data'=>$this->json_data));
        }
        $profilerCookie = (array_key_exists('profiler_enabled', $_COOKIE) && (int)$_COOKIE['profiler_enabled'] >= 1) ? 1 : 0;
        $profilerIsOn = false;
        if ($profilerCookie && (!IN_PRODUCTION || Helper_Common::isOurIp())){
            $response .= '###PROFILER###'.View::factory('profiler/stats');
        }
        $this->request->response = $response;
    }
    
    public function p($param,$default = null)
    {
        if ($this->request->param($param,false)!==false) {
            return $this->request->param($param);
        }
        if (isset($_POST[$param])) {
            $var = $_POST[$param];
            return $var;
        }
        if (isset($_GET[$param])) {
            $var = $_GET[$param];
            return $var;
        }
        return $default;
    }
}
