<?
/**
* Пока-что просто описывает предполагаемый формат выдачи данных в отчет.
*/
class Constructor_Model_Report
{
    public $name = '';
    const DATA_TYPE_SCALAR = 0;
    const DATA_TYPE_VECTOR = 1;
    /**
    * конфиг отчета. какие данные из каких нод в файлах брать.
    * 
    * @var array
    */                                  
    public $config = array(
        'results'=>array(// названия конечных тегов нод для конкретных значений
            'potential'=>array(
                'type'=>self::DATA_TYPE_SCALAR,
                'title'=>'Потенциал роста',
                'variations'=>array('POTENTIAL'),// в массиве перечисляются возможные варианты
            ),
            'p/e'=>array(
                'type'=>self::DATA_TYPE_VECTOR,
                'title'=>'P/E',
                'variations'=>array('P/E'),
            ),
            'ev/ebitda'=>array(
                'type'=>self::DATA_TYPE_VECTOR,
                'title'=>'EV/EBITDA',
                'variations'=>array('EV/EBITDA'),
            ),
            'fair_price'=>array(
                'type'=>self::DATA_TYPE_SCALAR,
                'title'=>'Справедливая цена',
                'variations'=>array('FAIR PRICE'),// в массиве перечисляются возможные варианты
            ),
        )
    );
    public function __construct($reportName) {
        $this->name = $reportName;
    }
    /**
    * возвращает просто структуру тегов для фильтрации
    */
    public function getFilters()
    {
        $tags = Constructor_Dao_Tag::get_by_namespace(Constructor_Dao_Namespace::ID_ACTIONS);
        if (!count($tags)) return array();
        $children = array();
        foreach ($tags as $tag) {
            /** @var $tag Constructor_Dao_Tag */
            if (!isset($children[$tag->parent_tag_id])) {
                $children[$tag->parent_tag_id] = array($tag);
            } else {
                $children[$tag->parent_tag_id][] = $tag;
            }
        }
        function createTree(&$list, $parentId) {
            $tree = array();
            foreach ($list[$parentId] as $k=>$l){
                if(isset($list[$l->id])){
                    $l->children = createTree($list, $l->id);
                }
                $tree[] = $l;
            } 
            return $tree;
        }
        $tree = createTree($children, 0);
        return $tree;
    }
    
    /**
    * Возвращает один ряд данных по одной компании (файлу)
    * 
    * @param mixed $file
    * @return mixed
    */
    public function getRow($file)
    {
        $nodes = $file->get_nodes();
        $results = array();
        foreach ($nodes as $node) {
            /** @var $node Constructor_Dao_Node */
            foreach ($this->config['results'] as $resultName=>$resultFormat) { // ищем, есть ли в файле нужный результат
                if (isset($results[$resultName])) continue; // только первый попавшийся вариант выводится
                foreach ($resultFormat['variations'] as $tagName) { // ищем совпадения с каждым вариантом написания тега
                    if (mb_strtolower($node->name) == mb_strtolower($tagName)) {
                        try{
                            $nodeResults = $node->get_data();//calc();
                        }catch(Exception $e){
                            $nodeResults = false;
                        }
                        if ($nodeResults) {
                            if ($resultFormat['type'] == self::DATA_TYPE_SCALAR) {
                                $results[$resultName] = reset($nodeResults);
                            } else {
                                $results[$resultName] = $nodeResults;
                            }
                        }
                    }
                }
            }
        }
        
        $author = array();
        if ($file->editor_type == Constructor_Service_File::EDITOR_TYPE_USER) {
            $user = new Model_User($file->editor_id);
            $author['id'] = $user->id;
            $author['name'] = $user->username;
            $author['rating'] = $user->karma;
        }
        $team = array(
            'id'=>0,
            'name'=>'Тройка диалог',
            'rating'=>52,
        );
        return array(
            'file_uid'=>$file->uid,// рассчетный файл, из которого приходят все эти параметры
            'file_id'=>$file->id,// рассчетный файл, из которого приходят все эти параметры
            'title'=>$file->title,// тег - признак оцениваемой компании в наименовании файла
            'current_price'=>1200, // рассчитывается отдельно сейчас надо просто захардкодить
            'results'=>$results,
            'author'=>$author,
            'team'=>$team,
            'update_time'=>$file->date_modified,
        );
    }
    
    /**
    * Структурированный результат - таблица рейтинга компаний
    * 
    * @param string $filter - начало названия файла
    * @param mixed $sort - по каким полям и как сортировать. пока не используется
    * @return mixed
    */
    public function getData($filter = '', $osiEditors = false, $sort = array())
    {
        $files = Constructor_Dao_File::get_by_name($filter);
        $results = array();
        if ($osiEditors){
            $fileIdsAllow = Constructor_Dao_File::getReportFiles(Constructor_Dao_File::ROOT_USER_ID);
        }
        foreach ($files as $file) {
            if ($osiEditors){
                if (!in_array($file->uid, $fileIdsAllow)) continue;
            }
            $results[] = $this->getRow($file);
        }
        return $results;
    }
    
    static private function sortDataByPotential($a,$b) {
        if (!isset($a['results']['potential'])) {
            if (!isset($b['results']['potential'])) {
                return 0;
            } else {
                return 1;
            }
        } else if (!isset($b['results']['potential'])) {
            return -1;
        }
        $a = $a['results']['potential'];
        $b = $b['results']['potential'];
        return $a == $b ? 0 : $a < $b ? 1 : -1;
    }
    
    public function getDataByTag($tagId = false, $osiEditors = false)
    {
        $results = array();
        if (!$tagId || empty($tagId)){
            $results = $this->getData('', $osiEditors);
        }else{
            $fileIds = array();
            foreach($tagId as $_tagId){
                $tag = Constructor_Dao_Tag::get_by_id($_tagId);
                $_fileIds = $tag->getElementsByType(Constructor_Dao_Tag::ITEM_TYPE_FILE);
                $fileIds = array_merge($fileIds, $_fileIds);
            }
            $fileIds = array_unique($fileIds);
            if ($osiEditors){
                $fileIdsAllow = Constructor_Dao_File::getReportFiles(Constructor_Dao_File::ROOT_USER_ID);
            }
            
            foreach($fileIds as $fileId){
                if ($osiEditors){
                    if (!in_array($fileId, $fileIdsAllow)) continue;
                }
                $file = Constructor_Dao_File::get_by_uid($fileId);
                if (!$file->published) continue;
                if (!$file) continue;
                $results[] = $this->getRow($file);
            }
        }
        usort($results,array("Constructor_Model_Report", "sortDataByPotential"));
        return $results;
    }
}
?>

