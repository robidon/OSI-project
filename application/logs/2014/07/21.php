<?php defined('SYSPATH') or die('No direct script access.'); ?>

2014-07-21 23:45:16 --- ERROR: Database_Exception [ 1364 ]: Field 'full_desc' doesn't have a default value [ INSERT INTO `c_nodes` (id, formula, x, y) VALUES (2539,'',147,201),(28524,'',77,169) ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y) ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]