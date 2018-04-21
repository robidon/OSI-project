<?php
class Constructor_Model_Expression {
    
    var $suppress_errors = false;
    var $last_error = null;
    public $fileUid = null;
    
    var $v = array(); // variables (and constants)
    var $f = array(); // user-defined functions
    var $vb = array(); // constants
    static public $fb = array(  // built-in functions
        'sin','sinh','arcsin','asin','arcsinh','asinh',
        'cos','cosh','arccos','acos','arccosh','acosh',
        'tan','tanh','arctan','atan','arctanh','atanh',
        'sqrt','abs','ln','log','exp');

    static public $fc = array( // calc functions emulation
        'average'=>array(-1), 'max'=>array(-1),  'min'=>array(-1),
        'mod'=>array(2),      'pi'=>array(0),    'power'=>array(2),
        'round'=>array(1, 2), 'sum'=>array(-1),  'vector'=>array(-2),
        'extract'=>array(2), 'growthrate'=>array(2), 'concat'=>array(-1),
        'acc' => array(1), 'cumulative'=>array(-1));
    
    static public function get_keywords() {
        $replace = array_merge(self::$fb, array_keys(self::$fc));
        $replace[] = "\d+";
        Helper_Array::wrap($replace,"\b","\b");
        $replace = array_merge($replace, array("\.","\,","\+","\-","\*","\/","\(","\)","\[","\]","\{","\}","\<","\>","\!","\^","\=", "\:"));
        return $replace;
    }
    
    function get_vars($expr) {
        $expr = trim(mb_strtolower($expr));
        $replace = self::get_keywords();
        if ($this->fileUid){
            $file = Constructor_Dao_File::get_by_uid($this->fileUid);
            $constants = $file->getConstants();
            $constants = array_keys($constants);
            Helper_Array::wrap($constants,"\b","\b");
            $replace = array_merge($replace, $constants);
        }
        Helper_Array::wrap($replace,"/","/");
        $expr = preg_replace($replace," ",$expr);
        $vars = array_unique(explode(' ',trim(preg_replace("/\s\s+/"," ",$expr))));
        $vars = array_values($vars);
        foreach ($vars as $i=>$var) {
            if (!$var) unset($vars[$i]);
        }
        return $vars;
    }
    
    function e($expr) {
        return $this->evaluate($expr);
    }
    
    function evaluate($expr) {
        $this->last_error = null;
        $expr = trim($expr);
        if (substr($expr, -1, 1) == ';') $expr = substr($expr, 0, strlen($expr)-1); // strip semicolons at the end
        //===============
        // is it a variable assignment?
        if (preg_match('/^\s*([a-zа-я][a-zа-я0-9]*)\s*=\s*(.+)$/u', $expr, $matches)) {
            if (in_array($matches[1], $this->vb)) { // make sure we're not assigning to a constant
                return $this->trigger("cannot assign to constant '$matches[1]'");
            }
            if (($tmp = $this->pfx($this->nfx($matches[2]))) === false) return false; // get the result and make sure it's good
            $this->v[$matches[1]] = $tmp; // if so, stick it in the variable array
            return $this->v[$matches[1]]; // and return the resulting value
        //===============
        // is it a function assignment?
        } elseif (preg_match('/^\s*([a-zа-я][a-zа-я0-9]*)\s*\(\s*([a-zа-я][a-zа-я0-9]*(?:\s*,\s*[a-zа-я][a-zа-я0-9]*)*)\s*\)\s*=\s*(.+)$/u', $expr, $matches)) {
            $fnn = $matches[1]; // get the function name
            if (in_array($matches[1], self::$fb)) { // make sure it isn't built in
                return $this->trigger("cannot redefine built-in function '$matches[1]()'");
            }
            $args = explode(",", preg_replace("/\s+/u", "", $matches[2])); // get the arguments
            if (($stack = $this->nfx($matches[3])) === false) return false; // see if it can be converted to postfix
            for ($i = 0; $i<count($stack); $i++) { // freeze the state of the non-argument variables
                $token = $stack[$i];
                if (preg_match('/^[a-zа-я][a-zа-я0-9]*$/u', $token) and !in_array($token, $args)) {
                    if (array_key_exists($token, $this->v)) {
                        $stack[$i] = $this->v[$token];
                    } else {
                        return $this->trigger("undefined variable '$token' in function definition");
                    }
                }
            }
            $this->f[$fnn] = array('args'=>$args, 'func'=>$stack);
            return true;
        //==============
        } else {
            return $this->pfx($this->nfx($expr)); // straight up evaluation, woo
        }
    }
    
