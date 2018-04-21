<?php
class Constructor_Service_Base {
    
    static public function nodeAsJSON($node,$data,$connections) {
        return array(
            'id'=>$node->id,
            'name'=>$node->name,
            'type'=>$node->type,
            'operator_uid'=>$node->operator_uid,
            'description'=>$node->description,
            'formula'=>$node->formula,
            'position'=>$node->position,
            'x'=>$node->x,
            'y'=>$node->y,
            'connections' => isset($connections[$node->id])?$connections[$node->id]:array(),
            'data' => isset($data[$node->id]) ? $data[$node->id] : array(),
            'thread_id' => (!empty($node->thread)) ? $node->thread->id : 0,
            'style' => $node->style,
            'rotation' => $node->rotation,
            'full_desc'=> $node->full_desc,
            'date_modified'=>strtotime($node->date_modified),
        );
    }
    
    static public function groupAsJSON($group) {
        return array(
            'id'=>$group->id,
            'name'=>$group->name,
            'description'=>$group->description,
            'nodes'=>$group->nodeIds,
            'inner_groups'=>$group->innerGroupIds,
            'x'=>$group->x,
            'y'=>$group->y,
            'opened'=>$group->opened,
            'style'=>$group->style,
            'rotation'=>$group->rotation,
            'full_desc'=>$group->full_desc,
            'date_modified'=>strtotime($group->date_modified),
        );
    }
}  
?>
