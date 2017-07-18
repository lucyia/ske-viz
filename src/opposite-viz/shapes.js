import { color } from 'd3-color';

function wordCircles(className, params, scale) {
  return {
    shape: 'circle',
    class: className,
    enter: {
      id: d => 'word__circle-' + d.id,
      cx: d => (params.viz.width / 2) + d.x,
      cy: d => d.y,
      fill: d => d.color,
      stroke: d => color(d.color).darker(0.5),
      strokeWidth: d => params.circle.strokeWidth,
      r: d => params.viz.animation ? 0 : scale.freqRadius(d.freq),

      transition: {
        delay: (d, i) => params.viz.animation ? Math.abs(d.score * 100) : 0,
        r: d => scale.freqRadius(d.freq)
      }
    },
    exit: {
      r: 0
    },
    mouseover: function (d) {
      // custom callback
      if (typeof params.circle.mouseover === 'function') {
        params.circle.mouseover(d);
      }
    },
    mouseout: function (d) {
      // custom callback
      if (typeof params.circle.mouseout === 'function') {
        params.circle.mouseout(d);
      }
    },
    mouseclick: function (d) {
      // custom callback
      if (typeof params.circle.mouseclick === 'function') {
        params.circle.mouseclick(d);
      }
    }
  };
}

function wordTexts(className, params, scale) {
  return {
    shape: 'text',
    class: className,
    enter: {
      id: d => 'word__text-' + d.id,
      x: d => (params.viz.width / 2) + d.x,
      y: d => d.y,
      fill: d => params.text.color,
      fontSize: d => params.text.scale ? scale.fontSize(d.words[0].freq + d.words[1].freq) : params.text.size[0],
      fontFamily: d => params.text.font,
      textAnchor: d => 'middle',
      alignmentBaseline: d => 'middle',
      cursor: d => 'pointer',
      text: d => d.text,
      opacity: d => params.viz.animation ? 0 : 1,

      transition: {
        delay: (d, i) => params.viz.animation ? Math.abs(d.score * 100) : 0,
        opacity: d => 1
      }
    },
    update: {
      fontSize: d => params.text.scale ? scale.fontSize(d.words[0].freq + d.words[1].freq) : params.text.size[0],
      text: d => d.text
    },
    exit: {
      fontSize: d => 0
    },
    mouseover: function (d) {
      // custom callback
      if (typeof params.text.mouseover === 'function') {
        params.text.mouseover(d);
      }
    },
    mouseout: function (d) {
      // custom callback
      if (typeof params.text.mouseout === 'function') {
        params.text.mouseout(d);
      }
    },
    mouseclick: function (d) {
      // custom callback
      if (typeof params.text.mouseclick === 'function') {
        params.text.mouseclick(d);
      }
    }
  };
}

function categoryName(className, params) {
  return {
    shape: 'text',
    class: className,
    enter: {
      x: d => params.viz.width / 2,
      y: d => -13,
      fill: d => params.legend.color,
      fontFamily: d => params.text.font,
      fontSize: d => 18,
      textAnchor: d => 'middle',
      alignmentBaseline: d => 'middle',
      text: d => d,
      opacity: d => params.viz.animation ? 0 : 1,

      transition: {
        opacity: d => 1
      }
    }
  };
}

function mainWordsBackground(className, params) {
  return {
    shape: 'rect',
    class: className,
    enter: {
      id: d => d.id + '__rect',
      x: d => d.x,
      y: d => d.y,
      width: d => params.viz.mainWordWidth,
      height: d => params.viz.height,
      fill: d => color(d.color).brighter(0.7),
      opacity: d => params.viz.animation ? 0 : 1,

      transition: {
        opacity: d => 1
      }
    }
  };
}

function mainWordsText(className, params) {
  const x = d => d.x + params.viz.mainWordWidth / 2;
  const y = d => d.y + params.viz.height / 2;

  return {
    shape: 'text',
    class: className,
    enter: {
      id: d => d.id + '__text',
      x: d => x(d),
      y: d => y(d),
      fill: d => params.text.color,
      fontFamily: d => params.text.font,
      fontSize: d => params.text.mainWordSize,
      textAnchor: d => 'middle',
      alignmentBaseline: d => 'middle',
      text: d => d.text,
      transform: d => `rotate(-90 ${ x(d) } ${ y(d) })`
    }
  };
}

function scoreBackground(className, params, scale) {
  return {
    shape: 'rect',
    class: className,
    enter: {
      id: d => 'score__rect-' + d.id,
      x: d => d.x,
      y: d => d.y,
      width: d => d.width,
      height: d => d.height,
      fill: d => color(scale.scoreBackgroundColor(d.score)).brighter(1),
      opacity: d => params.viz.animation ? 0 : 1,

      transition: {
        delay: (d, i) => Math.abs(d.score * 50),
        opacity: d => 1
      }
    }
  };
}

function scoreLegendTicks(className, params) {
  return {
    shape: 'rect',
    class: className,
    enter: {
      x: d => params.viz.width / 2 + d.x,
      y: d => d.y,
      width: d => 1,
      height: d => 5,
      fill: d => color(params.legend.color).brighter(0.5),
      opacity: d => params.viz.animation ? 0 : 1,

      transition: {
        opacity: d => 1
      }
    }
  };
}

function scoreLegendNumbers(className, params) {
  return {
    shape: 'text',
    class: className,
    enter: {
      x: d => params.viz.width / 2 + d.x,
      y: d => d.y + 13,
      fill: d => color(params.legend.color).brighter(0.5),
      fontFamily: d => params.text.font,
      fontSize: d => 10,
      textAnchor: d => 'middle',
      alignmentBaseline: d => 'middle',
      text: d => d.text
    }
  };
}

function scoreLegendText(className, params) {
  return {
    shape: 'text',
    class: className,
    enter: {
      x: d => d.x,
      y: d => d.y,
      fill: d => color(params.legend.color).brighter(0.5),
      fontFamily: d => params.text.font,
      fontSize: d => 10,
      textAnchor: (d, i) => {
        if (i === 0) {
          return 'start';
        } else if (i === params.score.showText.length - 1) {
          return 'end';
        }
        return 'middle';
      },
      alignmentBaseline: d => 'middle',
      text: d => d.text
    }
  };
}

export {
  wordCircles,
  wordTexts,
  categoryName,
  mainWordsBackground,
  mainWordsText,
  scoreBackground,
  scoreLegendTicks,
  scoreLegendText,
  scoreLegendNumbers
};