    function vars() {
        return $this->v;
    }
    
    function funcs() {
        $output = array();
        foreach ($this->f as $fnn=>$dat)
            $output[] = $fnn . '(' . implode(',', $dat['args']) . ')';
        return $output;
    }
    
    private static function doReplace($str)
    {
        $posStart = 0;
        $posEnd = 0;
        $total = 0;
        $started = false;
        for($i=0; $i<strlen($str); $i++){
            if ($str{$i} == '['){
                if (!$started){
                    $posStart = $i;
                    $started = true;
                }
                $total++;
            }
            if ($str{$i} == ']'){
                $total--;
                if ($total == 0){
                    $posEnd = $i;
                    $substr = substr($str, $posStart + 1, $posEnd - $posStart - 1);
                    $replaced = self::doReplace($substr);
                    $str = substr_replace($str, $replaced, $posStart + 1, $posEnd - $posStart - 1);
                }
            }
        }
        return preg_replace("/(\w+)\[\s*([^\]]+)\s*]/u", "extract($1, $2)", $str, 1, $count);
    }
    
    /**
    * check for alternate vector syntax and return regular vector function
    * 
    * @param string $expr
    * @return string
    */
    private function checkVector($expr)
    {
        // setting vector value
        $count = 1;
        while($count){
            $expr = preg_replace("/\{([^\}]+)\}/u", "vector($1)", $expr, -1, $count);
        }
        $expr = str_replace(":", ",", $expr);
        // getting vector value
        $do = true;
        while($do){
            $do = false;
            $_expr = self::doReplace($expr);
            if ($_expr != $expr){
                $do = true;
            }
            $expr = $_expr;
        }
        return $expr;
    }

    //===================== HERE BE INTERNAL METHODS ====================\\

