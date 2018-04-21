<?php defined('SYSPATH') or die('No direct script access.');

class Controller_Welcome extends Controller_Website {
	public function action_index()
	{
        //$db = new DB('default');
        
        //$data = $db->query(Database::SELECT,'SELECT * FROM user');
		//$data->execute();
        
        $this->request->response = 'hello, world!';
	}

} // End Welcome
