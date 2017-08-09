import { parseURL } from 'utils/data-service';
import OppositeViz from 'opposite-viz/opposite-viz';
import RadialViz from 'radial-viz/radial-viz';

const urlWSDiff = './data/wsdiff_house_home.json';
const urlThes = './data/thes_estimate.json';
const urlThesClust = './data/thes_estimate_clust.json';
const urlSketch = './data/wsketch_distribute.json';
const urlSketchClust = './data/wsketch_system_clust.json';

const showFirstDiff = {
  viz: {
    divId: 'viz-container-0',
    svgId: 'ske-viz-opposite-0',
    className: 'wsdiff-viz-0',
    animation: false,
    margin: { top: 80, right: 50, bottom: 60, left: 50 },
    maxItems: 5
  },
  category: {
    showItems: [0]
  },
  circle: {
    mouseclick: (d) => {
      console.log('clicked a circle - ', d);
    }
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
    OppositeViz(data, showFirstDiff);

    // or show all the categories
    OppositeViz(data, showAllDiff);
  })
  .catch(catchError);

parseURL(urlThes, 'THES')
  .then(data => RadialViz(data,
    {
      viz: {
        divId: 'viz-container-2',
        maxItems: 5
      },
      circle: {
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
    }
  ))
  .catch(catchError);

parseURL(urlThesClust, 'THES')
  .then(data => RadialViz(data,
    {
      viz: {
        divId: 'viz-container-3',
        margin: { top: 120, right: 120, bottom: 120, left: 120 }
      },
      category: {
        show: true,
        differentAngles: false
      }
    }
  ))
  .catch(catchError);

parseURL(urlSketch, 'SKETCH')
  .then(data => RadialViz(data,
    {
      viz: {
        divId: 'viz-container-4',
        margin: { top: 120, right: 120, bottom: 120, left: 120 },
        maxItems: 5
      },
      tick: {
        color: 'rgb(200, 200, 200)',
        opacity: 0.3
      },
      circle: {
        scale: true,
        includeMainWord: false,
        categoryColor: true
      },
      text: {
        scale: true
      },
      category: {
        show: true,
        differentAngles: true,
        showItems: [1, 2],
        color: ['rgb(33, 150, 243)', 'rgb(50, 200, 200)', 'rgb(0, 150, 136)']
        // items: [
        //   { name: 'modifiers of "%w"', show: true, color: 'powderblue' },
        //   { name: 'subjects of "%w"', show: true, color: 'blanchedalmond' }
        // ]
      }
    }
  ));

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
        includeMainWord: false
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
