<?php defined('SYSPATH') or die('No direct script access.'); ?>

2011-11-23 15:50:27 --- ERROR: Database_Exception [ 1064 ]: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'DESC' at line 2 [ SELECT * FROM `c_files` 
            WHERE  `name` LIKE '%' AND `is_latest` = 1 DESC ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]
2011-11-23 15:51:00 --- ERROR: Database_Exception [ 1054 ]: Unknown column 'name' in 'where clause' [ SELECT * FROM `c_files` 
            WHERE  `name` LIKE '%' AND `is_latest` = 1 ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]
2011-11-23 15:51:18 --- ERROR: ErrorException [ 2 ]: Invalid argument supplied for foreach() ~ APPPATH\classes\model\dao.php [ 10 ]
2011-11-23 15:52:16 --- ERROR: ErrorException [ 2 ]: Invalid argument supplied for foreach() ~ APPPATH\classes\model\dao.php [ 10 ]
2011-11-23 15:52:40 --- ERROR: ErrorException [ 2 ]: Invalid argument supplied for foreach() ~ APPPATH\classes\model\dao.php [ 10 ]
2011-11-23 15:53:54 --- ERROR: ErrorException [ 2 ]: Invalid argument supplied for foreach() ~ APPPATH\classes\model\dao.php [ 10 ]
2011-11-23 15:54:07 --- ERROR: ErrorException [ 2 ]: Invalid argument supplied for foreach() ~ APPPATH\classes\model\dao.php [ 10 ]
2011-11-23 15:54:28 --- ERROR: ErrorException [ 2 ]: Invalid argument supplied for foreach() ~ APPPATH\classes\model\dao.php [ 10 ]
2011-11-23 15:55:48 --- ERROR: Kohana_Exception [ 0 ]: The name property does not exist in the Model_User class ~ MODPATH\orm\classes\kohana\orm.php [ 375 ]