import {
  arc
} from 'd3-shape';
import {
  color
} from 'd3-color';
import {
  select
} from 'd3-selection';

function _wordInsideTickHighlight(word, tick, ticks) {
  // half of the difference between ticks
  const tickDiffHalf = ticks.length > 1 ? (ticks[1].value - ticks[0].value) / 2 : 0;

  // whether the word is around the hovered tick
  let wordInHightlightArea = word.score <= (tick.value - tickDiffHalf)
    && word.score > (tick.value + tickDiffHalf);

  // or the words are outside of the largest tick value - smallest score values than the tick
  if (tick.value === ticks[ticks.length - 1].value) {
    wordInHightlightArea = wordInHightlightArea || word.score < tick.value;
  }

  // or the words are inside - larger score values than the smallest tick
  if (tick.value === ticks[0].value) {
    wordInHightlightArea = wordInHightlightArea || word.score > tick.value;
  }

  return wordInHightlightArea;
}

function _getCategoryColor(word, categoryIndex, params) {
  let color;

  if (typeof params.category.color === 'string') {
    color = params.category.color;
  } else {
    color = params.category.color[categoryIndex];
  }

  if (params.category.show && params.category.items) {
    const item = params.category.items.find(item => item.name === word.data[0].category.name);

    // determine the color - if the item is not found or it doesn't contain color value, assign default color
    color = item ? (item.hasOwnProperty('color') ? item.color : color) : color;
  }

  return color;
}

function _getWordCircleColor(d, params, scale) {
  if (params.circle.categoryColor) {
    return _getCategoryColor(d.category, d.category.index, params);
  }

  return scale.scoreColor(d.score);
}

function _getWordCircleOpacity(d, params, scale) {
  if (params.circle.categoryColor) {
    return scale.scoreOpacity(d.score);
  }

  return 1;
}

function _getCircleColorHovered(d, params, scale) {
  let circleColor;

  if (params.circle.categoryColor) {
    // color according to the category color
    circleColor = _getWordCircleColor(d, params, scale);
  } else {
    // main word doesn't have score but it's color is the same as the closest word, therefore take the smallest score
    const score = d.score || scale.scoreRadius.domain()[1];

    // color according to the score value
    circleColor = color(scale.scoreColor(score)).darker(0.6);
  }

  return circleColor;
}

function _textMouseover(interactedText, d, shapeService, params, scale) {
  // highlight the text with underlignment - use d3.select
  shapeService.updateShape(interactedText, {
    'text-decoration': 'underline'
  });

  // stroke and strokeWidth of the word's circle
  const stroke = _getCircleColorHovered(d, params, scale);
  const strokeWidth = params.circle.strokeWidth;

  // highlight also the circle
  shapeService.updateShape(`#word__circle-${d.id}`, {
    stroke,
    strokeWidth
  }, false);

  // custom callback
  if (typeof params.text.mouseover === 'function') {
    params.text.mouseover(d);
  }
}

function _textMouseout(interactedText, d, shapeService, params) {
  // reset the style of the text - use d3.select
  shapeService.updateShape(interactedText, {
    'text-decoration': 'none'
  });

  // stroke and strokeWidth of the word's circle
  const stroke = 'rgb(0, 0, 0, 0)';
  const strokeWidth = 0;

  // reset also the circle
  shapeService.updateShape(`#word__circle-${d.id}`, {
    stroke,
    strokeWidth
  }, false);

  // custom callback
  if (typeof params.text.mouseout === 'function') {
    params.text.mouseout(d);
  }
}

function _textMouseclick(d, params) {
  // custom callback
  if (typeof params.text.mouseclick === 'function') {
    params.text.mouseclick(d);
  }
}

function _circleMouseover(interactedCircle, d, shapeService, params, scale) {
  // reset all other words' stroke width
  shapeService.updateShape('.word__circles', {
    'fill': d => scale.scoreColor(d.score)
  }, false);

  // stroke and strokeWidth of the word's circle
  const stroke = _getCircleColorHovered(d, params, scale);
  const strokeWidth = params.circle.strokeWidth;

  // highlight only the hovered circle
  shapeService.updateShape(interactedCircle, {
    stroke,
    strokeWidth
  }, false);

  // custom callback
  if (typeof params.circle.mouseover === 'function') {
    params.circle.mouseover(d);
  }
}

