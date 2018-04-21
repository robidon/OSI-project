<?php defined('SYSPATH') or die('No direct script access.'); ?>

2014-07-25 21:56:43 --- ERROR: Database_Exception [ 1364 ]: Field 'full_desc' doesn't have a default value [ INSERT INTO `c_nodes` (id, formula, x, y) VALUES (2549,'',157,447) ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y) ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]
2014-07-25 21:56:54 --- ERROR: ErrorException [ 8 ]: Undefined variable: group ~ APPPATH\classes\constructor\service\base.php [ 21 ]
2014-07-25 21:57:26 --- ERROR: Database_Exception [ 1364 ]: Field 'full_desc' doesn't have a default value [ INSERT INTO `c_nodes` (id, formula, x, y) VALUES (2549,'',0,437) ON DUPLICATE KEY UPDATE x = VALUES(x), y = VALUES(y) ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]