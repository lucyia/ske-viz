import { parseURL } from 'utils/data-service';
import OppositeViz from 'opposite-viz/opposite-viz';

const urlWSDiff = './data/wsdiff_house_home.json';

const showFirst = {
  viz: {
    divId: 'viz-container-1',
    svgId: 'ske-viz-opposite-1',
    className: 'wswiff-viz-1',
    animation: false
  },
  category: {
    showItems: [1]
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
    number: 3
  }
};

const showSecondThird = {
  viz: {
    divId: 'viz-container-2',
    svgId: 'ske-viz-opposite-2',
    className: 'wswiff-viz-2'
  },
  category: {
    showItems: [2, 3]
  },
  text: {
    size: [12, 30],
    font: 'Arial, sans-serif'
  }
};

const showAll = {
  viz: {
    divId: 'viz-container-3',
    svgId: 'ske-viz-opposite-3',
    className: 'wswiff-viz-3'
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
    OppositeViz(data, showFirst);
    OppositeViz(data, showSecondThird);

    // or show all the categories
    OppositeViz(data, showAll);
  })
  .catch(catchError);
