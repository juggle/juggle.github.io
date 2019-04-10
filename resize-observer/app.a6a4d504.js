// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"node_modules/@juggle/resize-observer/lib/utils/prettify.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prettifyConsoleOutput = exports.POLYFILL_CONSOLE_OUTPUT = void 0;
const POLYFILL_CONSOLE_OUTPUT = 'function ResizeObserver () { [polyfill code] }';
exports.POLYFILL_CONSOLE_OUTPUT = POLYFILL_CONSOLE_OUTPUT;

const prettifyConsoleOutput = fn => {
  fn.toString = function () {
    return POLYFILL_CONSOLE_OUTPUT;
  };

  return fn;
};

exports.prettifyConsoleOutput = prettifyConsoleOutput;
},{}],"node_modules/@juggle/resize-observer/lib/utils/scheduler.js":[function(require,module,exports) {

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scheduler = void 0;

var _ResizeObserverController = require("../ResizeObserverController");

var _prettify = require("./prettify");

const CATCH_FRAMES = 60 / 5;
const requestAnimationFrame = window.requestAnimationFrame;
const observerConfig = {
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true
};
const events = ['resize', 'load', 'transitionend', 'animationend', 'animationstart', 'animationiteration', 'keyup', 'keydown', 'mouseup', 'mousedown', 'mouseover', 'mouseout', 'blur', 'focus'];
const rafSlot = new Map();
const resizeObserverSlot = new Map();
let scheduled;

const dispatchCallbacksOnNextFrame = () => {
  if (scheduled) {
    return;
  }

  scheduled = true;

  function runSchedule(t) {
    scheduled = false;
    const frameCallbacks = [];
    const resizeObserverCallbacks = [];
    rafSlot.forEach(callback => frameCallbacks.push(callback));
    resizeObserverSlot.forEach(callback => resizeObserverCallbacks.push(callback));
    rafSlot.clear();
    resizeObserverSlot.clear();

    try {
      for (let callback of frameCallbacks) {
        callback(t);
      }
    } finally {
      for (let callback of resizeObserverCallbacks) {
        callback(t);
      }
    }
  }

  ;
  requestAnimationFrame(runSchedule);
};

class Scheduler {
  constructor() {
    this.stopped = true;

    this.listener = () => this.schedule();
  }

  run(frames) {
    const scheduler = this;
    resizeObserverSlot.set(this, function ResizeObserver() {
      let elementsHaveResized = false;

      try {
        elementsHaveResized = (0, _ResizeObserverController.process)();
      } finally {
        if (elementsHaveResized) {
          scheduler.run(60);
        } else if (frames) {
          scheduler.run(frames - 1);
        } else {
          scheduler.start();
        }
      }
    });
    dispatchCallbacksOnNextFrame();
  }

  schedule() {
    this.stop();
    this.run(CATCH_FRAMES);
  }

  observe() {
    const cb = () => this.observer && this.observer.observe(document.body, observerConfig);

    document.body ? cb() : window.addEventListener('DOMContentLoaded', cb);
  }

  start() {
    if (this.stopped) {
      this.stopped = false;

      if ('MutationObserver' in window) {
        this.observer = new MutationObserver(this.listener);
        this.observe();
      }

      events.forEach(name => window.addEventListener(name, this.listener, true));
    }
  }

  stop() {
    if (!this.stopped) {
      this.observer && this.observer.disconnect();
      events.forEach(name => window.removeEventListener(name, this.listener, true));
      this.stopped = true;
    }
  }

}

const scheduler = new Scheduler();
exports.scheduler = scheduler;
let rafIdBase = 0;

window.requestAnimationFrame = function (callback) {
  if (typeof callback !== 'function') {
    throw new Error('requestAnimationFrame expects 1 callback argument of type function.');
  }

  const handle = rafIdBase += 1;
  rafSlot.set(handle, function AnimationFrame(t) {
    return callback(t);
  });
  dispatchCallbacksOnNextFrame();
  return handle;
};

window.cancelAnimationFrame = function (handle) {
  rafSlot.delete(handle);
};

(0, _prettify.prettifyConsoleOutput)(window.requestAnimationFrame);
(0, _prettify.prettifyConsoleOutput)(window.cancelAnimationFrame);
},{"../ResizeObserverController":"node_modules/@juggle/resize-observer/lib/ResizeObserverController.js","./prettify":"node_modules/@juggle/resize-observer/lib/utils/prettify.js"}],"node_modules/@juggle/resize-observer/lib/ResizeObserverBoxOptions.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResizeObserverBoxOptions = void 0;
var ResizeObserverBoxOptions;
exports.ResizeObserverBoxOptions = ResizeObserverBoxOptions;

