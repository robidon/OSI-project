<?php
class Constructor_Service_File {
    const EDITOR_TYPE_USER = 1; // тип - юзер
    const EDITOR_TYPE_USER_GROUP = 2; // тип - группа юзеров
    
    const PUBLISH_LEVEL_NONE = 0; // Только для избранных
    const PUBLISH_LEVEL_ANY = 1; // Для всех - и в поиске тоже
    //const PUBLISH_LEVEL_LINK = 2; // Для тех, у кого есть ссылка - пока не нужно
    
    // битовая маска доступа
    const ACCESS_LEVEL_FORBIDDEN = 0; // Нет доступа
    const ACCESS_LEVEL_READ = 1; // Доступ на чтение
    const ACCESS_LEVEL_EDIT = 2; // Доступ на редактирование файла
    const ACCESS_LEVEL_COMMENT = 4; // Доступ на комментирование
    const ACCESS_LEVEL_ADMIN = 8; // Доступ на копирование нод из файла
    const ACCESS_LEVEL_COPY = 16; // Доступ на копирование файла
    const ACCESS_LEVEL_COPY_NODES = 32; // Доступ на копирование нод из файла
    
    public static function get_access_list() {
        return array(
            //Constructor_Service_File::ACCESS_LEVEL_FORBIDDEN => 'Нет доступа',
            Constructor_Service_File::ACCESS_LEVEL_READ => array(
                'title'=>'Просмотр',
                'name'=>'read',
            ),
            Constructor_Service_File::ACCESS_LEVEL_COMMENT => array(
                'title'=>'Коментирование',
                'name'=>'comment',
            ),
            Constructor_Service_File::ACCESS_LEVEL_COPY => array(
                'title'=>'Копирование файла',
                'name'=>'copy',
            ),
            Constructor_Service_File::ACCESS_LEVEL_COPY_NODES => array(
                'title'=>'Копирование нод',
                'name'=>'copy_nodes',
            ),
            Constructor_Service_File::ACCESS_LEVEL_EDIT => array(
                'title'=>'Изменение',
                'name'=>'edit',
            ),
            Constructor_Service_File::ACCESS_LEVEL_ADMIN => array(
                'title'=>'Администрирование',
                'name'=>'admin',
            ),
        );
    }
    
    /**
    * Проверка, может ли юзер редактировать файл
    * 
    * @param Constructor_Dao_File $file
    * @param Model_User $user
    */
    public static function get_user_access($file, $user) {
        // редактор - юзер может всё
        if ($file->editor_type == Constructor_Service_File::EDITOR_TYPE_USER) {
            if ($user->id == $file->editor_id) {
                return self::ACCESS_LEVEL_READ
                    | self::ACCESS_LEVEL_EDIT
                    | self::ACCESS_LEVEL_COMMENT
                    | self::ACCESS_LEVEL_COPY
                    | self::ACCESS_LEVEL_COPY_NODES
                    | self::ACCESS_LEVEL_ADMIN;
            }
        }
        
        $userAccess = self::get_user_permissions($file, $user);
        if ($userAccess) return $userAccess;
        
        return $file->published_access;
    }
    
    private static function get_user_permissions($file, $user) {
        $sql = "SELECT * FROM `c_files_access` WHERE `editor_type`=".Constructor_Service_File::EDITOR_TYPE_USER." AND `editor_id` = ".intval($user->id)." AND `file_uid` = ".intval($file->uid);
        $res = DB::query(Database::SELECT,
            $sql)
            ->execute()
            ->as_array();
        if (!$res) 
            return self::ACCESS_LEVEL_FORBIDDEN;
        $res = reset($res);
        return $res['access_level'];
    }
    
    public static function get_file_access($file) {
        $sql = "SELECT * FROM `c_files_access` WHERE `file_uid` = ".intval($file->uid);
        $res = DB::query(Database::SELECT,
            $sql)
            ->execute()
            ->as_array();
        return $res;
    }
    
    public static function add_file_access($fileUid, $editors, $accessLevel) {
        if (!$editors) return;
        $sql = "INSERT INTO `c_files_access` (`file_uid`,`editor_type`,`editor_id`,`access_level`) VALUES ";
        $comma = '';
        foreach ($editors as $editor) {
            $sql .= $comma."(".intval($fileUid).",".intval($editor['type']).",".intval($editor['id']).",".intval($accessLevel).")";
            $comma = ',';
        }
        $sql .= " ON DUPLICATE KEY UPDATE `access_level` = VALUES(`access_level`)";
        $res = DB::query(Database::INSERT, $sql)->execute();
        return $res;
    }
    
