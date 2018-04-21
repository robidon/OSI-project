function extend(Child, Parent) {
    var F = function() { };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.$super = Parent;
    Child.prototype.constructor = Child;
    Child.superclass = Parent.prototype;
}
var Point = function(x,y) {
    this.x = x;
    this.y = y;
}
RegExp.escape = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
var Utils_String = {
    trim: function (str, characters) {
        if (typeof(characters)=="undefined") {
            return str.trim()
        }
        var c_array = characters.split('');
        var result  = '';

        for (var i=0; i < characters.length; i++)
            result += '\\' + c_array[i];

        return str.replace(new RegExp('^[' + result + ']+|['+ result +']+$', 'g'), '');
    },
    toNumber:function (val) {
        val = val+'';
        val = val.replace(/\,/g,'.').replace(/[^\-\d.]/g, "");
        j = val.lastIndexOf('.');
        if (j!==-1) {
            val = val.replace(/\./g,function (str, offset, s) {
                if (offset != j) {
                    return '';
                }
                return str;
            });
        }
        if (val) {
            val = +val;
            if (isNaN(val)) {
                val = '';
            }
        }
        return val;
    },
    substr_replace: function(str, replace, start, length) {
      // http://kevin.vanzonneveld.net
      // +   original by: Brett Zamir (http://brett-zamir.me)
      // *     example 1: substr_replace('ABCDEFGH:/MNRPQR/', 'bob', 0);
      // *     returns 1: 'bob'
      // *     example 2: $var = 'ABCDEFGH:/MNRPQR/';
      // *     example 2: substr_replace($var, 'bob', 0, $var.length);
      // *     returns 2: 'bob'
      // *     example 3: substr_replace('ABCDEFGH:/MNRPQR/', 'bob', 0, 0);
      // *     returns 3: 'bobABCDEFGH:/MNRPQR/'
      // *     example 4: substr_replace('ABCDEFGH:/MNRPQR/', 'bob', 10, -1);
      // *     returns 4: 'ABCDEFGH:/bob/'
      // *     example 5: substr_replace('ABCDEFGH:/MNRPQR/', 'bob', -7, -1);
      // *     returns 5: 'ABCDEFGH:/bob/'
      // *     example 6: 'substr_replace('ABCDEFGH:/MNRPQR/', '', 10, -1)'
      // *     returns 6: 'ABCDEFGH://'
      if (start < 0) { // start position in str
        start = start + str.length;
      }
      length = length !== undefined ? length : str.length;
      if (length < 0) {
        length = length + str.length - start;
      }
      return str.slice(0, start) + replace.substr(0, length) + replace.slice(length) + str.slice(start + length);
    },
    isNumber: function (n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
}
var Util_Number = {
    round: function (value, precision, mode) {
        var m, f, isHalf, sgn; // helper variables
        precision |= 0; // making sure precision is integer
        m = Math.pow(10, precision);
        value *= m;
        sgn = (value > 0) | -(value < 0); // sign of the number
        isHalf = value % 1 === 0.5 * sgn;
        f = Math.floor(value);

        if (isHalf) {
            switch (mode) {
            case 'PHP_ROUND_HALF_DOWN':
                value = f + (sgn < 0); // rounds .5 toward zero
                break;
            case 'PHP_ROUND_HALF_EVEN':
                value = f + (f % 2 * sgn); // rouds .5 towards the next even integer
                break;
            case 'PHP_ROUND_HALF_ODD':
                value = f + !(f % 2); // rounds .5 towards the next odd integer
                break;
            default:
                value = f + (sgn > 0); // rounds .5 away from zero
            }
        }

        return (isHalf ? value : Math.round(value)) / m;
    },
    addSpaces: function (value) {
        return (""+value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
}
var Util_Array = {
    array_keys: function ( input, search_value, strict ) {    // Return all the keys of an array
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        var tmp_arr = new Array(), strict = !!strict, include = true, cnt = 0;
        for ( key in input ){
            include = true;
            if ( search_value != undefined ) {
                if( strict && input[key] !== search_value ){
                    include = false;
                } else if( input[key] != search_value ){
                    include = false;
                }
            }
            if( include ) {
                tmp_arr[cnt] = key;
                cnt++;
            }
        }
        return tmp_arr;
    },
    wrap: function (ar,b,e) {
        var arc = {};
        for(var i in ar) {
            arc[i] = b+ar[i]+e;
        }
        return arc;
    },
    array_merge: function () {
      // http://kevin.vanzonneveld.net
      // +   original by: Brett Zamir (http://brett-zamir.me)
      // +   bugfixed by: Nate
      // +   input by: josh
      // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
      // *     example 1: arr1 = {"color": "red", 0: 2, 1: 4}
      // *     example 1: arr2 = {0: "a", 1: "b", "color": "green", "shape": "trapezoid", 2: 4}
      // *     example 1: array_merge(arr1, arr2)
      // *     returns 1: {"color": "green", 0: 2, 1: 4, 2: "a", 3: "b", "shape": "trapezoid", 4: 4}
      // *     example 2: arr1 = []
      // *     example 2: arr2 = {1: "data"}
      // *     example 2: array_merge(arr1, arr2)
      // *     returns 2: {0: "data"}
      var args = Array.prototype.slice.call(arguments),
        argl = args.length,
        arg,
        retObj = {},
        k = '',
        argil = 0,
        j = 0,
        i = 0,
        ct = 0,
        toStr = Object.prototype.toString,
        retArr = true;

      for (i = 0; i < argl; i++) {
        if (toStr.call(args[i]) !== '[object Array]') {
          retArr = false;
          break;
        }
      }

      if (retArr) {
        retArr = [];
        for (i = 0; i < argl; i++) {
          retArr = retArr.concat(args[i]);
        }
        return retArr;
      }

      for (i = 0, ct = 0; i < argl; i++) {
        arg = args[i];
        if (toStr.call(arg) === '[object Array]') {
          for (j = 0, argil = arg.length; j < argil; j++) {
            retObj[ct++] = arg[j];
          }
        }
        else {
          for (k in arg) {
            if (arg.hasOwnProperty(k)) {
              if (parseInt(k, 10) + '' === k) {
                retObj[ct++] = arg[k];
              }
              else {
                retObj[k] = arg[k];
              }
            }
          }
        }
      }
      return retObj;
    },
    array_values: function (input) {
      // http://kevin.vanzonneveld.net
      // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +      improved by: Brett Zamir (http://brett-zamir.me)
      // *     example 1: array_values( {firstname: 'Kevin', surname: 'van Zonneveld'} );
      // *     returns 1: {0: 'Kevin', 1: 'van Zonneveld'}
      var tmp_arr = [],
        key = '';

      if (input && typeof input === 'object' && input.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
        return input.values();
      }

      for (key in input) {
        tmp_arr[tmp_arr.length] = input[key];
      }

      return tmp_arr;
    },
    array_unique: function (inputArr) {
      // http://kevin.vanzonneveld.net
      // +   original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
      // +      input by: duncan
      // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   bugfixed by: Nate
      // +      input by: Brett Zamir (http://brett-zamir.me)
      // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // +   improved by: Michael Grier
      // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
      // %          note 1: The second argument, sort_flags is not implemented;
      // %          note 1: also should be sorted (asort?) first according to docs
      // *     example 1: array_unique(['Kevin','Kevin','van','Zonneveld','Kevin']);
      // *     returns 1: {0: 'Kevin', 2: 'van', 3: 'Zonneveld'}
      // *     example 2: array_unique({'a': 'green', 0: 'red', 'b': 'green', 1: 'blue', 2: 'red'});
      // *     returns 2: {a: 'green', 0: 'red', 1: 'blue'}
      var key = '',
        tmp_arr2 = {},
        val = '';

      var __array_search = function (needle, haystack) {
        var fkey = '';
        for (fkey in haystack) {
          if (haystack.hasOwnProperty(fkey)) {
            if ((haystack[fkey] + '') === (needle + '')) {
              return fkey;
            }
          }
        }
        return false;
      };

      for (key in inputArr) {
        if (inputArr.hasOwnProperty(key)) {
          val = inputArr[key];
          if (false === __array_search(val, tmp_arr2)) {
            tmp_arr2[key] = val;
          }
        }
      }

      return tmp_arr2;
    },
    toLowerCase:function(ar){
        var arc = [];
        for (var i=0;i<ar.length;i++) {
            arc[i] = (ar[i]+'').toLowerCase();
        }
        return arc;
    },
    parseInt:function(ar){
        var arc = [];
        for (var i=0;i<ar.length;i++) {
            arc[i] = parseInt(ar[i]);
        }
        return arc;
    },
    array_intersect:function(a1,a2) {
        return $.map(a1,function(a){return $.inArray(a, a2) < 0 ? null : a;});
    },
    isArray:function(somevar) {
         return (Object.prototype.toString.call (somevar) === '[object Array]');
    }
    
    
}