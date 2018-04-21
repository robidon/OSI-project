<?php
class Helper_Html {
    static private $jsFiles = array();
    static private $cssFiles = array();
    static private $cssCode = '';
    static private $jsCode = '';
    static public function jsFile($fileName, $placeFirst = false)
    {
        if (!isset(self::$jsFiles[$fileName])) {
            self::$jsFiles[$fileName] = $placeFirst;
        }
    }
    static public function cssFile($fileName, $placeFirst = false)
    {
        if (!isset(self::$cssFiles[$fileName])) {
            self::$cssFiles[$fileName] = $placeFirst;
        }
    }
    static public function cssStart()
    {
        ob_start();
    }
    static public function cssEnd()
    {
        $css = ob_get_contents();
        ob_end_clean();
        self::$cssCode .= $css;
    }
    static public function jsStart()
    {
        ob_start();
    }
    static public function jsEnd()
    {
        $js = ob_get_contents();
        ob_end_clean();
        self::$jsCode .= preg_replace('/\<\/?script\>/','',$js);
    }
    static public function jsRender()
    {
        $str = '';
        foreach (self::$jsFiles as $fileName=>$placeFirst) {
            $fileLink = "<script language='javascript' src='".$fileName."'></script>\n";
            if ($placeFirst) {
                $str = $fileLink . $str;
            } else {
                $str = $str . $fileLink;
            }
        }
        if (self::$jsCode) {
            $str .= "<script language='javascript'><!--\n".self::$jsCode."\n//--></script>\n";
        }
        return $str;
    }
    static public function cssRender()
    {
        $str = '';
        foreach (self::$cssFiles as $fileName=>$placeFirst) {
            $fileLink = "<link rel='stylesheet' href='".$fileName."'/>\n";
            if ($placeFirst) {
                $str = $fileLink . $str;
            } else {
                $str = $str . $fileLink;
            }
        }
        if (self::$cssCode) {
            $str .= "<style><!\n".self::$cssCode."\n//--></style>\n";
        }
        return $str;
    }
    static public function keywordsAdd($keywords)
    {
        self::$keywords = array_merge($keywords);
    }
    static public function keywordsRender()
    {
        return '<meta name="Keywords" content="'.implode(',',self::$keywords).'"/>\n';
    }
}