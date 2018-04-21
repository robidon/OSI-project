<?php defined('SYSPATH') or die('No direct script access.'); ?>

2011-11-24 23:30:10 --- ERROR: Database_Exception [ 1366 ]: Incorrect integer value: '' for column 'parent_tag_id' at row 1 [ INSERT INTO `tags` (`id`, `namespace_id`, `name`, `description`, `parent_tag_id`) VALUES (NULL, '1', 'Energy', 'Электроэнергетика', '') ] ~ MODPATH\database\classes\kohana\database\mysql.php [ 179 ]