    // Convert infix to postfix notation
    function nfx($expr) {
    
        $expr = $this->checkVector($expr);
        
        $index = 0;
        $stack = new EvalMathStack;
        $output = array(); // postfix form of expression, to be passed to pfx()
        $expr = trim(mb_strtolower($expr));
        
        $ops   = array('+', '-', '*', '/', '^', '_');
        $ops_r = array('+'=>0,'-'=>0,'*'=>0,'/'=>0,'^'=>1); // right-associative operator?  
        $ops_p = array('+'=>0,'-'=>0,'*'=>1,'/'=>1,'_'=>1,'^'=>2); // operator precedence
        
        $expecting_op = false; // we use this in syntax-checking the expression
                               // and determining when a - is a negation
    
        if (preg_match("/[^a-zа-я0-9\s+*^\/()\.,-]/u", $expr, $matches)) { // make sure the characters are all good
            return $this->trigger("illegal character '{$matches[0]}' at expression '{$expr}'");
        }
        while(1) { // 1 Infinite Loop ;)
            $op = substr($expr, $index, 1); // get the first character at the current index
            // find out if we're currently at the beginning of a number/variable/function/parenthesis/operand
            $ex = preg_match('/^([a-zа-я][a-zа-я0-9]*\(?|\d+(?:\.\d*)?|\.\d+|\()/u', substr($expr, $index), $match);
            //===============
            if ($op == '-' and !$expecting_op) { // is it a negation instead of a minus?
                $stack->push('_'); // put a negation on the stack
                $index++;
            } elseif ($op == '_') { // we have to explicitly deny this, because it's legal on the stack 
                return $this->trigger("illegal character '_'"); // but not in the input expression
            //===============
            } elseif ((in_array($op, $ops) or $ex) and $expecting_op) { // are we putting an operator on the stack?
                if ($ex) { // are we expecting an operator but have a number/variable/function/opening parethesis?
                    return $this->trigger("expecting operand");
                    //$op = '*'; $index--; // it's an implicit multiplication
                }
                // heart of the algorithm:
                while($stack->count > 0 and ($o2 = $stack->last()) and in_array($o2, $ops) and ($ops_r[$op] ? $ops_p[$op] < $ops_p[$o2] : $ops_p[$op] <= $ops_p[$o2])) {
                    $output[] = $stack->pop(); // pop stuff off the stack into the output
                }
                // many thanks: http://en.wikipedia.org/wiki/Reverse_Polish_notation#The_algorithm_in_detail
                $stack->push($op); // finally put OUR operator onto the stack
                $index++;
                $expecting_op = false;
            //===============
            } elseif ($op == ')' and $expecting_op) { // ready to close a parenthesis?
                while (($o2 = $stack->pop()) != '(') { // pop off the stack back to the last (
                    if (is_null($o2)) return $this->trigger("unexpected ')'");
                    else $output[] = $o2;
                }
                if (preg_match("/^([a-zа-я][a-zа-я0-9]*)\($/u", $stack->last(2), $matches)) { // did we just close a function?
                    $fnn = $matches[1]; // get the function name
                    $arg_count = $stack->pop(); // see how many arguments there were (cleverly stored on the stack, thank you)
                    $fn = $stack->pop();
                    $output[] = array('fn'=>$fn, 'fnn'=>$fnn, 'argcount'=>$arg_count); // send function to output
                    if (in_array($fnn, self::$fb)) { // check the argument count
                        if($arg_count > 1)
                            return $this->trigger("too many arguments ($arg_count given, 1 expected)");
                    } elseif (array_key_exists($fnn, self::$fc)) {
                        $counts = self::$fc[$fnn];
                        if (in_array(-1, $counts) and $arg_count > 0) {}
                        elseif (in_array(-2, $counts)) { if ($arg_count % 2 !== 0) { $this->trigger("wrong number of arguments ($arg_count given, even expected)"); } }
                        elseif (!in_array($arg_count, $counts))
                            return $this->trigger("wrong number of arguments ($arg_count given, " . implode('/',self::$fc[$fnn]) . " expected)");
                    } elseif (array_key_exists($fnn, $this->f)) {
                        if ($arg_count != count($this->f[$fnn]['args']))
                            return $this->trigger("wrong number of arguments ($arg_count given, " . count($this->f[$fnn]['args']) . " expected)");
                    } else { // did we somehow push a non-function on the stack? this should never happen
                        return $this->trigger("internal error");
                    }
                }
                $index++;
            //===============
            } elseif ($op == ',' and $expecting_op) { // did we just finish a function argument?
                while (($o2 = $stack->pop()) != '(') { 
                    if (is_null($o2)) return $this->trigger("unexpected ','"); // oops, never had a (
                    else $output[] = $o2; // pop the argument expression stuff and push onto the output
                }
                // make sure there was a function
                if (!preg_match("/^([a-zа-я][a-zа-я0-9]*)\($/u", $stack->last(2), $matches))
                    return $this->trigger("unexpected ','");
                $stack->push($stack->pop()+1); // increment the argument count
                $stack->push('('); // put the ( back on, we'll need to pop back to it again
                $index++;
                $expecting_op = false;
            //===============
            } elseif ($op == '(' and !$expecting_op) {
                $stack->push('('); // that was easy
                $index++;
                $allow_neg = true;
            //===============
            } elseif ($ex and !$expecting_op) { // do we now have a function/variable/number?
                $expecting_op = true;
                $val = $match[1];
                if (preg_match("/^([a-zа-я][a-zа-я0-9]*)\($/u", $val, $matches)) { // may be func, or variable w/ implicit multiplication against parentheses...
                    if (in_array($matches[1], self::$fb) or array_key_exists($matches[1], $this->f) or array_key_exists($matches[1], self::$fc)) { // it's a func
                        $stack->push($val);
                        $stack->push(1);
                        $stack->push('(');
                        $expecting_op = false;
                    } else { // it's a var w/ implicit multiplication
                        $val = $matches[1];
                        $output[] = $val;
                    }
                } else { // it's a plain old var or num
                    $output[] = $val;
                }
                $index += strlen($val);
            //===============
            } elseif ($op == ')') {
                //it could be only custom function with no params or general error
                if ($stack->last() != '(' or $stack->last(2) != 1) return $this->trigger("unexpected ')'");
                if (preg_match("/^([a-zа-я][a-zа-я0-9]*)\($/u", $stack->last(3), $matches)) { // did we just close a function?
                    $stack->pop();// (
                    $stack->pop();// 1
                    $fn = $stack->pop();
                    $fnn = $matches[1]; // get the function name
                    $counts = self::$fc[$fnn];
                    if (!in_array(0, $counts))
                        return $this->trigger("wrong number of arguments (... given, " . implode('/',self::$fc[$fnn]) . " expected) at expr: '$expr'");
                    $output[] = array('fn'=>$fn, 'fnn'=>$fnn, 'argcount'=>0); // send function to output
                    $index++;
                } else {
                    return $this->trigger("unexpected ')'");
                }
            //===============
            } elseif (in_array($op, $ops) and !$expecting_op) { // miscellaneous error checking
                return $this->trigger("unexpected operator '$op'");
            } else { // I don't even want to know what you did to get here
                return $this->trigger("an unexpected error occured at expression: ".$expr);
            }
            if ($index == strlen($expr)) {
                if (in_array($op, $ops)) { // did we end with an operator? bad.
                    return $this->trigger("operator '$op' lacks operand");
                } else {
                    break;
                }
            }
            while (substr($expr, $index, 1) == ' ') { // step the index past whitespace (pretty much turns whitespace 
                $index++;                             // into implicit multiplication if no operator is there)
            }
        
        } 
        while (!is_null($op = $stack->pop())) { // pop everything off the stack and push onto output
            if ($op == '(') return $this->trigger("expecting ')'"); // if there are (s on the stack, ()s were unbalanced
            $output[] = $op;
        }
        return $output;
    }