(function (ResizeObserverBoxOptions) {
  ResizeObserverBoxOptions["BORDER_BOX"] = "border-box";
  ResizeObserverBoxOptions["CONTENT_BOX"] = "content-box";
  ResizeObserverBoxOptions["SCROLL_BOX"] = "scroll-box";
  ResizeObserverBoxOptions["DEVICE_PIXEL_BORDER_BOX"] = "device-pixel-border-box";
})(ResizeObserverBoxOptions || (exports.ResizeObserverBoxOptions = ResizeObserverBoxOptions = {}));
},{}],"node_modules/@juggle/resize-observer/lib/DOMRectReadOnly.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DOMRectReadOnly = void 0;

class DOMRectReadOnly {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.top = this.y;
    this.left = this.x;
    this.bottom = this.top + this.height;
    this.right = this.left + this.width;
    return Object.freeze(this);
  }

  static fromRect(rectangle) {
    return new DOMRectReadOnly(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  }

}

exports.DOMRectReadOnly = DOMRectReadOnly;
},{}],"node_modules/@juggle/resize-observer/lib/utils/element.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isHidden = exports.isSVG = void 0;

const isSVG = target => target instanceof SVGElement && 'getBBox' in target;

exports.isSVG = isSVG;

const isHidden = target => {
  if (isSVG(target)) {
    const {
      width,
      height
    } = target.getBBox();
    return !width && !height;
  }

  const {
    offsetWidth,
    offsetHeight
  } = target;
  return !(offsetWidth || offsetHeight || target.getClientRects().length);
};

exports.isHidden = isHidden;
},{}],"node_modules/@juggle/resize-observer/lib/algorithms/calculateBoxSize.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cache = exports.calculateBoxSizes = exports.calculateBoxSize = void 0;

var _ResizeObserverBoxOptions = require("../ResizeObserverBoxOptions");

var _DOMRectReadOnly = require("../DOMRectReadOnly");

var _element = require("../utils/element");

const cache = new Map();
exports.cache = cache;
const scrollRegexp = /auto|scroll/;
const IE = /msie|trident/i.test(navigator.userAgent);

const parseDimension = pixel => parseFloat(pixel || '0');

const size = (inlineSize = 0, blockSize = 0) => {
  return Object.freeze({
    inlineSize,
    blockSize
  });
};

const zeroBoxes = Object.freeze({
  borderBoxSize: size(),
  contentBoxSize: size(),
  scrollBoxSize: size(),
  devicePixelBorderBoxSize: size(),
  contentRect: new _DOMRectReadOnly.DOMRectReadOnly(0, 0, 0, 0)
});