function _circleMouseout(interactedCircle, d, shapeService, params) {
  // stroke and strokeWidth of the word's circle
  const stroke = 'rgb(0, 0, 0, 0)';
  const strokeWidth = 0;

  // reset the hovered circle
  shapeService.updateShape(interactedCircle, {
    stroke,
    strokeWidth
  }, false);

  // custom callback
  if (typeof params.circle.mouseout === 'function') {
    params.circle.mouseout(d);
  }
}

function _circleMouseclick(d, params) {
  // custom callback
  if (typeof params.circle.mouseclick === 'function') {
    params.circle.mouseclick(d);
  }
}

function wordCircles(className, params, scale, shapeService) {
  const circleId = d => `word__circle-${d.id}`;

  return {
    shape: 'circle',
    class: className,
    enter: {
      id: d => circleId(d),
      cx: d => params.viz.width / 2 + d.x,
      cy: d => params.viz.height / 2 + d.y,
      fill: d => _getWordCircleColor(d, params, scale),
      fillOpacity: d => _getWordCircleOpacity(d, params, scale),
      r: d => scale.freqRadius(d.freq)
    },
    update: {
      id: d => circleId(d),
      cx: d => params.viz.width / 2 + d.x,
      cy: d => params.viz.height / 2 + d.y,
      fill: d => _getWordCircleColor(d, params, scale),
      fillOpacity: d => _getWordCircleOpacity(d, params, scale),
      r: d => scale.freqRadius(d.freq)
    },
    exit: {
      x: d => params.viz.width / 2,
      y: d => params.viz.height / 2,
      r: 0
    },
    mouseover: function wordCircleMouseover(d) {
      _circleMouseover(select(this), d, shapeService, params, scale);
    },
    mouseout: function wordCircleMouseout(d) {
      _circleMouseout(select(this), d, shapeService, params, scale);
    },
    mouseclick: function wordCircleMouseclick(d) {
      _circleMouseclick(d, params);
    }
  };
}

function wordTexts(className, params, scale, shapeService) {
  const textId = d => `word__text-${d.id}`;

  return {
    shape: 'text',
    class: className,
    enter: {
      id: d => textId(d),
      x: d => params.viz.width / 2 + d.x,
      y: d => params.viz.height / 2 + d.y,
      fill: d => params.text.color,
      fontSize: d => scale.fontSize(d.freq),
      fontFamily: d => params.text.font,
      textAnchor: d => 'middle',
      alignmentBaseline: d => 'middle',
      cursor: d => 'pointer',
      opacity: d => 1,
      text: d => d.text
    },
    update: {
      id: d => textId(d),
      x: d => params.viz.width / 2 + d.x,
      y: d => params.viz.height / 2 + d.y,
      fontSize: d => scale.fontSize(d.freq),
      text: d => d.text,
      r: d => 0,
      opacity: d => 1
    },
    exit: {
      x: d => params.viz.width / 2,
      y: d => params.viz.height / 2,
      fontSize: d => 0,
      opacity: d => 0
    },
    mouseover: function wordTextMouseover(d) {
      _textMouseover(select(this), d, shapeService, params, scale);
    },
    mouseout: function wordTextMouseout(d) {
      _textMouseout(select(this), d, shapeService, params);
    },
    mouseclick: function wordTextMouseclick(d) {
      _textMouseclick(d, params);
    }
  };
}

function mainWordText(className, params, scale, shapeService) {
  const mainWordFontSize = d => params.circle.includeMainWord
    ? scale.fontSize(d.freq)
    : scale.fontSize.range()[1];

  return {
    shape: 'text',
    class: className,
    enter: {
      x: d => params.viz.width / 2,
      y: d => params.viz.height / 2,
      fill: d => params.text.color,
      fontFamily: d => params.text.font,
      textAnchor: d => 'middle',
      alignmentBaseline: d => 'middle',
      cursor: d => 'pointer',
      text: d => d.text,
      transition: {
        fontSize: d => mainWordFontSize(d)
      }
    },
    update: {
      fontSize: d => mainWordFontSize(d),
      text: d => d.text
    },
    exit: {
      opacity: d => 0
    },
    mouseover: function mainWordTextMouseover(d) {
      _textMouseover(select(this), d, shapeService, params, scale);
    },
    mouseout: function mainWordTextMouseout(d) {
      _textMouseout(select(this), d, shapeService, params);
    },
    mouseclick: function mainWordTextMouseclick(d) {
      _textMouseclick(d, params);
    }
  };
}