    // evaluate postfix notation
    function pfx($tokens, $vars = array()) {
        
        if ($tokens == false) return false;
    
        $stack = new EvalMathStack;
        
        foreach ($tokens as $token) { // nice and easy

            // if the token is a function, pop arguments off the stack, hand them to the function, and push the result back on
            if (is_array($token)) { // it's a function or vector!
                $fnn = $token['fnn'];
                $count = $token['argcount'];
                if (in_array($fnn, self::$fb)) { // built-in function:
                    if (is_null($op1 = $stack->pop())) return $this->trigger("internal error");
                    $fnn = preg_replace("/^arc/", "a", $fnn); // for the 'arc' trig synonyms
                    if ($fnn == 'ln') $fnn = 'log';
                    eval('$stack->push(' . $fnn . '($op1));'); // perfectly safe eval()
                } elseif (array_key_exists($fnn, self::$fc)) { // calc emulation function
                    // get args
                    $args = array();
                    for ($i = $count-1; $i >= 0; $i--) {
                        if (is_null($args[] = $stack->pop())) return $this->trigger("internal error");
                    }
                    $res = call_user_func(array('EvalMathCalcEmul', $fnn), $args);
                    if ($res === FALSE) {
                        return $this->trigger("internal error");
                    }
                    $stack->push($res);
                } elseif (array_key_exists($fnn, $this->f)) { // user function
                    // get args
                    $args = array();
                    for ($i = count($this->f[$fnn]['args'])-1; $i >= 0; $i--) {
                        if (is_null($args[$this->f[$fnn]['args'][$i]] = $stack->pop())) return $this->trigger("internal error");
                    }
                    $stack->push($this->pfx($this->f[$fnn]['func'], $args)); // yay... recursion!!!!
                } else { // it's a vector!
                    $stack->push($token);
                }
            // if the token is a binary operator, pop two values off the stack, do the operation, and push the result back on
            } elseif (in_array($token, array('+', '-', '*', '/', '^'), true)) {
                if (is_null($op2 = $stack->pop())) return $this->trigger("internal error");
                if (is_null($op1 = $stack->pop())) return $this->trigger("internal error");
                switch ($token) {
                    case '+':
                        if (is_numeric($op1)) {
                            if (is_numeric($op2)) {
                                $stack->push($op1+$op2);
                            } else {
                                $stack->push(VectorMath::addScalarToVector($op1,$op2));
                            }
                        } else {
                            if (is_numeric($op2)) {
                                $stack->push(VectorMath::addScalarToVector($op2,$op1));
                            } else {
                                $stack->push(VectorMath::add2Vectors($op1,$op2));
                            }
                        }
                        break;
                    case '-':
                        if (is_numeric($op1)) {
                            if (is_numeric($op2)) {
                                $stack->push($op1-$op2);
                            } else {
                                $stack->push(VectorMath::addScalarToVector($op1,VectorMath::mulScalarToVector(-1,$op2)));
                            }
                        } else {
                            if (is_numeric($op2)) {
                                $stack->push(VectorMath::addScalarToVector(-$op2,$op1));
                            } else {
                                $stack->push(VectorMath::add2Vectors($op1,VectorMath::mulScalarToVector(-1,$op2)));
                            }
                        }
                        break;
                    case '*':
                        if (is_numeric($op1)) {
                            if (is_numeric($op2)) {
                                $stack->push($op1*$op2);
                            } else {
                                $stack->push(VectorMath::mulScalarToVector($op1,$op2));
                            }
                        } else {
                            if (is_numeric($op2)) {
                                $stack->push(VectorMath::mulScalarToVector($op2,$op1));
                            } else {
                                $stack->push(VectorMath::mul2Vectors($op1,$op2));
                            }
                        }
                        break;
                    case '/':
                        if ($op2 == 0) return $this->trigger("division by zero");
                        if (is_numeric($op1)) {
                            if (is_numeric($op2)) {
                                $stack->push($op1/$op2); 
                            } else {
                                try {
                                    $stack->push(VectorMath::divScalarByVector($op1,$op2));
                                } catch (Exception $e) {
                                    $this->trigger("division by zero");
                                }
                            }
                        } else {
                            if (is_numeric($op2)) {
                                $stack->push(VectorMath::mulScalarToVector(1/$op2,$op1)); 
                            } else {
                                try {
                                    $stack->push(VectorMath::div2Vectors($op1,$op2));
                                } catch (Exception $e) {
                                    $this->trigger("division by zero");
                                }
                            }
                        }
                        break;
                    case '^':
                        if (!is_numeric($op2)) $this->trigger('internal error');
                        if (is_numeric($op1)) {
                            $stack->push(pow($op1, $op2));
                        } else {
                            $stack->push(VectorMath::pow($op1, $op2));
                        }
                        break;
                }
            // if the token is a unary operator, pop one value off the stack, do the operation, and push it back on
            } elseif ($token == "_") {
                $op = $stack->pop();
                if (is_numeric($op)) {
                    $stack->push(-1*$op);
                } else {
                    $stack->push(VectorMath::mulScalarToVector(-1,$op));
                }
            // if the token is a number or variable, push it on the stack
            } else {
                if (is_numeric($token)) {
                    $stack->push($token);
                } elseif (array_key_exists($token, $this->v)) {
                    $stack->push($this->v[$token]);
                } elseif (array_key_exists($token, $vars)) {
                    $stack->push($vars[$token]);
                } else {
                    return $this->trigger("undefined variable '$token' at expr: '$expr'");
                }
            }
        }
        // when we're out of tokens, the stack should have a single element, the final result
        if ($stack->count != 1) return $this->trigger("internal error");
        return $stack->pop();
    }
    