const calculateBoxSizes = target => {
  if (cache.has(target)) {
    return cache.get(target);
  }

  if ((0, _element.isHidden)(target)) {
    cache.set(target, zeroBoxes);
    return zeroBoxes;
  }

  const cs = getComputedStyle(target);
  const dpr = window.devicePixelRatio;
  const svg = (0, _element.isSVG)(target) && target.getBBox();
  const removePadding = !IE && cs.boxSizing === 'border-box';
  const canScrollVertically = !svg && scrollRegexp.test(cs.overflowY || '');
  const canScrollHorizontally = !svg && scrollRegexp.test(cs.overflowX || '');
  const paddingTop = svg ? 0 : parseDimension(cs.paddingTop);
  const paddingRight = svg ? 0 : parseDimension(cs.paddingRight);
  const paddingBottom = svg ? 0 : parseDimension(cs.paddingBottom);
  const paddingLeft = svg ? 0 : parseDimension(cs.paddingLeft);
  const borderTop = svg ? 0 : parseDimension(cs.borderTopWidth);
  const borderRight = svg ? 0 : parseDimension(cs.borderRightWidth);
  const borderBottom = svg ? 0 : parseDimension(cs.borderBottomWidth);
  const borderLeft = svg ? 0 : parseDimension(cs.borderLeftWidth);
  const horizontalPadding = paddingLeft + paddingRight;
  const verticalPadding = paddingTop + paddingBottom;
  const horizontalBorderArea = borderLeft + borderRight;
  const verticalBorderArea = borderTop + borderBottom;
  const horizontalScrollbarThickness = !canScrollHorizontally ? 0 : target.offsetHeight - verticalBorderArea - target.clientHeight;
  const verticalScrollbarThickness = !canScrollVertically ? 0 : target.offsetWidth - horizontalBorderArea - target.clientWidth;
  const widthReduction = removePadding ? horizontalPadding + horizontalBorderArea : 0;
  const heightReduction = removePadding ? verticalPadding + verticalBorderArea : 0;
  const contentWidth = svg ? svg.width : parseDimension(cs.width) - widthReduction - verticalScrollbarThickness;
  const contentHeight = svg ? svg.height : parseDimension(cs.height) - heightReduction - horizontalScrollbarThickness;
  const borderBoxWidth = contentWidth + horizontalPadding + verticalScrollbarThickness + horizontalBorderArea;
  const borderBoxHeight = contentHeight + verticalPadding + horizontalScrollbarThickness + verticalBorderArea;
  const boxes = Object.freeze({
    borderBoxSize: size(borderBoxWidth, borderBoxHeight),
    contentBoxSize: size(contentWidth, contentHeight),
    scrollBoxSize: size(contentWidth + horizontalPadding, contentHeight + verticalPadding),
    devicePixelBorderBoxSize: size(borderBoxWidth * dpr, borderBoxHeight * dpr),
    contentRect: new _DOMRectReadOnly.DOMRectReadOnly(paddingLeft, paddingTop, contentWidth, contentHeight)
  });
  cache.set(target, boxes);
  return boxes;
};

exports.calculateBoxSizes = calculateBoxSizes;

const calculateBoxSize = (target, observedBox) => {
  const boxes = calculateBoxSizes(target);

  switch (observedBox) {
    case _ResizeObserverBoxOptions.ResizeObserverBoxOptions.BORDER_BOX:
      return boxes.borderBoxSize;

    case _ResizeObserverBoxOptions.ResizeObserverBoxOptions.SCROLL_BOX:
      return boxes.scrollBoxSize;

    case _ResizeObserverBoxOptions.ResizeObserverBoxOptions.DEVICE_PIXEL_BORDER_BOX:
      return boxes.devicePixelBorderBoxSize;

    case _ResizeObserverBoxOptions.ResizeObserverBoxOptions.CONTENT_BOX:
    default:
      return boxes.contentBoxSize;
  }
};

exports.calculateBoxSize = calculateBoxSize;
},{"../ResizeObserverBoxOptions":"node_modules/@juggle/resize-observer/lib/ResizeObserverBoxOptions.js","../DOMRectReadOnly":"node_modules/@juggle/resize-observer/lib/DOMRectReadOnly.js","../utils/element":"node_modules/@juggle/resize-observer/lib/utils/element.js"}],"node_modules/@juggle/resize-observer/lib/ResizeObservation.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResizeObservation = void 0;

var _ResizeObserverBoxOptions = require("./ResizeObserverBoxOptions");

var _calculateBoxSize = require("./algorithms/calculateBoxSize");

class ResizeObservation {
  constructor(target, observedBox) {
    this.target = target;
    this.observedBox = observedBox || _ResizeObserverBoxOptions.ResizeObserverBoxOptions.CONTENT_BOX;
    this.lastReportedSize = {
      inlineSize: 0,
      blockSize: 0
    };
  }

