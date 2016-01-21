var fabric = fabric || {
  version: "1.4.2"
};
if (typeof exports !== 'undefined') {
  exports.fabric = fabric;
}
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  fabric.document = document;
  fabric.window = window;
} else {
  fabric.document = require("jsdom").jsdom("<!DOCTYPE html><html><head></head><body></body></html>");
  fabric.window = fabric.document.createWindow();
}
fabric.isTouchSupported = "ontouchstart" in fabric.document.documentElement;
fabric.isLikelyNode = typeof Buffer !== 'undefined' && typeof window === 'undefined';
fabric.SHARED_ATTRIBUTES = ["transform", "fill", "fill-opacity", "fill-rule", "opacity", "stroke", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke-width"];
(function() {
  function _removeEventListener(eventName, handler) {
    if (!this.__eventListeners[eventName]) return;
    if (handler) {
      fabric.util.removeFromArray(this.__eventListeners[eventName], handler);
    } else {
      this.__eventListeners[eventName].length = 0;
    }
  }

  function observe(eventName, handler) {
    if (!this.__eventListeners) {
      this.__eventListeners = {};
    }
    if (arguments.length === 1) {
      for (var prop in eventName) {
        this.on(prop, eventName[prop]);
      }
    } else {
      if (!this.__eventListeners[eventName]) {
        this.__eventListeners[eventName] = [];
      }
      this.__eventListeners[eventName].push(handler);
    }
    return this;
  }

  function stopObserving(eventName, handler) {
    if (!this.__eventListeners) return;
    if (arguments.length === 0) {
      this.__eventListeners = {};
    } else if (arguments.length === 1 && typeof arguments[0] === 'object') {
      for (var prop in eventName) {
        _removeEventListener.call(this, prop, eventName[prop]);
      }
    } else {
      _removeEventListener.call(this, eventName, handler);
    }
    return this;
  }

  function fire(eventName, options) {
    if (!this.__eventListeners) return;
    var listenersForEvent = this.__eventListeners[eventName];
    if (!listenersForEvent) return;
    for (var i = 0, len = listenersForEvent.length; i < len; i++) {
      listenersForEvent[i].call(this, options || {});
    }
    return this;
  }
  fabric.Observable = {
    observe: observe,
    stopObserving: stopObserving,
    fire: fire,
    on: observe,
    off: stopObserving,
    trigger: fire
  };
})();
fabric.Collection = {
  add: function() {
    this._objects.push.apply(this._objects, arguments);
    for (var i = 0, length = arguments.length; i < length; i++) {
      this._onObjectAdded(arguments[i]);
    }
    this.renderOnAddRemove && this.renderAll();
    return this;
  },
  insertAt: function(object, index, nonSplicing) {
    var objects = this.getObjects();
    if (nonSplicing) {
      objects[index] = object;
    } else {
      objects.splice(index, 0, object);
    }
    this._onObjectAdded(object);
    this.renderOnAddRemove && this.renderAll();
    return this;
  },
  remove: function() {
    var objects = this.getObjects(),
      index;
    for (var i = 0, length = arguments.length; i < length; i++) {
      index = objects.indexOf(arguments[i]);
      if (index !== -1) {
        objects.splice(index, 1);
        this._onObjectRemoved(arguments[i]);
      }
    }
    this.renderOnAddRemove && this.renderAll();
    return this;
  },
  forEachObject: function(callback, context) {
    var objects = this.getObjects(),
      i = objects.length;
    while (i--) {
      callback.call(context, objects[i], i, objects);
    }
    return this;
  },
  getObjects: function(type) {
    if (typeof type === 'undefined') {
      return this._objects;
    }
    return this._objects.filter(function(o) {
      return o.type === type;
    });
  },
  item: function(index) {
    return this.getObjects()[index];
  },
  isEmpty: function() {
    return this.getObjects().length === 0;
  },
  size: function() {
    return this.getObjects().length;
  },
  contains: function(object) {
    return this.getObjects().indexOf(object) > -1;
  },
  complexity: function() {
    return this.getObjects().reduce(function(memo, current) {
      memo += current.complexity ? current.complexity() : 0;
      return memo;
    }, 0);
  }
};
(function(global) {
  var sqrt = Math.sqrt,
    atan2 = Math.atan2,
    PiBy180 = Math.PI / 180;
  fabric.util = {
    removeFromArray: function(array, value) {
      var idx = array.indexOf(value);
      if (idx !== -1) {
        array.splice(idx, 1);
      }
      return array;
    },
    getRandomInt: function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    degreesToRadians: function(degrees) {
      return degrees * PiBy180;
    },
    radiansToDegrees: function(radians) {
      return radians / PiBy180;
    },
    rotatePoint: function(point, origin, radians) {
      var sin = Math.sin(radians),
        cos = Math.cos(radians);
      point.subtractEquals(origin);
      var rx = point.x * cos - point.y * sin,
        ry = point.x * sin + point.y * cos;
      return new fabric.Point(rx, ry).addEquals(origin);
    },
    toFixed: function(number, fractionDigits) {
      return parseFloat(Number(number).toFixed(fractionDigits));
    },
    falseFunction: function() {
      return false;
    },
    getKlass: function(type, namespace) {
      type = fabric.util.string.camelize(type.charAt(0).toUpperCase() + type.slice(1));
      return fabric.util.resolveNamespace(namespace)[type];
    },
    resolveNamespace: function(namespace) {
      if (!namespace) return fabric;
      var parts = namespace.split('.'),
        len = parts.length,
        obj = global || fabric.window;
      for (var i = 0; i < len; ++i) {
        obj = obj[parts[i]];
      }
      return obj;
    },
    loadImage: function(url, callback, context, crossOrigin) {
      if (!url) {
        callback && callback.call(context, url);
        return;
      }
      var img = fabric.util.createImage();
      img.onload = function() {
        callback && callback.call(context, img);
        img = img.onload = img.onerror = null;
      };
      img.onerror = function() {
        fabric.log('Error loading ' + img.src);
        callback && callback.call(context, null, true);
        img = img.onload = img.onerror = null;
      };
      if (url.indexOf('data') !== 0 && typeof crossOrigin !== 'undefined') {
        img.crossOrigin = crossOrigin;
      }
      img.src = url;
    },
    enlivenObjects: function(objects, callback, namespace, reviver) {
      objects = objects || [];

      function onLoaded() {
        if (++numLoadedObjects === numTotalObjects) {
          callback && callback(enlivenedObjects);
        }
      }
      var enlivenedObjects = [],
        numLoadedObjects = 0,
        numTotalObjects = objects.length;
      if (!numTotalObjects) {
        callback && callback(enlivenedObjects);
        return;
      }
      objects.forEach(function(o, index) {
        if (!o || !o.type) {
          onLoaded();
          return;
        }
        var klass = fabric.util.getKlass(o.type, namespace);
        if (klass.async) {
          klass.fromObject(o, function(obj, error) {
            if (!error) {
              enlivenedObjects[index] = obj;
              reviver && reviver(o, enlivenedObjects[index]);
            }
            onLoaded();
          });
        } else {
          enlivenedObjects[index] = klass.fromObject(o);
          reviver && reviver(o, enlivenedObjects[index]);
          onLoaded();
        }
      });
    },
    groupSVGElements: function(elements, options, path) {
      var object;
      if (elements.length > 1) {
        object = new fabric.PathGroup(elements, options);
      } else {
        object = elements[0];
      }
      if (typeof path !== 'undefined') {
        object.setSourcePath(path);
      }
      return object;
    },
    populateWithProperties: function(source, destination, properties) {
      if (properties && Object.prototype.toString.call(properties) === '[object Array]') {
        for (var i = 0, len = properties.length; i < len; i++) {
          if (properties[i] in source) {
            destination[properties[i]] = source[properties[i]];
          }
        }
      }
    },
    drawDashedLine: function(ctx, x, y, x2, y2, da) {
      var dx = x2 - x,
        dy = y2 - y,
        len = sqrt(dx * dx + dy * dy),
        rot = atan2(dy, dx),
        dc = da.length,
        di = 0,
        draw = true;
      ctx.save();
      ctx.translate(x, y);
      ctx.moveTo(0, 0);
      ctx.rotate(rot);
      x = 0;
      while (len > x) {
        x += da[di++ % dc];
        if (x > len) {
          x = len;
        }
        ctx[draw ? 'lineTo' : 'moveTo'](x, 0);
        draw = !draw;
      }
      ctx.restore();
    },
    createCanvasElement: function(canvasEl) {
      canvasEl || (canvasEl = fabric.document.createElement('canvas'));
      if (!canvasEl.getContext && typeof G_vmlCanvasManager !== 'undefined') {
        G_vmlCanvasManager.initElement(canvasEl);
      }
      return canvasEl;
    },
    createImage: function() {
      return fabric.isLikelyNode ? new(require('canvas').Image)() : fabric.document.createElement('img');
    },
    createAccessors: function(klass) {
      var proto = klass.prototype;
      for (var i = proto.stateProperties.length; i--;) {
        var propName = proto.stateProperties[i],
          capitalizedPropName = propName.charAt(0).toUpperCase() + propName.slice(1),
          setterName = 'set' + capitalizedPropName,
          getterName = 'get' + capitalizedPropName;
        if (!proto[getterName]) {
          proto[getterName] = (function(property) {
            return new Function('return this.get("' + property + '")');
          })(propName);
        }
        if (!proto[setterName]) {
          proto[setterName] = (function(property) {
            return new Function('value', 'return this.set("' + property + '", value)');
          })(propName);
        }
      }
    },
    clipContext: function(receiver, ctx) {
      ctx.save();
      ctx.beginPath();
      receiver.clipTo(ctx);
      ctx.clip();
    },
    multiplyTransformMatrices: function(matrixA, matrixB) {
      var a = [
        [matrixA[0], matrixA[2], matrixA[4]],
        [matrixA[1], matrixA[3], matrixA[5]],
        [0, 0, 1]
      ];
      var b = [
        [matrixB[0], matrixB[2], matrixB[4]],
        [matrixB[1], matrixB[3], matrixB[5]],
        [0, 0, 1]
      ];
      var result = [];
      for (var r = 0; r < 3; r++) {
        result[r] = [];
        for (var c = 0; c < 3; c++) {
          var sum = 0;
          for (var k = 0; k < 3; k++) {
            sum += a[r][k] * b[k][c];
          }
          result[r][c] = sum;
        }
      }
      return [result[0][0], result[1][0], result[0][1], result[1][1], result[0][2], result[1][2]];
    },
    getFunctionBody: function(fn) {
      return (String(fn).match(/function[^{]*\{([\s\S]*)\}/) || {})[1];
    },
    normalizePoints: function(points, options) {
      var minX = fabric.util.array.min(points, 'x'),
        minY = fabric.util.array.min(points, 'y');
      minX = minX < 0 ? minX : 0;
      minY = minX < 0 ? minY : 0;
      for (var i = 0, len = points.length; i < len; i++) {
        points[i].x -= (options.width / 2 + minX) || 0;
        points[i].y -= (options.height / 2 + minY) || 0;
      }
    },
    isTransparent: function(ctx, x, y, tolerance) {
      if (tolerance > 0) {
        if (x > tolerance) {
          x -= tolerance;
        } else {
          x = 0;
        }
        if (y > tolerance) {
          y -= tolerance;
        } else {
          y = 0;
        }
      }
      var _isTransparent = true;
      var imageData = ctx.getImageData(x, y, (tolerance * 2) || 1, (tolerance * 2) || 1);
      for (var i = 3, l = imageData.data.length; i < l; i += 4) {
        var temp = imageData.data[i];
        _isTransparent = temp <= 0;
        if (_isTransparent === false) break;
      }
      imageData = null;
      return _isTransparent;
    }
  };
})(typeof exports !== 'undefined' ? exports : this);
(function() {
  var arcToSegmentsCache = {},
    segmentToBezierCache = {},
    _join = Array.prototype.join,
    argsString;

  function arcToSegments(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
    argsString = _join.call(arguments);
    if (arcToSegmentsCache[argsString]) {
      return arcToSegmentsCache[argsString];
    }
    var coords = getXYCoords(rotateX, rx, ry, ox, oy, x, y);
    var d = (coords.x1 - coords.x0) * (coords.x1 - coords.x0) +
      (coords.y1 - coords.y0) * (coords.y1 - coords.y0);
    var sfactor_sq = 1 / d - 0.25;
    if (sfactor_sq < 0) sfactor_sq = 0;
    var sfactor = Math.sqrt(sfactor_sq);
    if (sweep === large) sfactor = -sfactor;
    var xc = 0.5 * (coords.x0 + coords.x1) - sfactor * (coords.y1 - coords.y0);
    var yc = 0.5 * (coords.y0 + coords.y1) + sfactor * (coords.x1 - coords.x0);
    var th0 = Math.atan2(coords.y0 - yc, coords.x0 - xc);
    var th1 = Math.atan2(coords.y1 - yc, coords.x1 - xc);
    var th_arc = th1 - th0;
    if (th_arc < 0 && sweep === 1) {
      th_arc += 2 * Math.PI;
    } else if (th_arc > 0 && sweep === 0) {
      th_arc -= 2 * Math.PI;
    }
    var segments = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)));
    var result = [];
    for (var i = 0; i < segments; i++) {
      var th2 = th0 + i * th_arc / segments;
      var th3 = th0 + (i + 1) * th_arc / segments;
      result[i] = [xc, yc, th2, th3, rx, ry, coords.sin_th, coords.cos_th];
    }
    arcToSegmentsCache[argsString] = result;
    return result;
  }

  function getXYCoords(rotateX, rx, ry, ox, oy, x, y) {
    var th = rotateX * (Math.PI / 180);
    var sin_th = Math.sin(th);
    var cos_th = Math.cos(th);
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    var px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5;
    var py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5;
    var pl = (px * px) / (rx * rx) + (py * py) / (ry * ry);
    if (pl > 1) {
      pl = Math.sqrt(pl);
      rx *= pl;
      ry *= pl;
    }
    var a00 = cos_th / rx;
    var a01 = sin_th / rx;
    var a10 = (-sin_th) / ry;
    var a11 = (cos_th) / ry;
    return {
      x0: a00 * ox + a01 * oy,
      y0: a10 * ox + a11 * oy,
      x1: a00 * x + a01 * y,
      y1: a10 * x + a11 * y,
      sin_th: sin_th,
      cos_th: cos_th
    };
  }

  function segmentToBezier(cx, cy, th0, th1, rx, ry, sin_th, cos_th) {
    argsString = _join.call(arguments);
    if (segmentToBezierCache[argsString]) {
      return segmentToBezierCache[argsString];
    }
    var a00 = cos_th * rx;
    var a01 = -sin_th * ry;
    var a10 = sin_th * rx;
    var a11 = cos_th * ry;
    var th_half = 0.5 * (th1 - th0);
    var t = (8 / 3) * Math.sin(th_half * 0.5) * Math.sin(th_half * 0.5) / Math.sin(th_half);
    var x1 = cx + Math.cos(th0) - t * Math.sin(th0);
    var y1 = cy + Math.sin(th0) + t * Math.cos(th0);
    var x3 = cx + Math.cos(th1);
    var y3 = cy + Math.sin(th1);
    var x2 = x3 + t * Math.sin(th1);
    var y2 = y3 - t * Math.cos(th1);
    segmentToBezierCache[argsString] = [a00 * x1 + a01 * y1, a10 * x1 + a11 * y1, a00 * x2 + a01 * y2, a10 * x2 + a11 * y2, a00 * x3 + a01 * y3, a10 * x3 + a11 * y3];
    return segmentToBezierCache[argsString];
  }
  fabric.util.drawArc = function(ctx, x, y, coords) {
    var rx = coords[0];
    var ry = coords[1];
    var rot = coords[2];
    var large = coords[3];
    var sweep = coords[4];
    var ex = coords[5];
    var ey = coords[6];
    var segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, x, y);
    for (var i = 0; i < segs.length; i++) {
      var bez = segmentToBezier.apply(this, segs[i]);
      ctx.bezierCurveTo.apply(ctx, bez);
    }
  };
})();
(function() {
  var slice = Array.prototype.slice;
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement) {
      if (this === void 0 || this === null) {
        throw new TypeError();
      }
      var t = Object(this),
        len = t.length >>> 0;
      if (len === 0) {
        return -1;
      }
      var n = 0;
      if (arguments.length > 0) {
        n = Number(arguments[1]);
        if (n !== n) {
          n = 0;
        } else if (n !== 0 && n !== Number.POSITIVE_INFINITY && n !== Number.NEGATIVE_INFINITY) {
          n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
      }
      if (n >= len) {
        return -1;
      }
      var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
      for (; k < len; k++) {
        if (k in t && t[k] === searchElement) {
          return k;
        }
      }
      return -1;
    };
  }
  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fn, context) {
      for (var i = 0, len = this.length >>> 0; i < len; i++) {
        if (i in this) {
          fn.call(context, this[i], i, this);
        }
      }
    };
  }
  if (!Array.prototype.map) {
    Array.prototype.map = function(fn, context) {
      var result = [];
      for (var i = 0, len = this.length >>> 0; i < len; i++) {
        if (i in this) {
          result[i] = fn.call(context, this[i], i, this);
        }
      }
      return result;
    };
  }
  if (!Array.prototype.every) {
    Array.prototype.every = function(fn, context) {
      for (var i = 0, len = this.length >>> 0; i < len; i++) {
        if (i in this && !fn.call(context, this[i], i, this)) {
          return false;
        }
      }
      return true;
    };
  }
  if (!Array.prototype.some) {
    Array.prototype.some = function(fn, context) {
      for (var i = 0, len = this.length >>> 0; i < len; i++) {
        if (i in this && fn.call(context, this[i], i, this)) {
          return true;
        }
      }
      return false;
    };
  }
  if (!Array.prototype.filter) {
    Array.prototype.filter = function(fn, context) {
      var result = [],
        val;
      for (var i = 0, len = this.length >>> 0; i < len; i++) {
        if (i in this) {
          val = this[i];
          if (fn.call(context, val, i, this)) {
            result.push(val);
          }
        }
      }
      return result;
    };
  }
  if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(fn) {
      var len = this.length >>> 0,
        i = 0,
        rv;
      if (arguments.length > 1) {
        rv = arguments[1];
      } else {
        do {
          if (i in this) {
            rv = this[i++];
            break;
          }
          if (++i >= len) {
            throw new TypeError();
          }
        }
        while (true);
      }
      for (; i < len; i++) {
        if (i in this) {
          rv = fn.call(null, rv, this[i], i, this);
        }
      }
      return rv;
    };
  }

  function invoke(array, method) {
    var args = slice.call(arguments, 2),
      result = [];
    for (var i = 0, len = array.length; i < len; i++) {
      result[i] = args.length ? array[i][method].apply(array[i], args) : array[i][method].call(array[i]);
    }
    return result;
  }

  function max(array, byProperty) {
    return find(array, byProperty, function(value1, value2) {
      return value1 >= value2;
    });
  }

  function min(array, byProperty) {
    return find(array, byProperty, function(value1, value2) {
      return value1 < value2;
    });
  }

  function find(array, byProperty, condition) {
    if (!array || array.length === 0) return undefined;
    var i = array.length - 1,
      result = byProperty ? array[i][byProperty] : array[i];
    if (byProperty) {
      while (i--) {
        if (condition(array[i][byProperty], result)) {
          result = array[i][byProperty];
        }
      }
    } else {
      while (i--) {
        if (condition(array[i], result)) {
          result = array[i];
        }
      }
    }
    return result;
  }
  fabric.util.array = {
    invoke: invoke,
    min: min,
    max: max
  };
})();
(function() {
  function extend(destination, source) {
    for (var property in source) {
      destination[property] = source[property];
    }
    return destination;
  }

  function clone(object) {
    return extend({}, object);
  }
  fabric.util.object = {
    extend: extend,
    clone: clone
  };
})();
(function() {
  if (!String.prototype.trim) {
    String.prototype.trim = function() {
      return this.replace(/^[\s\xA0]+/, '').replace(/[\s\xA0]+$/, '');
    };
  }

  function camelize(string) {
    return string.replace(/-+(.)?/g, function(match, character) {
      return character ? character.toUpperCase() : '';
    });
  }

  function capitalize(string, firstLetterOnly) {
    return string.charAt(0).toUpperCase() +
      (firstLetterOnly ? string.slice(1) : string.slice(1).toLowerCase());
  }

  function escapeXml(string) {
    return string.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  fabric.util.string = {
    camelize: camelize,
    capitalize: capitalize,
    escapeXml: escapeXml
  };
}());
(function() {
  var slice = Array.prototype.slice,
    apply = Function.prototype.apply,
    Dummy = function() {};
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(thisArg) {
      var fn = this,
        args = slice.call(arguments, 1),
        bound;
      if (args.length) {
        bound = function() {
          return apply.call(fn, this instanceof Dummy ? this : thisArg, args.concat(slice.call(arguments)));
        };
      } else {
        bound = function() {
          return apply.call(fn, this instanceof Dummy ? this : thisArg, arguments);
        };
      }
      Dummy.prototype = this.prototype;
      bound.prototype = new Dummy();
      return bound;
    };
  }
})();
(function() {
  var slice = Array.prototype.slice,
    emptyFunction = function() {};
  var IS_DONTENUM_BUGGY = (function() {
    for (var p in {
        toString: 1
      }) {
      if (p === 'toString') return false;
    }
    return true;
  })();
  var addMethods = function(klass, source, parent) {
    for (var property in source) {
      if (property in klass.prototype && typeof klass.prototype[property] === 'function' && (source[property] + '').indexOf('callSuper') > -1) {
        klass.prototype[property] = (function(property) {
          return function() {
            var superclass = this.constructor.superclass;
            this.constructor.superclass = parent;
            var returnValue = source[property].apply(this, arguments);
            this.constructor.superclass = superclass;
            if (property !== 'initialize') {
              return returnValue;
            }
          };
        })(property);
      } else {
        klass.prototype[property] = source[property];
      }
      if (IS_DONTENUM_BUGGY) {
        if (source.toString !== Object.prototype.toString) {
          klass.prototype.toString = source.toString;
        }
        if (source.valueOf !== Object.prototype.valueOf) {
          klass.prototype.valueOf = source.valueOf;
        }
      }
    }
  };

  function Subclass() {}

  function callSuper(methodName) {
    var fn = this.constructor.superclass.prototype[methodName];
    return (arguments.length > 1) ? fn.apply(this, slice.call(arguments, 1)) : fn.call(this);
  }

  function createClass() {
    var parent = null,
      properties = slice.call(arguments, 0);
    if (typeof properties[0] === 'function') {
      parent = properties.shift();
    }

    function klass() {
      this.initialize.apply(this, arguments);
    }
    klass.superclass = parent;
    klass.subclasses = [];
    if (parent) {
      Subclass.prototype = parent.prototype;
      klass.prototype = new Subclass();
      parent.subclasses.push(klass);
    }
    for (var i = 0, length = properties.length; i < length; i++) {
      addMethods(klass, properties[i], parent);
    }
    if (!klass.prototype.initialize) {
      klass.prototype.initialize = emptyFunction;
    }
    klass.prototype.constructor = klass;
    klass.prototype.callSuper = callSuper;
    return klass;
  }
  fabric.util.createClass = createClass;
})();
(function() {
  var unknown = 'unknown';

  function areHostMethods(object) {
    var methodNames = Array.prototype.slice.call(arguments, 1),
      t, i, len = methodNames.length;
    for (i = 0; i < len; i++) {
      t = typeof object[methodNames[i]];
      if (!(/^(?:function|object|unknown)$/).test(t)) return false;
    }
    return true;
  }
  var getUniqueId = (function() {
    var uid = 0;
    return function(element) {
      return element.__uniqueID || (element.__uniqueID = 'uniqueID__' + uid++);
    };
  })();
  var getElement, setElement;
  (function() {
    var elements = {};
    getElement = function(uid) {
      return elements[uid];
    };
    setElement = function(uid, element) {
      elements[uid] = element;
    };
  })();

  function createListener(uid, handler) {
    return {
      handler: handler,
      wrappedHandler: createWrappedHandler(uid, handler)
    };
  }

  function createWrappedHandler(uid, handler) {
    return function(e) {
      handler.call(getElement(uid), e || fabric.window.event);
    };
  }

  function createDispatcher(uid, eventName) {
    return function(e) {
      if (handlers[uid] && handlers[uid][eventName]) {
        var handlersForEvent = handlers[uid][eventName];
        for (var i = 0, len = handlersForEvent.length; i < len; i++) {
          handlersForEvent[i].call(this, e || fabric.window.event);
        }
      }
    };
  }
  var shouldUseAddListenerRemoveListener = (areHostMethods(fabric.document.documentElement, 'addEventListener', 'removeEventListener') && areHostMethods(fabric.window, 'addEventListener', 'removeEventListener')),
    shouldUseAttachEventDetachEvent = (areHostMethods(fabric.document.documentElement, 'attachEvent', 'detachEvent') && areHostMethods(fabric.window, 'attachEvent', 'detachEvent')),
    listeners = {},
    handlers = {},
    addListener, removeListener;
  if (shouldUseAddListenerRemoveListener) {
    addListener = function(element, eventName, handler) {
      element.addEventListener(eventName, handler, false);
    };
    removeListener = function(element, eventName, handler) {
      element.removeEventListener(eventName, handler, false);
    };
  } else if (shouldUseAttachEventDetachEvent) {
    addListener = function(element, eventName, handler) {
      var uid = getUniqueId(element);
      setElement(uid, element);
      if (!listeners[uid]) {
        listeners[uid] = {};
      }
      if (!listeners[uid][eventName]) {
        listeners[uid][eventName] = [];
      }
      var listener = createListener(uid, handler);
      listeners[uid][eventName].push(listener);
      element.attachEvent('on' + eventName, listener.wrappedHandler);
    };
    removeListener = function(element, eventName, handler) {
      var uid = getUniqueId(element),
        listener;
      if (listeners[uid] && listeners[uid][eventName]) {
        for (var i = 0, len = listeners[uid][eventName].length; i < len; i++) {
          listener = listeners[uid][eventName][i];
          if (listener && listener.handler === handler) {
            element.detachEvent('on' + eventName, listener.wrappedHandler);
            listeners[uid][eventName][i] = null;
          }
        }
      }
    };
  } else {
    addListener = function(element, eventName, handler) {
      var uid = getUniqueId(element);
      if (!handlers[uid]) {
        handlers[uid] = {};
      }
      if (!handlers[uid][eventName]) {
        handlers[uid][eventName] = [];
        var existingHandler = element['on' + eventName];
        if (existingHandler) {
          handlers[uid][eventName].push(existingHandler);
        }
        element['on' + eventName] = createDispatcher(uid, eventName);
      }
      handlers[uid][eventName].push(handler);
    };
    removeListener = function(element, eventName, handler) {
      var uid = getUniqueId(element);
      if (handlers[uid] && handlers[uid][eventName]) {
        var handlersForEvent = handlers[uid][eventName];
        for (var i = 0, len = handlersForEvent.length; i < len; i++) {
          if (handlersForEvent[i] === handler) {
            handlersForEvent.splice(i, 1);
          }
        }
      }
    };
  }
  fabric.util.addListener = addListener;
  fabric.util.removeListener = removeListener;

  function getPointer(event, upperCanvasEl) {
    event || (event = fabric.window.event);
    var element = event.target || (typeof event.srcElement !== unknown ? event.srcElement : null);
    var scroll = fabric.util.getScrollLeftTop(element, upperCanvasEl);
    return {
      x: pointerX(event) + scroll.left,
      y: pointerY(event) + scroll.top
    };
  }
  var pointerX = function(event) {
    return (typeof event.clientX !== unknown ? event.clientX : 0);
  };
  var pointerY = function(event) {
    return (typeof event.clientY !== unknown ? event.clientY : 0);
  };

  function _getPointer(event, pageProp, clientProp) {
    var touchProp = event.type === 'touchend' ? 'changedTouches' : 'touches';
    return (event[touchProp] && event[touchProp][0] ? (event[touchProp][0][pageProp] - (event[touchProp][0][pageProp] - event[touchProp][0][clientProp])) || event[clientProp] : event[clientProp]);
  }
  if (fabric.isTouchSupported) {
    pointerX = function(event) {
      return _getPointer(event, 'pageX', 'clientX');
    };
    pointerY = function(event) {
      return _getPointer(event, 'pageY', 'clientY');
    };
  }
  fabric.util.getPointer = getPointer;
  fabric.util.object.extend(fabric.util, fabric.Observable);
})();
(function() {
  function setStyle(element, styles) {
    var elementStyle = element.style;
    if (!elementStyle) {
      return element;
    }
    if (typeof styles === 'string') {
      element.style.cssText += ';' + styles;
      return styles.indexOf('opacity') > -1 ? setOpacity(element, styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
    }
    for (var property in styles) {
      if (property === 'opacity') {
        setOpacity(element, styles[property]);
      } else {
        var normalizedProperty = (property === 'float' || property === 'cssFloat') ? (typeof elementStyle.styleFloat === 'undefined' ? 'cssFloat' : 'styleFloat') : property;
        elementStyle[normalizedProperty] = styles[property];
      }
    }
    return element;
  }
  var parseEl = fabric.document.createElement('div'),
    supportsOpacity = typeof parseEl.style.opacity === 'string',
    supportsFilters = typeof parseEl.style.filter === 'string',
    reOpacity = /alpha\s*\(\s*opacity\s*=\s*([^\)]+)\)/,
    setOpacity = function(element) {
      return element;
    };
  if (supportsOpacity) {
    setOpacity = function(element, value) {
      element.style.opacity = value;
      return element;
    };
  } else if (supportsFilters) {
    setOpacity = function(element, value) {
      var es = element.style;
      if (element.currentStyle && !element.currentStyle.hasLayout) {
        es.zoom = 1;
      }
      if (reOpacity.test(es.filter)) {
        value = value >= 0.9999 ? '' : ('alpha(opacity=' + (value * 100) + ')');
        es.filter = es.filter.replace(reOpacity, value);
      } else {
        es.filter += ' alpha(opacity=' + (value * 100) + ')';
      }
      return element;
    };
  }
  fabric.util.setStyle = setStyle;
})();
(function() {
  var _slice = Array.prototype.slice;

  function getById(id) {
    return typeof id === 'string' ? fabric.document.getElementById(id) : id;
  }
  var toArray = function(arrayLike) {
    return _slice.call(arrayLike, 0);
  };
  var sliceCanConvertNodelists;
  try {
    sliceCanConvertNodelists = toArray(fabric.document.childNodes) instanceof Array;
  } catch (err) {}
  if (!sliceCanConvertNodelists) {
    toArray = function(arrayLike) {
      var arr = new Array(arrayLike.length),
        i = arrayLike.length;
      while (i--) {
        arr[i] = arrayLike[i];
      }
      return arr;
    };
  }

  function makeElement(tagName, attributes) {
    var el = fabric.document.createElement(tagName);
    for (var prop in attributes) {
      if (prop === 'class') {
        el.className = attributes[prop];
      } else if (prop === 'for') {
        el.htmlFor = attributes[prop];
      } else {
        el.setAttribute(prop, attributes[prop]);
      }
    }
    return el;
  }

  function addClass(element, className) {
    if ((' ' + element.className + ' ').indexOf(' ' + className + ' ') === -1) {
      element.className += (element.className ? ' ' : '') + className;
    }
  }

  function wrapElement(element, wrapper, attributes) {
    if (typeof wrapper === 'string') {
      wrapper = makeElement(wrapper, attributes);
    }
    if (element.parentNode) {
      element.parentNode.replaceChild(wrapper, element);
    }
    wrapper.appendChild(element);
    return wrapper;
  }

  function getScrollLeftTop(element, upperCanvasEl) {
    var firstFixedAncestor, origElement, left = 0,
      top = 0,
      docElement = fabric.document.documentElement,
      body = fabric.document.body || {
        scrollLeft: 0,
        scrollTop: 0
      };
    origElement = element;
    while (element && element.parentNode && !firstFixedAncestor) {
      element = element.parentNode;
      if (element !== fabric.document && fabric.util.getElementStyle(element, 'position') === 'fixed') {
        firstFixedAncestor = element;
      }
      if (element !== fabric.document && origElement !== upperCanvasEl && fabric.util.getElementStyle(element, 'position') === 'absolute') {
        left = 0;
        top = 0;
      } else if (element === fabric.document) {
        left = body.scrollLeft || docElement.scrollLeft || 0;
        top = body.scrollTop || docElement.scrollTop || 0;
      } else {
        left += element.scrollLeft || 0;
        top += element.scrollTop || 0;
      }
    }
    return {
      left: left,
      top: top
    };
  }

  function getElementOffset(element) {
    var docElem, box = {
        left: 0,
        top: 0
      },
      doc = element && element.ownerDocument,
      offset = {
        left: 0,
        top: 0
      },
      scrollLeftTop, offsetAttributes = {
        'borderLeftWidth': 'left',
        'borderTopWidth': 'top',
        'paddingLeft': 'left',
        'paddingTop': 'top'
      };
    if (!doc) {
      return {
        left: 0,
        top: 0
      };
    }
    for (var attr in offsetAttributes) {
      offset[offsetAttributes[attr]] += parseInt(getElementStyle(element, attr), 10) || 0;
    }
    docElem = doc.documentElement;
    if (typeof element.getBoundingClientRect !== "undefined") {
      box = element.getBoundingClientRect();
    }
    scrollLeftTop = fabric.util.getScrollLeftTop(element, null);
    return {
      left: box.left + scrollLeftTop.left - (docElem.clientLeft || 0) + offset.left,
      top: box.top + scrollLeftTop.top - (docElem.clientTop || 0) + offset.top
    };
  }

  function getElementStyle(element, attr) {
    if (!element.style) {
      element.style = {};
    }
    if (fabric.document.defaultView && fabric.document.defaultView.getComputedStyle) {
      return fabric.document.defaultView.getComputedStyle(element, null)[attr];
    } else {
      var value = element.style[attr];
      if (!value && element.currentStyle) value = element.currentStyle[attr];
      return value;
    }
  }
  (function() {
    var style = fabric.document.documentElement.style;
    var selectProp = 'userSelect' in style ? 'userSelect' : 'MozUserSelect' in style ? 'MozUserSelect' : 'WebkitUserSelect' in style ? 'WebkitUserSelect' : 'KhtmlUserSelect' in style ? 'KhtmlUserSelect' : '';

    function makeElementUnselectable(element) {
      if (typeof element.onselectstart !== 'undefined') {
        element.onselectstart = fabric.util.falseFunction;
      }
      if (selectProp) {
        element.style[selectProp] = 'none';
      } else if (typeof element.unselectable === 'string') {
        element.unselectable = 'on';
      }
      return element;
    }

    function makeElementSelectable(element) {
      if (typeof element.onselectstart !== 'undefined') {
        element.onselectstart = null;
      }
      if (selectProp) {
        element.style[selectProp] = '';
      } else if (typeof element.unselectable === 'string') {
        element.unselectable = '';
      }
      return element;
    }
    fabric.util.makeElementUnselectable = makeElementUnselectable;
    fabric.util.makeElementSelectable = makeElementSelectable;
  })();
  (function() {
    function getScript(url, callback) {
      var headEl = fabric.document.getElementsByTagName("head")[0],
        scriptEl = fabric.document.createElement('script'),
        loading = true;
      scriptEl.onload = scriptEl.onreadystatechange = function(e) {
        if (loading) {
          if (typeof this.readyState === 'string' && this.readyState !== 'loaded' && this.readyState !== 'complete') return;
          loading = false;
          callback(e || fabric.window.event);
          scriptEl = scriptEl.onload = scriptEl.onreadystatechange = null;
        }
      };
      scriptEl.src = url;
      headEl.appendChild(scriptEl);
    }
    fabric.util.getScript = getScript;
  })();
  fabric.util.getById = getById;
  fabric.util.toArray = toArray;
  fabric.util.makeElement = makeElement;
  fabric.util.addClass = addClass;
  fabric.util.wrapElement = wrapElement;
  fabric.util.getScrollLeftTop = getScrollLeftTop;
  fabric.util.getElementOffset = getElementOffset;
  fabric.util.getElementStyle = getElementStyle;
})();
(function() {
  function addParamToUrl(url, param) {
    return url + (/\?/.test(url) ? '&' : '?') + param;
  }
  var makeXHR = (function() {
    var factories = [function() {
      return new ActiveXObject("Microsoft.XMLHTTP");
    }, function() {
      return new ActiveXObject("Msxml2.XMLHTTP");
    }, function() {
      return new ActiveXObject("Msxml2.XMLHTTP.3.0");
    }, function() {
      return new XMLHttpRequest();
    }];
    for (var i = factories.length; i--;) {
      try {
        var req = factories[i]();
        if (req) {
          return factories[i];
        }
      } catch (err) {}
    }
  })();

  function emptyFn() {}

  function request(url, options) {
    options || (options = {});
    var method = options.method ? options.method.toUpperCase() : 'GET',
      onComplete = options.onComplete || function() {},
      xhr = makeXHR(),
      body;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        onComplete(xhr);
        xhr.onreadystatechange = emptyFn;
      }
    };
    if (method === 'GET') {
      body = null;
      if (typeof options.parameters === 'string') {
        url = addParamToUrl(url, options.parameters);
      }
    }
    xhr.open(method, url, true);
    if (method === 'POST' || method === 'PUT') {
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
    xhr.send(body);
    return xhr;
  }
  fabric.util.request = request;
})();
fabric.log = function() {};
fabric.warn = function() {};
if (typeof console !== 'undefined') {
  ['log', 'warn'].forEach(function(methodName) {
    if (typeof console[methodName] !== 'undefined' && console[methodName].apply) {
      fabric[methodName] = function() {
        return console[methodName].apply(console, arguments);
      };
    }
  });
}
(function() {
  function animate(options) {
    requestAnimFrame(function(timestamp) {
      options || (options = {});
      var start = timestamp || +new Date(),
        duration = options.duration || 500,
        finish = start + duration,
        time, onChange = options.onChange || function() {},
        abort = options.abort || function() {
          return false;
        },
        easing = options.easing || function(t, b, c, d) {
          return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
        },
        startValue = 'startValue' in options ? options.startValue : 0,
        endValue = 'endValue' in options ? options.endValue : 100,
        byValue = options.byValue || endValue - startValue;
      options.onStart && options.onStart();
      (function tick(ticktime) {
        time = ticktime || +new Date();
        var currentTime = time > finish ? duration : (time - start);
        if (abort()) {
          options.onComplete && options.onComplete();
          return;
        }
        onChange(easing(currentTime, startValue, byValue, duration));
        if (time > finish) {
          options.onComplete && options.onComplete();
          return;
        }
        requestAnimFrame(tick);
      })(start);
    });
  }
  var _requestAnimFrame = fabric.window.requestAnimationFrame || fabric.window.webkitRequestAnimationFrame || fabric.window.mozRequestAnimationFrame || fabric.window.oRequestAnimationFrame || fabric.window.msRequestAnimationFrame || function(callback) {
    fabric.window.setTimeout(callback, 1000 / 60);
  };
  var requestAnimFrame = function() {
    return _requestAnimFrame.apply(fabric.window, arguments);
  };
  fabric.util.animate = animate;
  fabric.util.requestAnimFrame = requestAnimFrame;
})();
(function() {
  function normalize(a, c, p, s) {
    if (a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else s = p / (2 * Math.PI) * Math.asin(c / a);
    return {
      a: a,
      c: c,
      p: p,
      s: s
    };
  }

  function elastic(opts, t, d) {
    return opts.a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - opts.s) * (2 * Math.PI) / opts.p);
  }

  function easeOutCubic(t, b, c, d) {
    return c * ((t = t / d - 1) * t * t + 1) + b;
  }

  function easeInOutCubic(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t + 2) + b;
  }

  function easeInQuart(t, b, c, d) {
    return c * (t /= d) * t * t * t + b;
  }

  function easeOutQuart(t, b, c, d) {
    return -c * ((t = t / d - 1) * t * t * t - 1) + b;
  }

  function easeInOutQuart(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t * t + b;
    return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
  }

  function easeInQuint(t, b, c, d) {
    return c * (t /= d) * t * t * t * t + b;
  }

  function easeOutQuint(t, b, c, d) {
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  }

  function easeInOutQuint(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
  }

  function easeInSine(t, b, c, d) {
    return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
  }

  function easeOutSine(t, b, c, d) {
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
  }

  function easeInOutSine(t, b, c, d) {
    return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
  }

  function easeInExpo(t, b, c, d) {
    return (t === 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
  }

  function easeOutExpo(t, b, c, d) {
    return (t === d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
  }

  function easeInOutExpo(t, b, c, d) {
    if (t === 0) return b;
    if (t === d) return b + c;
    t /= d / 2;
    if (t < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
    return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
  }

  function easeInCirc(t, b, c, d) {
    return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
  }

  function easeOutCirc(t, b, c, d) {
    return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
  }

  function easeInOutCirc(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
    return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
  }

  function easeInElastic(t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t === 0) return b;
    t /= d;
    if (t === 1) return b + c;
    if (!p) p = d * 0.3;
    var opts = normalize(a, c, p, s);
    return -elastic(opts, t, d) + b;
  }

  function easeOutElastic(t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t === 0) return b;
    t /= d;
    if (t === 1) return b + c;
    if (!p) p = d * 0.3;
    var opts = normalize(a, c, p, s);
    return opts.a * Math.pow(2, -10 * t) * Math.sin((t * d - opts.s) * (2 * Math.PI) / opts.p) + opts.c + b;
  }

  function easeInOutElastic(t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t === 0) return b;
    t /= d / 2;
    if (t === 2) return b + c;
    if (!p) p = d * (0.3 * 1.5);
    var opts = normalize(a, c, p, s);
    if (t < 1) return -0.5 * elastic(opts, t, d) + b;
    return opts.a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - opts.s) * (2 * Math.PI) / opts.p) * 0.5 + opts.c + b;
  }

  function easeInBack(t, b, c, d, s) {
    if (s === undefined) s = 1.70158;
    return c * (t /= d) * t * ((s + 1) * t - s) + b;
  }

  function easeOutBack(t, b, c, d, s) {
    if (s === undefined) s = 1.70158;
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
  }

  function easeInOutBack(t, b, c, d, s) {
    if (s === undefined) s = 1.70158;
    t /= d / 2;
    if (t < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
    return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
  }

  function easeInBounce(t, b, c, d) {
    return c - easeOutBounce(d - t, 0, c, d) + b;
  }

  function easeOutBounce(t, b, c, d) {
    if ((t /= d) < (1 / 2.75)) {
      return c * (7.5625 * t * t) + b;
    } else if (t < (2 / 2.75)) {
      return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;
    } else if (t < (2.5 / 2.75)) {
      return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;
    } else {
      return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
    }
  }

  function easeInOutBounce(t, b, c, d) {
    if (t < d / 2) return easeInBounce(t * 2, 0, c, d) * 0.5 + b;
    return easeOutBounce(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
  }
  fabric.util.ease = {
    easeInQuad: function(t, b, c, d) {
      return c * (t /= d) * t + b;
    },
    easeOutQuad: function(t, b, c, d) {
      return -c * (t /= d) * (t - 2) + b;
    },
    easeInOutQuad: function(t, b, c, d) {
      t /= (d / 2);
      if (t < 1) return c / 2 * t * t + b;
      return -c / 2 * ((--t) * (t - 2) - 1) + b;
    },
    easeInCubic: function(t, b, c, d) {
      return c * (t /= d) * t * t + b;
    },
    easeOutCubic: easeOutCubic,
    easeInOutCubic: easeInOutCubic,
    easeInQuart: easeInQuart,
    easeOutQuart: easeOutQuart,
    easeInOutQuart: easeInOutQuart,
    easeInQuint: easeInQuint,
    easeOutQuint: easeOutQuint,
    easeInOutQuint: easeInOutQuint,
    easeInSine: easeInSine,
    easeOutSine: easeOutSine,
    easeInOutSine: easeInOutSine,
    easeInExpo: easeInExpo,
    easeOutExpo: easeOutExpo,
    easeInOutExpo: easeInOutExpo,
    easeInCirc: easeInCirc,
    easeOutCirc: easeOutCirc,
    easeInOutCirc: easeInOutCirc,
    easeInElastic: easeInElastic,
    easeOutElastic: easeOutElastic,
    easeInOutElastic: easeInOutElastic,
    easeInBack: easeInBack,
    easeOutBack: easeOutBack,
    easeInOutBack: easeInOutBack,
    easeInBounce: easeInBounce,
    easeOutBounce: easeOutBounce,
    easeInOutBounce: easeInOutBounce
  };
}());
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend,
    capitalize = fabric.util.string.capitalize,
    clone = fabric.util.object.clone,
    toFixed = fabric.util.toFixed,
    multiplyTransformMatrices = fabric.util.multiplyTransformMatrices;
  var attributesMap = {
    'fill-opacity': 'fillOpacity',
    'fill-rule': 'fillRule',
    'font-family': 'fontFamily',
    'font-size': 'fontSize',
    'font-style': 'fontStyle',
    'font-weight': 'fontWeight',
    'cx': 'left',
    'x': 'left',
    'r': 'radius',
    'stroke-dasharray': 'strokeDashArray',
    'stroke-linecap': 'strokeLineCap',
    'stroke-linejoin': 'strokeLineJoin',
    'stroke-miterlimit': 'strokeMiterLimit',
    'stroke-opacity': 'strokeOpacity',
    'stroke-width': 'strokeWidth',
    'text-decoration': 'textDecoration',
    'cy': 'top',
    'y': 'top',
    'transform': 'transformMatrix'
  };
  var colorAttributes = {
    'stroke': 'strokeOpacity',
    'fill': 'fillOpacity'
  };

  function normalizeAttr(attr) {
    if (attr in attributesMap) {
      return attributesMap[attr];
    }
    return attr;
  }

  function normalizeValue(attr, value, parentAttributes) {
    var isArray;
    if ((attr === 'fill' || attr === 'stroke') && value === 'none') {
      value = '';
    } else if (attr === 'fillRule') {
      value = (value === 'evenodd') ? 'destination-over' : value;
    } else if (attr === 'strokeDashArray') {
      value = value.replace(/,/g, ' ').split(/\s+/);
    } else if (attr === 'transformMatrix') {
      if (parentAttributes && parentAttributes.transformMatrix) {
        value = multiplyTransformMatrices(parentAttributes.transformMatrix, fabric.parseTransformAttribute(value));
      } else {
        value = fabric.parseTransformAttribute(value);
      }
    }
    isArray = Object.prototype.toString.call(value) === '[object Array]';
    var parsed = isArray ? value.map(parseFloat) : parseFloat(value);
    return (!isArray && isNaN(parsed) ? value : parsed);
  }

  function _setStrokeFillOpacity(attributes) {
    for (var attr in colorAttributes) {
      if (!attributes[attr] || typeof attributes[colorAttributes[attr]] === 'undefined') continue;
      if (attributes[attr].indexOf('url(') === 0) continue;
      var color = new fabric.Color(attributes[attr]);
      attributes[attr] = color.setAlpha(toFixed(color.getAlpha() * attributes[colorAttributes[attr]], 2)).toRgba();
      delete attributes[colorAttributes[attr]];
    }
    return attributes;
  }
  fabric.parseTransformAttribute = (function() {
    function rotateMatrix(matrix, args) {
      var angle = args[0];
      matrix[0] = Math.cos(angle);
      matrix[1] = Math.sin(angle);
      matrix[2] = -Math.sin(angle);
      matrix[3] = Math.cos(angle);
    }

    function scaleMatrix(matrix, args) {
      var multiplierX = args[0],
        multiplierY = (args.length === 2) ? args[1] : args[0];
      matrix[0] = multiplierX;
      matrix[3] = multiplierY;
    }

    function skewXMatrix(matrix, args) {
      matrix[2] = args[0];
    }

    function skewYMatrix(matrix, args) {
      matrix[1] = args[0];
    }

    function translateMatrix(matrix, args) {
      matrix[4] = args[0];
      if (args.length === 2) {
        matrix[5] = args[1];
      }
    }
    var iMatrix = [1, 0, 0, 1, 0, 0],
      number = '(?:[-+]?\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?)',
      comma_wsp = '(?:\\s+,?\\s*|,\\s*)',
      skewX = '(?:(skewX)\\s*\\(\\s*(' + number + ')\\s*\\))',
      skewY = '(?:(skewY)\\s*\\(\\s*(' + number + ')\\s*\\))',
      rotate = '(?:(rotate)\\s*\\(\\s*(' + number + ')(?:' +
      comma_wsp + '(' + number + ')' +
      comma_wsp + '(' + number + '))?\\s*\\))',
      scale = '(?:(scale)\\s*\\(\\s*(' + number + ')(?:' +
      comma_wsp + '(' + number + '))?\\s*\\))',
      translate = '(?:(translate)\\s*\\(\\s*(' + number + ')(?:' +
      comma_wsp + '(' + number + '))?\\s*\\))',
      matrix = '(?:(matrix)\\s*\\(\\s*' + '(' + number + ')' + comma_wsp + '(' + number + ')' + comma_wsp + '(' + number + ')' + comma_wsp + '(' + number + ')' + comma_wsp + '(' + number + ')' + comma_wsp + '(' + number + ')' + '\\s*\\))',
      transform = '(?:' +
      matrix + '|' +
      translate + '|' +
      scale + '|' +
      rotate + '|' +
      skewX + '|' +
      skewY + ')',
      transforms = '(?:' + transform + '(?:' + comma_wsp + transform + ')*' + ')',
      transform_list = '^\\s*(?:' + transforms + '?)\\s*$',
      reTransformList = new RegExp(transform_list),
      reTransform = new RegExp(transform, 'g');
    return function(attributeValue) {
      var matrix = iMatrix.concat();
      var matrices = [];
      if (!attributeValue || (attributeValue && !reTransformList.test(attributeValue))) {
        return matrix;
      }
      attributeValue.replace(reTransform, function(match) {
        var m = new RegExp(transform).exec(match).filter(function(match) {
            return (match !== '' && match != null);
          }),
          operation = m[1],
          args = m.slice(2).map(parseFloat);
        switch (operation) {
          case 'translate':
            translateMatrix(matrix, args);
            break;
          case 'rotate':
            rotateMatrix(matrix, args);
            break;
          case 'scale':
            scaleMatrix(matrix, args);
            break;
          case 'skewX':
            skewXMatrix(matrix, args);
            break;
          case 'skewY':
            skewYMatrix(matrix, args);
            break;
          case 'matrix':
            matrix = args;
            break;
        }
        matrices.push(matrix.concat());
        matrix = iMatrix.concat();
      });
      var combinedMatrix = matrices[0];
      while (matrices.length > 1) {
        matrices.shift();
        combinedMatrix = fabric.util.multiplyTransformMatrices(combinedMatrix, matrices[0]);
      }
      return combinedMatrix;
    };
  })();

  function parseFontDeclaration(value, oStyle) {
    var match = value.match(/(normal|italic)?\s*(normal|small-caps)?\s*(normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900)?\s*(\d+)px(?:\/(normal|[\d\.]+))?\s+(.*)/);
    if (!match) return;
    var fontStyle = match[1];
    var fontWeight = match[3];
    var fontSize = match[4];
    var lineHeight = match[5];
    var fontFamily = match[6];
    if (fontStyle) {
      oStyle.fontStyle = fontStyle;
    }
    if (fontWeight) {
      oStyle.fontSize = isNaN(parseFloat(fontWeight)) ? fontWeight : parseFloat(fontWeight);
    }
    if (fontSize) {
      oStyle.fontSize = parseFloat(fontSize);
    }
    if (fontFamily) {
      oStyle.fontFamily = fontFamily;
    }
    if (lineHeight) {
      oStyle.lineHeight = lineHeight === 'normal' ? 1 : lineHeight;
    }
  }

  function parseStyleString(style, oStyle) {
    var attr, value;
    style.replace(/;$/, '').split(';').forEach(function(chunk) {
      var pair = chunk.split(':');
      attr = normalizeAttr(pair[0].trim().toLowerCase());
      value = normalizeValue(attr, pair[1].trim());
      if (attr === 'font') {
        parseFontDeclaration(value, oStyle);
      } else {
        oStyle[attr] = value;
      }
    });
  }

  function parseStyleObject(style, oStyle) {
    var attr, value;
    for (var prop in style) {
      if (typeof style[prop] === 'undefined') continue;
      attr = normalizeAttr(prop.toLowerCase());
      value = normalizeValue(attr, style[prop]);
      if (attr === 'font') {
        parseFontDeclaration(value, oStyle);
      } else {
        oStyle[attr] = value;
      }
    }
  }

  function getGlobalStylesForElement(element) {
    var nodeName = element.nodeName,
      className = element.getAttribute('class'),
      id = element.getAttribute('id'),
      styles = {};
    for (var rule in fabric.cssRules) {
      var ruleMatchesElement = (className && new RegExp('^\\.' + className).test(rule)) || (id && new RegExp('^#' + id).test(rule)) || (new RegExp('^' + nodeName).test(rule));
      if (ruleMatchesElement) {
        for (var property in fabric.cssRules[rule]) {
          styles[property] = fabric.cssRules[rule][property];
        }
      }
    }
    return styles;
  }
  fabric.parseSVGDocument = (function() {
    var reAllowedSVGTagNames = /^(path|circle|polygon|polyline|ellipse|rect|line|image|text)$/;
    var reNum = '(?:[-+]?\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?)';
    var reViewBoxAttrValue = new RegExp('^' + '\\s*(' + reNum + '+)\\s*,?' + '\\s*(' + reNum + '+)\\s*,?' + '\\s*(' + reNum + '+)\\s*,?' + '\\s*(' + reNum + '+)\\s*' + '$');

    function hasAncestorWithNodeName(element, nodeName) {
      while (element && (element = element.parentNode)) {
        if (nodeName.test(element.nodeName)) {
          return true;
        }
      }
      return false;
    }
    return function(doc, callback, reviver) {
      if (!doc) return;
      var startTime = new Date(),
        descendants = fabric.util.toArray(doc.getElementsByTagName('*'));
      if (descendants.length === 0) {
        descendants = doc.selectNodes("//*[name(.)!='svg']");
        var arr = [];
        for (var i = 0, len = descendants.length; i < len; i++) {
          arr[i] = descendants[i];
        }
        descendants = arr;
      }
      var elements = descendants.filter(function(el) {
        return reAllowedSVGTagNames.test(el.tagName) && !hasAncestorWithNodeName(el, /^(?:pattern|defs)$/);
      });
      if (!elements || (elements && !elements.length)) return;
      var viewBoxAttr = doc.getAttribute('viewBox'),
        widthAttr = doc.getAttribute('width'),
        heightAttr = doc.getAttribute('height'),
        width = null,
        height = null,
        minX, minY;
      if (viewBoxAttr && (viewBoxAttr = viewBoxAttr.match(reViewBoxAttrValue))) {
        minX = parseInt(viewBoxAttr[1], 10);
        minY = parseInt(viewBoxAttr[2], 10);
        width = parseInt(viewBoxAttr[3], 10);
        height = parseInt(viewBoxAttr[4], 10);
      }
      width = widthAttr ? parseFloat(widthAttr) : width;
      height = heightAttr ? parseFloat(heightAttr) : height;
      var options = {
        width: width,
        height: height
      };
      fabric.gradientDefs = fabric.getGradientDefs(doc);
      fabric.cssRules = fabric.getCSSRules(doc);
      fabric.parseElements(elements, function(instances) {
        fabric.documentParsingTime = new Date() - startTime;
        if (callback) {
          callback(instances, options);
        }
      }, clone(options), reviver);
    };
  })();
  var svgCache = {
    has: function(name, callback) {
      callback(false);
    },
    get: function() {},
    set: function() {}
  };

  function _enlivenCachedObject(cachedObject) {
    var objects = cachedObject.objects,
      options = cachedObject.options;
    objects = objects.map(function(o) {
      return fabric[capitalize(o.type)].fromObject(o);
    });
    return ({
      objects: objects,
      options: options
    });
  }

  function _createSVGPattern(markup, canvas, property) {
    if (canvas[property] && canvas[property].toSVG) {
      markup.push('<pattern x="0" y="0" id="', property, 'Pattern" ', 'width="', canvas[property].source.width, '" height="', canvas[property].source.height, '" patternUnits="userSpaceOnUse">', '<image x="0" y="0" ', 'width="', canvas[property].source.width, '" height="', canvas[property].source.height, '" xlink:href="', canvas[property].source.src, '"></image></pattern>');
    }
  }
  extend(fabric, {
    resolveGradients: function(instances) {
      for (var i = instances.length; i--;) {
        var instanceFillValue = instances[i].get('fill');
        if (!(/^url\(/).test(instanceFillValue)) continue;
        var gradientId = instanceFillValue.slice(5, instanceFillValue.length - 1);
        if (fabric.gradientDefs[gradientId]) {
          instances[i].set('fill', fabric.Gradient.fromElement(fabric.gradientDefs[gradientId], instances[i]));
        }
      }
    },
    getGradientDefs: function(doc) {
      var linearGradientEls = doc.getElementsByTagName('linearGradient'),
        radialGradientEls = doc.getElementsByTagName('radialGradient'),
        el, i, gradientDefs = {};
      i = linearGradientEls.length;
      for (; i--;) {
        el = linearGradientEls[i];
        gradientDefs[el.getAttribute('id')] = el;
      }
      i = radialGradientEls.length;
      for (; i--;) {
        el = radialGradientEls[i];
        gradientDefs[el.getAttribute('id')] = el;
      }
      return gradientDefs;
    },
    parseAttributes: function(element, attributes) {
      if (!element) {
        return;
      }
      var value, parentAttributes = {};
      if (element.parentNode && /^g$/i.test(element.parentNode.nodeName)) {
        parentAttributes = fabric.parseAttributes(element.parentNode, attributes);
      }
      var ownAttributes = attributes.reduce(function(memo, attr) {
        value = element.getAttribute(attr);
        if (value) {
          attr = normalizeAttr(attr);
          value = normalizeValue(attr, value, parentAttributes);
          memo[attr] = value;
        }
        return memo;
      }, {});
      ownAttributes = extend(ownAttributes, extend(getGlobalStylesForElement(element), fabric.parseStyleAttribute(element)));
      return _setStrokeFillOpacity(extend(parentAttributes, ownAttributes));
    },
    parseElements: function(elements, callback, options, reviver) {
      fabric.ElementsParser.parse(elements, callback, options, reviver);
    },
    parseStyleAttribute: function(element) {
      var oStyle = {},
        style = element.getAttribute('style');
      if (!style) return oStyle;
      if (typeof style === 'string') {
        parseStyleString(style, oStyle);
      } else {
        parseStyleObject(style, oStyle);
      }
      return oStyle;
    },
    parsePointsAttribute: function(points) {
      if (!points) return null;
      points = points.trim();
      var asPairs = points.indexOf(',') > -1;
      points = points.split(/\s+/);
      var parsedPoints = [],
        i, len;
      if (asPairs) {
        i = 0;
        len = points.length;
        for (; i < len; i++) {
          var pair = points[i].split(',');
          parsedPoints.push({
            x: parseFloat(pair[0]),
            y: parseFloat(pair[1])
          });
        }
      } else {
        i = 0;
        len = points.length;
        for (; i < len; i += 2) {
          parsedPoints.push({
            x: parseFloat(points[i]),
            y: parseFloat(points[i + 1])
          });
        }
      }
      if (parsedPoints.length % 2 !== 0) {}
      return parsedPoints;
    },
    getCSSRules: function(doc) {
      var styles = doc.getElementsByTagName('style'),
        allRules = {},
        rules;
      for (var i = 0, len = styles.length; i < len; i++) {
        var styleContents = styles[0].textContent;
        styleContents = styleContents.replace(/\/\*[\s\S]*?\*\//g, '');
        rules = styleContents.match(/[^{]*\{[\s\S]*?\}/g);
        rules = rules.map(function(rule) {
          return rule.trim();
        });
        rules.forEach(function(rule) {
          var match = rule.match(/([\s\S]*?)\s*\{([^}]*)\}/);
          rule = match[1];
          var declaration = match[2].trim(),
            propertyValuePairs = declaration.replace(/;$/, '').split(/\s*;\s*/);
          if (!allRules[rule]) {
            allRules[rule] = {};
          }
          for (var i = 0, len = propertyValuePairs.length; i < len; i++) {
            var pair = propertyValuePairs[i].split(/\s*:\s*/),
              property = pair[0],
              value = pair[1];
            allRules[rule][property] = value;
          }
        });
      }
      return allRules;
    },
    loadSVGFromURL: function(url, callback, reviver) {
      url = url.replace(/^\n\s*/, '').trim();
      svgCache.has(url, function(hasUrl) {
        if (hasUrl) {
          svgCache.get(url, function(value) {
            var enlivedRecord = _enlivenCachedObject(value);
            callback(enlivedRecord.objects, enlivedRecord.options);
          });
        } else {
          new fabric.util.request(url, {
            method: 'get',
            onComplete: onComplete
          });
        }
      });

      function onComplete(r) {
        var xml = r.responseXML;
        if (xml && !xml.documentElement && fabric.window.ActiveXObject && r.responseText) {
          xml = new ActiveXObject('Microsoft.XMLDOM');
          xml.async = 'false';
          xml.loadXML(r.responseText.replace(/<!DOCTYPE[\s\S]*?(\[[\s\S]*\])*?>/i, ''));
        }
        if (!xml || !xml.documentElement) return;
        fabric.parseSVGDocument(xml.documentElement, function(results, options) {
          svgCache.set(url, {
            objects: fabric.util.array.invoke(results, 'toObject'),
            options: options
          });
          callback(results, options);
        }, reviver);
      }
    },
    loadSVGFromString: function(string, callback, reviver) {
      string = string.trim();
      var doc;
      if (typeof DOMParser !== 'undefined') {
        var parser = new DOMParser();
        if (parser && parser.parseFromString) {
          doc = parser.parseFromString(string, 'text/xml');
        }
      } else if (fabric.window.ActiveXObject) {
        doc = new ActiveXObject('Microsoft.XMLDOM');
        doc.async = 'false';
        doc.loadXML(string.replace(/<!DOCTYPE[\s\S]*?(\[[\s\S]*\])*?>/i, ''));
      }
      fabric.parseSVGDocument(doc.documentElement, function(results, options) {
        callback(results, options);
      }, reviver);
    },
    createSVGFontFacesMarkup: function(objects) {
      var markup = '';
      for (var i = 0, len = objects.length; i < len; i++) {
        if (objects[i].type !== 'text' || !objects[i].path) continue;
        markup += ['@font-face {', 'font-family: ', objects[i].fontFamily, '; ', 'src: url(\'', objects[i].path, '\')', '}'].join('');
      }
      if (markup) {
        markup = ['<style type="text/css">', '<![CDATA[', markup, ']]>', '</style>'].join('');
      }
      return markup;
    },
    createSVGRefElementsMarkup: function(canvas) {
      var markup = [];
      _createSVGPattern(markup, canvas, 'backgroundColor');
      _createSVGPattern(markup, canvas, 'overlayColor');
      return markup.join('');
    }
  });
})(typeof exports !== 'undefined' ? exports : this);
fabric.ElementsParser = {
  parse: function(elements, callback, options, reviver) {
    this.elements = elements;
    this.callback = callback;
    this.options = options;
    this.reviver = reviver;
    this.instances = new Array(elements.length);
    this.numElements = elements.length;
    this.createObjects();
  },
  createObjects: function() {
    for (var i = 0, len = this.elements.length; i < len; i++) {
      (function(_this, i) {
        setTimeout(function() {
          _this.createObject(_this.elements[i], i);
        }, 0);
      })(this, i);
    }
  },
  createObject: function(el, index) {
    var klass = fabric[fabric.util.string.capitalize(el.tagName)];
    if (klass && klass.fromElement) {
      try {
        this._createObject(klass, el, index);
      } catch (err) {
        fabric.log(err);
      }
    } else {
      this.checkIfDone();
    }
  },
  _createObject: function(klass, el, index) {
    if (klass.async) {
      klass.fromElement(el, this.createCallback(index, el), this.options);
    } else {
      var obj = klass.fromElement(el, this.options);
      this.reviver && this.reviver(el, obj);
      this.instances.splice(index, 0, obj);
      this.checkIfDone();
    }
  },
  createCallback: function(index, el) {
    var _this = this;
    return function(obj) {
      _this.reviver && _this.reviver(el, obj);
      _this.instances.splice(index, 0, obj);
      _this.checkIfDone();
    };
  },
  checkIfDone: function() {
    if (--this.numElements === 0) {
      this.instances = this.instances.filter(function(el) {
        return el != null;
      });
      fabric.resolveGradients(this.instances);
      this.callback(this.instances);
    }
  }
};
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {});
  if (fabric.Point) {
    fabric.warn('fabric.Point is already defined');
    return;
  }
  fabric.Point = Point;

  function Point(x, y) {
    this.x = x;
    this.y = y;
  }
  Point.prototype = {
    constructor: Point,
    add: function(that) {
      return new Point(this.x + that.x, this.y + that.y);
    },
    addEquals: function(that) {
      this.x += that.x;
      this.y += that.y;
      return this;
    },
    scalarAdd: function(scalar) {
      return new Point(this.x + scalar, this.y + scalar);
    },
    scalarAddEquals: function(scalar) {
      this.x += scalar;
      this.y += scalar;
      return this;
    },
    subtract: function(that) {
      return new Point(this.x - that.x, this.y - that.y);
    },
    subtractEquals: function(that) {
      this.x -= that.x;
      this.y -= that.y;
      return this;
    },
    scalarSubtract: function(scalar) {
      return new Point(this.x - scalar, this.y - scalar);
    },
    scalarSubtractEquals: function(scalar) {
      this.x -= scalar;
      this.y -= scalar;
      return this;
    },
    multiply: function(scalar) {
      return new Point(this.x * scalar, this.y * scalar);
    },
    multiplyEquals: function(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      return this;
    },
    divide: function(scalar) {
      return new Point(this.x / scalar, this.y / scalar);
    },
    divideEquals: function(scalar) {
      this.x /= scalar;
      this.y /= scalar;
      return this;
    },
    eq: function(that) {
      return (this.x === that.x && this.y === that.y);
    },
    lt: function(that) {
      return (this.x < that.x && this.y < that.y);
    },
    lte: function(that) {
      return (this.x <= that.x && this.y <= that.y);
    },
    gt: function(that) {
      return (this.x > that.x && this.y > that.y);
    },
    gte: function(that) {
      return (this.x >= that.x && this.y >= that.y);
    },
    lerp: function(that, t) {
      return new Point(this.x + (that.x - this.x) * t, this.y + (that.y - this.y) * t);
    },
    distanceFrom: function(that) {
      var dx = this.x - that.x,
        dy = this.y - that.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
    midPointFrom: function(that) {
      return new Point(this.x + (that.x - this.x) / 2, this.y + (that.y - this.y) / 2);
    },
    min: function(that) {
      return new Point(Math.min(this.x, that.x), Math.min(this.y, that.y));
    },
    max: function(that) {
      return new Point(Math.max(this.x, that.x), Math.max(this.y, that.y));
    },
    toString: function() {
      return this.x + "," + this.y;
    },
    setXY: function(x, y) {
      this.x = x;
      this.y = y;
    },
    setFromPoint: function(that) {
      this.x = that.x;
      this.y = that.y;
    },
    swap: function(that) {
      var x = this.x,
        y = this.y;
      this.x = that.x;
      this.y = that.y;
      that.x = x;
      that.y = y;
    }
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {});
  if (fabric.Intersection) {
    fabric.warn('fabric.Intersection is already defined');
    return;
  }

  function Intersection(status) {
    this.status = status;
    this.points = [];
  }
  fabric.Intersection = Intersection;
  fabric.Intersection.prototype = {
    appendPoint: function(point) {
      this.points.push(point);
    },
    appendPoints: function(points) {
      this.points = this.points.concat(points);
    }
  };
  fabric.Intersection.intersectLineLine = function(a1, a2, b1, b2) {
    var result, ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
      ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
      u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
    if (u_b !== 0) {
      var ua = ua_t / u_b,
        ub = ub_t / u_b;
      if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
        result = new Intersection("Intersection");
        result.points.push(new fabric.Point(a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)));
      } else {
        result = new Intersection();
      }
    } else {
      if (ua_t === 0 || ub_t === 0) {
        result = new Intersection("Coincident");
      } else {
        result = new Intersection("Parallel");
      }
    }
    return result;
  };
  fabric.Intersection.intersectLinePolygon = function(a1, a2, points) {
    var result = new Intersection(),
      length = points.length;
    for (var i = 0; i < length; i++) {
      var b1 = points[i],
        b2 = points[(i + 1) % length],
        inter = Intersection.intersectLineLine(a1, a2, b1, b2);
      result.appendPoints(inter.points);
    }
    if (result.points.length > 0) {
      result.status = "Intersection";
    }
    return result;
  };
  fabric.Intersection.intersectPolygonPolygon = function(points1, points2) {
    var result = new Intersection(),
      length = points1.length;
    for (var i = 0; i < length; i++) {
      var a1 = points1[i],
        a2 = points1[(i + 1) % length],
        inter = Intersection.intersectLinePolygon(a1, a2, points2);
      result.appendPoints(inter.points);
    }
    if (result.points.length > 0) {
      result.status = "Intersection";
    }
    return result;
  };
  fabric.Intersection.intersectPolygonRectangle = function(points, r1, r2) {
    var min = r1.min(r2),
      max = r1.max(r2),
      topRight = new fabric.Point(max.x, min.y),
      bottomLeft = new fabric.Point(min.x, max.y),
      inter1 = Intersection.intersectLinePolygon(min, topRight, points),
      inter2 = Intersection.intersectLinePolygon(topRight, max, points),
      inter3 = Intersection.intersectLinePolygon(max, bottomLeft, points),
      inter4 = Intersection.intersectLinePolygon(bottomLeft, min, points),
      result = new Intersection();
    result.appendPoints(inter1.points);
    result.appendPoints(inter2.points);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);
    if (result.points.length > 0) {
      result.status = "Intersection";
    }
    return result;
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {});
  if (fabric.Color) {
    fabric.warn('fabric.Color is already defined.');
    return;
  }

  function Color(color) {
    if (!color) {
      this.setSource([0, 0, 0, 1]);
    } else {
      this._tryParsingColor(color);
    }
  }
  fabric.Color = Color;
  fabric.Color.prototype = {
    _tryParsingColor: function(color) {
      var source;
      if (color in Color.colorNameMap) {
        color = Color.colorNameMap[color];
      }
      source = Color.sourceFromHex(color);
      if (!source) {
        source = Color.sourceFromRgb(color);
      }
      if (!source) {
        source = Color.sourceFromHsl(color);
      }
      if (source) {
        this.setSource(source);
      }
    },
    _rgbToHsl: function(r, g, b) {
      r /= 255, g /= 255, b /= 255;
      var h, s, l, max = fabric.util.array.max([r, g, b]),
        min = fabric.util.array.min([r, g, b]);
      l = (max + min) / 2;
      if (max === min) {
        h = s = 0;
      } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }
      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    },
    getSource: function() {
      return this._source;
    },
    setSource: function(source) {
      this._source = source;
    },
    toRgb: function() {
      var source = this.getSource();
      return 'rgb(' + source[0] + ',' + source[1] + ',' + source[2] + ')';
    },
    toRgba: function() {
      var source = this.getSource();
      return 'rgba(' + source[0] + ',' + source[1] + ',' + source[2] + ',' + source[3] + ')';
    },
    toHsl: function() {
      var source = this.getSource(),
        hsl = this._rgbToHsl(source[0], source[1], source[2]);
      return 'hsl(' + hsl[0] + ',' + hsl[1] + '%,' + hsl[2] + '%)';
    },
    toHsla: function() {
      var source = this.getSource(),
        hsl = this._rgbToHsl(source[0], source[1], source[2]);
      return 'hsla(' + hsl[0] + ',' + hsl[1] + '%,' + hsl[2] + '%,' + source[3] + ')';
    },
    toHex: function() {
      var source = this.getSource();
      var r = source[0].toString(16);
      r = (r.length === 1) ? ('0' + r) : r;
      var g = source[1].toString(16);
      g = (g.length === 1) ? ('0' + g) : g;
      var b = source[2].toString(16);
      b = (b.length === 1) ? ('0' + b) : b;
      return r.toUpperCase() + g.toUpperCase() + b.toUpperCase();
    },
    getAlpha: function() {
      return this.getSource()[3];
    },
    setAlpha: function(alpha) {
      var source = this.getSource();
      source[3] = alpha;
      this.setSource(source);
      return this;
    },
    toGrayscale: function() {
      var source = this.getSource(),
        average = parseInt((source[0] * 0.3 + source[1] * 0.59 + source[2] * 0.11).toFixed(0), 10),
        currentAlpha = source[3];
      this.setSource([average, average, average, currentAlpha]);
      return this;
    },
    toBlackWhite: function(threshold) {
      var source = this.getSource(),
        average = (source[0] * 0.3 + source[1] * 0.59 + source[2] * 0.11).toFixed(0),
        currentAlpha = source[3];
      threshold = threshold || 127;
      average = (Number(average) < Number(threshold)) ? 0 : 255;
      this.setSource([average, average, average, currentAlpha]);
      return this;
    },
    overlayWith: function(otherColor) {
      if (!(otherColor instanceof Color)) {
        otherColor = new Color(otherColor);
      }
      var result = [],
        alpha = this.getAlpha(),
        otherAlpha = 0.5,
        source = this.getSource(),
        otherSource = otherColor.getSource();
      for (var i = 0; i < 3; i++) {
        result.push(Math.round((source[i] * (1 - otherAlpha)) + (otherSource[i] * otherAlpha)));
      }
      result[3] = alpha;
      this.setSource(result);
      return this;
    }
  };
  fabric.Color.reRGBa = /^rgba?\(\s*(\d{1,3}\%?)\s*,\s*(\d{1,3}\%?)\s*,\s*(\d{1,3}\%?)\s*(?:\s*,\s*(\d+(?:\.\d+)?)\s*)?\)$/;
  fabric.Color.reHSLa = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3}\%)\s*,\s*(\d{1,3}\%)\s*(?:\s*,\s*(\d+(?:\.\d+)?)\s*)?\)$/;
  fabric.Color.reHex = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;
  fabric.Color.colorNameMap = {
    'aqua': '#00FFFF',
    'black': '#000000',
    'blue': '#0000FF',
    'fuchsia': '#FF00FF',
    'gray': '#808080',
    'green': '#008000',
    'lime': '#00FF00',
    'maroon': '#800000',
    'navy': '#000080',
    'olive': '#808000',
    'orange': '#FFA500',
    'purple': '#800080',
    'red': '#FF0000',
    'silver': '#C0C0C0',
    'teal': '#008080',
    'white': '#FFFFFF',
    'yellow': '#FFFF00'
  };

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  fabric.Color.fromRgb = function(color) {
    return Color.fromSource(Color.sourceFromRgb(color));
  };
  fabric.Color.sourceFromRgb = function(color) {
    var match = color.match(Color.reRGBa);
    if (match) {
      var r = parseInt(match[1], 10) / (/%$/.test(match[1]) ? 100 : 1) * (/%$/.test(match[1]) ? 255 : 1),
        g = parseInt(match[2], 10) / (/%$/.test(match[2]) ? 100 : 1) * (/%$/.test(match[2]) ? 255 : 1),
        b = parseInt(match[3], 10) / (/%$/.test(match[3]) ? 100 : 1) * (/%$/.test(match[3]) ? 255 : 1);
      return [parseInt(r, 10), parseInt(g, 10), parseInt(b, 10), match[4] ? parseFloat(match[4]) : 1];
    }
  };
  fabric.Color.fromRgba = Color.fromRgb;
  fabric.Color.fromHsl = function(color) {
    return Color.fromSource(Color.sourceFromHsl(color));
  };
  fabric.Color.sourceFromHsl = function(color) {
    var match = color.match(Color.reHSLa);
    if (!match) return;
    var h = (((parseFloat(match[1]) % 360) + 360) % 360) / 360,
      s = parseFloat(match[2]) / (/%$/.test(match[2]) ? 100 : 1),
      l = parseFloat(match[3]) / (/%$/.test(match[3]) ? 100 : 1),
      r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      var q = l <= 0.5 ? l * (s + 1) : l + s - l * s;
      var p = l * 2 - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), match[4] ? parseFloat(match[4]) : 1];
  };
  fabric.Color.fromHsla = Color.fromHsl;
  fabric.Color.fromHex = function(color) {
    return Color.fromSource(Color.sourceFromHex(color));
  };
  fabric.Color.sourceFromHex = function(color) {
    if (color.match(Color.reHex)) {
      var value = color.slice(color.indexOf('#') + 1),
        isShortNotation = (value.length === 3),
        r = isShortNotation ? (value.charAt(0) + value.charAt(0)) : value.substring(0, 2),
        g = isShortNotation ? (value.charAt(1) + value.charAt(1)) : value.substring(2, 4),
        b = isShortNotation ? (value.charAt(2) + value.charAt(2)) : value.substring(4, 6);
      return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16), 1];
    }
  };
  fabric.Color.fromSource = function(source) {
    var oColor = new Color();
    oColor.setSource(source);
    return oColor;
  };
})(typeof exports !== 'undefined' ? exports : this);
(function() {
  function getColorStop(el) {
    var style = el.getAttribute('style'),
      offset = el.getAttribute('offset'),
      color, opacity;
    offset = parseFloat(offset) / (/%$/.test(offset) ? 100 : 1);
    if (style) {
      var keyValuePairs = style.split(/\s*;\s*/);
      if (keyValuePairs[keyValuePairs.length - 1] === '') {
        keyValuePairs.pop();
      }
      for (var i = keyValuePairs.length; i--;) {
        var split = keyValuePairs[i].split(/\s*:\s*/),
          key = split[0].trim(),
          value = split[1].trim();
        if (key === 'stop-color') {
          color = value;
        } else if (key === 'stop-opacity') {
          opacity = value;
        }
      }
    }
    if (!color) {
      color = el.getAttribute('stop-color') || 'rgb(0,0,0)';
    }
    if (!opacity) {
      opacity = el.getAttribute('stop-opacity');
    }
    color = new fabric.Color(color).toRgb();
    return {
      offset: offset,
      color: color,
      opacity: isNaN(parseFloat(opacity)) ? 1 : parseFloat(opacity)
    };
  }

  function getLinearCoords(el) {
    return {
      x1: el.getAttribute('x1') || 0,
      y1: el.getAttribute('y1') || 0,
      x2: el.getAttribute('x2') || '100%',
      y2: el.getAttribute('y2') || 0
    };
  }

  function getRadialCoords(el) {
    return {
      x1: el.getAttribute('fx') || el.getAttribute('cx') || '50%',
      y1: el.getAttribute('fy') || el.getAttribute('cy') || '50%',
      r1: 0,
      x2: el.getAttribute('cx') || '50%',
      y2: el.getAttribute('cy') || '50%',
      r2: el.getAttribute('r') || '50%'
    };
  }
  fabric.Gradient = fabric.util.createClass({
    initialize: function(options) {
      options || (options = {});
      var coords = {};
      this.id = fabric.Object.__uid++;
      this.type = options.type || 'linear';
      coords = {
        x1: options.coords.x1 || 0,
        y1: options.coords.y1 || 0,
        x2: options.coords.x2 || 0,
        y2: options.coords.y2 || 0
      };
      if (this.type === 'radial') {
        coords.r1 = options.coords.r1 || 0;
        coords.r2 = options.coords.r2 || 0;
      }
      this.coords = coords;
      this.gradientUnits = options.gradientUnits || 'objectBoundingBox';
      this.colorStops = options.colorStops.slice();
    },
    addColorStop: function(colorStop) {
      for (var position in colorStop) {
        var color = new fabric.Color(colorStop[position]);
        this.colorStops.push({
          offset: position,
          color: color.toRgb(),
          opacity: color.getAlpha()
        });
      }
      return this;
    },
    toObject: function() {
      return {
        type: this.type,
        coords: this.coords,
        gradientUnits: this.gradientUnits,
        colorStops: this.colorStops
      };
    },
    toSVG: function(object, normalize) {
      var coords = fabric.util.object.clone(this.coords),
        markup;
      this.colorStops.sort(function(a, b) {
        return a.offset - b.offset;
      });
      if (normalize && this.gradientUnits === 'userSpaceOnUse') {
        coords.x1 += object.width / 2;
        coords.y1 += object.height / 2;
        coords.x2 += object.width / 2;
        coords.y2 += object.height / 2;
      } else if (this.gradientUnits === 'objectBoundingBox') {
        _convertValuesToPercentUnits(object, coords);
      }
      if (this.type === 'linear') {
        markup = ['<linearGradient ', 'id="SVGID_', this.id, '" gradientUnits="', this.gradientUnits, '" x1="', coords.x1, '" y1="', coords.y1, '" x2="', coords.x2, '" y2="', coords.y2, '">'];
      } else if (this.type === 'radial') {
        markup = ['<radialGradient ', 'id="SVGID_', this.id, '" gradientUnits="', this.gradientUnits, '" cx="', coords.x2, '" cy="', coords.y2, '" r="', coords.r2, '" fx="', coords.x1, '" fy="', coords.y1, '">'];
      }
      for (var i = 0; i < this.colorStops.length; i++) {
        markup.push('<stop ', 'offset="', (this.colorStops[i].offset * 100) + '%', '" style="stop-color:', this.colorStops[i].color, (this.colorStops[i].opacity ? ';stop-opacity: ' + this.colorStops[i].opacity : ';'), '"/>');
      }
      markup.push((this.type === 'linear' ? '</linearGradient>' : '</radialGradient>'));
      return markup.join('');
    },
    toLive: function(ctx) {
      var gradient;
      if (!this.type) return;
      if (this.type === 'linear') {
        gradient = ctx.createLinearGradient(this.coords.x1, this.coords.y1, this.coords.x2, this.coords.y2);
      } else if (this.type === 'radial') {
        gradient = ctx.createRadialGradient(this.coords.x1, this.coords.y1, this.coords.r1, this.coords.x2, this.coords.y2, this.coords.r2);
      }
      for (var i = 0, len = this.colorStops.length; i < len; i++) {
        var color = this.colorStops[i].color,
          opacity = this.colorStops[i].opacity,
          offset = this.colorStops[i].offset;
        if (typeof opacity !== 'undefined') {
          color = new fabric.Color(color).setAlpha(opacity).toRgba();
        }
        gradient.addColorStop(parseFloat(offset), color);
      }
      return gradient;
    }
  });
  fabric.util.object.extend(fabric.Gradient, {
    fromElement: function(el, instance) {
      var colorStopEls = el.getElementsByTagName('stop'),
        type = (el.nodeName === 'linearGradient' ? 'linear' : 'radial'),
        gradientUnits = el.getAttribute('gradientUnits') || 'objectBoundingBox',
        colorStops = [],
        coords = {};
      if (type === 'linear') {
        coords = getLinearCoords(el);
      } else if (type === 'radial') {
        coords = getRadialCoords(el);
      }
      for (var i = colorStopEls.length; i--;) {
        colorStops.push(getColorStop(colorStopEls[i]));
      }
      _convertPercentUnitsToValues(instance, coords);
      return new fabric.Gradient({
        type: type,
        coords: coords,
        gradientUnits: gradientUnits,
        colorStops: colorStops
      });
    },
    forObject: function(obj, options) {
      options || (options = {});
      _convertPercentUnitsToValues(obj, options);
      return new fabric.Gradient(options);
    }
  });

  function _convertPercentUnitsToValues(object, options) {
    for (var prop in options) {
      if (typeof options[prop] === 'string' && /^\d+%$/.test(options[prop])) {
        var percents = parseFloat(options[prop], 10);
        if (prop === 'x1' || prop === 'x2' || prop === 'r2') {
          options[prop] = fabric.util.toFixed(object.width * percents / 100, 2);
        } else if (prop === 'y1' || prop === 'y2') {
          options[prop] = fabric.util.toFixed(object.height * percents / 100, 2);
        }
      }
      normalize(options, prop, object);
    }
  }

  function normalize(options, prop, object) {
    if (prop === 'x1' || prop === 'x2') {
      options[prop] -= fabric.util.toFixed(object.width / 2, 2);
    } else if (prop === 'y1' || prop === 'y2') {
      options[prop] -= fabric.util.toFixed(object.height / 2, 2);
    }
  }

  function _convertValuesToPercentUnits(object, options) {
    for (var prop in options) {
      normalize(options, prop, object);
      if (prop === 'x1' || prop === 'x2' || prop === 'r2') {
        options[prop] = fabric.util.toFixed(options[prop] / object.width * 100, 2) + '%';
      } else if (prop === 'y1' || prop === 'y2') {
        options[prop] = fabric.util.toFixed(options[prop] / object.height * 100, 2) + '%';
      }
    }
  }
})();
fabric.Pattern = fabric.util.createClass({
  repeat: 'repeat',
  offsetX: 0,
  offsetY: 0,
  initialize: function(options) {
    options || (options = {});
    this.id = fabric.Object.__uid++;
    if (options.source) {
      if (typeof options.source === 'string') {
        if (typeof fabric.util.getFunctionBody(options.source) !== 'undefined') {
          this.source = new Function(fabric.util.getFunctionBody(options.source));
        } else {
          var _this = this;
          this.source = fabric.util.createImage();
          fabric.util.loadImage(options.source, function(img) {
            _this.source = img;
          });
        }
      } else {
        this.source = options.source;
      }
    }
    if (options.repeat) {
      this.repeat = options.repeat;
    }
    if (options.offsetX) {
      this.offsetX = options.offsetX;
    }
    if (options.offsetY) {
      this.offsetY = options.offsetY;
    }
  },
  toObject: function() {
    var source;
    if (typeof this.source === 'function') {
      source = String(this.source);
    } else if (typeof this.source.src === 'string') {
      source = this.source.src;
    }
    return {
      source: source,
      repeat: this.repeat,
      offsetX: this.offsetX,
      offsetY: this.offsetY
    };
  },
  toSVG: function(object) {
    var patternSource = typeof this.source === 'function' ? this.source() : this.source;
    var patternWidth = patternSource.width / object.getWidth();
    var patternHeight = patternSource.height / object.getHeight();
    var patternImgSrc = '';
    if (patternSource.src) {
      patternImgSrc = patternSource.src;
    } else if (patternSource.toDataURL) {
      patternImgSrc = patternSource.toDataURL();
    }
    return '<pattern id="SVGID_' + this.id + '" x="' + this.offsetX + '" y="' + this.offsetY + '" width="' + patternWidth + '" height="' + patternHeight + '">' + '<image x="0" y="0"' + ' width="' + patternSource.width + '" height="' + patternSource.height + '" xlink:href="' + patternImgSrc + '"></image>' + '</pattern>';
  },
  toLive: function(ctx) {
    var source = typeof this.source === 'function' ? this.source() : this.source;
    if (typeof source.src !== 'undefined') {
      if (!source.complete) return '';
      if (source.naturalWidth === 0 || source.naturalHeight === 0) return '';
    }
    return ctx.createPattern(source, this.repeat);
  }
});
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {});
  if (fabric.Shadow) {
    fabric.warn('fabric.Shadow is already defined.');
    return;
  }
  fabric.Shadow = fabric.util.createClass({
    color: 'rgb(0,0,0)',
    blur: 0,
    offsetX: 0,
    offsetY: 0,
    affectStroke: false,
    includeDefaultValues: true,
    initialize: function(options) {
      if (typeof options === 'string') {
        options = this._parseShadow(options);
      }
      for (var prop in options) {
        this[prop] = options[prop];
      }
      this.id = fabric.Object.__uid++;
    },
    _parseShadow: function(shadow) {
      var shadowStr = shadow.trim();
      var offsetsAndBlur = fabric.Shadow.reOffsetsAndBlur.exec(shadowStr) || [],
        color = shadowStr.replace(fabric.Shadow.reOffsetsAndBlur, '') || 'rgb(0,0,0)';
      return {
        color: color.trim(),
        offsetX: parseInt(offsetsAndBlur[1], 10) || 0,
        offsetY: parseInt(offsetsAndBlur[2], 10) || 0,
        blur: parseInt(offsetsAndBlur[3], 10) || 0
      };
    },
    toString: function() {
      return [this.offsetX, this.offsetY, this.blur, this.color].join('px ');
    },
    toSVG: function(object) {
      var mode = 'SourceAlpha';
      if (object && (object.fill === this.color || object.stroke === this.color)) {
        mode = 'SourceGraphic';
      }
      return ('<filter id="SVGID_' + this.id + '" y="-40%" height="180%">' + '<feGaussianBlur in="' + mode + '" stdDeviation="' +
        (this.blur ? this.blur / 3 : 0) + '"></feGaussianBlur>' + '<feOffset dx="' + this.offsetX + '" dy="' + this.offsetY + '"></feOffset>' + '<feMerge>' + '<feMergeNode></feMergeNode>' + '<feMergeNode in="SourceGraphic"></feMergeNode>' + '</feMerge>' + '</filter>');
    },
    toObject: function() {
      if (this.includeDefaultValues) {
        return {
          color: this.color,
          blur: this.blur,
          offsetX: this.offsetX,
          offsetY: this.offsetY
        };
      }
      var obj = {},
        proto = fabric.Shadow.prototype;
      if (this.color !== proto.color) {
        obj.color = this.color;
      }
      if (this.blur !== proto.blur) {
        obj.blur = this.blur;
      }
      if (this.offsetX !== proto.offsetX) {
        obj.offsetX = this.offsetX;
      }
      if (this.offsetY !== proto.offsetY) {
        obj.offsetY = this.offsetY;
      }
      return obj;
    }
  });
  fabric.Shadow.reOffsetsAndBlur = /(?:\s|^)(-?\d+(?:px)?(?:\s?|$))?(-?\d+(?:px)?(?:\s?|$))?(\d+(?:px)?)?(?:\s?|$)(?:$|\s)/;
})(typeof exports !== 'undefined' ? exports : this);
(function() {
  "use strict";
  if (fabric.StaticCanvas) {
    fabric.warn('fabric.StaticCanvas is already defined.');
    return;
  }
  var extend = fabric.util.object.extend,
    getElementOffset = fabric.util.getElementOffset,
    removeFromArray = fabric.util.removeFromArray,
    CANVAS_INIT_ERROR = new Error('Could not initialize `canvas` element');
  fabric.StaticCanvas = fabric.util.createClass({
    initialize: function(el, options) {
      options || (options = {});
      this._initStatic(el, options);
      fabric.StaticCanvas.activeInstance = this;
    },
    backgroundColor: '',
    backgroundImage: null,
    overlayColor: '',
    overlayImage: null,
    includeDefaultValues: true,
    stateful: true,
    renderOnAddRemove: true,
    clipTo: null,
    controlsAboveOverlay: false,
    allowTouchScrolling: false,
    onBeforeScaleRotate: function() {},
    _initStatic: function(el, options) {
      this._objects = [];
      this._createLowerCanvas(el);
      this._initOptions(options);
      if (options.overlayImage) {
        this.setOverlayImage(options.overlayImage, this.renderAll.bind(this));
      }
      if (options.backgroundImage) {
        this.setBackgroundImage(options.backgroundImage, this.renderAll.bind(this));
      }
      if (options.backgroundColor) {
        this.setBackgroundColor(options.backgroundColor, this.renderAll.bind(this));
      }
      if (options.overlayColor) {
        this.setOverlayColor(options.overlayColor, this.renderAll.bind(this));
      }
      this.calcOffset();
    },
    calcOffset: function() {
      this._offset = getElementOffset(this.lowerCanvasEl);
      return this;
    },
    setOverlayImage: function(image, callback, options) {
      return this.__setBgOverlayImage('overlayImage', image, callback, options);
    },
    setBackgroundImage: function(image, callback, options) {
      return this.__setBgOverlayImage('backgroundImage', image, callback, options);
    },
    setOverlayColor: function(overlayColor, callback) {
      return this.__setBgOverlayColor('overlayColor', overlayColor, callback);
    },
    setBackgroundColor: function(backgroundColor, callback) {
      return this.__setBgOverlayColor('backgroundColor', backgroundColor, callback);
    },
    __setBgOverlayImage: function(property, image, callback, options) {
      if (typeof image === 'string') {
        fabric.util.loadImage(image, function(img) {
          this[property] = new fabric.Image(img, options);
          callback && callback();
        }, this);
      } else {
        this[property] = image;
        callback && callback();
      }
      return this;
    },
    __setBgOverlayColor: function(property, color, callback) {
      if (color.source) {
        var _this = this;
        fabric.util.loadImage(color.source, function(img) {
          _this[property] = new fabric.Pattern({
            source: img,
            repeat: color.repeat,
            offsetX: color.offsetX,
            offsetY: color.offsetY
          });
          callback && callback();
        });
      } else {
        this[property] = color;
        callback && callback();
      }
      return this;
    },
    _createCanvasElement: function() {
      var element = fabric.document.createElement('canvas');
      if (!element.style) {
        element.style = {};
      }
      if (!element) {
        throw CANVAS_INIT_ERROR;
      }
      this._initCanvasElement(element);
      return element;
    },
    _initCanvasElement: function(element) {
      fabric.util.createCanvasElement(element);
      if (typeof element.getContext === 'undefined') {
        throw CANVAS_INIT_ERROR;
      }
    },
    _initOptions: function(options) {
      for (var prop in options) {
        this[prop] = options[prop];
      }
      this.width = this.width || parseInt(this.lowerCanvasEl.width, 10) || 0;
      this.height = this.height || parseInt(this.lowerCanvasEl.height, 10) || 0;
      if (!this.lowerCanvasEl.style) return;
      this.lowerCanvasEl.width = this.width;
      this.lowerCanvasEl.height = this.height;
      this.lowerCanvasEl.style.width = this.width + 'px';
      this.lowerCanvasEl.style.height = this.height + 'px';
    },
    _createLowerCanvas: function(canvasEl) {
      this.lowerCanvasEl = fabric.util.getById(canvasEl) || this._createCanvasElement();
      this._initCanvasElement(this.lowerCanvasEl);
      fabric.util.addClass(this.lowerCanvasEl, 'lower-canvas');
      if (this.interactive) {
        this._applyCanvasStyle(this.lowerCanvasEl);
      }
      this.contextContainer = this.lowerCanvasEl.getContext('2d');
    },
    getWidth: function() {
      return this.width;
    },
    getHeight: function() {
      return this.height;
    },
    setWidth: function(value) {
      return this._setDimension('width', value);
    },
    setHeight: function(value) {
      return this._setDimension('height', value);
    },
    setDimensions: function(dimensions) {
      for (var prop in dimensions) {
        this._setDimension(prop, dimensions[prop]);
      }
      return this;
    },
    _setDimension: function(prop, value) {
      this.lowerCanvasEl[prop] = value;
      this.lowerCanvasEl.style[prop] = value + 'px';
      if (this.upperCanvasEl) {
        this.upperCanvasEl[prop] = value;
        this.upperCanvasEl.style[prop] = value + 'px';
      }
      if (this.cacheCanvasEl) {
        this.cacheCanvasEl[prop] = value;
      }
      if (this.wrapperEl) {
        this.wrapperEl.style[prop] = value + 'px';
      }
      this[prop] = value;
      this.calcOffset();
      this.renderAll();
      return this;
    },
    getElement: function() {
      return this.lowerCanvasEl;
    },
    getActiveObject: function() {
      return null;
    },
    getActiveGroup: function() {
      return null;
    },
    _draw: function(ctx, object) {
      if (!object) return;
      if (this.controlsAboveOverlay) {
        var hasBorders = object.hasBorders,
          hasControls = object.hasControls;
        object.hasBorders = object.hasControls = false;
        object.render(ctx);
        object.hasBorders = hasBorders;
        object.hasControls = hasControls;
      } else {
        object.render(ctx);
      }
    },
    _onObjectAdded: function(obj) {
      this.stateful && obj.setupState();
      obj.setCoords();
      obj.canvas = this;
      this.fire('object:added', {
        target: obj
      });
      obj.fire('added');
    },
    _onObjectRemoved: function(obj) {
      if (this.getActiveObject() === obj) {
        this.fire('before:selection:cleared', {
          target: obj
        });
        this._discardActiveObject();
        this.fire('selection:cleared');
      }
      this.fire('object:removed', {
        target: obj
      });
      obj.fire('removed');
    },
    clearContext: function(ctx) {
      ctx.clearRect(0, 0, this.width, this.height);
      return this;
    },
    getContext: function() {
      return this.contextContainer;
    },
    clear: function() {
      this._objects.length = 0;
      if (this.discardActiveGroup) {
        this.discardActiveGroup();
      }
      if (this.discardActiveObject) {
        this.discardActiveObject();
      }
      this.clearContext(this.contextContainer);
      if (this.contextTop) {
        this.clearContext(this.contextTop);
      }
      this.fire('canvas:cleared');
      this.renderAll();
      return this;
    },
    renderAll: function(allOnTop) {
      var canvasToDrawOn = this[(allOnTop === true && this.interactive) ? 'contextTop' : 'contextContainer'];
      var activeGroup = this.getActiveGroup();
      if (this.contextTop && this.selection && !this._groupSelector) {
        this.clearContext(this.contextTop);
      }
      if (!allOnTop) {
        this.clearContext(canvasToDrawOn);
      }
      this.fire('before:render');
      if (this.clipTo) {
        fabric.util.clipContext(this, canvasToDrawOn);
      }
      this._renderBackground(canvasToDrawOn);
      this._renderObjects(canvasToDrawOn, activeGroup);
      this._renderActiveGroup(canvasToDrawOn, activeGroup);
      if (this.clipTo) {
        canvasToDrawOn.restore();
      }
      this._renderOverlay(canvasToDrawOn);
      if (this.controlsAboveOverlay && this.interactive) {
        this.drawControls(canvasToDrawOn);
      }
      this.fire('after:render');
      return this;
    },
    _renderObjects: function(ctx, activeGroup) {
      for (var i = 0, length = this._objects.length; i < length; ++i) {
        if (!activeGroup || (activeGroup && this._objects[i] && !activeGroup.contains(this._objects[i]))) {
          this._draw(ctx, this._objects[i]);
        }
      }
    },
    _renderActiveGroup: function(ctx, activeGroup) {
      if (activeGroup) {
        var sortedObjects = [];
        this.forEachObject(function(object) {
          if (activeGroup.contains(object)) {
            sortedObjects.push(object);
          }
        });
        activeGroup._set('objects', sortedObjects);
        this._draw(ctx, activeGroup);
      }
    },
    _renderBackground: function(ctx) {
      if (this.backgroundColor) {
        ctx.fillStyle = this.backgroundColor.toLive ? this.backgroundColor.toLive(ctx) : this.backgroundColor;
        ctx.fillRect(this.backgroundColor.offsetX || 0, this.backgroundColor.offsetY || 0, this.width, this.height);
      }
      if (this.backgroundImage) {
        this.backgroundImage.render(ctx);
      }
    },
    _renderOverlay: function(ctx) {
      if (this.overlayColor) {
        ctx.fillStyle = this.overlayColor.toLive ? this.overlayColor.toLive(ctx) : this.overlayColor;
        ctx.fillRect(this.overlayColor.offsetX || 0, this.overlayColor.offsetY || 0, this.width, this.height);
      }
      if (this.overlayImage) {
        this.overlayImage.render(ctx);
      }
    },
    renderTop: function() {
      var ctx = this.contextTop || this.contextContainer;
      this.clearContext(ctx);
      if (this.selection && this._groupSelector) {
        this._drawSelection();
      }
      var activeGroup = this.getActiveGroup();
      if (activeGroup) {
        activeGroup.render(ctx);
      }
      this._renderOverlay(ctx);
      this.fire('after:render');
      return this;
    },
    getCenter: function() {
      return {
        top: this.getHeight() / 2,
        left: this.getWidth() / 2
      };
    },
    centerObjectH: function(object) {
      this._centerObject(object, new fabric.Point(this.getCenter().left, object.getCenterPoint().y));
      this.renderAll();
      return this;
    },
    centerObjectV: function(object) {
      this._centerObject(object, new fabric.Point(object.getCenterPoint().x, this.getCenter().top));
      this.renderAll();
      return this;
    },
    centerObject: function(object) {
      var center = this.getCenter();
      this._centerObject(object, new fabric.Point(center.left, center.top));
      this.renderAll();
      return this;
    },
    _centerObject: function(object, center) {
      object.setPositionByOrigin(center, 'center', 'center');
      return this;
    },
    toDatalessJSON: function(propertiesToInclude) {
      return this.toDatalessObject(propertiesToInclude);
    },
    toObject: function(propertiesToInclude) {
      return this._toObjectMethod('toObject', propertiesToInclude);
    },
    toDatalessObject: function(propertiesToInclude) {
      return this._toObjectMethod('toDatalessObject', propertiesToInclude);
    },
    _toObjectMethod: function(methodName, propertiesToInclude) {
      var activeGroup = this.getActiveGroup();
      if (activeGroup) {
        this.discardActiveGroup();
      }
      var data = {
        objects: this._toObjects(methodName, propertiesToInclude)
      };
      extend(data, this.__serializeBgOverlay());
      fabric.util.populateWithProperties(this, data, propertiesToInclude);
      if (activeGroup) {
        this.setActiveGroup(new fabric.Group(activeGroup.getObjects()));
        activeGroup.forEachObject(function(o) {
          o.set('active', true);
        });
      }
      return data;
    },
    _toObjects: function(methodName, propertiesToInclude) {
      return this.getObjects().map(function(instance) {
        return this._toObject(instance, methodName, propertiesToInclude);
      }, this);
    },
    _toObject: function(instance, methodName, propertiesToInclude) {
      var originalValue;
      if (!this.includeDefaultValues) {
        originalValue = instance.includeDefaultValues;
        instance.includeDefaultValues = false;
      }
      var object = instance[methodName](propertiesToInclude);
      if (!this.includeDefaultValues) {
        instance.includeDefaultValues = originalValue;
      }
      return object;
    },
    __serializeBgOverlay: function() {
      var data = {
        background: (this.backgroundColor && this.backgroundColor.toObject) ? this.backgroundColor.toObject() : this.backgroundColor
      };
      if (this.overlayColor) {
        data.overlay = this.overlayColor.toObject ? this.overlayColor.toObject() : this.overlayColor;
      }
      if (this.backgroundImage) {
        data.backgroundImage = this.backgroundImage.toObject();
      }
      if (this.overlayImage) {
        data.overlayImage = this.overlayImage.toObject();
      }
      return data;
    },
    toSVG: function(options, reviver) {
      options || (options = {});
      var markup = [];
      this._setSVGPreamble(markup, options);
      this._setSVGHeader(markup, options);
      this._setSVGBgOverlayColor(markup, 'backgroundColor');
      this._setSVGBgOverlayImage(markup, 'backgroundImage');
      this._setSVGObjects(markup, reviver);
      this._setSVGBgOverlayColor(markup, 'overlayColor');
      this._setSVGBgOverlayImage(markup, 'overlayImage');
      markup.push('</svg>');
      return markup.join('');
    },
    _setSVGPreamble: function(markup, options) {
      if (!options.suppressPreamble) {
        markup.push('<?xml version="1.0" encoding="', (options.encoding || 'UTF-8'), '" standalone="no" ?>', '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ', '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n');
      }
    },
    _setSVGHeader: function(markup, options) {
      markup.push('<svg ', 'xmlns="http://www.w3.org/2000/svg" ', 'xmlns:xlink="http://www.w3.org/1999/xlink" ', 'version="1.1" ', 'width="', (options.viewBox ? options.viewBox.width : this.width), '" ', 'height="', (options.viewBox ? options.viewBox.height : this.height), '" ', (this.backgroundColor && !this.backgroundColor.toLive ? 'style="background-color: ' + this.backgroundColor + '" ' : null), (options.viewBox ? 'viewBox="' +
        options.viewBox.x + ' ' +
        options.viewBox.y + ' ' +
        options.viewBox.width + ' ' +
        options.viewBox.height + '" ' : null), 'xml:space="preserve">', '<desc>Created with Fabric.js ', fabric.version, '</desc>', '<defs>', fabric.createSVGFontFacesMarkup(this.getObjects()), fabric.createSVGRefElementsMarkup(this), '</defs>');
    },
    _setSVGObjects: function(markup, reviver) {
      var activeGroup = this.getActiveGroup();
      if (activeGroup) {
        this.discardActiveGroup();
      }
      for (var i = 0, objects = this.getObjects(), len = objects.length; i < len; i++) {
        markup.push(objects[i].toSVG(reviver));
      }
      if (activeGroup) {
        this.setActiveGroup(new fabric.Group(activeGroup.getObjects()));
        activeGroup.forEachObject(function(o) {
          o.set('active', true);
        });
      }
    },
    _setSVGBgOverlayImage: function(markup, property) {
      if (this[property] && this[property].toSVG) {
        markup.push(this[property].toSVG());
      }
    },
    _setSVGBgOverlayColor: function(markup, property) {
      if (this[property] && this[property].source) {
        markup.push('<rect x="', this[property].offsetX, '" y="', this[property].offsetY, '" ', 'width="', (this[property].repeat === 'repeat-y' || this[property].repeat === 'no-repeat' ? this[property].source.width : this.width), '" height="', (this[property].repeat === 'repeat-x' || this[property].repeat === 'no-repeat' ? this[property].source.height : this.height), '" fill="url(#' + property + 'Pattern)"', '></rect>');
      } else if (this[property] && property === 'overlayColor') {
        markup.push('<rect x="0" y="0" ', 'width="', this.width, '" height="', this.height, '" fill="', this[property], '"', '></rect>');
      }
    },
    sendToBack: function(object) {
      removeFromArray(this._objects, object);
      this._objects.unshift(object);
      return this.renderAll && this.renderAll();
    },
    bringToFront: function(object) {
      removeFromArray(this._objects, object);
      this._objects.push(object);
      return this.renderAll && this.renderAll();
    },
    sendBackwards: function(object, intersecting) {
      var idx = this._objects.indexOf(object);
      if (idx !== 0) {
        var newIdx = this._findNewLowerIndex(object, idx, intersecting);
        removeFromArray(this._objects, object);
        this._objects.splice(newIdx, 0, object);
        this.renderAll && this.renderAll();
      }
      return this;
    },
    _findNewLowerIndex: function(object, idx, intersecting) {
      var newIdx;
      if (intersecting) {
        newIdx = idx;
        for (var i = idx - 1; i >= 0; --i) {
          var isIntersecting = object.intersectsWithObject(this._objects[i]) || object.isContainedWithinObject(this._objects[i]) || this._objects[i].isContainedWithinObject(object);
          if (isIntersecting) {
            newIdx = i;
            break;
          }
        }
      } else {
        newIdx = idx - 1;
      }
      return newIdx;
    },
    bringForward: function(object, intersecting) {
      var idx = this._objects.indexOf(object);
      if (idx !== this._objects.length - 1) {
        var newIdx = this._findNewUpperIndex(object, idx, intersecting);
        removeFromArray(this._objects, object);
        this._objects.splice(newIdx, 0, object);
        this.renderAll && this.renderAll();
      }
      return this;
    },
    _findNewUpperIndex: function(object, idx, intersecting) {
      var newIdx;
      if (intersecting) {
        newIdx = idx;
        for (var i = idx + 1; i < this._objects.length; ++i) {
          var isIntersecting = object.intersectsWithObject(this._objects[i]) || object.isContainedWithinObject(this._objects[i]) || this._objects[i].isContainedWithinObject(object);
          if (isIntersecting) {
            newIdx = i;
            break;
          }
        }
      } else {
        newIdx = idx + 1;
      }
      return newIdx;
    },
    moveTo: function(object, index) {
      removeFromArray(this._objects, object);
      this._objects.splice(index, 0, object);
      return this.renderAll && this.renderAll();
    },
    dispose: function() {
      this.clear();
      this.interactive && this.removeListeners();
      return this;
    },
    toString: function() {
      return '#<fabric.Canvas (' + this.complexity() + '): ' + '{ objects: ' + this.getObjects().length + ' }>';
    }
  });
  extend(fabric.StaticCanvas.prototype, fabric.Observable);
  extend(fabric.StaticCanvas.prototype, fabric.Collection);
  extend(fabric.StaticCanvas.prototype, fabric.DataURLExporter);
  extend(fabric.StaticCanvas, {
    EMPTY_JSON: '{"objects": [], "background": "white"}',
    supports: function(methodName) {
      var el = fabric.util.createCanvasElement();
      if (!el || !el.getContext) {
        return null;
      }
      var ctx = el.getContext('2d');
      if (!ctx) {
        return null;
      }
      switch (methodName) {
        case 'getImageData':
          return typeof ctx.getImageData !== 'undefined';
        case 'setLineDash':
          return typeof ctx.setLineDash !== 'undefined';
        case 'toDataURL':
          return typeof el.toDataURL !== 'undefined';
        case 'toDataURLWithQuality':
          try {
            el.toDataURL('image/jpeg', 0);
            return true;
          } catch (e) {}
          return false;
        default:
          return null;
      }
    }
  });
  fabric.StaticCanvas.prototype.toJSON = fabric.StaticCanvas.prototype.toObject;
})();
fabric.BaseBrush = fabric.util.createClass({
  color: 'rgb(0, 0, 0)',
  width: 1,
  shadow: null,
  strokeLineCap: 'round',
  strokeLineJoin: 'round',
  setShadow: function(options) {
    this.shadow = new fabric.Shadow(options);
    return this;
  },
  _setBrushStyles: function() {
    var ctx = this.canvas.contextTop;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.lineCap = this.strokeLineCap;
    ctx.lineJoin = this.strokeLineJoin;
  },
  _setShadow: function() {
    if (!this.shadow) return;
    var ctx = this.canvas.contextTop;
    ctx.shadowColor = this.shadow.color;
    ctx.shadowBlur = this.shadow.blur;
    ctx.shadowOffsetX = this.shadow.offsetX;
    ctx.shadowOffsetY = this.shadow.offsetY;
  },
  _resetShadow: function() {
    var ctx = this.canvas.contextTop;
    ctx.shadowColor = '';
    ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
  }
});
(function() {
  var utilMin = fabric.util.array.min,
    utilMax = fabric.util.array.max;
  fabric.PencilBrush = fabric.util.createClass(fabric.BaseBrush, {
    initialize: function(canvas) {
      this.canvas = canvas;
      this._points = [];
    },
    onMouseDown: function(pointer) {
      this._prepareForDrawing(pointer);
      this._captureDrawingPath(pointer);
      this._render();
    },
    onMouseMove: function(pointer) {
      this._captureDrawingPath(pointer);
      this.canvas.clearContext(this.canvas.contextTop);
      this._render();
    },
    onMouseUp: function() {
      this._finalizeAndAddPath();
    },
    _prepareForDrawing: function(pointer) {
      var p = new fabric.Point(pointer.x, pointer.y);
      this._reset();
      this._addPoint(p);
      this.canvas.contextTop.moveTo(p.x, p.y);
    },
    _addPoint: function(point) {
      this._points.push(point);
    },
    _reset: function() {
      this._points.length = 0;
      this._setBrushStyles();
      this._setShadow();
    },
    _captureDrawingPath: function(pointer) {
      var pointerPoint = new fabric.Point(pointer.x, pointer.y);
      this._addPoint(pointerPoint);
    },
    _render: function() {
      var ctx = this.canvas.contextTop;
      ctx.beginPath();
      var p1 = this._points[0];
      var p2 = this._points[1];
      if (this._points.length === 2 && p1.x === p2.x && p1.y === p2.y) {
        p1.x -= 0.5;
        p2.x += 0.5;
      }
      ctx.moveTo(p1.x, p1.y);
      for (var i = 1, len = this._points.length; i < len; i++) {
        var midPoint = p1.midPointFrom(p2);
        ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        p1 = this._points[i];
        p2 = this._points[i + 1];
      }
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    },
    _getSVGPathData: function() {
      this.box = this.getPathBoundingBox(this._points);
      return this.convertPointsToSVGPath(this._points, this.box.minx, this.box.maxx, this.box.miny, this.box.maxy);
    },
    getPathBoundingBox: function(points) {
      var xBounds = [],
        yBounds = [],
        p1 = points[0],
        p2 = points[1],
        startPoint = p1;
      for (var i = 1, len = points.length; i < len; i++) {
        var midPoint = p1.midPointFrom(p2);
        xBounds.push(startPoint.x);
        xBounds.push(midPoint.x);
        yBounds.push(startPoint.y);
        yBounds.push(midPoint.y);
        p1 = points[i];
        p2 = points[i + 1];
        startPoint = midPoint;
      }
      xBounds.push(p1.x);
      yBounds.push(p1.y);
      return {
        minx: utilMin(xBounds),
        miny: utilMin(yBounds),
        maxx: utilMax(xBounds),
        maxy: utilMax(yBounds)
      };
    },
    convertPointsToSVGPath: function(points, minX, maxX, minY) {
      var path = [];
      var p1 = new fabric.Point(points[0].x - minX, points[0].y - minY);
      var p2 = new fabric.Point(points[1].x - minX, points[1].y - minY);
      path.push('M ', points[0].x - minX, ' ', points[0].y - minY, ' ');
      for (var i = 1, len = points.length; i < len; i++) {
        var midPoint = p1.midPointFrom(p2);
        path.push('Q ', p1.x, ' ', p1.y, ' ', midPoint.x, ' ', midPoint.y, ' ');
        p1 = new fabric.Point(points[i].x - minX, points[i].y - minY);
        if ((i + 1) < points.length) {
          p2 = new fabric.Point(points[i + 1].x - minX, points[i + 1].y - minY);
        }
      }
      path.push('L ', p1.x, ' ', p1.y, ' ');
      return path;
    },
    createPath: function(pathData) {
      var path = new fabric.Path(pathData);
      path.fill = null;
      path.stroke = this.color;
      path.strokeWidth = this.width;
      path.strokeLineCap = this.strokeLineCap;
      path.strokeLineJoin = this.strokeLineJoin;
      if (this.shadow) {
        this.shadow.affectStroke = true;
        path.setShadow(this.shadow);
      }
      return path;
    },
    _finalizeAndAddPath: function() {
      var ctx = this.canvas.contextTop;
      ctx.closePath();
      var pathData = this._getSVGPathData().join('');
      if (pathData === "M 0 0 Q 0 0 0 0 L 0 0") {
        this.canvas.renderAll();
        return;
      }
      var originLeft = this.box.minx + (this.box.maxx - this.box.minx) / 2;
      var originTop = this.box.miny + (this.box.maxy - this.box.miny) / 2;
      this.canvas.contextTop.arc(originLeft, originTop, 3, 0, Math.PI * 2, false);
      var path = this.createPath(pathData);
      path.set({
        left: originLeft,
        top: originTop,
        originX: 'center',
        originY: 'center'
      });
      this.canvas.add(path);
      path.setCoords();
      this.canvas.clearContext(this.canvas.contextTop);
      this._resetShadow();
      this.canvas.renderAll();
      this.canvas.fire('path:created', {
        path: path
      });
    }
  });
})();
fabric.CircleBrush = fabric.util.createClass(fabric.BaseBrush, {
  width: 10,
  initialize: function(canvas) {
    this.canvas = canvas;
    this.points = [];
  },
  drawDot: function(pointer) {
    var point = this.addPoint(pointer);
    var ctx = this.canvas.contextTop;
    ctx.fillStyle = point.fill;
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
  },
  onMouseDown: function(pointer) {
    this.points.length = 0;
    this.canvas.clearContext(this.canvas.contextTop);
    this._setShadow();
    this.drawDot(pointer);
  },
  onMouseMove: function(pointer) {
    this.drawDot(pointer);
  },
  onMouseUp: function() {
    var originalRenderOnAddRemove = this.canvas.renderOnAddRemove;
    this.canvas.renderOnAddRemove = false;
    var circles = [];
    for (var i = 0, len = this.points.length; i < len; i++) {
      var point = this.points[i];
      var circle = new fabric.Circle({
        radius: point.radius,
        left: point.x,
        top: point.y,
        originX: 'center',
        originY: 'center',
        fill: point.fill
      });
      this.shadow && circle.setShadow(this.shadow);
      circles.push(circle);
    }
    var group = new fabric.Group(circles, {
      originX: 'center',
      originY: 'center'
    });
    this.canvas.add(group);
    this.canvas.fire('path:created', {
      path: group
    });
    this.canvas.clearContext(this.canvas.contextTop);
    this._resetShadow();
    this.canvas.renderOnAddRemove = originalRenderOnAddRemove;
    this.canvas.renderAll();
  },
  addPoint: function(pointer) {
    var pointerPoint = new fabric.Point(pointer.x, pointer.y);
    var circleRadius = fabric.util.getRandomInt(Math.max(0, this.width - 20), this.width + 20) / 2;
    var circleColor = new fabric.Color(this.color).setAlpha(fabric.util.getRandomInt(0, 100) / 100)
      .toRgba();
    pointerPoint.radius = circleRadius;
    pointerPoint.fill = circleColor;
    this.points.push(pointerPoint);
    return pointerPoint;
  }
});
fabric.SprayBrush = fabric.util.createClass(fabric.BaseBrush, {
  width: 10,
  density: 20,
  dotWidth: 1,
  dotWidthVariance: 1,
  randomOpacity: false,
  optimizeOverlapping: true,
  initialize: function(canvas) {
    this.canvas = canvas;
    this.sprayChunks = [];
  },
  onMouseDown: function(pointer) {
    this.sprayChunks.length = 0;
    this.canvas.clearContext(this.canvas.contextTop);
    this._setShadow();
    this.addSprayChunk(pointer);
    this.render();
  },
  onMouseMove: function(pointer) {
    this.addSprayChunk(pointer);
    this.render();
  },
  onMouseUp: function() {
    var originalRenderOnAddRemove = this.canvas.renderOnAddRemove;
    this.canvas.renderOnAddRemove = false;
    var rects = [];
    for (var i = 0, ilen = this.sprayChunks.length; i < ilen; i++) {
      var sprayChunk = this.sprayChunks[i];
      for (var j = 0, jlen = sprayChunk.length; j < jlen; j++) {
        var rect = new fabric.Rect({
          width: sprayChunk[j].width,
          height: sprayChunk[j].width,
          left: sprayChunk[j].x + 1,
          top: sprayChunk[j].y + 1,
          originX: 'center',
          originY: 'center',
          fill: this.color
        });
        this.shadow && rect.setShadow(this.shadow);
        rects.push(rect);
      }
    }
    if (this.optimizeOverlapping) {
      rects = this._getOptimizedRects(rects);
    }
    var group = new fabric.Group(rects, {
      originX: 'center',
      originY: 'center'
    });
    this.canvas.add(group);
    this.canvas.fire('path:created', {
      path: group
    });
    this.canvas.clearContext(this.canvas.contextTop);
    this._resetShadow();
    this.canvas.renderOnAddRemove = originalRenderOnAddRemove;
    this.canvas.renderAll();
  },
  _getOptimizedRects: function(rects) {
    var uniqueRects = {},
      key;
    for (var i = 0, len = rects.length; i < len; i++) {
      key = rects[i].left + '' + rects[i].top;
      if (!uniqueRects[key]) {
        uniqueRects[key] = rects[i];
      }
    }
    var uniqueRectsArray = [];
    for (key in uniqueRects) {
      uniqueRectsArray.push(uniqueRects[key]);
    }
    return uniqueRectsArray;
  },
  render: function() {
    var ctx = this.canvas.contextTop;
    ctx.fillStyle = this.color;
    ctx.save();
    for (var i = 0, len = this.sprayChunkPoints.length; i < len; i++) {
      var point = this.sprayChunkPoints[i];
      if (typeof point.opacity !== 'undefined') {
        ctx.globalAlpha = point.opacity;
      }
      ctx.fillRect(point.x, point.y, point.width, point.width);
    }
    ctx.restore();
  },
  addSprayChunk: function(pointer) {
    this.sprayChunkPoints = [];
    var x, y, width, radius = this.width / 2;
    for (var i = 0; i < this.density; i++) {
      x = fabric.util.getRandomInt(pointer.x - radius, pointer.x + radius);
      y = fabric.util.getRandomInt(pointer.y - radius, pointer.y + radius);
      if (this.dotWidthVariance) {
        width = fabric.util.getRandomInt(Math.max(1, this.dotWidth - this.dotWidthVariance), this.dotWidth + this.dotWidthVariance);
      } else {
        width = this.dotWidth;
      }
      var point = {
        x: x,
        y: y,
        width: width
      };
      if (this.randomOpacity) {
        point.opacity = fabric.util.getRandomInt(0, 100) / 100;
      }
      this.sprayChunkPoints.push(point);
    }
    this.sprayChunks.push(this.sprayChunkPoints);
  }
});
fabric.PatternBrush = fabric.util.createClass(fabric.PencilBrush, {
  getPatternSrc: function() {
    var dotWidth = 20,
      dotDistance = 5,
      patternCanvas = fabric.document.createElement('canvas'),
      patternCtx = patternCanvas.getContext('2d');
    patternCanvas.width = patternCanvas.height = dotWidth + dotDistance;
    patternCtx.fillStyle = this.color;
    patternCtx.beginPath();
    patternCtx.arc(dotWidth / 2, dotWidth / 2, dotWidth / 2, 0, Math.PI * 2, false);
    patternCtx.closePath();
    patternCtx.fill();
    return patternCanvas;
  },
  getPatternSrcFunction: function() {
    return String(this.getPatternSrc).replace('this.color', '"' + this.color + '"');
  },
  getPattern: function() {
    return this.canvas.contextTop.createPattern(this.source || this.getPatternSrc(), 'repeat');
  },
  _setBrushStyles: function() {
    this.callSuper('_setBrushStyles');
    this.canvas.contextTop.strokeStyle = this.getPattern();
  },
  createPath: function(pathData) {
    var path = this.callSuper('createPath', pathData);
    path.stroke = new fabric.Pattern({
      source: this.source || this.getPatternSrcFunction()
    });
    return path;
  }
});
(function() {
  var getPointer = fabric.util.getPointer,
    degreesToRadians = fabric.util.degreesToRadians,
    radiansToDegrees = fabric.util.radiansToDegrees,
    atan2 = Math.atan2,
    abs = Math.abs,
    STROKE_OFFSET = 0.5;
  fabric.Canvas = fabric.util.createClass(fabric.StaticCanvas, {
    initialize: function(el, options) {
      options || (options = {});
      this._initStatic(el, options);
      this._initInteractive();
      this._createCacheCanvas();
      fabric.Canvas.activeInstance = this;
    },
    uniScaleTransform: false,
    centeredScaling: false,
    centeredRotation: false,
    interactive: true,
    selection: true,
    selectionColor: 'rgba(100, 100, 255, 0.3)',
    selectionDashArray: [],
    selectionBorderColor: 'rgba(255, 255, 255, 0.3)',
    selectionLineWidth: 1,
    hoverCursor: 'move',
    moveCursor: 'move',
    defaultCursor: 'default',
    freeDrawingCursor: 'crosshair',
    rotationCursor: 'crosshair',
    containerClass: 'canvas-container',
    perPixelTargetFind: false,
    targetFindTolerance: 0,
    skipTargetFind: false,
    _initInteractive: function() {
      this._currentTransform = null;
      this._groupSelector = null;
      this._initWrapperElement();
      this._createUpperCanvas();
      this._initEventListeners();
      this.freeDrawingBrush = fabric.PencilBrush && new fabric.PencilBrush(this);
      this.calcOffset();
    },
    _resetCurrentTransform: function(e) {
      var t = this._currentTransform;
      t.target.set({
        'scaleX': t.original.scaleX,
        'scaleY': t.original.scaleY,
        'left': t.original.left,
        'top': t.original.top
      });
      if (this._shouldCenterTransform(e, t.target)) {
        if (t.action === 'rotate') {
          this._setOriginToCenter(t.target);
        } else {
          if (t.originX !== 'center') {
            if (t.originX === 'right') {
              t.mouseXSign = -1;
            } else {
              t.mouseXSign = 1;
            }
          }
          if (t.originY !== 'center') {
            if (t.originY === 'bottom') {
              t.mouseYSign = -1;
            } else {
              t.mouseYSign = 1;
            }
          }
          t.originX = 'center';
          t.originY = 'center';
        }
      } else {
        t.originX = t.original.originX;
        t.originY = t.original.originY;
      }
    },
    containsPoint: function(e, target) {
      var pointer = this.getPointer(e),
        xy = this._normalizePointer(target, pointer);
      return (target.containsPoint(xy) || target._findTargetCorner(e, this._offset));
    },
    _normalizePointer: function(object, pointer) {
      var activeGroup = this.getActiveGroup(),
        x = pointer.x,
        y = pointer.y;
      var isObjectInGroup = (activeGroup && object.type !== 'group' && activeGroup.contains(object));
      if (isObjectInGroup) {
        x -= activeGroup.left;
        y -= activeGroup.top;
      }
      return {
        x: x,
        y: y
      };
    },
    isTargetTransparent: function(target, x, y) {
      var hasBorders = target.hasBorders,
        transparentCorners = target.transparentCorners;
      target.hasBorders = target.transparentCorners = false;
      this._draw(this.contextCache, target);
      target.hasBorders = hasBorders;
      target.transparentCorners = transparentCorners;
      var isTransparent = fabric.util.isTransparent(this.contextCache, x, y, this.targetFindTolerance);
      this.clearContext(this.contextCache);
      return isTransparent;
    },
    _shouldClearSelection: function(e, target) {
      var activeGroup = this.getActiveGroup(),
        activeObject = this.getActiveObject();
      return (!target || (target && activeGroup && !activeGroup.contains(target) && activeGroup !== target && !e.shiftKey) || (target && !target.evented) || (target && !target.selectable && activeObject && activeObject !== target));
    },
    _shouldCenterTransform: function(e, target) {
      if (!target) return;
      var t = this._currentTransform,
        centerTransform;
      if (t.action === 'scale' || t.action === 'scaleX' || t.action === 'scaleY') {
        centerTransform = this.centeredScaling || target.centeredScaling;
      } else if (t.action === 'rotate') {
        centerTransform = this.centeredRotation || target.centeredRotation;
      }
      return centerTransform ? !e.altKey : e.altKey;
    },
    _getOriginFromCorner: function(target, corner) {
      var origin = {
        x: target.originX,
        y: target.originY
      };
      if (corner === 'ml' || corner === 'tl' || corner === 'bl') {
        origin.x = 'right';
      } else if (corner === 'mr' || corner === 'tr' || corner === 'br') {
        origin.x = 'left';
      }
      if (corner === 'tl' || corner === 'mt' || corner === 'tr') {
        origin.y = 'bottom';
      } else if (corner === 'bl' || corner === 'mb' || corner === 'br') {
        origin.y = 'top';
      }
      return origin;
    },
    _getActionFromCorner: function(target, corner) {
      var action = 'drag';
      if (corner) {
        action = (corner === 'ml' || corner === 'mr') ? 'scaleX' : (corner === 'mt' || corner === 'mb') ? 'scaleY' : corner === 'mtr' ? 'rotate' : 'scale';
      }
      return action;
    },
    _setupCurrentTransform: function(e, target) {
      if (!target) return;
      var corner = target._findTargetCorner(e, this._offset),
        pointer = getPointer(e, target.canvas.upperCanvasEl),
        action = this._getActionFromCorner(target, corner),
        origin = this._getOriginFromCorner(target, corner);
      this._currentTransform = {
        target: target,
        action: action,
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        offsetX: pointer.x - target.left,
        offsetY: pointer.y - target.top,
        originX: origin.x,
        originY: origin.y,
        ex: pointer.x,
        ey: pointer.y,
        left: target.left,
        top: target.top,
        theta: degreesToRadians(target.angle),
        width: target.width * target.scaleX,
        mouseXSign: 1,
        mouseYSign: 1
      };
      this._currentTransform.original = {
        left: target.left,
        top: target.top,
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        originX: origin.x,
        originY: origin.y
      };
      this._resetCurrentTransform(e);
    },
    _translateObject: function(x, y) {
      var target = this._currentTransform.target;
      if (!target.get('lockMovementX')) {
        target.set('left', x - this._currentTransform.offsetX);
      }
      if (!target.get('lockMovementY')) {
        target.set('top', y - this._currentTransform.offsetY);
      }
    },
    _scaleObject: function(x, y, by) {
      var t = this._currentTransform,
        offset = this._offset,
        target = t.target,
        lockScalingX = target.get('lockScalingX'),
        lockScalingY = target.get('lockScalingY');
      if (lockScalingX && lockScalingY) return;
      var constraintPosition = target.translateToOriginPoint(target.getCenterPoint(), t.originX, t.originY);
      var localMouse = target.toLocalPoint(new fabric.Point(x - offset.left, y - offset.top), t.originX, t.originY);
      this._setLocalMouse(localMouse, t);
      this._setObjectScale(localMouse, t, lockScalingX, lockScalingY, by);
      target.setPositionByOrigin(constraintPosition, t.originX, t.originY);
    },
    _setObjectScale: function(localMouse, transform, lockScalingX, lockScalingY, by) {
      var target = transform.target;
      transform.newScaleX = target.scaleX;
      transform.newScaleY = target.scaleY;
      if (by === 'equally' && !lockScalingX && !lockScalingY) {
        this._scaleObjectEqually(localMouse, target, transform);
      } else if (!by) {
        transform.newScaleX = localMouse.x / (target.width + target.strokeWidth);
        transform.newScaleY = localMouse.y / (target.height + target.strokeWidth);
        lockScalingX || target.set('scaleX', transform.newScaleX);
        lockScalingY || target.set('scaleY', transform.newScaleY);
      } else if (by === 'x' && !target.get('lockUniScaling')) {
        transform.newScaleX = localMouse.x / (target.width + target.strokeWidth);
        lockScalingX || target.set('scaleX', transform.newScaleX);
      } else if (by === 'y' && !target.get('lockUniScaling')) {
        transform.newScaleY = localMouse.y / (target.height + target.strokeWidth);
        lockScalingY || target.set('scaleY', transform.newScaleY);
      }
      this._flipObject(transform);
    },
    _scaleObjectEqually: function(localMouse, target, transform) {
      var dist = localMouse.y + localMouse.x;
      var lastDist = (target.height + (target.strokeWidth)) * transform.original.scaleY +
        (target.width + (target.strokeWidth)) * transform.original.scaleX;
      transform.newScaleX = transform.original.scaleX * dist / lastDist;
      transform.newScaleY = transform.original.scaleY * dist / lastDist;
      target.set('scaleX', transform.newScaleX);
      target.set('scaleY', transform.newScaleY);
    },
    _flipObject: function(transform) {
      if (transform.newScaleX < 0) {
        if (transform.originX === 'left') {
          transform.originX = 'right';
        } else if (transform.originX === 'right') {
          transform.originX = 'left';
        }
      }
      if (transform.newScaleY < 0) {
        if (transform.originY === 'top') {
          transform.originY = 'bottom';
        } else if (transform.originY === 'bottom') {
          transform.originY = 'top';
        }
      }
    },
    _setLocalMouse: function(localMouse, t) {
      var target = t.target;
      if (t.originX === 'right') {
        localMouse.x *= -1;
      } else if (t.originX === 'center') {
        localMouse.x *= t.mouseXSign * 2;
        if (localMouse.x < 0) {
          t.mouseXSign = -t.mouseXSign;
        }
      }
      if (t.originY === 'bottom') {
        localMouse.y *= -1;
      } else if (t.originY === 'center') {
        localMouse.y *= t.mouseYSign * 2;
        if (localMouse.y < 0) {
          t.mouseYSign = -t.mouseYSign;
        }
      }
      if (abs(localMouse.x) > target.padding) {
        if (localMouse.x < 0) {
          localMouse.x += target.padding;
        } else {
          localMouse.x -= target.padding;
        }
      } else {
        localMouse.x = 0;
      }
      if (abs(localMouse.y) > target.padding) {
        if (localMouse.y < 0) {
          localMouse.y += target.padding;
        } else {
          localMouse.y -= target.padding;
        }
      } else {
        localMouse.y = 0;
      }
    },
    _rotateObject: function(x, y) {
      var t = this._currentTransform,
        o = this._offset;
      if (t.target.get('lockRotation')) return;
      var lastAngle = atan2(t.ey - t.top - o.top, t.ex - t.left - o.left),
        curAngle = atan2(y - t.top - o.top, x - t.left - o.left),
        angle = radiansToDegrees(curAngle - lastAngle + t.theta);
      if (angle < 0) {
        angle = 360 + angle;
      }
      t.target.angle = angle;
    },
    _setCursor: function(value) {
      this.upperCanvasEl.style.cursor = value;
    },
    _resetObjectTransform: function(target) {
      target.scaleX = 1;
      target.scaleY = 1;
      target.setAngle(0);
    },
    _drawSelection: function() {
      var ctx = this.contextTop,
        groupSelector = this._groupSelector,
        left = groupSelector.left,
        top = groupSelector.top,
        aleft = abs(left),
        atop = abs(top);
      ctx.fillStyle = this.selectionColor;
      ctx.fillRect(groupSelector.ex - ((left > 0) ? 0 : -left), groupSelector.ey - ((top > 0) ? 0 : -top), aleft, atop);
      ctx.lineWidth = this.selectionLineWidth;
      ctx.strokeStyle = this.selectionBorderColor;
      if (this.selectionDashArray.length > 1) {
        var px = groupSelector.ex + STROKE_OFFSET - ((left > 0) ? 0 : aleft);
        var py = groupSelector.ey + STROKE_OFFSET - ((top > 0) ? 0 : atop);
        ctx.beginPath();
        fabric.util.drawDashedLine(ctx, px, py, px + aleft, py, this.selectionDashArray);
        fabric.util.drawDashedLine(ctx, px, py + atop - 1, px + aleft, py + atop - 1, this.selectionDashArray);
        fabric.util.drawDashedLine(ctx, px, py, px, py + atop, this.selectionDashArray);
        fabric.util.drawDashedLine(ctx, px + aleft - 1, py, px + aleft - 1, py + atop, this.selectionDashArray);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.strokeRect(groupSelector.ex + STROKE_OFFSET - ((left > 0) ? 0 : aleft), groupSelector.ey + STROKE_OFFSET - ((top > 0) ? 0 : atop), aleft, atop);
      }
    },
    _isLastRenderedObject: function(e) {
      return (this.controlsAboveOverlay && this.lastRenderedObjectWithControlsAboveOverlay && this.lastRenderedObjectWithControlsAboveOverlay.visible && this.containsPoint(e, this.lastRenderedObjectWithControlsAboveOverlay) && this.lastRenderedObjectWithControlsAboveOverlay._findTargetCorner(e, this._offset));
    },
    findTarget: function(e, skipGroup) {
      if (this.skipTargetFind) return;
      if (this._isLastRenderedObject(e)) {
        return this.lastRenderedObjectWithControlsAboveOverlay;
      }
      var activeGroup = this.getActiveGroup();
      if (activeGroup && !skipGroup && this.containsPoint(e, activeGroup)) {
        return activeGroup;
      }
      var target = this._searchPossibleTargets(e);
      this._fireOverOutEvents(target);
      return target;
    },
    _fireOverOutEvents: function(target) {
      if (target) {
        if (this._hoveredTarget !== target) {
          this.fire('mouse:over', {
            target: target
          });
          target.fire('mouseover');
          if (this._hoveredTarget) {
            this.fire('mouse:out', {
              target: this._hoveredTarget
            });
            this._hoveredTarget.fire('mouseout');
          }
          this._hoveredTarget = target;
        }
      } else if (this._hoveredTarget) {
        this.fire('mouse:out', {
          target: this._hoveredTarget
        });
        this._hoveredTarget.fire('mouseout');
        this._hoveredTarget = null;
      }
    },
    _searchPossibleTargets: function(e) {
      var possibleTargets = [],
        target, pointer = this.getPointer(e);
      for (var i = this._objects.length; i--;) {
        if (this._objects[i] && this._objects[i].visible && this._objects[i].evented && this.containsPoint(e, this._objects[i])) {
          if (this.perPixelTargetFind || this._objects[i].perPixelTargetFind) {
            possibleTargets[possibleTargets.length] = this._objects[i];
          } else {
            target = this._objects[i];
            this.relatedTarget = target;
            break;
          }
        }
      }
      for (var j = 0, len = possibleTargets.length; j < len; j++) {
        pointer = this.getPointer(e);
        var isTransparent = this.isTargetTransparent(possibleTargets[j], pointer.x, pointer.y);
        if (!isTransparent) {
          target = possibleTargets[j];
          this.relatedTarget = target;
          break;
        }
      }
      return target;
    },
    getPointer: function(e) {
      var pointer = getPointer(e, this.upperCanvasEl);
      return {
        x: pointer.x - this._offset.left,
        y: pointer.y - this._offset.top
      };
    },
    _createUpperCanvas: function() {
      var lowerCanvasClass = this.lowerCanvasEl.className.replace(/\s*lower-canvas\s*/, '');
      this.upperCanvasEl = this._createCanvasElement();
      fabric.util.addClass(this.upperCanvasEl, 'upper-canvas ' + lowerCanvasClass);
      this.wrapperEl.appendChild(this.upperCanvasEl);
      this._copyCanvasStyle(this.lowerCanvasEl, this.upperCanvasEl);
      this._applyCanvasStyle(this.upperCanvasEl);
      this.contextTop = this.upperCanvasEl.getContext('2d');
    },
    _createCacheCanvas: function() {
      this.cacheCanvasEl = this._createCanvasElement();
      this.cacheCanvasEl.setAttribute('width', this.width);
      this.cacheCanvasEl.setAttribute('height', this.height);
      this.contextCache = this.cacheCanvasEl.getContext('2d');
    },
    _initWrapperElement: function() {
      this.wrapperEl = fabric.util.wrapElement(this.lowerCanvasEl, 'div', {
        'class': this.containerClass
      });
      fabric.util.setStyle(this.wrapperEl, {
        width: this.getWidth() + 'px',
        height: this.getHeight() + 'px',
        position: 'relative'
      });
      fabric.util.makeElementUnselectable(this.wrapperEl);
    },
    _applyCanvasStyle: function(element) {
      var width = this.getWidth() || element.width,
        height = this.getHeight() || element.height;
      fabric.util.setStyle(element, {
        position: 'absolute',
        width: width + 'px',
        height: height + 'px',
        left: 0,
        top: 0
      });
      element.width = width;
      element.height = height;
      fabric.util.makeElementUnselectable(element);
    },
    _copyCanvasStyle: function(fromEl, toEl) {
      toEl.style.cssText = fromEl.style.cssText;
    },
    getSelectionContext: function() {
      return this.contextTop;
    },
    getSelectionElement: function() {
      return this.upperCanvasEl;
    },
    _setActiveObject: function(object) {
      if (this._activeObject) {
        this._activeObject.set('active', false);
      }
      this._activeObject = object;
      object.set('active', true);
    },
    setActiveObject: function(object, e) {
      this._setActiveObject(object);
      this.renderAll();
      this.fire('object:selected', {
        target: object,
        e: e
      });
      object.fire('selected', {
        e: e
      });
      return this;
    },
    getActiveObject: function() {
      return this._activeObject;
    },
    _discardActiveObject: function() {
      if (this._activeObject) {
        this._activeObject.set('active', false);
      }
      this._activeObject = null;
    },
    discardActiveObject: function(e) {
      this._discardActiveObject();
      this.renderAll();
      this.fire('selection:cleared', {
        e: e
      });
      return this;
    },
    _setActiveGroup: function(group) {
      this._activeGroup = group;
      if (group) {
        group.canvas = this;
        group.set('active', true);
      }
    },
    setActiveGroup: function(group, e) {
      this._setActiveGroup(group);
      if (group) {
        this.fire('object:selected', {
          target: group,
          e: e
        });
        group.fire('selected', {
          e: e
        });
      }
      return this;
    },
    getActiveGroup: function() {
      return this._activeGroup;
    },
    _discardActiveGroup: function() {
      var g = this.getActiveGroup();
      if (g) {
        g.destroy();
      }
      this.setActiveGroup(null);
    },
    discardActiveGroup: function(e) {
      this._discardActiveGroup();
      this.fire('selection:cleared', {
        e: e
      });
      return this;
    },
    deactivateAll: function() {
      var allObjects = this.getObjects(),
        i = 0,
        len = allObjects.length;
      for (; i < len; i++) {
        allObjects[i].set('active', false);
      }
      this._discardActiveGroup();
      this._discardActiveObject();
      return this;
    },
    deactivateAllWithDispatch: function(e) {
      var activeObject = this.getActiveGroup() || this.getActiveObject();
      if (activeObject) {
        this.fire('before:selection:cleared', {
          target: activeObject,
          e: e
        });
      }
      this.deactivateAll();
      if (activeObject) {
        this.fire('selection:cleared', {
          e: e
        });
      }
      return this;
    },
    drawControls: function(ctx) {
      var activeGroup = this.getActiveGroup();
      if (activeGroup) {
        this._drawGroupControls(ctx, activeGroup);
      } else {
        this._drawObjectsControls(ctx);
      }
    },
    _drawGroupControls: function(ctx, activeGroup) {
      this._drawControls(ctx, activeGroup, 'Group');
    },
    _drawObjectsControls: function(ctx) {
      for (var i = 0, len = this._objects.length; i < len; ++i) {
        if (!this._objects[i] || !this._objects[i].active) continue;
        this._drawControls(ctx, this._objects[i], 'Object');
        this.lastRenderedObjectWithControlsAboveOverlay = this._objects[i];
      }
    },
    _drawControls: function(ctx, object, klass) {
      ctx.save();
      fabric[klass].prototype.transform.call(object, ctx);
      object.drawBorders(ctx).drawControls(ctx);
      ctx.restore();
    }
  });
  for (var prop in fabric.StaticCanvas) {
    if (prop !== 'prototype') {
      fabric.Canvas[prop] = fabric.StaticCanvas[prop];
    }
  }
  if (fabric.isTouchSupported) {
    fabric.Canvas.prototype._setCursorFromEvent = function() {};
  }
  fabric.Canvas._hasITextHandlers = false;
  fabric.Element = fabric.Canvas;
})();
(function() {
  var cursorMap = ['n-resize', 'ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize', 'nw-resize'],
    cursorOffset = {
      'mt': 0,
      'tr': 1,
      'mr': 2,
      'br': 3,
      'mb': 4,
      'bl': 5,
      'ml': 6,
      'tl': 7
    },
    addListener = fabric.util.addListener,
    removeListener = fabric.util.removeListener,
    getPointer = fabric.util.getPointer;
  fabric.util.object.extend(fabric.Canvas.prototype, {
    _initEventListeners: function() {
      this._bindEvents();
      addListener(fabric.window, 'resize', this._onResize);
      addListener(this.upperCanvasEl, 'mousedown', this._onMouseDown);
      addListener(this.upperCanvasEl, 'mousemove', this._onMouseMove);
      addListener(this.upperCanvasEl, 'mousewheel', this._onMouseWheel);
      addListener(this.upperCanvasEl, 'touchstart', this._onMouseDown);
      addListener(this.upperCanvasEl, 'touchmove', this._onMouseMove);
      if (typeof Event !== 'undefined' && 'add' in Event) {
        Event.add(this.upperCanvasEl, 'gesture', this._onGesture);
        Event.add(this.upperCanvasEl, 'drag', this._onDrag);
        Event.add(this.upperCanvasEl, 'orientation', this._onOrientationChange);
        Event.add(this.upperCanvasEl, 'shake', this._onShake);
      }
    },
    _bindEvents: function() {
      this._onMouseDown = this._onMouseDown.bind(this);
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onMouseUp = this._onMouseUp.bind(this);
      this._onResize = this._onResize.bind(this);
      this._onGesture = this._onGesture.bind(this);
      this._onDrag = this._onDrag.bind(this);
      this._onShake = this._onShake.bind(this);
      this._onOrientationChange = this._onOrientationChange.bind(this);
      this._onMouseWheel = this._onMouseWheel.bind(this);
    },
    removeListeners: function() {
      removeListener(fabric.window, 'resize', this._onResize);
      removeListener(this.upperCanvasEl, 'mousedown', this._onMouseDown);
      removeListener(this.upperCanvasEl, 'mousemove', this._onMouseMove);
      removeListener(this.upperCanvasEl, 'mousewheel', this._onMouseWheel);
      removeListener(this.upperCanvasEl, 'touchstart', this._onMouseDown);
      removeListener(this.upperCanvasEl, 'touchmove', this._onMouseMove);
      if (typeof Event !== 'undefined' && 'remove' in Event) {
        Event.remove(this.upperCanvasEl, 'gesture', this._onGesture);
        Event.remove(this.upperCanvasEl, 'drag', this._onDrag);
        Event.remove(this.upperCanvasEl, 'orientation', this._onOrientationChange);
        Event.remove(this.upperCanvasEl, 'shake', this._onShake);
      }
    },
    _onGesture: function(e, s) {
      this.__onTransformGesture && this.__onTransformGesture(e, s);
    },
    _onDrag: function(e, s) {
      this.__onDrag && this.__onDrag(e, s);
    },
    _onMouseWheel: function(e, s) {
      this.__onMouseWheel && this.__onMouseWheel(e, s);
    },
    _onOrientationChange: function(e, s) {
      this.__onOrientationChange && this.__onOrientationChange(e, s);
    },
    _onShake: function(e, s) {
      this.__onShake && this.__onShake(e, s);
    },
    _onMouseDown: function(e) {
      this.__onMouseDown(e);
      addListener(fabric.document, 'mouseup', this._onMouseUp);
      addListener(fabric.document, 'touchend', this._onMouseUp);
      addListener(fabric.document, 'mousemove', this._onMouseMove);
      addListener(fabric.document, 'touchmove', this._onMouseMove);
      removeListener(this.upperCanvasEl, 'mousemove', this._onMouseMove);
      removeListener(this.upperCanvasEl, 'touchmove', this._onMouseMove);
    },
    _onMouseUp: function(e) {
      this.__onMouseUp(e);
      removeListener(fabric.document, 'mouseup', this._onMouseUp);
      removeListener(fabric.document, 'touchend', this._onMouseUp);
      removeListener(fabric.document, 'mousemove', this._onMouseMove);
      removeListener(fabric.document, 'touchmove', this._onMouseMove);
      addListener(this.upperCanvasEl, 'mousemove', this._onMouseMove);
      addListener(this.upperCanvasEl, 'touchmove', this._onMouseMove);
    },
    _onMouseMove: function(e) {
      !this.allowTouchScrolling && e.preventDefault && e.preventDefault();
      this.__onMouseMove(e);
    },
    _onResize: function() {
      this.calcOffset();
    },
    _shouldRender: function(target, pointer) {
      var activeObject = this.getActiveGroup() || this.getActiveObject();
      return !!((target && (target.isMoving || target !== activeObject)) || (!target && !!activeObject) || (!target && !activeObject && !this._groupSelector) || (pointer && this._previousPointer && this.selection && (pointer.x !== this._previousPointer.x || pointer.y !== this._previousPointer.y)));
    },
    __onMouseUp: function(e) {
      var target;
      if (this.isDrawingMode && this._isCurrentlyDrawing) {
        this._onMouseUpInDrawingMode(e);
        return;
      }
      if (this._currentTransform) {
        this._finalizeCurrentTransform();
        target = this._currentTransform.target;
      } else {
        target = this.findTarget(e, true);
      }
      var shouldRender = this._shouldRender(target, this.getPointer(e));
      this._maybeGroupObjects(e);
      if (target) {
        target.isMoving = false;
      }
      shouldRender && this.renderAll();
      this._handleCursorAndEvent(e, target);
    },
    _handleCursorAndEvent: function(e, target) {
      this._setCursorFromEvent(e, target);
      var _this = this;
      setTimeout(function() {
        _this._setCursorFromEvent(e, target);
      }, 50);
      this.fire('mouse:up', {
        target: target,
        e: e
      });
      target && target.fire('mouseup', {
        e: e
      });
    },
    _finalizeCurrentTransform: function() {
      var transform = this._currentTransform;
      var target = transform.target;
      if (target._scaling) {
        target._scaling = false;
      }
      target.setCoords();
      if (this.stateful && target.hasStateChanged()) {
        this.fire('object:modified', {
          target: target
        });
        target.fire('modified');
      }
      this._restoreOriginXY(target);
    },
    _restoreOriginXY: function(target) {
      if (this._previousOriginX && this._previousOriginY) {
        var originPoint = target.translateToOriginPoint(target.getCenterPoint(), this._previousOriginX, this._previousOriginY);
        target.originX = this._previousOriginX;
        target.originY = this._previousOriginY;
        target.left = originPoint.x;
        target.top = originPoint.y;
        this._previousOriginX = null;
        this._previousOriginY = null;
      }
    },
    _onMouseDownInDrawingMode: function(e) {
      this._isCurrentlyDrawing = true;
      this.discardActiveObject(e).renderAll();
      if (this.clipTo) {
        fabric.util.clipContext(this, this.contextTop);
      }
      this.freeDrawingBrush.onMouseDown(this.getPointer(e));
      this.fire('mouse:down', {
        e: e
      });
    },
    _onMouseMoveInDrawingMode: function(e) {
      if (this._isCurrentlyDrawing) {
        var pointer = this.getPointer(e);
        this.freeDrawingBrush.onMouseMove(pointer);
      }
      this.upperCanvasEl.style.cursor = this.freeDrawingCursor;
      this.fire('mouse:move', {
        e: e
      });
    },
    _onMouseUpInDrawingMode: function(e) {
      this._isCurrentlyDrawing = false;
      if (this.clipTo) {
        this.contextTop.restore();
      }
      this.freeDrawingBrush.onMouseUp();
      this.fire('mouse:up', {
        e: e
      });
    },
    __onMouseDown: function(e) {
      var isLeftClick = 'which' in e ? e.which === 1 : e.button === 1;
      if (!isLeftClick && !fabric.isTouchSupported) return;
      if (this.isDrawingMode) {
        this._onMouseDownInDrawingMode(e);
        return;
      }
      if (this._currentTransform) return;
      var target = this.findTarget(e),
        pointer = this.getPointer(e);
      this._previousPointer = pointer;
      var shouldRender = this._shouldRender(target, pointer),
        shouldGroup = this._shouldGroup(e, target);
      if (this._shouldClearSelection(e, target)) {
        this._clearSelection(e, target, pointer);
      } else if (shouldGroup) {
        this._handleGrouping(e, target);
        target = this.getActiveGroup();
      }
      if (target && target.selectable && !shouldGroup) {
        this._beforeTransform(e, target);
        this._setupCurrentTransform(e, target);
      }
      shouldRender && this.renderAll();
      this.fire('mouse:down', {
        target: target,
        e: e
      });
      target && target.fire('mousedown', {
        e: e
      });
    },
    _beforeTransform: function(e, target) {
      var corner;
      this.stateful && target.saveState();
      if ((corner = target._findTargetCorner(e, this._offset))) {
        this.onBeforeScaleRotate(target);
      }
      if (target !== this.getActiveGroup() && target !== this.getActiveObject()) {
        this.deactivateAll();
        this.setActiveObject(target, e);
      }
    },
    _clearSelection: function(e, target, pointer) {
      this.deactivateAllWithDispatch(e);
      if (target && target.selectable) {
        this.setActiveObject(target, e);
      } else if (this.selection) {
        this._groupSelector = {
          ex: pointer.x,
          ey: pointer.y,
          top: 0,
          left: 0
        };
      }
    },
    _setOriginToCenter: function(target) {
      this._previousOriginX = this._currentTransform.target.originX;
      this._previousOriginY = this._currentTransform.target.originY;
      var center = target.getCenterPoint();
      target.originX = 'center';
      target.originY = 'center';
      target.left = center.x;
      target.top = center.y;
      this._currentTransform.left = target.left;
      this._currentTransform.top = target.top;
    },
    _setCenterToOrigin: function(target) {
      var originPoint = target.translateToOriginPoint(target.getCenterPoint(), this._previousOriginX, this._previousOriginY);
      target.originX = this._previousOriginX;
      target.originY = this._previousOriginY;
      target.left = originPoint.x;
      target.top = originPoint.y;
      this._previousOriginX = null;
      this._previousOriginY = null;
    },
    __onMouseMove: function(e) {
      var target, pointer;
      if (this.isDrawingMode) {
        this._onMouseMoveInDrawingMode(e);
        return;
      }
      var groupSelector = this._groupSelector;
      if (groupSelector) {
        pointer = getPointer(e, this.upperCanvasEl);
        groupSelector.left = pointer.x - this._offset.left - groupSelector.ex;
        groupSelector.top = pointer.y - this._offset.top - groupSelector.ey;
        this.renderTop();
      } else if (!this._currentTransform) {
        target = this.findTarget(e);
        if (!target || target && !target.selectable) {
          this.upperCanvasEl.style.cursor = this.defaultCursor;
        } else {
          this._setCursorFromEvent(e, target);
        }
      } else {
        this._transformObject(e);
      }
      this.fire('mouse:move', {
        target: target,
        e: e
      });
      target && target.fire('mousemove', {
        e: e
      });
    },
    _transformObject: function(e) {
      var pointer = getPointer(e, this.upperCanvasEl),
        transform = this._currentTransform;
      transform.reset = false, transform.target.isMoving = true;
      this._beforeScaleTransform(e, transform);
      this._performTransformAction(e, transform, pointer);
      this.renderAll();
    },
    _performTransformAction: function(e, transform, pointer) {
      var x = pointer.x,
        y = pointer.y,
        target = transform.target,
        action = transform.action;
      if (action === 'rotate') {
        this._rotateObject(x, y);
        this._fire('rotating', target, e);
      } else if (action === 'scale') {
        this._onScale(e, transform, x, y);
        this._fire('scaling', target, e);
      } else if (action === 'scaleX') {
        this._scaleObject(x, y, 'x');
        this._fire('scaling', target, e);
      } else if (action === 'scaleY') {
        this._scaleObject(x, y, 'y');
        this._fire('scaling', target, e);
      } else {
        this._translateObject(x, y);
        this._fire('moving', target, e);
        this._setCursor(this.moveCursor);
      }
    },
    _fire: function(eventName, target, e) {
      this.fire('object:' + eventName, {
        target: target,
        e: e
      });
      target.fire(eventName, {
        e: e
      });
    },
    _beforeScaleTransform: function(e, transform) {
      if (transform.action === 'scale' || transform.action === 'scaleX' || transform.action === 'scaleY') {
        var centerTransform = this._shouldCenterTransform(e, transform.target);
        if ((centerTransform && (transform.originX !== 'center' || transform.originY !== 'center')) || (!centerTransform && transform.originX === 'center' && transform.originY === 'center')) {
          this._resetCurrentTransform(e);
          transform.reset = true;
        }
      }
    },
    _onScale: function(e, transform, x, y) {
      if ((e.shiftKey || this.uniScaleTransform) && !transform.target.get('lockUniScaling')) {
        transform.currentAction = 'scale';
        this._scaleObject(x, y);
      } else {
        if (!transform.reset && transform.currentAction === 'scale') {
          this._resetCurrentTransform(e, transform.target);
        }
        transform.currentAction = 'scaleEqually';
        this._scaleObject(x, y, 'equally');
      }
    },
    _setCursorFromEvent: function(e, target) {
      var style = this.upperCanvasEl.style;
      if (!target || !target.selectable) {
        style.cursor = this.defaultCursor;
        return false;
      } else {
        var activeGroup = this.getActiveGroup();
        var corner = target._findTargetCorner && (!activeGroup || !activeGroup.contains(target)) && target._findTargetCorner(e, this._offset);
        if (!corner) {
          style.cursor = target.hoverCursor || this.hoverCursor;
        } else {
          this._setCornerCursor(corner, target);
        }
      }
      return true;
    },
    _setCornerCursor: function(corner, target) {
      var style = this.upperCanvasEl.style;
      if (corner in cursorOffset) {
        style.cursor = this._getRotatedCornerCursor(corner, target);
      } else if (corner === 'mtr' && target.hasRotatingPoint) {
        style.cursor = this.rotationCursor;
      } else {
        style.cursor = this.defaultCursor;
        return false;
      }
    },
    _getRotatedCornerCursor: function(corner, target) {
      var n = Math.round((target.getAngle() % 360) / 45);
      if (n < 0) {
        n += 8;
      }
      n += cursorOffset[corner];
      n %= 8;
      return cursorMap[n];
    }
  });
})();
(function() {
  var min = Math.min,
    max = Math.max;
  fabric.util.object.extend(fabric.Canvas.prototype, {
    _shouldGroup: function(e, target) {
      var activeObject = this.getActiveObject();
      return e.shiftKey && (this.getActiveGroup() || (activeObject && activeObject !== target)) && this.selection;
    },
    _handleGrouping: function(e, target) {
      if (target === this.getActiveGroup()) {
        target = this.findTarget(e, true);
        if (!target || target.isType('group')) {
          return;
        }
      }
      if (this.getActiveGroup()) {
        this._updateActiveGroup(target, e);
      } else {
        this._createActiveGroup(target, e);
      }
      if (this._activeGroup) {
        this._activeGroup.saveCoords();
      }
    },
    _updateActiveGroup: function(target, e) {
      var activeGroup = this.getActiveGroup();
      if (activeGroup.contains(target)) {
        activeGroup.removeWithUpdate(target);
        this._resetObjectTransform(activeGroup);
        target.set('active', false);
        if (activeGroup.size() === 1) {
          this.discardActiveGroup(e);
          this.setActiveObject(activeGroup.item(0));
          return;
        }
      } else {
        activeGroup.addWithUpdate(target);
        this._resetObjectTransform(activeGroup);
      }
      this.fire('selection:created', {
        target: activeGroup,
        e: e
      });
      activeGroup.set('active', true);
    },
    _createActiveGroup: function(target, e) {
      if (this._activeObject && target !== this._activeObject) {
        var group = this._createGroup(target);
        this.setActiveGroup(group);
        this._activeObject = null;
        this.fire('selection:created', {
          target: group,
          e: e
        });
      }
      target.set('active', true);
    },
    _createGroup: function(target) {
      var objects = this.getObjects();
      var isActiveLower = objects.indexOf(this._activeObject) < objects.indexOf(target);
      var groupObjects = isActiveLower ? [this._activeObject, target] : [target, this._activeObject];
      return new fabric.Group(groupObjects, {
        originX: 'center',
        originY: 'center'
      });
    },
    _groupSelectedObjects: function(e) {
      var group = this._collectObjects();
      if (group.length === 1) {
        this.setActiveObject(group[0], e);
      } else if (group.length > 1) {
        group = new fabric.Group(group.reverse(), {
          originX: 'center',
          originY: 'center'
        });
        this.setActiveGroup(group, e);
        group.saveCoords();
        this.fire('selection:created', {
          target: group
        });
        this.renderAll();
      }
    },
    _collectObjects: function() {
      var group = [],
        currentObject, x1 = this._groupSelector.ex,
        y1 = this._groupSelector.ey,
        x2 = x1 + this._groupSelector.left,
        y2 = y1 + this._groupSelector.top,
        selectionX1Y1 = new fabric.Point(min(x1, x2), min(y1, y2)),
        selectionX2Y2 = new fabric.Point(max(x1, x2), max(y1, y2)),
        isClick = x1 === x2 && y1 === y2;
      for (var i = this._objects.length; i--;) {
        currentObject = this._objects[i];
        if (!currentObject || !currentObject.selectable || !currentObject.visible) continue;
        if (currentObject.intersectsWithRect(selectionX1Y1, selectionX2Y2) || currentObject.isContainedWithinRect(selectionX1Y1, selectionX2Y2) || currentObject.containsPoint(selectionX1Y1) || currentObject.containsPoint(selectionX2Y2)) {
          currentObject.set('active', true);
          group.push(currentObject);
          if (isClick) break;
        }
      }
      return group;
    },
    _maybeGroupObjects: function(e) {
      if (this.selection && this._groupSelector) {
        this._groupSelectedObjects(e);
      }
      var activeGroup = this.getActiveGroup();
      if (activeGroup) {
        activeGroup.setObjectsCoords().setCoords();
        activeGroup.isMoving = false;
        this._setCursor(this.defaultCursor);
      }
      this._groupSelector = null;
      this._currentTransform = null;
    }
  });
})();
fabric.util.object.extend(fabric.StaticCanvas.prototype, {
  toDataURL: function(options) {
    options || (options = {});
    var format = options.format || 'png',
      quality = options.quality || 1,
      multiplier = options.multiplier || 1,
      cropping = {
        left: options.left,
        top: options.top,
        width: options.width,
        height: options.height
      };
    if (multiplier !== 1) {
      return this.__toDataURLWithMultiplier(format, quality, cropping, multiplier);
    } else {
      return this.__toDataURL(format, quality, cropping);
    }
  },
  __toDataURL: function(format, quality, cropping) {
    this.renderAll(true);
    var canvasEl = this.upperCanvasEl || this.lowerCanvasEl;
    var croppedCanvasEl = this.__getCroppedCanvas(canvasEl, cropping);
    if (format === 'jpg') {
      format = 'jpeg';
    }
    var data = (fabric.StaticCanvas.supports('toDataURLWithQuality')) ? (croppedCanvasEl || canvasEl).toDataURL('image/' + format, quality) : (croppedCanvasEl || canvasEl).toDataURL('image/' + format);
    this.contextTop && this.clearContext(this.contextTop);
    this.renderAll();
    if (croppedCanvasEl) {
      croppedCanvasEl = null;
    }
    return data;
  },
  __getCroppedCanvas: function(canvasEl, cropping) {
    var croppedCanvasEl, croppedCtx;
    var shouldCrop = 'left' in cropping || 'top' in cropping || 'width' in cropping || 'height' in cropping;
    if (shouldCrop) {
      croppedCanvasEl = fabric.util.createCanvasElement();
      croppedCtx = croppedCanvasEl.getContext('2d');
      croppedCanvasEl.width = cropping.width || this.width;
      croppedCanvasEl.height = cropping.height || this.height;
      croppedCtx.drawImage(canvasEl, -cropping.left || 0, -cropping.top || 0);
    }
    return croppedCanvasEl;
  },
  __toDataURLWithMultiplier: function(format, quality, cropping, multiplier) {
    var origWidth = this.getWidth(),
      origHeight = this.getHeight(),
      scaledWidth = origWidth * multiplier,
      scaledHeight = origHeight * multiplier,
      activeObject = this.getActiveObject(),
      activeGroup = this.getActiveGroup(),
      ctx = this.contextTop || this.contextContainer;
    this.setWidth(scaledWidth).setHeight(scaledHeight);
    ctx.scale(multiplier, multiplier);
    if (cropping.left) {
      cropping.left *= multiplier;
    }
    if (cropping.top) {
      cropping.top *= multiplier;
    }
    if (cropping.width) {
      cropping.width *= multiplier;
    }
    if (cropping.height) {
      cropping.height *= multiplier;
    }
    if (activeGroup) {
      this._tempRemoveBordersControlsFromGroup(activeGroup);
    } else if (activeObject && this.deactivateAll) {
      this.deactivateAll();
    }
    this.renderAll(true);
    var data = this.__toDataURL(format, quality, cropping);
    this.width = origWidth;
    this.height = origHeight;
    ctx.scale(1 / multiplier, 1 / multiplier);
    this.setWidth(origWidth).setHeight(origHeight);
    if (activeGroup) {
      this._restoreBordersControlsOnGroup(activeGroup);
    } else if (activeObject && this.setActiveObject) {
      this.setActiveObject(activeObject);
    }
    this.contextTop && this.clearContext(this.contextTop);
    this.renderAll();
    return data;
  },
  toDataURLWithMultiplier: function(format, multiplier, quality) {
    return this.toDataURL({
      format: format,
      multiplier: multiplier,
      quality: quality
    });
  },
  _tempRemoveBordersControlsFromGroup: function(group) {
    group.origHasControls = group.hasControls;
    group.origBorderColor = group.borderColor;
    group.hasControls = true;
    group.borderColor = 'rgba(0,0,0,0)';
    group.forEachObject(function(o) {
      o.origBorderColor = o.borderColor;
      o.borderColor = 'rgba(0,0,0,0)';
    });
  },
  _restoreBordersControlsOnGroup: function(group) {
    group.hideControls = group.origHideControls;
    group.borderColor = group.origBorderColor;
    group.forEachObject(function(o) {
      o.borderColor = o.origBorderColor;
      delete o.origBorderColor;
    });
  }
});
fabric.util.object.extend(fabric.StaticCanvas.prototype, {
  loadFromDatalessJSON: function(json, callback, reviver) {
    return this.loadFromJSON(json, callback, reviver);
  },
  loadFromJSON: function(json, callback, reviver) {
    if (!json) return;
    var serialized = (typeof json === 'string') ? JSON.parse(json) : json;
    this.clear();
    var _this = this;
    this._enlivenObjects(serialized.objects, function() {
      _this._setBgOverlay(serialized, callback);
    }, reviver);
    return this;
  },
  _setBgOverlay: function(serialized, callback) {
    var _this = this,
      loaded = {
        backgroundColor: false,
        overlayColor: false,
        backgroundImage: false,
        overlayImage: false
      };
    if (!serialized.backgroundImage && !serialized.overlayImage && !serialized.background && !serialized.overlay) {
      callback && callback();
      return;
    }
    var cbIfLoaded = function() {
      if (loaded.backgroundImage && loaded.overlayImage && loaded.backgroundColor && loaded.overlayColor) {
        _this.renderAll();
        callback && callback();
      }
    };
    this.__setBgOverlay('backgroundImage', serialized.backgroundImage, loaded, cbIfLoaded);
    this.__setBgOverlay('overlayImage', serialized.overlayImage, loaded, cbIfLoaded);
    this.__setBgOverlay('backgroundColor', serialized.background, loaded, cbIfLoaded);
    this.__setBgOverlay('overlayColor', serialized.overlay, loaded, cbIfLoaded);
    cbIfLoaded();
  },
  __setBgOverlay: function(property, value, loaded, callback) {
    var _this = this;
    if (!value) {
      loaded[property] = true;
      return;
    }
    if (property === 'backgroundImage' || property === 'overlayImage') {
      fabric.Image.fromObject(value, function(img) {
        _this[property] = img;
        loaded[property] = true;
        callback && callback();
      });
    } else {
      this['set' + fabric.util.string.capitalize(property, true)](value, function() {
        loaded[property] = true;
        callback && callback();
      });
    }
  },
  _enlivenObjects: function(objects, callback, reviver) {
    var _this = this;
    if (objects.length === 0) {
      callback && callback();
      return;
    }
    var renderOnAddRemove = this.renderOnAddRemove;
    this.renderOnAddRemove = false;
    fabric.util.enlivenObjects(objects, function(enlivenedObjects) {
      enlivenedObjects.forEach(function(obj, index) {
        _this.insertAt(obj, index, true);
      });
      _this.renderOnAddRemove = renderOnAddRemove;
      callback && callback();
    }, null, reviver);
  },
  _toDataURL: function(format, callback) {
    this.clone(function(clone) {
      callback(clone.toDataURL(format));
    });
  },
  _toDataURLWithMultiplier: function(format, multiplier, callback) {
    this.clone(function(clone) {
      callback(clone.toDataURLWithMultiplier(format, multiplier));
    });
  },
  clone: function(callback, properties) {
    var data = JSON.stringify(this.toJSON(properties));
    this.cloneWithoutData(function(clone) {
      clone.loadFromJSON(data, function() {
        callback && callback(clone);
      });
    });
  },
  cloneWithoutData: function(callback) {
    var el = fabric.document.createElement('canvas');
    el.width = this.getWidth();
    el.height = this.getHeight();
    var clone = new fabric.Canvas(el);
    clone.clipTo = this.clipTo;
    if (this.backgroundImage) {
      clone.setBackgroundImage(this.backgroundImage.src, function() {
        clone.renderAll();
        callback && callback(clone);
      });
      clone.backgroundImageOpacity = this.backgroundImageOpacity;
      clone.backgroundImageStretch = this.backgroundImageStretch;
    } else {
      callback && callback(clone);
    }
  }
});
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend,
    toFixed = fabric.util.toFixed,
    capitalize = fabric.util.string.capitalize,
    degreesToRadians = fabric.util.degreesToRadians,
    supportsLineDash = fabric.StaticCanvas.supports('setLineDash');
  if (fabric.Object) {
    return;
  }
  fabric.Object = fabric.util.createClass({
    type: 'object',
    originX: 'left',
    originY: 'top',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1,
    flipX: false,
    flipY: false,
    opacity: 1,
    angle: 0,
    cornerSize: 12,
    transparentCorners: true,
    hoverCursor: null,
    padding: 0,
    borderColor: 'rgba(102,153,255,0.75)',
    cornerColor: 'rgba(102,153,255,0.5)',
    centeredScaling: false,
    centeredRotation: true,
    fill: 'rgb(0,0,0)',
    fillRule: 'source-over',
    backgroundColor: '',
    stroke: null,
    strokeWidth: 1,
    strokeDashArray: null,
    strokeLineCap: 'butt',
    strokeLineJoin: 'miter',
    strokeMiterLimit: 10,
    shadow: null,
    borderOpacityWhenMoving: 0.4,
    borderScaleFactor: 1,
    transformMatrix: null,
    minScaleLimit: 0.01,
    selectable: true,
    evented: true,
    visible: true,
    hasControls: true,
    hasBorders: true,
    hasRotatingPoint: true,
    rotatingPointOffset: 40,
    perPixelTargetFind: false,
    includeDefaultValues: true,
    clipTo: null,
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    lockScalingX: false,
    lockScalingY: false,
    lockUniScaling: false,
    stateProperties: ('top left width height scaleX scaleY flipX flipY originX originY transformMatrix ' + 'stroke strokeWidth strokeDashArray strokeLineCap strokeLineJoin strokeMiterLimit ' + 'angle opacity fill fillRule shadow clipTo visible backgroundColor').split(' '),
    initialize: function(options) {
      if (options) {
        this.setOptions(options);
      }
    },
    _initGradient: function(options) {
      if (options.fill && options.fill.colorStops && !(options.fill instanceof fabric.Gradient)) {
        this.set('fill', new fabric.Gradient(options.fill));
      }
    },
    _initPattern: function(options) {
      if (options.fill && options.fill.source && !(options.fill instanceof fabric.Pattern)) {
        this.set('fill', new fabric.Pattern(options.fill));
      }
      if (options.stroke && options.stroke.source && !(options.stroke instanceof fabric.Pattern)) {
        this.set('stroke', new fabric.Pattern(options.stroke));
      }
    },
    _initClipping: function(options) {
      if (!options.clipTo || typeof options.clipTo !== 'string') return;
      var functionBody = fabric.util.getFunctionBody(options.clipTo);
      if (typeof functionBody !== 'undefined') {
        this.clipTo = new Function('ctx', functionBody);
      }
    },
    setOptions: function(options) {
      for (var prop in options) {
        this.set(prop, options[prop]);
      }
      this._initGradient(options);
      this._initPattern(options);
      this._initClipping(options);
    },
    transform: function(ctx, fromLeft) {
      ctx.globalAlpha = this.opacity;
      var center = fromLeft ? this._getLeftTopCoords() : this.getCenterPoint();
      ctx.translate(center.x, center.y);
      ctx.rotate(degreesToRadians(this.angle));
      ctx.scale(this.scaleX * (this.flipX ? -1 : 1), this.scaleY * (this.flipY ? -1 : 1));
    },
    toObject: function(propertiesToInclude) {
      var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS;
      var object = {
        type: this.type,
        originX: this.originX,
        originY: this.originY,
        left: toFixed(this.left, NUM_FRACTION_DIGITS),
        top: toFixed(this.top, NUM_FRACTION_DIGITS),
        width: toFixed(this.width, NUM_FRACTION_DIGITS),
        height: toFixed(this.height, NUM_FRACTION_DIGITS),
        fill: (this.fill && this.fill.toObject) ? this.fill.toObject() : this.fill,
        stroke: (this.stroke && this.stroke.toObject) ? this.stroke.toObject() : this.stroke,
        strokeWidth: toFixed(this.strokeWidth, NUM_FRACTION_DIGITS),
        strokeDashArray: this.strokeDashArray,
        strokeLineCap: this.strokeLineCap,
        strokeLineJoin: this.strokeLineJoin,
        strokeMiterLimit: toFixed(this.strokeMiterLimit, NUM_FRACTION_DIGITS),
        scaleX: toFixed(this.scaleX, NUM_FRACTION_DIGITS),
        scaleY: toFixed(this.scaleY, NUM_FRACTION_DIGITS),
        angle: toFixed(this.getAngle(), NUM_FRACTION_DIGITS),
        flipX: this.flipX,
        flipY: this.flipY,
        opacity: toFixed(this.opacity, NUM_FRACTION_DIGITS),
        shadow: (this.shadow && this.shadow.toObject) ? this.shadow.toObject() : this.shadow,
        visible: this.visible,
        clipTo: this.clipTo && String(this.clipTo),
        backgroundColor: this.backgroundColor
      };
      if (!this.includeDefaultValues) {
        object = this._removeDefaultValues(object);
      }
      fabric.util.populateWithProperties(this, object, propertiesToInclude);
      return object;
    },
    toDatalessObject: function(propertiesToInclude) {
      return this.toObject(propertiesToInclude);
    },
    _removeDefaultValues: function(object) {
      var prototype = fabric.util.getKlass(object.type).prototype;
      var stateProperties = prototype.stateProperties;
      stateProperties.forEach(function(prop) {
        if (object[prop] === prototype[prop]) {
          delete object[prop];
        }
      });
      return object;
    },
    toString: function() {
      return "#<fabric." + capitalize(this.type) + ">";
    },
    get: function(property) {
      return this[property];
    },
    set: function(key, value) {
      if (typeof key === 'object') {
        for (var prop in key) {
          this._set(prop, key[prop]);
        }
      } else {
        if (typeof value === 'function' && key !== 'clipTo') {
          this._set(key, value(this.get(key)));
        } else {
          this._set(key, value);
        }
      }
      return this;
    },
    _set: function(key, value) {
      var shouldConstrainValue = (key === 'scaleX' || key === 'scaleY');
      if (shouldConstrainValue) {
        value = this._constrainScale(value);
      }
      if (key === 'scaleX' && value < 0) {
        this.flipX = !this.flipX;
        value *= -1;
      } else if (key === 'scaleY' && value < 0) {
        this.flipY = !this.flipY;
        value *= -1;
      } else if (key === 'width' || key === 'height') {
        this.minScaleLimit = toFixed(Math.min(0.1, 1 / Math.max(this.width, this.height)), 2);
      } else if (key === 'shadow' && value && !(value instanceof fabric.Shadow)) {
        value = new fabric.Shadow(value);
      }
      this[key] = value;
      return this;
    },
    toggle: function(property) {
      var value = this.get(property);
      if (typeof value === 'boolean') {
        this.set(property, !value);
      }
      return this;
    },
    setSourcePath: function(value) {
      this.sourcePath = value;
      return this;
    },
    render: function(ctx, noTransform) {
      if (this.width === 0 || this.height === 0 || !this.visible) return;
      ctx.save();
      this._transform(ctx, noTransform);
      this._setStrokeStyles(ctx);
      this._setFillStyles(ctx);
      var m = this.transformMatrix;
      if (m && this.group) {
        ctx.translate(-this.group.width / 2, -this.group.height / 2);
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }
      this._setShadow(ctx);
      this.clipTo && fabric.util.clipContext(this, ctx);
      this._render(ctx, noTransform);
      this.clipTo && ctx.restore();
      this._removeShadow(ctx);
      if (this.active && !noTransform) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
    },
    _transform: function(ctx, noTransform) {
      var m = this.transformMatrix;
      if (m && !this.group) {
        ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }
      if (!noTransform) {
        this.transform(ctx);
      }
    },
    _setStrokeStyles: function(ctx) {
      if (this.stroke) {
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeLineCap;
        ctx.lineJoin = this.strokeLineJoin;
        ctx.miterLimit = this.strokeMiterLimit;
        ctx.strokeStyle = this.stroke.toLive ? this.stroke.toLive(ctx) : this.stroke;
      }
    },
    _setFillStyles: function(ctx) {
      if (this.fill) {
        ctx.fillStyle = this.fill.toLive ? this.fill.toLive(ctx) : this.fill;
      }
    },
    _setShadow: function(ctx) {
      if (!this.shadow) return;
      ctx.shadowColor = this.shadow.color;
      ctx.shadowBlur = this.shadow.blur;
      ctx.shadowOffsetX = this.shadow.offsetX;
      ctx.shadowOffsetY = this.shadow.offsetY;
    },
    _removeShadow: function(ctx) {
      if (!this.shadow) return;
      ctx.shadowColor = '';
      ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    },
    _renderFill: function(ctx) {
      if (!this.fill) return;
      if (this.fill.toLive) {
        ctx.save();
        ctx.translate(-this.width / 2 + this.fill.offsetX || 0, -this.height / 2 + this.fill.offsetY || 0);
      }
      ctx.fill();
      if (this.fill.toLive) {
        ctx.restore();
      }
      if (this.shadow && !this.shadow.affectStroke) {
        this._removeShadow(ctx);
      }
    },
    _renderStroke: function(ctx) {
      if (!this.stroke) return;
      ctx.save();
      if (this.strokeDashArray) {
        if (1 & this.strokeDashArray.length) {
          this.strokeDashArray.push.apply(this.strokeDashArray, this.strokeDashArray);
        }
        if (supportsLineDash) {
          ctx.setLineDash(this.strokeDashArray);
          this._stroke && this._stroke(ctx);
        } else {
          this._renderDashedStroke && this._renderDashedStroke(ctx);
        }
        ctx.stroke();
      } else {
        this._stroke ? this._stroke(ctx) : ctx.stroke();
      }
      this._removeShadow(ctx);
      ctx.restore();
    },
    clone: function(callback, propertiesToInclude) {
      if (this.constructor.fromObject) {
        return this.constructor.fromObject(this.toObject(propertiesToInclude), callback);
      }
      return new fabric.Object(this.toObject(propertiesToInclude));
    },
    cloneAsImage: function(callback) {
      var dataUrl = this.toDataURL();
      fabric.util.loadImage(dataUrl, function(img) {
        if (callback) {
          callback(new fabric.Image(img));
        }
      });
      return this;
    },
    toDataURL: function(options) {
      options || (options = {});
      var el = fabric.util.createCanvasElement(),
        boundingRect = this.getBoundingRect();
      el.width = boundingRect.width;
      el.height = boundingRect.height;
      fabric.util.wrapElement(el, 'div');
      var canvas = new fabric.Canvas(el);
      if (options.format === 'jpg') {
        options.format = 'jpeg';
      }
      if (options.format === 'jpeg') {
        canvas.backgroundColor = '#fff';
      }
      var origParams = {
        active: this.get('active'),
        left: this.getLeft(),
        top: this.getTop()
      };
      this.set('active', false);
      this.setPositionByOrigin(new fabric.Point(el.width / 2, el.height / 2), 'center', 'center');
      var originalCanvas = this.canvas;
      canvas.add(this);
      var data = canvas.toDataURL(options);
      this.set(origParams).setCoords();
      this.canvas = originalCanvas;
      canvas.dispose();
      canvas = null;
      return data;
    },
    isType: function(type) {
      return this.type === type;
    },
    complexity: function() {
      return 0;
    },
    toJSON: function(propertiesToInclude) {
      return this.toObject(propertiesToInclude);
    },
    setGradient: function(property, options) {
      options || (options = {});
      var gradient = {
        colorStops: []
      };
      gradient.type = options.type || (options.r1 || options.r2 ? 'radial' : 'linear');
      gradient.coords = {
        x1: options.x1,
        y1: options.y1,
        x2: options.x2,
        y2: options.y2
      };
      if (options.r1 || options.r2) {
        gradient.coords.r1 = options.r1;
        gradient.coords.r2 = options.r2;
      }
      for (var position in options.colorStops) {
        var color = new fabric.Color(options.colorStops[position]);
        gradient.colorStops.push({
          offset: position,
          color: color.toRgb(),
          opacity: color.getAlpha()
        });
      }
      return this.set(property, fabric.Gradient.forObject(this, gradient));
    },
    setPatternFill: function(options) {
      return this.set('fill', new fabric.Pattern(options));
    },
    setShadow: function(options) {
      return this.set('shadow', new fabric.Shadow(options));
    },
    setColor: function(color) {
      this.set('fill', color);
      return this;
    },
    centerH: function() {
      this.canvas.centerObjectH(this);
      return this;
    },
    centerV: function() {
      this.canvas.centerObjectV(this);
      return this;
    },
    center: function() {
      this.canvas.centerObject(this);
      return this;
    },
    remove: function() {
      this.canvas.remove(this);
      return this;
    },
    getLocalPointer: function(e, pointer) {
      pointer = pointer || this.canvas.getPointer(e);
      var objectLeftTop = this.translateToOriginPoint(this.getCenterPoint(), 'left', 'top');
      return {
        x: pointer.x - objectLeftTop.x,
        y: pointer.y - objectLeftTop.y
      };
    }
  });
  fabric.util.createAccessors(fabric.Object);
  fabric.Object.prototype.rotate = fabric.Object.prototype.setAngle;
  extend(fabric.Object.prototype, fabric.Observable);
  fabric.Object.NUM_FRACTION_DIGITS = 2;
  fabric.Object.__uid = 0;
})(typeof exports !== 'undefined' ? exports : this);
(function() {
  var degreesToRadians = fabric.util.degreesToRadians;
  fabric.util.object.extend(fabric.Object.prototype, {
    translateToCenterPoint: function(point, originX, originY) {
      var cx = point.x,
        cy = point.y,
        strokeWidth = this.stroke ? this.strokeWidth : 0;
      if (originX === "left") {
        cx = point.x + (this.getWidth() + strokeWidth * this.scaleX) / 2;
      } else if (originX === "right") {
        cx = point.x - (this.getWidth() + strokeWidth * this.scaleX) / 2;
      }
      if (originY === "top") {
        cy = point.y + (this.getHeight() + strokeWidth * this.scaleY) / 2;
      } else if (originY === "bottom") {
        cy = point.y - (this.getHeight() + strokeWidth * this.scaleY) / 2;
      }
      return fabric.util.rotatePoint(new fabric.Point(cx, cy), point, degreesToRadians(this.angle));
    },
    translateToOriginPoint: function(center, originX, originY) {
      var x = center.x,
        y = center.y,
        strokeWidth = this.stroke ? this.strokeWidth : 0;
      if (originX === "left") {
        x = center.x - (this.getWidth() + strokeWidth * this.scaleX) / 2;
      } else if (originX === "right") {
        x = center.x + (this.getWidth() + strokeWidth * this.scaleX) / 2;
      }
      if (originY === "top") {
        y = center.y - (this.getHeight() + strokeWidth * this.scaleY) / 2;
      } else if (originY === "bottom") {
        y = center.y + (this.getHeight() + strokeWidth * this.scaleY) / 2;
      }
      return fabric.util.rotatePoint(new fabric.Point(x, y), center, degreesToRadians(this.angle));
    },
    getCenterPoint: function() {
      var leftTop = new fabric.Point(this.left, this.top);
      return this.translateToCenterPoint(leftTop, this.originX, this.originY);
    },
    getPointByOrigin: function(originX, originY) {
      var center = this.getCenterPoint();
      return this.translateToOriginPoint(center, originX, originY);
    },
    toLocalPoint: function(point, originX, originY) {
      var center = this.getCenterPoint(),
        strokeWidth = this.stroke ? this.strokeWidth : 0,
        x, y;
      if (originX && originY) {
        if (originX === "left") {
          x = center.x - (this.getWidth() + strokeWidth * this.scaleX) / 2;
        } else if (originX === "right") {
          x = center.x + (this.getWidth() + strokeWidth * this.scaleX) / 2;
        } else {
          x = center.x;
        }
        if (originY === "top") {
          y = center.y - (this.getHeight() + strokeWidth * this.scaleY) / 2;
        } else if (originY === "bottom") {
          y = center.y + (this.getHeight() + strokeWidth * this.scaleY) / 2;
        } else {
          y = center.y;
        }
      } else {
        x = this.left;
        y = this.top;
      }
      return fabric.util.rotatePoint(new fabric.Point(point.x, point.y), center, -degreesToRadians(this.angle)).subtractEquals(new fabric.Point(x, y));
    },
    setPositionByOrigin: function(pos, originX, originY) {
      var center = this.translateToCenterPoint(pos, originX, originY);
      var position = this.translateToOriginPoint(center, this.originX, this.originY);
      this.set('left', position.x);
      this.set('top', position.y);
    },
    adjustPosition: function(to) {
      var angle = degreesToRadians(this.angle);
      var hypotHalf = this.getWidth() / 2;
      var xHalf = Math.cos(angle) * hypotHalf;
      var yHalf = Math.sin(angle) * hypotHalf;
      var hypotFull = this.getWidth();
      var xFull = Math.cos(angle) * hypotFull;
      var yFull = Math.sin(angle) * hypotFull;
      if (this.originX === 'center' && to === 'left' || this.originX === 'right' && to === 'center') {
        this.left -= xHalf;
        this.top -= yHalf;
      } else if (this.originX === 'left' && to === 'center' || this.originX === 'center' && to === 'right') {
        this.left += xHalf;
        this.top += yHalf;
      } else if (this.originX === 'left' && to === 'right') {
        this.left += xFull;
        this.top += yFull;
      } else if (this.originX === 'right' && to === 'left') {
        this.left -= xFull;
        this.top -= yFull;
      }
      this.setCoords();
      this.originX = to;
    },
    _getLeftTopCoords: function() {
      return this.translateToOriginPoint(this.getCenterPoint(), 'left', 'center');
    }
  });
})();
(function() {
  var degreesToRadians = fabric.util.degreesToRadians;
  fabric.util.object.extend(fabric.Object.prototype, {
    oCoords: null,
    intersectsWithRect: function(pointTL, pointBR) {
      var oCoords = this.oCoords,
        tl = new fabric.Point(oCoords.tl.x, oCoords.tl.y),
        tr = new fabric.Point(oCoords.tr.x, oCoords.tr.y),
        bl = new fabric.Point(oCoords.bl.x, oCoords.bl.y),
        br = new fabric.Point(oCoords.br.x, oCoords.br.y);
      var intersection = fabric.Intersection.intersectPolygonRectangle([tl, tr, br, bl], pointTL, pointBR);
      return intersection.status === 'Intersection';
    },
    intersectsWithObject: function(other) {
      function getCoords(oCoords) {
        return {
          tl: new fabric.Point(oCoords.tl.x, oCoords.tl.y),
          tr: new fabric.Point(oCoords.tr.x, oCoords.tr.y),
          bl: new fabric.Point(oCoords.bl.x, oCoords.bl.y),
          br: new fabric.Point(oCoords.br.x, oCoords.br.y)
        };
      }
      var thisCoords = getCoords(this.oCoords),
        otherCoords = getCoords(other.oCoords);
      var intersection = fabric.Intersection.intersectPolygonPolygon([thisCoords.tl, thisCoords.tr, thisCoords.br, thisCoords.bl], [otherCoords.tl, otherCoords.tr, otherCoords.br, otherCoords.bl]);
      return intersection.status === 'Intersection';
    },
    isContainedWithinObject: function(other) {
      var boundingRect = other.getBoundingRect(),
        point1 = new fabric.Point(boundingRect.left, boundingRect.top),
        point2 = new fabric.Point(boundingRect.left + boundingRect.width, boundingRect.top + boundingRect.height);
      return this.isContainedWithinRect(point1, point2);
    },
    isContainedWithinRect: function(pointTL, pointBR) {
      var boundingRect = this.getBoundingRect();
      return (boundingRect.left > pointTL.x && boundingRect.left + boundingRect.width < pointBR.x && boundingRect.top > pointTL.y && boundingRect.top + boundingRect.height < pointBR.y);
    },
    containsPoint: function(point) {
      var lines = this._getImageLines(this.oCoords),
        xPoints = this._findCrossPoints(point, lines);
      return (xPoints !== 0 && xPoints % 2 === 1);
    },
    _getImageLines: function(oCoords) {
      return {
        topline: {
          o: oCoords.tl,
          d: oCoords.tr
        },
        rightline: {
          o: oCoords.tr,
          d: oCoords.br
        },
        bottomline: {
          o: oCoords.br,
          d: oCoords.bl
        },
        leftline: {
          o: oCoords.bl,
          d: oCoords.tl
        }
      };
    },
    _findCrossPoints: function(point, oCoords) {
      var b1, b2, a1, a2, xi, yi, xcount = 0,
        iLine;
      for (var lineKey in oCoords) {
        iLine = oCoords[lineKey];
        if ((iLine.o.y < point.y) && (iLine.d.y < point.y)) {
          continue;
        }
        if ((iLine.o.y >= point.y) && (iLine.d.y >= point.y)) {
          continue;
        }
        if ((iLine.o.x === iLine.d.x) && (iLine.o.x >= point.x)) {
          xi = iLine.o.x;
          yi = point.y;
        } else {
          b1 = 0;
          b2 = (iLine.d.y - iLine.o.y) / (iLine.d.x - iLine.o.x);
          a1 = point.y - b1 * point.x;
          a2 = iLine.o.y - b2 * iLine.o.x;
          xi = -(a1 - a2) / (b1 - b2);
          yi = a1 + b1 * xi;
        }
        if (xi >= point.x) {
          xcount += 1;
        }
        if (xcount === 2) {
          break;
        }
      }
      return xcount;
    },
    getBoundingRectWidth: function() {
      return this.getBoundingRect().width;
    },
    getBoundingRectHeight: function() {
      return this.getBoundingRect().height;
    },
    getBoundingRect: function() {
      this.oCoords || this.setCoords();
      var xCoords = [this.oCoords.tl.x, this.oCoords.tr.x, this.oCoords.br.x, this.oCoords.bl.x];
      var minX = fabric.util.array.min(xCoords);
      var maxX = fabric.util.array.max(xCoords);
      var width = Math.abs(minX - maxX);
      var yCoords = [this.oCoords.tl.y, this.oCoords.tr.y, this.oCoords.br.y, this.oCoords.bl.y];
      var minY = fabric.util.array.min(yCoords);
      var maxY = fabric.util.array.max(yCoords);
      var height = Math.abs(minY - maxY);
      return {
        left: minX,
        top: minY,
        width: width,
        height: height
      };
    },
    getWidth: function() {
      return this.width * this.scaleX;
    },
    getHeight: function() {
      return this.height * this.scaleY;
    },
    _constrainScale: function(value) {
      if (Math.abs(value) < this.minScaleLimit) {
        if (value < 0)
          return -this.minScaleLimit;
        else
          return this.minScaleLimit;
      }
      return value;
    },
    scale: function(value) {
      value = this._constrainScale(value);
      if (value < 0) {
        this.flipX = !this.flipX;
        this.flipY = !this.flipY;
        value *= -1;
      }
      this.scaleX = value;
      this.scaleY = value;
      this.setCoords();
      return this;
    },
    scaleToWidth: function(value) {
      var boundingRectFactor = this.getBoundingRectWidth() / this.getWidth();
      return this.scale(value / this.width / boundingRectFactor);
    },
    scaleToHeight: function(value) {
      var boundingRectFactor = this.getBoundingRectHeight() / this.getHeight();
      return this.scale(value / this.height / boundingRectFactor);
    },
    setCoords: function() {
      var strokeWidth = this.strokeWidth > 1 ? this.strokeWidth : 0,
        padding = this.padding,
        theta = degreesToRadians(this.angle);
      this.currentWidth = (this.width + strokeWidth) * this.scaleX + padding * 2;
      this.currentHeight = (this.height + strokeWidth) * this.scaleY + padding * 2;
      if (this.currentWidth < 0) {
        this.currentWidth = Math.abs(this.currentWidth);
      }
      var _hypotenuse = Math.sqrt(Math.pow(this.currentWidth / 2, 2) +
        Math.pow(this.currentHeight / 2, 2));
      var _angle = Math.atan(isFinite(this.currentHeight / this.currentWidth) ? this.currentHeight / this.currentWidth : 0);
      var offsetX = Math.cos(_angle + theta) * _hypotenuse,
        offsetY = Math.sin(_angle + theta) * _hypotenuse,
        sinTh = Math.sin(theta),
        cosTh = Math.cos(theta);
      var coords = this.getCenterPoint();
      var tl = {
        x: coords.x - offsetX,
        y: coords.y - offsetY
      };
      var tr = {
        x: tl.x + (this.currentWidth * cosTh),
        y: tl.y + (this.currentWidth * sinTh)
      };
      var br = {
        x: tr.x - (this.currentHeight * sinTh),
        y: tr.y + (this.currentHeight * cosTh)
      };
      var bl = {
        x: tl.x - (this.currentHeight * sinTh),
        y: tl.y + (this.currentHeight * cosTh)
      };
      var ml = {
        x: tl.x - (this.currentHeight / 2 * sinTh),
        y: tl.y + (this.currentHeight / 2 * cosTh)
      };
      var mt = {
        x: tl.x + (this.currentWidth / 2 * cosTh),
        y: tl.y + (this.currentWidth / 2 * sinTh)
      };
      var mr = {
        x: tr.x - (this.currentHeight / 2 * sinTh),
        y: tr.y + (this.currentHeight / 2 * cosTh)
      };
      var mb = {
        x: bl.x + (this.currentWidth / 2 * cosTh),
        y: bl.y + (this.currentWidth / 2 * sinTh)
      };
      var mtr = {
        x: mt.x,
        y: mt.y
      };
      this.oCoords = {
        tl: tl,
        tr: tr,
        br: br,
        bl: bl,
        ml: ml,
        mt: mt,
        mr: mr,
        mb: mb,
        mtr: mtr
      };
      this._setCornerCoords && this._setCornerCoords();
      return this;
    }
  });
})();
fabric.util.object.extend(fabric.Object.prototype, {
  sendToBack: function() {
    if (this.group) {
      fabric.StaticCanvas.prototype.sendToBack.call(this.group, this);
    } else {
      this.canvas.sendToBack(this);
    }
    return this;
  },
  bringToFront: function() {
    if (this.group) {
      fabric.StaticCanvas.prototype.bringToFront.call(this.group, this);
    } else {
      this.canvas.bringToFront(this);
    }
    return this;
  },
  sendBackwards: function(intersecting) {
    if (this.group) {
      fabric.StaticCanvas.prototype.sendBackwards.call(this.group, this, intersecting);
    } else {
      this.canvas.sendBackwards(this, intersecting);
    }
    return this;
  },
  bringForward: function(intersecting) {
    if (this.group) {
      fabric.StaticCanvas.prototype.bringForward.call(this.group, this, intersecting);
    } else {
      this.canvas.bringForward(this, intersecting);
    }
    return this;
  },
  moveTo: function(index) {
    if (this.group) {
      fabric.StaticCanvas.prototype.moveTo.call(this.group, this, index);
    } else {
      this.canvas.moveTo(this, index);
    }
    return this;
  }
});
fabric.util.object.extend(fabric.Object.prototype, {
  getSvgStyles: function() {
    var fill = this.fill ? (this.fill.toLive ? 'url(#SVGID_' + this.fill.id + ')' : this.fill) : 'none';
    var stroke = this.stroke ? (this.stroke.toLive ? 'url(#SVGID_' + this.stroke.id + ')' : this.stroke) : 'none';
    var strokeWidth = this.strokeWidth ? this.strokeWidth : '0';
    var strokeDashArray = this.strokeDashArray ? this.strokeDashArray.join(' ') : '';
    var strokeLineCap = this.strokeLineCap ? this.strokeLineCap : 'butt';
    var strokeLineJoin = this.strokeLineJoin ? this.strokeLineJoin : 'miter';
    var strokeMiterLimit = this.strokeMiterLimit ? this.strokeMiterLimit : '4';
    var opacity = typeof this.opacity !== 'undefined' ? this.opacity : '1';
    var visibility = this.visible ? '' : " visibility: hidden;";
    var filter = this.shadow && this.type !== 'text' ? 'filter: url(#SVGID_' + this.shadow.id + ');' : '';
    return ["stroke: ", stroke, "; ", "stroke-width: ", strokeWidth, "; ", "stroke-dasharray: ", strokeDashArray, "; ", "stroke-linecap: ", strokeLineCap, "; ", "stroke-linejoin: ", strokeLineJoin, "; ", "stroke-miterlimit: ", strokeMiterLimit, "; ", "fill: ", fill, "; ", "opacity: ", opacity, ";", filter, visibility].join('');
  },
  getSvgTransform: function() {
    var toFixed = fabric.util.toFixed;
    var angle = this.getAngle();
    var center = this.getCenterPoint();
    var NUM_FRACTION_DIGITS = fabric.Object.NUM_FRACTION_DIGITS;
    var translatePart = "translate(" +
      toFixed(center.x, NUM_FRACTION_DIGITS) + " " +
      toFixed(center.y, NUM_FRACTION_DIGITS) + ")";
    var anglePart = angle !== 0 ? (" rotate(" + toFixed(angle, NUM_FRACTION_DIGITS) + ")") : '';
    var scalePart = (this.scaleX === 1 && this.scaleY === 1) ? '' : (" scale(" +
      toFixed(this.scaleX, NUM_FRACTION_DIGITS) + " " +
      toFixed(this.scaleY, NUM_FRACTION_DIGITS) + ")");
    var flipXPart = this.flipX ? "matrix(-1 0 0 1 0 0) " : "";
    var flipYPart = this.flipY ? "matrix(1 0 0 -1 0 0)" : "";
    return [translatePart, anglePart, scalePart, flipXPart, flipYPart].join('');
  },
  _createBaseSVGMarkup: function() {
    var markup = [];
    if (this.fill && this.fill.toLive) {
      markup.push(this.fill.toSVG(this, false));
    }
    if (this.stroke && this.stroke.toLive) {
      markup.push(this.stroke.toSVG(this, false));
    }
    if (this.shadow) {
      markup.push(this.shadow.toSVG(this));
    }
    return markup;
  }
});
fabric.util.object.extend(fabric.Object.prototype, {
  hasStateChanged: function() {
    return this.stateProperties.some(function(prop) {
      return this.get(prop) !== this.originalState[prop];
    }, this);
  },
  saveState: function(options) {
    this.stateProperties.forEach(function(prop) {
      this.originalState[prop] = this.get(prop);
    }, this);
    if (options && options.stateProperties) {
      options.stateProperties.forEach(function(prop) {
        this.originalState[prop] = this.get(prop);
      }, this);
    }
    return this;
  },
  setupState: function() {
    this.originalState = {};
    this.saveState();
    return this;
  }
});
(function() {
  var getPointer = fabric.util.getPointer,
    degreesToRadians = fabric.util.degreesToRadians,
    isVML = typeof G_vmlCanvasManager !== 'undefined';
  fabric.util.object.extend(fabric.Object.prototype, {
    _controlsVisibility: null,
    _findTargetCorner: function(e, offset) {
      if (!this.hasControls || !this.active) return false;
      var pointer = getPointer(e, this.canvas.upperCanvasEl),
        ex = pointer.x - offset.left,
        ey = pointer.y - offset.top,
        xPoints, lines;
      for (var i in this.oCoords) {
        if (!this.isControlVisible(i)) {
          continue;
        }
        if (i === 'mtr' && !this.hasRotatingPoint) {
          continue;
        }
        if (this.get('lockUniScaling') && (i === 'mt' || i === 'mr' || i === 'mb' || i === 'ml')) {
          continue;
        }
        lines = this._getImageLines(this.oCoords[i].corner);
        xPoints = this._findCrossPoints({
          x: ex,
          y: ey
        }, lines);
        if (xPoints !== 0 && xPoints % 2 === 1) {
          this.__corner = i;
          return i;
        }
      }
      return false;
    },
    _setCornerCoords: function() {
      var coords = this.oCoords,
        theta = degreesToRadians(this.angle),
        newTheta = degreesToRadians(45 - this.angle),
        cornerHypotenuse = Math.sqrt(2 * Math.pow(this.cornerSize, 2)) / 2,
        cosHalfOffset = cornerHypotenuse * Math.cos(newTheta),
        sinHalfOffset = cornerHypotenuse * Math.sin(newTheta),
        sinTh = Math.sin(theta),
        cosTh = Math.cos(theta);
      coords.tl.corner = {
        tl: {
          x: coords.tl.x - sinHalfOffset,
          y: coords.tl.y - cosHalfOffset
        },
        tr: {
          x: coords.tl.x + cosHalfOffset,
          y: coords.tl.y - sinHalfOffset
        },
        bl: {
          x: coords.tl.x - cosHalfOffset,
          y: coords.tl.y + sinHalfOffset
        },
        br: {
          x: coords.tl.x + sinHalfOffset,
          y: coords.tl.y + cosHalfOffset
        }
      };
      coords.tr.corner = {
        tl: {
          x: coords.tr.x - sinHalfOffset,
          y: coords.tr.y - cosHalfOffset
        },
        tr: {
          x: coords.tr.x + cosHalfOffset,
          y: coords.tr.y - sinHalfOffset
        },
        br: {
          x: coords.tr.x + sinHalfOffset,
          y: coords.tr.y + cosHalfOffset
        },
        bl: {
          x: coords.tr.x - cosHalfOffset,
          y: coords.tr.y + sinHalfOffset
        }
      };
      coords.bl.corner = {
        tl: {
          x: coords.bl.x - sinHalfOffset,
          y: coords.bl.y - cosHalfOffset
        },
        bl: {
          x: coords.bl.x - cosHalfOffset,
          y: coords.bl.y + sinHalfOffset
        },
        br: {
          x: coords.bl.x + sinHalfOffset,
          y: coords.bl.y + cosHalfOffset
        },
        tr: {
          x: coords.bl.x + cosHalfOffset,
          y: coords.bl.y - sinHalfOffset
        }
      };
      coords.br.corner = {
        tr: {
          x: coords.br.x + cosHalfOffset,
          y: coords.br.y - sinHalfOffset
        },
        bl: {
          x: coords.br.x - cosHalfOffset,
          y: coords.br.y + sinHalfOffset
        },
        br: {
          x: coords.br.x + sinHalfOffset,
          y: coords.br.y + cosHalfOffset
        },
        tl: {
          x: coords.br.x - sinHalfOffset,
          y: coords.br.y - cosHalfOffset
        }
      };
      coords.ml.corner = {
        tl: {
          x: coords.ml.x - sinHalfOffset,
          y: coords.ml.y - cosHalfOffset
        },
        tr: {
          x: coords.ml.x + cosHalfOffset,
          y: coords.ml.y - sinHalfOffset
        },
        bl: {
          x: coords.ml.x - cosHalfOffset,
          y: coords.ml.y + sinHalfOffset
        },
        br: {
          x: coords.ml.x + sinHalfOffset,
          y: coords.ml.y + cosHalfOffset
        }
      };
      coords.mt.corner = {
        tl: {
          x: coords.mt.x - sinHalfOffset,
          y: coords.mt.y - cosHalfOffset
        },
        tr: {
          x: coords.mt.x + cosHalfOffset,
          y: coords.mt.y - sinHalfOffset
        },
        bl: {
          x: coords.mt.x - cosHalfOffset,
          y: coords.mt.y + sinHalfOffset
        },
        br: {
          x: coords.mt.x + sinHalfOffset,
          y: coords.mt.y + cosHalfOffset
        }
      };
      coords.mr.corner = {
        tl: {
          x: coords.mr.x - sinHalfOffset,
          y: coords.mr.y - cosHalfOffset
        },
        tr: {
          x: coords.mr.x + cosHalfOffset,
          y: coords.mr.y - sinHalfOffset
        },
        bl: {
          x: coords.mr.x - cosHalfOffset,
          y: coords.mr.y + sinHalfOffset
        },
        br: {
          x: coords.mr.x + sinHalfOffset,
          y: coords.mr.y + cosHalfOffset
        }
      };
      coords.mb.corner = {
        tl: {
          x: coords.mb.x - sinHalfOffset,
          y: coords.mb.y - cosHalfOffset
        },
        tr: {
          x: coords.mb.x + cosHalfOffset,
          y: coords.mb.y - sinHalfOffset
        },
        bl: {
          x: coords.mb.x - cosHalfOffset,
          y: coords.mb.y + sinHalfOffset
        },
        br: {
          x: coords.mb.x + sinHalfOffset,
          y: coords.mb.y + cosHalfOffset
        }
      };
      coords.mtr.corner = {
        tl: {
          x: coords.mtr.x - sinHalfOffset + (sinTh * this.rotatingPointOffset),
          y: coords.mtr.y - cosHalfOffset - (cosTh * this.rotatingPointOffset)
        },
        tr: {
          x: coords.mtr.x + cosHalfOffset + (sinTh * this.rotatingPointOffset),
          y: coords.mtr.y - sinHalfOffset - (cosTh * this.rotatingPointOffset)
        },
        bl: {
          x: coords.mtr.x - cosHalfOffset + (sinTh * this.rotatingPointOffset),
          y: coords.mtr.y + sinHalfOffset - (cosTh * this.rotatingPointOffset)
        },
        br: {
          x: coords.mtr.x + sinHalfOffset + (sinTh * this.rotatingPointOffset),
          y: coords.mtr.y + cosHalfOffset - (cosTh * this.rotatingPointOffset)
        }
      };
    },
    drawBorders: function(ctx) {
      if (!this.hasBorders) return this;
      var padding = this.padding,
        padding2 = padding * 2,
        strokeWidth = ~~(this.strokeWidth / 2) * 2;
      ctx.save();
      ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
      ctx.strokeStyle = this.borderColor;
      var scaleX = 1 / this._constrainScale(this.scaleX),
        scaleY = 1 / this._constrainScale(this.scaleY);
      ctx.lineWidth = 1 / this.borderScaleFactor;
      ctx.scale(scaleX, scaleY);
      var w = this.getWidth(),
        h = this.getHeight();
      ctx.strokeRect(~~(-(w / 2) - padding - strokeWidth / 2 * this.scaleX) - 0.5, ~~(-(h / 2) - padding - strokeWidth / 2 * this.scaleY) - 0.5, ~~(w + padding2 + strokeWidth * this.scaleX) + 1, ~~(h + padding2 + strokeWidth * this.scaleY) + 1);
      if (this.hasRotatingPoint && this.isControlVisible('mtr') && !this.get('lockRotation') && this.hasControls) {
        var rotateHeight = (this.flipY ? h + (strokeWidth * this.scaleY) + (padding * 2) : -h - (strokeWidth * this.scaleY) - (padding * 2)) / 2;
        ctx.beginPath();
        ctx.moveTo(0, rotateHeight);
        ctx.lineTo(0, rotateHeight + (this.flipY ? this.rotatingPointOffset : -this.rotatingPointOffset));
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
      return this;
    },
    drawControls: function(ctx) {
      if (!this.hasControls) return this;
      var size = this.cornerSize,
        size2 = size / 2,
        strokeWidth2 = ~~(this.strokeWidth / 2),
        left = -(this.width / 2),
        top = -(this.height / 2),
        paddingX = this.padding / this.scaleX,
        paddingY = this.padding / this.scaleY,
        scaleOffsetY = size2 / this.scaleY,
        scaleOffsetX = size2 / this.scaleX,
        scaleOffsetSizeX = (size2 - size) / this.scaleX,
        scaleOffsetSizeY = (size2 - size) / this.scaleY,
        height = this.height,
        width = this.width,
        methodName = this.transparentCorners ? 'strokeRect' : 'fillRect';
      ctx.save();
      ctx.lineWidth = 1 / Math.max(this.scaleX, this.scaleY);
      ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
      ctx.strokeStyle = ctx.fillStyle = this.cornerColor;
      this._drawControl('tl', ctx, methodName, left - scaleOffsetX - strokeWidth2 - paddingX, top - scaleOffsetY - strokeWidth2 - paddingY);
      this._drawControl('tr', ctx, methodName, left + width - scaleOffsetX + strokeWidth2 + paddingX, top - scaleOffsetY - strokeWidth2 - paddingY);
      this._drawControl('bl', ctx, methodName, left - scaleOffsetX - strokeWidth2 - paddingX, top + height + scaleOffsetSizeY + strokeWidth2 + paddingY);
      this._drawControl('br', ctx, methodName, left + width + scaleOffsetSizeX + strokeWidth2 + paddingX, top + height + scaleOffsetSizeY + strokeWidth2 + paddingY);
      if (!this.get('lockUniScaling')) {
        this._drawControl('mt', ctx, methodName, left + width / 2 - scaleOffsetX, top - scaleOffsetY - strokeWidth2 - paddingY);
        this._drawControl('mb', ctx, methodName, left + width / 2 - scaleOffsetX, top + height + scaleOffsetSizeY + strokeWidth2 + paddingY);
        this._drawControl('mb', ctx, methodName, left + width + scaleOffsetSizeX + strokeWidth2 + paddingX, top + height / 2 - scaleOffsetY);
        this._drawControl('ml', ctx, methodName, left - scaleOffsetX - strokeWidth2 - paddingX, top + height / 2 - scaleOffsetY);
      }
      if (this.hasRotatingPoint) {
        this._drawControl('mtr', ctx, methodName, left + width / 2 - scaleOffsetX, this.flipY ? (top + height + (this.rotatingPointOffset / this.scaleY) - this.cornerSize / this.scaleX / 2 + strokeWidth2 + paddingY) : (top - (this.rotatingPointOffset / this.scaleY) - this.cornerSize / this.scaleY / 2 - strokeWidth2 - paddingY));
      }
      ctx.restore();
      return this;
    },
    _drawControl: function(control, ctx, methodName, left, top) {
      var sizeX = this.cornerSize / this.scaleX,
        sizeY = this.cornerSize / this.scaleY;
      if (this.isControlVisible(control)) {
        isVML || this.transparentCorners || ctx.clearRect(left, top, sizeX, sizeY);
        ctx[methodName](left, top, sizeX, sizeY);
      }
    },
    isControlVisible: function(controlName) {
      return this._getControlsVisibility()[controlName];
    },
    setControlVisible: function(controlName, visible) {
      this._getControlsVisibility()[controlName] = visible;
      return this;
    },
    setControlsVisibility: function(options) {
      options || (options = {});
      for (var p in options) {
        this.setControlVisible(p, options[p]);
      }
      return this;
    },
    _getControlsVisibility: function() {
      if (!this._controlsVisibility) {
        this._controlsVisibility = {
          tl: true,
          tr: true,
          br: true,
          bl: true,
          ml: true,
          mt: true,
          mr: true,
          mb: true,
          mtr: true
        };
      }
      return this._controlsVisibility;
    }
  });
})();
fabric.util.object.extend(fabric.StaticCanvas.prototype, {
  FX_DURATION: 500,
  fxCenterObjectH: function(object, callbacks) {
    callbacks = callbacks || {};
    var empty = function() {},
      onComplete = callbacks.onComplete || empty,
      onChange = callbacks.onChange || empty,
      _this = this;
    fabric.util.animate({
      startValue: object.get('left'),
      endValue: this.getCenter().left,
      duration: this.FX_DURATION,
      onChange: function(value) {
        object.set('left', value);
        _this.renderAll();
        onChange();
      },
      onComplete: function() {
        object.setCoords();
        onComplete();
      }
    });
    return this;
  },
  fxCenterObjectV: function(object, callbacks) {
    callbacks = callbacks || {};
    var empty = function() {},
      onComplete = callbacks.onComplete || empty,
      onChange = callbacks.onChange || empty,
      _this = this;
    fabric.util.animate({
      startValue: object.get('top'),
      endValue: this.getCenter().top,
      duration: this.FX_DURATION,
      onChange: function(value) {
        object.set('top', value);
        _this.renderAll();
        onChange();
      },
      onComplete: function() {
        object.setCoords();
        onComplete();
      }
    });
    return this;
  },
  fxRemove: function(object, callbacks) {
    callbacks = callbacks || {};
    var empty = function() {},
      onComplete = callbacks.onComplete || empty,
      onChange = callbacks.onChange || empty,
      _this = this;
    fabric.util.animate({
      startValue: object.get('opacity'),
      endValue: 0,
      duration: this.FX_DURATION,
      onStart: function() {
        object.set('active', false);
      },
      onChange: function(value) {
        object.set('opacity', value);
        _this.renderAll();
        onChange();
      },
      onComplete: function() {
        _this.remove(object);
        onComplete();
      }
    });
    return this;
  }
});
fabric.util.object.extend(fabric.Object.prototype, {
  animate: function() {
    if (arguments[0] && typeof arguments[0] === 'object') {
      var propsToAnimate = [],
        prop, skipCallbacks;
      for (prop in arguments[0]) {
        propsToAnimate.push(prop);
      }
      for (var i = 0, len = propsToAnimate.length; i < len; i++) {
        prop = propsToAnimate[i];
        skipCallbacks = i !== len - 1;
        this._animate(prop, arguments[0][prop], arguments[1], skipCallbacks);
      }
    } else {
      this._animate.apply(this, arguments);
    }
    return this;
  },
  _animate: function(property, to, options, skipCallbacks) {
    var obj = this,
      propPair;
    to = to.toString();
    if (!options) {
      options = {};
    } else {
      options = fabric.util.object.clone(options);
    }
    if (~property.indexOf('.')) {
      propPair = property.split('.');
    }
    var currentValue = propPair ? this.get(propPair[0])[propPair[1]] : this.get(property);
    if (!('from' in options)) {
      options.from = currentValue;
    }
    if (~to.indexOf('=')) {
      to = currentValue + parseFloat(to.replace('=', ''));
    } else {
      to = parseFloat(to);
    }
    fabric.util.animate({
      startValue: options.from,
      endValue: to,
      byValue: options.by,
      easing: options.easing,
      duration: options.duration,
      abort: options.abort && function() {
        return options.abort.call(obj);
      },
      onChange: function(value) {
        if (propPair) {
          obj[propPair[0]][propPair[1]] = value;
        } else {
          obj.set(property, value);
        }
        if (skipCallbacks) return;
        options.onChange && options.onChange();
      },
      onComplete: function() {
        if (skipCallbacks) return;
        obj.setCoords();
        options.onComplete && options.onComplete();
      }
    });
  }
});
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend,
    coordProps = {
      'x1': 1,
      'x2': 1,
      'y1': 1,
      'y2': 1
    },
    supportsLineDash = fabric.StaticCanvas.supports('setLineDash');
  if (fabric.Line) {
    fabric.warn('fabric.Line is already defined');
    return;
  }
  fabric.Line = fabric.util.createClass(fabric.Object, {
    type: 'line',
    initialize: function(points, options) {
      options = options || {};
      if (!points) {
        points = [0, 0, 0, 0];
      }
      this.callSuper('initialize', options);
      this.set('x1', points[0]);
      this.set('y1', points[1]);
      this.set('x2', points[2]);
      this.set('y2', points[3]);
      this._setWidthHeight(options);
    },
    _setWidthHeight: function(options) {
      options || (options = {});
      this.set('width', Math.abs(this.x2 - this.x1) || 1);
      this.set('height', Math.abs(this.y2 - this.y1) || 1);
      this.set('left', 'left' in options ? options.left : (Math.min(this.x1, this.x2) + this.width / 2));
      this.set('top', 'top' in options ? options.top : (Math.min(this.y1, this.y2) + this.height / 2));
    },
    _set: function(key, value) {
      this[key] = value;
      if (key in coordProps) {
        this._setWidthHeight();
      }
      return this;
    },
    _render: function(ctx) {
      ctx.beginPath();
      var isInPathGroup = this.group && this.group.type === 'path-group';
      if (isInPathGroup && !this.transformMatrix) {
        ctx.translate(-this.group.width / 2 + this.left, -this.group.height / 2 + this.top);
      }
      if (!this.strokeDashArray || this.strokeDashArray && supportsLineDash) {
        var xMult = this.x1 <= this.x2 ? -1 : 1;
        var yMult = this.y1 <= this.y2 ? -1 : 1;
        ctx.moveTo(this.width === 1 ? 0 : (xMult * this.width / 2), this.height === 1 ? 0 : (yMult * this.height / 2));
        ctx.lineTo(this.width === 1 ? 0 : (xMult * -1 * this.width / 2), this.height === 1 ? 0 : (yMult * -1 * this.height / 2));
      }
      ctx.lineWidth = this.strokeWidth;
      var origStrokeStyle = ctx.strokeStyle;
      ctx.strokeStyle = this.stroke || ctx.fillStyle;
      this._renderStroke(ctx);
      ctx.strokeStyle = origStrokeStyle;
    },
    _renderDashedStroke: function(ctx) {
      var
        xMult = this.x1 <= this.x2 ? -1 : 1,
        yMult = this.y1 <= this.y2 ? -1 : 1,
        x = this.width === 1 ? 0 : xMult * this.width / 2,
        y = this.height === 1 ? 0 : yMult * this.height / 2;
      ctx.beginPath();
      fabric.util.drawDashedLine(ctx, x, y, -x, -y, this.strokeDashArray);
      ctx.closePath();
    },
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        x1: this.get('x1'),
        y1: this.get('y1'),
        x2: this.get('x2'),
        y2: this.get('y2')
      });
    },
    toSVG: function(reviver) {
      var markup = this._createBaseSVGMarkup();
      markup.push('<line ', 'x1="', this.get('x1'), '" y1="', this.get('y1'), '" x2="', this.get('x2'), '" y2="', this.get('y2'), '" style="', this.getSvgStyles(), '"/>');
      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    complexity: function() {
      return 1;
    }
  });
  fabric.Line.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('x1 y1 x2 y2'.split(' '));
  fabric.Line.fromElement = function(element, options) {
    var parsedAttributes = fabric.parseAttributes(element, fabric.Line.ATTRIBUTE_NAMES);
    var points = [parsedAttributes.x1 || 0, parsedAttributes.y1 || 0, parsedAttributes.x2 || 0, parsedAttributes.y2 || 0];
    return new fabric.Line(points, extend(parsedAttributes, options));
  };
  fabric.Line.fromObject = function(object) {
    var points = [object.x1, object.y1, object.x2, object.y2];
    return new fabric.Line(points, object);
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {}),
    piBy2 = Math.PI * 2,
    extend = fabric.util.object.extend;
  if (fabric.Circle) {
    fabric.warn('fabric.Circle is already defined.');
    return;
  }
  fabric.Circle = fabric.util.createClass(fabric.Object, {
    type: 'circle',
    initialize: function(options) {
      options = options || {};
      this.set('radius', options.radius || 0);
      this.callSuper('initialize', options);
    },
    _set: function(key, value) {
      this.callSuper('_set', key, value);
      if (key === 'radius') {
        this.setRadius(value);
      }
      return this;
    },
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        radius: this.get('radius')
      });
    },
    toSVG: function(reviver) {
      var markup = this._createBaseSVGMarkup();
      markup.push('<circle ', 'cx="0" cy="0" ', 'r="', this.radius, '" style="', this.getSvgStyles(), '" transform="', this.getSvgTransform(), '"/>');
      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    _render: function(ctx, noTransform) {
      ctx.beginPath();
      ctx.globalAlpha = this.group ? (ctx.globalAlpha * this.opacity) : this.opacity;
      ctx.arc(noTransform ? this.left : 0, noTransform ? this.top : 0, this.radius, 0, piBy2, false);
      ctx.closePath();
      this._renderFill(ctx);
      this._renderStroke(ctx);
    },
    getRadiusX: function() {
      return this.get('radius') * this.get('scaleX');
    },
    getRadiusY: function() {
      return this.get('radius') * this.get('scaleY');
    },
    setRadius: function(value) {
      this.radius = value;
      this.set('width', value * 2).set('height', value * 2);
    },
    complexity: function() {
      return 1;
    }
  });
  fabric.Circle.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('cx cy r'.split(' '));
  fabric.Circle.fromElement = function(element, options) {
    options || (options = {});
    var parsedAttributes = fabric.parseAttributes(element, fabric.Circle.ATTRIBUTE_NAMES);
    if (!isValidRadius(parsedAttributes)) {
      throw new Error('value of `r` attribute is required and can not be negative');
    }
    if ('left' in parsedAttributes) {
      parsedAttributes.left -= (options.width / 2) || 0;
    }
    if ('top' in parsedAttributes) {
      parsedAttributes.top -= (options.height / 2) || 0;
    }
    var obj = new fabric.Circle(extend(parsedAttributes, options));
    obj.cx = parseFloat(element.getAttribute('cx')) || 0;
    obj.cy = parseFloat(element.getAttribute('cy')) || 0;
    return obj;
  };

  function isValidRadius(attributes) {
    return (('radius' in attributes) && (attributes.radius > 0));
  }
  fabric.Circle.fromObject = function(object) {
    return new fabric.Circle(object);
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {});
  if (fabric.Triangle) {
    fabric.warn('fabric.Triangle is already defined');
    return;
  }
  fabric.Triangle = fabric.util.createClass(fabric.Object, {
    type: 'triangle',
    initialize: function(options) {
      options = options || {};
      this.callSuper('initialize', options);
      this.set('width', options.width || 100).set('height', options.height || 100);
    },
    _render: function(ctx) {
      var widthBy2 = this.width / 2,
        heightBy2 = this.height / 2;
      ctx.beginPath();
      ctx.moveTo(-widthBy2, heightBy2);
      ctx.lineTo(0, -heightBy2);
      ctx.lineTo(widthBy2, heightBy2);
      ctx.closePath();
      this._renderFill(ctx);
      this._renderStroke(ctx);
    },
    _renderDashedStroke: function(ctx) {
      var widthBy2 = this.width / 2,
        heightBy2 = this.height / 2;
      ctx.beginPath();
      fabric.util.drawDashedLine(ctx, -widthBy2, heightBy2, 0, -heightBy2, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, 0, -heightBy2, widthBy2, heightBy2, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, widthBy2, heightBy2, -widthBy2, heightBy2, this.strokeDashArray);
      ctx.closePath();
    },
    toSVG: function(reviver) {
      var markup = this._createBaseSVGMarkup(),
        widthBy2 = this.width / 2,
        heightBy2 = this.height / 2;
      var points = [-widthBy2 + " " + heightBy2, "0 " + -heightBy2, widthBy2 + " " + heightBy2].join(",");
      markup.push('<polygon ', 'points="', points, '" style="', this.getSvgStyles(), '" transform="', this.getSvgTransform(), '"/>');
      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    complexity: function() {
      return 1;
    }
  });
  fabric.Triangle.fromObject = function(object) {
    return new fabric.Triangle(object);
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {}),
    piBy2 = Math.PI * 2,
    extend = fabric.util.object.extend;
  if (fabric.Ellipse) {
    fabric.warn('fabric.Ellipse is already defined.');
    return;
  }
  fabric.Ellipse = fabric.util.createClass(fabric.Object, {
    type: 'ellipse',
    rx: 0,
    ry: 0,
    initialize: function(options) {
      options = options || {};
      this.callSuper('initialize', options);
      this.set('rx', options.rx || 0);
      this.set('ry', options.ry || 0);
      this.set('width', this.get('rx') * 2);
      this.set('height', this.get('ry') * 2);
    },
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        rx: this.get('rx'),
        ry: this.get('ry')
      });
    },
    toSVG: function(reviver) {
      var markup = this._createBaseSVGMarkup();
      markup.push('<ellipse ', 'rx="', this.get('rx'), '" ry="', this.get('ry'), '" style="', this.getSvgStyles(), '" transform="', this.getSvgTransform(), '"/>');
      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    render: function(ctx, noTransform) {
      if (this.rx === 0 || this.ry === 0) return;
      return this.callSuper('render', ctx, noTransform);
    },
    _render: function(ctx, noTransform) {
      ctx.beginPath();
      ctx.save();
      ctx.globalAlpha = this.group ? (ctx.globalAlpha * this.opacity) : this.opacity;
      if (this.transformMatrix && this.group) {
        ctx.translate(this.cx, this.cy);
      }
      ctx.transform(1, 0, 0, this.ry / this.rx, 0, 0);
      ctx.arc(noTransform ? this.left : 0, noTransform ? this.top : 0, this.rx, 0, piBy2, false);
      this._renderFill(ctx);
      this._renderStroke(ctx);
      ctx.restore();
    },
    complexity: function() {
      return 1;
    }
  });
  fabric.Ellipse.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('cx cy rx ry'.split(' '));
  fabric.Ellipse.fromElement = function(element, options) {
    options || (options = {});
    var parsedAttributes = fabric.parseAttributes(element, fabric.Ellipse.ATTRIBUTE_NAMES);
    var cx = parsedAttributes.left;
    var cy = parsedAttributes.top;
    if ('left' in parsedAttributes) {
      parsedAttributes.left -= (options.width / 2) || 0;
    }
    if ('top' in parsedAttributes) {
      parsedAttributes.top -= (options.height / 2) || 0;
    }
    var ellipse = new fabric.Ellipse(extend(parsedAttributes, options));
    ellipse.cx = cx || 0;
    ellipse.cy = cy || 0;
    return ellipse;
  };
  fabric.Ellipse.fromObject = function(object) {
    return new fabric.Ellipse(object);
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend;
  if (fabric.Rect) {
    console.warn('fabric.Rect is already defined');
    return;
  }
  var stateProperties = fabric.Object.prototype.stateProperties.concat();
  stateProperties.push('rx', 'ry', 'x', 'y');
  fabric.Rect = fabric.util.createClass(fabric.Object, {
    stateProperties: stateProperties,
    type: 'rect',
    rx: 0,
    ry: 0,
    x: 0,
    y: 0,
    strokeDashArray: null,
    initialize: function(options) {
      options = options || {};
      this.callSuper('initialize', options);
      this._initRxRy();
      this.x = options.x || 0;
      this.y = options.y || 0;
    },
    _initRxRy: function() {
      if (this.rx && !this.ry) {
        this.ry = this.rx;
      } else if (this.ry && !this.rx) {
        this.rx = this.ry;
      }
    },
    _render: function(ctx) {
      if (this.width === 1 && this.height === 1) {
        ctx.fillRect(0, 0, 1, 1);
        return;
      }
      var rx = this.rx || 0,
        ry = this.ry || 0,
        w = this.width,
        h = this.height,
        x = -w / 2,
        y = -h / 2,
        isInPathGroup = this.group && this.group.type === 'path-group',
        isRounded = rx !== 0 || ry !== 0;
      ctx.beginPath();
      ctx.globalAlpha = isInPathGroup ? (ctx.globalAlpha * this.opacity) : this.opacity;
      if (this.transformMatrix && isInPathGroup) {
        ctx.translate(this.width / 2 + this.x, this.height / 2 + this.y);
      }
      if (!this.transformMatrix && isInPathGroup) {
        ctx.translate(-this.group.width / 2 + this.width / 2 + this.x, -this.group.height / 2 + this.height / 2 + this.y);
      }
      ctx.moveTo(x + rx, y);
      ctx.lineTo(x + w - rx, y);
      isRounded && ctx.quadraticCurveTo(x + w, y, x + w, y + ry, x + w, y + ry);
      ctx.lineTo(x + w, y + h - ry);
      isRounded && ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h, x + w - rx, y + h);
      ctx.lineTo(x + rx, y + h);
      isRounded && ctx.quadraticCurveTo(x, y + h, x, y + h - ry, x, y + h - ry);
      ctx.lineTo(x, y + ry);
      isRounded && ctx.quadraticCurveTo(x, y, x + rx, y, x + rx, y);
      ctx.closePath();
      this._renderFill(ctx);
      this._renderStroke(ctx);
    },
    _renderDashedStroke: function(ctx) {
      var x = -this.width / 2,
        y = -this.height / 2,
        w = this.width,
        h = this.height;
      ctx.beginPath();
      fabric.util.drawDashedLine(ctx, x, y, x + w, y, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x + w, y, x + w, y + h, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x + w, y + h, x, y + h, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x, y + h, x, y, this.strokeDashArray);
      ctx.closePath();
    },
    _normalizeLeftTopProperties: function(parsedAttributes) {
      if ('left' in parsedAttributes) {
        this.set('left', parsedAttributes.left + this.getWidth() / 2);
      }
      this.set('x', parsedAttributes.left || 0);
      if ('top' in parsedAttributes) {
        this.set('top', parsedAttributes.top + this.getHeight() / 2);
      }
      this.set('y', parsedAttributes.top || 0);
      return this;
    },
    toObject: function(propertiesToInclude) {
      var object = extend(this.callSuper('toObject', propertiesToInclude), {
        rx: this.get('rx') || 0,
        ry: this.get('ry') || 0,
        x: this.get('x'),
        y: this.get('y')
      });
      if (!this.includeDefaultValues) {
        this._removeDefaultValues(object);
      }
      return object;
    },
    toSVG: function(reviver) {
      var markup = this._createBaseSVGMarkup();
      markup.push('<rect ', 'x="', (-1 * this.width / 2), '" y="', (-1 * this.height / 2), '" rx="', this.get('rx'), '" ry="', this.get('ry'), '" width="', this.width, '" height="', this.height, '" style="', this.getSvgStyles(), '" transform="', this.getSvgTransform(), '"/>');
      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    complexity: function() {
      return 1;
    }
  });
  fabric.Rect.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('x y rx ry width height'.split(' '));

  function _setDefaultLeftTopValues(attributes) {
    attributes.left = attributes.left || 0;
    attributes.top = attributes.top || 0;
    return attributes;
  }
  fabric.Rect.fromElement = function(element, options) {
    if (!element) {
      return null;
    }
    var parsedAttributes = fabric.parseAttributes(element, fabric.Rect.ATTRIBUTE_NAMES);
    parsedAttributes = _setDefaultLeftTopValues(parsedAttributes);
    var rect = new fabric.Rect(extend((options ? fabric.util.object.clone(options) : {}), parsedAttributes));
    rect._normalizeLeftTopProperties(parsedAttributes);
    return rect;
  };
  fabric.Rect.fromObject = function(object) {
    return new fabric.Rect(object);
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {}),
    toFixed = fabric.util.toFixed;
  if (fabric.Polyline) {
    fabric.warn('fabric.Polyline is already defined');
    return;
  }
  fabric.Polyline = fabric.util.createClass(fabric.Object, {
    type: 'polyline',
    initialize: function(points, options, skipOffset) {
      options = options || {};
      this.set('points', points);
      this.callSuper('initialize', options);
      this._calcDimensions(skipOffset);
    },
    _calcDimensions: function(skipOffset) {
      return fabric.Polygon.prototype._calcDimensions.call(this, skipOffset);
    },
    toObject: function(propertiesToInclude) {
      return fabric.Polygon.prototype.toObject.call(this, propertiesToInclude);
    },
    toSVG: function(reviver) {
      var points = [],
        markup = this._createBaseSVGMarkup();
      for (var i = 0, len = this.points.length; i < len; i++) {
        points.push(toFixed(this.points[i].x, 2), ',', toFixed(this.points[i].y, 2), ' ');
      }
      markup.push('<polyline ', 'points="', points.join(''), '" style="', this.getSvgStyles(), '" transform="', this.getSvgTransform(), '"/>');
      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    _render: function(ctx) {
      var point;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (var i = 0, len = this.points.length; i < len; i++) {
        point = this.points[i];
        ctx.lineTo(point.x, point.y);
      }
      this._renderFill(ctx);
      this._renderStroke(ctx);
    },
    _renderDashedStroke: function(ctx) {
      var p1, p2;
      ctx.beginPath();
      for (var i = 0, len = this.points.length; i < len; i++) {
        p1 = this.points[i];
        p2 = this.points[i + 1] || p1;
        fabric.util.drawDashedLine(ctx, p1.x, p1.y, p2.x, p2.y, this.strokeDashArray);
      }
    },
    complexity: function() {
      return this.get('points').length;
    }
  });
  fabric.Polyline.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat();
  fabric.Polyline.fromElement = function(element, options) {
    if (!element) {
      return null;
    }
    options || (options = {});
    var points = fabric.parsePointsAttribute(element.getAttribute('points')),
      parsedAttributes = fabric.parseAttributes(element, fabric.Polyline.ATTRIBUTE_NAMES);
    fabric.util.normalizePoints(points, options);
    return new fabric.Polyline(points, fabric.util.object.extend(parsedAttributes, options), true);
  };
  fabric.Polyline.fromObject = function(object) {
    var points = object.points;
    return new fabric.Polyline(points, object, true);
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend,
    min = fabric.util.array.min,
    max = fabric.util.array.max,
    toFixed = fabric.util.toFixed;
  if (fabric.Polygon) {
    fabric.warn('fabric.Polygon is already defined');
    return;
  }
  fabric.Polygon = fabric.util.createClass(fabric.Object, {
    type: 'polygon',
    initialize: function(points, options, skipOffset) {
      options = options || {};
      this.points = points;
      this.callSuper('initialize', options);
      this._calcDimensions(skipOffset);
    },
    _calcDimensions: function(skipOffset) {
      var points = this.points,
        minX = min(points, 'x'),
        minY = min(points, 'y'),
        maxX = max(points, 'x'),
        maxY = max(points, 'y');
      this.width = (maxX - minX) || 1;
      this.height = (maxY - minY) || 1;
      this.minX = minX;
      this.minY = minY;
      if (skipOffset) return;
      var halfWidth = this.width / 2 + this.minX,
        halfHeight = this.height / 2 + this.minY;
      this.points.forEach(function(p) {
        p.x -= halfWidth;
        p.y -= halfHeight;
      }, this);
    },
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        points: this.points.concat()
      });
    },
    toSVG: function(reviver) {
      var points = [],
        markup = this._createBaseSVGMarkup();
      for (var i = 0, len = this.points.length; i < len; i++) {
        points.push(toFixed(this.points[i].x, 2), ',', toFixed(this.points[i].y, 2), ' ');
      }
      markup.push('<polygon ', 'points="', points.join(''), '" style="', this.getSvgStyles(), '" transform="', this.getSvgTransform(), '"/>');
      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    _render: function(ctx) {
      var point;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (var i = 0, len = this.points.length; i < len; i++) {
        point = this.points[i];
        ctx.lineTo(point.x, point.y);
      }
      this._renderFill(ctx);
      if (this.stroke || this.strokeDashArray) {
        ctx.closePath();
        this._renderStroke(ctx);
      }
    },
    _renderDashedStroke: function(ctx) {
      var p1, p2;
      ctx.beginPath();
      for (var i = 0, len = this.points.length; i < len; i++) {
        p1 = this.points[i];
        p2 = this.points[i + 1] || this.points[0];
        fabric.util.drawDashedLine(ctx, p1.x, p1.y, p2.x, p2.y, this.strokeDashArray);
      }
      ctx.closePath();
    },
    complexity: function() {
      return this.points.length;
    }
  });
  fabric.Polygon.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat();
  fabric.Polygon.fromElement = function(element, options) {
    if (!element) {
      return null;
    }
    options || (options = {});
    var points = fabric.parsePointsAttribute(element.getAttribute('points')),
      parsedAttributes = fabric.parseAttributes(element, fabric.Polygon.ATTRIBUTE_NAMES);
    fabric.util.normalizePoints(points, options);
    return new fabric.Polygon(points, extend(parsedAttributes, options), true);
  };
  fabric.Polygon.fromObject = function(object) {
    return new fabric.Polygon(object.points, object, true);
  };
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  var commandLengths = {
    m: 2,
    l: 2,
    h: 1,
    v: 1,
    c: 6,
    s: 4,
    q: 4,
    t: 2,
    a: 7
  };
  "use strict";
  var fabric = global.fabric || (global.fabric = {}),
    min = fabric.util.array.min,
    max = fabric.util.array.max,
    extend = fabric.util.object.extend,
    _toString = Object.prototype.toString,
    drawArc = fabric.util.drawArc;
  if (fabric.Path) {
    fabric.warn('fabric.Path is already defined');
    return;
  }

  function getX(item) {
    if (item[0] === 'H') {
      return item[1];
    }
    return item[item.length - 2];
  }

  function getY(item) {
    if (item[0] === 'V') {
      return item[1];
    }
    return item[item.length - 1];
  }
  fabric.Path = fabric.util.createClass(fabric.Object, {
    type: 'path',
    initialize: function(path, options) {
      options = options || {};
      this.setOptions(options);
      if (!path) {
        throw new Error('`path` argument is required');
      }
      var fromArray = _toString.call(path) === '[object Array]';
      this.path = fromArray ? path : path.match && path.match(/[mzlhvcsqta][^mzlhvcsqta]*/gi);
      if (!this.path) return;
      if (!fromArray) {
        this.path = this._parsePath();
      }
      this._initializePath(options);
      if (options.sourcePath) {
        this.setSourcePath(options.sourcePath);
      }
    },
    _initializePath: function(options) {
      var isWidthSet = 'width' in options && options.width != null,
        isHeightSet = 'height' in options && options.width != null,
        isLeftSet = 'left' in options,
        isTopSet = 'top' in options,
        origLeft = isLeftSet ? this.left : 0,
        origTop = isTopSet ? this.top : 0;
      if (!isWidthSet || !isHeightSet) {
        extend(this, this._parseDimensions());
        if (isWidthSet) {
          this.width = options.width;
        }
        if (isHeightSet) {
          this.height = options.height;
        }
      } else {
        if (!isTopSet) {
          this.top = this.height / 2;
        }
        if (!isLeftSet) {
          this.left = this.width / 2;
        }
      }
      this.pathOffset = this.pathOffset || this._calculatePathOffset(origLeft, origTop);
    },
    _calculatePathOffset: function(origLeft, origTop) {
      return {
        x: this.left - origLeft - (this.width / 2),
        y: this.top - origTop - (this.height / 2)
      };
    },
    _render: function(ctx) {
      var current, previous = null,
        x = 0,
        y = 0,
        controlX = 0,
        controlY = 0,
        tempX, tempY, tempControlX, tempControlY, l = -((this.width / 2) + this.pathOffset.x),
        t = -((this.height / 2) + this.pathOffset.y),
        methodName;
      for (var i = 0, len = this.path.length; i < len; ++i) {
        current = this.path[i];
        switch (current[0]) {
          case 'l':
            x += current[1];
            y += current[2];
            ctx.lineTo(x + l, y + t);
            break;
          case 'L':
            x = current[1];
            y = current[2];
            ctx.lineTo(x + l, y + t);
            break;
          case 'h':
            x += current[1];
            ctx.lineTo(x + l, y + t);
            break;
          case 'H':
            x = current[1];
            ctx.lineTo(x + l, y + t);
            break;
          case 'v':
            y += current[1];
            ctx.lineTo(x + l, y + t);
            break;
          case 'V':
            y = current[1];
            ctx.lineTo(x + l, y + t);
            break;
          case 'm':
            x += current[1];
            y += current[2];
            methodName = (previous && (previous[0] === 'm' || previous[0] === 'M')) ? 'lineTo' : 'moveTo';
            ctx[methodName](x + l, y + t);
            break;
          case 'M':
            x = current[1];
            y = current[2];
            methodName = (previous && (previous[0] === 'm' || previous[0] === 'M')) ? 'lineTo' : 'moveTo';
            ctx[methodName](x + l, y + t);
            break;
          case 'c':
            tempX = x + current[5];
            tempY = y + current[6];
            controlX = x + current[3];
            controlY = y + current[4];
            ctx.bezierCurveTo(x + current[1] + l, y + current[2] + t, controlX + l, controlY + t, tempX + l, tempY + t);
            x = tempX;
            y = tempY;
            break;
          case 'C':
            x = current[5];
            y = current[6];
            controlX = current[3];
            controlY = current[4];
            ctx.bezierCurveTo(current[1] + l, current[2] + t, controlX + l, controlY + t, x + l, y + t);
            break;
          case 's':
            tempX = x + current[3];
            tempY = y + current[4];
            controlX = controlX ? (2 * x - controlX) : x;
            controlY = controlY ? (2 * y - controlY) : y;
            ctx.bezierCurveTo(controlX + l, controlY + t, x + current[1] + l, y + current[2] + t, tempX + l, tempY + t);
            controlX = x + current[1];
            controlY = y + current[2];
            x = tempX;
            y = tempY;
            break;
          case 'S':
            tempX = current[3];
            tempY = current[4];
            controlX = 2 * x - controlX;
            controlY = 2 * y - controlY;
            ctx.bezierCurveTo(controlX + l, controlY + t, current[1] + l, current[2] + t, tempX + l, tempY + t);
            x = tempX;
            y = tempY;
            controlX = current[1];
            controlY = current[2];
            break;
          case 'q':
            tempX = x + current[3];
            tempY = y + current[4];
            controlX = x + current[1];
            controlY = y + current[2];
            ctx.quadraticCurveTo(controlX + l, controlY + t, tempX + l, tempY + t);
            x = tempX;
            y = tempY;
            break;
          case 'Q':
            tempX = current[3];
            tempY = current[4];
            ctx.quadraticCurveTo(current[1] + l, current[2] + t, tempX + l, tempY + t);
            x = tempX;
            y = tempY;
            controlX = current[1];
            controlY = current[2];
            break;
          case 't':
            tempX = x + current[1];
            tempY = y + current[2];
            if (previous[0].match(/[QqTt]/) === null) {
              controlX = x;
              controlY = y;
            } else if (previous[0] === 't') {
              controlX = 2 * x - tempControlX;
              controlY = 2 * y - tempControlY;
            } else if (previous[0] === 'q') {
              controlX = 2 * x - controlX;
              controlY = 2 * y - controlY;
            }
            tempControlX = controlX;
            tempControlY = controlY;
            ctx.quadraticCurveTo(controlX + l, controlY + t, tempX + l, tempY + t);
            x = tempX;
            y = tempY;
            controlX = x + current[1];
            controlY = y + current[2];
            break;
          case 'T':
            tempX = current[1];
            tempY = current[2];
            controlX = 2 * x - controlX;
            controlY = 2 * y - controlY;
            ctx.quadraticCurveTo(controlX + l, controlY + t, tempX + l, tempY + t);
            x = tempX;
            y = tempY;
            break;
          case 'a':
            drawArc(ctx, x + l, y + t, [current[1], current[2], current[3], current[4], current[5], current[6] + x + l, current[7] + y + t]);
            x += current[6];
            y += current[7];
            break;
          case 'A':
            drawArc(ctx, x + l, y + t, [current[1], current[2], current[3], current[4], current[5], current[6] + l, current[7] + t]);
            x = current[6];
            y = current[7];
            break;
          case 'z':
          case 'Z':
            ctx.closePath();
            break;
        }
        previous = current;
      }
    },
    render: function(ctx, noTransform) {
      if (!this.visible) return;
      ctx.save();
      var m = this.transformMatrix;
      if (m) {
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }
      if (!noTransform) {
        this.transform(ctx);
      }
      this._setStrokeStyles(ctx);
      this._setFillStyles(ctx);
      this._setShadow(ctx);
      this.clipTo && fabric.util.clipContext(this, ctx);
      ctx.beginPath();
      this._render(ctx);
      this._renderFill(ctx);
      this._renderStroke(ctx);
      this.clipTo && ctx.restore();
      this._removeShadow(ctx);
      if (!noTransform && this.active) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
    },
    toString: function() {
      return '#<fabric.Path (' + this.complexity() + '): { "top": ' + this.top + ', "left": ' + this.left + ' }>';
    },
    toObject: function(propertiesToInclude) {
      var o = extend(this.callSuper('toObject', propertiesToInclude), {
        path: this.path.map(function(item) {
          return item.slice()
        }),
        pathOffset: this.pathOffset
      });
      if (this.sourcePath) {
        o.sourcePath = this.sourcePath;
      }
      if (this.transformMatrix) {
        o.transformMatrix = this.transformMatrix;
      }
      return o;
    },
    toDatalessObject: function(propertiesToInclude) {
      var o = this.toObject(propertiesToInclude);
      if (this.sourcePath) {
        o.path = this.sourcePath;
      }
      delete o.sourcePath;
      return o;
    },
    toSVG: function(reviver) {
      var chunks = [],
        markup = this._createBaseSVGMarkup();
      for (var i = 0, len = this.path.length; i < len; i++) {
        chunks.push(this.path[i].join(' '));
      }
      var path = chunks.join(' ');
      markup.push('<g transform="', (this.group ? '' : this.getSvgTransform()), '">', '<path ', 'd="', path, '" style="', this.getSvgStyles(), '" transform="translate(', (-this.width / 2), ' ', (-this.height / 2), ')', '" stroke-linecap="round" ', '/>', '</g>');
      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    complexity: function() {
      return this.path.length;
    },
    _parsePath: function() {
      var result = [],
        coords = [],
        currentPath, parsed, re = /([-+]?((\d+\.\d+)|((\d+)|(\.\d+)))(?:e[-+]?\d+)?)/ig,
        match, coordsStr;
      for (var i = 0, coordsParsed, len = this.path.length; i < len; i++) {
        currentPath = this.path[i];
        coordsStr = currentPath.slice(1).trim();
        coords.length = 0;
        while ((match = re.exec(coordsStr))) {
          coords.push(match[0]);
        }
        coordsParsed = [currentPath.charAt(0)];
        for (var j = 0, jlen = coords.length; j < jlen; j++) {
          parsed = parseFloat(coords[j]);
          if (!isNaN(parsed)) {
            coordsParsed.push(parsed);
          }
        }
        var command = coordsParsed[0].toLowerCase(),
          commandLength = commandLengths[command];
        if (coordsParsed.length - 1 > commandLength) {
          for (var k = 1, klen = coordsParsed.length; k < klen; k += commandLength) {
            result.push([coordsParsed[0]].concat(coordsParsed.slice(k, k + commandLength)));
          }
        } else {
          result.push(coordsParsed);
        }
      }
      return result;
    },
    _parseDimensions: function() {
      var aX = [],
        aY = [],
        previous = {};
      this.path.forEach(function(item, i) {
        this._getCoordsFromCommand(item, i, aX, aY, previous);
      }, this);
      var minX = min(aX),
        minY = min(aY),
        maxX = max(aX),
        maxY = max(aY),
        deltaX = maxX - minX,
        deltaY = maxY - minY;
      var o = {
        left: this.left + (minX + deltaX / 2),
        top: this.top + (minY + deltaY / 2),
        width: deltaX,
        height: deltaY
      };
      return o;
    },
    _getCoordsFromCommand: function(item, i, aX, aY, previous) {
      var isLowerCase = false;
      if (item[0] !== 'H') {
        previous.x = (i === 0) ? getX(item) : getX(this.path[i - 1]);
      }
      if (item[0] !== 'V') {
        previous.y = (i === 0) ? getY(item) : getY(this.path[i - 1]);
      }
      if (item[0] === item[0].toLowerCase()) {
        isLowerCase = true;
      }
      var xy = this._getXY(item, isLowerCase, previous);
      var val = parseInt(xy.x, 10);
      if (!isNaN(val)) aX.push(val);
      val = parseInt(xy.y, 10);
      if (!isNaN(val)) aY.push(val);
    },
    _getXY: function(item, isLowerCase, previous) {
      var x = isLowerCase ? previous.x + getX(item) : item[0] === 'V' ? previous.x : getX(item);
      var y = isLowerCase ? previous.y + getY(item) : item[0] === 'H' ? previous.y : getY(item);
      return {
        x: x,
        y: y
      };
    }
  });
  fabric.Path.fromObject = function(object, callback) {
    if (typeof object.path === 'string') {
      fabric.loadSVGFromURL(object.path, function(elements) {
        var path = elements[0];
        var pathUrl = object.path;
        delete object.path;
        fabric.util.object.extend(path, object);
        path.setSourcePath(pathUrl);
        callback(path);
      });
    } else {
      callback(new fabric.Path(object.path, object));
    }
  };
  fabric.Path.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat(['d']);
  fabric.Path.fromElement = function(element, callback, options) {
    var parsedAttributes = fabric.parseAttributes(element, fabric.Path.ATTRIBUTE_NAMES);
    callback && callback(new fabric.Path(parsedAttributes.d, extend(parsedAttributes, options)));
  };
  fabric.Path.async = true;
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend,
    invoke = fabric.util.array.invoke,
    parentToObject = fabric.Object.prototype.toObject;
  if (fabric.PathGroup) {
    fabric.warn('fabric.PathGroup is already defined');
    return;
  }
  fabric.PathGroup = fabric.util.createClass(fabric.Path, {
    type: 'path-group',
    fill: '',
    initialize: function(paths, options) {
      options = options || {};
      this.paths = paths || [];
      for (var i = this.paths.length; i--;) {
        this.paths[i].group = this;
      }
      this.setOptions(options);
      this.setCoords();
      if (options.sourcePath) {
        this.setSourcePath(options.sourcePath);
      }
    },
    render: function(ctx) {
      if (!this.visible) return;
      ctx.save();
      var m = this.transformMatrix;
      if (m) {
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }
      this.transform(ctx);
      this._setShadow(ctx);
      this.clipTo && fabric.util.clipContext(this, ctx);
      for (var i = 0, l = this.paths.length; i < l; ++i) {
        this.paths[i].render(ctx, true);
      }
      this.clipTo && ctx.restore();
      this._removeShadow(ctx);
      if (this.active) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
    },
    _set: function(prop, value) {
      if (prop === 'fill' && value && this.isSameColor()) {
        var i = this.paths.length;
        while (i--) {
          this.paths[i]._set(prop, value);
        }
      }
      return this.callSuper('_set', prop, value);
    },
    toObject: function(propertiesToInclude) {
      var o = extend(parentToObject.call(this, propertiesToInclude), {
        paths: invoke(this.getObjects(), 'toObject', propertiesToInclude)
      });
      if (this.sourcePath) {
        o.sourcePath = this.sourcePath;
      }
      return o;
    },
    toDatalessObject: function(propertiesToInclude) {
      var o = this.toObject(propertiesToInclude);
      if (this.sourcePath) {
        o.paths = this.sourcePath;
      }
      return o;
    },
    toSVG: function(reviver) {
      var objects = this.getObjects();
      var markup = ['<g ', 'style="', this.getSvgStyles(), '" ', 'transform="', this.getSvgTransform(), '" ', '>'];
      for (var i = 0, len = objects.length; i < len; i++) {
        markup.push(objects[i].toSVG(reviver));
      }
      markup.push('</g>');
      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    toString: function() {
      return '#<fabric.PathGroup (' + this.complexity() + '): { top: ' + this.top + ', left: ' + this.left + ' }>';
    },
    isSameColor: function() {
      var firstPathFill = this.getObjects()[0].get('fill');
      return this.getObjects().every(function(path) {
        return path.get('fill') === firstPathFill;
      });
    },
    complexity: function() {
      return this.paths.reduce(function(total, path) {
        return total + ((path && path.complexity) ? path.complexity() : 0);
      }, 0);
    },
    getObjects: function() {
      return this.paths;
    }
  });
  fabric.PathGroup.fromObject = function(object, callback) {
    if (typeof object.paths === 'string') {
      fabric.loadSVGFromURL(object.paths, function(elements) {
        var pathUrl = object.paths;
        delete object.paths;
        var pathGroup = fabric.util.groupSVGElements(elements, object, pathUrl);
        callback(pathGroup);
      });
    } else {
      fabric.util.enlivenObjects(object.paths, function(enlivenedObjects) {
        delete object.paths;
        callback(new fabric.PathGroup(enlivenedObjects, object));
      });
    }
  };
  fabric.PathGroup.async = true;
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  "use strict";
  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend,
    min = fabric.util.array.min,
    max = fabric.util.array.max,
    invoke = fabric.util.array.invoke;
  if (fabric.Group) {
    return;
  }
  var _lockProperties = {
    lockMovementX: true,
    lockMovementY: true,
    lockRotation: true,
    lockScalingX: true,
    lockScalingY: true,
    lockUniScaling: true
  };
  fabric.Group = fabric.util.createClass(fabric.Object, fabric.Collection, {
    type: 'group',
    initialize: function(objects, options) {
      options = options || {};
      this._objects = objects || [];
      for (var i = this._objects.length; i--;) {
        this._objects[i].group = this;
      }
      this.originalState = {};
      this.callSuper('initialize');
      this._calcBounds();
      this._updateObjectsCoords();
      if (options) {
        extend(this, options);
      }
      this._setOpacityIfSame();
      this.setCoords(true);
      this.saveCoords();
    },
    _updateObjectsCoords: function() {
      this.forEachObject(this._updateObjectCoords, this);
    },
    _updateObjectCoords: function(object) {
      var objectLeft = object.getLeft(),
        objectTop = object.getTop();
      object.set({
        originalLeft: objectLeft,
        originalTop: objectTop,
        left: objectLeft - this.left,
        top: objectTop - this.top
      });
      object.setCoords();
      object.__origHasControls = object.hasControls;
      object.hasControls = false;
    },
    toString: function() {
      return '#<fabric.Group: (' + this.complexity() + ')>';
    },
    addWithUpdate: function(object) {
      this._restoreObjectsState();
      this._objects.push(object);
      object.group = this;
      this.forEachObject(this._setObjectActive, this);
      this._calcBounds();
      this._updateObjectsCoords();
      return this;
    },
    _setObjectActive: function(object) {
      object.set('active', true);
      object.group = this;
    },
    removeWithUpdate: function(object) {
      this._moveFlippedObject(object);
      this._restoreObjectsState();
      this.forEachObject(this._setObjectActive, this);
      this.remove(object);
      this._calcBounds();
      this._updateObjectsCoords();
      return this;
    },
    _onObjectAdded: function(object) {
      object.group = this;
    },
    _onObjectRemoved: function(object) {
      delete object.group;
      object.set('active', false);
    },
    delegatedProperties: {
      fill: true,
      opacity: true,
      fontFamily: true,
      fontWeight: true,
      fontSize: true,
      fontStyle: true,
      lineHeight: true,
      textDecoration: true,
      textAlign: true,
      backgroundColor: true
    },
    _set: function(key, value) {
      if (key in this.delegatedProperties) {
        var i = this._objects.length;
        this[key] = value;
        while (i--) {
          this._objects[i].set(key, value);
        }
      } else {
        this[key] = value;
      }
    },
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        objects: invoke(this._objects, 'toObject', propertiesToInclude)
      });
    },
    render: function(ctx, noTransform) {
      if (!this.visible) return;
      ctx.save();
      this.transform(ctx);
      this.clipTo && fabric.util.clipContext(this, ctx);
      for (var i = 0, len = this._objects.length; i < len; i++) {
        this._renderObject(this._objects[i], ctx);
      }
      this.clipTo && ctx.restore();
      if (!noTransform && this.active) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
    },
    _renderObject: function(object, ctx) {
      var originalScaleFactor = object.borderScaleFactor,
        originalHasRotatingPoint = object.hasRotatingPoint,
        groupScaleFactor = Math.max(this.scaleX, this.scaleY);
      if (!object.visible) return;
      object.borderScaleFactor = groupScaleFactor;
      object.hasRotatingPoint = false;
      object.render(ctx);
      object.borderScaleFactor = originalScaleFactor;
      object.hasRotatingPoint = originalHasRotatingPoint;
    },
    _restoreObjectsState: function() {
      this._objects.forEach(this._restoreObjectState, this);
      return this;
    },
    _moveFlippedObject: function(object) {
      var oldOriginX = object.get('originX'),
        oldOriginY = object.get('originY'),
        center = object.getCenterPoint();
      object.set({
        originX: 'center',
        originY: 'center',
        left: center.x,
        top: center.y
      });
      this._toggleFlipping(object);
      var newOrigin = object.getPointByOrigin(oldOriginX, oldOriginY);
      object.set({
        originX: oldOriginX,
        originY: oldOriginY,
        left: newOrigin.x,
        top: newOrigin.y
      });
      return this;
    },
    _toggleFlipping: function(object) {
      if (this.flipX) {
        object.toggle('flipX');
        object.set('left', -object.get('left'));
        object.setAngle(-object.getAngle());
      }
      if (this.flipY) {
        object.toggle('flipY');
        object.set('top', -object.get('top'));
        object.setAngle(-object.getAngle());
      }
    },
    _restoreObjectState: function(object) {
      this._setObjectPosition(object);
      object.setCoords();
      object.hasControls = object.__origHasControls;
      delete object.__origHasControls;
      object.set('active', false);
      object.setCoords();
      delete object.group;
      return this;
    },
    _setObjectPosition: function(object) {
      var groupLeft = this.getLeft(),
        groupTop = this.getTop(),
        rotated = this._getRotatedLeftTop(object);
      object.set({
        angle: object.getAngle() + this.getAngle(),
        left: groupLeft + rotated.left,
        top: groupTop + rotated.top,
        scaleX: object.get('scaleX') * this.get('scaleX'),
        scaleY: object.get('scaleY') * this.get('scaleY')
      });
    },
    _getRotatedLeftTop: function(object) {
      var groupAngle = this.getAngle() * (Math.PI / 180);
      return {
        left: (-Math.sin(groupAngle) * object.getTop() * this.get('scaleY') +
          Math.cos(groupAngle) * object.getLeft() * this.get('scaleX')),
        top: (Math.cos(groupAngle) * object.getTop() * this.get('scaleY') +
          Math.sin(groupAngle) * object.getLeft() * this.get('scaleX'))
      };
    },
    destroy: function() {
      this._objects.forEach(this._moveFlippedObject, this);
      return this._restoreObjectsState();
    },
    saveCoords: function() {
      this._originalLeft = this.get('left');
      this._originalTop = this.get('top');
      return this;
    },
    hasMoved: function() {
      return this._originalLeft !== this.get('left') || this._originalTop !== this.get('top');
    },
    setObjectsCoords: function() {
      this.forEachObject(function(object) {
        object.setCoords();
      });
      return this;
    },
    _setOpacityIfSame: function() {
      var objects = this.getObjects(),
        firstValue = objects[0] ? objects[0].get('opacity') : 1;
      var isSameOpacity = objects.every(function(o) {
        return o.get('opacity') === firstValue;
      });
      if (isSameOpacity) {
        this.opacity = firstValue;
      }
    },
    _calcBounds: function() {
      var aX = [],
        aY = [],
        o;
      for (var i = 0, len = this._objects.length; i < len; ++i) {
        o = this._objects[i];
        o.setCoords();
        for (var prop in o.oCoords) {
          aX.push(o.oCoords[prop].x);
          aY.push(o.oCoords[prop].y);
        }
      }
      this.set(this._getBounds(aX, aY));
    },
    _getBounds: function(aX, aY) {
      var minX = min(aX),
        maxX = max(aX),
        minY = min(aY),
        maxY = max(aY),
        width = (maxX - minX) || 0,
        height = (maxY - minY) || 0;
      return {
        width: width,
        height: height,
        left: (minX + width / 2) || 0,
        top: (minY + height / 2) || 0
      };
    },
    toSVG: function(reviver) {
      var markup = ['<g ', 'transform="', this.getSvgTransform(), '">'];
      for (var i = 0, len = this._objects.length; i < len; i++) {
        markup.push(this._objects[i].toSVG(reviver));
      }
      markup.push('</g>');
      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    get: function(prop) {
      if (prop in _lockProperties) {
        if (this[prop]) {
          return this[prop];
        } else {
          for (var i = 0, len = this._objects.length; i < len; i++) {
            if (this._objects[i][prop]) {
              return true;
            }
          }
          return false;
        }
      } else {
        if (prop in this.delegatedProperties) {
          return this._objects[0] && this._objects[0].get(prop);
        }
        return this[prop];
      }
    }
  });
  fabric.Group.fromObject = function(object, callback) {
    fabric.util.enlivenObjects(object.objects, function(enlivenedObjects) {
      delete object.objects;
      callback && callback(new fabric.Group(enlivenedObjects, object));
    });
  };
  fabric.Group.async = true;
})(typeof exports !== 'undefined' ? exports : this);
(function(global) {
  "use strict";
  var extend = fabric.util.object.extend;
  if (!global.fabric) {
    global.fabric = {};
  }

  if (global.fabric.Image) {
    fabric.warn('fabric.Image is already defined.');
    return;
  }

  /**
   * Image class
   * @class fabric.Image
   * @extends fabric.Object
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-1/#images}
   * @see {@link fabric.Image#initialize} for constructor definition
   */
  fabric.Image = fabric.util.createClass(fabric.Object, /** @lends fabric.Image.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'image',

    /**
     * crossOrigin value (one of "", "anonymous", "allow-credentials")
     * @see https://developer.mozilla.org/en-US/docs/HTML/CORS_settings_attributes
     * @type String
     * @default
     */
    crossOrigin: '',

    /**
     * Constructor
     * @param {HTMLImageElement | String} element Image element
     * @param {Object} [options] Options object
     * @return {fabric.Image} thisArg
     */
    initialize: function(element, options) {
      options || (options = {});

      this.filters = [];

      this.callSuper('initialize', options);

      this._initElement(element, options);
      this._initConfig(options);

      if (options.filters) {
        this.filters = options.filters;
        this.applyFilters();
      }
    },

    /**
     * Returns image element which this instance if based on
     * @return {HTMLImageElement} Image element
     */
    getElement: function() {
      return this._element;
    },

    /**
     * Sets image element for this instance to a specified one.
     * If filters defined they are applied to new image.
     * You might need to call `canvas.renderAll` and `object.setCoords` after replacing, to render new image and update controls area.
     * @param {HTMLImageElement} element
     * @param {Function} [callback] Callback is invoked when all filters have been applied and new image is generated
     * @return {fabric.Image} thisArg
     * @chainable
     */
    setElement: function(element, callback) {
      this._element = element;
      this._originalElement = element;
      this._initConfig();

      if (this.filters.length !== 0) {
        this.applyFilters(callback);
      }

      return this;
    },

    /**
     * Sets crossOrigin value (on an instance and corresponding image element)
     * @return {fabric.Image} thisArg
     * @chainable
     */
    setCrossOrigin: function(value) {
      this.crossOrigin = value;
      this._element.crossOrigin = value;

      return this;
    },

    /**
     * Returns original size of an image
     * @return {Object} Object with "width" and "height" properties
     */
    getOriginalSize: function() {
      var element = this.getElement();
      return {
        width: element.width,
        height: element.height
      };
    },

    /**
     * Renders image on a specified context
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Boolean} [noTransform] When true, context is not transformed
     */
    render: function(ctx, noTransform) {
      // do not render if object is not visible
      if (!this.visible) return;

      ctx.save();
      var m = this.transformMatrix;
      var isInPathGroup = this.group && this.group.type === 'path-group';

      // this._resetWidthHeight();
      if (isInPathGroup) {
        ctx.translate(-this.group.width / 2 + this.width / 2, -this.group.height / 2 + this.height / 2);
      }
      if (m) {
        ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }
      if (!noTransform) {
        this.transform(ctx);
      }

      ctx.save();
      this._setShadow(ctx);
      this.clipTo && fabric.util.clipContext(this, ctx);
      this._render(ctx);
      if (this.shadow && !this.shadow.affectStroke) {
        this._removeShadow(ctx);
      }
      this._renderStroke(ctx);
      this.clipTo && ctx.restore();
      ctx.restore();

      if (this.active && !noTransform) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _stroke: function(ctx) {
      ctx.save();
      this._setStrokeStyles(ctx);
      ctx.beginPath();
      ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.closePath();
      ctx.restore();
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderDashedStroke: function(ctx) {
      var x = -this.width / 2,
        y = -this.height / 2,
        w = this.width,
        h = this.height;

      ctx.save();
      this._setStrokeStyles(ctx);

      ctx.beginPath();
      fabric.util.drawDashedLine(ctx, x, y, x + w, y, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x + w, y, x + w, y + h, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x + w, y + h, x, y + h, this.strokeDashArray);
      fabric.util.drawDashedLine(ctx, x, y + h, x, y, this.strokeDashArray);
      ctx.closePath();
      ctx.restore();
    },

    /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return extend(this.callSuper('toObject', propertiesToInclude), {
        src: this._originalElement.src || this._originalElement._src,
        filters: this.filters.map(function(filterObj) {
          return filterObj && filterObj.toObject();
        }),
        crossOrigin: this.crossOrigin
      });
    },

    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of an instance
     * @param {Function} [reviver] Method for further parsing of svg representation.
     * @return {String} svg representation of an instance
     */
    toSVG: function(reviver) {
      var markup = [];

      markup.push(
        '<g transform="', this.getSvgTransform(), '">',
        '<image xlink:href="', this.getSvgSrc(),
        '" style="', this.getSvgStyles(),
        // we're essentially moving origin of transformation from top/left corner to the center of the shape
        // by wrapping it in container <g> element with actual transformation, then offsetting object to the top/left
        // so that object's center aligns with container's left/top
        '" transform="translate(' + (-this.width / 2) + ' ' + (-this.height / 2) + ')',
        '" width="', this.width,
        '" height="', this.height,
        '" preserveAspectRatio="none"',
        '></image>'
      );

      if (this.stroke || this.strokeDashArray) {
        var origFill = this.fill;
        this.fill = null;
        markup.push(
          '<rect ',
          'x="', (-1 * this.width / 2), '" y="', (-1 * this.height / 2),
          '" width="', this.width, '" height="', this.height,
          '" style="', this.getSvgStyles(),
          '"/>'
        );
        this.fill = origFill;
      }

      markup.push('</g>');

      return reviver ? reviver(markup.join('')) : markup.join('');
    },
    /* _TO_SVG_END_ */

    /**
     * Returns source of an image
     * @return {String} Source of an image
     */
    getSrc: function() {
      return this.getElement().src || this.getElement()._src;
    },

    /**
     * Returns string representation of an instance
     * @return {String} String representation of an instance
     */
    toString: function() {
      return '#<fabric.Image: { src: "' + this.getSrc() + '" }>';
    },

    /**
     * Returns a clone of an instance
     * @param {Function} callback Callback is invoked with a clone as a first argument
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     */
    clone: function(callback, propertiesToInclude) {
      this.constructor.fromObject(this.toObject(propertiesToInclude), callback);
    },

    /**
     * Applies filters assigned to this image (from "filters" array)
     * @mthod applyFilters
     * @param {Function} callback Callback is invoked when all filters have been applied and new image is generated
     * @return {fabric.Image} thisArg
     * @chainable
     */
    applyFilters: function(callback) {

      if (this.filters.length === 0) {
        this._element = this._originalElement;
        callback && callback();
        return;
      }

      var imgEl = this._originalElement,
        canvasEl = fabric.util.createCanvasElement(),
        replacement = fabric.util.createImage(),
        _this = this;

      canvasEl.width = imgEl.width;
      canvasEl.height = imgEl.height;

      canvasEl.getContext('2d').drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);

      this.filters.forEach(function(filter) {
        filter && filter.applyTo(canvasEl);
      });

      /** @ignore */

      replacement.width = imgEl.width;
      replacement.height = imgEl.height;

      if (fabric.isLikelyNode) {
        replacement.src = canvasEl.toBuffer(undefined, fabric.Image.pngCompression);

        // onload doesn't fire in some node versions, so we invoke callback manually
        _this._element = replacement;
        callback && callback();
      } else {
        replacement.onload = function() {
          _this._element = replacement;
          callback && callback();
          replacement.onload = canvasEl = imgEl = null;
        };
        replacement.src = canvasEl.toDataURL('image/png');
      }

      return this;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _render: function(ctx) {
      ctx.drawImage(
        this._element, -this.width / 2, -this.height / 2,
        this.width,
        this.height
      );
    },

    /**
     * @private
     */
    _resetWidthHeight: function() {
      var element = this.getElement();

      this.set('width', element.width);
      this.set('height', element.height);
    },

    /**
     * The Image class's initialization method. This method is automatically
     * called by the constructor.
     * @private
     * @param {HTMLImageElement|String} element The element representing the image
     */
    _initElement: function(element) {
      this.setElement(fabric.util.getById(element));
      fabric.util.addClass(this.getElement(), fabric.Image.CSS_CANVAS);
    },

    /**
     * @private
     * @param {Object} [options] Options object
     */
    _initConfig: function(options) {
      options || (options = {});
      this.setOptions(options);
      this._setWidthHeight(options);
      this._element.crossOrigin = this.crossOrigin;
    },

    /**
     * @private
     * @param {Object} object Object with filters property
     * @param {Function} callback Callback to invoke when all fabric.Image.filters instances are created
     */
    _initFilters: function(object, callback) {
      if (object.filters && object.filters.length) {
        fabric.util.enlivenObjects(object.filters, function(enlivenedObjects) {
          callback && callback(enlivenedObjects);
        }, 'fabric.Image.filters');
      } else {
        callback && callback();
      }
    },

    /**
     * @private
     * @param {Object} [options] Object with width/height properties
     */
    _setWidthHeight: function(options) {
      this.width = 'width' in options ? options.width : (this.getElement().width || 0);

      this.height = 'height' in options ? options.height : (this.getElement().height || 0);
    },

    /**
     * Returns complexity of an instance
     * @return {Number} complexity of this instance
     */
    complexity: function() {
      return 1;
    }
  });

  /**
   * Default CSS class name for canvas
   * @static
   * @type String
   * @default
   */
  fabric.Image.CSS_CANVAS = "canvas-img";

  /**
   * Alias for getSrc
   * @static
   */
  fabric.Image.prototype.getSvgSrc = fabric.Image.prototype.getSrc;

  /**
   * Creates an instance of fabric.Image from its object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @param {Function} [callback] Callback to invoke when an image instance is created
   */
  fabric.Image.fromObject = function(object, callback) {
    fabric.util.loadImage(object.src, function(img) {
      fabric.Image.prototype._initFilters.call(object, object, function(filters) {
        object.filters = filters || [];
        var instance = new fabric.Image(img, object);
        callback && callback(instance);
      });
    }, null, object.crossOrigin);
  };

  /**
   * Creates an instance of fabric.Image from an URL string
   * @static
   * @param {String} url URL to create an image from
   * @param {Function} [callback] Callback to invoke when image is created (newly created image is passed as a first argument)
   * @param {Object} [imgOptions] Options object
   */
  fabric.Image.fromURL = function(url, callback, imgOptions) {
    fabric.util.loadImage(url, function(img) {
      callback(new fabric.Image(img, imgOptions));
    }, null, imgOptions && imgOptions.crossOrigin);
  };

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by {@link fabric.Image.fromElement})
   * @static
   * @see {@link http://www.w3.org/TR/SVG/struct.html#ImageElement}
   */
  fabric.Image.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat('x y width height xlink:href'.split(' '));

  /**
   * Returns {@link fabric.Image} instance from an SVG element
   * @static
   * @param {SVGElement} element Element to parse
   * @param {Function} callback Callback to execute when fabric.Image object is created
   * @param {Object} [options] Options object
   * @return {fabric.Image} Instance of fabric.Image
   */
  fabric.Image.fromElement = function(element, callback, options) {
    var parsedAttributes = fabric.parseAttributes(element, fabric.Image.ATTRIBUTE_NAMES);

    fabric.Image.fromURL(parsedAttributes['xlink:href'], callback,
      extend((options ? fabric.util.object.clone(options) : {}), parsedAttributes));
  };
  /* _FROM_SVG_END_ */

  /**
   * Indicates that instances of this type are async
   * @static
   * @type Boolean
   * @default
   */
  fabric.Image.async = true;

  /**
   * Indicates compression level used when generating PNG under Node (in applyFilters). Any of 0-9
   * @static
   * @type Number
   * @default
   */
  fabric.Image.pngCompression = 1;

})(typeof exports !== 'undefined' ? exports : this);


fabric.util.object.extend(fabric.Object.prototype, /** @lends fabric.Object.prototype */ {

  /**
   * @private
   * @return {Number} angle value
   */
  _getAngleValueForStraighten: function() {
    var angle = this.getAngle() % 360;
    if (angle > 0) {
      return Math.round((angle - 1) / 90) * 90;
    }
    return Math.round(angle / 90) * 90;
  },

  /**
   * Straightens an object (rotating it from current angle to one of 0, 90, 180, 270, etc. depending on which is closer)
   * @return {fabric.Object} thisArg
   * @chainable
   */
  straighten: function() {
    this.setAngle(this._getAngleValueForStraighten());
    return this;
  },

  /**
   * Same as {@link fabric.Object.prototype.straighten} but with animation
   * @param {Object} callbacks Object with callback functions
   * @param {Function} [callbacks.onComplete] Invoked on completion
   * @param {Function} [callbacks.onChange] Invoked on every step of animation
   * @return {fabric.Object} thisArg
   * @chainable
   */
  fxStraighten: function(callbacks) {
    callbacks = callbacks || {};

    var empty = function() {},
      onComplete = callbacks.onComplete || empty,
      onChange = callbacks.onChange || empty,
      _this = this;

    fabric.util.animate({
      startValue: this.get('angle'),
      endValue: this._getAngleValueForStraighten(),
      duration: this.FX_DURATION,
      onChange: function(value) {
        _this.setAngle(value);
        onChange();
      },
      onComplete: function() {
        _this.setCoords();
        onComplete();
      },
      onStart: function() {
        _this.set('active', false);
      }
    });

    return this;
  }
});

fabric.util.object.extend(fabric.StaticCanvas.prototype, /** @lends fabric.StaticCanvas.prototype */ {

  /**
   * Straightens object, then rerenders canvas
   * @param {fabric.Object} object Object to straighten
   * @return {fabric.Canvas} thisArg
   * @chainable
   */
  straightenObject: function(object) {
    object.straighten();
    this.renderAll();
    return this;
  },

  /**
   * Same as {@link fabric.Canvas.prototype.straightenObject}, but animated
   * @param {fabric.Object} object Object to straighten
   * @return {fabric.Canvas} thisArg
   * @chainable
   */
  fxStraightenObject: function(object) {
    object.fxStraighten({
      onChange: this.renderAll.bind(this)
    });
    return this;
  }
});


/**
 * @namespace fabric.Image.filters
 * @memberOf fabric.Image
 * @tutorial {@link http://fabricjs.com/fabric-intro-part-2/#image_filters}
 * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
 */
fabric.Image.filters = fabric.Image.filters || {};


/**
 * Root filter class from which all filter classes inherit from
 * @class fabric.Image.filters.BaseFilter
 * @memberOf fabric.Image.filters
 */
fabric.Image.filters.BaseFilter = fabric.util.createClass( /** @lends fabric.Image.filters.BaseFilter.prototype */ {

  /**
   * Filter type
   * @param {String} type
   * @default
   */
  type: 'BaseFilter',

  /**
   * Returns object representation of an instance
   * @return {Object} Object representation of an instance
   */
  toObject: function() {
    return {
      type: this.type
    };
  },

  /**
   * Returns a JSON representation of an instance
   * @return {Object} JSON
   */
  toJSON: function() {
    // delegate, not alias
    return this.toObject();
  }
});


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend;

  /**
   * Brightness filter class
   * @class fabric.Image.filters.Brightness
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link fabric.Image.filters.Brightness#initialize} for constructor definition
   * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
   * @example
   * var filter = new fabric.Image.filters.Brightness({
   *   brightness: 200
   * });
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   */
  fabric.Image.filters.Brightness = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.Brightness.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Brightness',

    /**
     * Constructor
     * @memberOf fabric.Image.filters.Brightness.prototype
     * @param {Object} [options] Options object
     * @param {Number} [options.brightness=100] Value to brighten the image up (0..255)
     */
    initialize: function(options) {
      options = options || {};
      this.brightness = options.brightness || 100;
    },

    /**
     * Applies filter to canvas element
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        brightness = this.brightness;

      for (var i = 0, len = data.length; i < len; i += 4) {
        data[i] += brightness;
        data[i + 1] += brightness;
        data[i + 2] += brightness;
      }

      context.putImageData(imageData, 0, 0);
    },

    /**
     * Returns object representation of an instance
     * @return {Object} Object representation of an instance
     */
    toObject: function() {
      return extend(this.callSuper('toObject'), {
        brightness: this.brightness
      });
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @return {fabric.Image.filters.Brightness} Instance of fabric.Image.filters.Brightness
   */
  fabric.Image.filters.Brightness.fromObject = function(object) {
    return new fabric.Image.filters.Brightness(object);
  };

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend;

  /**
   * Adapted from <a href="http://www.html5rocks.com/en/tutorials/canvas/imagefilters/">html5rocks article</a>
   * @class fabric.Image.filters.Convolute
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link fabric.Image.filters.Convolute#initialize} for constructor definition
   * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
   * @example <caption>Sharpen filter</caption>
   * var filter = new fabric.Image.filters.Convolute({
   *   matrix: [ 0, -1,  0,
   *            -1,  5, -1,
   *             0, -1,  0 ]
   * });
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   * @example <caption>Blur filter</caption>
   * var filter = new fabric.Image.filters.Convolute({
   *   matrix: [ 1/9, 1/9, 1/9,
   *             1/9, 1/9, 1/9,
   *             1/9, 1/9, 1/9 ]
   * });
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   * @example <caption>Emboss filter</caption>
   * var filter = new fabric.Image.filters.Convolute({
   *   matrix: [ 1,   1,  1,
   *             1, 0.7, -1,
   *            -1,  -1, -1 ]
   * });
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   * @example <caption>Emboss filter with opaqueness</caption>
   * var filter = new fabric.Image.filters.Convolute({
   *   opaque: true,
   *   matrix: [ 1,   1,  1,
   *             1, 0.7, -1,
   *            -1,  -1, -1 ]
   * });
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   */
  fabric.Image.filters.Convolute = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.Convolute.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Convolute',

    /**
     * Constructor
     * @memberOf fabric.Image.filters.Convolute.prototype
     * @param {Object} [options] Options object
     * @param {Boolean} [options.opaque=false] Opaque value (true/false)
     * @param {Array} [options.matrix] Filter matrix
     */
    initialize: function(options) {
      options = options || {};

      this.opaque = options.opaque;
      this.matrix = options.matrix || [0, 0, 0,
        0, 1, 0,
        0, 0, 0
      ];

      var canvasEl = fabric.util.createCanvasElement();
      this.tmpCtx = canvasEl.getContext('2d');
    },

    /**
     * @private
     */
    _createImageData: function(w, h) {
      return this.tmpCtx.createImageData(w, h);
    },

    /**
     * Applies filter to canvas element
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {

      var weights = this.matrix,
        context = canvasEl.getContext('2d'),
        pixels = context.getImageData(0, 0, canvasEl.width, canvasEl.height),

        side = Math.round(Math.sqrt(weights.length)),
        halfSide = Math.floor(side / 2),
        src = pixels.data,
        sw = pixels.width,
        sh = pixels.height;

      // pad output by the convolution matrix
      var w = sw;
      var h = sh;
      var output = this._createImageData(w, h);

      var dst = output.data;

      // go through the destination image pixels
      var alphaFac = this.opaque ? 1 : 0;

      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var sy = y;
          var sx = x;
          var dstOff = (y * w + x) * 4;
          // calculate the weighed sum of the source image pixels that
          // fall under the convolution matrix
          var r = 0,
            g = 0,
            b = 0,
            a = 0;

          for (var cy = 0; cy < side; cy++) {
            for (var cx = 0; cx < side; cx++) {

              var scy = sy + cy - halfSide;
              var scx = sx + cx - halfSide;

              /* jshint maxdepth:5 */
              if (scy < 0 || scy > sh || scx < 0 || scx > sw) continue;

              var srcOff = (scy * sw + scx) * 4;
              var wt = weights[cy * side + cx];

              r += src[srcOff] * wt;
              g += src[srcOff + 1] * wt;
              b += src[srcOff + 2] * wt;
              a += src[srcOff + 3] * wt;
            }
          }
          dst[dstOff] = r;
          dst[dstOff + 1] = g;
          dst[dstOff + 2] = b;
          dst[dstOff + 3] = a + alphaFac * (255 - a);
        }
      }

      context.putImageData(output, 0, 0);
    },

    /**
     * Returns object representation of an instance
     * @return {Object} Object representation of an instance
     */
    toObject: function() {
      return extend(this.callSuper('toObject'), {
        opaque: this.opaque,
        matrix: this.matrix
      });
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @return {fabric.Image.filters.Convolute} Instance of fabric.Image.filters.Convolute
   */
  fabric.Image.filters.Convolute.fromObject = function(object) {
    return new fabric.Image.filters.Convolute(object);
  };

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend;

  /**
   * GradientTransparency filter class
   * @class fabric.Image.filters.GradientTransparency
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link fabric.Image.filters.GradientTransparency#initialize} for constructor definition
   * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
   * @example
   * var filter = new fabric.Image.filters.GradientTransparency({
   *   threshold: 200
   * });
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   */
  fabric.Image.filters.GradientTransparency = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.GradientTransparency.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'GradientTransparency',

    /**
     * Constructor
     * @memberOf fabric.Image.filters.GradientTransparency.prototype
     * @param {Object} [options] Options object
     * @param {Number} [options.threshold=100] Threshold value
     */
    initialize: function(options) {
      options = options || {};
      this.threshold = options.threshold || 100;
    },

    /**
     * Applies filter to canvas element
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        threshold = this.threshold,
        total = data.length;

      for (var i = 0, len = data.length; i < len; i += 4) {
        data[i + 3] = threshold + 255 * (total - i) / total;
      }

      context.putImageData(imageData, 0, 0);
    },

    /**
     * Returns object representation of an instance
     * @return {Object} Object representation of an instance
     */
    toObject: function() {
      return extend(this.callSuper('toObject'), {
        threshold: this.threshold
      });
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @return {fabric.Image.filters.GradientTransparency} Instance of fabric.Image.filters.GradientTransparency
   */
  fabric.Image.filters.GradientTransparency.fromObject = function(object) {
    return new fabric.Image.filters.GradientTransparency(object);
  };

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {});

  /**
   * Grayscale image filter class
   * @class fabric.Image.filters.Grayscale
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
   * @example
   * var filter = new fabric.Image.filters.Grayscale();
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   */
  fabric.Image.filters.Grayscale = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.Grayscale.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Grayscale',

    /**
     * Applies filter to canvas element
     * @memberOf fabric.Image.filters.Grayscale.prototype
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        len = imageData.width * imageData.height * 4,
        index = 0,
        average;

      while (index < len) {
        average = (data[index] + data[index + 1] + data[index + 2]) / 3;
        data[index] = average;
        data[index + 1] = average;
        data[index + 2] = average;
        index += 4;
      }

      context.putImageData(imageData, 0, 0);
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @return {fabric.Image.filters.Grayscale} Instance of fabric.Image.filters.Grayscale
   */
  fabric.Image.filters.Grayscale.fromObject = function() {
    return new fabric.Image.filters.Grayscale();
  };

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {});

  /**
   * Invert filter class
   * @class fabric.Image.filters.Invert
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
   * @example
   * var filter = new fabric.Image.filters.Invert();
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   */
  fabric.Image.filters.Invert = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.Invert.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Invert',

    /**
     * Applies filter to canvas element
     * @memberOf fabric.Image.filters.Invert.prototype
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        iLen = data.length,
        i;

      for (i = 0; i < iLen; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }

      context.putImageData(imageData, 0, 0);
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @return {fabric.Image.filters.Invert} Instance of fabric.Image.filters.Invert
   */
  fabric.Image.filters.Invert.fromObject = function() {
    return new fabric.Image.filters.Invert();
  };

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend;

  /**
   * Mask filter class
   * See http://resources.aleph-1.com/mask/
   * @class fabric.Image.filters.Mask
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link fabric.Image.filters.Mask#initialize} for constructor definition
   */
  fabric.Image.filters.Mask = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.Mask.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Mask',

    /**
     * Constructor
     * @memberOf fabric.Image.filters.Mask.prototype
     * @param {Object} [options] Options object
     * @param {fabric.Image} [options.mask] Mask image object
     * @param {Number} [options.channel=0] Rgb channel (0, 1, 2 or 3)
     */
    initialize: function(options) {
      options = options || {};

      this.mask = options.mask;
      this.channel = [0, 1, 2, 3].indexOf(options.channel) > -1 ? options.channel : 0;
    },

    /**
     * Applies filter to canvas element
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {
      if (!this.mask) return;

      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        maskEl = this.mask.getElement(),
        maskCanvasEl = fabric.util.createCanvasElement(),
        channel = this.channel,
        i,
        iLen = imageData.width * imageData.height * 4;

      maskCanvasEl.width = maskEl.width;
      maskCanvasEl.height = maskEl.height;

      maskCanvasEl.getContext('2d').drawImage(maskEl, 0, 0, maskEl.width, maskEl.height);

      var maskImageData = maskCanvasEl.getContext('2d').getImageData(0, 0, maskEl.width, maskEl.height),
        maskData = maskImageData.data;

      for (i = 0; i < iLen; i += 4) {
        data[i + 3] = maskData[i + channel];
      }

      context.putImageData(imageData, 0, 0);
    },

    /**
     * Returns object representation of an instance
     * @return {Object} Object representation of an instance
     */
    toObject: function() {
      return extend(this.callSuper('toObject'), {
        mask: this.mask.toObject(),
        channel: this.channel
      });
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @param {Function} [callback] Callback to invoke when a mask filter instance is created
   */
  fabric.Image.filters.Mask.fromObject = function(object, callback) {
    fabric.util.loadImage(object.mask.src, function(img) {
      object.mask = new fabric.Image(img, object.mask);
      callback && callback(new fabric.Image.filters.Mask(object));
    });
  };

  /**
   * Indicates that instances of this type are async
   * @static
   * @type Boolean
   * @default
   */
  fabric.Image.filters.Mask.async = true;

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend;

  /**
   * Noise filter class
   * @class fabric.Image.filters.Noise
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link fabric.Image.filters.Noise#initialize} for constructor definition
   * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
   * @example
   * var filter = new fabric.Image.filters.Noise({
   *   noise: 700
   * });
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   */
  fabric.Image.filters.Noise = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.Noise.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Noise',

    /**
     * Constructor
     * @memberOf fabric.Image.filters.Noise.prototype
     * @param {Object} [options] Options object
     * @param {Number} [options.noise=100] Noise value
     */
    initialize: function(options) {
      options = options || {};
      this.noise = options.noise || 100;
    },

    /**
     * Applies filter to canvas element
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        noise = this.noise,
        rand;

      for (var i = 0, len = data.length; i < len; i += 4) {

        rand = (0.5 - Math.random()) * noise;

        data[i] += rand;
        data[i + 1] += rand;
        data[i + 2] += rand;
      }

      context.putImageData(imageData, 0, 0);
    },

    /**
     * Returns object representation of an instance
     * @return {Object} Object representation of an instance
     */
    toObject: function() {
      return extend(this.callSuper('toObject'), {
        noise: this.noise
      });
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @return {fabric.Image.filters.Noise} Instance of fabric.Image.filters.Noise
   */
  fabric.Image.filters.Noise.fromObject = function(object) {
    return new fabric.Image.filters.Noise(object);
  };

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend;

  /**
   * Pixelate filter class
   * @class fabric.Image.filters.Pixelate
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link fabric.Image.filters.Pixelate#initialize} for constructor definition
   * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
   * @example
   * var filter = new fabric.Image.filters.Pixelate({
   *   blocksize: 8
   * });
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   */
  fabric.Image.filters.Pixelate = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.Pixelate.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Pixelate',

    /**
     * Constructor
     * @memberOf fabric.Image.filters.Pixelate.prototype
     * @param {Object} [options] Options object
     * @param {Number} [options.blocksize=4] Blocksize for pixelate
     */
    initialize: function(options) {
      options = options || {};
      this.blocksize = options.blocksize || 4;
    },

    /**
     * Applies filter to canvas element
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        iLen = imageData.height,
        jLen = imageData.width,
        index, i, j, r, g, b, a;

      for (i = 0; i < iLen; i += this.blocksize) {
        for (j = 0; j < jLen; j += this.blocksize) {

          index = (i * 4) * jLen + (j * 4);

          r = data[index];
          g = data[index + 1];
          b = data[index + 2];
          a = data[index + 3];

          /*
           blocksize: 4

           [1,x,x,x,1]
           [x,x,x,x,1]
           [x,x,x,x,1]
           [x,x,x,x,1]
           [1,1,1,1,1]
           */

          for (var _i = i, _ilen = i + this.blocksize; _i < _ilen; _i++) {
            for (var _j = j, _jlen = j + this.blocksize; _j < _jlen; _j++) {
              index = (_i * 4) * jLen + (_j * 4);
              data[index] = r;
              data[index + 1] = g;
              data[index + 2] = b;
              data[index + 3] = a;
            }
          }
        }
      }

      context.putImageData(imageData, 0, 0);
    },

    /**
     * Returns object representation of an instance
     * @return {Object} Object representation of an instance
     */
    toObject: function() {
      return extend(this.callSuper('toObject'), {
        blocksize: this.blocksize
      });
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @return {fabric.Image.filters.Pixelate} Instance of fabric.Image.filters.Pixelate
   */
  fabric.Image.filters.Pixelate.fromObject = function(object) {
    return new fabric.Image.filters.Pixelate(object);
  };

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend;

  /**
   * Remove white filter class
   * @class fabric.Image.filters.RemoveWhite
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link fabric.Image.filters.RemoveWhite#initialize} for constructor definition
   * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
   * @example
   * var filter = new fabric.Image.filters.RemoveWhite({
   *   threshold: 40,
   *   distance: 140
   * });
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   */
  fabric.Image.filters.RemoveWhite = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.RemoveWhite.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'RemoveWhite',

    /**
     * Constructor
     * @memberOf fabric.Image.filters.RemoveWhite.prototype
     * @param {Object} [options] Options object
     * @param {Number} [options.threshold=30] Threshold value
     * @param {Number} [options.distance=20] Distance value
     */
    initialize: function(options) {
      options = options || {};
      this.threshold = options.threshold || 30;
      this.distance = options.distance || 20;
    },

    /**
     * Applies filter to canvas element
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        threshold = this.threshold,
        distance = this.distance,
        limit = 255 - threshold,
        abs = Math.abs,
        r, g, b;

      for (var i = 0, len = data.length; i < len; i += 4) {
        r = data[i];
        g = data[i + 1];
        b = data[i + 2];

        if (r > limit &&
          g > limit &&
          b > limit &&
          abs(r - g) < distance &&
          abs(r - b) < distance &&
          abs(g - b) < distance
        ) {
          data[i + 3] = 1;
        }
      }

      context.putImageData(imageData, 0, 0);
    },

    /**
     * Returns object representation of an instance
     * @return {Object} Object representation of an instance
     */
    toObject: function() {
      return extend(this.callSuper('toObject'), {
        threshold: this.threshold,
        distance: this.distance
      });
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @return {fabric.Image.filters.RemoveWhite} Instance of fabric.Image.filters.RemoveWhite
   */
  fabric.Image.filters.RemoveWhite.fromObject = function(object) {
    return new fabric.Image.filters.RemoveWhite(object);
  };

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {});

  /**
   * Sepia filter class
   * @class fabric.Image.filters.Sepia
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
   * @example
   * var filter = new fabric.Image.filters.Sepia();
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   */
  fabric.Image.filters.Sepia = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.Sepia.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Sepia',

    /**
     * Applies filter to canvas element
     * @memberOf fabric.Image.filters.Sepia.prototype
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        iLen = data.length,
        i, avg;

      for (i = 0; i < iLen; i += 4) {
        avg = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
        data[i] = avg + 100;
        data[i + 1] = avg + 50;
        data[i + 2] = avg + 255;
      }

      context.putImageData(imageData, 0, 0);
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @return {fabric.Image.filters.Sepia} Instance of fabric.Image.filters.Sepia
   */
  fabric.Image.filters.Sepia.fromObject = function() {
    return new fabric.Image.filters.Sepia();
  };

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {});

  /**
   * Sepia2 filter class
   * @class fabric.Image.filters.Sepia2
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
   * @example
   * var filter = new fabric.Image.filters.Sepia2();
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   */
  fabric.Image.filters.Sepia2 = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.Sepia2.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Sepia2',

    /**
     * Applies filter to canvas element
     * @memberOf fabric.Image.filters.Sepia.prototype
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        iLen = data.length,
        i, r, g, b;

      for (i = 0; i < iLen; i += 4) {
        r = data[i];
        g = data[i + 1];
        b = data[i + 2];

        data[i] = (r * 0.393 + g * 0.769 + b * 0.189) / 1.351;
        data[i + 1] = (r * 0.349 + g * 0.686 + b * 0.168) / 1.203;
        data[i + 2] = (r * 0.272 + g * 0.534 + b * 0.131) / 2.140;
      }

      context.putImageData(imageData, 0, 0);
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @return {fabric.Image.filters.Sepia2} Instance of fabric.Image.filters.Sepia2
   */
  fabric.Image.filters.Sepia2.fromObject = function() {
    return new fabric.Image.filters.Sepia2();
  };

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend;

  /**
   * Tint filter class
   * Adapted from <a href="https://github.com/mezzoblue/PaintbrushJS">https://github.com/mezzoblue/PaintbrushJS</a>
   * @class fabric.Image.filters.Tint
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link fabric.Image.filters.Tint#initialize} for constructor definition
   * @see {@link http://fabricjs.com/image-filters/|ImageFilters demo}
   * @example <caption>Tint filter with hex color and opacity</caption>
   * var filter = new fabric.Image.filters.Tint({
   *   color: '#3513B0',
   *   opacity: 0.5
   * });
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   * @example <caption>Tint filter with rgba color</caption>
   * var filter = new fabric.Image.filters.Tint({
   *   color: 'rgba(53, 21, 176, 0.5)'
   * });
   * object.filters.push(filter);
   * object.applyFilters(canvas.renderAll.bind(canvas));
   */
  fabric.Image.filters.Tint = fabric.util.createClass(fabric.Image.filters.BaseFilter, /** @lends fabric.Image.filters.Tint.prototype */ {

    /**
     * Filter type
     * @param {String} type
     * @default
     */
    type: 'Tint',

    /**
     * Constructor
     * @memberOf fabric.Image.filters.Tint.prototype
     * @param {Object} [options] Options object
     * @param {String} [options.color=#000000] Color to tint the image with
     * @param {Number} [options.opacity] Opacity value that controls the tint effect's transparency (0..1)
     */
    initialize: function(options) {
      options = options || {};

      this.color = options.color || '#000000';
      this.opacity = typeof options.opacity !== 'undefined' ? options.opacity : new fabric.Color(this.color).getAlpha();
    },

    /**
     * Applies filter to canvas element
     * @param {Object} canvasEl Canvas element to apply filter to
     */
    applyTo: function(canvasEl) {
      var context = canvasEl.getContext('2d'),
        imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height),
        data = imageData.data,
        iLen = data.length,
        i,
        tintR, tintG, tintB,
        r, g, b, alpha1,
        source;

      source = new fabric.Color(this.color).getSource();

      tintR = source[0] * this.opacity;
      tintG = source[1] * this.opacity;
      tintB = source[2] * this.opacity;

      alpha1 = 1 - this.opacity;

      for (i = 0; i < iLen; i += 4) {
        r = data[i];
        g = data[i + 1];
        b = data[i + 2];

        // alpha compositing
        data[i] = tintR + r * alpha1;
        data[i + 1] = tintG + g * alpha1;
        data[i + 2] = tintB + b * alpha1;
      }

      context.putImageData(imageData, 0, 0);
    },

    /**
     * Returns object representation of an instance
     * @return {Object} Object representation of an instance
     */
    toObject: function() {
      return extend(this.callSuper('toObject'), {
        color: this.color,
        opacity: this.opacity
      });
    }
  });

  /**
   * Returns filter instance from an object representation
   * @static
   * @param {Object} object Object to create an instance from
   * @return {fabric.Image.filters.Tint} Instance of fabric.Image.filters.Tint
   */
  fabric.Image.filters.Tint.fromObject = function(object) {
    return new fabric.Image.filters.Tint(object);
  };

})(typeof exports !== 'undefined' ? exports : this);


(function(global) {

  "use strict";

  var fabric = global.fabric || (global.fabric = {}),
    extend = fabric.util.object.extend,
    clone = fabric.util.object.clone,
    toFixed = fabric.util.toFixed,
    supportsLineDash = fabric.StaticCanvas.supports('setLineDash');

  if (fabric.Text) {
    fabric.warn('fabric.Text is already defined');
    return;
  }

  var stateProperties = fabric.Object.prototype.stateProperties.concat();
  stateProperties.push(
    'fontFamily',
    'fontWeight',
    'fontSize',
    'text',
    'textDecoration',
    'textAlign',
    'fontStyle',
    'lineHeight',
    'textBackgroundColor',
    'useNative',
    'path'
  );

  /**
   * Text class
   * @class fabric.Text
   * @extends fabric.Object
   * @return {fabric.Text} thisArg
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-2/#text}
   * @see {@link fabric.Text#initialize} for constructor definition
   */
  fabric.Text = fabric.util.createClass(fabric.Object, /** @lends fabric.Text.prototype */ {

    /**
     * Properties which when set cause object to change dimensions
     * @type Object
     * @private
     */
    _dimensionAffectingProps: {
      fontSize: true,
      fontWeight: true,
      fontFamily: true,
      textDecoration: true,
      fontStyle: true,
      lineHeight: true,
      stroke: true,
      strokeWidth: true,
      text: true
    },

    /**
     * @private
     */
    _reNewline: /\r?\n/,

    /**
     * Retrieves object's fontSize
     * @method getFontSize
     * @memberOf fabric.Text.prototype
     * @return {String} Font size (in pixels)
     */

    /**
     * Sets object's fontSize
     * @method setFontSize
     * @memberOf fabric.Text.prototype
     * @param {Number} fontSize Font size (in pixels)
     * @return {fabric.Text}
     * @chainable
     */

    /**
     * Retrieves object's fontWeight
     * @method getFontWeight
     * @memberOf fabric.Text.prototype
     * @return {(String|Number)} Font weight
     */

    /**
     * Sets object's fontWeight
     * @method setFontWeight
     * @memberOf fabric.Text.prototype
     * @param {(Number|String)} fontWeight Font weight
     * @return {fabric.Text}
     * @chainable
     */

    /**
     * Retrieves object's fontFamily
     * @method getFontFamily
     * @memberOf fabric.Text.prototype
     * @return {String} Font family
     */

    /**
     * Sets object's fontFamily
     * @method setFontFamily
     * @memberOf fabric.Text.prototype
     * @param {String} fontFamily Font family
     * @return {fabric.Text}
     * @chainable
     */

    /**
     * Retrieves object's text
     * @method getText
     * @memberOf fabric.Text.prototype
     * @return {String} text
     */

    /**
     * Sets object's text
     * @method setText
     * @memberOf fabric.Text.prototype
     * @param {String} text Text
     * @return {fabric.Text}
     * @chainable
     */

    /**
     * Retrieves object's textDecoration
     * @method getTextDecoration
     * @memberOf fabric.Text.prototype
     * @return {String} Text decoration
     */

    /**
     * Sets object's textDecoration
     * @method setTextDecoration
     * @memberOf fabric.Text.prototype
     * @param {String} textDecoration Text decoration
     * @return {fabric.Text}
     * @chainable
     */

    /**
     * Retrieves object's fontStyle
     * @method getFontStyle
     * @memberOf fabric.Text.prototype
     * @return {String} Font style
     */

    /**
     * Sets object's fontStyle
     * @method setFontStyle
     * @memberOf fabric.Text.prototype
     * @param {String} fontStyle Font style
     * @return {fabric.Text}
     * @chainable
     */

    /**
     * Retrieves object's lineHeight
     * @method getLineHeight
     * @memberOf fabric.Text.prototype
     * @return {Number} Line height
     */

    /**
     * Sets object's lineHeight
     * @method setLineHeight
     * @memberOf fabric.Text.prototype
     * @param {Number} lineHeight Line height
     * @return {fabric.Text}
     * @chainable
     */

    /**
     * Retrieves object's textAlign
     * @method getTextAlign
     * @memberOf fabric.Text.prototype
     * @return {String} Text alignment
     */

    /**
     * Sets object's textAlign
     * @method setTextAlign
     * @memberOf fabric.Text.prototype
     * @param {String} textAlign Text alignment
     * @return {fabric.Text}
     * @chainable
     */

    /**
     * Retrieves object's textBackgroundColor
     * @method getTextBackgroundColor
     * @memberOf fabric.Text.prototype
     * @return {String} Text background color
     */

    /**
     * Sets object's textBackgroundColor
     * @method setTextBackgroundColor
     * @memberOf fabric.Text.prototype
     * @param {String} textBackgroundColor Text background color
     * @return {fabric.Text}
     * @chainable
     */

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'text',

    /**
     * Font size (in pixels)
     * @type Number
     * @default
     */
    fontSize: 40,

    /**
     * Font weight (e.g. bold, normal, 400, 600, 800)
     * @type {(Number|String)}
     * @default
     */
    fontWeight: 'normal',

    /**
     * Font family
     * @type String
     * @default
     */
    fontFamily: 'Times New Roman',

    /**
     * Text decoration Possible values: "", "underline", "overline" or "line-through".
     * @type String
     * @default
     */
    textDecoration: '',

    /**
     * Text alignment. Possible values: "left", "center", or "right".
     * @type String
     * @default
     */
    textAlign: 'left',

    /**
     * Font style . Possible values: "", "normal", "italic" or "oblique".
     * @type String
     * @default
     */
    fontStyle: '',

    /**
     * Line height
     * @type Number
     * @default
     */
    lineHeight: 1.3,

    /**
     * Background color of text lines
     * @type String
     * @default
     */
    textBackgroundColor: '',

    /**
     * URL of a font file, when using Cufon
     * @type String | null
     * @default
     */
    path: null,

    /**
     * Indicates whether canvas native text methods should be used to render text (otherwise, Cufon is used)
     * @type Boolean
     * @default
     */
    useNative: true,

    /**
     * List of properties to consider when checking if
     * state of an object is changed ({@link fabric.Object#hasStateChanged})
     * as well as for history (undo/redo) purposes
     * @type Array
     */
    stateProperties: stateProperties,

    /**
     * When defined, an object is rendered via stroke and this property specifies its color.
     * <b>Backwards incompatibility note:</b> This property was named "strokeStyle" until v1.1.6
     * @type String
     * @default
     */
    stroke: null,

    /**
     * Shadow object representing shadow of this shape.
     * <b>Backwards incompatibility note:</b> This property was named "textShadow" (String) until v1.2.11
     * @type fabric.Shadow
     * @default
     */
    shadow: null,

    /**
     * Constructor
     * @param {String} text Text string
     * @param {Object} [options] Options object
     * @return {fabric.Text} thisArg
     */
    initialize: function(text, options) {
      options = options || {};

      this.text = text;
      this.__skipDimension = true;
      this.setOptions(options);
      this.__skipDimension = false;
      this._initDimensions();
      this.setCoords();
    },

    /**
     * Renders text object on offscreen canvas, so that it would get dimensions
     * @private
     */
    _initDimensions: function() {
      if (this.__skipDimension) return;
      var canvasEl = fabric.util.createCanvasElement();
      this._render(canvasEl.getContext('2d'));
    },

    /**
     * Returns string representation of an instance
     * @return {String} String representation of text object
     */
    toString: function() {
      return '#<fabric.Text (' + this.complexity() +
        '): { "text": "' + this.text + '", "fontFamily": "' + this.fontFamily + '" }>';
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _render: function(ctx) {

      var isInPathGroup = this.group && this.group.type === 'path-group';
      if (isInPathGroup && !this.transformMatrix) {
        ctx.translate(-this.group.width / 2 + this.left, -this.group.height / 2 + this.top);
      } else if (isInPathGroup && this.transformMatrix) {
        ctx.translate(-this.group.width / 2, -this.group.height / 2);
      }

      if (typeof Cufon === 'undefined' || this.useNative === true) {
        this._renderViaNative(ctx);
      } else {
        this._renderViaCufon(ctx);
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderViaNative: function(ctx) {
      var textLines = this.text.split(this._reNewline);

      this.transform(ctx, fabric.isLikelyNode);

      this._setTextStyles(ctx);

      this.width = this._getTextWidth(ctx, textLines);
      this.height = this._getTextHeight(ctx, textLines);

      this.clipTo && fabric.util.clipContext(this, ctx);

      this._renderTextBackground(ctx, textLines);
      this._translateForTextAlign(ctx);
      this._renderText(ctx, textLines);

      if (this.textAlign !== 'left' && this.textAlign !== 'justify') {
        ctx.restore();
      }

      this._renderTextDecoration(ctx, textLines);
      this.clipTo && ctx.restore();

      this._setBoundaries(ctx, textLines);
      this._totalLineHeight = 0;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderText: function(ctx, textLines) {
      ctx.save();
      this._setShadow(ctx);
      this._renderTextFill(ctx, textLines);
      this._renderTextStroke(ctx, textLines);
      this._removeShadow(ctx);
      ctx.restore();
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _translateForTextAlign: function(ctx) {
      if (this.textAlign !== 'left' && this.textAlign !== 'justify') {
        ctx.save();
        ctx.translate(this.textAlign === 'center' ? (this.width / 2) : this.width, 0);
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Array} textLines Array of all text lines
     */
    _setBoundaries: function(ctx, textLines) {
      this._boundaries = [];

      for (var i = 0, len = textLines.length; i < len; i++) {

        var lineWidth = this._getLineWidth(ctx, textLines[i]);
        var lineLeftOffset = this._getLineLeftOffset(lineWidth);

        this._boundaries.push({
          height: this.fontSize * this.lineHeight,
          width: lineWidth,
          left: lineLeftOffset
        });
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _setTextStyles: function(ctx) {
      this._setFillStyles(ctx);
      this._setStrokeStyles(ctx);
      ctx.textBaseline = 'alphabetic';
      if (!this.skipTextAlign) {
        ctx.textAlign = this.textAlign;
      }
      ctx.font = this._getFontDeclaration();
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Array} textLines Array of all text lines
     * @return {Number} Height of fabric.Text object
     */
    _getTextHeight: function(ctx, textLines) {
      return this.fontSize * textLines.length * this.lineHeight;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Array} textLines Array of all text lines
     * @return {Number} Maximum width of fabric.Text object
     */
    _getTextWidth: function(ctx, textLines) {
      var maxWidth = ctx.measureText(textLines[0] || '|').width;

      for (var i = 1, len = textLines.length; i < len; i++) {
        var currentLineWidth = ctx.measureText(textLines[i]).width;
        if (currentLineWidth > maxWidth) {
          maxWidth = currentLineWidth;
        }
      }
      return maxWidth;
    },

    /**
     * @private
     * @param {String} method Method name ("fillText" or "strokeText")
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {String} line Chars to render
     * @param {Number} left Left position of text
     * @param {Number} top Top position of text
     */
    _renderChars: function(method, ctx, chars, left, top) {
      ctx[method](chars, left, top);
    },

    /**
     * @private
     * @param {String} method Method name ("fillText" or "strokeText")
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {String} line Text to render
     * @param {Number} left Left position of text
     * @param {Number} top Top position of text
     * @param {Number} lineIndex Index of a line in a text
     */
    _renderTextLine: function(method, ctx, line, left, top, lineIndex) {
      // lift the line by quarter of fontSize
      top -= this.fontSize / 4;

      // short-circuit
      if (this.textAlign !== 'justify') {
        this._renderChars(method, ctx, line, left, top, lineIndex);
        return;
      }

      var lineWidth = ctx.measureText(line).width;
      var totalWidth = this.width;

      if (totalWidth > lineWidth) {
        // stretch the line
        var words = line.split(/\s+/);
        var wordsWidth = ctx.measureText(line.replace(/\s+/g, '')).width;
        var widthDiff = totalWidth - wordsWidth;
        var numSpaces = words.length - 1;
        var spaceWidth = widthDiff / numSpaces;

        var leftOffset = 0;
        for (var i = 0, len = words.length; i < len; i++) {
          this._renderChars(method, ctx, words[i], left + leftOffset, top, lineIndex);
          leftOffset += ctx.measureText(words[i]).width + spaceWidth;
        }
      } else {
        this._renderChars(method, ctx, line, left, top, lineIndex);
      }
    },

    /**
     * @private
     * @return {Number} Left offset
     */
    _getLeftOffset: function() {
      if (fabric.isLikelyNode) {
        return 0;
      }
      return -this.width / 2;
    },

    /**
     * @private
     * @return {Number} Top offset
     */
    _getTopOffset: function() {
      return -this.height / 2;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Array} textLines Array of all text lines
     */
    _renderTextFill: function(ctx, textLines) {
      if (!this.fill && !this._skipFillStrokeCheck) return;

      this._boundaries = [];
      var lineHeights = 0;

      for (var i = 0, len = textLines.length; i < len; i++) {
        var heightOfLine = this._getHeightOfLine(ctx, i, textLines);
        lineHeights += heightOfLine;

        this._renderTextLine(
          'fillText',
          ctx,
          textLines[i],
          this._getLeftOffset(),
          this._getTopOffset() + lineHeights,
          i
        );
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Array} textLines Array of all text lines
     */
    _renderTextStroke: function(ctx, textLines) {
      if (!this.stroke && !this._skipFillStrokeCheck) return;

      var lineHeights = 0;

      ctx.save();
      if (this.strokeDashArray) {
        // Spec requires the concatenation of two copies the dash list when the number of elements is odd
        if (1 & this.strokeDashArray.length) {
          this.strokeDashArray.push.apply(this.strokeDashArray, this.strokeDashArray);
        }
        supportsLineDash && ctx.setLineDash(this.strokeDashArray);
      }

      ctx.beginPath();
      for (var i = 0, len = textLines.length; i < len; i++) {
        var heightOfLine = this._getHeightOfLine(ctx, i, textLines);
        lineHeights += heightOfLine;

        this._renderTextLine(
          'strokeText',
          ctx,
          textLines[i],
          this._getLeftOffset(),
          this._getTopOffset() + lineHeights,
          i
        );
      }
      ctx.closePath();
      ctx.restore();
    },

    _getHeightOfLine: function() {
      return this.fontSize * this.lineHeight;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Array} textLines Array of all text lines
     */
    _renderTextBackground: function(ctx, textLines) {
      this._renderTextBoxBackground(ctx);
      this._renderTextLinesBackground(ctx, textLines);
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderTextBoxBackground: function(ctx) {
      if (!this.backgroundColor) return;

      ctx.save();
      ctx.fillStyle = this.backgroundColor;

      ctx.fillRect(
        this._getLeftOffset(),
        this._getTopOffset(),
        this.width,
        this.height
      );

      ctx.restore();
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Array} textLines Array of all text lines
     */
    _renderTextLinesBackground: function(ctx, textLines) {
      if (!this.textBackgroundColor) return;

      ctx.save();
      ctx.fillStyle = this.textBackgroundColor;

      for (var i = 0, len = textLines.length; i < len; i++) {

        if (textLines[i] !== '') {

          var lineWidth = this._getLineWidth(ctx, textLines[i]);
          var lineLeftOffset = this._getLineLeftOffset(lineWidth);

          ctx.fillRect(
            this._getLeftOffset() + lineLeftOffset,
            this._getTopOffset() + (i * this.fontSize * this.lineHeight),
            lineWidth,
            this.fontSize * this.lineHeight
          );
        }
      }
      ctx.restore();
    },

    /**
     * @private
     * @param {Number} lineWidth Width of text line
     * @return {Number} Line left offset
     */
    _getLineLeftOffset: function(lineWidth) {
      if (this.textAlign === 'center') {
        return (this.width - lineWidth) / 2;
      }
      if (this.textAlign === 'right') {
        return this.width - lineWidth;
      }
      return 0;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {String} line Text line
     * @return {Number} Line width
     */
    _getLineWidth: function(ctx, line) {
      return this.textAlign === 'justify' ? this.width : ctx.measureText(line).width;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Array} textLines Array of all text lines
     */
    _renderTextDecoration: function(ctx, textLines) {
      if (!this.textDecoration) return;

      // var halfOfVerticalBox = this.originY === 'top' ? 0 : this._getTextHeight(ctx, textLines) / 2;
      var halfOfVerticalBox = this._getTextHeight(ctx, textLines) / 2;
      var _this = this;

      /** @ignore */
      function renderLinesAtOffset(offset) {
        for (var i = 0, len = textLines.length; i < len; i++) {

          var lineWidth = _this._getLineWidth(ctx, textLines[i]);
          var lineLeftOffset = _this._getLineLeftOffset(lineWidth);

          ctx.fillRect(
            _this._getLeftOffset() + lineLeftOffset, ~~((offset + (i * _this._getHeightOfLine(ctx, i, textLines))) - halfOfVerticalBox),
            lineWidth,
            1);
        }
      }

      if (this.textDecoration.indexOf('underline') > -1) {
        renderLinesAtOffset(this.fontSize * this.lineHeight);
      }
      if (this.textDecoration.indexOf('line-through') > -1) {
        renderLinesAtOffset(this.fontSize * this.lineHeight - this.fontSize / 2);
      }
      if (this.textDecoration.indexOf('overline') > -1) {
        renderLinesAtOffset(this.fontSize * this.lineHeight - this.fontSize);
      }
    },

    /**
     * @private
     */
    _getFontDeclaration: function() {
      return [
        // node-canvas needs "weight style", while browsers need "style weight"
        (fabric.isLikelyNode ? this.fontWeight : this.fontStyle), (fabric.isLikelyNode ? this.fontStyle : this.fontWeight),
        this.fontSize + 'px', (fabric.isLikelyNode ? ('"' + this.fontFamily + '"') : this.fontFamily)
      ].join(' ');
    },

    /**
     * Renders text instance on a specified context
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Boolean} [noTransform] When true, context is not transformed
     */
    render: function(ctx, noTransform) {
      // do not render if object is not visible
      if (!this.visible) return;

      ctx.save();
      var m = this.transformMatrix;
      if (m && !this.group) {
        ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
      }
      this._render(ctx);
      if (!noTransform && this.active) {
        this.drawBorders(ctx);
        this.drawControls(ctx);
      }
      ctx.restore();
    },

    /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      var object = extend(this.callSuper('toObject', propertiesToInclude), {
        text: this.text,
        fontSize: this.fontSize,
        fontWeight: this.fontWeight,
        fontFamily: this.fontFamily,
        fontStyle: this.fontStyle,
        lineHeight: this.lineHeight,
        textDecoration: this.textDecoration,
        textAlign: this.textAlign,
        path: this.path,
        textBackgroundColor: this.textBackgroundColor,
        useNative: this.useNative
      });
      if (!this.includeDefaultValues) {
        this._removeDefaultValues(object);
      }
      return object;
    },

    /* _TO_SVG_START_ */
    /**
     * Returns SVG representation of an instance
     * @param {Function} [reviver] Method for further parsing of svg representation.
     * @return {String} svg representation of an instance
     */
    toSVG: function(reviver) {
      var markup = [],
        textLines = this.text.split(this._reNewline),
        offsets = this._getSVGLeftTopOffsets(textLines),
        textAndBg = this._getSVGTextAndBg(offsets.lineTop, offsets.textLeft, textLines),
        shadowSpans = this._getSVGShadows(offsets.lineTop, textLines);

      // move top offset by an ascent
      offsets.textTop += (this._fontAscent ? ((this._fontAscent / 5) * this.lineHeight) : 0);

      this._wrapSVGTextAndBg(markup, textAndBg, shadowSpans, offsets);

      return reviver ? reviver(markup.join('')) : markup.join('');
    },

    /**
     * @private
     */
    _getSVGLeftTopOffsets: function(textLines) {
      var lineTop = this.useNative ? this.fontSize * this.lineHeight : (-this._fontAscent - ((this._fontAscent / 5) * this.lineHeight)),

        textLeft = -(this.width / 2),
        textTop = this.useNative ? this.fontSize - 1 : (this.height / 2) - (textLines.length * this.fontSize) - this._totalLineHeight;

      return {
        textLeft: textLeft,
        textTop: textTop,
        lineTop: lineTop
      };
    },

    /**
     * @private
     */
    _wrapSVGTextAndBg: function(markup, textAndBg, shadowSpans, offsets) {
      markup.push(
        '<g transform="', this.getSvgTransform(), '">',
        textAndBg.textBgRects.join(''),
        '<text ', (this.fontFamily ? 'font-family="' + this.fontFamily.replace(/"/g, '\'') + '" ' : ''), (this.fontSize ? 'font-size="' + this.fontSize + '" ' : ''), (this.fontStyle ? 'font-style="' + this.fontStyle + '" ' : ''), (this.fontWeight ? 'font-weight="' + this.fontWeight + '" ' : ''), (this.textDecoration ? 'text-decoration="' + this.textDecoration + '" ' : ''),
        'style="', this.getSvgStyles(), '" ',
        /* svg starts from left/bottom corner so we normalize height */
        'transform="translate(', toFixed(offsets.textLeft, 2), ' ', toFixed(offsets.textTop, 2), ')">',
        shadowSpans.join(''),
        textAndBg.textSpans.join(''),
        '</text>',
        '</g>'
      );
    },

    /**
     * @private
     * @param {Number} lineHeight
     * @param {Array} textLines Array of all text lines
     * @return {Array}
     */
    _getSVGShadows: function(lineHeight, textLines) {
      var shadowSpans = [],
        i, len,
        lineTopOffsetMultiplier = 1;

      if (!this.shadow || !this._boundaries) {
        return shadowSpans;
      }

      for (i = 0, len = textLines.length; i < len; i++) {
        if (textLines[i] !== '') {
          var lineLeftOffset = (this._boundaries && this._boundaries[i]) ? this._boundaries[i].left : 0;
          shadowSpans.push(
            '<tspan x="',
            toFixed((lineLeftOffset + lineTopOffsetMultiplier) + this.shadow.offsetX, 2), ((i === 0 || this.useNative) ? '" y' : '" dy'), '="',
            toFixed(this.useNative ? ((lineHeight * i) - this.height / 2 + this.shadow.offsetY) : (lineHeight + (i === 0 ? this.shadow.offsetY : 0)), 2),
            '" ',
            this._getFillAttributes(this.shadow.color), '>',
            fabric.util.string.escapeXml(textLines[i]),
            '</tspan>');
          lineTopOffsetMultiplier = 1;
        } else {
          // in some environments (e.g. IE 7 & 8) empty tspans are completely ignored, using a lineTopOffsetMultiplier
          // prevents empty tspans
          lineTopOffsetMultiplier++;
        }
      }

      return shadowSpans;
    },

    /**
     * @private
     * @param {Number} lineHeight
     * @param {Number} textLeftOffset Text left offset
     * @param {Array} textLines Array of all text lines
     * @return {Object}
     */
    _getSVGTextAndBg: function(lineHeight, textLeftOffset, textLines) {
      var textSpans = [],
        textBgRects = [],
        lineTopOffsetMultiplier = 1;

      // bounding-box background
      this._setSVGBg(textBgRects);

      // text and text-background
      for (var i = 0, len = textLines.length; i < len; i++) {
        if (textLines[i] !== '') {
          this._setSVGTextLineText(textLines[i], i, textSpans, lineHeight, lineTopOffsetMultiplier, textBgRects);
          lineTopOffsetMultiplier = 1;
        } else {
          // in some environments (e.g. IE 7 & 8) empty tspans are completely ignored, using a lineTopOffsetMultiplier
          // prevents empty tspans
          lineTopOffsetMultiplier++;
        }

        if (!this.textBackgroundColor || !this._boundaries) continue;

        this._setSVGTextLineBg(textBgRects, i, textLeftOffset, lineHeight);
      }

      return {
        textSpans: textSpans,
        textBgRects: textBgRects
      };
    },

    _setSVGTextLineText: function(textLine, i, textSpans, lineHeight, lineTopOffsetMultiplier) {
      var lineLeftOffset = (this._boundaries && this._boundaries[i]) ? toFixed(this._boundaries[i].left, 2) : 0;

      textSpans.push(
        '<tspan x="',
        lineLeftOffset, '" ', (i === 0 || this.useNative ? 'y' : 'dy'), '="',
        toFixed(this.useNative ? ((lineHeight * i) - this.height / 2) : (lineHeight * lineTopOffsetMultiplier), 2), '" ',
        // doing this on <tspan> elements since setting opacity
        // on containing <text> one doesn't work in Illustrator
        this._getFillAttributes(this.fill), '>',
        fabric.util.string.escapeXml(textLine),
        '</tspan>'
      );
    },

    _setSVGTextLineBg: function(textBgRects, i, textLeftOffset, lineHeight) {
      textBgRects.push(
        '<rect ',
        this._getFillAttributes(this.textBackgroundColor),
        ' x="',
        toFixed(textLeftOffset + this._boundaries[i].left, 2),
        '" y="',
        /* an offset that seems to straighten things out */
        toFixed((lineHeight * i) - this.height / 2, 2),
        '" width="',
        toFixed(this._boundaries[i].width, 2),
        '" height="',
        toFixed(this._boundaries[i].height, 2),
        '"></rect>');
    },

    _setSVGBg: function(textBgRects) {
      if (this.backgroundColor && this._boundaries) {
        textBgRects.push(
          '<rect ',
          this._getFillAttributes(this.backgroundColor),
          ' x="',
          toFixed(-this.width / 2, 2),
          '" y="',
          toFixed(-this.height / 2, 2),
          '" width="',
          toFixed(this.width, 2),
          '" height="',
          toFixed(this.height, 2),
          '"></rect>');
      }
    },

    /**
     * Adobe Illustrator (at least CS5) is unable to render rgba()-based fill values
     * we work around it by "moving" alpha channel into opacity attribute and setting fill's alpha to 1
     *
     * @private
     * @param {Any} value
     * @return {String}
     */
    _getFillAttributes: function(value) {
      var fillColor = (value && typeof value === 'string') ? new fabric.Color(value) : '';
      if (!fillColor || !fillColor.getSource() || fillColor.getAlpha() === 1) {
        return 'fill="' + value + '"';
      }
      return 'opacity="' + fillColor.getAlpha() + '" fill="' + fillColor.setAlpha(1).toRgb() + '"';
    },
    /* _TO_SVG_END_ */

    /**
     * Sets specified property to a specified value
     * @param {String} key
     * @param {Any} value
     * @return {fabric.Text} thisArg
     * @chainable
     */
    _set: function(key, value) {
      if (key === 'fontFamily' && this.path) {
        this.path = this.path.replace(/(.*?)([^\/]*)(\.font\.js)/, '$1' + value + '$3');
      }
      this.callSuper('_set', key, value);

      if (key in this._dimensionAffectingProps) {
        this._initDimensions();
        this.setCoords();
      }
    },

    /**
     * Returns complexity of an instance
     * @return {Number} complexity
     */
    complexity: function() {
      return 1;
    }
  });

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by {@link fabric.Text.fromElement})
   * @static
   * @memberOf fabric.Text
   * @see: http://www.w3.org/TR/SVG/text.html#TextElement
   */
  fabric.Text.ATTRIBUTE_NAMES = fabric.SHARED_ATTRIBUTES.concat(
    'x y font-family font-style font-weight font-size text-decoration'.split(' '));

  /**
   * Returns fabric.Text instance from an SVG element (<b>not yet implemented</b>)
   * @static
   * @memberOf fabric.Text
   * @param {SVGElement} element Element to parse
   * @param {Object} [options] Options object
   * @return {fabric.Text} Instance of fabric.Text
   */
  fabric.Text.fromElement = function(element, options) {
    if (!element) {
      return null;
    }

    var parsedAttributes = fabric.parseAttributes(element, fabric.Text.ATTRIBUTE_NAMES);
    options = fabric.util.object.extend((options ? fabric.util.object.clone(options) : {}), parsedAttributes);

    var text = new fabric.Text(element.textContent, options);

    /*
      Adjust positioning:
        x/y attributes in SVG correspond to the bottom-left corner of text bounding box
        top/left properties in Fabric correspond to center point of text bounding box
    */

    text.set({
      left: text.getLeft() + text.getWidth() / 2,
      top: text.getTop() - text.getHeight() / 2
    });

    return text;
  };
  /* _FROM_SVG_END_ */

  /**
   * Returns fabric.Text instance from an object representation
   * @static
   * @memberOf fabric.Text
   * @param object {Object} object Object to create an instance from
   * @return {fabric.Text} Instance of fabric.Text
   */
  fabric.Text.fromObject = function(object) {
    return new fabric.Text(object.text, clone(object));
  };

  fabric.util.createAccessors(fabric.Text);

})(typeof exports !== 'undefined' ? exports : this);


(function() {

  var clone = fabric.util.object.clone;

  /**
   * IText class (introduced in <b>v1.4</b>)
   * @class fabric.IText
   * @extends fabric.Text
   * @mixes fabric.Observable
   *
   * @fires changed ("text:changed" when observing canvas)
   * @fires editing:entered ("text:editing:entered" when observing canvas)
   * @fires editing:exited ("text:editing:exited" when observing canvas)
   *
   * @return {fabric.IText} thisArg
   * @see {@link fabric.IText#initialize} for constructor definition
   *
   * <p>Supported key combinations:</p>
   * <pre>
   *   Move cursor:                    left, right, up, down
   *   Select character:               shift + left, shift + right
   *   Select text vertically:         shift + up, shift + down
   *   Move cursor by word:            alt + left, alt + right
   *   Select words:                   shift + alt + left, shift + alt + right
   *   Move cursor to line start/end:  cmd + left, cmd + right
   *   Select till start/end of line:  cmd + shift + left, cmd + shift + right
   *   Jump to start/end of text:      cmd + up, cmd + down
   *   Select till start/end of text:  cmd + shift + up, cmd + shift + down
   *   Delete character:               backspace
   *   Delete word:                    alt + backspace
   *   Delete line:                    cmd + backspace
   *   Forward delete:                 delete
   *   Copy text:                      ctrl/cmd + c
   *   Paste text:                     ctrl/cmd + v
   *   Cut text:                       ctrl/cmd + x
   *   Select entire text:             ctrl/cmd + a
   * </pre>
   *
   * <p>Supported mouse/touch combination</p>
   * <pre>
   *   Position cursor:                click/touch
   *   Create selection:               click/touch & drag
   *   Create selection:               click & shift + click
   *   Select word:                    double click
   *   Select line:                    triple click
   * </pre>
   */
  fabric.IText = fabric.util.createClass(fabric.Text, fabric.Observable, /** @lends fabric.IText.prototype */ {

    /**
     * Type of an object
     * @type String
     * @default
     */
    type: 'i-text',

    /**
     * Index where text selection starts (or where cursor is when there is no selection)
     * @type Nubmer
     * @default
     */
    selectionStart: 0,

    /**
     * Index where text selection ends
     * @type Nubmer
     * @default
     */
    selectionEnd: 0,

    /**
     * Color of text selection
     * @type String
     * @default
     */
    selectionColor: 'rgba(17,119,255,0.3)',

    /**
     * Indicates whether text is in editing mode
     * @type Boolean
     * @default
     */
    isEditing: false,

    /**
     * Indicates whether a text can be edited
     * @type Boolean
     * @default
     */
    editable: true,

    /**
     * Border color of text object while it's in editing mode
     * @type String
     * @default
     */
    editingBorderColor: 'rgba(102,153,255,0.25)',

    /**
     * Width of cursor (in px)
     * @type Number
     * @default
     */
    cursorWidth: 2,

    /**
     * Color of default cursor (when not overwritten by character style)
     * @type String
     * @default
     */
    cursorColor: '#333',

    /**
     * Delay between cursor blink (in ms)
     * @type Number
     * @default
     */
    cursorDelay: 1000,

    /**
     * Duration of cursor fadein (in ms)
     * @type Number
     * @default
     */
    cursorDuration: 600,

    /**
     * Object containing character styles
     * (where top-level properties corresponds to line number and 2nd-level properties -- to char number in a line)
     * @type Object
     * @default
     */
    styles: null,

    /**
     * Indicates whether internal text char widths can be cached
     * @type Boolean
     * @default
     */
    caching: true,

    /**
     * @private
     * @type Boolean
     * @default
     */
    _skipFillStrokeCheck: true,

    /**
     * @private
     */
    _reSpace: /\s|\n/,

    /**
     * @private
     */
    _fontSizeFraction: 4,

    /**
     * @private
     */
    _currentCursorOpacity: 0,

    /**
     * @private
     */
    _selectionDirection: null,

    /**
     * @private
     */
    _abortCursorAnimation: false,

    /**
     * @private
     */
    _charWidthsCache: {},

    /**
     * Constructor
     * @param {String} text Text string
     * @param {Object} [options] Options object
     * @return {fabric.IText} thisArg
     */
    initialize: function(text, options) {
      this.styles = options ? (options.styles || {}) : {};
      this.callSuper('initialize', text, options);
      this.initBehavior();

      fabric.IText.instances.push(this);

      // caching
      this.__lineWidths = {};
      this.__lineHeights = {};
      this.__lineOffsets = {};
    },

    /**
     * Returns true if object has no styling
     */
    isEmptyStyles: function() {
      if (!this.styles) return true;
      var obj = this.styles;

      for (var p1 in obj) {
        for (var p2 in obj[p1]) {
          /*jshint unused:false */
          for (var p3 in obj[p1][p2]) {
            return false;
          }
        }
      }
      return true;
    },

    /**
     * Sets selection start (left boundary of a selection)
     * @param {Number} index Index to set selection start to
     */
    setSelectionStart: function(index) {
      this.selectionStart = index;
      this.hiddenTextarea && (this.hiddenTextarea.selectionStart = index);
    },

    /**
     * Sets selection end (right boundary of a selection)
     * @param {Number} index Index to set selection end to
     */
    setSelectionEnd: function(index) {
      this.selectionEnd = index;
      this.hiddenTextarea && (this.hiddenTextarea.selectionEnd = index);
    },

    /**
     * Gets style of a current selection/cursor (at the start position)
     * @param {Number} [startIndex] Start index to get styles at
     * @param {Number} [endIndex] End index to get styles at
     * @return {Object} styles Style object at a specified (or current) index
     */
    getSelectionStyles: function(startIndex, endIndex) {

      if (arguments.length === 2) {
        var styles = [];
        for (var i = startIndex; i < endIndex; i++) {
          styles.push(this.getSelectionStyles(i));
        }
        return styles;
      }

      var loc = this.get2DCursorLocation(startIndex);
      if (this.styles[loc.lineIndex]) {
        return this.styles[loc.lineIndex][loc.charIndex] || {};
      }

      return {};
    },

    /**
     * Sets style of a current selection
     * @param {Object} [styles] Styles object
     * @return {fabric.IText} thisArg
     * @chainable
     */
    setSelectionStyles: function(styles) {
      if (this.selectionStart === this.selectionEnd) {
        this._extendStyles(this.selectionStart, styles);
      } else {
        for (var i = this.selectionStart; i < this.selectionEnd; i++) {
          this._extendStyles(i, styles);
        }
      }
      return this;
    },

    /**
     * @private
     */
    _extendStyles: function(index, styles) {
      var loc = this.get2DCursorLocation(index);

      if (!this.styles[loc.lineIndex]) {
        this.styles[loc.lineIndex] = {};
      }
      if (!this.styles[loc.lineIndex][loc.charIndex]) {
        this.styles[loc.lineIndex][loc.charIndex] = {};
      }

      fabric.util.object.extend(this.styles[loc.lineIndex][loc.charIndex], styles);
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _render: function(ctx) {
      this.callSuper('_render', ctx);
      this.ctx = ctx;
      this.isEditing && this.renderCursorOrSelection();
    },

    /**
     * Renders cursor or selection (depending on what exists)
     */
    renderCursorOrSelection: function() {
      if (!this.active) return;

      var chars = this.text.split(''),
        boundaries;

      if (this.selectionStart === this.selectionEnd) {
        boundaries = this._getCursorBoundaries(chars, 'cursor');
        this.renderCursor(boundaries);
      } else {
        boundaries = this._getCursorBoundaries(chars, 'selection');
        this.renderSelection(chars, boundaries);
      }
    },

    /**
     * Returns 2d representation (lineIndex and charIndex) of cursor (or selection start)
     * @param {Number} [selectionStart] Optional index. When not given, current selectionStart is used.
     */
    get2DCursorLocation: function(selectionStart) {
      if (typeof selectionStart === 'undefined') {
        selectionStart = this.selectionStart;
      }
      var textBeforeCursor = this.text.slice(0, selectionStart);
      var linesBeforeCursor = textBeforeCursor.split(this._reNewline);

      return {
        lineIndex: linesBeforeCursor.length - 1,
        charIndex: linesBeforeCursor[linesBeforeCursor.length - 1].length
      };
    },

    /**
     * Returns fontSize of char at the current cursor
     * @param {Number} lineIndex Line index
     * @param {Number} charIndex Char index
     * @return {Number} Character font size
     */
    getCurrentCharFontSize: function(lineIndex, charIndex) {
      return (
        this.styles[lineIndex] &&
        this.styles[lineIndex][charIndex === 0 ? 0 : (charIndex - 1)] &&
        this.styles[lineIndex][charIndex === 0 ? 0 : (charIndex - 1)].fontSize) || this.fontSize;
    },

    /**
     * Returns color (fill) of char at the current cursor
     * @param {Number} lineIndex Line index
     * @param {Number} charIndex Char index
     * @return {String} Character color (fill)
     */
    getCurrentCharColor: function(lineIndex, charIndex) {
      return (
        this.styles[lineIndex] &&
        this.styles[lineIndex][charIndex === 0 ? 0 : (charIndex - 1)] &&
        this.styles[lineIndex][charIndex === 0 ? 0 : (charIndex - 1)].fill) || this.cursorColor;
    },

    /**
     * Returns cursor boundaries (left, top, leftOffset, topOffset)
     * @private
     * @param {Array} chars Array of characters
     * @param {String} typeOfBoundaries
     */
    _getCursorBoundaries: function(chars, typeOfBoundaries) {

      var cursorLocation = this.get2DCursorLocation(),

        textLines = this.text.split(this._reNewline),

        // left/top are left/top of entire text box
        // leftOffset/topOffset are offset from that left/top point of a text box

        left = Math.round(this._getLeftOffset()),
        top = -this.height / 2,

        offsets = this._getCursorBoundariesOffsets(
          chars, typeOfBoundaries, cursorLocation, textLines);

      return {
        left: left,
        top: top,
        leftOffset: offsets.left + offsets.lineLeft,
        topOffset: offsets.top
      };
    },

    /**
     * @private
     */
    _getCursorBoundariesOffsets: function(chars, typeOfBoundaries, cursorLocation, textLines) {

      var lineLeftOffset = 0,

        lineIndex = 0,
        charIndex = 0,

        leftOffset = 0,
        topOffset = typeOfBoundaries === 'cursor'
        // selection starts at the very top of the line,
        // whereas cursor starts at the padding created by line height
        ? (this._getHeightOfLine(this.ctx, 0) -
          this.getCurrentCharFontSize(cursorLocation.lineIndex, cursorLocation.charIndex)) : 0;

      for (var i = 0; i < this.selectionStart; i++) {
        if (chars[i] === '\n') {
          leftOffset = 0;
          var index = lineIndex + (typeOfBoundaries === 'cursor' ? 1 : 0);
          topOffset += this._getCachedLineHeight(index);

          lineIndex++;
          charIndex = 0;
        } else {
          leftOffset += this._getWidthOfChar(this.ctx, chars[i], lineIndex, charIndex);
          charIndex++;
        }

        lineLeftOffset = this._getCachedLineOffset(lineIndex, textLines);
      }

      this._clearCache();

      return {
        top: topOffset,
        left: leftOffset,
        lineLeft: lineLeftOffset
      };
    },

    /**
     * @private
     */
    _clearCache: function() {
      this.__lineWidths = {};
      this.__lineHeights = {};
      this.__lineOffsets = {};
    },

    /**
     * @private
     */
    _getCachedLineHeight: function(index) {
      return this.__lineHeights[index] ||
        (this.__lineHeights[index] = this._getHeightOfLine(this.ctx, index));
    },

    /**
     * @private
     */
    _getCachedLineWidth: function(lineIndex, textLines) {
      return this.__lineWidths[lineIndex] ||
        (this.__lineWidths[lineIndex] = this._getWidthOfLine(this.ctx, lineIndex, textLines));
    },

    /**
     * @private
     */
    _getCachedLineOffset: function(lineIndex, textLines) {
      var widthOfLine = this._getCachedLineWidth(lineIndex, textLines);

      return this.__lineOffsets[lineIndex] ||
        (this.__lineOffsets[lineIndex] = this._getLineLeftOffset(widthOfLine));
    },

    /**
     * Renders cursor
     * @param {Object} boundaries
     */
    renderCursor: function(boundaries) {
      var ctx = this.ctx;

      ctx.save();

      var cursorLocation = this.get2DCursorLocation(),
        lineIndex = cursorLocation.lineIndex,
        charIndex = cursorLocation.charIndex,
        charHeight = this.getCurrentCharFontSize(lineIndex, charIndex),
        leftOffset = (lineIndex === 0 && charIndex === 0) ? this._getCachedLineOffset(lineIndex, this.text.split(this._reNewline)) : boundaries.leftOffset;

      ctx.fillStyle = this.getCurrentCharColor(lineIndex, charIndex);
      ctx.globalAlpha = this.__isMousedown ? 1 : this._currentCursorOpacity;

      ctx.fillRect(
        boundaries.left + leftOffset,
        boundaries.top + boundaries.topOffset,
        this.cursorWidth / this.scaleX,
        charHeight);

      ctx.restore();
    },

    /**
     * Renders text selection
     * @param {Array} chars Array of characters
     * @param {Object} boundaries Object with left/top/leftOffset/topOffset
     */
    renderSelection: function(chars, boundaries) {
      var ctx = this.ctx;

      ctx.save();

      ctx.fillStyle = this.selectionColor;

      var start = this.get2DCursorLocation(this.selectionStart),
        end = this.get2DCursorLocation(this.selectionEnd),
        startLine = start.lineIndex,
        endLine = end.lineIndex,
        textLines = this.text.split(this._reNewline),
        charIndex = start.charIndex - textLines[0].length;

      for (var i = startLine; i <= endLine; i++) {
        var lineOffset = this._getCachedLineOffset(i, textLines) || 0,
          lineHeight = this._getCachedLineHeight(i),
          boxWidth = 0;

        if (i === startLine) {
          for (var j = 0, len = textLines[i].length; j < len; j++) {
            if (j >= start.charIndex && (i !== endLine || j < end.charIndex)) {
              boxWidth += this._getWidthOfChar(ctx, textLines[i][j], i, charIndex);
            }
            if (j < start.charIndex) {
              lineOffset += this._getWidthOfChar(ctx, textLines[i][j], i, charIndex);
            }
            charIndex++;
          }
        } else if (i > startLine && i < endLine) {
          boxWidth += this._getCachedLineWidth(i, textLines) || 5;
          charIndex += textLines[i].length;
        } else if (i === endLine) {
          for (var j2 = 0, j2len = end.charIndex; j2 < j2len; j2++) {
            boxWidth += this._getWidthOfChar(ctx, textLines[i][j2], i, charIndex);
            charIndex++;
          }
        }

        ctx.fillRect(
          boundaries.left + lineOffset,
          boundaries.top + boundaries.topOffset,
          boxWidth,
          lineHeight);

        boundaries.topOffset += lineHeight;
      }
      ctx.restore();
    },

    /**
     * @private
     * @param {String} method
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderChars: function(method, ctx, line, left, top, lineIndex) {

      if (this.isEmptyStyles()) {
        return this._renderCharsFast(method, ctx, line, left, top);
      }

      this.skipTextAlign = true;

      // set proper box offset
      left -= this.textAlign === 'center' ? (this.width / 2) : (this.textAlign === 'right') ? this.width : 0;

      // set proper line offset
      var textLines = this.text.split(this._reNewline),
        lineWidth = this._getWidthOfLine(ctx, lineIndex, textLines),
        lineHeight = this._getHeightOfLine(ctx, lineIndex, textLines),
        lineLeftOffset = this._getLineLeftOffset(lineWidth),
        chars = line.split('');

      left += lineLeftOffset || 0;

      ctx.save();
      for (var i = 0, len = chars.length; i < len; i++) {
        this._renderChar(method, ctx, lineIndex, i, chars[i], left, top, lineHeight);
      }
      ctx.restore();
    },

    /**
     * @private
     * @param {String} method
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {String} line
     */
    _renderCharsFast: function(method, ctx, line, left, top) {
      this.skipTextAlign = false;

      if (method === 'fillText' && this.fill) {
        this.callSuper('_renderChars', method, ctx, line, left, top);
      }
      if (method === 'strokeText' && this.stroke) {
        this.callSuper('_renderChars', method, ctx, line, left, top);
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderChar: function(method, ctx, lineIndex, i, _char, left, top, lineHeight) {
      var decl, charWidth, charHeight;

      if (this.styles && this.styles[lineIndex] && (decl = this.styles[lineIndex][i])) {

        var shouldStroke = decl.stroke || this.stroke,
          shouldFill = decl.fill || this.fill;

        ctx.save();
        charWidth = this._applyCharStylesGetWidth(ctx, _char, lineIndex, i, decl);
        charHeight = this._getHeightOfChar(ctx, _char, lineIndex, i);

        if (shouldFill) {
          ctx.fillText(_char, left, top);
        }
        if (shouldStroke) {
          ctx.strokeText(_char, left, top);
        }

        this._renderCharDecoration(ctx, decl, left, top, charWidth, lineHeight, charHeight);
        ctx.restore();

        ctx.translate(charWidth, 0);
      } else {
        if (method === 'strokeText' && this.stroke) {
          ctx[method](_char, left, top);
        }
        if (method === 'fillText' && this.fill) {
          ctx[method](_char, left, top);
        }
        charWidth = this._applyCharStylesGetWidth(ctx, _char, lineIndex, i);
        this._renderCharDecoration(ctx, null, left, top, charWidth, lineHeight);

        ctx.translate(ctx.measureText(_char).width, 0);
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderCharDecoration: function(ctx, styleDeclaration, left, top, charWidth, lineHeight, charHeight) {

      var textDecoration = styleDeclaration ? (styleDeclaration.textDecoration || this.textDecoration) : this.textDecoration;

      var fontSize = (styleDeclaration ? styleDeclaration.fontSize : null) || this.fontSize;

      if (!textDecoration) return;

      if (textDecoration.indexOf('underline') > -1) {
        this._renderCharDecorationAtOffset(
          ctx,
          left,
          top + (this.fontSize / this._fontSizeFraction),
          charWidth,
          0,
          this.fontSize / 20
        );
      }
      if (textDecoration.indexOf('line-through') > -1) {
        this._renderCharDecorationAtOffset(
          ctx,
          left,
          top + (this.fontSize / this._fontSizeFraction),
          charWidth,
          charHeight / 2,
          fontSize / 20
        );
      }
      if (textDecoration.indexOf('overline') > -1) {
        this._renderCharDecorationAtOffset(
          ctx,
          left,
          top,
          charWidth,
          lineHeight - (this.fontSize / this._fontSizeFraction),
          this.fontSize / 20
        );
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _renderCharDecorationAtOffset: function(ctx, left, top, charWidth, offset, thickness) {
      ctx.fillRect(left, top - offset, charWidth, thickness);
    },

    /**
     * @private
     * @param {String} method
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {String} line
     */
    _renderTextLine: function(method, ctx, line, left, top, lineIndex) {
      // to "cancel" this.fontSize subtraction in fabric.Text#_renderTextLine
      top += this.fontSize / 4;
      this.callSuper('_renderTextLine', method, ctx, line, left, top, lineIndex);
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Array} textLines
     */
    _renderTextDecoration: function(ctx, textLines) {
      if (this.isEmptyStyles()) {
        return this.callSuper('_renderTextDecoration', ctx, textLines);
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {Array} textLines Array of all text lines
     */
    _renderTextLinesBackground: function(ctx, textLines) {
      if (!this.textBackgroundColor && !this.styles) return;

      ctx.save();

      if (this.textBackgroundColor) {
        ctx.fillStyle = this.textBackgroundColor;
      }

      var lineHeights = 0,
        fractionOfFontSize = this.fontSize / this._fontSizeFraction;

      for (var i = 0, len = textLines.length; i < len; i++) {

        var heightOfLine = this._getHeightOfLine(ctx, i, textLines);
        if (textLines[i] === '') {
          lineHeights += heightOfLine;
          continue;
        }

        var lineWidth = this._getWidthOfLine(ctx, i, textLines),
          lineLeftOffset = this._getLineLeftOffset(lineWidth);

        if (this.textBackgroundColor) {
          ctx.fillStyle = this.textBackgroundColor;

          ctx.fillRect(
            this._getLeftOffset() + lineLeftOffset,
            this._getTopOffset() + lineHeights + fractionOfFontSize,
            lineWidth,
            heightOfLine
          );
        }
        if (this.styles[i]) {
          for (var j = 0, jlen = textLines[i].length; j < jlen; j++) {
            if (this.styles[i] && this.styles[i][j] && this.styles[i][j].textBackgroundColor) {

              var _char = textLines[i][j];

              ctx.fillStyle = this.styles[i][j].textBackgroundColor;

              ctx.fillRect(
                this._getLeftOffset() + lineLeftOffset + this._getWidthOfCharsAt(ctx, i, j, textLines),
                this._getTopOffset() + lineHeights + fractionOfFontSize,
                this._getWidthOfChar(ctx, _char, i, j, textLines) + 1,
                heightOfLine
              );
            }
          }
        }
        lineHeights += heightOfLine;
      }
      ctx.restore();
    },

    /**
     * @private
     */
    _getCacheProp: function(_char, styleDeclaration) {
      return _char +

        styleDeclaration.fontFamily +
        styleDeclaration.fontSize +
        styleDeclaration.fontWeight +
        styleDeclaration.fontStyle +

        styleDeclaration.shadow;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     * @param {String} _char
     * @param {Number} lineIndex
     * @param {Number} charIndex
     * @param {Object} [decl]
     */
    _applyCharStylesGetWidth: function(ctx, _char, lineIndex, charIndex, decl) {
      var styleDeclaration = decl ||
        (this.styles[lineIndex] &&
          this.styles[lineIndex][charIndex]);

      if (styleDeclaration) {
        // cloning so that original style object is not polluted with following font declarations
        styleDeclaration = clone(styleDeclaration);
      } else {
        styleDeclaration = {};
      }

      this._applyFontStyles(styleDeclaration);

      var cacheProp = this._getCacheProp(_char, styleDeclaration);

      // short-circuit if no styles
      if (this.isEmptyStyles() && this._charWidthsCache[cacheProp] && this.caching) {
        return this._charWidthsCache[cacheProp];
      }

      if (typeof styleDeclaration.shadow === 'string') {
        styleDeclaration.shadow = new fabric.Shadow(styleDeclaration.shadow);
      }

      var fill = styleDeclaration.fill || this.fill;
      ctx.fillStyle = fill.toLive ? fill.toLive(ctx) : fill;

      if (styleDeclaration.stroke) {
        ctx.strokeStyle = (styleDeclaration.stroke && styleDeclaration.stroke.toLive) ? styleDeclaration.stroke.toLive(ctx) : styleDeclaration.stroke;
      }

      ctx.lineWidth = styleDeclaration.strokeWidth || this.strokeWidth;
      ctx.font = this._getFontDeclaration.call(styleDeclaration);
      this._setShadow.call(styleDeclaration, ctx);

      if (!this.caching) {
        return ctx.measureText(_char).width;
      }

      if (!this._charWidthsCache[cacheProp]) {
        this._charWidthsCache[cacheProp] = ctx.measureText(_char).width;
      }

      return this._charWidthsCache[cacheProp];
    },

    /**
     * @private
     * @param {Object} styleDeclaration
     */
    _applyFontStyles: function(styleDeclaration) {
      if (!styleDeclaration.fontFamily) {
        styleDeclaration.fontFamily = this.fontFamily;
      }
      if (!styleDeclaration.fontSize) {
        styleDeclaration.fontSize = this.fontSize;
      }
      if (!styleDeclaration.fontWeight) {
        styleDeclaration.fontWeight = this.fontWeight;
      }
      if (!styleDeclaration.fontStyle) {
        styleDeclaration.fontStyle = this.fontStyle;
      }
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _getWidthOfChar: function(ctx, _char, lineIndex, charIndex) {
      ctx.save();
      var width = this._applyCharStylesGetWidth(ctx, _char, lineIndex, charIndex);
      ctx.restore();
      return width;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _getHeightOfChar: function(ctx, _char, lineIndex, charIndex) {
      if (this.styles[lineIndex] && this.styles[lineIndex][charIndex]) {
        return this.styles[lineIndex][charIndex].fontSize || this.fontSize;
      }
      return this.fontSize;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _getWidthOfCharAt: function(ctx, lineIndex, charIndex, lines) {
      lines = lines || this.text.split(this._reNewline);
      var _char = lines[lineIndex].split('')[charIndex];
      return this._getWidthOfChar(ctx, _char, lineIndex, charIndex);
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _getHeightOfCharAt: function(ctx, lineIndex, charIndex, lines) {
      lines = lines || this.text.split(this._reNewline);
      var _char = lines[lineIndex].split('')[charIndex];
      return this._getHeightOfChar(ctx, _char, lineIndex, charIndex);
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _getWidthOfCharsAt: function(ctx, lineIndex, charIndex, lines) {
      var width = 0;
      for (var i = 0; i < charIndex; i++) {
        width += this._getWidthOfCharAt(ctx, lineIndex, i, lines);
      }
      return width;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _getWidthOfLine: function(ctx, lineIndex, textLines) {
      // if (!this.styles[lineIndex]) {
      //   return this.callSuper('_getLineWidth', ctx, textLines[lineIndex]);
      // }
      return this._getWidthOfCharsAt(ctx, lineIndex, textLines[lineIndex].length, textLines);
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _getTextWidth: function(ctx, textLines) {

      if (this.isEmptyStyles()) {
        return this.callSuper('_getTextWidth', ctx, textLines);
      }

      var maxWidth = this._getWidthOfLine(ctx, 0, textLines);

      for (var i = 1, len = textLines.length; i < len; i++) {
        var currentLineWidth = this._getWidthOfLine(ctx, i, textLines);
        if (currentLineWidth > maxWidth) {
          maxWidth = currentLineWidth;
        }
      }
      return maxWidth;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _getHeightOfLine: function(ctx, lineIndex, textLines) {

      textLines = textLines || this.text.split(this._reNewline);

      var maxHeight = this._getHeightOfChar(ctx, textLines[lineIndex][0], lineIndex, 0),
        line = textLines[lineIndex],
        chars = line.split('');

      for (var i = 1, len = chars.length; i < len; i++) {
        var currentCharHeight = this._getHeightOfChar(ctx, chars[i], lineIndex, i);
        if (currentCharHeight > maxHeight) {
          maxHeight = currentCharHeight;
        }
      }

      return maxHeight * this.lineHeight;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _getTextHeight: function(ctx, textLines) {
      var height = 0;
      for (var i = 0, len = textLines.length; i < len; i++) {
        height += this._getHeightOfLine(ctx, i, textLines);
      }
      return height;
    },

    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _getTopOffset: function() {
      var topOffset = fabric.Text.prototype._getTopOffset.call(this);
      return topOffset - (this.fontSize / this._fontSizeFraction);
    },

    /**
     * @private
     * This method is overwritten to account for different top offset
     */
    _renderTextBoxBackground: function(ctx) {
      if (!this.backgroundColor) return;

      ctx.save();
      ctx.fillStyle = this.backgroundColor;

      ctx.fillRect(
        this._getLeftOffset(),
        this._getTopOffset() + (this.fontSize / this._fontSizeFraction),
        this.width,
        this.height
      );

      ctx.restore();
    },

    /**
     * Returns object representation of an instance
     * @methd toObject
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} object representation of an instance
     */
    toObject: function(propertiesToInclude) {
      return fabric.util.object.extend(this.callSuper('toObject', propertiesToInclude), {
        styles: clone(this.styles)
      });
    }
  });

  /**
   * Returns fabric.IText instance from an object representation
   * @static
   * @memberOf fabric.IText
   * @param {Object} object Object to create an instance from
   * @return {fabric.IText} instance of fabric.IText
   */
  fabric.IText.fromObject = function(object) {
    return new fabric.IText(object.text, clone(object));
  };

  /**
   * Contains all fabric.IText objects that have been created
   * @static
   * @memberof fabric.IText
   * @type Array
   */
  fabric.IText.instances = [];

})();


(function() {

  var clone = fabric.util.object.clone;

  fabric.util.object.extend(fabric.IText.prototype, /** @lends fabric.IText.prototype */ {

    /**
     * Initializes all the interactive behavior of IText
     */
    initBehavior: function() {
      this.initKeyHandlers();
      this.initCursorSelectionHandlers();
      this.initDoubleClickSimulation();
      this.initHiddenTextarea();
    },

    /**
     * Initializes "selected" event handler
     */
    initSelectedHandler: function() {
      this.on('selected', function() {

        var _this = this;
        setTimeout(function() {
          _this.selected = true;
        }, 100);

        if (this.canvas && !fabric.Canvas._hasITextHandlers) {
          this._initCanvasHandlers();
          fabric.Canvas._hasITextHandlers = true;
        }
      });
    },

    /**
     * @private
     */
    _initCanvasHandlers: function() {
      this.canvas.on('selection:cleared', function() {
        fabric.IText.prototype.exitEditingOnOthers.call();
      });

      this.canvas.on('mouse:up', function() {
        fabric.IText.instances.forEach(function(obj) {
          obj.__isMousedown = false;
        });
      });

      this.canvas.on('object:selected', function(options) {
        fabric.IText.prototype.exitEditingOnOthers.call(options.target);
      });
    },

    /**
     * @private
     */
    _tick: function() {

      var _this = this;

      if (this._abortCursorAnimation) return;

      this.animate('_currentCursorOpacity', 1, {

        duration: this.cursorDuration,

        onComplete: function() {
          _this._onTickComplete();
        },

        onChange: function() {
          _this.canvas && _this.canvas.renderAll();
        },

        abort: function() {
          return _this._abortCursorAnimation;
        }
      });
    },

    /**
     * @private
     */
    _onTickComplete: function() {
      if (this._abortCursorAnimation) return;

      var _this = this;
      if (this._cursorTimeout1) {
        clearTimeout(this._cursorTimeout1);
      }
      this._cursorTimeout1 = setTimeout(function() {
        _this.animate('_currentCursorOpacity', 0, {
          duration: this.cursorDuration / 2,
          onComplete: function() {
            _this._tick();
          },
          onChange: function() {
            _this.canvas && _this.canvas.renderAll();
          },
          abort: function() {
            return _this._abortCursorAnimation;
          }
        });
      }, 100);
    },

    /**
     * Initializes delayed cursor
     */
    initDelayedCursor: function(restart) {
      var _this = this;
      var delay = restart ? 0 : this.cursorDelay;

      if (restart) {
        this._abortCursorAnimation = true;
        clearTimeout(this._cursorTimeout1);
        this._currentCursorOpacity = 1;
        this.canvas && this.canvas.renderAll();
      }
      if (this._cursorTimeout2) {
        clearTimeout(this._cursorTimeout2);
      }
      this._cursorTimeout2 = setTimeout(function() {
        _this._abortCursorAnimation = false;
        _this._tick();
      }, delay);
    },

    /**
     * Aborts cursor animation and clears all timeouts
     */
    abortCursorAnimation: function() {
      this._abortCursorAnimation = true;

      clearTimeout(this._cursorTimeout1);
      clearTimeout(this._cursorTimeout2);

      this._currentCursorOpacity = 0;
      this.canvas && this.canvas.renderAll();

      var _this = this;
      setTimeout(function() {
        _this._abortCursorAnimation = false;
      }, 10);
    },

    /**
     * Selects entire text
     */
    selectAll: function() {
      this.selectionStart = 0;
      this.selectionEnd = this.text.length;
    },

    /**
     * Returns selected text
     * @return {String}
     */
    getSelectedText: function() {
      return this.text.slice(this.selectionStart, this.selectionEnd);
    },

    /**
     * Find new selection index representing start of current word according to current selection index
     * @param {Number} startFrom Surrent selection index
     * @return {Number} New selection index
     */
    findWordBoundaryLeft: function(startFrom) {
      var offset = 0,
        index = startFrom - 1;

      // remove space before cursor first
      if (this._reSpace.test(this.text.charAt(index))) {
        while (this._reSpace.test(this.text.charAt(index))) {
          offset++;
          index--;
        }
      }
      while (/\S/.test(this.text.charAt(index)) && index > -1) {
        offset++;
        index--;
      }

      return startFrom - offset;
    },

    /**
     * Find new selection index representing end of current word according to current selection index
     * @param {Number} startFrom Current selection index
     * @return {Number} New selection index
     */
    findWordBoundaryRight: function(startFrom) {
      var offset = 0,
        index = startFrom;

      // remove space after cursor first
      if (this._reSpace.test(this.text.charAt(index))) {
        while (this._reSpace.test(this.text.charAt(index))) {
          offset++;
          index++;
        }
      }
      while (/\S/.test(this.text.charAt(index)) && index < this.text.length) {
        offset++;
        index++;
      }

      return startFrom + offset;
    },

    /**
     * Find new selection index representing start of current line according to current selection index
     * @param {Number} current selection index
     */
    findLineBoundaryLeft: function(startFrom) {
      var offset = 0,
        index = startFrom - 1;

      while (!/\n/.test(this.text.charAt(index)) && index > -1) {
        offset++;
        index--;
      }

      return startFrom - offset;
    },

    /**
     * Find new selection index representing end of current line according to current selection index
     * @param {Number} current selection index
     */
    findLineBoundaryRight: function(startFrom) {
      var offset = 0,
        index = startFrom;

      while (!/\n/.test(this.text.charAt(index)) && index < this.text.length) {
        offset++;
        index++;
      }

      return startFrom + offset;
    },

    /**
     * Returns number of newlines in selected text
     * @return {Number} Number of newlines in selected text
     */
    getNumNewLinesInSelectedText: function() {
      var selectedText = this.getSelectedText();
      var numNewLines = 0;
      for (var i = 0, chars = selectedText.split(''), len = chars.length; i < len; i++) {
        if (chars[i] === '\n') {
          numNewLines++;
        }
      }
      return numNewLines;
    },

    /**
     * Finds index corresponding to beginning or end of a word
     * @param {Number} selectionStart Index of a character
     * @param {Number} direction: 1 or -1
     */
    searchWordBoundary: function(selectionStart, direction) {
      var index = this._reSpace.test(this.text.charAt(selectionStart)) ? selectionStart - 1 : selectionStart;
      var _char = this.text.charAt(index);
      var reNonWord = /[ \n\.,;!\?\-]/;

      while (!reNonWord.test(_char) && index > 0 && index < this.text.length) {
        index += direction;
        _char = this.text.charAt(index);
      }
      if (reNonWord.test(_char) && _char !== '\n') {
        index += direction === 1 ? 0 : 1;
      }
      return index;
    },

    /**
     * Selects a word based on the index
     * @param {Number} selectionStart Index of a character
     */
    selectWord: function(selectionStart) {
      var newSelectionStart = this.searchWordBoundary(selectionStart, -1); /* search backwards */
      var newSelectionEnd = this.searchWordBoundary(selectionStart, 1); /* search forward */

      this.setSelectionStart(newSelectionStart);
      this.setSelectionEnd(newSelectionEnd);
      this.initDelayedCursor(true);
    },

    /**
     * Selects a line based on the index
     * @param {Number} selectionStart Index of a character
     */
    selectLine: function(selectionStart) {
      var newSelectionStart = this.findLineBoundaryLeft(selectionStart);
      var newSelectionEnd = this.findLineBoundaryRight(selectionStart);

      this.setSelectionStart(newSelectionStart);
      this.setSelectionEnd(newSelectionEnd);
      this.initDelayedCursor(true);
    },

    /**
     * Enters editing state
     * @return {fabric.IText} thisArg
     * @chainable
     */
    enterEditing: function() {
      if (this.isEditing || !this.editable) return;

      this.exitEditingOnOthers();

      this.isEditing = true;

      this._updateTextarea();
      this._saveEditingProps();
      this._setEditingProps();

      this._tick();
      this.canvas && this.canvas.renderAll();

      this.fire('editing:entered');
      this.canvas && this.canvas.fire('text:editing:entered', {
        target: this
      });

      return this;
    },

    exitEditingOnOthers: function() {
      fabric.IText.instances.forEach(function(obj) {
        if (obj === this) return;
        obj.exitEditing();
      }, this);
    },

    /**
     * @private
     */
    _setEditingProps: function() {
      this.hoverCursor = 'text';

      if (this.canvas) {
        this.canvas.defaultCursor = this.canvas.moveCursor = 'text';
      }

      this.borderColor = this.editingBorderColor;

      this.hasControls = this.selectable = false;
      this.lockMovementX = this.lockMovementY = true;
    },

    /**
     * @private
     */
    _updateTextarea: function() {
      if (!this.hiddenTextarea) return;

      this.hiddenTextarea.value = this.text;
      this.hiddenTextarea.selectionStart = this.selectionStart;
      this.hiddenTextarea.focus();
    },

    /**
     * @private
     */
    _saveEditingProps: function() {
      this._savedProps = {
        hasControls: this.hasControls,
        borderColor: this.borderColor,
        lockMovementX: this.lockMovementX,
        lockMovementY: this.lockMovementY,
        hoverCursor: this.hoverCursor,
        defaultCursor: this.canvas && this.canvas.defaultCursor,
        moveCursor: this.canvas && this.canvas.moveCursor
      };
    },

    /**
     * @private
     */
    _restoreEditingProps: function() {
      if (!this._savedProps) return;

      this.hoverCursor = this._savedProps.overCursor;
      this.hasControls = this._savedProps.hasControls;
      this.borderColor = this._savedProps.borderColor;
      this.lockMovementX = this._savedProps.lockMovementX;
      this.lockMovementY = this._savedProps.lockMovementY;

      if (this.canvas) {
        this.canvas.defaultCursor = this._savedProps.defaultCursor;
        this.canvas.moveCursor = this._savedProps.moveCursor;
      }
    },

    /**
     * Exits from editing state
     * @return {fabric.IText} thisArg
     * @chainable
     */
    exitEditing: function() {

      this.selected = false;
      this.isEditing = false;
      this.selectable = true;

      this.selectionEnd = this.selectionStart;
      this.hiddenTextarea && this.hiddenTextarea.blur();

      this.abortCursorAnimation();
      this._restoreEditingProps();
      this._currentCursorOpacity = 0;

      this.fire('editing:exited');
      this.canvas && this.canvas.fire('text:editing:exited', {
        target: this
      });

      return this;
    },

    /**
     * @private
     */
    _removeExtraneousStyles: function() {
      var textLines = this.text.split(this._reNewline);
      for (var prop in this.styles) {
        if (!textLines[prop]) {
          delete this.styles[prop];
        }
      }
    },

    /**
     * @private
     */
    _removeCharsFromTo: function(start, end) {

      var i = end;
      while (i !== start) {

        var prevIndex = this.get2DCursorLocation(i).charIndex;
        i--;
        var index = this.get2DCursorLocation(i).charIndex;
        var isNewline = index > prevIndex;

        if (isNewline) {
          this.removeStyleObject(isNewline, i + 1);
        } else {
          this.removeStyleObject(this.get2DCursorLocation(i).charIndex === 0, i);
        }

      }

      this.text = this.text.slice(0, start) +
        this.text.slice(end);
    },

    /**
     * Inserts a character where cursor is (replacing selection if one exists)
     * @param {String} _chars Characters to insert
     */
    insertChars: function(_chars) {
      var isEndOfLine = this.text.slice(this.selectionStart, this.selectionStart + 1) === '\n';

      this.text = this.text.slice(0, this.selectionStart) +
        _chars +
        this.text.slice(this.selectionEnd);

      if (this.selectionStart === this.selectionEnd) {
        this.insertStyleObjects(_chars, isEndOfLine, this.copiedStyles);
      } else if (this.selectionEnd - this.selectionStart > 1) {
        // TODO: replace styles properly
        // console.log('replacing MORE than 1 char');
      }

      this.selectionStart += _chars.length;
      this.selectionEnd = this.selectionStart;

      if (this.canvas) {
        // TODO: double renderAll gets rid of text box shift happenning sometimes
        // need to find out what exactly causes it and fix it
        this.canvas.renderAll().renderAll();
      }

      this.setCoords();
      this.fire('changed');
      this.canvas && this.canvas.fire('text:changed', {
        target: this
      });
    },

    /**
     * Inserts new style object
     * @param {Number} lineIndex Index of a line
     * @param {Number} charIndex Index of a char
     * @param {Boolean} isEndOfLine True if it's end of line
     */
    insertNewlineStyleObject: function(lineIndex, charIndex, isEndOfLine) {

      this.shiftLineStyles(lineIndex, +1);

      if (!this.styles[lineIndex + 1]) {
        this.styles[lineIndex + 1] = {};
      }

      var currentCharStyle = this.styles[lineIndex][charIndex - 1],
        newLineStyles = {};

      // if there's nothing after cursor,
      // we clone current char style onto the next (otherwise empty) line
      if (isEndOfLine) {
        newLineStyles[0] = clone(currentCharStyle);
        this.styles[lineIndex + 1] = newLineStyles;
      }
      // otherwise we clone styles of all chars
      // after cursor onto the next line, from the beginning
      else {
        for (var index in this.styles[lineIndex]) {
          if (parseInt(index, 10) >= charIndex) {
            newLineStyles[parseInt(index, 10) - charIndex] = this.styles[lineIndex][index];
            // remove lines from the previous line since they're on a new line now
            delete this.styles[lineIndex][index];
          }
        }
        this.styles[lineIndex + 1] = newLineStyles;
      }
    },

    /**
     * Inserts style object for a given line/char index
     * @param {Number} lineIndex Index of a line
     * @param {Number} charIndex Index of a char
     * @param {Object} [style] Style object to insert, if given
     */
    insertCharStyleObject: function(lineIndex, charIndex, style) {

      var currentLineStyles = this.styles[lineIndex],
        currentLineStylesCloned = clone(currentLineStyles);

      if (charIndex === 0 && !style) {
        charIndex = 1;
      }

      // shift all char styles by 1 forward
      // 0,1,2,3 -> (charIndex=2) -> 0,1,3,4 -> (insert 2) -> 0,1,2,3,4
      for (var index in currentLineStylesCloned) {
        var numericIndex = parseInt(index, 10);
        if (numericIndex >= charIndex) {
          currentLineStyles[numericIndex + 1] = currentLineStylesCloned[numericIndex];
          //delete currentLineStyles[index];
        }
      }

      this.styles[lineIndex][charIndex] =
        style || clone(currentLineStyles[charIndex - 1]);
    },

    /**
     * Inserts style object(s)
     * @param {String} _chars Characters at the location where style is inserted
     * @param {Boolean} isEndOfLine True if it's end of line
     * @param {Array} [styles] Styles to insert
     */
    insertStyleObjects: function(_chars, isEndOfLine, styles) {

      // short-circuit
      if (this.isEmptyStyles()) return;

      var cursorLocation = this.get2DCursorLocation(),
        lineIndex = cursorLocation.lineIndex,
        charIndex = cursorLocation.charIndex;

      if (!this.styles[lineIndex]) {
        this.styles[lineIndex] = {};
      }

      if (_chars === '\n') {
        this.insertNewlineStyleObject(lineIndex, charIndex, isEndOfLine);
      } else {
        if (styles) {
          this._insertStyles(styles);
        } else {
          // TODO: support multiple style insertion if _chars.length > 1
          this.insertCharStyleObject(lineIndex, charIndex);
        }
      }
    },

    /**
     * @private
     */
    _insertStyles: function(styles) {
      for (var i = 0, len = styles.length; i < len; i++) {

        var cursorLocation = this.get2DCursorLocation(this.selectionStart + i),
          lineIndex = cursorLocation.lineIndex,
          charIndex = cursorLocation.charIndex;

        this.insertCharStyleObject(lineIndex, charIndex, styles[i]);
      }
    },

    /**
     * Shifts line styles up or down
     * @param {Number} lineIndex Index of a line
     * @param {Number} offset Can be -1 or +1
     */
    shiftLineStyles: function(lineIndex, offset) {
      // shift all line styles by 1 upward
      var clonedStyles = clone(this.styles);
      for (var line in this.styles) {
        var numericLine = parseInt(line, 10);
        if (numericLine > lineIndex) {
          this.styles[numericLine + offset] = clonedStyles[numericLine];
        }
      }
    },

    /**
     * Removes style object
     * @param {Boolean} isBeginningOfLine True if cursor is at the beginning of line
     * @param {Number} [index] Optional index. When not given, current selectionStart is used.
     */
    removeStyleObject: function(isBeginningOfLine, index) {

      var cursorLocation = this.get2DCursorLocation(index),
        lineIndex = cursorLocation.lineIndex,
        charIndex = cursorLocation.charIndex;

      if (isBeginningOfLine) {

        var textLines = this.text.split(this._reNewline),
          textOnPreviousLine = textLines[lineIndex - 1],
          newCharIndexOnPrevLine = textOnPreviousLine ? textOnPreviousLine.length : 0;

        if (!this.styles[lineIndex - 1]) {
          this.styles[lineIndex - 1] = {};
        }

        for (charIndex in this.styles[lineIndex]) {
          this.styles[lineIndex - 1][parseInt(charIndex, 10) + newCharIndexOnPrevLine] = this.styles[lineIndex][charIndex];
        }

        this.shiftLineStyles(lineIndex, -1);
      } else {
        var currentLineStyles = this.styles[lineIndex];

        if (currentLineStyles) {
          var offset = this.selectionStart === this.selectionEnd ? -1 : 0;
          delete currentLineStyles[charIndex + offset];
          // console.log('deleting', lineIndex, charIndex + offset);
        }

        var currentLineStylesCloned = clone(currentLineStyles);

        // shift all styles by 1 backwards
        for (var i in currentLineStylesCloned) {
          var numericIndex = parseInt(i, 10);
          if (numericIndex >= charIndex && numericIndex !== 0) {
            currentLineStyles[numericIndex - 1] = currentLineStylesCloned[numericIndex];
            delete currentLineStyles[numericIndex];
          }
        }
      }
    },

    /**
     * Inserts new line
     */
    insertNewline: function() {
      this.insertChars('\n');
    }
  });
})();


fabric.util.object.extend(fabric.IText.prototype, /** @lends fabric.IText.prototype */ {
  /**
   * Initializes "dbclick" event handler
   */
  initDoubleClickSimulation: function() {

    // for double click
    this.__lastClickTime = +new Date();

    // for triple click
    this.__lastLastClickTime = +new Date();

    this.lastPointer = {};

    this.on('mousedown', this.onMouseDown.bind(this));
  },

  onMouseDown: function(options) {

    this.__newClickTime = +new Date();
    var newPointer = this.canvas.getPointer(options.e);

    if (this.isTripleClick(newPointer)) {
      this.fire('tripleclick', options);
      this._stopEvent(options.e);
    } else if (this.isDoubleClick(newPointer)) {
      this.fire('dblclick', options);
      this._stopEvent(options.e);
    }

    this.__lastLastClickTime = this.__lastClickTime;
    this.__lastClickTime = this.__newClickTime;
    this.__lastPointer = newPointer;
    this.__lastIsEditing = this.isEditing;
  },

  isDoubleClick: function(newPointer) {
    return this.__newClickTime - this.__lastClickTime < 500 &&
      this.__lastPointer.x === newPointer.x &&
      this.__lastPointer.y === newPointer.y && this.__lastIsEditing;
  },

  isTripleClick: function(newPointer) {
    return this.__newClickTime - this.__lastClickTime < 500 &&
      this.__lastClickTime - this.__lastLastClickTime < 500 &&
      this.__lastPointer.x === newPointer.x &&
      this.__lastPointer.y === newPointer.y;
  },

  /**
   * @private
   */
  _stopEvent: function(e) {
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
  },

  /**
   * Initializes event handlers related to cursor or selection
   */
  initCursorSelectionHandlers: function() {
    this.initSelectedHandler();
    this.initMousedownHandler();
    this.initMousemoveHandler();
    this.initMouseupHandler();
    this.initClicks();
  },

  /**
   * Initializes double and triple click event handlers
   */
  initClicks: function() {
    this.on('dblclick', function(options) {
      this.selectWord(this.getSelectionStartFromPointer(options.e));
    });
    this.on('tripleclick', function(options) {
      this.selectLine(this.getSelectionStartFromPointer(options.e));
    });
  },

  /**
   * Initializes "mousedown" event handler
   */
  initMousedownHandler: function() {
    this.on('mousedown', function(options) {

      var pointer = this.canvas.getPointer(options.e);

      this.__mousedownX = pointer.x;
      this.__mousedownY = pointer.y;
      this.__isMousedown = true;

      if (this.hiddenTextarea && this.canvas) {
        this.canvas.wrapperEl.appendChild(this.hiddenTextarea);
      }

      if (this.selected) {
        this.setCursorByClick(options.e);
      }

      if (this.isEditing) {
        this.__selectionStartOnMouseDown = this.selectionStart;
        this.initDelayedCursor(true);
      }
    });
  },

  /**
   * Initializes "mousemove" event handler
   */
  initMousemoveHandler: function() {
    this.on('mousemove', function(options) {
      if (!this.__isMousedown || !this.isEditing) return;

      var newSelectionStart = this.getSelectionStartFromPointer(options.e);

      if (newSelectionStart >= this.__selectionStartOnMouseDown) {
        this.setSelectionStart(this.__selectionStartOnMouseDown);
        this.setSelectionEnd(newSelectionStart);
      } else {
        this.setSelectionStart(newSelectionStart);
        this.setSelectionEnd(this.__selectionStartOnMouseDown);
      }
    });
  },

  /**
   * @private
   */
  _isObjectMoved: function(e) {
    var pointer = this.canvas.getPointer(e);

    return this.__mousedownX !== pointer.x ||
      this.__mousedownY !== pointer.y;
  },

  /**
   * Initializes "mouseup" event handler
   */
  initMouseupHandler: function() {
    this.on('mouseup', function(options) {
      this.__isMousedown = false;
      if (this._isObjectMoved(options.e)) return;

      if (this.selected) {
        this.enterEditing();
        this.initDelayedCursor(true);
      }
    });
  },

  /**
   * Changes cursor location in a text depending on passed pointer (x/y) object
   * @param {Object} pointer Pointer object with x and y numeric properties
   */
  setCursorByClick: function(e) {
    var newSelectionStart = this.getSelectionStartFromPointer(e);

    if (e.shiftKey) {
      if (newSelectionStart < this.selectionStart) {
        this.setSelectionEnd(this.selectionStart);
        this.setSelectionStart(newSelectionStart);
      } else {
        this.setSelectionEnd(newSelectionStart);
      }
    } else {
      this.setSelectionStart(newSelectionStart);
      this.setSelectionEnd(newSelectionStart);
    }
  },

  /**
   * @private
   * @param {Event} e Event object
   * @param {Object} Object with x/y corresponding to local offset (according to object rotation)
   */
  _getLocalRotatedPointer: function(e) {
    var pointer = this.canvas.getPointer(e),

      pClicked = new fabric.Point(pointer.x, pointer.y),
      pLeftTop = new fabric.Point(this.left, this.top),

      rotated = fabric.util.rotatePoint(
        pClicked, pLeftTop, fabric.util.degreesToRadians(-this.angle));

    return this.getLocalPointer(e, rotated);
  },

  /**
   * Returns index of a character corresponding to where an object was clicked
   * @param {Event} e Event object
   * @return {Number} Index of a character
   */
  getSelectionStartFromPointer: function(e) {

    var mouseOffset = this._getLocalRotatedPointer(e),
      textLines = this.text.split(this._reNewline),
      prevWidth = 0,
      width = 0,
      height = 0,
      charIndex = 0,
      newSelectionStart;

    for (var i = 0, len = textLines.length; i < len; i++) {

      height += this._getHeightOfLine(this.ctx, i) * this.scaleY;

      var widthOfLine = this._getWidthOfLine(this.ctx, i, textLines);
      var lineLeftOffset = this._getLineLeftOffset(widthOfLine);

      width = lineLeftOffset * this.scaleX;

      if (this.flipX) {
        // when oject is horizontally flipped we reverse chars
        textLines[i] = textLines[i].split('').reverse().join('');
      }

      for (var j = 0, jlen = textLines[i].length; j < jlen; j++) {

        var _char = textLines[i][j];
        prevWidth = width;

        width += this._getWidthOfChar(this.ctx, _char, i, this.flipX ? jlen - j : j) *
          this.scaleX;

        if (height <= mouseOffset.y || width <= mouseOffset.x) {
          charIndex++;
          continue;
        }

        return this._getNewSelectionStartFromOffset(
          mouseOffset, prevWidth, width, charIndex + i, jlen);
      }

      if (mouseOffset.y < height) {
        return this._getNewSelectionStartFromOffset(
          mouseOffset, prevWidth, width, charIndex + i, jlen, j);
      }
    }

    // clicked somewhere after all chars, so set at the end
    if (typeof newSelectionStart === 'undefined') {
      return this.text.length;
    }
  },

  /**
   * @private
   */
  _getNewSelectionStartFromOffset: function(mouseOffset, prevWidth, width, index, jlen, j) {

    var distanceBtwLastCharAndCursor = mouseOffset.x - prevWidth,
      distanceBtwNextCharAndCursor = width - mouseOffset.x,
      offset = distanceBtwNextCharAndCursor > distanceBtwLastCharAndCursor ? 0 : 1,
      newSelectionStart = index + offset;

    // if object is horizontally flipped, mirror cursor location from the end
    if (this.flipX) {
      newSelectionStart = jlen - newSelectionStart;
    }

    if (newSelectionStart > this.text.length) {
      newSelectionStart = this.text.length;
    }

    if (j === jlen) {
      newSelectionStart--;
    }

    return newSelectionStart;
  }
});


fabric.util.object.extend(fabric.IText.prototype, /** @lends fabric.IText.prototype */ {

  /**
   * Initializes key handlers
   */
  initKeyHandlers: function() {
    fabric.util.addListener(fabric.document, 'keydown', this.onKeyDown.bind(this));
    fabric.util.addListener(fabric.document, 'keypress', this.onKeyPress.bind(this));
  },

  /**
   * Initializes hidden textarea (needed to bring up keyboard in iOS)
   */
  initHiddenTextarea: function() {
    this.hiddenTextarea = fabric.document.createElement('textarea');

    this.hiddenTextarea.setAttribute('autocapitalize', 'off');
    this.hiddenTextarea.style.cssText = 'position: absolute; top: 0; left: -9999px';

    fabric.document.body.appendChild(this.hiddenTextarea);
  },

  /**
   * @private
   */
  _keysMap: {
    8: 'removeChars',
    13: 'insertNewline',
    37: 'moveCursorLeft',
    38: 'moveCursorUp',
    39: 'moveCursorRight',
    40: 'moveCursorDown',
    46: 'forwardDelete'
  },

  /**
   * @private
   */
  _ctrlKeysMap: {
    65: 'selectAll',
    67: 'copy',
    86: 'paste',
    88: 'cut'
  },

  /**
   * Handles keyup event
   * @param {Event} e Event object
   */
  onKeyDown: function(e) {
    if (!this.isEditing) return;

    if (e.keyCode in this._keysMap) {
      this[this._keysMap[e.keyCode]](e);
    } else if ((e.keyCode in this._ctrlKeysMap) && (e.ctrlKey || e.metaKey)) {
      this[this._ctrlKeysMap[e.keyCode]](e);
    } else {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    this.canvas && this.canvas.renderAll();
  },

  /**
   * Forward delete
   */
  forwardDelete: function(e) {
    if (this.selectionStart === this.selectionEnd) {
      this.moveCursorRight(e);
    }
    this.removeChars(e);
  },

  /**
   * Copies selected text
   */
  copy: function() {
    var selectedText = this.getSelectedText();
    this.copiedText = selectedText;
    this.copiedStyles = this.getSelectionStyles(
      this.selectionStart,
      this.selectionEnd);
  },

  /**
   * Pastes text
   */
  paste: function() {
    if (this.copiedText) {
      this.insertChars(this.copiedText);
    }
  },

  /**
   * Cuts text
   */
  cut: function(e) {
    this.copy();
    this.removeChars(e);
  },

  /**
   * Handles keypress event
   * @param {Event} e Event object
   */
  onKeyPress: function(e) {
    if (!this.isEditing || e.metaKey || e.ctrlKey || e.keyCode === 8 || e.keyCode === 13) {
      return;
    }

    this.insertChars(String.fromCharCode(e.which));

    e.preventDefault();
    e.stopPropagation();
  },

  /**
   * Gets start offset of a selection
   * @return {Number}
   */
  getDownCursorOffset: function(e, isRight) {

    var selectionProp = isRight ? this.selectionEnd : this.selectionStart,
      textLines = this.text.split(this._reNewline),
      _char,
      lineLeftOffset,

      textBeforeCursor = this.text.slice(0, selectionProp),
      textAfterCursor = this.text.slice(selectionProp),

      textOnSameLineBeforeCursor = textBeforeCursor.slice(textBeforeCursor.lastIndexOf('\n') + 1),
      textOnSameLineAfterCursor = textAfterCursor.match(/(.*)\n?/)[1],
      textOnNextLine = (textAfterCursor.match(/.*\n(.*)\n?/) || {})[1] || '',

      cursorLocation = this.get2DCursorLocation(selectionProp);

    // if on last line, down cursor goes to end of line
    if (cursorLocation.lineIndex === textLines.length - 1 || e.metaKey) {

      // move to the end of a text
      return this.text.length - selectionProp;
    }

    var widthOfSameLineBeforeCursor = this._getWidthOfLine(this.ctx, cursorLocation.lineIndex, textLines);
    lineLeftOffset = this._getLineLeftOffset(widthOfSameLineBeforeCursor);

    var widthOfCharsOnSameLineBeforeCursor = lineLeftOffset;
    var lineIndex = cursorLocation.lineIndex;

    for (var i = 0, len = textOnSameLineBeforeCursor.length; i < len; i++) {
      _char = textOnSameLineBeforeCursor[i];
      widthOfCharsOnSameLineBeforeCursor += this._getWidthOfChar(this.ctx, _char, lineIndex, i);
    }

    var indexOnNextLine = this._getIndexOnNextLine(
      cursorLocation, textOnNextLine, widthOfCharsOnSameLineBeforeCursor, textLines);

    return textOnSameLineAfterCursor.length + 1 + indexOnNextLine;
  },

  /**
   * @private
   */
  _getIndexOnNextLine: function(cursorLocation, textOnNextLine, widthOfCharsOnSameLineBeforeCursor, textLines) {

    var lineIndex = cursorLocation.lineIndex + 1;
    var widthOfNextLine = this._getWidthOfLine(this.ctx, lineIndex, textLines);
    var lineLeftOffset = this._getLineLeftOffset(widthOfNextLine);
    var widthOfCharsOnNextLine = lineLeftOffset;
    var indexOnNextLine = 0;
    var foundMatch;

    for (var j = 0, jlen = textOnNextLine.length; j < jlen; j++) {

      var _char = textOnNextLine[j];
      var widthOfChar = this._getWidthOfChar(this.ctx, _char, lineIndex, j);

      widthOfCharsOnNextLine += widthOfChar;

      if (widthOfCharsOnNextLine > widthOfCharsOnSameLineBeforeCursor) {

        foundMatch = true;

        var leftEdge = widthOfCharsOnNextLine - widthOfChar;
        var rightEdge = widthOfCharsOnNextLine;
        var offsetFromLeftEdge = Math.abs(leftEdge - widthOfCharsOnSameLineBeforeCursor);
        var offsetFromRightEdge = Math.abs(rightEdge - widthOfCharsOnSameLineBeforeCursor);

        indexOnNextLine = offsetFromRightEdge < offsetFromLeftEdge ? j + 1 : j;

        break;
      }
    }

    // reached end
    if (!foundMatch) {
      indexOnNextLine = textOnNextLine.length;
    }

    return indexOnNextLine;
  },

  /**
   * Moves cursor down
   * @param {Event} e Event object
   */
  moveCursorDown: function(e) {

    this.abortCursorAnimation();
    this._currentCursorOpacity = 1;

    var offset = this.getDownCursorOffset(e, this._selectionDirection === 'right');

    if (e.shiftKey) {
      this.moveCursorDownWithShift(offset);
    } else {
      this.moveCursorDownWithoutShift(offset);
    }

    this.initDelayedCursor();
  },

  /**
   * Moves cursor down without keeping selection
   * @param {Number} offset
   */
  moveCursorDownWithoutShift: function(offset) {

    this._selectionDirection = 'right';
    this.selectionStart += offset;

    if (this.selectionStart > this.text.length) {
      this.selectionStart = this.text.length;
    }
    this.selectionEnd = this.selectionStart;
  },

  /**
   * Moves cursor down while keeping selection
   * @param {Number} offset
   */
  moveCursorDownWithShift: function(offset) {

    if (this._selectionDirection === 'left' && (this.selectionStart !== this.selectionEnd)) {
      this.selectionStart += offset;
      this._selectionDirection = 'left';
      return;
    } else {
      this._selectionDirection = 'right';
      this.selectionEnd += offset;

      if (this.selectionEnd > this.text.length) {
        this.selectionEnd = this.text.length;
      }
    }
  },

  getUpCursorOffset: function(e, isRight) {

    var selectionProp = isRight ? this.selectionEnd : this.selectionStart,
      cursorLocation = this.get2DCursorLocation(selectionProp);

    // if on first line, up cursor goes to start of line
    if (cursorLocation.lineIndex === 0 || e.metaKey) {
      return selectionProp;
    }

    var textBeforeCursor = this.text.slice(0, selectionProp),
      textOnSameLineBeforeCursor = textBeforeCursor.slice(textBeforeCursor.lastIndexOf('\n') + 1),
      textOnPreviousLine = (textBeforeCursor.match(/\n?(.*)\n.*$/) || {})[1] || '',
      textLines = this.text.split(this._reNewline),
      _char,
      lineLeftOffset;

    var widthOfSameLineBeforeCursor = this._getWidthOfLine(this.ctx, cursorLocation.lineIndex, textLines);
    lineLeftOffset = this._getLineLeftOffset(widthOfSameLineBeforeCursor);

    var widthOfCharsOnSameLineBeforeCursor = lineLeftOffset;
    var lineIndex = cursorLocation.lineIndex;

    for (var i = 0, len = textOnSameLineBeforeCursor.length; i < len; i++) {
      _char = textOnSameLineBeforeCursor[i];
      widthOfCharsOnSameLineBeforeCursor += this._getWidthOfChar(this.ctx, _char, lineIndex, i);
    }

    var indexOnPrevLine = this._getIndexOnPrevLine(
      cursorLocation, textOnPreviousLine, widthOfCharsOnSameLineBeforeCursor, textLines);

    return textOnPreviousLine.length - indexOnPrevLine + textOnSameLineBeforeCursor.length;
  },

  /**
   * @private
   */
  _getIndexOnPrevLine: function(cursorLocation, textOnPreviousLine, widthOfCharsOnSameLineBeforeCursor, textLines) {

    var lineIndex = cursorLocation.lineIndex - 1;
    var widthOfPreviousLine = this._getWidthOfLine(this.ctx, lineIndex, textLines);
    var lineLeftOffset = this._getLineLeftOffset(widthOfPreviousLine);
    var widthOfCharsOnPreviousLine = lineLeftOffset;
    var indexOnPrevLine = 0;
    var foundMatch;

    for (var j = 0, jlen = textOnPreviousLine.length; j < jlen; j++) {

      var _char = textOnPreviousLine[j];
      var widthOfChar = this._getWidthOfChar(this.ctx, _char, lineIndex, j);

      widthOfCharsOnPreviousLine += widthOfChar;

      if (widthOfCharsOnPreviousLine > widthOfCharsOnSameLineBeforeCursor) {

        foundMatch = true;

        var leftEdge = widthOfCharsOnPreviousLine - widthOfChar;
        var rightEdge = widthOfCharsOnPreviousLine;
        var offsetFromLeftEdge = Math.abs(leftEdge - widthOfCharsOnSameLineBeforeCursor);
        var offsetFromRightEdge = Math.abs(rightEdge - widthOfCharsOnSameLineBeforeCursor);

        indexOnPrevLine = offsetFromRightEdge < offsetFromLeftEdge ? j : (j - 1);

        break;
      }
    }

    // reached end
    if (!foundMatch) {
      indexOnPrevLine = textOnPreviousLine.length - 1;
    }

    return indexOnPrevLine;
  },

  /**
   * Moves cursor up
   * @param {Event} e Event object
   */
  moveCursorUp: function(e) {

    this.abortCursorAnimation();
    this._currentCursorOpacity = 1;

    var offset = this.getUpCursorOffset(e, this._selectionDirection === 'right');

    if (e.shiftKey) {
      this.moveCursorUpWithShift(offset);
    } else {
      this.moveCursorUpWithoutShift(offset);
    }

    this.initDelayedCursor();
  },

  /**
   * Moves cursor up with shift
   * @param {Number} offset
   */
  moveCursorUpWithShift: function(offset) {

    if (this.selectionStart === this.selectionEnd) {
      this.selectionStart -= offset;
    } else {
      if (this._selectionDirection === 'right') {
        this.selectionEnd -= offset;
        this._selectionDirection = 'right';
        return;
      } else {
        this.selectionStart -= offset;
      }
    }

    if (this.selectionStart < 0) {
      this.selectionStart = 0;
    }

    this._selectionDirection = 'left';
  },

  /**
   * Moves cursor up without shift
   * @param {Number} offset
   */
  moveCursorUpWithoutShift: function(offset) {
    if (this.selectionStart === this.selectionEnd) {
      this.selectionStart -= offset;
    }
    if (this.selectionStart < 0) {
      this.selectionStart = 0;
    }
    this.selectionEnd = this.selectionStart;

    this._selectionDirection = 'left';
  },

  /**
   * Moves cursor left
   * @param {Event} e Event object
   */
  moveCursorLeft: function(e) {
    if (this.selectionStart === 0 && this.selectionEnd === 0) return;

    this.abortCursorAnimation();
    this._currentCursorOpacity = 1;

    if (e.shiftKey) {
      this.moveCursorLeftWithShift(e);
    } else {
      this.moveCursorLeftWithoutShift(e);
    }

    this.initDelayedCursor();
  },

  /**
   * @private
   */
  _move: function(e, prop, direction) {
    if (e.altKey) {
      this[prop] = this['findWordBoundary' + direction](this[prop]);
    } else if (e.metaKey) {
      this[prop] = this['findLineBoundary' + direction](this[prop]);
    } else {
      this[prop] += (direction === 'Left' ? -1 : 1);
    }
  },

  /**
   * @private
   */
  _moveLeft: function(e, prop) {
    this._move(e, prop, 'Left');
  },

  /**
   * @private
   */
  _moveRight: function(e, prop) {
    this._move(e, prop, 'Right');
  },

  /**
   * Moves cursor left without keeping selection
   * @param {Event} e
   */
  moveCursorLeftWithoutShift: function(e) {
    this._selectionDirection = 'left';

    // only move cursor when there is no selection,
    // otherwise we discard it, and leave cursor on same place
    if (this.selectionEnd === this.selectionStart) {
      this._moveLeft(e, 'selectionStart');
    }
    this.selectionEnd = this.selectionStart;
  },

  /**
   * Moves cursor left while keeping selection
   * @param {Event} e
   */
  moveCursorLeftWithShift: function(e) {
    if (this._selectionDirection === 'right' && this.selectionStart !== this.selectionEnd) {
      this._moveLeft(e, 'selectionEnd');
    } else {
      this._selectionDirection = 'left';
      this._moveLeft(e, 'selectionStart');

      // increase selection by one if it's a newline
      if (this.text.charAt(this.selectionStart) === '\n') {
        this.selectionStart--;
      }
      if (this.selectionStart < 0) {
        this.selectionStart = 0;
      }
    }
  },

  /**
   * Moves cursor right
   * @param {Event} e Event object
   */
  moveCursorRight: function(e) {
    if (this.selectionStart >= this.text.length && this.selectionEnd >= this.text.length) return;

    this.abortCursorAnimation();
    this._currentCursorOpacity = 1;

    if (e.shiftKey) {
      this.moveCursorRightWithShift(e);
    } else {
      this.moveCursorRightWithoutShift(e);
    }

    this.initDelayedCursor();
  },

  /**
   * Moves cursor right while keeping selection
   * @param {Event} e
   */
  moveCursorRightWithShift: function(e) {
    if (this._selectionDirection === 'left' && this.selectionStart !== this.selectionEnd) {
      this._moveRight(e, 'selectionStart');
    } else {
      this._selectionDirection = 'right';
      this._moveRight(e, 'selectionEnd');

      // increase selection by one if it's a newline
      if (this.text.charAt(this.selectionEnd - 1) === '\n') {
        this.selectionEnd++;
      }
      if (this.selectionEnd > this.text.length) {
        this.selectionEnd = this.text.length;
      }
    }
  },

  /**
   * Moves cursor right without keeping selection
   * @param {Event} e
   */
  moveCursorRightWithoutShift: function(e) {
    this._selectionDirection = 'right';

    if (this.selectionStart === this.selectionEnd) {
      this._moveRight(e, 'selectionStart');
      this.selectionEnd = this.selectionStart;
    } else {
      this.selectionEnd += this.getNumNewLinesInSelectedText();
      if (this.selectionEnd > this.text.length) {
        this.selectionEnd = this.text.length;
      }
      this.selectionStart = this.selectionEnd;
    }
  },

  /**
   * Inserts a character where cursor is (replacing selection if one exists)
   */
  removeChars: function(e) {
    if (this.selectionStart === this.selectionEnd) {
      this._removeCharsNearCursor(e);
    } else {
      this._removeCharsFromTo(this.selectionStart, this.selectionEnd);
    }

    this.selectionEnd = this.selectionStart;

    this._removeExtraneousStyles();

    if (this.canvas) {
      // TODO: double renderAll gets rid of text box shift happenning sometimes
      // need to find out what exactly causes it and fix it
      this.canvas.renderAll().renderAll();
    }

    this.setCoords();
    this.fire('changed');
    this.canvas && this.canvas.fire('text:changed', {
      target: this
    });
  },

  /**
   * @private
   */
  _removeCharsNearCursor: function(e) {
    if (this.selectionStart !== 0) {

      if (e.metaKey) {
        // remove all till the start of current line
        var leftLineBoundary = this.findLineBoundaryLeft(this.selectionStart);

        this._removeCharsFromTo(leftLineBoundary, this.selectionStart);
        this.selectionStart = leftLineBoundary;
      } else if (e.altKey) {
        // remove all till the start of current word
        var leftWordBoundary = this.findWordBoundaryLeft(this.selectionStart);

        this._removeCharsFromTo(leftWordBoundary, this.selectionStart);
        this.selectionStart = leftWordBoundary;
      } else {
        var isBeginningOfLine = this.text.slice(this.selectionStart - 1, this.selectionStart) === '\n';
        this.removeStyleObject(isBeginningOfLine);

        this.selectionStart--;
        this.text = this.text.slice(0, this.selectionStart) +
          this.text.slice(this.selectionStart + 1);
      }
    }
  }
});


/* _TO_SVG_START_ */
fabric.util.object.extend(fabric.IText.prototype, /** @lends fabric.IText.prototype */ {

  /**
   * @private
   */
  _setSVGTextLineText: function(textLine, lineIndex, textSpans, lineHeight, lineTopOffsetMultiplier, textBgRects) {
    if (!this.styles[lineIndex]) {
      this.callSuper('_setSVGTextLineText',
        textLine, lineIndex, textSpans, lineHeight, lineTopOffsetMultiplier);
    } else {
      this._setSVGTextLineChars(
        textLine, lineIndex, textSpans, lineHeight, lineTopOffsetMultiplier, textBgRects);
    }
  },

  /**
   * @private
   */
  _setSVGTextLineChars: function(textLine, lineIndex, textSpans, lineHeight, lineTopOffsetMultiplier, textBgRects) {

    var yProp = lineIndex === 0 || this.useNative ? 'y' : 'dy',
      chars = textLine.split(''),
      charOffset = 0,
      lineLeftOffset = this._getSVGLineLeftOffset(lineIndex),
      lineTopOffset = this._getSVGLineTopOffset(lineIndex),
      heightOfLine = this._getHeightOfLine(this.ctx, lineIndex);

    for (var i = 0, len = chars.length; i < len; i++) {
      var styleDecl = this.styles[lineIndex][i] || {};

      textSpans.push(
        this._createTextCharSpan(
          chars[i], styleDecl, lineLeftOffset, lineTopOffset, yProp, charOffset));

      var charWidth = this._getWidthOfChar(this.ctx, chars[i], lineIndex, i);

      if (styleDecl.textBackgroundColor) {
        textBgRects.push(
          this._createTextCharBg(
            styleDecl, lineLeftOffset, lineTopOffset, heightOfLine, charWidth, charOffset));
      }

      charOffset += charWidth;
    }
  },

  /**
   * @private
   */
  _getSVGLineLeftOffset: function(lineIndex) {
    return (this._boundaries && this._boundaries[lineIndex]) ? fabric.util.toFixed(this._boundaries[lineIndex].left, 2) : 0;
  },

  /**
   * @private
   */
  _getSVGLineTopOffset: function(lineIndex) {
    var lineTopOffset = 0;
    for (var j = 0; j <= lineIndex; j++) {
      lineTopOffset += this._getHeightOfLine(this.ctx, j);
    }
    return lineTopOffset - this.height / 2;
  },

  /**
   * @private
   */
  _createTextCharBg: function(styleDecl, lineLeftOffset, lineTopOffset, heightOfLine, charWidth, charOffset) {
    return [
      '<rect fill="', styleDecl.textBackgroundColor,
      '" transform="translate(', -this.width / 2, ' ', -this.height + heightOfLine, ')',
      '" x="', lineLeftOffset + charOffset,
      '" y="', lineTopOffset + heightOfLine,
      '" width="', charWidth,
      '" height="', heightOfLine,
      '"></rect>'
    ].join('');
  },

  /**
   * @private
   */
  _createTextCharSpan: function(_char, styleDecl, lineLeftOffset, lineTopOffset, yProp, charOffset) {

    var fillStyles = this.getSvgStyles.call(fabric.util.object.extend({
      visible: true,
      fill: this.fill,
      stroke: this.stroke,
      type: 'text'
    }, styleDecl));

    return [
      '<tspan x="', lineLeftOffset + charOffset, '" ',
      yProp, '="', lineTopOffset, '" ',

      (styleDecl.fontFamily ? 'font-family="' + styleDecl.fontFamily.replace(/"/g, '\'') + '" ' : ''), (styleDecl.fontSize ? 'font-size="' + styleDecl.fontSize + '" ' : ''), (styleDecl.fontStyle ? 'font-style="' + styleDecl.fontStyle + '" ' : ''), (styleDecl.fontWeight ? 'font-weight="' + styleDecl.fontWeight + '" ' : ''), (styleDecl.textDecoration ? 'text-decoration="' + styleDecl.textDecoration + '" ' : ''),
      'style="', fillStyles, '">',

      fabric.util.string.escapeXml(_char),
      '</tspan>'
    ].join('');
  }
});
/* _TO_SVG_END_ */


(function() {

  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    return;
  }

  var DOMParser = new require('xmldom').DOMParser,
    URL = require('url'),
    HTTP = require('http'),
    HTTPS = require('https'),

    Canvas = require('canvas'),
    Image = require('canvas').Image;

  /** @private */
  function request(url, encoding, callback) {
    var oURL = URL.parse(url);

    // detect if http or https is used
    if (!oURL.port) {
      oURL.port = (oURL.protocol.indexOf('https:') === 0) ? 443 : 80;
    }

    // assign request handler based on protocol
    var reqHandler = (oURL.port === 443) ? HTTPS : HTTP;

    var req = reqHandler.request({
      hostname: oURL.hostname,
      port: oURL.port,
      path: oURL.path,
      method: 'GET'
    }, function(response) {
      var body = "";
      if (encoding) {
        response.setEncoding(encoding);
      }
      response.on('end', function() {
        callback(body);
      });
      response.on('data', function(chunk) {
        if (response.statusCode === 200) {
          body += chunk;
        }
      });
    });

    req.on('error', function(err) {
      if (err.errno === process.ECONNREFUSED) {
        fabric.log('ECONNREFUSED: connection refused to ' + oURL.hostname + ':' + oURL.port);
      } else {
        fabric.log(err.message);
      }
    });

    req.end();
  }

  /** @private */
  function request_fs(path, callback) {
    var fs = require('fs');
    fs.readFile(path, function(err, data) {
      if (err) {
        fabric.log(err);
        throw err;
      } else {
        callback(data);
      }
    });
  }

  fabric.util.loadImage = function(url, callback, context) {
    var createImageAndCallBack = function(data) {
      img.src = new Buffer(data, 'binary');
      // preserving original url, which seems to be lost in node-canvas
      img._src = url;
      callback && callback.call(context, img);
    };
    var img = new Image();
    if (url && (url instanceof Buffer || url.indexOf('data') === 0)) {
      img.src = img._src = url;
      callback && callback.call(context, img);
    } else if (url && url.indexOf('http') !== 0) {
      request_fs(url, createImageAndCallBack);
    } else if (url) {
      request(url, 'binary', createImageAndCallBack);
    } else {
      callback && callback.call(context, url);
    }
  };

  fabric.loadSVGFromURL = function(url, callback, reviver) {
    url = url.replace(/^\n\s*/, '').replace(/\?.*$/, '').trim();
    if (url.indexOf('http') !== 0) {
      request_fs(url, function(body) {
        fabric.loadSVGFromString(body, callback, reviver);
      });
    } else {
      request(url, '', function(body) {
        fabric.loadSVGFromString(body, callback, reviver);
      });
    }
  };

  fabric.loadSVGFromString = function(string, callback, reviver) {
    var doc = new DOMParser().parseFromString(string);
    fabric.parseSVGDocument(doc.documentElement, function(results, options) {
      callback && callback(results, options);
    }, reviver);
  };

  fabric.util.getScript = function(url, callback) {
    request(url, '', function(body) {
      eval(body);
      callback && callback();
    });
  };

  fabric.Image.fromObject = function(object, callback) {
    fabric.util.loadImage(object.src, function(img) {
      var oImg = new fabric.Image(img);

      oImg._initConfig(object);
      oImg._initFilters(object, function(filters) {
        oImg.filters = filters || [];
        callback && callback(oImg);
      });
    });
  };

  /**
   * Only available when running fabric on node.js
   * @param width Canvas width
   * @param height Canvas height
   * @param {Object} options to pass to FabricCanvas.
   * @return {Object} wrapped canvas instance
   */
  fabric.createCanvasForNode = function(width, height, options) {

    var canvasEl = fabric.document.createElement('canvas'),
      nodeCanvas = new Canvas(width || 600, height || 600);

    // jsdom doesn't create style on canvas element, so here be temp. workaround
    canvasEl.style = {};

    canvasEl.width = nodeCanvas.width;
    canvasEl.height = nodeCanvas.height;

    var FabricCanvas = fabric.Canvas || fabric.StaticCanvas;
    var fabricCanvas = new FabricCanvas(canvasEl, options);
    fabricCanvas.contextContainer = nodeCanvas.getContext('2d');
    fabricCanvas.nodeCanvas = nodeCanvas;
    fabricCanvas.Font = Canvas.Font;

    return fabricCanvas;
  };

  /** @ignore */
  fabric.StaticCanvas.prototype.createPNGStream = function() {
    return this.nodeCanvas.createPNGStream();
  };

  fabric.StaticCanvas.prototype.createJPEGStream = function(opts) {
    return this.nodeCanvas.createJPEGStream(opts);
  };

  var origSetWidth = fabric.StaticCanvas.prototype.setWidth;
  fabric.StaticCanvas.prototype.setWidth = function(width) {
    origSetWidth.call(this, width);
    this.nodeCanvas.width = width;
    return this;
  };
  if (fabric.Canvas) {
    fabric.Canvas.prototype.setWidth = fabric.StaticCanvas.prototype.setWidth;
  }

  var origSetHeight = fabric.StaticCanvas.prototype.setHeight;
  fabric.StaticCanvas.prototype.setHeight = function(height) {
    origSetHeight.call(this, height);
    this.nodeCanvas.height = height;
    return this;
  };
  if (fabric.Canvas) {
    fabric.Canvas.prototype.setHeight = fabric.StaticCanvas.prototype.setHeight;
  }

})();
