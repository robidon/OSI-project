<?php defined('SYSPATH') or die('No direct script access.');
 
class Controller_Error extends Controller_Website {
 
    public function action_404()
    {
        $this->request->status = 404;
        $this->request->headers['HTTP/1.1'] = '404';
        $this->tpl = 'error/404';
    }
 
    public function action_403()
    {
        $this->request->status = 403;
        $this->request->headers['HTTP/1.1'] = '403';
        if (!$this->auth_user) {
            $this->request->redirect('/profile/register?referrer='.urlencode($_SERVER['PATH_INFO']));
        } else {
            $this->request->redirect('/');
        }
        //$this->tpl = 'error/500';
    }
 
    public function action_500()
    {
        $this->request->status = 500;
        $this->request->headers['HTTP/1.1'] = '500';
        $this->tpl = 'error/500';
    }
} // End Error