  isActive() {
    const size = (0, _calculateBoxSize.calculateBoxSize)(this.target, this.observedBox);
    return this.lastReportedSize.inlineSize !== size.inlineSize || this.lastReportedSize.blockSize !== size.blockSize;
  }

}

exports.ResizeObservation = ResizeObservation;
},{"./ResizeObserverBoxOptions":"node_modules/@juggle/resize-observer/lib/ResizeObserverBoxOptions.js","./algorithms/calculateBoxSize":"node_modules/@juggle/resize-observer/lib/algorithms/calculateBoxSize.js"}],"node_modules/@juggle/resize-observer/lib/ResizeObserverDetail.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResizeObserverDetail = void 0;

class ResizeObserverDetail {
  constructor(resizeObserver, callback) {
    this.activeTargets = [];
    this.skippedTargets = [];
    this.observationTargets = [];
    this.observer = resizeObserver;
    this.callback = callback;
  }

}

exports.ResizeObserverDetail = ResizeObserverDetail;
},{}],"node_modules/@juggle/resize-observer/lib/algorithms/hasActiveObservations.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasActiveObservations = void 0;

var _ResizeObserverController = require("../ResizeObserverController");

const hasActiveObservations = () => {
  return _ResizeObserverController.resizeObservers.some(ro => ro.activeTargets.length > 0);
};

exports.hasActiveObservations = hasActiveObservations;
},{"../ResizeObserverController":"node_modules/@juggle/resize-observer/lib/ResizeObserverController.js"}],"node_modules/@juggle/resize-observer/lib/algorithms/hasSkippedObservations.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasSkippedObservations = void 0;

var _ResizeObserverController = require("../ResizeObserverController");

const hasSkippedObservations = () => {
  return _ResizeObserverController.resizeObservers.some(ro => ro.skippedTargets.length > 0);
};

exports.hasSkippedObservations = hasSkippedObservations;
},{"../ResizeObserverController":"node_modules/@juggle/resize-observer/lib/ResizeObserverController.js"}],"node_modules/@juggle/resize-observer/lib/algorithms/deliverResizeLoopError.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deliverResizeLoopError = void 0;
const msg = 'ResizeObserver loop completed with undelivered notifications.';

const deliverResizeLoopError = () => {
  let event;

  if (typeof ErrorEvent === 'function') {
    event = new ErrorEvent('error', {
      message: msg
    });
  } else {
    event = document.createEvent('Event');
    event.initEvent('error', false, false);
    event.message = msg;
  }

  window.dispatchEvent(event);
};

exports.deliverResizeLoopError = deliverResizeLoopError;
},{}],"node_modules/@juggle/resize-observer/lib/ResizeObserverEntry.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResizeObserverEntry = void 0;

var _calculateBoxSize = require("./algorithms/calculateBoxSize");

class ResizeObserverEntry {
  constructor(target) {
    const boxes = (0, _calculateBoxSize.calculateBoxSizes)(target);
    this.target = target;
    this.contentRect = boxes.contentRect;
    this.borderBoxSize = boxes.borderBoxSize;
    this.contentSize = boxes.contentBoxSize;
    this.scrollSize = boxes.scrollBoxSize;
    this.devicePixelBorderBoxSize = boxes.devicePixelBorderBoxSize;
  }

}

exports.ResizeObserverEntry = ResizeObserverEntry;
},{"./algorithms/calculateBoxSize":"node_modules/@juggle/resize-observer/lib/algorithms/calculateBoxSize.js"}],"node_modules/@juggle/resize-observer/lib/algorithms/calculateDepthForNode.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calculateDepthForNode = void 0;

var _element = require("../utils/element");

const calculateDepthForNode = node => {
  if ((0, _element.isHidden)(node)) {
    return Infinity;
  }

  let depth = 0;
  let parent = node.parentNode;

  while (parent) {
    depth += 1;
    parent = parent.parentNode;
  }

  return depth;
};

