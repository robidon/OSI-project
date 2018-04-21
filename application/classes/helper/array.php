<?php
class Helper_Array {
    static public function wrap(&$arr,$before,$after) {
        foreach ($arr as &$item) {
            $item = $before.$item.$after;
        }
        return $arr;
    }
    static public function intval(&$arr) {
        foreach ($arr as &$item) {
            $item = intval($item);
        }
        return $arr;
    }
    static public function floatval(&$arr) {
        foreach ($arr as &$item) {
            $item = floatval($item);
        }
        return $arr;
    }
    static public function floatkeyval(&$arr) {
        $newarr = array();
        foreach ($arr as $key=>$value) {
            $newarr[floatval($key)] = floatval($value);
        }
        $arr = $newarr;
        return $newarr;
    }
    static public function strkeyval(&$arr) {
        $newarr = array();
        foreach ($arr as $key=>$value) {
            $newarr[strval($key)] = strval($value);
        }
        $arr = $newarr;
        return $newarr;
    }
}
?>
