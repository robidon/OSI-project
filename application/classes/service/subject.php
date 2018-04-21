<?php
class Service_Subject {
    const TYPE_TEXT = 1;
    const TYPE_POST = 2;
    
    static private $_types = array();
    static public function get_type_name($type)
    {
        if (!self::$_types) {
            self::$_types = array(
                self::TYPE_POST=>'Пост',
                self::TYPE_TEXT=>'Материал',
            );
        };
        return self::$_types[$type];
    }
    
    static public function get_subject_link($type, $id) {
        switch ($type) {
            case self::TYPE_POST:
                $post = Model_Dao_Post::get_by_id($id);
                if (!$post) return '/';
                $thread = $post->get_thread();
                return self::get_subject_link($thread->subject_type, $thread->subject_id);
                break;
            case self::TYPE_TEXT:
                $text = Model_Dao_Text::get_by_crc($id);
                if ($text) {
                    if ($text->location) return $text->location;
                    return '/article/'.$text->name;
                } else {
                    return '/';
                }
        }
    }
}
