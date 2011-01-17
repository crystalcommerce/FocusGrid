/*!
 * Benchmark.js
 * Copyright 2010-2011 Mathias Bynens <http://mths.be/>
 * Based on JSLitmus.js, copyright Robert Kieffer <http://broofa.com/>
 * Modified by John-David Dalton <http://allyoucanleet.com/>
 * Available under MIT license <http://mths.be/mit>
 */

(function(window) {

  /** Detect DOM0 timeout API (performed at the bottom) */
  var HAS_TIMEOUT_API,

  /** Detect Java environment */
  IN_JAVA = isHostType(window, 'java') &&
    !isHostType(window, 'netscape'),

  /** Used to integrity check compiled tests */
  EMBEDDED_UID = +new Date,

  /** Used to skip Benchmark's initializations */
  HEADLESS = function() { },

  /** Unit of the timer */
  TIMER_UNIT = 'ms',

  /** Used to avoid hz of Infinity */
  CYCLE_DIVISORS = {
    '1': 4096,
    '2': 512,
    '3': 64,
    '4': 8,
    '5': 0
  },

  /**
   * T-Distribution two-tailed critical values for 95% confidence
   * http://www.itl.nist.gov/div898/handbook/eda/section3/eda3672.htm
   */
  T_DISTRIBUTION = {
    '1':  12.706,'2':  4.303, '3':  3.182, '4':  2.776, '5':  2.571, '6':  2.447,
    '7':  2.365, '8':  2.306, '9':  2.262, '10': 2.228, '11': 2.201, '12': 2.179,
    '13': 2.160, '14': 2.145, '15': 2.131, '16': 2.120, '17': 2.110, '18': 2.101,
    '19': 2.093, '20': 2.086, '21': 2.080, '22': 2.074, '23': 2.069, '24': 2.064,
    '25': 2.060, '26': 2.056, '27': 2.052, '28': 2.048, '29': 2.045, 'Infinity': 1.960
  },

  /** Internal cached used by various methods */
  cache = {
    'counter': 0
  },

  /** Used in Benchmark.hasKey() */
  hasOwnProperty = cache.hasOwnProperty,

  /** Used to convert array-like objects to arrays */
  slice = [].slice,

  /** Used generically when invoking over queued arrays */
  shift = aloClean([].shift),

  /** Math shortcuts */
  abs  = Math.abs,
  max  = Math.max,
  min  = Math.min,
  pow  = Math.pow,
  sqrt = Math.sqrt;

  /*--------------------------------------------------------------------------*/

  /**
   * Benchmark constructor.
   * @constructor
   * @param {String} name A name to identify the benchmark.
   * @param {Function} fn The test to benchmark.
   * @param {Object} [options={}] Options object.
   * @example
   *
   * // basic usage
   * var bench = new Benchmark(fn);
   *
   * // or using a name first
   * var bench = new Benchmark('foo', fn);
   *
   * // or with options
   * var bench = new Benchmark('foo', fn, {
   *
   *   // displayed by Benchmark#toString if `name` is not available
   *   'id': 'xyz',
   *
   *   // called when the benchmark starts running
   *   'onStart': onStart,
   *
   *   // called after each run cycle
   *   'onCycle': onCycle,
   *
   *   // called when aborted
   *   'onAbort': onAbort,
   *
   *   // called when a test errors
   *   'onError': onError,
   *
   *   // called when reset
   *   'onReset': onReset,
   *
   *   // called when the benchmark completes running
   *   'onComplete': onComplete,
   *
   *   // compiled/called before the test loop
   *   'setup': setup,
   *
   *   // compiled/called after the test loop
   *   'teardown': teardown
   * });
   */
  function Benchmark(name, fn, options) {
    // juggle arguments
    var me = this;
    if (isClassOf(name, 'Function')) {
      options = fn;
      fn = name;
    } else {
      me.name = name;
    }
    // initialize if not headless
    if (name != HEADLESS) {
      me.fn = fn;
      fn.uid || (fn.uid = ++cache.counter);
      setOptions(me, options);

      me.created = +new Date;
      me.stats = extend({ }, me.stats);
      me.times = extend({ }, me.times);
    }
  }

  /**
   * Suite constructor.
   * @constructor
   * @member Benchmark
   * @param {Object} [options={}] Options object.
   * @example
   *
   * // basic usage
   * var suite = new Benchmark.Suite;
   *
   * // or with options
   * var suite = new Benchmark.Suite({
   *
   *   // called when the suite starts running
   *   'onStart': onStart,
   *
   *   // called between running benchmarks
   *   'onCycle': onCycle,
   *
   *   // called when aborted
   *   'onAbort': onAbort,
   *
   *   // called when a test errors
   *   'onError': onError,
   *
   *   // called when reset
   *   'onReset': onReset,
   *
   *   // called when the suite completes running
   *   'onComplete': onComplete
   * });
   */
  function Suite(options) {
    setOptions(this, options);
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Wraps an array function to ensure array-like-objects (ALO) are empty when their length is `0`.
   * @private
   * @param {Function} fn The array function to be wrapped.
   * @returns {Function} The new function.
   */
  function aloClean(fn) {
    return function() {
      var me = this,
          result = fn.apply(me, arguments);
      // fixes IE<9 and IE8 compatibility mode bugs
      if (!me.length) {
        delete me[0];
      }
      return result;
    };
  }

  /**
   * Executes a function asynchronously or synchronously.
   * @private
   * @param {Object} me The benchmark instance passed to `fn`.
   * @param {Function} fn Function to be executed.
   * @param {Boolean} [async=false] Flag to run asynchronously.
   */
  function call(me, fn, async) {
    // only attempt asynchronous calls if supported
    if (async && HAS_TIMEOUT_API) {
      me.timerId = setTimeout(function() {
        delete me.timerId;
        fn();
      }, me.CYCLE_DELAY * 1e3);
    }
    else {
      fn();
    }
  }

  /**
   * Clocks the time taken to execute a test per cycle (secs).
   * @private
   * @param {Object} me The benchmark instance.
   * @returns {Number} The time taken.
   */
  function clock() {
    var args,
        fallback,
        timerNS,
        timerRes,
        proto = Benchmark.prototype,
        resLimit = 0.0015,
        code = '#{setup}var r$,i$=m$.count,f$=m$.fn,#{start};while(i$--){|}#{end};#{teardown}return{time:r$,uid:"$"}|m$.teardown&&m$.teardown();|f$()|m$.setup&&m$.setup();|m$,n$';

    clock = function(me) {
      var embedded,
          result,
          fn = me.fn,
          compilable = fn.compilable,
          count = me.count;

      if (compilable == null || compilable) {
        try {
          // insert test body into the while-loop
          embedded = Function(args,
            interpolate(code[0], { 'setup': getSource(me.setup) }) +
            getSource(fn) +
            interpolate(code[1], { 'teardown': getSource(me.teardown) })
          );

          if (compilable == null) {
            // determine if compiled code is exited early, usually by a rogue
            // return statement, by checking for a return object with the uid
            me.count = 1;
            compilable = fn.compilable = embedded(me, timerNS).uid == EMBEDDED_UID;
            me.count = count;
          }
          if (compilable) {
            result = embedded(me, timerNS).time;
          }
        } catch(e) {
          me.count = count;
          compilable = fn.compilable = false;
        }
      }
      // fallback to simple while-loop when compilable is false
      if (!compilable) {
        result = fallback(me, timerNS).time;
      }
      // smells like Infinity?
      return me.DETECT_INFINITY &&
        min(timerRes, result) / max(timerRes, result) > 0.9 ? 0 : result;
    };

    function getRes(unit) {
      var measured,
          start,
          count = 50,
          divisor = 1e3,
          size = count,
          sum = 0;

      // get average smallest measurable time
      while (count--) {
        if (unit == 'us') {
          divisor = 1e6;
          timerNS.start();
          while(!(measured = timerNS.microseconds()));
        }
        else if (unit == 'ns') {
          divisor = 1e9;
          start = timerNS.nanoTime();
          while(!(measured = timerNS.nanoTime() - start));
        }
        else {
          start = +new timerNS;
          while(!(measured = +new timerNS - start));
        }
        // check for broken timers (nanoTime may have issues)
        // http://alivebutsleepy.srnet.cz/unreliable-system-nanotime/
        if (measured < 0) {
          sum = Infinity;
          break;
        } else {
          sum += measured;
        }
      }
      // convert average to seconds
      return sum / size / divisor;
    }

    // detect nanosecond support:
    // Java System.nanoTime()
    // http://download.oracle.com/javase/6/docs/api/java/lang/System.html#nanoTime()
    try {
      timerNS = java.lang.System;
    } catch(e) {
      each(window.document && document.applets || [], function(applet) {
        try {
          // use non-element to avoid issues with libs that augment them
          timerNS || (timerNS = 'nanoTime' in applet && new applet.Packages.nano);
        } catch(e) { }
      });
    }
    try {
      // check type in case Safari returns an object instead of a number
      timerNS  = typeof timerNS.nanoTime() == 'number' && timerNS;
      timerRes = getRes('ns');
      timerNS  = timerRes <= resLimit && (TIMER_UNIT = 'ns', timerNS);
    } catch(e) { }

    // detect microsecond support:
    // enable benchmarking via the --enable-benchmarking flag
    // in at least Chrome 7 to use chrome.Interval
    if (!timerNS) {
      try {
        timerNS  = new (window.chrome || window.chromium).Interval;
        timerRes = getRes('us');
        timerNS  = timerRes <= resLimit && (TIMER_UNIT = 'us', timerNS);
      } catch(e) { }
    }
    // else milliseconds
    if (!timerNS) {
      timerNS = Date;
      timerRes = getRes('ms');
    }
    // error if there are no working timers
    if (timerRes == Infinity) {
      throw new Error('Benchmark.js was unable to find a working timer.');
    }

    // use API of chosen timer
    if (TIMER_UNIT == 'ns') {
      code = interpolate(code, {
        'start': 's$=n$.nanoTime()',
        'end': 'r$=(n$.nanoTime()-s$)/1e9'
      });
    }
    else if (TIMER_UNIT == 'us') {
      code = interpolate(code, {
        'start': 's$=n$.start()',
        'end': 'r$=n$.microseconds()/1e6'
      });
    }
    else {
      code = interpolate(code, {
        'start': 's$=new n$',
        'end': 'r$=(new n$-s$)/1e3'
      });
    }

    // inject uid into variable names to avoid collisions with
    // embedded tests and create non-embedding fallback
    code = code.replace(/\$/g, EMBEDDED_UID).split('|');
    args = code.pop();
    fallback = Function(args,
      interpolate(code[0], { 'setup': code.pop() }) +
      code.pop() +
      interpolate(code[1], { 'teardown': code.pop() })
    );

    // resolve time to achieve a percent uncertainty of 1%
    proto.MIN_TIME || (proto.MIN_TIME = timerRes / 2 / 0.01);
    return clock.apply(null, arguments);
  }

  /**
   * Wraps a function and passes `this` to the original function as the first argument.
   * @private
   * @param {Function} fn The function to be wrapped.
   * @returns {Function} The new function.
   */
  function methodize(fn) {
    return function() {
      return fn.apply(this, [this].concat(slice.call(arguments)));
    };
  }

  /**
   * Gets the critical value for the specified degrees of freedom.
   * @private
   * @param {Number} df The degrees of freedom.
   * @returns {Number} The critical value.
   */
  function getCriticalValue(df) {
    return T_DISTRIBUTION[Math.round(df) || 1] || T_DISTRIBUTION.Infinity;
  }

  /**
   * Sets the options of a benchmark.
   * @private
   * @param {Object} me The benchmark instance.
   * @param {Object} [options={}] Options object.
   */
  function setOptions(me, options) {
    me.options = forIn(extend({ }, options), function(value, key) {
      // add event listeners
      if (/^on[A-Z]/.test(key)) {
        each(key.split(' '), function(key) {
          me.on(key.slice(2).toLowerCase(), value);
        });
      } else {
        me[key] = value;
      }
    });
  }

  /*--------------------------------------------------------------------------*/

  /**
   * A generic bare-bones `Array#forEach` solution.
   * Callbacks may terminate the loop by explicitly returning `false`.
   * @static
   * @member Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function called per iteration.
   * @returns {Array} The array iterated over.
   */
  function each(array, callback) {
    var i = -1,
        length = array.length;

    while (++i < length) {
      if (i in array && callback(array[i], i, array) === false) {
        break;
      }
    }
    return array;
  }

  /**
   * Copies own/inherited properties of a source object to the destination object.
   * @static
   * @member Benchmark
   * @param {Object} destination The destination object.
   * @param {Object} [source={}] The source object.
   * @returns {Object} The destination object.
   */
  function extend(destination, source) {
    source || (source = { });
    for (var key in source) {
      destination[key] = source[key];
    }
    return destination;
  }

  /**
   * A generic bare-bones `Array#filter` solution.
   * @static
   * @member Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Function|String} callback The function/alias called per iteration.
   * @returns {Array} A new array of values that passed callback filter.
   * @example
   *
   * // get odd numbers
   * Benchmark.filter([1, 2, 3, 4, 5], function(n) {
   *   return n % 2;
   * }); // -> [1, 3, 5];
   *
   * // get fastest benchmarks
   * Benchmark.filter(benches, 'fastest');
   *
   * // get slowest benchmarks
   * Benchmark.filter(benches, 'slowest');
   *
   * // get benchmarks that completed without erroring
   * Benchmark.filter(benches, 'successful');
   */
  function filter(array, callback) {
    var source;
    if (callback == 'successful') {
      // callback to exclude errored or unrun benchmarks
      callback = function(bench) { return bench.cycles; };
    }
    else if (/^(?:fast|slow)est$/.test(callback)) {
      // get successful benchmarks
      array = filter(array, 'successful');
      // sort descending fastest to slowest
      array.sort(function(a, b) { return b.compare(a); });
      // set source benchmark
      source = array[callback == 'fastest' ? 0 : array.length - 1];
      // callback to filter fastest/slowest
      callback = function(bench) { return !source.compare(bench); };
    }
    return reduce(array, function(result, value, index) {
      return callback(value, index, array) ? result.push(value) && result : result;
    }, []);
  }

  /**
   * A generic bare-bones for-in solution for an object's own properties.
   * @static
   * @member Benchmark
   * @param {Object} object The object to iterate over.
   * @param {Function} callback The function called per iteration.
   * @returns {Object} The object iterated over.
   */
  function forIn(object, callback) {
    for (var key in object) {
      if (hasKey(object, key) && callback(object[key], key, object) === false) {
        break;
      }
    }
    return object;
  }

  /**
   * Converts a number to a more readable comma-separated string representation.
   * @static
   * @member Benchmark
   * @param {Number} number The number to convert.
   * @returns {String} The more readable string representation.
   */
  function formatNumber(number) {
    var comma = ',',
        string = String(max(0, abs(number).toFixed(0))),
        length = string.length,
        end = /^\d{4,}$/.test(string) ? length % 3 : 0;

    return (end ? string.slice(0, end) + comma : '') +
      string.slice(end).replace(/(\d{3})(?=\d)/g, '$1' + comma);
  }

  /**
   * Checks if an object has the specified key as a direct property.
   * @static
   * @member Benchmark
   * @param {Object} object The object to check.
   * @param {String} key The key to check for.
   * @returns {Boolean} Returns `true` if key is a direct property, else `false`.
   */
  function hasKey(object, key) {
    var result,
        parent = (object.constructor || Object).prototype;

    // for modern browsers
    object = Object(object);
    if (isClassOf(hasOwnProperty, 'Function')) {
      result = hasOwnProperty.call(object, key);
    }
    // for Safari 2
    else if (cache.__proto__ == Object.prototype) {
      object.__proto__ = [object.__proto__, object.__proto__ = null, result = key in object][0];
    }
    // for others (not as accurate)
    else {
      result = key in object &&
        !(key in parent && object[key] === parent[key]);
    }
    return result;
  }

  /**
   * A generic bare-bones `Array#indexOf` solution.
   * @static
   * @member Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Mixed} value The value to search for.
   * @returns {Number} The index of the matched value or `-1`.
   */
  function indexOf(array, value) {
    var result = -1;
    each(array, function(v, i) {
      if (v === value) {
        result = i;
        return false;
      }
    });
    return result;
  }

  /**
   * Invokes a method on all items in an array.
   * @static
   * @member Benchmark
   * @param {Array} benches Array of benchmarks to iterate over.
   * @param {String|Object} name The name of the method to invoke OR options object.
   * @param {Mixed} [, arg1, arg2, ...] Arguments to invoke the method with.
   * @returns {Array} A new array of values returned from each method invoked.
   * @example
   *
   * // invoke `reset` on all benchmarks
   * Benchmark.invoke(benches, 'reset');
   *
   * // invoke `emit` with arguments
   * Benchmark.invoke(benches, 'emit', 'complete', listener);
   *
   * // invoke `run(true)`, treat benchmarks as a queue, and register invoke callbacks
   * Benchmark.invoke(benches, {
   *
   *   // invoke the `run` method
   *   'name': 'run',
   *
   *   // pass a single argument
   *   'args': true,
   *
   *   // treat as queue, removing benchmarks from front of `benches` until empty
   *   'queued': true,
   *
   *   // called before any benchmarks have been invoked.
   *   'onStart': onStart,
   *
   *   // called between invoking benchmarks
   *   'onCycle': onCycle,
   *
   *   // called after all benchmarks have been invoked.
   *   'onComplete': onComplete
   * });
   */
  function invoke(benches, name) {
    var args,
        async,
        bench,
        queued,
        i = 0,
        options = { 'onStart': noop, 'onCycle': noop, 'onComplete': noop },
        result = slice.call(benches, 0);

    function execute() {
      var listeners;
      if (async) {
        // use `next` as a listener
        bench.on('complete', next);
        listeners = bench.events['complete'];
        listeners.splice(0, 0, listeners.pop());
      }
      // execute method
      result[i] = bench[name].apply(bench, args);
      // if synchronous return true until finished
      return async || next();
    }

    function next() {
      var last = bench;
      bench = false;

      if (async) {
        last.removeListener('complete', next);
        last.emit('complete');
      }
      // choose next benchmark if not exiting early
      if (options.onCycle.call(benches, last) !== false) {
        if (queued) {
          // use generic shift
          shift.call(benches);
          bench = benches[0];
        } else {
          bench = benches[++i];
        }
      }
      if (bench) {
        if (async) {
          call(bench, execute, async);
        } else {
          return true;
        }
      } else {
        options.onComplete.call(benches, last);
      }
      // when async the `return false` will cancel the rest of the "complete"
      // listeners because they were called above and when synchronous it will
      // end the while-loop
      return false;
    }

    // juggle arguments
    if (isClassOf(name, 'String')) {
      args = slice.call(arguments, 2);
    } else {
      options = extend(options, name);
      name = options.name;
      args = isArray(args = 'args' in options ? options.args : []) ? args : [args];
      queued = options.queued;
    }
    // async for use with Benchmark#run only
    if (name == 'run') {
      async = (args[0] == null ? Benchmark.prototype.DEFAULT_ASYNC :
        args[0]) && HAS_TIMEOUT_API;
    }
    // start iterating over the array
    if (bench = benches[0]) {
      options.onStart.call(benches, bench);
      if (async) {
        call(bench, execute, async);
      } else {
        result.length = 0;
        while (execute());
      }
    }
    return result;
  }

  /**
   * Modify a string by replacing named tokens with matching object property values.
   * @static
   * @member Benchmark
   * @param {String} string The string to modify.
   * @param {Object} object The template object.
   * @returns {String} The modified string.
   * @example
   *
   * Benchmark.interpolate('#{greet} #{who}!', {
   *   'greet': 'Hello',
   *   'who': 'world'
   * }); // -> 'Hello world!'
   */
  function interpolate(string, object) {
    string = string == null ? '' : string;
    forIn(object || { }, function(value, key) {
      string = string.replace(RegExp('#\\{' + key + '\\}', 'g'), String(value));
    });
    return string;
  }

  /**
   * Determines if the given value is an array.
   * @static
   * @member Benchmark
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns true if value is an array, else false.
   */
  function isArray(value) {
    return isClassOf(value, 'Array');
  }

  /**
   * Checks if an object is of the specified class.
   * @static
   * @member Benchmark
   * @param {Object} object The object.
   * @param {String} name The name of the class.
   * @returns {Boolean} Returns true if of the class, else false.
   */
  function isClassOf(object, name) {
    return object != null && {}.toString.call(object).slice(8, -1) == name;
  }

  /**
   * Host objects can return type values that are different from their actual
   * data type. The objects we are concerned with usually return non-primitive
   * types of object, function, or unknown.
   * @static
   * @member Benchmark
   * @param {Mixed} object The owner of the property.
   * @param {String} property The property name to check.
   * @returns {Boolean} Returns true if the property value is a non-primitive, else false.
   */
  function isHostType(object, property) {
    return !/^(?:boolean|number|string|undefined)$/
      .test(typeof object[property]) && !!object[property];
  }

  /**
   * Creates a string of joined array values or object key-value pairs.
   * @static
   * @member Benchmark
   * @param {Array|Object} object The object to operate on.
   * @param {String} [separator1=','] The separator used between key-value pairs.
   * @param {String} [separator2=': '] The separator used between keys and values.
   * @returns {String} The joined result.
   */
  function join(object, separator1, separator2) {
    var pairs = [];
    if (isArray(object)) {
      pairs = object;
    }
    else {
      separator2 || (separator2 = ': ');
      forIn(object, function(value, key) {
        pairs.push(key + separator2 + value);
      });
    }
    return pairs.join(separator1 || ',');
  }

  /**
   * A generic bare-bones `Array#map` solution.
   * @static
   * @member Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function called per iteration.
   * @returns {Array} A new array of values returned by the callback.
   */
  function map(array, callback) {
    return reduce(array, function(result, value, index) {
      result.push(callback(value, index, array));
      return result;
    }, []);
  }

  /**
   * A no-operation function.
   * @static
   * @member Benchmark
   */
  function noop() {
    // no operation performed
  }

  /**
   * Retrieves the value of a specified property from all items in an array.
   * @static
   * @member Benchmark
   * @param {Array} array The array to iterate over.
   * @param {String} property The property to pluck.
   * @returns {Array} A new array of property values.
   */
  function pluck(array, property) {
    return map(array, function(object) {
      return object[property];
    });
  }

  /**
   * A generic bare-bones `Array#reduce` solution.
   * @static
   * @member Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} accumulator Initial value of the accumulator.
   * @returns {Mixed} The accumulator.
   */
  function reduce(array, callback, accumulator) {
    each(array, function(value, index) {
      accumulator = callback(accumulator, value, index, array);
    });
    return accumulator;
  }

  /**
   * A generic bare-bones `String#trim` solution.
   * @static
   * @member Benchmark
   * @param {String} string The string to trim.
   * @returns {String} The trimmed string.
   */
  function trim(string) {
    return string.replace(/^\s+/, '').replace(/\s+$/, '');
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Aborts all benchmarks in the suite.
   * @name abort
   * @member Benchmark.Suite
   * @returns {Object} The suite instance.
   */
  function abortSuite() {
    var me = this;
    me.aborted = true;
    me.running = false;
    invoke(me, 'abort');
    me.emit('abort');
    return me;
  }

  /**
   * Adds a test to the benchmark suite.
   * @member Benchmark.Suite
   * @param {String} name A name to identify the benchmark.
   * @param {Function} fn The test to benchmark.
   * @param {Object} [options={}] Options object.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // basic usage
   * suite.add(fn);
   *
   * // or using a name first
   * suite.add('foo', fn);
   *
   * // or with options
   * suite.add('foo', fn, {
   *   'onCycle': onCycle,
   *   'onComplete': onComplete
   * });
   */
  function add(name, fn, options) {
    var me = this,
        bench = new Benchmark(HEADLESS);

    Benchmark.call(bench, name, fn, options);
    me.push(bench);
    me.emit('add', bench);
    return me;
  }

  /**
   * Creates a new suite with cloned benchmarks.
   * @name clone
   * @member Benchmark.Suite
   * @param {Object} options Options object to overwrite cloned options.
   * @returns {Object} The new suite instance.
   */
  function cloneSuite(options) {
    var me = this,
        result = new me.constructor(extend(extend({ }, me.options), options));
    // copy own properties
    forIn(me, function(value, key) {
      if (!hasKey(result, key)) {
        result[key] = /^\d+$/.test(key) ? value.clone() : value;
      }
    });
    return result.reset();
  }

  /**
   * A bare-bones `Array#filter` solution.
   * @name filter
   * @member Benchmark.Suite
   * @param {Function|String} callback The function/alias called per iteration.
   * @returns {Object} A new suite of benchmarks that passed callback filter.
   */
  function filterSuite(callback) {
    var me = this,
        result = new me.constructor;

    result.push.apply(result, filter(me, callback));
    return result;
  }

  /**
   * Resets all benchmarks in the suite.
   * @name reset
   * @member Benchmark.Suite
   * @returns {Object} The suite instance.
   */
  function resetSuite() {
    var me = this;
    me.aborted = me.running = false;
    invoke(me, 'reset');
    me.emit('reset');
    return me;
  }

  /**
   * Runs the suite.
   * @name run
   * @member Benchmark.Suite
   * @param {Boolean} [async=false] Flag to run asynchronously.
   * @param {Boolean} [queued=false] Flag to treat benchmarks as a queue.
   * @returns {Object} The suite instance.
   */
  function runSuite(async, queued) {
    var me = this;
    me.reset();
    me.running = true;
    invoke(me, {
      'name': 'run',
      'args': async,
      'queued': queued,
      'onStart': function(bench) {
        me.emit('start', bench);
      },
      'onCycle': function(bench) {
        if (bench.error) {
          me.emit('error', bench);
        }
        return !me.aborted && me.emit('cycle', bench);
      },
      'onComplete': function(bench) {
        me.running = false;
        me.emit('complete', bench);
      }
    });
    return me;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Registers a single listener of a specified event type.
   * @member Benchmark, Benchmark.Suite
   * @param {String} type The event type.
   * @param {Function} listener The function called when the event occurs.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // basic usage
   * bench.addListener('cycle', listener);
   *
   * // register a listener for multiple event types
   * bench.addListener('start cycle', listener);
   */
  function addListener(type, listener) {
    var me = this,
        events = me.events || (me.events = { });

    each(type.split(' '), function(type) {
      (events[type] || (events[type] = [])).push(listener);
    });
    return me;
  }

  /**
   * Executes all registered listeners of a specified event type.
   * @member Benchmark, Benchmark.Suite
   * @param {String} type The event type.
   */
  function emit(type) {
    var me = this,
        args = slice.call(arguments, 1),
        events = me.events,
        listeners = events && events[type] || [],
        successful = true;

    each(listeners, function(listener) {
      if (listener.apply(me, args) === false) {
        successful = false;
        return successful;
      }
    });
    return successful;
  }

  /**
   * Unregisters a single listener of a specified event type.
   * @member Benchmark, Benchmark.Suite
   * @param {String} type The event type.
   * @param {Function} listener The function to unregister.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // basic usage
   * bench.removeListener('cycle', listener);
   *
   * // unregister a listener for multiple event types
   * bench.removeListener('start cycle', listener);
   */
  function removeListener(type, listener) {
    var me = this,
        events = me.events;

    each(type.split(' '), function(type) {
      var listeners = events && events[type] || [],
          index = indexOf(listeners, listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    });
    return me;
  }

  /**
   * Unregisters all listeners of a specified event type.
   * @member Benchmark, Benchmark.Suite
   * @param {String} type The event type.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // basic usage
   * bench.removeAllListeners('cycle');
   *
   * // unregister all listeners for multiple event types
   * bench.removeListener('start cycle');
   */
  function removeAllListeners(type) {
    var me = this,
        events = me.events;

    each(type.split(' '), function(type) {
      (events && events[type] || []).length = 0;
    });
    return me;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Aborts the benchmark without recording times.
   * @member Benchmark
   * @returns {Object} The benchmark instance.
   */
  function abort() {
    var me = this;
    if (me.running) {
      if (me.timerId && HAS_TIMEOUT_API) {
        clearTimeout(me.timerId);
        delete me.timerId;
      }
      // set running as NaN so reset() will detect it as falsey and *not* call abort(),
      // but *will* detect it as a change and fire the onReset() callback
      me.running = NaN;
      me.reset();
      me.aborted = true;
      me.emit('abort');
    }
    return me;
  }

  /**
   * Creates a new benchmark using the same test and options.
   * @member Benchmark
   * @param {Object} options Options object to overwrite cloned options.
   * @returns {Object} The new benchmark instance.
   * @example
   *
   * var bizarro = bench.clone({
   *   'name': 'doppelganger'
   * });
   */
  function clone(options) {
    var me = this,
        result = new me.constructor(me.fn, extend(extend({ }, me.options), options));
    // copy own properties
    forIn(me, function(value, key) {
      if (!hasKey(result, key)) {
        result[key] = value;
      }
    });
    return result.reset();
  }

  /**
   * Determines if the benchmark's period is smaller than another.
   * @member Benchmark
   * @param {Object} other The benchmark to compare.
   * @returns {Number} Returns `1` if smaller, `-1` if larger, and `0` if indeterminate.
   */
  function compare(other) {
    // use welch t-test
    // http://en.wikipedia.org/wiki/Student's_t-test
    // http://www.chem.utoronto.ca/coursenotes/analsci/StatsTutorial/12tailed.html
    var a  = this.stats,
        b  = other.stats,
        va = a.variance,
        vb = b.variance,
        df = pow(va + vb, 2) / ((pow(va, 2) / a.size - 1) + (pow(vb, 2) / b.size - 1)),
        t  = (a.mean - b.mean) / sqrt(va + vb);

    // check if t-statistic is significant
    return abs(t) > getCriticalValue(df) ? (t > 0 ? -1 : 1) : 0;
  }

  /**
   * Reset properties and abort if running.
   * @member Benchmark
   * @returns {Object} The benchmark instance.
   */
  function reset() {
    var changed,
        pair,
        me = this,
        source = extend(extend({ }, me.constructor.prototype), me.options),
        pairs = [[source, me]];

    function check(value, key) {
      var other = pair[1][key];
      if (value && isClassOf(value, 'Object')) {
        pairs.push([value, other]);
      }
      else if (!isClassOf(value, 'Function') &&
          key != 'created' && value != other) {
        pair[1][key] = value;
        changed = true;
      }
    }

    if (me.running) {
      // no worries, reset() is called within abort()
      me.abort();
      me.aborted = source.aborted;
    }
    else {
      // check if properties have changed and reset them
      while (pairs.length) {
        pair = pairs.pop();
        (isArray(pair[0]) ? each : forIn)(pair[0], check);
      }
      if (changed) {
        me.emit('reset');
      }
    }
    return me;
  }

  /**
   * Displays relevant benchmark information when coerced to a string.
   * @member Benchmark
   */
  function toString() {
    var me = this,
        cycles = me.cycles,
        error = me.error,
        pm = IN_JAVA ? '\xf1' : '\xb1',
        x = IN_JAVA ? 'x' : '\xd7',
        result = me.name || me.id || ('<Test #' + me.fn.uid + '>');

    if (error) {
      result += ': ' + join(error);
    } else {
      result += ' ' + x + ' ' + formatNumber(me.hz) + ' ' + pm +
        me.stats.RME.toFixed(2) + '% (' + cycles + ' cycle' + (cycles == 1 ? '' : 's') + ')';
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Computes stats on benchmark results.
   * @private
   * @param {Object} me The benchmark instance.
   * @param {Boolean} [async=false] Flag to run asynchronously.
   */
  function compute(me, async) {
    var queue = [],
        sample = [],
        runCount = me.INIT_RUN_COUNT;

    function enqueue(count) {
      while (count--) {
        queue.push(me.clone({
          'computing': true,
          'events': { 'start': [update], 'cycle': [update] }
        }));
      }
    }

    function update() {
      // port changes from clone to host
      var clone = this;
      if (me.running) {
        if (clone.cycles) {
          me.count = clone.count;
          me.cycles += clone.cycles;
          me.hz = clone.hz;
          me.times.period = clone.times.period;
          me.INIT_RUN_COUNT = clone.INIT_RUN_COUNT;
          me.emit('cycle');
        }
        else if (clone.error) {
          me.abort();
          me.error = clone.error;
          me.emit('error');
        }
        else {
          // on start
          clone.count = me.INIT_RUN_COUNT;
        }
      } else if (me.aborted) {
        clone.abort();
      }
    }

    function evaluate(clone) {
      var mean,
          moe,
          rme,
          sd,
          variance,
          now = +new Date,
          times = me.times,
          aborted = me.aborted,
          elapsed = (now - times.start) / 1e3,
          maxedOut = elapsed >= me.MAX_TIME_ELAPSED,
          size = sample.push(clone.times.period),
          sumOf = function(sum, x) { return sum + x; },
          varOf = function(sum, x) { return sum + pow(x - mean, 2); };

      // exit early for aborted or unclockable tests
      if (aborted || clone.hz == Infinity) {
         maxedOut = !(size = sample.length = queue.length = 0);
      }
      // simulate onComplete and enqueue additional runs if needed
      if (queue.length < 2) {
        // sample mean (estimate of the population mean)
        mean = reduce(sample, sumOf, 0) / size || 0;
        // sample variance (estimate of the population variance)
        variance = reduce(sample, varOf, 0) / (size - 1);
        // variance of the sampling distribution of the sample mean
        variance = variance / size || 0;
        // standard deviation of the sampling distribution of the sample mean (aka the standard error of the mean)
        sd = sqrt(variance);
        // margin of error
        moe = sd * getCriticalValue(size - 1);
        // relative margin of error
        rme = (moe / mean) * 100 || 0;

        // if time permits, increase sample size to reduce the margin of error
        if (!maxedOut) {
          enqueue(1);
        }
        else {
          // set host values
          if (!aborted) {
            me.running = false;
            times.stop = now;
            times.elapsed = elapsed;
            extend(me.stats, {
              'ME': moe,
              'RME': rme,
              'deviation': sd,
              'mean': mean,
              'size': size,
              'variance': variance
            });

            if (me.hz != Infinity) {
              times.period = mean;
              times.cycle = mean * me.count;
              me.hz = 1 / mean;
            }
          }
          me.INIT_RUN_COUNT = runCount;
          me.emit('complete');
        }
      }
      return !aborted;
    }

    // init sample/queue and begin
    enqueue(sample.length ? 1 : me.MIN_SAMPLE_SIZE);
    invoke(queue, { 'name': 'run', 'args': async, 'queued': true, 'onCycle': evaluate });
  }

  /**
   * Runs the benchmark.
   * @member Benchmark
   * @param {Boolean} [async=false] Flag to run asynchronously.
   * @returns {Object} The benchmark instance.
   */
  function run(async) {
    var me = this;

    function cycle() {
      var clocked,
          divisor,
          minTime,
          period,
          count = me.count,
          times = me.times;

      // continue, if not aborted between cycles
      if (me.running) {
        me.cycles++;
        try {
          clocked = clock(me);
          minTime = me.MIN_TIME;
        } catch(e) {
          me.abort();
          me.error = e;
          me.emit('error');
        }
      }
      // continue, if not errored
      if (me.running) {
        // time taken to complete last test cycle
        times.cycle = clocked;
        // seconds per operation
        period = times.period = clocked / count;
        // ops per second
        me.hz = 1 / period;
        // do we need to do another cycle?
        me.running = clocked < minTime;
        // avoid working our way up to this next time
        me.INIT_RUN_COUNT = count;

        if (me.running) {
          // tests may clock at 0 when INIT_RUN_COUNT is a small number,
          // to avoid that we set its count to something a bit higher
          if (!clocked && (divisor = CYCLE_DIVISORS[me.cycles]) != null) {
            count = Math.floor(4e6 / divisor);
          }
          // calculate how many more iterations it will take to achive the MIN_TIME
          if (count <= me.count) {
            count += Math.ceil((minTime - clocked) / period);
          }
          me.running = count != Infinity;
        }
      }
      // should we exit early?
      if (me.emit('cycle') === false) {
        me.abort();
      }
      // figure out what to do next
      if (me.running) {
        me.count = count;
        call(me, cycle, async);
      } else {
        me.emit('complete');
      }
    }

    // set running to false so reset() won't call abort()
    me.running = false;
    me.reset();
    me.running = true;

    me.count = me.INIT_RUN_COUNT;
    me.times.start = +new Date;
    me.emit('start');

    async = (async == null ? me.DEFAULT_ASYNC : async) && HAS_TIMEOUT_API;
    if (me.computing) {
      cycle();
    } else {
      compute(me, async);
    }
    return me;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Platform object containing browser name, version, and operating system.
   * @static
   * @member Benchmark
   * @type Boolean
   */
  Benchmark.platform = (function() {
    var me = this,
        alpha = IN_JAVA ? '\xe0' : '\u03b1',
        beta = IN_JAVA ? '\xe1' : '\u03b2',
        description = [],
        doc = window.document || {},
        nav = window.navigator || {},
        ua = nav.userAgent || 'unknown platform',
        layout = /Gecko|Trident|WebKit/.exec(ua),
        data = { '6.1': '7', '6.0': 'Vista', '5.2': 'Server 2003 / XP x64', '5.1': 'XP', '5.0': '2000', '4.0': 'NT', '4.9': 'ME' },
        name = 'Avant Browser,Camino,Epiphany,Fennec,Flock,Galeon,GreenBrowser,iCab,Iron,K-Meleon,Konqueror,Lunascape,Maxthon,Minefield,Nook Browser,RockMelt,SeaMonkey,Sleipnir,SlimBrowser,Sunrise,Swiftfox,Opera,Chrome,Firefox,IE,Safari',
        os = 'Android,webOS[ /]\\d,Linux,Mac OS(?: X)?,Macintosh,Windows 98;,Windows ',
        product = 'BlackBerry\\s?\\d+,iP[ao]d,iPhone,Kindle,Nook',
        version = isClassOf(window.opera, 'Opera') && opera.version();

    function capitalize(string) {
      return /^(?:webOS|i(?:OS|P))/.test(string) ? string :
        string.charAt(0).toUpperCase() + string.slice(1);
    }

    name = reduce(name.split(','), function(name, guess) {
      return name || (name = RegExp(guess + '\\b', 'i').exec(ua) && guess);
    });

    product = reduce(product.split(','), function(product, guess) {
      return product || (product = RegExp(guess + '[^ ();-]*', 'i').exec(ua));
    });

    os = reduce(os.split(','), function(os, guess) {
      if (!os && (os = RegExp(guess + '[^();/-]*').exec(ua))) {
        // platform tokens defined at
        // http://msdn.microsoft.com/en-us/library/ms537503(VS.85).aspx
        if (/Windows/.test(os) && (data = data[0/*opera fix*/,/[456]\.\d/.exec(os)])) {
          os = 'Windows ' + data;
        }
        // normalize iOS
        else if (/^iP/.test(product)) {
          name || (name = 'Safari');
          os = 'iOS' + ((data = /\bOS ([\d_]+)/.exec(ua)) ? ' ' + data[1] : '');
        }
        // avoid detecting an OS for products
        else if (product) {
          return null;
        }
        // linux <3s underscores
        if (!/Linux/.test(os)) {
          os = String(os).replace(/_/g, '.');
        }
        // cleanup
        if (/Mac/.test(os)) {
          os = String(os).replace(/ Mach$/, '').replace('Macintosh', 'Mac OS');
        }
        os = String(os).replace(/\/(\d)/, ' $1').split(' on ')[0];
      }
      return os;
    });

    // detect non Opera versions
    version = reduce(['version', name, 'Firefox', 'NetFront'], function(version, guess) {
      return version || (version = (RegExp(guess + '(?:-[\\d.]+/|[ /-])([^ ();/-]*)', 'i').exec(ua) || 0)[1]) || null;
    }, version);

    // cleanup product
    if (product) {
      product = (data = String(product).split('/'))[0];
      if (data = data[1]) {
        if (/\d+/.test(product)) {
          version = version || data;
        } else {
          product += ' ' + data;
        }
      }
      product = capitalize(trim(product.replace(/([a-z])(\d)/i, '$1 $2').split('-')[0]));
    }
    // detect server-side js
    if (me && isHostType(me, 'global')) {
      if (typeof exports == 'object' && exports) {
        if (me == window && typeof system == 'object' && system) {
          name = system.global == global ? 'Narwhal' : 'RingoJS';
          os = system.os || null;
        }
        else if (typeof process == 'object' && (data = process)) {
          name = 'Node.js';
          version = /[\d.]+/.exec(data.version)[0];
          os = data.platform;
        }
      } else if (isClassOf(me.environment, 'Environment')) {
        name = 'Rhino';
      }
      if (IN_JAVA && !os) {
        os = String(java.lang.System.getProperty('os.name'));
      }
    }
    // detect non Safari WebKit based browsers
    else if ((data = product || os) && (!name || name == 'Safari' && !/(?:^iP|Linux|Mac OS|Windows)/.test(data))) {
      name = /[a-z]+/i.exec(data) + ' Browser';
    }
    // detect IE compatibility mode
    else if (typeof doc.documentMode == 'number' && (data = /Trident\/(\d+)/.exec(ua))) {
      version = [version, doc.documentMode];
      version[1] = (data = +data[1] + 4) != version[1] ? (layout = null, description.push('running in IE ' + version[1] + ' mode'), data) : version[1];
      version = name == 'IE' ? String(version[1].toFixed(1)) : version[0];
    }
    // detect release phases
    if (version && (data = /(?:[ab]|dp|pre|[ab]\dpre)\d?\+?$/i.exec(version) || /(?:alpha|beta) ?\d?/i.exec(ua + ';' + nav.appMinorVersion))) {
      version = version.replace(RegExp(data + '\\+?$'), '') + (/^b/i.test(data) ? beta : alpha) + (/\d+\+?/.exec(data) || '');
    }
    // detect Maxthon's unreliable version info
    if (name == 'Maxthon') {
      version = version && version.replace(/\.[.\d]*/, '.x');
    }
    // detect Firefox nightly
    else if (name == 'Minefield') {
      name = 'Firefox';
      version = RegExp(alpha + '|' + beta + '|null').test(version) ? version : version + alpha;
    }
    // detect mobile
    else if (name && !product && !/Browser/.test(name) && /Mobi/.test(ua)) {
      name += ' Mobile';
    }
    // detect unspecified Safari versions
    if (data = (/Safari\/(\d+)/.exec(ua) || /AppleWebKit\/(\d+)/.exec(ua) || 0)[1]) {
      data = data < 400 ? '1.x' : data < 500 ? '2.x' : data < 526 ? '3.x' : data < 533 ? '4.x' : '4+';
      version = name == 'Safari' && (!version || parseInt(version) > 45) ? data : version;
      layout = 'like Safari ' + data;
    }
    // detect platform preview
    if (RegExp(alpha + '|' + beta).test(version) && typeof external == 'object' && !external) {
      layout = layout && !/like /.test(layout) ? 'rendered by ' + layout : layout;
      description.unshift('platform preview');
    }
    // add engine information
    if (layout && /Browser|Lunascape|Maxthon|Sleipnir/.test(name)) {
      description.push(layout);
    }
    // add contextual information
    if (description.length) {
      description = ['(' + description.join('; ') + ')'];
    }
    // add product to description
    if (product && String(name).indexOf(product) < 0) {
      description.push('on ' + product);
    }
    // cleanup os
    os = os && trim(/^iOS/.test(os = String(os)) ? os : capitalize(os));

    return {
      'version': name && version && description.unshift(version) && version,
      'name': name && description.unshift(name) && name,
      'os': os && description.push((product ? '' : 'on ') + os) && os,
      'product': product,
      'description': description.length ? description.join(' ') : ua,
      'toString': function() { return this.description; }
    };
  }());

  /*--------------------------------------------------------------------------*/

  extend(Benchmark, {

    /**
     * The version number.
     * @static
     * @member Benchmark
     * @type String
     */
    'version': '0.1.341',

    // generic Array#forEach
    'each': each,

    // copy properties to another object
    'extend': extend,

    // generic Array#filter
    'filter': filter,

    // iterate over an object's direct properties
    'forIn': forIn,

    // converts a number to a comma-separated string
    'formatNumber': formatNumber,

    // xbrowser Object#hasOwnProperty
    'hasKey': hasKey,

    // generic Array#indexOf
    'indexOf': indexOf,

    // invokes a method on each item in an array
    'invoke': invoke,

    // modifies a string using a template object
    'interpolate': interpolate,

    // xbrowser Array.isArray
    'isArray': isArray,

    // checks internal [[Class]] of an object
    'isClassOf': isClassOf,

    // checks if an object's property is a non-primitive value
    'isHostType': isHostType,

    // generic Array#join for arrays and objects
    'join': join,

    // generic Array#map
    'map': map,

    // no operation
    'noop': noop,

    // retrieves a property value from each item in an array
    'pluck': pluck,

    // generic Array#reduce
    'reduce': reduce,

    // generic String#trim
    'trim': trim
  });

  /*--------------------------------------------------------------------------*/

  // IE may ignore `toString` in a for-in loop
  Benchmark.prototype.toString = toString;

  extend(Benchmark.prototype, {

    /**
     * The delay between test cycles (secs).
     * @member Benchmark
     * @type Number
     */
    'CYCLE_DELAY': 0.005,

    /**
     * A flag to indicate methods will run asynchronously by default.
     * @member Benchmark
     * @type Boolean
     */
    'DEFAULT_ASYNC': false,

    /**
     * A flag to indicate protection against large run counts if Infinity ops/sec is detected.
     * @member Benchmark
     * @type Boolean
     */
    'DETECT_INFINITY': true,

    /**
     * The default number of times to execute a test on a benchmark's first cycle.
     * @member Benchmark
     * @type Number
     */
    'INIT_RUN_COUNT': 5,

    /**
     * The maximum time a benchmark is allowed to run before finishing (secs).
     * @member Benchmark
     * @type Number
     */
    'MAX_TIME_ELAPSED': 5,

    /**
     * The minimum sample size required to perform statistical analysis.
     * @member Benchmark
     * @type Number
     */
    'MIN_SAMPLE_SIZE': 5,

    /**
     * The time needed to reduce the percent uncertainty of measurement to 1% (secs).
     * @member Benchmark
     * @type Number
     */
    'MIN_TIME': 0,

    /**
     * The number of times a test was executed.
     * @member Benchmark
     * @type Number
     */
    'count': 0,

    /**
     * A timestamp of when the benchmark was created.
     * @member Benchmark
     * @type Number
     */
    'created': 0,

    /**
     * The number of cycles performed while benchmarking.
     * @member Benchmark
     * @type Number
     */
    'cycles': 0,

    /**
     * The error object if the test failed.
     * @member Benchmark
     * @type Object|Null
     */
    'error': null,

    /**
     * The number of executions per second.
     * @member Benchmark
     * @type Number
     */
    'hz': 0,

    /**
     * A flag to indicate if the benchmark is aborted.
     * @member Benchmark
     * @type Boolean
     */
    'aborted': false,

    /**
     * A flag to indicate if the benchmark is running.
     * @member Benchmark
     * @type Boolean
     */
    'running': false,

    /**
     * Alias of [`Benchmark#addListener`](#addListener).
     * @member Benchmark, Benchmark.Suite
     */
    'on': addListener,

    /**
     * An object of stats including mean, margin or error, and standard deviation.
     * @member Benchmark
     * @type Object
     */
    'stats': {

      /**
       * The margin of error.
       * @member Benchmark#stats
       * @type Number
       */
      'ME': 0,

      /**
       * The relative margin of error (expressed as a percentage of the mean).
       * @member Benchmark#stats
       * @type Number
       */
      'RME': 0,

      /**
       * The sample standard deviation.
       * @member Benchmark#stats
       * @type Number
       */
      'deviation': 0,

      /**
       * The sample arithmetic mean.
       * @member Benchmark#stats
       * @type Number
       */
      'mean': 0,

      /**
       * The sample size.
       * @member Benchmark#stats
       * @type Number
       */
      'size': 0,

      /**
       * The sample variance.
       * @member Benchmark#stats
       * @type Number
       */
      'variance': 0
    },

    /**
     * An object of timing data including cycle, elapsed, period, start, and stop.
     * @member Benchmark
     * @type Object
     */
    'times': {

      /**
       * The time taken to complete the last cycle (secs)
       * @member Benchmark#times
       * @type Number
       */
      'cycle': 0,

      /**
       * The time taken to complete the benchmark (secs).
       * @member Benchmark#times
       * @type Number
       */
      'elapsed': 0,

      /**
       * The time taken to execute the test once (secs).
       * @member Benchmark#times
       * @type Number
       */
      'period': 0,

      /**
       * A timestamp of when the benchmark started (ms).
       * @member Benchmark#times
       * @type Number
       */
      'start': 0,

      /**
       * A timestamp of when the benchmark finished (ms).
       * @member Benchmark#times
       * @type Number
       */
      'stop': 0
    },

    // aborts benchmark (does not record times)
    'abort': abort,

    // registers a single listener
    'addListener': addListener,

    // creates a new benchmark using the same test and options
    'clone': clone,

    // compares benchmark's hertz with another
    'compare': compare,

    // executes listeners of a specified type
    'emit': emit,

    // removes all listeners of a specified type
    'removeAllListeners': removeAllListeners,

    // removes a single listener
    'removeListener': removeListener,

    // reset benchmark properties
    'reset': reset,

    // runs the benchmark
    'run': run,

    // used to perform operations immediately before the test loop
    'setup': noop,

    // used to perform operations immediately after the test loop
    'teardown': noop
  });

  /*--------------------------------------------------------------------------*/

  extend(Suite.prototype, {

    /**
     * The number of benchmarks in the suite.
     * @member Benchmark.Suite
     * @type Number
     */
    'length': 0,

    /**
     * A flag to indicate if the suite is aborted.
     * @member Benchmark.Suite
     * @type Boolean
     */
    'aborted': false,

    /**
     * A flag to indicate if the suite is running.
     * @member Benchmark.Suite
     * @type Boolean
     */
    'running': false,

    /**
     * A bare-bones `Array#forEach` solution.
     * Callbacks may terminate the loop by explicitly returning `false`.
     * @member Benchmark.Suite
     * @param {Function} callback The function called per iteration.
     * @returns {Object} The suite iterated over.
     */
    'each': methodize(each),

    /**
     * A bare-bones `Array#indexOf` solution.
     * @member Benchmark.Suite
     * @param {Mixed} value The value to search for.
     * @returns {Number} The index of the matched value or `-1`.
     */
    'indexOf': methodize(indexOf),

    /**
     * Invokes a method on all benchmarks in the suite.
     * @member Benchmark.Suite
     * @param {String|Object} name The name of the method to invoke OR options object.
     * @param {Mixed} [, arg1, arg2, ...] Arguments to invoke the method with.
     * @returns {Array} A new array of values returned from each method invoked.
     */
    'invoke': methodize(invoke),

    /**
     * A bare-bones `Array#map` solution.
     * @member Benchmark.Suite
     * @param {Function} callback The function called per iteration.
     * @returns {Array} A new array of values returned by the callback.
     */
    'map': methodize(map),

    /**
     * Retrieves the value of a specified property from all benchmarks in the suite.
     * @member Benchmark.Suite
     * @param {String} property The property to pluck.
     * @returns {Array} A new array of property values.
     */
    'pluck': methodize(pluck),

    /**
     * A bare-bones `Array#reduce` solution.
     * @member Benchmark.Suite
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} accumulator Initial value of the accumulator.
     * @returns {Mixed} The accumulator.
     */
    'reduce': methodize(reduce),

    // aborts all benchmarks in the suite
    'abort': abortSuite,

    // adds a benchmark to the suite
    'add': add,

    // registers a single listener
    'addListener': addListener,

    // creates a new suite with cloned benchmarks
    'clone': cloneSuite,

    // executes listeners of a specified type
    'emit': emit,

    // creates a new suite of filtered benchmarks
    'filter': filterSuite,

    // alias of addListener
    'on': addListener,

    // removes all listeners of a specified type
    'removeAllListeners': removeAllListeners,

    // removes a single listener
    'removeListener': removeListener,

    // resets all benchmarks in the suite
    'reset': resetSuite,

    // runs all benchmarks in the suite
    'run': runSuite,

    // array methods
    'concat': [].concat,

    'join': [].join,

    'pop': aloClean([].pop),

    'push': [].push,

    'reverse': [].reverse,

    'shift': shift,

    'slice': slice,

    'sort': [].sort,

    'splice': aloClean([].splice),

    'unshift': [].unshift
  });

  /*--------------------------------------------------------------------------*/

  // expose Suite
  Benchmark.Suite = Suite;

  // expose Benchmark
  if (typeof exports == 'object' && exports && typeof global == 'object' && global) {
    window = global;
    if (typeof module == 'object' && module && module.exports == exports) {
      module.exports = Benchmark;
    } else {
      exports.Benchmark = Benchmark;
    }
  } else {
    window.Benchmark = Benchmark;
  }

  // feature detect
  HAS_TIMEOUT_API = isHostType(window, 'setTimeout') &&
    isHostType(window, 'clearTimeout');

}(this));