import { parseURL } from 'utils/data-service';
import OppositeViz from 'opposite-viz/opposite-viz';

console.log('opposite', OppositeViz);

const urlWSDiff = 'data/wsdiff_house_home.json';
const params = {
  viz: {
    divId: 'viz-container',
    svgId: 'ske-viz-opposite',
    className: 'wswiff-viz',
    width: 800,
    height: 500
  },
  ticks: {
    show: true,
    number: 15
  },
  text: {
    size: [10, 20],
    font: 'Arial, sans-serif'
  },
  circles: {
    show: true
  }
};

parseURL(urlWSDiff, 'WS_DIFF')
  .then(data => {
    OppositeViz(data, params);
  })
  .catch(event => {
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
  });
