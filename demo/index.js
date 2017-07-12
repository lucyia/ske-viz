import { parseURL } from 'utils/data-service';
import OppositeViz from 'opposite-viz/opposite-viz';

const urlWSDiff = './data/wsdiff_house_home.json';
const params = {
  ticks: {
    show: true,
    number: 6
  },
  text: {
    size: [10, 20],
    font: 'Arial, sans-serif'
  },
  circles: {
    show: true
  }
};

const showFirst = {
  viz: {
    divId: 'viz-container-1',
    svgId: 'ske-viz-opposite-1',
    className: 'wswiff-viz-1'
  },
  category: {
    showItems: [1]
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
    OppositeViz(data, Object.assign(showFirst, params));
    OppositeViz(data, Object.assign(showSecondThird, params));

    // or show all the categories
    OppositeViz(data, Object.assign(showAll, params));
  })
  .catch(catchError);
