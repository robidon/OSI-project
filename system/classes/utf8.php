<?php defined('SYSPATH') or die('No direct script access.');

class UTF8 extends Kohana_UTF8 {
    
    static public function array_to_utf(&$arr)
    {
        if (!is_array($arr)) {
            $arr = iconv("cp1251","utf-8",$arr);
            return $arr;
        }
        foreach ($arr as $key=>$item) {
            self::array_to_utf($arr[$key]);// = ($item);
        }
        return $arr;
    }

    static public function array_from_utf(&$arr)
    {
        if (!is_array($arr)) {
            $arr = iconv("utf-8","cp1251",$arr);
            return $arr;
        }
        foreach ($arr as $key=>$item) {
            self::array_from_utf($arr[$key]);// = ($item);
        }
        return $arr;
    }
}