exports.calculateDepthForNode = calculateDepthForNode;
},{"../utils/element":"node_modules/@juggle/resize-observer/lib/utils/element.js"}],"node_modules/@juggle/resize-observer/lib/algorithms/broadcastActiveObservations.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.broadcastActiveObservations = void 0;

var _ResizeObserverController = require("../ResizeObserverController");

var _ResizeObserverEntry = require("../ResizeObserverEntry");

var _calculateDepthForNode = require("./calculateDepthForNode");

var _calculateBoxSize = require("./calculateBoxSize");

const broadcastActiveObservations = () => {
  let shallowestDepth = Infinity;
  const callbacks = [];

  _ResizeObserverController.resizeObservers.forEach(function processObserver(ro) {
    if (ro.activeTargets.length === 0) {
      return;
    }

    const entries = [];
    ro.activeTargets.forEach(function processTarget(ot) {
      const entry = new _ResizeObserverEntry.ResizeObserverEntry(ot.target);
      const targetDepth = (0, _calculateDepthForNode.calculateDepthForNode)(ot.target);
      entries.push(entry);
      ot.lastReportedSize = (0, _calculateBoxSize.calculateBoxSize)(ot.target, ot.observedBox);

      if (targetDepth < shallowestDepth) {
        shallowestDepth = targetDepth;
      }
    });
    callbacks.push(function resizeObserverCallback() {
      ro.callback(entries, ro.observer);
    });
    ro.activeTargets.splice(0, ro.activeTargets.length);
  });

  for (let callback of callbacks) {
    callback();
  }

  return shallowestDepth;
};

exports.broadcastActiveObservations = broadcastActiveObservations;
},{"../ResizeObserverController":"node_modules/@juggle/resize-observer/lib/ResizeObserverController.js","../ResizeObserverEntry":"node_modules/@juggle/resize-observer/lib/ResizeObserverEntry.js","./calculateDepthForNode":"node_modules/@juggle/resize-observer/lib/algorithms/calculateDepthForNode.js","./calculateBoxSize":"node_modules/@juggle/resize-observer/lib/algorithms/calculateBoxSize.js"}],"node_modules/@juggle/resize-observer/lib/algorithms/gatherActiveObservationsAtDepth.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.gatherActiveObservationsAtDepth = void 0;

var _ResizeObserverController = require("../ResizeObserverController");

var _calculateDepthForNode = require("./calculateDepthForNode");

var _calculateBoxSize = require("./calculateBoxSize");

const gatherActiveObservationsAtDepth = depth => {
  _calculateBoxSize.cache.clear();

  _ResizeObserverController.resizeObservers.forEach(function processObserver(ro) {
    ro.activeTargets.splice(0, ro.activeTargets.length);
    ro.skippedTargets.splice(0, ro.skippedTargets.length);
    ro.observationTargets.forEach(function processTarget(ot) {
      if (ot.isActive()) {
        if ((0, _calculateDepthForNode.calculateDepthForNode)(ot.target) > depth) {
          ro.activeTargets.push(ot);
        } else {
          ro.skippedTargets.push(ot);
        }
      }
    });
  });
};

