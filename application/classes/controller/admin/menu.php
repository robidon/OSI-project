<?
class Controller_Admin_Menu extends Controller_Admin
{
    public function action_index()
    {
        $menu = Model_Dao_Menu::get_visible(0, 127);
        $this->view->set('menu', $menu);
        $this->tpl = "admin/menu";
    }
    
    public function action_saveitem()
    {
        $menuitem = Model_Dao_Menu::get_by_id($this->p('id'));
        $menuitem->title = $this->p('title');
        $menuitem->link = $this->p('link');
        //$menuitem->name = $this->p('name');
        $menuitem->tooltip = $this->p('tooltip');
        $menuitem->visibility = $this->p('visibility');
        $menuitem->more = $this->p('more');
        $menuitem->target = $this->p('target');
        $menuitem->parent = $this->p('parent');
        $menuitem->menu_id = $this->p('menu_id');
        $menuitem->order = $this->p('order');
        $menuitem->save();
        $this->json_status = 'ok';
    }
    public function action_removeitem()
    {
        $menuitem = Model_Dao_Menu::get_by_id($this->p('id'));
        $menuitem->delete();
        $this->json_status = 'ok';
    }
    public function action_saveorder()
    {
        foreach ($this->p('order') as $item) {
            list($menu_id, $item_id, $parent_id, $order) = $item;
            $menuItem = Model_Dao_Menu::get_by_id($item_id);
            $menuItem->menu_id = $menu_id;
            $menuItem->parent = $parent_id;
            $menuItem->order = $order;
            $menuItem->save();
        }
        $this->json_status = 'ok';
    }
    public function action_additem()
    {
        $data = $this->p('data');
        if (!isset($data['name'])) {
            $data['name'] = '';
        }
        $data['order'] = intval($data['order']);
        $newItem = new Model_Dao_Menu($data);
        $newItem->save();
        $this->json_status = 'ok';
    }
}