function mainWordCircle(className, params, scale, shapeService) {
  const mainWordX = params.viz.width / 2;
  const mainWordY = params.viz.height / 2;
  const mainWordFill = scale.scoreColor.range()[1];
  const mainWordRadius = d => params.circle.includeMainWord
    ? scale.freqRadius(d.freq)
    : 0;

  return {
    shape: 'circle',
    class: className,
    enter: {
      id: d => `word__circle-${d.id}`,
      cx: d => mainWordX,
      cy: d => mainWordY,
      r: d => 0,
      fill: d => mainWordFill,
      transition: {
        r: d => mainWordRadius(d)
      }
    },
    update: {
      cx: d => mainWordX,
      cy: d => mainWordY,
      r: d => mainWordRadius(d),
      fill: d => mainWordFill
    },
    exit: {
      r: d => 0
    },
    mouseover: function wordCircleMouseover(d) {
      _circleMouseover(select(this), d, shapeService, params, scale);
    },
    mouseout: function wordCircleMouseout(d) {
      _circleMouseout(select(this), d, shapeService, params, scale);
    },
    mouseclick: function wordCircleMouseclick(d) {
      _circleMouseclick(d, params);
    }
  };
}

function categoryArcs(className, params, scale, shapeService) {
  const arcTransform = `rotate(90 ${ params.viz.width / 2 } ${ params.viz.height / 2 })
    translate(${ params.viz.width / 2 }, ${ params.viz.height / 2 })`;
  const arcStroke = (d, i) => color(_getCategoryColor(d, i, params)).darker(0.07);

  // d3 arc creates a function which is then called with the data
  const _arc = arc()
    .outerRadius(params.viz.width / 2 + 20) // make the radius bit bigger to make space for the score circles
    .innerRadius(5);

  return {
    shape: 'path',
    class: className,
    enter: {
      d: d => _arc(d),
      stroke: (d, i) => arcStroke(d, i),
      strokeWidth: d => 0,
      fill: (d, i) => _getCategoryColor(d, i, params),
      fillOpacity: d => 0,
      transform: () => arcTransform,
      transition: {
        delay: (d, i) => 400 * i,
        fillOpacity: d => params.category.fillOpacity,
        strokeWidth: d => params.category.strokeWidth
      }
    },
    update: {
      d: d => _arc(d),
      stroke: (d, i) => arcStroke(d, i),
      fill: (d, i) => _getCategoryColor(d, i, params),
      transform: () => arcTransform
    },
    exit: {
      fill: d => 'transparent'
    },
    mouseover: function arcMouseover(category) {
      // highlight word circles - those around the tick will be rendered in full color,
      // all other one will be more opaque
      shapeService.updateShape('.word__circle', {
        fill: word => word.category.text === category.text
          ? _getWordCircleColor(word, params, scale) : params.tick.color
      }, true);

      // highlight word texts - the same rule as for circles
      shapeService.updateShape('.word__text', {
        fill: word => word.category.text === category.text
          ? params.text.color : color(params.tick.color).darker(0.5)
      }, true);

      // change the color of all arcs
      shapeService.updateShape('.category__arc', {
        fill: 'rgba(0, 0, 0, 0)',
        stroke: 'rgba(0, 0, 0, 0)'
      }, true);

      // highlight only the selected arc
      shapeService.updateShape(select(this), {
        fill: d => _getCategoryColor(d, category.index, params),
        stroke: d => _getCategoryColor(d, category.index, params)
      }, true);

    },
    mouseout: (d) => {
      // reset the arcs' color
      shapeService.updateShape('.category__arc', {
        fill: (arc, i) => _getCategoryColor(arc, i, params),
        stroke: (arc, i) => arcStroke(arc, i)
      }, true);

      // reset circles' color
      shapeService.updateShape('.word__circle', {
        fill: word => _getWordCircleColor(word, params, scale)
      }, true);

      // reset texts' color
      shapeService.updateShape('.word__text', {
        fill: word => params.text.color
      }, true);
    }
  };
};