exports.gatherActiveObservationsAtDepth = gatherActiveObservationsAtDepth;
},{"../ResizeObserverController":"node_modules/@juggle/resize-observer/lib/ResizeObserverController.js","./calculateDepthForNode":"node_modules/@juggle/resize-observer/lib/algorithms/calculateDepthForNode.js","./calculateBoxSize":"node_modules/@juggle/resize-observer/lib/algorithms/calculateBoxSize.js"}],"node_modules/@juggle/resize-observer/lib/ResizeObserverController.js":[function(require,module,exports) {

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.process = exports.resizeObservers = exports.ResizeObserverController = void 0;

var _scheduler = require("./utils/scheduler");

var _ResizeObservation = require("./ResizeObservation");

var _ResizeObserverDetail = require("./ResizeObserverDetail");

var _hasActiveObservations = require("./algorithms/hasActiveObservations");

var _hasSkippedObservations = require("./algorithms/hasSkippedObservations");

var _deliverResizeLoopError = require("./algorithms/deliverResizeLoopError");

var _broadcastActiveObservations = require("./algorithms/broadcastActiveObservations");

var _gatherActiveObservationsAtDepth = require("./algorithms/gatherActiveObservationsAtDepth");

const resizeObservers = [];
exports.resizeObservers = resizeObservers;
const observerMap = new Map();
let watching = 0;

const updateCount = n => {
  !watching && n > 0 && _scheduler.scheduler.start();
  watching += n;
  !watching && _scheduler.scheduler.stop();
};

const getObservationIndex = (observationTargets, target) => {
  for (let i = 0; i < observationTargets.length; i += 1) {
    if (observationTargets[i].target === target) {
      return i;
    }
  }

  return -1;
};

const process = () => {
  let depth = 0;
  (0, _gatherActiveObservationsAtDepth.gatherActiveObservationsAtDepth)(depth);

  while ((0, _hasActiveObservations.hasActiveObservations)()) {
    depth = (0, _broadcastActiveObservations.broadcastActiveObservations)();
    (0, _gatherActiveObservationsAtDepth.gatherActiveObservationsAtDepth)(depth);
  }

  if ((0, _hasSkippedObservations.hasSkippedObservations)()) {
    (0, _deliverResizeLoopError.deliverResizeLoopError)();
  }

  return depth > 0;
};

exports.process = process;

class ResizeObserverController {
  static connect(resizeObserver, callback) {
    const detail = new _ResizeObserverDetail.ResizeObserverDetail(resizeObserver, callback);
    resizeObservers.push(detail);
    observerMap.set(resizeObserver, detail);
  }

  static observe(resizeObserver, target, options) {
    if (observerMap.has(resizeObserver)) {
      const detail = observerMap.get(resizeObserver);

      if (getObservationIndex(detail.observationTargets, target) < 0) {
        detail.observationTargets.push(new _ResizeObservation.ResizeObservation(target, options && options.box));
        updateCount(1);

        _scheduler.scheduler.schedule();
      }
    }
  }

  static unobserve(resizeObserver, target) {
    if (observerMap.has(resizeObserver)) {
      const detail = observerMap.get(resizeObserver);
      const index = getObservationIndex(detail.observationTargets, target);

      if (index >= 0) {
        detail.observationTargets.splice(index, 1);
        updateCount(-1);
      }
    }
  }

  static disconnect(resizeObserver) {
    if (observerMap.has(resizeObserver)) {
      const detail = observerMap.get(resizeObserver);
      resizeObservers.splice(resizeObservers.indexOf(detail), 1);
      observerMap.delete(resizeObserver);
      updateCount(-detail.observationTargets.length);
    }
  }

}

exports.ResizeObserverController = ResizeObserverController;
},{"./utils/scheduler":"node_modules/@juggle/resize-observer/lib/utils/scheduler.js","./ResizeObservation":"node_modules/@juggle/resize-observer/lib/ResizeObservation.js","./ResizeObserverDetail":"node_modules/@juggle/resize-observer/lib/ResizeObserverDetail.js","./algorithms/hasActiveObservations":"node_modules/@juggle/resize-observer/lib/algorithms/hasActiveObservations.js","./algorithms/hasSkippedObservations":"node_modules/@juggle/resize-observer/lib/algorithms/hasSkippedObservations.js","./algorithms/deliverResizeLoopError":"node_modules/@juggle/resize-observer/lib/algorithms/deliverResizeLoopError.js","./algorithms/broadcastActiveObservations":"node_modules/@juggle/resize-observer/lib/algorithms/broadcastActiveObservations.js","./algorithms/gatherActiveObservationsAtDepth":"node_modules/@juggle/resize-observer/lib/algorithms/gatherActiveObservationsAtDepth.js"}],"node_modules/@juggle/resize-observer/lib/ResizeObserver.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResizeObserver = exports.default = void 0;

