<?php
class Controller_Admin_Utils extends Controller_Admin
{
    public function action_texttoutf()
    {
        $sql = 'SELECT * FROM `texts`';
        $rows = DB::query(Database::SELECT, $sql)->execute()->as_array();
        foreach($rows as $row){
            $row['text'] = iconv('cp1251', 'utf8', $row['text']);
            $sqlUpdate = 'UPDATE `texts` set `text` = :text WHERE id = :id';
            DB::query(Database::UPDATE, $sqlUpdate)->parameters(array(':id' => $row['id'], ':text' => $row['text']))->execute();
        }
        echo 'ok';
        exit;
    }
    
    public function action_convertcrc()
    {
        $sql = 'SELECT * FROM `tags`';
        $rows = DB::query(Database::SELECT, $sql)->execute()->as_array();
        foreach($rows as $row){
            $sqlUpdate = 'UPDATE `tags` SET `crc` = :crc WHERE `id` = :id';
            $crc = sprintf("%u",crc32(mb_strtolower(trim($row['name']))));
            DB::query(Database::UPDATE, $sqlUpdate)->parameters(array(':crc' => $crc, ':id' => $row['id']))->execute();
        }
        echo 'ok';
        exit;
    }
    
    /**
    * Do not remove. Function in use in admin panel (tags)
    * 
    */
    public function action_tagsrecalcfiles()
    {
        $tagsArray = array();
        $allTags = Constructor_Dao_Tag::getAllTags();
        foreach($allTags as $_tag){
            $tagsArray[$_tag['crc']] = $_tag['id'];
        }
        
        $allFiles = Constructor_Dao_File::get_by_name('');
        /**
        * @var Constructor_Dao_File
        */
        $file;
        
        $sqlDelete = 'DELETE FROM `'.Constructor_Dao_Tag::$_tableItems.'` WHERE `item_type` = "'.Constructor_Dao_Tag::ITEM_TYPE_FILE.'"';
        DB::query(Database::DELETE, $sqlDelete)->execute();
        
        foreach($allFiles as $file){
            $tagsToAssign = array();
            $parts = explode('.', $file->title);
            $prevTagId = 0;
            foreach($parts as $part){
                $crc = sprintf("%u",crc32(mb_strtolower(trim($part))));
                if (array_key_exists($crc, $tagsArray)){
                    $tagId = $tagsArray[$crc];
                    $tag = Constructor_Dao_Tag::get_by_id($tagId);
                    if ($tag->parent_tag_id == $prevTagId){
                        $tagsToAssign[] = $tag->id;
                        $prevTagId = $tag->id;
                    }
                }
            }
            if (!empty($tagsToAssign)){
                Constructor_Dao_Tag::removeAllTagsFromItem($file->uid, Constructor_Dao_Tag::ITEM_TYPE_FILE);
                foreach($tagsToAssign as $_tagId){
                    Constructor_Dao_Tag::addTagToItem($file->uid, Constructor_Dao_Tag::ITEM_TYPE_FILE, $_tagId);
                }
            }
        }
        // all ok
        $this->json_data = array('result' => true);
    }
}