function categoryTexts(className, params, scale, shapeService) {
  const textX = d => params.viz.width / 2 + d.x;
  const textY = d => params.viz.height / 2 + d.y;

  return {
    shape: 'text',
    class: className,
    enter: {
      id: d => d.id,
      x: d => params.viz.width / 2,
      y: d => params.viz.height / 2,
      fill: d => color(params.tick.color).darker(0.7),
      fontSize: d => params.category.labelSize,
      fontFamily: d => params.text.font,
      fontWeight: d => 'bold',
      textAnchor: d => 'middle',
      alignmentBaseline: d => 'middle',
      cursor: d => 'pointer',
      opacity: d => 0,
      text: d => null,
      transition: {
        delay: 800,
        opacity: d => 1,
        x: d => textX(d),
        y: d => textY(d)
      }
    },
    update: {
      id: d => d.id,
      fontSize: d => params.category.labelSize,
      text: d => d.text,
      x: d => textX(d),
      y: d => textY(d)
    },
    exit: {
      fontSize: d => 0
    }
  };
}

function scoreLegendTicks(className, params, scale, shapeService) {
  const tickColor = d => params.tick.scoreColor
    ? scale.scoreColor(d.value)
    : params.tick.color;

  return {
    shape: 'circle',
    class: 'tick',
    enter: {
      id: d => `tick-${d.id}`,
      cx: d => params.viz.width / 2,
      cy: d => params.viz.height / 2,
      r: d => scale.scoreRadius(d.value),
      fill: d => 'none',
      stroke: d => 'transparent',
      strokeOpacity: d => params.tick.opacity,
      strokeWidth: d => params.tick.size,
      transition: {
        delay: (d, i) => i * 200 + 900,
        stroke: d => tickColor(d)
      }
    },
    update: {
      id: d => `tick-${d.id}`,
      r: d => scale.scoreRadius(d.value),
      stroke: d => tickColor(d)
    },
    exit: {
      strokeOpacity: 0
    },
    mouseover: function mouseover(tick) {
      // change the color of all ticks
      shapeService.updateShape('.tick', {
        strokeOpacity: Math.min(params.tick.opacity, 0.1)
      });

      // highlight only the hovered tick
      shapeService.updateShape(select(this), {
        strokeOpacity: Math.max(params.tick.opacity, 0.9)
      });

      // highlight word circles - those around the tick will be rendered in full color,
      // all other one will be more opaque
      shapeService.updateShape('.word__circle', {
        fill: word => {
          if (_wordInsideTickHighlight(word, tick, params.tick.values)) {
            if (word.category) {
              return _getCategoryColor(word, word.category.index, params);
            }

            return scale.scoreColor(word.score);
          }

          return params.tick.color;
        }
      }, true);

      // highlight word texts - the same rule as for circles
      shapeService.updateShape('.word__text', {
        fill: word => _wordInsideTickHighlight(word, tick, params.tick.values)
          ? params.text.color : color(params.tick.color).darker(0.5)
      });
    },
    mouseout: function mouseout(tick) {
      // reset the style of the ticks
      shapeService.updateShape('.tick', {
        strokeOpacity: params.tick.opacity
      });

      // reset the colour of word circles
      shapeService.updateShape('.word__circle', {
        fill: word => {
          if (word.category) {
            return _getCategoryColor(word, word.category.index, params);
          }

          return scale.scoreColor(word.score);
        }
      });

      // reset the colour of word's text
      shapeService.updateShape('.word__text', {
        fill: word => params.text.color
      });
    }
  };
}

export {
  wordCircles,
  mainWordText,
  wordTexts,
  mainWordCircle,
  categoryArcs,
  categoryTexts,
  scoreLegendTicks
};
