<?php
class Helper_String
{
    /** 
    * Склонение существительных по числовому признаку
    *
    * @var integer    Число, по которому производится склонение
    * @var array    Массив форм существительного
    * @return string Существительное в нужной форме
    * 
    * Например:
    * $count = 10;
    * sprintf('%d %s', $count, declension($count, array('комментарий', 'комментария', 'комментариев')));
    *
    * Возвращает:
    * 10 комментариев
    */
    static public function declension($number, $words) {
        $number = abs($number);
        if ($number > 20) $number %= 10;
        if ($number == 1) return $words[0];
        if ($number >= 2 && $number <= 4) return $words[1];
        return $words[2];
    }
    
    /** 
    * Приводит дату к заданному формату с учетом русских названий месяцев
    *
    * В качестве параметров функция принимает все допустимые значения функции date(),
    * но символ F заменяется на русское название месяца (вне зависимости от локали),
    * а символ M — на русское название месяца в родительном падеже
    *
    * @var integer    Unix-timestamp времени 
    * @var string    Формат даты согласно спецификации для функции date() с учетом замены значения символов F и M
    * @var boolean    Флаг отсекания года, если он совпадает с текущим
    * @return string Отформатированная дата
    */
    static public function r_date($time = '', $format = 'j M Y в H:i', $cut_year = true) {
        if(empty($time)) $time = time();
        if($cut_year && date('Y') == date('Y', $time)) $format = preg_replace('/o|y|Y/', '', $format);
        $month = abs(date('n', $time)-1);
        $rus = array('янв', 'фев', 'мрт', 'апр', 'мая', 'июн', 'июл', 'авг', 'сент', 'окт', 'нбр', 'дек');
        $rus2 = array('янв', 'фев', 'мрт', 'апр', 'мая', 'июн', 'июл', 'авг', 'сент', 'окт', 'нбр', 'дек');
        $format = preg_replace(array("'M'", "'F'"), array($rus[$month], $rus2[$month]), $format);
        return date($format, $time);
    }


    /** 
    * Выводит дату в приблизительном удобочитаемом виде (например, "2 часа и 13 минут назад")
    *
    * @var integer    Unix-timestamp времени 
    * @var integer    Степень детализации
    * @var boolean    Флаг использования упрощенных названий (вчера, позавчера, послезавтра)
    * @var string    Формат даты с учетом замены значения символов F и M, если объявлена функция r_date()
    * @return string Отформатированная дата
    */
    static public function human_date($timestamp, $granularity = 1, $use_terms = true, $default_format = 'j M Y в H:i') {
        $curtime = time();
        $original = $timestamp;
        $output = '';
        if($curtime >= $original) {
            $timestamp = abs($curtime - $original);
            $tense = 'past';
        } else {
            $timestamp = abs($original - $curtime);
            $tense = 'future';
        }
        if ($timestamp < 86400) {
            $units = array('years' => 31536000,
                         'weeks' => 604800, 
                         'days' => 86400, 
                         'hours' => 3600, 
                         'min' => 60, 
                         'sec' => 1);
            $titles = array('years' => array('год', 'года', 'лет'),
                         'weeks' => array('неделю', 'недели', 'недель'), 
                         'days' => array('день', 'дня', 'дней'), 
                         'hours' => array('час', 'часа', 'часов'), 
                         'min' => array('минуту', 'минуты', 'минут'), 
                         'sec' => array('секунду', 'секунды', 'секунд'));
            foreach ($units as $key => $value) {
                if ($timestamp >= $value) {
                    $number = floor($timestamp / $value);
                    $output .= ($output ? ($granularity == 1 ? ' и ' : ' ') : '') . $number .' '. self::declension($number, $titles[$key]);
                    $timestamp %= $value;
                    $granularity--;
                    if ($granularity==0) break;
                }
            }
            if($tense == 'future') {
                $output = 'Через '.$output;
            } else {
                $output .= ' назад';
            }
            if($use_terms) {
                $terms = array('Через 1 день' => 'Послезавтра',
                             '1 день назад' => 'Вчера',
                             '2 дня назад' => 'Позавчера'
                             );
                if(isset($terms[$output])) $output = $terms[$output];
            }
        }
        return $output ? $output : self::r_date($original, $default_format);
    }
    
    /**
     * Cut string to n symbols and add delim but do not break words.
     *
     * Example:
     * <code>
     *  $string = 'this sentence is way too long';
     *  echo word_substr($string, 16);
     * </code>
     *
     * Output: 'this sentence is...'
     *
     * @access public
     * @param string string we are operating with
     * @param integer character count to cut to
     * @param string|NULL delimiter. Default: '...'
     * @return string processed string
     **/
    static public function word_substr($str, $n, $delim='...') {
       $len = strlen($str);
       if ($len > $n) {
           preg_match_all('/(.{' . $n . '}.*?)\b/', $str, $matches);
           return rtrim($matches[0]) . $delim;
       } else {
           return $str;
       }
    }
    
}