    public static function remove_file_access($fileUid, $editor) {
        if (!$editor) return;
        $sql = "DELETE FROM `c_files_access` WHERE `file_uid` = ".intval($fileUid)." AND `editor_id` = ".intval($editor['id'])." AND `editor_type` = ".intval($editor['type']).";";
        $res = DB::query(Database::DELETE, $sql)->execute();
        return $res;
    }
    
    public static function parse_access_list($accessList) {
        $arr = array();
        foreach ($accessList as $accessItem) {
            if ($accessItem['editor_type'] == Constructor_Service_File::EDITOR_TYPE_USER_GROUP) continue;
            $user = new Model_User($accessItem['editor_id']);
            if (!$user) continue;
            $arr[] = array(
                'user_id'=>$user->id,
                'user_name'=>$user->username,
                'user_ava'=>$user->get_photo(24),
                'access'=>Constructor_Service_File::parse_access_level($accessItem['access_level']),
            );
        }
        return $arr;
    }
    
    public static function parse_access_level($accessLevel) {
        return array(
            'read'=> ($accessLevel & Constructor_Service_File::ACCESS_LEVEL_READ) ? 1 : 0,
            'comment'=>($accessLevel & Constructor_Service_File::ACCESS_LEVEL_COMMENT) ? 1 : 0,
            'edit'=>($accessLevel & Constructor_Service_File::ACCESS_LEVEL_EDIT) ? 1 : 0,
            'admin'=>($accessLevel & Constructor_Service_File::ACCESS_LEVEL_ADMIN) ? 1 : 0,
            'copy'=>($accessLevel & Constructor_Service_File::ACCESS_LEVEL_COPY) ? 1 : 0,
            'copy_nodes'=>($accessLevel & Constructor_Service_File::ACCESS_LEVEL_COPY_NODES) ? 1 : 0,
        );
    }
    
    public static function combine_access_level($accessArray) {
        return Constructor_Service_File::ACCESS_LEVEL_FORBIDDEN |
            ($accessArray['read']==1 ? Constructor_Service_File::ACCESS_LEVEL_READ : 0) |
            ($accessArray['comment']==1 ? Constructor_Service_File::ACCESS_LEVEL_COMMENT : 0) |
            ($accessArray['edit']==1 ? Constructor_Service_File::ACCESS_LEVEL_EDIT : 0) |
            ($accessArray['admin']==1 ? Constructor_Service_File::ACCESS_LEVEL_ADMIN : 0) |
            ($accessArray['copy']==1 ? Constructor_Service_File::ACCESS_LEVEL_COPY : 0) |
            ($accessArray['copy_nodes']==1 ? Constructor_Service_File::ACCESS_LEVEL_COPY_NODES : 0);
    }
    
    public static function get_latest_comments($fileUid, $limit = 0) {
        $file = Constructor_Dao_File::get_by_uid($fileUid);
        $nodes = $file->get_nodes();
        $ids = array();
        foreach ($nodes as $node) {
            $ids[] = $node->id;
        }
        if (!$ids) return array();
        $threads = Model_Dao_Thread::get_by_subjects(Service_Subject::TYPE_POST,$ids);
        $results = array();
        if (!$limit) $limit = count($threads);
        foreach ($threads as $thread) {
            if ($limit<=0) break;
            $post = $thread->get_posts(1,0);
            if (!$post) continue;
            $post = reset($post);
            /** @var $author Model_User */
            $author = $post->get_author();
            $results[] = array(
                'node_id'=>$thread->subject_id,
                'post'=>array(
                    'textShow'=>$post->textShow,
                    'thread_id'=>$post->thread_id,
                    'author_id'=>$post->author_id,
                    'date'=>Helper_String::human_date(strtotime($post->date)),
                    'id'=>$post->id,
                    'author_name'=>$author->username,
                    'author_profile_url'=>$author->get_profile_url(),
                )
            );
            $limit--;
        }
        return $results;
    }
}
?>
