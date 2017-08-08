import { color } from 'd3-color';
import { select } from 'd3-selection';
import { arc } from 'd3-shape';

function _getCircleColorHovered(d, params, scale) {
  // main word doesn't have score but it's color is the same as the closest word, therefore take the smallest score
  const score = d.score || scale.scoreRadius.domain()[0];

  return color(scale.scoreColor(score)).darker(0.6);
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
  shapeService.updateShape(`#word__circle-${d.id}`, { stroke, strokeWidth }, false);

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
  shapeService.updateShape(`#word__circle-${d.id}`, { stroke, strokeWidth }, false);

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
  shapeService.updateShape(interactedCircle, { stroke, strokeWidth }, false);

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
  shapeService.updateShape(interactedCircle, { stroke, strokeWidth }, false);

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

function _wordInsideTickHighlight(word, tick, tickDifference) {
  // half of the difference between ticks
  const tickDiffHalf = tickDifference / 2;

  // whether the word is around the hovered tick
  const wordInHightlightArea = (
    word.score >= (tick - tickDiffHalf)
    && word.score < (tick + tickDiffHalf)
  );

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

function wordCircles(className, params, scale, shapeService) {
  return {
    shape: 'circle',
    class: className,
    enter: {
      id: d => 'word__circle-' + d.id,
      cx: d => params.viz.width / 2 + d.x,
      cy: d => params.viz.height / 2 + d.y,
      fill: d => scale.scoreColor(d.score),
      r: d => 0,
      transition: {
        delay: (d, i) => i * 30 + 500,
        r: d => scale.freqRadius(d.freq)
      }
    },
    exit: {
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
  return {
    shape: 'text',
    class: className,
    enter: {
      id: d => 'word__text-' + d.id,
      x: d => params.viz.width / 2 + d.x,
      y: d => params.viz.height / 2 + d.y,
      fill: d => params.text.color,
      fontSize: d => scale.fontSize(d.freq),
      fontFamily: d => params.text.font,
      textAnchor: d => 'middle',
      alignmentBaseline: d => 'middle',
      cursor: d => 'pointer',
      opacity: d => 0,
      text: d => d.text,
      transition: {
        delay: (d, i) => i * 30 + 800,
        opacity: d => 1
      }
    },
    update: {
      fontSize: d => scale.fontSize(d.freq),
      text: d => d.text
    },
    exit: {
      fontSize: d => 0
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
        fontSize: d => params.circle.includeMainWord ? scale.fontSize(d.freq) : scale.fontSize.range()[0]
      }
    },
    update: {
      fontSize: d => params.circle.includeMainWord ? scale.fontSize(d.freq) : scale.fontSize.range()[0],
      text: d => d.text
    },
    exit: {
      fontSize: d => 0
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
  return {
    shape: 'circle',
    class: className,
    update: {
      cx: d => params.viz.width / 2,
      cy: d => params.viz.height / 2,
      r: d => params.circle.includeMainWord ? scale.freqRadius(d.freq) : 0,
      fill: d => scale.scoreColor.range()[0]
    },
    enter: {
      cx: d => params.viz.width / 2,
      cy: d => params.viz.height / 2,
      r: d => 0,
      fill: d => scale.scoreColor.range()[0],
      transition: {
        r: d => params.circle.includeMainWord ? scale.freqRadius(d.freq) : 0
      }
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
  // d3 arc creates a function which is then called with the data
  const _arc = arc()
    .outerRadius(params.viz.width / 2 + 20) // make the radius bit bigger to make space for the score circles
    .innerRadius(2);

  return {
    shape: 'path',
    class: className,
    enter: {
      d: d => _arc(d),
      stroke: (d, i) => color(_getCategoryColor(d, i, params)).darker(0.07),
      strokeWidth: d => params.category.strokeWidth,
      fill: (d, i) => _getCategoryColor(d, i, params),
      transform: () =>
        `rotate(90 ${ params.viz.width / 2 } ${ params.viz.height / 2 })
         translate(${ params.viz.width / 2 }, ${ params.viz.height / 2 })`
    },
    mouseover: function arcMouseover(category) {
      // highlight word circles - those around the tick will be rendered in full color,
      // all other one will be more opaque
      shapeService.updateShape('.word__circle', {
        fill: word => word.category.text === category.text
          ? scale.scoreColor(word.score)
          : params.tick.color
      }, true);

      // highlight word texts - the same rule as for circles
      shapeService.updateShape('.word__text', {
        fill: word => word.category.text === category.text
          ? params.text.color
          : color(params.tick.color).darker(0.5)
      }, true);

      // change the color of all arcs
      shapeService.updateShape('.category__arc', {
        fill: 'rgba(0, 0, 0, 0)',
        stroke: 'rgba(0, 0, 0, 0)'
      }, true);

      // highlight only the selected arc
      shapeService.updateShape(select(this), {
        fill: d => _getCategoryColor(d, 0, params),
        stroke: d => _getCategoryColor(d, 0, params)
      }, true);

    },
    mouseout: (d) => {
      // reset the arcs' color
      shapeService.updateShape('.category__arc', {
        fill: arc => _getCategoryColor(arc, 0, params),
        stroke: arc => color(_getCategoryColor(arc, 0, params)).darker(0.07)
      }, true);

      // reset circles' color
      shapeService.updateShape('.word__circle', {
        fill: word => scale.scoreColor(word.score)
      }, true);

      // reset texts' color
      shapeService.updateShape('.word__text', {
        fill: word => params.text.color
      }, true);
    }
  };
};

function categoryTexts(className, params, scale, shapeService) {
  return {
    shape: 'text',
    class: className,
    enter: {
      id: d => d.id,
      x: d => params.viz.width / 2 + d.x,
      y: d => params.viz.height / 2 + d.y,
      fill: d => color(params.category.color).darker(0.7),
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
        opacity: d => 1
      }
    },
    update: {
      fontSize: d => params.category.labelSize,
      text: d => d.text
    },
    exit: {
      fontSize: d => 0
    }
  };
}

function scoreLegendNumbers(className, params) {
  return {

  };
}

function scoreLegendText(className, params) {
  return {

  };
}

function scoreLegendTicks(className, params, scale, shapeService) {
  const ticksDifference = params.tick.difference;

  return {
    shape: 'circle',
    class: 'tick',
    enter: {
      cx: d => params.viz.width / 2,
      cy: d => params.viz.height / 2,
      r: d => scale.scoreRadius(d),
      fill: d => 'none',
      stroke: d => 'transparent',
      strokeOpacity: d => params.tick.opacity,
      strokeWidth: d => params.tick.size,
      transition: {
        delay: (d, i) => i * 250 + 1000,
        stroke: d => params.tick.color
      }
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
        fill: word => _wordInsideTickHighlight(word, tick, ticksDifference)
          ? scale.scoreColor(word.score)
          : params.tick.color
      }, true);

      // highlight word texts - the same rule as for circles
      shapeService.updateShape('.word__text', {
        fill: word => _wordInsideTickHighlight(word, tick, ticksDifference)
          ? params.text.color
          : color(params.tick.color).darker(0.5)
      });
    },
    mouseout: function mouseout(tick) {
      // reset the style of the ticks
      shapeService.updateShape('.tick', {
        strokeOpacity: params.tick.opacity
      });

      // reset the colour of word circles
      shapeService.updateShape('.word__circle', {
        fill: word => scale.scoreColor(word.score)
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
  scoreLegendText,
  scoreLegendTicks,
  scoreLegendNumbers
};
