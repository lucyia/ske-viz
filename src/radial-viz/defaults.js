const defaultParams = {
  viz: {
    divId: 'vis-container',
    svgId: 'ske-viz-radial',
    className: 'viz-radial',
    width: 600,
    height: 600,
    margin: { top: 50, right: 50, bottom: 50, left: 50 },
    animation: true,
    maxItems: undefined
  },
  tick: {
    show: true,
    color: 'rgb(230, 230, 230)',
    opacity: 0.3,
    size: 8,
    number: 3
  },
  text: {
    show: true,
    scale: true,
    color: 'black',
    size: [15, 30],
    font: 'Helvetica, Arial, sans-serif',
    mouseover: undefined,
    mouseout: undefined,
    mouseclick: undefined
  },
  circle: {
    show: true,
    scale: true,
    categoryColor: false, // if true, then color values defined below are ignored, only colors from category are taken
    color: ['rgb(50, 200, 200)', 'rgb(200, 20, 200)'],
    size: [5, 40],
    strokeWidth: 5,
    includeMainWord: true,
    spaceAroundCentre: 50, // if includeMainWord is true, this value is ingored because it's automatically calculated
    mouseover: undefined,
    mouseout: undefined,
    mouseclick: undefined
  },
  score: {
    showNumbers: false,
    showText: [
      '← more similar to %w'
    ]
  },
  category: {
    show: false,
    differentAngles: false,
    items: undefined, // each item of word sketch, containing { name: ..., show: ..., color: ... }
    showItems: undefined, // similar to items but this accepts an array of indices of categories
    color: 'rgba(250, 250, 250, 0.7)', // either a string (applied for all categories) or an array of colors
    fillOpacity: 0.3,
    strokeWidth: 8,
    showLabel: true,
    labelSize: 18,
    labelPadding: 75
  }
};

export default defaultParams;
