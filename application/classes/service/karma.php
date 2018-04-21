<?php
class Service_Karma {
    
    const VOTE_TIMEOUT = 5;
    
    static public $reasons = array(
        1=>array('points'=>-1,'title'=>'пустословие'),
        2=>array('points'=>-1,'title'=>'ложный факт'),
        3=>array('points'=>-1,'title'=>'не по теме'),
        4=>array('points'=>-1,'title'=>'повторение'),
        5=>array('points'=>-1,'title'=>'мог бы и попроще написать'),
        6=>array('points'=>1,'title'=>'новая идея'),
        7=>array('points'=>1,'title'=>'опровержение факта'),
        8=>array('points'=>1,'title'=>'развитие идеи'),
    );
    
    /**
    * Добавить или убавить карму юзеру от юзера
    * 
    * @param Model_User $from_user
    * @param Model_User $to_user
    * @param int $points
    * @param int $reason
    * @param int $subject_type
    * @param int $subject_id
    * @param string $reason_string
    */
    static public function vote_user($from_user, $to_user, $points, $reason, $subject_type, $subject_id, $reason_string = '') {
        $time = time();
        if ($time - $from_user->last_vote < self::VOTE_TIMEOUT) return false;
        
        $from_user->last_vote = $time;
        $from_user->save();
        
        $to_user->karma += $points;
        $to_user->save();
        
        $vote = new Model_Dao_Vote();
        $vote->from_user_id = $from_user->id;
        $vote->subject_type = $subject_type;
        $vote->subject_id = $subject_id;
        $vote->date = time();
        $vote->to_user_id = $to_user->id;
        $vote->reason = $reason;
        $vote->points = $points;
        $vote->save();
    }
}