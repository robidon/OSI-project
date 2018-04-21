<?php
class Helper_Text {
    /**
    * Получает текст из бд.
    * 
    * @param String $name
    */
    static public function get_text($name)
    {
        $txt = Model_Dao_Text::by_name($name);
        if ($txt) {
            $text = $txt->text;
            $id = $txt->id;
        } else {
            $text = 'Содержимое редактируется.';
            $id = 0;
        }
        $edit = false;
        $modified = false;
        $auth_user = Auth::instance()->get_user();
        if ($auth_user && $auth_user->loaded() && $auth_user->status == Model_User::STATUS_ADMIN) {
            $edit = true;
            $edittxt = Model_Dao_Text::by_name($name,0);
            if ($edittxt) {
                $text = $edittxt->text;
                $id = $edittxt->id;
                $modified = true;
                $author = $edittxt->get_author();
                $title = 'Редактируется пользователем <strong>'.$author->username.'</strong>';
            } else {
                if ($txt) {
                    $author = $txt->get_author();
                    $title = 'Последняя публикация: '.Helper_String::human_date(strtotime($txt->date_modified)).' (<strong>'.$author->username.'</strong>)';
                } else {
                    $title = 'Новый текст';
                }
                
            }
            return "<div notice='".$title."' class='edit_text".(($modified)?" modified":"")."' rel='".$id."' name='".$name."' value=\"".htmlspecialchars($text)."\"><div class='edit_content'>".$text."</div></div>";
        }
        return "<div>".$text."</div>";
    }
    static public function get_thread($text_name)
    {
        $crc = crc32($text_name);
        $threads = Model_Dao_Thread::get_by_subject(Service_Subject::TYPE_TEXT,$crc);
        $view = new View('forum/threads');
        $view->set('auth_user',Auth::instance()->get_user());
        $view->set('threads',$threads);
        $view->set('subject_type',Service_Subject::TYPE_TEXT);
        $view->set('subject_id',$crc);
        $view->set('readonly',Auth::instance()->get_user() ? true : false);
        return $view->render();
    }
}
