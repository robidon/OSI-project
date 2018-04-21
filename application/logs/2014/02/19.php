<?php defined('SYSPATH') or die('No direct script access.'); ?>

2014-02-19 22:26:11 --- ERROR: Database_Exception [ 1146 ]: Table 'osi.users' doesn't exist [ SHOW FULL COLUMNS FROM `users` ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]
2014-02-19 22:30:37 --- ERROR: Database_Exception [ 1064 ]: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near ')' at line 1 [ DELETE FROM `c_layers_nodes` WHERE `node_id` IN () ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]
2014-02-19 22:50:31 --- ERROR: ErrorException [ 1 ]: Maximum execution time of 30 seconds exceeded ~ MODPATH\database\classes\kohana\database\mysql.php [ 171 ]
2014-02-19 22:52:17 --- ERROR: Database_Exception [ 1064 ]: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '' at line 1 [ INSERT INTO `c_layers_nodes` (`layer_id`, `node_id`) VALUES  ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]
2014-02-19 23:01:22 --- ERROR: ErrorException [ 8 ]: Undefined offset: 3004 ~ APPPATH\classes\model\dao\thread.php [ 348 ]