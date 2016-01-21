// ADD SLIDEDOWN ANIMATION TO DROPDOWN //
 $('.dropdown').on('show.bs.dropdown', function(e){
   $(this).find('.dropdown-menu').first().stop(true, true).slideDown();
 });

 // ADD SLIDEUP ANIMATION TO DROPDOWN //
 $('.dropdown').on('hide.bs.dropdown', function(e){
   $(this).find('.dropdown-menu').first().stop(true, true).slideUp();
 });

function getActiveStyle(styleName, object) {
  object = object || canvas.getActiveObject();
  if (!object) return '';
  return (object.getSelectionStyles && object.isEditing) ? (object.getSelectionStyles()[styleName] || '') : (object[styleName] || '');
}

function setActiveStyle(styleName, value, object) {
  object = object || canvas.getActiveObject();
  if (!object) return;
  if (object.setSelectionStyles && object.isEditing) {
    var style = {};
    style[styleName] = value;
    object.setSelectionStyles(style);
    object.setCoords();
  } else {
    object[styleName] = value;
  }
  object.setCoords();
  canvas.renderAll();
}

function getActiveProp(name) {
  var object = canvas.getActiveObject();
  if (!object) return '';
  return object[name] || '';
}

function setActiveProp(name, value) {
  var object = canvas.getActiveObject();
  if (!object) return;
  object.set(name, value).setCoords();
  canvas.renderAll();
}

