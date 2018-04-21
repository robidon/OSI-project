<?php
class Helper_Menu {
    public static function render($menu = 1, $template = 'default') {
        $auth_user = Auth::instance()->get_user();
        $db = Database::instance();
        $min_menu_visibility = ($auth_user)?$auth_user->status:0;
        $items = Model_Dao_Menu::get_visible($menu, $min_menu_visibility);
        $view = new View('layouts/menu/'.$template);
        $view->set('items',$items);
        $view->set('auth_user',Auth::instance()->get_user());
        return $view->render();
    }
}
?>