    // trigger an error, but nicely, if need be
    function trigger($msg) {
        $this->last_error = $msg;
        if (!$this->suppress_errors) trigger_error($msg, E_USER_WARNING);
        return false;
    }
}

// for internal use
class EvalMathStack {

    var $stack = array();
    var $count = 0;
    
    function push($val) {
        $this->stack[$this->count] = $val;
        $this->count++;
    }
    
    function pop() {
        if ($this->count > 0) {
            $this->count--;
            return $this->stack[$this->count];
        }
        return null;
    }
    
    function last($n=1) {
        if ($this->count - $n >= 0) {
            return $this->stack[$this->count-$n];
        }
        return null;
    }
}

// spreadsheed functions emulation
// watch out for reversed args!!
class EvalMathCalcEmul {

    public static function average($args) {
        return (EvalMathCalcEmul::sum($args)/count($args));
    }

    public static function max($args) {
        $res = array_pop($args);
        foreach($args as $a) {
            if ($res < $a) {
                $res = $a;
            }
        }
        return $res;
    }

    public static function min($args) {
        $res = array_pop($args);
        foreach($args as $a) {
            if ($res > $a) {
                $res = $a;
            }
        }
        return $res;
    }

    public static function mod($args) {
        return $args[1] % $args[0];
    }

