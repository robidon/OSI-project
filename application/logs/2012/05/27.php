<?php defined('SYSPATH') or die('No direct script access.'); ?>

2012-05-27 00:16:20 --- ERROR: Database_Exception [ 1048 ]: Column 'description' cannot be null [ INSERT INTO `c_nodes` (`id`, `file_uid`, `type`, `name`, `description`, `operator_uid`, `formula`, `x`, `y`, `position`, `style`) VALUES (NULL, '149', 0, 'node', NULL, NULL, '', 0, 0, 0, 0) ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]
2012-05-27 00:17:47 --- ERROR: Database_Exception [ 1048 ]: Column 'operator_uid' cannot be null [ INSERT INTO `c_nodes` (`id`, `file_uid`, `type`, `name`, `description`, `operator_uid`, `formula`, `x`, `y`, `position`, `style`) VALUES (NULL, '149', 0, 'node', '', NULL, '', 0, 0, 0, 0) ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]