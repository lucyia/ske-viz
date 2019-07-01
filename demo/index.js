import OppositeViz from 'opposite-viz/opposite-viz';
import RadialViz from 'radial-viz/radial-viz';
import {
  parseURL
} from 'utils/data-service';

const urlWSDiff = './data/wsdiff_house_home.json';
const urlThes = './data/thes_system.json';
// const urlThesClust = './data/thes_system_clust.json';
const urlSketch = './data/wsketch_system.json';
const urlSketchClust = './data/wsketch_system_clust.json';

const showFirstDiff = {
  viz: {
    divId: 'viz-container-0',
    svgId: 'ske-viz-opposite-0',
    className: 'wsdiff-viz-0',
    animation: false,
    margin: {
      top: 80,
      right: 50,
      bottom: 60,
      left: 50
    },
    maxItems: 5
  },
  category: {
    showItems: [2]
  },
  score: {
    // color: ['rgb(93, 6, 113)', 'rgb(0, 125, 167)']
    // color: ['rgb(199, 152, 9)', 'rgb(35, 127, 138)']
    // color: ['rgb(13, 108, 120)', 'rgb(175, 128, 30)']
    // color: ['rgb(0, 64, 117)', 'rgb(154, 123, 17)']
    color: ['rgb(0, 75, 105)', 'rgb(175, 128, 30)']
  },
  circle: {
    mouseclick: (d) => {
      console.log('clicked a circle - ', d);
    },
    // color: ['rgb(170, 85, 190)', 'rgb(39, 159, 210)']
    // color: ['rgb(5, 77, 138)', 'rgb(173, 137, 15)']
    // color: ['rgb(0, 75, 105)', 'rgb(173, 137, 15)']
    color: ['rgb(0, 75, 105)', 'rgb(218, 148, 3)']
  },
  text: {
    mouseclick: (d) => {
      console.log('clicked a text - ', d);
    }
  },
  tick: {
    number: 5
  }
};

const showAllDiff = {
  viz: {
    divId: 'viz-container-1',
    svgId: 'ske-viz-opposite-1',
    className: 'wswiff-viz-1',
    maxItems: 10
  }
};

function catchError(event) {
  // log the event
  console.log(event);

  // add the warning to the top of the window
  const style = 'position:absolute; width:100%; height:30px; background:#000;'
    + 'opacity:0.5; padding: 30px; color:white; font-size: 16px; text-align: center;';

  // add explanation
  const text = 'visualization could not be created, please check the console';

  // text of the warning
  const warning = `<div style="${style}">${event.type} - ${text}}</div>`;

  document.body.innerHTML += warning;
}

parseURL(urlWSDiff, 'WS_DIFF')
  .then(data => {
    // either show only a selected number
    // OppositeViz(data, showFirstDiff);

    // or show all the categories
    // OppositeViz(data, showAllDiff);
  })
  .catch(catchError);

parseURL(urlThes, 'THES')
  .then(data => RadialViz(data, {
    viz: {
      divId: 'viz-container-2',
      maxItems: 20,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    circle: {
      // color: ['rgb(190, 55, 190)', 'rgb(39, 159, 210)'],
      color: ['rgb(170, 85, 190)', 'rgb(39, 159, 210)'],
      mouseover: (d) => console.log('over', d),
      mouseout: (d) => console.log('out', d),
      mouseclick: (d) => console.log('click', d)
    },
    text: {
      scale: true
    },
    category: {
      show: false
    }
  }))
  .catch(catchError);

// parseURL(urlThesClust, 'THES')
//   .then(data => RadialViz(data,
//     {
//       viz: {
//         divId: 'viz-container-3',
//         margin: { top: 120, right: 120, bottom: 120, left: 120 }
//       },
//       category: {
//         show: true,
//         differentAngles: false
//       }
//     }
//   ))
//   .catch(catchError);

parseURL(urlSketch, 'SKETCH')
  .then(data => RadialViz(data, {
    viz: {
      divId: 'viz-container-4',
      margin: {
        top: 120,
        right: 120,
        bottom: 120,
        left: 120
      },
      maxItems: 10
    },
    tick: {
      color: 'rgb(200, 200, 200)',
      opacity: 0.3
    },
    circle: {
      scale: true,
      includeMainWord: false,
      categoryColor: false,
      color: ['rgb(170, 85, 190)', 'rgb(39, 159, 210)']
    },
    text: {
      scale: true
    },
    category: {
      show: true,
      differentAngles: false,
      showItems: [1, 2, 3],
      color: [
        'rgb(108, 202, 112)',
        'rgb(205, 220, 57)',
        'rgb(232, 213, 38)',
        'rgb(255, 193, 7)',
        'rgb(255, 152, 0)',
        'rgb(255, 87, 34)',
        'rgb(251, 53, 120)',
        'rgb(206, 99, 224)',
        'rgb(129, 83, 212)',
        'rgb(9, 129, 144)'
      ]
      // items: [
      //   { name: 'modifiers of "%w"', show: true, color: 'powderblue' },
      //   { name: 'subjects of "%w"', show: true, color: 'blanchedalmond' }
      // ]
    }
  }));

parseURL(urlSketchClust, 'SKETCH')
  .then(data => RadialViz(data,
    {
      viz: {
        divId: 'viz-container-5',
        margin: { top: 120, right: 120, bottom: 120, left: 120 },
        maxItems: 3
      },
      tick: {
        color: 'rgb(255, 255, 255)'
      },
      circle: {
        includeMainWord: false,
        color: ['rgb(170, 85, 190)', 'rgb(39, 159, 210)']
      },
      category: {
        show: true,
        differentAngles: true,
        items: [
          { name: 'modifiers of "%w"', show: true, color: 'powderblue' },
          { name: 'nouns and verbs modified by "%w"', show: true, color: 'blanchedalmond' }
        ],
        labelSize: 13,
        labelPadding: 80
      }
    }
  ));
