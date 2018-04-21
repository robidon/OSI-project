<?php defined('SYSPATH') or die('No direct script access.');

/**
* Set the production status
*/
require "config.override".EXT;


//-- Environment setup --------------------------------------------------------

/**
 * Set the default time zone.
 *
 * @see  http://kohanaframework.org/guide/using.configuration
 * @see  http://php.net/timezones
 */
date_default_timezone_set('Europe/Moscow');

/**
 * Set the default locale.
 *
 * @see  http://kohanaframework.org/guide/using.configuration
 * @see  http://php.net/setlocale
 */
setlocale(LC_ALL, 'en_US.utf-8');

/**
 * Enable the Kohana auto-loader.
 *
 * @see  http://kohanaframework.org/guide/using.autoloading
 * @see  http://php.net/spl_autoload_register
 */
spl_autoload_register(array('Kohana', 'auto_load'));

/**
 * Enable the Kohana auto-loader for unserialization.
 *
 * @see  http://php.net/spl_autoload_call
 * @see  http://php.net/manual/var.configuration.php#unserialize-callback-func
 */
ini_set('unserialize_callback_func', 'spl_autoload_call');

//-- Configuration and initialization -----------------------------------------

/**
 * Set Kohana::$environment if $_ENV['KOHANA_ENV'] has been supplied.
 * 
 */
if (isset($_ENV['KOHANA_ENV']))
{
	Kohana::$environment = $_ENV['KOHANA_ENV'];
}


/**
 * Initialize Kohana, setting the default options.
 *
 * The following options are available:
 *
 * - string   base_url    path, and optionally domain, of your application   NULL
 * - string   index_file  name of your index file, usually "index.php"       index.php
 * - string   charset     internal character set used for input and output   utf-8
 * - string   cache_dir   set the internal cache directory                   APPPATH/cache
 * - boolean  errors      enable or disable error handling                   TRUE
 * - boolean  profile     enable or disable internal profiling               TRUE
 * - boolean  caching     enable or disable internal caching                 FALSE
 */

Kohana::init(array(
	'base_url'   => '/',
    'charset'    => 'utf-8',
    'index_file' => '',
));

/**
 * Attach the file write to logging. Multiple writers are supported.
 */
Kohana::$log->attach(new Kohana_Log_File(APPPATH.'logs'));

/**
 * Attach a file reader to config. Multiple readers are supported.
 */
Kohana::$config->attach(new Kohana_Config_File);

/**
 * Enable modules. Modules are referenced by a relative or absolute path.
 */
Kohana::modules(array(
	 'auth'       => MODPATH.'auth',       // Basic authentication
	// 'cache'      => MODPATH.'cache',      // Caching with multiple backends
	// 'codebench'  => MODPATH.'codebench',  // Benchmarking tool
     'mailer'     => MODPATH.'mailer',   // Mailer
	 'database'   => MODPATH.'database',   // Database access
	 'image'      => MODPATH.'image',      // Image manipulation
	 'orm'        => MODPATH.'orm',        // Object Relationship Mapping
	// 'oauth'      => MODPATH.'oauth',      // OAuth authentication
	// 'pagination' => MODPATH.'pagination', // Paging of results
	// 'unittest'   => MODPATH.'unittest',   // Unit testing
	 'userguide'  => MODPATH.'userguide',  // User guide and API documentation
	));

/**
 * Set the routes. Each route must have a minimum of a name, a URI and a set of
 * defaults for the URI.
 */

Route::set('admin', 'admin(/<controller>(/<action>(/<id>)))')
  ->defaults(array(
    'directory'  => 'admin',
    'controller' => 'home',
    'action'     => 'index',
  ));
Route::set('constructor', 'constructor(/<controller>(/<id>)(/<action>))', array('id' => '\d+'))
    ->defaults(array(
        'directory'=>'constructor',
        'controller'=>'index',
        'action'=>'index'
    ));
Route::set('constructorNode', 'constructor/file(/<id>)/node(/<nodeId>)', array('id' => '\d+', 'nodeId'=>'\d+'))
    ->defaults(array(
        'directory'=>'constructor',
        'controller'=>'file',
        'action'=>'index'
    ));
Route::set('constructorGroup', 'constructor/file(/<id>)/group(/<groupId>)', array('id' => '\d+', 'groupId'=>'\d+'))
    ->defaults(array(
        'directory'=>'constructor',
        'controller'=>'file',
        'action'=>'index'
    ));
