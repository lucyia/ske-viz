import { parseURL } from 'utils/data-service';
import { OppositeViz } from 'opposite-viz/opposite-viz';

const urlWSDiff = 'data/wsdiff_house_home.json';

parseURL(urlWSDiff, 'WS_DIFF')
  .then(data => {
    OppositeViz(data);
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
