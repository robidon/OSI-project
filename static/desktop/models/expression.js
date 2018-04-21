var Desktop_Model_Expression  = function Desktop_Model_Expression() {
    
    this.suppress_errors = false;
    this.last_error = null;
    this.fileUid = null;
    
    this.v = []; // variables (and constants)
    this.f = []; // user-defined functions
    this.vb = []; // constants
    Desktop_Model_Expression.fb = [  // built-in functions
        'sin','sinh','arcsin','asin','arcsinh','asinh',
        'cos','cosh','arccos','acos','arccosh','acosh',
        'tan','tanh','arctan','atan','arctanh','atanh',
        'sqrt','abs','ln','log','exp','macro'];

    Desktop_Model_Expression.fc = { // calc functions emulation
        'average':[-1], 'max':[-1],  'min':[-1],
        'mod':[2],      'pi':[0],    'power':[2],
        'round':[1, 2], 'sum':[-1],  'vector':[-2],
        'extract':[2], 'growthrate':[2], 'concat':[-1],
        'acc':[1], 'cumulative':[-1]};
    
    Desktop_Model_Expression.get_keywords = function () {
        var replace = Util_Array.array_merge(Desktop_Model_Expression.fb, Util_Array.array_keys(Desktop_Model_Expression.fc));
        replace.push("\\d+");
        replace = Util_Array.wrap(replace,"\\b","\\b");
        replace = Util_Array.array_merge(replace, ["\\n","\\.","\\,","\\+","\\-","\\*","\\/","\\(","\\)","\\[","\\]","\\{","\\}","\\<","\\>","\\!","\\^","\\=", "\\:", "\\'"]);
        return replace;
    }
    
    var constants = [];
    this.setConstants = function(cnsts) {
        for(var i in cnsts) {
            if (Utils_String.trim(i) == '') {
                delete cnsts[i]
            }
        }
        if (!cnsts) {
            constants = [];
            return;
        }
        constants = Util_Array.toLowerCase(Util_Array.array_keys(cnsts));
    };
    this.getConstants = function () {
        return constants;
    }
    this.replaceMacroparams = function(formula) {
        var result = formula;
        var i,j,comma,replace = '';
        for (i in Desktop_Model_Expression.macroparams) {
            replace = "vector(";
            comma = '';
            for (j in Desktop_Model_Expression.macroparams[i]) {
                replace+= comma+"'"+j+"',"+Desktop_Model_Expression.macroparams[i][j];
                comma = ',';
            }
            replace += ")";
            result = result.replace('macro('+i+')',replace);
        }
        return result;
    }
    this.get_vars = function(expr) {
        expr = $.trim(expr.toLowerCase());
        var replaceStrings = Desktop_Model_Expression.get_keywords();
        if (constants) {
            replaceStrings = Util_Array.array_merge(replaceStrings, constants);
        }
        //if (this.fileUid){
            /*
            
            TODO: константы надо прогрузить из файла!!!
            
            $file = Constructor_Dao_File::get_by_uid($this.fileUid);
            $constants = $file.getConstants();
            $constants = Util_Array.array_keys($constants);
            Helper_Array::wrap($constants,"\b","\b");
            $replace = Util_Array.array_merge($replace, $constants);
            */
        //}
        //Util_Array.wrap(replace,"/","/");
        var j;
        expr = expr.replace(/\'[^\']*\'/g," ");
        for (j in replaceStrings) {
            expr = expr.replace(new RegExp(replaceStrings[j],"g")," ");
        }
        var vars = Util_Array.array_unique($.trim(expr.replace(/\s\s+/g," ")).split(' '));
        vars = Util_Array.array_values(vars);
        for(var i in vars) {
            if (!vars[i]) delete vars[i];
        }
        return vars;
    }
    
    this.e = function(expr) {
        return this.evaluate(expr);
    }
    
    this.evaluate = function(expr) {
        //console.log('EVALUATE:',expr);
        //debug.log('evaluate:',expr);
        this.last_error = null;
        expr = $.trim(expr);
        if (expr.substr(-1, 1) == ';') expr = expr.substr(0, expr.length()-1); // strip semicolons at the end
        //===============
        // is it a variable assignment?
        var matches;
        if (matches = expr.match(/^\s*([a-zа-я_][a-zа-я0-9_]*)\s*=\s*(.+)$/)) {
            //console.log('var assign');
            if ($.inArray(matches[1], this.vb)!==-1) { // make sure we're not assigning to a constant
                return this.trigger("cannot assign to constant '"+matches[1]+"'");
            }
            var tmp;
            if ((tmp = this.pfx(this.nfx(matches[2]))) === false) return false; // get the result and make sure it's good
            this.v[matches[1]] = tmp; // if so, stick it in the variable array
            return this.v[matches[1]]; // and return the resulting value
        //===============
        // is it a function assignment?
        } else if (matches = expr.match(/^\s*([a-zа-я_][a-zа-я0-9_]*)\s*\(\s*([a-zа-я_][a-zа-я0-9_]*(?:\s*,\s*[a-zа-я_][a-zа-я0-9_]*)*)\s*\)\s*=\s*(.+)$/)) {
            //console.log('func assign');
            var fnn = matches[1]; // get the function name
            if ($.inArray(matches[1], Desktop_Model_Expression.fb)!=-1) { // make sure it isn't built in
                return this.trigger("cannot redefine built-in function '"+matches[1]+"()'");
            }
            var args = matches[2].replace(/\s+/g, "").split(","); // get the arguments
            var stack, i, token;
            if ((stack = this.nfx(matches[3])) === false) return false; // see if it can be converted to postfix
            for (i = 0; i<stack.length; i++) { // freeze the state of the non-argument variables
                token = stack[i];
                if (token.match(/^[a-zа-я_][a-zа-я0-9_]*$/) && ($.inArray(token, args)==-1)) {
                    if (typeof (this.v[token])!=="undefined") {
                        stack[i] = this.v[token];
                    } else {
                        return this.trigger("undefined variable '"+token+"' in function definition");
                    }
                }
            }
            this.f[fnn] = {'args':args, 'func':stack};
            return true;
        //==============
        } else {
            //console.log('evaluation:'+expr, this.nfx(expr));
            return this.pfx(this.nfx(expr)); // straight up evaluation, woo
        }
    }
    
    this.vars = function() {
        return this.v;
    }
    
    this.funcs = function() {
        var output = [];
        for (var fnn in this.f)
            output.push(fnn + '(' + this.f[fnn]['args'].join(',') + ')');
        return output;
    }
    
    Desktop_Model_Expression.doReplace = function(str)
    {
        var posStart = 0;
        var posEnd = 0;
        var total = 0;
        var started = false;
        var i;
        var replaced,substr;
        for(i=0; i<str.length; i++){
            if (str[i] == '['){
                if (!started){
                    posStart = i;
                    started = true;
                }
                total++;
            }
            if (str[i] == ']'){
                total--;
                if (total == 0){
                    posEnd = i;
                    substr = str.substr(posStart + 1, posEnd - posStart - 1);
                    replaced = Desktop_Model_Expression.doReplace(substr);
                    str = Utils_String.substr_replace(str, replaced, posStart + 1, posEnd - posStart - 1);
                }
            }
        }
        return str.replace(/(\w+)\[\s*([^\]]+)\s*]/, "extract($1, $2)");
    }
    
    /**
    * check for alternate vector syntax and return regular vector function
    * 
    * @param string $expr
    * @return string
    */
    this.checkVector = function (expr)
    {
        //console.error(expr);
        // setting vector value
        expr = expr.replace(/\{([^\}]+)\}/g, "vector($1)");
        expr = expr.replace(/\:/g, ",");
        //console.error(expr);
        // getting vector value
        var doit = true;
        var _expr;
        while(doit){
            doit = false;
            _expr = Desktop_Model_Expression.doReplace(expr);
            if (_expr != expr){
                doit = true;
            }
            expr = _expr;
        }
        //debug.log('checkVector:',expr);
        return expr;
    }

    //===================== HERE BE INTERNAL METHODS ====================\\

    // Convert infix to postfix notation
    this.nfx = function (expr) {
    
        expr = this.checkVector(expr);
        
        var index = 0;
        var stack = new EvalMathStack();
        var output = []; // postfix form of expression, to be passed to pfx()
        expr = $.trim(expr.toLowerCase());
        
        var ops   = ['+', '-', '*', '/', '^', '~'];
        var ops_r = {'+':0,'-':0,'*':0,'/':0,'^':1}; // right-associative operator?  
        var ops_p = {'+':0,'-':0,'*':1,'/':1,'~':1,'^':2}; // operator precedence
        
        var expecting_op = false; // we use this in syntax-checking the expression
                               // and determining when a - is a negation
    
        var matches;
        //debug.log(expr);
        //console.info("nfx ",expr);
        if (matches = expr.match(/[^a-zа-я0-9\s+*^\/()\.,-_\']/)) { // make sure the characters are all good
            return this.trigger("illegal character '{"+matches[0]+"}' at expression '{"+expr+"}'");
        }
        var op,match,ex,o2,fn, fnn,arg_count,counts,allow_neg,lst;
        //debug.log('expression start:'+expr);        
        while(1) { // 1 Infinite Loop ;)
            op = expr.substr(index, 1); // get the first character at the current index
            // find out if we're currently at the beginning of a number/variable/function/parenthesis/operand
            ex = (match = expr.substr(index).match(/^([a-zа-я_][a-zа-я0-9_]*\(?|\d+(?:\.\d*)?|\.\d+|\(|\'[^\']+\')/)) !== null;
            if (op == '-' && !expecting_op) { // is it a negation instead of a minus?
                stack.push('~'); // put a negation on the stack
                index++;
            } else if (op == '~') { // we have to explicitly deny this, because it's legal on the stack 
                return this.trigger("illegal character '~'"); // but not in the input expression
            //===============
            } else if ((($.inArray(op, ops)!=-1) || ex) && expecting_op) { // are we putting an operator on the stack?
                if (ex) { // are we expecting an operator but have a number/variable/function/opening parethesis?
                    return this.trigger("expecting operand");
                    //$op = '*'; $index--; // it's an implicit multiplication
                }
                // heart of the algorithm:
                while(stack.count > 0 && (o2 = stack.last()+'') && ($.inArray(o2, ops)!=-1) && (ops_r[op] ? ops_p[op] < ops_p[o2] : ops_p[op] <= ops_p[o2])) {
                    output.push(stack.pop()); // pop stuff off the stack into the output
                }
                // many thanks: http://en.wikipedia.org/wiki/Reverse_Polish_notation#The_algorithm_in_detail
                stack.push(op); // finally put OUR operator onto the stack
                index++;
                expecting_op = false;
            //===============
            } else if (op == ')' && expecting_op) { // ready to close a parenthesis?
                while ((o2 = stack.pop()) != '(') { // pop off the stack back to the last (
                    if (o2==null) return this.trigger("unexpected ')'");
                    else output.push(o2);
                }
                lst = stack.last(2) + '';
                if (lst && (matches = lst.match(/^([a-zа-я_][a-zа-я0-9_]*)\($/))) { // did we just close a function?
                    fnn = matches[1]; // get the function name
                    arg_count = stack.pop(); // see how many arguments there were (cleverly stored on the stack, thank you)
                    fn = stack.pop();
                    output.push({'fn':fn, 'fnn':fnn, 'argcount':arg_count}); // send function to output
                    if ($.inArray(fnn, Desktop_Model_Expression.fb)!=-1) { // check the argument count
                        if(arg_count > 1)
                            return this.trigger("too many arguments ("+arg_count+" given, 1 expected)");
                    } else if (typeof (Desktop_Model_Expression.fc[fnn])!="undefined") {
                        counts = Desktop_Model_Expression.fc[fnn];
                        if ($.inArray(-1, counts)!=-1 && arg_count > 0) {}
                        else if ($.inArray(-2, counts)!=-1) { if (arg_count % 2 !== 0) { this.trigger("wrong number of arguments ("+arg_count+" given, even expected)"); } }
                        else if ($.inArray(arg_count, counts)==-1)
                            return this.trigger("wrong number of arguments ("+arg_count+" given, " + Desktop_Model_Expression.fc[fnn].join('/') + " expected)");
                    } else if (typeof (this.f[fnn])!="undefined") {
                        if (arg_count != this.f[fnn]['args'].length)
                            return this.trigger("wrong number of arguments ("+arg_count+" given, " + this.f[fnn]['args'].length + " expected)");
                    } else { // did we somehow push a non-function on the stack? this should never happen
                        return this.trigger("internal error");
                    }
                }
                index++;
            //===============
            } else if (op == ',' && expecting_op) { // did we just finish a function argument?
                while ((o2 = stack.pop()) != '(') { 
                    if (o2 == null) return this.trigger("unexpected ','"); // oops, never had a (
                    else output.push(o2); // pop the argument expression stuff and push onto the output
                }
                // make sure there was a function
                lst = stack.last(2)+'';
                if (!lst || !(matches = lst.match(/^([a-zа-я_][a-zа-я0-9_]*)\($/)))
                    return this.trigger("unexpected ','");
                stack.push(stack.pop()+1); // increment the argument count
                stack.push('('); // put the ( back on, we'll need to pop back to it again
                index++;
                expecting_op = false;
            //===============
            } else if (op == '(' && !expecting_op) {
                stack.push('('); // that was easy
                index++;
                allow_neg = true;
            //===============
            } else if (ex && !expecting_op) { // do we now have a function/variable/number?
                expecting_op = true;
                val = match[1];
                if (matches = val.match(/^([a-zа-я_][a-zа-я0-9_]*)\($/)) { // may be func, or variable w/ implicit multiplication against parentheses...
                    if ($.inArray(matches[1], Desktop_Model_Expression.fb)!=-1 || (typeof (this.f[matches[1]])!="undefined") || (typeof (Desktop_Model_Expression.fc[matches[1]])!="undefined")) { // it's a func
                        stack.push(val);
                        stack.push(1);
                        stack.push('(');
                        expecting_op = false;
                    } else { // it's a var w/ implicit multiplication
                        val = matches[1];
                        output.push(val);
                    }
                } else { // it's a plain old var or num
                    output.push(Utils_String.trim(val,"'"));
                }
                index += val.length;
            //===============
            } else if (op == ')') {
                //it could be only custom function with no params or general error
                if (stack.last()+'' != '(' || stack.last(2) != 1) return this.trigger("unexpected ')'");
                lst = stack.last(3)+'';
                if (lst && (matches = lst.match(/^([a-zа-я_][a-zа-я0-9_]*)\($/))) { // did we just close a function?
                    stack.pop();// (
                    stack.pop();// 1
                    fn = stack.pop();
                    fnn = matches[1]; // get the function name
                    counts = Desktop_Model_Expression.fc[fnn];
                    if ($.inArray(0, counts)==-1)
                        return this.trigger("wrong number of arguments (... given, " + Desktop_Model_Expression.fc[fnn].join('/') + " expected) at expr: '"+expr+"'");
                    output.push({'fn':fn, 'fnn':fnn, 'argcount':0}); // send function to output
                    index++;
                } else {
                    return this.trigger("unexpected ')'");
                }
            //===============
            } else if ($.inArray(op, ops)!=-1 && !expecting_op) { // miscellaneous error checking
                return this.trigger("unexpected operator '"+op+"'");
            } else { // I don't even want to know what you did to get here
                return this.trigger("an unexpected error occured at expression: "+expr);
            }
            if (index == expr.length) {
                if ($.inArray(op, ops)!=-1) { // did we end with an operator? bad.
                    return this.trigger("operator '"+op+"' lacks operand");
                } else {
                    break;
                }
            }
            while (expr.substr(index, 1) == ' ') { // step the index past whitespace (pretty much turns whitespace 
                index++;                             // into implicit multiplication if no operator is there)
            }
        
        } 
        while ((op = stack.pop())!=null) { // pop everything off the stack and push onto output
            if (op == '(') return this.trigger("expecting ')'"); // if there are (s on the stack, ()s were unbalanced
            output.push(op);
        }
        //console.log('OUTPUT:',output);
        return output;
    }

    // evaluate postfix notation
    this.pfx = function(tokens, vars) {
        //console.info("pfx ",tokens, vars);
        if (typeof(vars) == 'undefined') vars = [];
        
        if (tokens == false) return false;
    
        var stack = new EvalMathStack();
        var i, j, token, fnn, count, op1, args, op2, res, op;
        for(j in tokens) { // nice and easy
        
            token = tokens[j];
            
            //console.error(token);

            // if the token is a function, pop arguments off the stack, hand them to the function, and push the result back on
            if (typeof(token)=='object') { // it's a function or vector!
                fnn = token['fnn'];
                count = token['argcount'];
                if ($.inArray(fnn, Desktop_Model_Expression.fb)!=-1) { // built-in function:
                    if ((op1 = stack.pop()) == null) return this.trigger("internal error");
                    fnn = fnn.replace(/^arc/g, "a"); // for the 'arc' trig synonyms
                    if (fnn == 'ln') fnn = 'log';
                    stack.push(Math[fnn](op1));
                    //eval('$stack.push(' . $fnn . '($op1));'); // perfectly safe eval()
                } else if (typeof(Desktop_Model_Expression.fc[fnn])!="undefined") { // calc emulation function
                    // get args
                    args = [];
                    for (i = count-1; i >= 0; i--) {
                        op2 = stack.pop();
                        if (op2==null) return this.trigger("internal error");
                        args.push(op2);
                    }
                    res = EvalMathCalcEmul[fnn](args);
                    if (res === false) {
                        return this.trigger("internal error");
                    }
                    stack.push(res);
                } else if (typeof(this.f[fnn])!="undefined") { // user function
                    // get args
                    args = [];
                    for (i = this.f[fnn]['args'].length-1; i >= 0; i--) {
                        if ((args[this.f[fnn]['args'][i]] = stack.pop())==null) return this.trigger("internal error");
                    }
                    stack.push(this.pfx(this.f[fnn]['func'], args)); // yay... recursion!!!!
                } else { // it's a vector!
                    stack.push(token);
                }
            // if the token is a binary operator, pop two values off the stack, do the operation, and push the result back on
            } else if ($.inArray(token, ['+', '-', '*', '/', '^'])!=-1) {
                if ((op2 = stack.pop())==null) return this.trigger("internal error");
                if ((op1 = stack.pop())==null) return this.trigger("internal error");
                switch (token) {
                    case '+':
                        if (Utils_String.isNumber( op1 )) {
                            if (Utils_String.isNumber(op2)) {
                                stack.push(op1+op2);
                            } else {
                                stack.push(VectorMath.addScalarToVector(op1,op2));
                            }
                        } else {
                            if (Utils_String.isNumber(op2)) {
                                stack.push(VectorMath.addScalarToVector(op2,op1));
                            } else {
                                stack.push(VectorMath.add2Vectors(op1,op2));
                            }
                        }
                        break;
                    case '-':
                        if (Utils_String.isNumber(op1)) {
                            if (Utils_String.isNumber(op2)) {
                                stack.push(op1-op2);
                            } else {
                                stack.push(VectorMath.addScalarToVector(op1,VectorMath.mulScalarToVector(-1,op2)));
                            }
                        } else {
                            if (Utils_String.isNumber(op2)) {
                                stack.push(VectorMath.addScalarToVector(-op2,op1));
                            } else {
                                stack.push(VectorMath.add2Vectors(op1,VectorMath.mulScalarToVector(-1,op2)));
                            }
                        }
                        break;
                    case '*':
                        if (Utils_String.isNumber(op1)) {
                            if (Utils_String.isNumber(op2)) {
                                stack.push(op1*op2);
                            } else {
                                stack.push(VectorMath.mulScalarToVector(op1,op2));
                            }
                        } else {
                            if (Utils_String.isNumber(op2)) {
                                stack.push(VectorMath.mulScalarToVector(op2,op1));
                            } else {
                                stack.push(VectorMath.mul2Vectors(op1,op2));
                            }
                        }
                        break;
                    case '/':
                        if (op2 == 0) return this.trigger("division by zero");
                        if (Utils_String.isNumber(op1)) {
                            if (Utils_String.isNumber(op2)) {
                                stack.push(op1/op2); 
                            } else {
                                try {
                                    stack.push(VectorMath.divScalarByVector(op1,op2));
                                } catch (e) {
                                    this.trigger("division by zero");
                                }
                            }
                        } else {
                            if (Utils_String.isNumber(op2)) {
                                stack.push(VectorMath.mulScalarToVector(1/op2,op1)); 
                            } else {
                                try {
                                    stack.push(VectorMath.div2Vectors(op1,op2));
                                } catch (e) {
                                    this.trigger("division by zero");
                                }
                            }
                        }
                        break;
                    case '^':
                        if (!Utils_String.isNumber(op2)) this.trigger('internal error');
                        if (Utils_String.isNumber(op1)) {
                            stack.push(Math.pow(op1, op2));
                        } else {
                            stack.push(VectorMath.pow(op1, op2));
                        }
                        break;
                }
            // if the token is a unary operator, pop one value off the stack, do the operation, and push it back on
            } else if (token == "~") {
                op = stack.pop();
                if (Utils_String.isNumber(op)) {
                    stack.push(-1*op);
                } else {
                    stack.push(VectorMath.mulScalarToVector(-1,op));
                }
            // if the token is a number or variable, push it on the stack
            } else {
                if (Utils_String.isNumber(token)) {
                    stack.push(parseFloat(token));
                } else if (typeof (this.v[token])!="undefined") {
                    //debug.log('v', token, this.v[token]);
                    stack.push(this.v[token]);
                } else if (typeof (vars[token])!="undefined") {
                    //debug.log('vars', token, vars[token]);
                    stack.push(vars[token]);
                } else {
                    // передаем как строку в функцию, а та уж разберется, как ей воспринимать значение.
                    stack.push(token);
                    /*return this.trigger("undefined variable '"+token+"'");*/
                }
            }
        }
        // when we're out of tokens, the stack should have a single element, the final result
        if (stack.count != 1) return this.trigger("internal error");
        return stack.pop();
    }
    
    // trigger an error, but nicely, if need be
    this.trigger = function (msg) {
        this.last_error = msg;
        if (!this.suppress_errors) {
            throw 'Ошибка пересчета: '+msg;
        }
        return false;
    }
}

// for internal use
var EvalMathStack = function EvalMathStack() {

    this.stack = [];
    this.count = 0;
    
    this.push = function(val) {
        this.stack[this.count] = val;
        this.count++;
    }
    
    this.pop = function() {
        if (this.count > 0) {
            this.count--;
            return this.stack[this.count];
        }
        return null;
    }
    
    this.last = function (n) {
        if (typeof(n)=='undefined') n = 1;
        if (this.count - n >= 0) {
            return this.stack[this.count-n];
        }
        return null;
    }
}

// spreadsheed functions emulation
// watch out for reversed args!!
var EvalMathCalcEmul = {

    
    average : function(args) {
        return (EvalMathCalcEmul.sum(args)/args.length);
    },

    max : function(args) {
        var res = args.pop();
        for(var a in args) {
            if (res < args[a]) {
                res = args[a];
            }
        }
        return res;
    },

    min : function(args) {
        var res = args.pop();
        for(var a in args) {
            if (res > args[a]) {
                res = args[a];
            }
        }
        return res;
    },

    mod : function(args) {
        return args[1] % args[0];
    },

    pi : function(args) {
        return Math.PI;
    },

    power : function(args) {
        return args[1]^args[0];
    },

    round : function(args) {
        if (args.length==1) {
            return Math.round(args[0]);
        } else {
            return Math.round(args[0]);//(args[1], args[0]); вряд ли потребуется
        }
    },

    sum : function(args) {
        var res = 0;
        for(var a in args) {
           res += args[a];
        }
        return res;
    },
    
    vector : function(args) {
        //console.error('vector:',args);
        var res = {};
        for (var i=args.length-1;i>=1;i-=2) {
            //args[i] = Utils_String.trim(args[i],"'");
            res[args[i]] = args[i-1];
        }
        return res;
    },
    
    extract : function(args) {
        return args[1][args[0]];
    },
    
    growthrate : function(args){
        var data = args[1];
        var growData = args[0];
        var keys = Util_Array.array_keys(data);
        keys = keys.slice(keys.length - 1, keys.length); 
        var lastItem = {};
        lastItem[keys[0]] = data[keys[0]];
        var koef,lastVal,newItem;
        for(var key in growData){
            koef = growData[key];
            if (typeof (data[key])!="undefined") continue;
            lastVal = Util_Array.array_values(lastItem);
            newItem = {};
            newItem[key] = (1 + koef) * lastVal[0];
            data[key] = newItem[key];
            lastItem = newItem;
        }
        return data;
    },
    
    concat : function(args){
        var data = {};
        var key,k;
        for(k in args){
            if (Utils_String.isNumber(args[k])) {
                data[k] = args[k];
                continue;
            }
            for (key in args[k]) {
                data[key] = args[k][key];
            }
        }
        return data;
    },
    
    acc : function(args){
        var data = [];
        var prev = false;
        var val;
        for(var k in args[0]){
            val = args[0][k];
            if (prev === false){
                data[k] = val;
                prev = val;
            } else {
                prev = data[k] = prev + val;
            }
        }
        return data;
    },
    
    cumulative : function(args) {
        var data = [];
        var a = args[1];
        var b = args[0];
        var last = 0;
        var val;
        for(var k in a) {
            val = a[k];
            if (typeof(b[k])!="undefined") return false;
            data[k] = val;
            last = k;
        }
        for(k in b) {
            val = b[k];
            data[k] = data[last] + val;
            last = k;
        }
        return data;
    }
}

var VectorMath = {
    addScalarToVector:function(s,v) {
        var r = {};
        for(var k in v) r[k] = v[k]+s;
        return r;
    },
    add2Vectors:function(v1,v2) {
        var r = {};
        for(var k in v1) if (typeof (v2[k])!="undefined") r[k] = v1[k]+v2[k];
        return r;
    },
    mulScalarToVector:function(s,v) {
        var r = {};
        for(var k in v) r[k] = v[k]*s;
        return r;
    },
    mul2Vectors:function(v1,v2) {
        var r = {};
        for(var k in v1) if (typeof (v2[k]) != "undefined") r[k] = v1[k] * v2[k];
        return r;
    },
    divScalarByVector:function(s,v) {
        var r = {};
        for(var k in v) {
            if (v[k] == 0) {
                throw 'devision by zero';
            }
            r[k] = s/v[k];
        }
        return r;
    },
    div2Vectors:function(v1,v2) {
        var r = {};
        for(var k in v1) {
            if (typeof (v2[k])=='undefined') continue;
            if(v2[k]==0) {
                throw 'devision by zero';
            }
            r[k] = v1[k] / v2[k];
        }
        return r;
    },
    pow:function (v,s) {
        var r = {};
        for(var k in v) r[k] = Math.pow(v[k],s);
        return r;
    }
}
Desktop_Model_Expression.macroparams = {};