    public static function pi($args) {
        return pi();
    }

    public static function power($args) {
        return $args[1]^$args[0];
    }

    public static function round($args) {
        if (count($args)==1) {
            return round($args[0]);
        } else {
            return round($args[1], $args[0]);
        }
    }

    public static function sum($args) {
        $res = 0;
        foreach($args as $a) {
           $res += $a;
        }
        return $res;
    }
    
    public static function vector($args) {
        $res = array();
        for ($i=count($args)-1;$i>=1;$i-=2) {
            $res[$args[$i]] = $args[$i-1];
        }
        return $res;
    }
    
    public static function extract($args) {
        return $args[1][$args[0]];
    }
    
    public static function growthrate($args){
        $data = $args[1];
        $growData = $args[0];
        $lastItem = array_slice($data, sizeof($data) - 1, 1,true);
        foreach($growData as $key => $koef){
            if (array_key_exists($key, $data)) continue;
            $lastVal = array_values($lastItem);
            $newItem = array($key => (1 + $koef) * $lastVal[0]);
            $data[$key] = $newItem[$key];
            $lastItem = $newItem;
        }
        return $data;
    }
    
    public static function concat($args){
        $data = array();
        foreach($args as $arg){
            $data = $data + $arg;
        }
        return $data;
    }
    
    public static function acc($args){
        $data = array();
        $prev = false;
        foreach($args[0] as $k => $val){
            if ($prev === false){
                $data[$k] = $val;
                $prev = $val;
            } else {
                $prev = $data[$k] = $prev + $val;
            }
        }
        return $data;
    }
    
    public static function cumulative($args) {
        $data = array();
        $a = $args[1];
        $b = $args[0];
        $last = 0;
        foreach($a as $k=>$val) {
            if (isset($b[$k])) return false;
            $data[$k] = $val;
            $last = $k;
        }
        foreach($b as $k=>$val) {
            $data[$k] = $data[$last] + $val;
            $last = $k;
        }
        return $data;
    }
}

class VectorMath {
    public static function addScalarToVector($s,$v) {
        $r = array();
        foreach($v as $k=>$i) $r[$k] = $i+$s;
        return $r;
    }
    public static function add2Vectors($v1,$v2) {
        $r = array();
        foreach ($v1 as $k=>$i) if (isset($v2[$k])) $r[$k] = $i+$v2[$k];
        return $r;
    }
    public static function mulScalarToVector($s,$v) {
        $r = array();
        foreach($v as $k=>$i) $r[$k] = $i*$s;
        return $r;
    }
    public static function mul2Vectors($v1,$v2) {
        $r = array();
        foreach ($v1 as $k=>$i) if (isset($v2[$k])) $r[$k] = $i * @$v2[$k];
        return $r;
    }
    public static function divScalarByVector($s,$v) {
        $r = array();
        foreach($v as $k=>$i) {
            if ($i == 0) {
                trigger_error('devision by zero');
            }
            $r[$k] = $s/$i;
        }
        return $r;
    }
    public static function div2Vectors($v1,$v2) {
        $r = array();
        foreach ($v1 as $k=>$i) {
            if (!isset($v2[$k])) continue;
            if($v2[$k]==0) {
                trigger_error('devision by zero');
            }
            $r[$k] = $i / $v2[$k];
        }
        return $r;
    }
    public static function pow($v,$s) {
        $r = array();
        foreach($v as $k=>$i) $r[$k] = pow($i,$s);
        return $r;
    }
}
?>