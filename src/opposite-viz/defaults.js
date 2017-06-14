const defaultParams = {
  viz: {
    divId: 'viz-container',
    svgId: 'ske-viz-opposite',
    className: 'wswiff-viz',
    width: 800,
    height: 500,
    ticksColor: 'rgb(255,255,255)',
    margin: { top: 80, right: 50, bottom: 60, left: 50 },
    animation: true
  },
  ticks: {
    show: true,
    color: 'rgb(240, 240, 240)',
    size: 1,
    number: 7
  },
  text: {
    show: true,
    scale: true,
    color: 'black',
    size: [12, 25],
    font: 'Metrophobic, sans-serif',
    mouseover: undefined,
    mouseout: undefined,
    mouseclick: undefined
  },
  circles: {
    show: true,
    // color: ['rgb(11, 158, 55)', 'rgb(149, 23, 171)'],
    // color: ['rgb(1, 133, 113)', 'rgb(166, 97, 26)'],
    color: ['#048696', '#da9403'],
    size: [0, 35],
    strokeSize: 0,
    mouseover: undefined,
    mouseout: undefined,
    mouseclick: undefined
  },
  scores: {
    width: 50,
    ticks: 'rgb(50, 50, 50)',
    // color: ['rgb(0, 163, 66)', 'rgb(140, 65, 172)'],
    // color: ['rgb(1, 133, 113)', 'rgb(166, 97, 26)'],
    color: ['#0d6c78', '#af801e'],
    showNumbers: false,
    showText: [
      '← mostly with %w2 only',
      'equally frequently with %w1 and %w2',
      'mostly with %w1 only →'
    ]
  },
  category: {
    showName: true
  }
};

export default defaultParams;
