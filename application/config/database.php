<?php defined('SYSPATH') or die('No direct access allowed.');

if (IN_PRODUCTION) {
    return array
    (
        'default' => array
        (
            'type'       => 'mysql',
            'connection' => array(
                /**
                 * The following options are available for MySQL:
                 *
                 * string   hostname     server hostname, or socket
                 * string   database     database name
                 * string   username     database username
                 * string   password     database password
                 * boolean  persistent   use persistent connections?
                 *
                 * Ports and sockets may be appended to the hostname.
                 */
                'hostname'   => 'localhost',
                'database'   => IN_SBOR ? 'cronlineru_osbor': 'cronlineru_osidb',
                'username'   => IN_SBOR ? 'cronlineru_osbor': 'cronlineru_osidb',
                'password'   => IN_SBOR ? 'bobrdobr': 'fixmepls',
                'persistent' => true,
            ),
            'table_prefix' => '',
            'charset'      => 'utf8',
            'caching'      => FALSE,
            'profiling'    => TRUE,
        ),
        'alternate' => array(
            'type'       => 'pdo',
            'connection' => array(
                /**
                 * The following options are available for PDO:
                 *
                 * string   dsn         Data Source Name
                 * string   username    database username
                 * string   password    database password
                 * boolean  persistent  use persistent connections?
                 */
                'dsn'        => 'mysql:host=localhost;dbname=kohana',
                'username'   => 'root',
                'password'   => 'r00tdb',
                'persistent' => FALSE,
            ),
            /**
             * The following extra options are available for PDO:
             *
             * string   identifier  set the escaping identifier
             */
            'table_prefix' => '',
            'charset'      => 'utf8',
            'caching'      => FALSE,
            'profiling'    => TRUE,
        ),
    );
}

return array
(
	'default' => array
	(
		'type'       => 'mysql',
		'connection' => array(
			/**
			 * The following options are available for MySQL:
			 *
			 * string   hostname     server hostname, or socket
			 * string   database     database name
			 * string   username     database username
			 * string   password     database password
			 * boolean  persistent   use persistent connections?
			 *
			 * Ports and sockets may be appended to the hostname.
			 */
			'hostname'   => 'localhost',
			'database'   => 'osi',
			'username'   => 'root',
			'password'   => '1234',
			'persistent' => true,
		),
		'table_prefix' => '',
		'charset'      => 'utf8',
		'caching'      => FALSE,
		'profiling'    => TRUE,
	),
	'alternate' => array(
		'type'       => 'pdo',
		'connection' => array(
			/**
			 * The following options are available for PDO:
			 *
			 * string   dsn         Data Source Name
			 * string   username    database username
			 * string   password    database password
			 * boolean  persistent  use persistent connections?
			 */
			'dsn'        => 'mysql:host=localhost;dbname=kohana',
			'username'   => 'root',
			'password'   => 'r00tdb',
			'persistent' => FALSE,
		),
		/**
		 * The following extra options are available for PDO:
		 *
		 * string   identifier  set the escaping identifier
		 */
		'table_prefix' => '',
		'charset'      => 'utf8',
		'caching'      => FALSE,
		'profiling'    => TRUE,
	),
);