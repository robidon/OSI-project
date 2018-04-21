<?php defined('SYSPATH') or die('No direct script access.'); ?>

2014-03-18 22:54:59 --- ERROR: ErrorException [ 1 ]: Call to undefined method Model_User::find_by_email() ~ APPPATH\classes\controller\constructor\file.php [ 734 ]
2014-03-18 22:55:42 --- ERROR: ErrorException [ 8 ]: Undefined variable: editors ~ APPPATH\classes\controller\constructor\file.php [ 738 ]
2014-03-18 23:00:36 --- ERROR: Database_Exception [ 1064 ]: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'ON DUPLICATE KEY UPDATE `access_level` = VALUES(`access_level`)' at line 1 [  ON DUPLICATE KEY UPDATE `access_level` = VALUES(`access_level`) ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]
2014-03-18 23:01:47 --- ERROR: ErrorException [ 4 ]: syntax error, unexpected '=' ~ APPPATH\classes\constructor\service\file.php [ 103 ]
2014-03-18 23:02:14 --- ERROR: ErrorException [ 2048 ]: Non-static method Kohana_ORM::find() should not be called statically ~ APPPATH\classes\constructor\service\file.php [ 112 ]
2014-03-18 23:02:48 --- ERROR: Kohana_Exception [ 0 ]: The name property does not exist in the Model_User class ~ MODPATH\orm\classes\kohana\orm.php [ 375 ]
2014-03-18 23:07:38 --- ERROR: ErrorException [ 8 ]: Use of undefined constant id - assumed 'id' ~ APPPATH\classes\constructor\service\file.php [ 114 ]