Route::set('constructorNodes', 'constructor/file(/<id>)/nodes(/<nodeIds>)', array('id' => '\d+', 'nodeIds'=>'(\d+\,?)+'))
    ->defaults(array(
        'directory'=>'constructor',
        'controller'=>'file',
        'action'=>'index'
    ));
Route::set('profile', 'profile(/<user_id>)(/<action>)', array('user_id' => '\d+'))
  ->defaults(array(
    'controller' => 'profile',
    'action'     => 'index',
  ));
Route::set('article', 'article(/<name>)')
  ->defaults(array(
    'controller' => 'article',
    'action'     => 'index',
  ));
Route::set('default', '(<controller>(/<action>(/<id>)))')
	->defaults(array(
		'controller' => 'index',
		'action'     => 'index',
	));
Route::set('files', '(<file>)',array('file' => '.+'))
    ->defaults(array(
        'controller' => 'error',
        'action'     => '404',
       
    ));
// проблемы в некоторых случаях(
/*if(!function_exists('get_called_class')) { 
    function get_called_class() {
        $bt = debug_backtrace();
        $l = 0;
        do {
            $l++;
            $lines = file($bt[$l]['file']);
            $callerLine = $lines[$bt[$l]['line']-1];
            preg_match('/([a-zA-Z0-9\_]+)::'.$bt[$l]['function'].'/',
                       $callerLine,
                       $matches);
                       
           if ($matches[1] == 'self') {
                   $line = $bt[$l]['line']-1;
                   while ($line > 0 && strpos($lines[$line], 'class') === false) {
                       $line--;                   
                   }
                   preg_match('/class[\s]+(.+?)[\s]+/si', $lines[$line], $matches);
           }
        }
        while ($matches[1] == 'parent'  && $matches[1]);
        return $matches[1];
    }
}*/
if(!function_exists('get_called_class')) {
function get_called_class($bt = false,$l = 1) {
    if (!$bt) $bt = debug_backtrace();
    if (!isset($bt[$l])) throw new Exception("Cannot find called class -> stack level too deep.");
    if (!isset($bt[$l]['type'])) {
        throw new Exception ('type not set');
    }
    else switch ($bt[$l]['type']) {
        case '::':
            $lines = file($bt[$l]['file']);
            $i = 0;
            $callerLine = '';
            do {
                $i++;
                $callerLine = $lines[$bt[$l]['line']-$i] . $callerLine;
            } while (stripos($callerLine,$bt[$l]['function']) === false);
            preg_match('/([a-zA-Z0-9\_]+)::'.$bt[$l]['function'].'/',
                        $callerLine,
                        $matches);
            if (!isset($matches[1])) {
                // must be an edge case.
                throw new Exception ("Could not find caller class: originating method call is obscured.");
            }
            switch ($matches[1]) {
                case 'self':
                case 'parent':
                    return get_called_class($bt,$l+1);
                default:
                    return $matches[1];
            }
            // won't get here.
        case '->': switch ($bt[$l]['function']) {
                case '__get':
                    // edge case -> get class of calling object
                    if (!is_object($bt[$l]['object'])) throw new Exception ("Edge case fail. __get called on non object.");
                    return get_class($bt[$l]['object']);
                default: return $bt[$l]['class'];
            }

        default: throw new Exception ("Unknown backtrace method type");
    }
}
} 


if ( ! defined('SUPPRESS_REQUEST'))
{
     
    /**
    * Execute the main request. A source of the URI can be passed, eg: $_SERVER['PATH_INFO'].
    * If no source is specified, the URI will be automatically detected.
    */
    $request = Request::instance();
     
    try
    {
        $request->execute();
    }
    catch (Exception_404 $e)
    {
        $request = Request::factory('error/404')->execute();
    }
    catch (Exception_403 $e)
    {
        $request = Request::factory('error/403')->execute();
    }
    catch (ReflectionException $e)
    {
        $request = Request::factory('error/404')->execute();
    }
    catch (Exception $e)
    {
        if ( ! IN_PRODUCTION )
        {
            throw $e;
        } else {

            // Create a text version of the exception
            $error = Kohana::exception_text($e);
            
            // Add this exception to the log
            Kohana::$log->add(Kohana::ERROR, $error);

            // Make sure the logs are written
            Kohana::$log->write();
        }
     
        $request = Request::factory('error/500')->execute();
    }
     
    echo $request->send_headers()->response;
}