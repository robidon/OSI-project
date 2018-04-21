<?php
class Constructor_Service_Search
{
    public static function searchOperators($query)
    {
        $operators = array();
        $operatorIds = Constructor_Dao_File::searchOperatorIds($query);
        
        if (!empty($operatorIds)){
            foreach($operatorIds as $id){
                $operators[$id] = Constructor_Dao_File::get_by_id($id);
            }
        }
        return $operators;
    }
}
