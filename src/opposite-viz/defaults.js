const defaultParams = {
  viz: {
    divId: 'viz-container',
    svgId: 'ske-viz-opposite',
    className: 'wswiff-viz',
    width: 800,
    height: 500,
    margin: { top: 80, right: 50, bottom: 60, left: 50 },
    animation: true
  },
  tick: {
    number: 7
  },
  text: {
    show: true,
    scale: true,
    color: 'rgb(255, 255, 255)',
    size: [13, 25],
    font: 'Metrophobic, sans-serif',
    mouseover: undefined,
    mouseout: undefined,
    mouseclick: undefined
  },
  circle: {
    show: true,
    // color: ['rgb(11, 158, 55)', 'rgb(149, 23, 171)'],
    // color: ['rgb(1, 133, 113)', 'rgb(166, 97, 26)'],
    color: ['rgb(4, 134, 150)', 'rgb(218, 148, 3)'],
    size: [0, 35],
    strokeWidth: 2,
    mouseover: undefined,
    mouseout: undefined,
    mouseclick: undefined
  },
  score: {
    width: 50,
    // color: ['rgb(0, 163, 66)', 'rgb(140, 65, 172)'],
    // color: ['rgb(1, 133, 113)', 'rgb(166, 97, 26)'],
    color: ['rgb(13, 108, 120)', 'rgb(175, 128, 30)'],
    showNumbers: false,
    showText: [
      '← mostly with %w2 only',
      'equally frequently with %w1 and %w2',
      'mostly with %w1 only →'
    ]
  },
  category: {
    showName: true,
    showItems: undefined
  },
  legend: {
    color: 'rgb(50, 50, 50)'
  }
};

export default defaultParams;
