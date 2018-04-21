<?php defined('SYSPATH') or die('No direct script access.'); ?>

2014-06-17 23:05:40 --- ERROR: ErrorException [ 8192 ]: mysql_escape_string(): This function is deprecated; use mysql_real_escape_string() instead. ~ APPPATH\classes\controller\constructor\file.php [ 157 ]
2014-06-17 23:12:33 --- ERROR: ErrorException [ 8192 ]: mysql_escape_string(): This function is deprecated; use mysql_real_escape_string() instead. ~ APPPATH\classes\controller\constructor\file.php [ 157 ]
2014-06-17 23:13:31 --- ERROR: Database_Exception [ 1064 ]: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '`) 
                VALUES ('80', '10', -498, -401, -2, '', 0.000000, 0.000000,' at line 1 [ INSERT INTO `c_files_settings` (`file_id`, `editor_id`, `x`, `y`, `zoom`, `keys_filter`, `keys_min_bound`, `keys_max_bound`, `keys_filter_enabled`, keys_sort`) 
                VALUES ('80', '10', -498, -401, -2, '', 0.000000, 0.000000, 0, 0)
                ON DUPLICATE KEY UPDATE `x` = -498, `y` = -401, `zoom` = -2, `keys_filter` = '', `keys_min_bound` = 0.000000, `keys_max_bound` = 0.000000, `keys_filter_enabled` = 0, `keys_sort` = 0 ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]
2014-06-17 23:53:37 --- ERROR: ErrorException [ 8 ]: Undefined index: keysMaxBound ~ APPPATH\classes\controller\constructor\file.php [ 159 ]