var _ResizeObserverController = require("./ResizeObserverController");

var _ResizeObserverBoxOptions = require("./ResizeObserverBoxOptions");

var _prettify = require("./utils/prettify");

const DPPB = _ResizeObserverBoxOptions.ResizeObserverBoxOptions.DEVICE_PIXEL_BORDER_BOX;

class ResizeObserver {
  constructor(callback) {
    if (arguments.length === 0) {
      throw new TypeError(`Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.`);
    }

    if (typeof callback !== 'function') {
      throw new TypeError(`Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.`);
    }

    _ResizeObserverController.ResizeObserverController.connect(this, callback);
  }

  observe(target, options) {
    if (arguments.length === 0) {
      throw new TypeError(`Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.`);
    }

    if (target instanceof Element === false) {
      throw new TypeError(`Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element`);
    }

    if (options && options.box === DPPB && target.tagName !== 'CANVAS') {
      throw new Error(`Can only watch ${options.box} on canvas elements.`);
    }

    _ResizeObserverController.ResizeObserverController.observe(this, target, options);
  }

  unobserve(target) {
    if (arguments.length === 0) {
      throw new TypeError(`Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.`);
    }

    if (target instanceof Element === false) {
      throw new TypeError(`Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element`);
    }

    _ResizeObserverController.ResizeObserverController.unobserve(this, target);
  }

  disconnect() {
    _ResizeObserverController.ResizeObserverController.disconnect(this);
  }

  static toString() {
    return _prettify.POLYFILL_CONSOLE_OUTPUT;
  }

}

exports.ResizeObserver = ResizeObserver;
var _default = ResizeObserver;
exports.default = _default;
},{"./ResizeObserverController":"node_modules/@juggle/resize-observer/lib/ResizeObserverController.js","./ResizeObserverBoxOptions":"node_modules/@juggle/resize-observer/lib/ResizeObserverBoxOptions.js","./utils/prettify":"node_modules/@juggle/resize-observer/lib/utils/prettify.js"}],"src/app.js":[function(require,module,exports) {
"use strict";

var _resizeObserver = _interopRequireDefault(require("@juggle/resize-observer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var perfArea = document.getElementById('performance-example');
var perfFragment = document.createDocumentFragment();
var perfCount = document.getElementById('performance-count');
var ticks = 0;
var ro = new _resizeObserver.default(function (entries) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = entries[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var entry = _step.value;

      if (entry.target.parentElement === perfArea) {
        ticks += 1;
        perfCount.innerText = ticks;
        continue;
      }

      var _entry$contentRect = entry.contentRect,
          width = _entry$contentRect.width,
          height = _entry$contentRect.height;
      entry.target.setAttribute('dimensions', "".concat(Math.round(width), " x ").concat(Math.round(height)));
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  ;
});

_toConsumableArray(document.querySelectorAll('pre, code')).forEach(function (el) {
  el.innerHTML = el.innerHTML.trim();
});

for (var i = 0; i < 200; i += 1) {
  var el = document.createElement('div');
  el.setAttribute('resize', '');
  perfFragment.appendChild(el);
}

perfArea.appendChild(perfFragment);
perfArea.addEventListener('click', function () {
  this.toggleAttribute('animate');
});
document.getElementById('transition-example').addEventListener('click', function () {
  this.toggleAttribute('fill');
});
document.getElementById('animation-example').addEventListener('click', function () {
  this.toggleAttribute('animate');
});

_toConsumableArray(document.querySelectorAll('[resize]')).forEach(function (el) {
  return ro.observe(el);
});
},{"@juggle/resize-observer":"node_modules/@juggle/resize-observer/lib/ResizeObserver.js"}],"../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "59389" + '/');

  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      console.clear();
      data.assets.forEach(function (asset) {
        hmrApply(global.parcelRequire, asset);
      });
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.parcelRequire, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAccept(global.parcelRequire, id);
  });
}
},{}]},{},["../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","src/app.js"], null)
//# sourceMappingURL=/app.a6a4d504.map