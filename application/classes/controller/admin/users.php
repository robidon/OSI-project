<?php
class Controller_Admin_Users extends Controller_Admin
{
    public function action_index()
    {
        $page = (int)$this->p('page',0);
        $perPage = 50;
        $users = ORM::factory('user')->limit($perPage)->offset($page * $perPage)->find_all();
        $users_count = ORM::factory('user')->count_all();
        $this->view->set('users',$users);
        $this->view->set('users_count',$users_count);
        $this->view->set('page', $page);
        $this->tpl = 'admin/users';
    }
    
    public function action_save()
    {
        $userId = (int)$this->p('item');
        $user = ORM::factory('user')->find($userId);
        if (!$user) {
            $this->json_status = 'error';
            return;
        }
        $data = $this->p('data');
        $user->username = $data['username'];
        $user->email = $data['email'];
        $user->status = $data['status'];
        $user->karma = $data['karma'];
        $user->save();
        $this->json_status = 'ok';
    }
    public function action_remove() {
        $userId = (int)$this->p('item');
        $user = ORM::factory('user')->find($userId);
        if (!$user) {
            $this->json_status = 'error';
            return;
        }
        $user->delete();
        $this->json_status = 'ok';
    }
}
?>
