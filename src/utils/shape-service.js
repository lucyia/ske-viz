import { select } from 'd3-selection';
import { transition } from 'd3-transition';
import { easeBackOut } from 'd3-ease';

import kebabCase from 'lodash/kebabCase';

/**
 * @requires
 */

function ShapeService() {

  let _svg;
  let _transition;
  let _animation;

  function _getParamValue(param, shapeParams) {
    return {
      param: kebabCase(param),
      value: shapeParams[param]
    };
  }

  function createSVG(params, id) {
    const width = params.width + params.margin.left + params.margin.right;
    const height = params.height + params.margin.top + params.margin.bottom;

    _svg = select('#' + params.divId)
      .append('svg')
      .attr('id', id || params.svgId)
      .attr('class', params.className)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${params.margin.left}, ${params.margin.top})`);

    _animation = params.animation;

    const duration = params.animation ? 1000 : 0;

    _transition = transition().duration(duration);

    return _svg;
  };

  function _exit(shapesSelection, shapeParams) {
    let exitShape = shapesSelection
      .exit()
      .transition()
      .duration(800)
      .remove();

    for (let parameter in shapeParams.exit) {
      const { param, value } = _getParamValue(parameter, shapeParams.exit);

      exitShape
        .attr(param, value);
    }
  }

  function _update(shapesSelection, shapeParams) {
    const selection = shapesSelection
      .transition(_transition)
      .ease(easeBackOut);

    for (let parameter in shapeParams.update) {
      const { param, value } = _getParamValue(parameter, shapeParams.update);

      if (param === 'text') {
        selection
          .text(value);
      } else {
        selection
          .attr(param, value);
      }
    }
  }

  function _enter(shapesSelection, shapeParams) {
    let enterShape = shapesSelection
      .enter()
      .append(shapeParams.shape)
      .attr('class', shapeParams.class);

    for (let parameter in shapeParams.enter) {
      const { param, value } = _getParamValue(parameter, shapeParams.enter);

      if (param === 'transition') {
        // if there is no delay function defined, do not delay
        let delay = shapeParams.enter.transition.delay ? shapeParams.enter.transition.delay : 0;

        // or if the animation should not run
        delay = _animation ? delay : 0;

        // define transition selection
        const enterShapeTransitioned = enterShape
          .transition(_transition)
          .ease(easeBackOut)
          .delay(delay);

        for (let transitionParameter in shapeParams.enter.transition) {
          const transitionedParam = kebabCase(transitionParameter);
          const transitionedValue = shapeParams.enter.transition[transitionParameter];

          if (transitionedParam !== 'delay') {
            // set all attributes on the shape with given transition
            enterShapeTransitioned
              .attr(transitionedParam, transitionedValue);
          }
        }
      } else if (param === 'text') {
        enterShape
          .text(value);
      } else {
        // set all attributes on the shape with the given values
        enterShape
          .attr(param, value);
      }
    }

    enterShape.on('click', shapeParams.mouseclick);
    enterShape.on('mouseover', shapeParams.mouseover);
    enterShape.on('mouseout', shapeParams.mouseout);
  }

  function drawShape(data, shapeParams, createGroup) {
    const groupName = `group-${shapeParams.class}`;

    let shapesGroup = _svg;

    if (createGroup) {
      // if group should be created, append it into svg
      shapesGroup = _svg.append('g').attr('class', groupName);
    } else {
      // otherwise group is created, so only select it
      shapesGroup = _svg.select(`.${groupName}`);
    }

    // bind the data with the selection
    let shapesSelection = shapesGroup.selectAll(`.${shapeParams.class}`)
      .data(data, (d, i) => {
        // the key is the id of given word, if it exists; if not, default iteraction key is returned
        return d.id ? d.id : i;
      });

    // exit, update and enter the selection
    _exit(shapesSelection, shapeParams);
    _update(shapesSelection, shapeParams);
    _enter(shapesSelection, shapeParams);
  }

  function updateShape(selection, updateParams, transition) {
    const applyTransition = transition === undefined ? true : transition;
    const shapeSelection = typeof selection === 'string' ? _svg.selectAll(selection) : selection;
    let transitionApplied = false;

    for (let parameter in updateParams) {
      const { param, value } = _getParamValue(parameter, updateParams);

      if (transitionApplied) {
        shapeSelection
          .attr(param, value);
      } else {
        shapeSelection
          .transition()
          .ease(easeBackOut)
          .duration(applyTransition ? 500 : 0)
          .attr(param, value);

        transitionApplied = true;
      }
    }
  }

  function createTspanText(elements, params) {
    elements.forEach(element => {
      // get the text element into which tspan elements should appended to
      const parent = _svg.select(`#${element.id}`);
      // replace any special characters
      const text = element.text ? element.text.replace('%w', element.mainWord) : '';
      // create tspan elements
      let rows = text.split(/(\w+\s\w+)/gi);

      // if there is a word at the end in brackets, put it in on a new line
      const lastWord = rows[rows.length - 1];
      const lastWordSplit = lastWord.split(/(\(\w+\))/g);

      rows = rows.slice(0, rows.length - 1).concat(lastWordSplit);

      // filter out empty text
      rows = rows.filter(word => (word !== '') && (word !== ' '));

      rows.forEach((textRow, i) => {
        parent.append('tspan')
          .attr('x', params.viz.width / 2 + element.x)
          .attr('y', params.viz.height / 2 + element.y)
          .attr('dy', i + 'em')
          .attr('textAnchor', 'middle')
          .text(textRow);
      });
    });
  }

  return {
    createSVG,
    createTspanText,
    drawShape,
    updateShape
  };
}

export default ShapeService;
