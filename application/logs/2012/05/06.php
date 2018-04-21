<?php defined('SYSPATH') or die('No direct script access.'); ?>

2012-05-06 00:43:12 --- ERROR: ErrorException [ 8 ]: Undefined variable: thread ~ APPPATH\classes\constructor\dao\node.php [ 267 ]
2012-05-06 00:43:21 --- ERROR: Database_Exception [ 1048 ]: Column 'name' cannot be null [ INSERT INTO `c_nodes` (`id`, `file_uid`, `type`, `name`, `description`, `operator_uid`, `formula`, `x`, `y`, `position`, `style`) VALUES (NULL, '104', 0, NULL, NULL, NULL, '', 0, 0, 0, 0) ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]
2012-05-06 00:44:07 --- ERROR: ErrorException [ 8 ]: Undefined variable: thread ~ APPPATH\classes\constructor\dao\node.php [ 267 ]