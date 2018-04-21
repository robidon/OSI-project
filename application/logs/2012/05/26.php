<?php defined('SYSPATH') or die('No direct script access.'); ?>

2012-05-26 22:56:27 --- ERROR: Kohana_View_Exception [ 0 ]: The requested view file/precalc could not be found ~ SYSPATH\classes\kohana\view.php [ 252 ]
2012-05-26 23:43:03 --- ERROR: Database_Exception [ 1048 ]: Column 'description' cannot be null [ INSERT INTO `c_nodes` (`id`, `file_uid`, `type`, `name`, `description`, `operator_uid`, `formula`, `x`, `y`, `position`, `style`) VALUES (NULL, '149', 0, 'node', NULL, NULL, 's1+21', 0, 0, 0, 0) ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]