function addAccessors($scope) {
  $scope.getOpacity = function() {
    return getActiveStyle('opacity') * 100;
  };
  $scope.setOpacity = function(value) {
    setActiveStyle('opacity', parseInt(value, 10) / 100);
  };
  $scope.getFill = function() {
    return getActiveStyle('fill');
  };
  $scope.setFill = function(value) {
    setActiveStyle('fill', value);
  };
  $scope.isBold = function() {
    return getActiveStyle('fontWeight') === 'bold';
  };
  $scope.toggleBold = function() {
    setActiveStyle('fontWeight', getActiveStyle('fontWeight') === 'bold' ? '' : 'bold');
  };
  $scope.isItalic = function() {
    return getActiveStyle('fontStyle') === 'italic';
  };
  $scope.toggleItalic = function() {
    setActiveStyle('fontStyle', getActiveStyle('fontStyle') === 'italic' ? '' : 'italic');
  };
  $scope.isUnderline = function() {
    return getActiveStyle('textDecoration').indexOf('underline') > -1;
  };
  $scope.toggleUnderline = function() {
    var value = $scope.isUnderline() ? getActiveStyle('textDecoration').replace('underline', '') : (getActiveStyle('textDecoration') + ' underline');
    setActiveStyle('textDecoration', value);
  };
  $scope.isLinethrough = function() {
    return getActiveStyle('textDecoration').indexOf('line-through') > -1;
  };
  $scope.toggleLinethrough = function() {
    var value = $scope.isLinethrough() ? getActiveStyle('textDecoration').replace('line-through', '') : (getActiveStyle('textDecoration') + ' line-through');
    setActiveStyle('textDecoration', value);
  };
  $scope.isOverline = function() {
    return getActiveStyle('textDecoration').indexOf('overline') > -1;
  };
  $scope.toggleOverline = function() {
    var value = $scope.isOverline() ? getActiveStyle('textDecoration').replace('overlin', '') : (getActiveStyle('textDecoration') + ' overline');
    setActiveStyle('textDecoration', value);
  };
  $scope.getText = function() {
    return getActiveProp('text');
  };
  $scope.setText = function(value) {
    setActiveProp('text', value);
  };
  $scope.getTextAlign = function() {
    return capitalize(getActiveProp('textAlign'));
  };
  $scope.setTextAlign = function(value) {
    setActiveProp('textAlign', value.toLowerCase());
  };
  $scope.getFontFamilygetStrokeColor = function() {
    return getActiveProp('fontFamily').toLowerCase();
  };
  $scope.setFontFamily = function(value) {
    setActiveProp('fontFamily', value.toLowerCase());
  };
  $scope.getBgColor = function() {
    return getActiveProp('backgroundColor');
  };
  $scope.setBgColor = function(value) {
    setActiveProp('backgroundColor', value);
  };
  $scope.getTextBgColor = function() {
    return getActiveProp('textBackgroundColor');
  };
  $scope.setTextBgColor = function(value) {
    setActiveProp('textBackgroundColor', value);
  };
  $scope.getStrokeColor = function() {
    return getActiveStyle('stroke');
  };
  $scope.setStrokeColor = function(value) {
    setActiveStyle('stroke', value);
  };
  $scope.getStrokeWidth = function() {
    return getActiveStyle('strokeWidth');
  };
  $scope.setStrokeWidth = function(value) {
    setActiveStyle('strokeWidth', parseInt(value, 10));
  };
  $scope.getFontSize = function() {
    return getActiveStyle('fontSize');
  };
  $scope.setFontSize = function(value) {
    setActiveStyle('fontSize', parseInt(value, 10));
  };
  $scope.getLineHeight = function() {
    return getActiveStyle('lineHeight');
  };
  $scope.setLineHeight = function(value) {
    setActiveStyle('lineHeight', parseFloat(value, 10));
  };
  $scope.getBold = function() {
    return getActiveStyle('fontWeight');
  };
  $scope.setBold = function(value) {
    setActiveStyle('fontWeight', value ? 'bold' : '');
  };
  $scope.getCanvasBgColor = function() {
    return canvas.backgroundColor;
  };
  $scope.setCanvasBgColor = function(value) {
    canvas.backgroundColor = value;
    canvas.renderAll();
  };
  $scope.addRect = function() {
    var coord = getRandomLeftTop();
    canvas.add(new fabric.Rect({
      left: coord.left,
      top: coord.top,
      fill: '#020202',
      stroke: '#000',
      width: 100,
      height: 100,
      opacity: 0.2
    }));
  };
  $scope.addCircle = function() {
    var coord = getRandomLeftTop();
    canvas.add(new fabric.Circle({
      left: coord.left,
      top: coord.top,
      fill: '#020202',
      stroke: '#000',
      radius: 50,
      opacity: 0.2
    }));
  };
  $scope.addTriangle = function() {
    var coord = getRandomLeftTop();
    canvas.add(new fabric.Triangle({
      left: coord.left,
      top: coord.top,
      fill: '#020202',
      stroke: '#000',
      width: 50,
      height: 50,
      opacity: 0.2
    }));
  };
  $scope.addLine = function() {
    var coord = getRandomLeftTop();
    canvas.add(new fabric.Line([50, 100, 200, 200], {
      left: coord.left,
      top: coord.top,
      stroke: '#020202'
    }));
  };
  $scope.addPolygon = function() {
    var coord = getRandomLeftTop();
    this.canvas.add(new fabric.Polygon([{
      x: 185,
      y: 0
    }, {
      x: 250,
      y: 100
    }, {
      x: 385,
      y: 170
    }, {
      x: 0,
      y: 245
    }], {
      left: coord.left,
      top: coord.top,
      fill: '#020202',
      stroke: '#000',
      opacity: 0.2
    }));
  };
  $scope.addText = function() {
    var textSample = new fabric.Text('New Text', {
      left: getRandomInt(0, 200),
      top: getRandomInt(0, 100),
      fontFamily: 'helvetica',
      angle: 0,
      fill: '#020202',
      scaleX: 0.5,
      scaleY: 0.5,
      fontWeight: '',
      originX: 'left',
      hasRotatingPoint: true,
      centerTransform: true
    });
    canvas.add(textSample);
  };
  var addShape = function(shapeName) {
    console.log('adding shape', shapeName);
    var coord = getRandomLeftTop();
    fabric.loadSVGFromURL('../assets/' + shapeName + '.svg', function(objects, options) {
      var loadedObject = fabric.util.groupSVGElements(objects, options);
      loadedObject.set({
        left: coord.left,
        top: coord.top,
        angle: getRandomInt(-10, 10)
      }).setCoords();
      canvas.add(loadedObject);
    });
  };
  $scope.maybeLoadShape = function(e) {
    var $el = $(e.target).closest('button.shape');
    if (!$el[0]) return;
    var id = $el.prop('id'),
      match;
    if (match = /\d+$/.exec(id)) {
      addShape(match[0]);
    }
  };

  function addImage(imageName, minScale, maxScale) {
    var coord = getRandomLeftTop();
    fabric.Image.fromURL('http://www.fearlessblue.com/ic/diagram/images/' + imageName, function(image) {
      image.set({
        left: coord.left,
        top: coord.top,
        angle: getRandomInt(-10, 10)
      }).scale(getRandomNum(minScale, maxScale)).setCoords();
      canvas.add(image);
    });
  }
  $scope.confirmClear = function() {
    if (confirm('Are you sure?')) {
      canvas.clear();
    }
  };
  $scope.rasterize = function() {
    if (!fabric.Canvas.supports('toDataURL')) {
      alert('This browser doesn\'t provide means to serialize canvas to an image');
    } else {
      window.open(canvas.toDataURL('png'));
    }
  };
  $scope.rasterizeSVG = function() {
    window.open('data:image/svg+xml;utf8,' +
      encodeURIComponent(canvas.toSVG()));
  };
  $scope.rasterizeJSON = function() {
    alert(JSON.stringify(canvas));
  };
  $scope.getSelected = function() {
    return canvas.getActiveObject();
  };
  $scope.removeSelected = function() {
    var activeObject = canvas.getActiveObject(),
      activeGroup = canvas.getActiveGroup();
    if (activeGroup) {
      var objectsInGroup = activeGroup.getObjects();
      canvas.discardActiveGroup();
      objectsInGroup.forEach(function(object) {
        canvas.remove(object);
      });
    } else if (activeObject) {
      canvas.remove(activeObject);
    }
  };
  $scope.getHorizontalLock = function() {
    return getActiveProp('lockMovementX');
  };
  $scope.setHorizontalLock = function(value) {
    setActiveProp('lockMovementX', value);
  };
  $scope.getVerticalLock = function() {
    return getActiveProp('lockMovementY');
  };
  $scope.setVerticalLock = function(value) {
    setActiveProp('lockMovementY', value);
  };
  $scope.getScaleLockX = function() {
    return getActiveProp('lockScalingX');
  }, $scope.setScaleLockX = function(value) {
    setActiveProp('lockScalingX', value);
  };
  $scope.getScaleLockY = function() {
    return getActiveProp('lockScalingY');
  };
  $scope.setScaleLockY = function(value) {
    setActiveProp('lockScalingY', value);
  };
  $scope.getRotationLock = function() {
    return getActiveProp('lockRotation');
  };
  $scope.setRotationLock = function(value) {
    setActiveProp('lockRotation', value);
  };
  $scope.getOriginX = function() {
    return getActiveProp('originX');
  };
  $scope.setOriginX = function(value) {
    setActiveProp('originX', value);
  };
  $scope.getOriginY = function() {
    return getActiveProp('originY');
  };
  $scope.setOriginY = function(value) {
    setActiveProp('originY', value);
  };
  $scope.sendBackwards = function() {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendBackwards(activeObject);
    }
  };
  $scope.sendToBack = function() {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendToBack(activeObject);
    }
  };
  $scope.bringForward = function() {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringForward(activeObject);
    }
  };
  $scope.bringToFront = function() {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringToFront(activeObject);
    }
  };
  var pattern = new fabric.Pattern({
    repeat: 'repeat'
  });

  $scope.clip = function() {
    var obj = canvas.getActiveObject();
    if (!obj) return;
    if (obj.clipTo) {
      obj.clipTo = null;
    } else {
      var radius = obj.width < obj.height ? (obj.width / 2) : (obj.height / 2);
      obj.clipTo = function(ctx) {
        ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
      };
    }
    canvas.renderAll();
  };
  $scope.shadowify = function() {
    var obj = canvas.getActiveObject();
    if (!obj) return;
    if (obj.shadow) {
      obj.shadow = null;
    } else {
      obj.setShadow({
        color: 'rgba(0,0,0,0.3)',
        blur: 10,
        offsetX: 10,
        offsetY: 10
      });
    }
    canvas.renderAll();
  };
  $scope.gradientify = function() {
    var obj = canvas.getActiveObject();
    if (!obj) return;
    obj.setGradient('fill', {
      x1: 0,
      y1: 0,
      x2: (getRandomInt(0, 1) ? 0 : obj.width),
      y2: (getRandomInt(0, 1) ? 0 : obj.height),
      colorStops: {
        0: '#020202',
        1: '#020202'
      }
    });
    canvas.renderAll();
  };
  $scope.execute = function() {
    if (!(/^\s+$/).test(consoleValue)) {
      eval(consoleValue);
    }
  };
  var consoleSVGValue = ('<?xml version="1.0" standalone="no"?>' + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + '<svg width="100%" height="100%" version="1.1" xmlns="http://www.w3.org/2000/svg">' + '<rect width="300" height="100" style="fill:rgb(0,0,255);stroke-width:1;stroke:rgb(0,0,0)"/>' + '</svg>');
  var consoleValue = ('// clear canvas\n' + 'canvas.clear();\n\n' + '// remove currently selected object\n' + 'canvas.remove(canvas.getActiveObject());\n\n' + '// add red rectangle\n' + 'canvas.add(new fabric.Rect({\n' + '  width: 50,\n' + '  height: 50,\n' + '  left: 50,\n' + '  top: 50,\n' + "  fill: 'rgb(255,0,0)'\n" + '}));\n\n' + '// add green, half-transparent circle\n' + 'canvas.add(new fabric.Circle({\n' + '  radius: 40,\n' + '  left: 50,\n' + '  top: 50,\n' + "  fill: 'rgb(0,255,0)',\n" + '  opacity: 0.5\n' + '}));\n');
  $scope.getConsoleSVG = function() {
    return consoleSVGValue;
  };
  $scope.setConsoleSVG = function(value) {
    consoleSVGValue = value;
  };
  $scope.getConsole = function() {
    return consoleValue;
  };
  $scope.setConsole = function(value) {
    consoleValue = value;
  };
  $scope.loadSVGWithoutGrouping = function() {
    _loadSVGWithoutGrouping(consoleSVGValue);
  };
  $scope.loadSVG = function() {
    _loadSVG(consoleSVGValue);
  };
  var _loadSVG = function(svg) {
    fabric.loadSVGFromString(svg, function(objects, options) {
      var obj = fabric.util.groupSVGElements(objects, options);
      canvas.add(obj).centerObject(obj).renderAll();
      obj.setCoords();
    });
  };
  var _loadSVGWithoutGrouping = function(svg) {
    fabric.loadSVGFromString(svg, function(objects) {
      canvas.add.apply(canvas, objects);
      canvas.renderAll();
    });
  };

  function initCustomization() {
    if (typeof Cufon !== 'undefined' && Cufon.fonts.delicious) {
      Cufon.fonts.delicious.offsetLeft = 75;
      Cufon.fonts.delicious.offsetTop = 25;
    }
    if (/(iPhone|iPod|iPad)/i.test(navigator.userAgent)) {
      fabric.Object.prototype.cornerSize = 30;
    }
    fabric.Object.prototype.transparentCorners = false;
    if (document.location.search.indexOf('guidelines') > -1) {
      initCenteringGuidelines(canvas);
      initAligningGuidelines(canvas);
    }
  }
  initCustomization();

  function addTexts() {
    var iText = new fabric.IText('', {
      left: 100,
      top: 150,
      fontFamily: 'Helvetica',
      fill: '#333',
      styles: {
        0: {
          0: {
            fill: 'red',
            fontSize: 20
          },
          1: {
            fill: 'red',
            fontSize: 30
          },
          2: {
            fill: 'red',
            fontSize: 40
          },
          3: {
            fill: 'red',
            fontSize: 50
          },
          4: {
            fill: 'red',
            fontSize: 60
          },
          6: {
            textBackgroundColor: 'yellow'
          },
          7: {
            textBackgroundColor: 'yellow'
          },
          8: {
            textBackgroundColor: 'yellow'
          },
          9: {
            textBackgroundColor: 'yellow'
          }
        },
        1: {
          0: {
            textDecoration: 'underline'
          },
          1: {
            textDecoration: 'underline'
          },
          2: {
            fill: 'green',
            fontStyle: 'italic',
            textDecoration: 'underline'
          },
          3: {
            fill: 'green',
            fontStyle: 'italic',
            textDecoration: 'underline'
          },
          4: {
            fill: 'green',
            fontStyle: 'italic',
            textDecoration: 'underline'
          }
        },
        2: {
          0: {
            fill: 'blue',
            fontWeight: 'bold'
          },
          1: {
            fill: 'blue',
            fontWeight: 'bold'
          },
          2: {
            fill: 'blue',
            fontWeight: 'bold'
          },
          4: {
            fontFamily: 'Courier',
            textDecoration: 'line-through'
          },
          5: {
            fontFamily: 'Courier',
            textDecoration: 'line-through'
          },
          6: {
            fontFamily: 'Courier',
            textDecoration: 'line-through'
          },
          7: {
            fontFamily: 'Courier',
            textDecoration: 'line-through'
          }
        },
        3: {
          0: {
            fontFamily: 'Impact',
            fill: '#666',
            textDecoration: 'line-through'
          },
          1: {
            fontFamily: 'Impact',
            fill: '#666',
            textDecoration: 'line-through'
          },
          2: {
            fontFamily: 'Impact',
            fill: '#666',
            textDecoration: 'line-through'
          },
          3: {
            fontFamily: 'Impact',
            fill: '#666',
            textDecoration: 'line-through'
          },
          4: {
            fontFamily: 'Impact',
            fill: '#666',
            textDecoration: 'line-through'
          }
        }
      }
    });
    var iText2 = new fabric.IText('', {
      left: 400,
      top: 150,
      fontFamily: 'Helvetica',
      fill: '#333',
      styles: {
        0: {
          0: {
            fill: 'red'
          },
          1: {
            fill: 'red'
          },
          2: {
            fill: 'red'
          }
        },
        2: {
          0: {
            fill: 'blue'
          },
          1: {
            fill: 'blue'
          },
          2: {
            fill: 'blue'
          },
          3: {
            fill: 'blue'
          }
        }
      }
    });
    canvas.add(iText, iText2);
  }
  addTexts();
  $scope.getFreeDrawingMode = function() {
    return canvas.isDrawingMode;
  };
  $scope.setFreeDrawingMode = function(value) {
    canvas.isDrawingMode = !!value;
    $scope.$$phase || $scope.$digest();
  };
  $scope.freeDrawingMode = 'Pencil';
  $scope.getDrawingMode = function() {
    return $scope.freeDrawingMode;
  };
  $scope.setDrawingMode = function(type) {
    $scope.freeDrawingMode = type;
    if (type === 'hline') {
      canvas.freeDrawingBrush = $scope.vLinePatternBrush;
    } else if (type === 'vline') {
      canvas.freeDrawingBrush = $scope.hLinePatternBrush;
    } else if (type === 'square') {
      canvas.freeDrawingBrush = $scope.squarePatternBrush;
    } else if (type === 'diamond') {
      canvas.freeDrawingBrush = $scope.diamondPatternBrush;
    } else if (type === 'texture') {
      canvas.freeDrawingBrush = $scope.texturePatternBrush;
    } else {
      canvas.freeDrawingBrush = new fabric[type + 'Brush'](canvas);
    }
    $scope.$$phase || $scope.$digest();
  };
  $scope.getDrawingLineWidth = function() {
    if (canvas.freeDrawingBrush) {
      return canvas.freeDrawingBrush.width;
    }
  };
  $scope.setDrawingLineWidth = function(value) {
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = parseInt(value, 10) || 1;
    }
  };
  $scope.getDrawingLineColor = function() {
    if (canvas.freeDrawingBrush) {
      return canvas.freeDrawingBrush.color;
    }
  };
  $scope.setDrawingLineColor = function(value) {
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = value;
    }
  };
  $scope.getDrawingLineShadowWidth = function() {
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.shadowBlur;
    }
  };
  $scope.setDrawingLineShadowWidth = function(value) {
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.shadowBlur = parseInt(value, 10) || 1;
    }
  };

  function initBrushes() {
    if (!fabric.PatternBrush) return;
    initVLinePatternBrush();
    initHLinePatternBrush();
    initSquarePatternBrush();
    initDiamondPatternBrush();
    initImagePatternBrush();
  }
  initBrushes();

  function initImagePatternBrush() {
    var img = new Image();
    $scope.texturePatternBrush = new fabric.PatternBrush(canvas);
    $scope.texturePatternBrush.source = img;
  }

  function initDiamondPatternBrush() {
    $scope.diamondPatternBrush = new fabric.PatternBrush(canvas);
    $scope.diamondPatternBrush.getPatternSrc = function() {
      var squareWidth = 10,
        squareDistance = 5;
      var patternCanvas = fabric.document.createElement('canvas');
      var rect = new fabric.Rect({
        width: squareWidth,
        height: squareWidth,
        angle: 45,
        fill: this.color
      });
      var canvasWidth = rect.getBoundingRectWidth();
      patternCanvas.width = patternCanvas.height = canvasWidth + squareDistance;
      rect.set({
        left: canvasWidth / 2,
        top: canvasWidth / 2
      });
      var ctx = patternCanvas.getContext('2d');
      rect.render(ctx);
      return patternCanvas;
    };
  }

  function initSquarePatternBrush() {
    $scope.squarePatternBrush = new fabric.PatternBrush(canvas);
    $scope.squarePatternBrush.getPatternSrc = function() {
      var squareWidth = 10,
        squareDistance = 2;
      var patternCanvas = fabric.document.createElement('canvas');
      patternCanvas.width = patternCanvas.height = squareWidth + squareDistance;
      var ctx = patternCanvas.getContext('2d');
      ctx.fillStyle = this.color;
      ctx.fillRect(0, 0, squareWidth, squareWidth);
      return patternCanvas;
    };
  }

  function initVLinePatternBrush() {
    $scope.vLinePatternBrush = new fabric.PatternBrush(canvas);
    $scope.vLinePatternBrush.getPatternSrc = function() {
      var patternCanvas = fabric.document.createElement('canvas');
      patternCanvas.width = patternCanvas.height = 10;
      var ctx = patternCanvas.getContext('2d');
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.lineTo(10, 5);
      ctx.closePath();
      ctx.stroke();
      return patternCanvas;
    };
  }

  function initHLinePatternBrush() {
    $scope.hLinePatternBrush = new fabric.PatternBrush(canvas);
    $scope.hLinePatternBrush.getPatternSrc = function() {
      var patternCanvas = fabric.document.createElement('canvas');
      patternCanvas.width = patternCanvas.height = 10;
      var ctx = patternCanvas.getContext('2d');
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(5, 10);
      ctx.closePath();
      ctx.stroke();
      return patternCanvas;
    };
  }
}

function watchCanvas($scope) {
  function updateScope() {
    $scope.$$phase || $scope.$digest();
    canvas.renderAll();
  }
  canvas.on('object:selected', updateScope).on('group:selected', updateScope).on('path:created', updateScope).on('selection:cleared', updateScope);
}
kitchensink.controller('CanvasControls', function($scope) {
  $scope.canvas = canvas;
  $scope.getActiveStyle = getActiveStyle;
  addAccessors($scope);
  watchCanvas($scope);
});
