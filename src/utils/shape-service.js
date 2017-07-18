import { select } from 'd3-selection';
import { transition } from 'd3-transition';

import Names from './name-map';

/**
 * @requires
 */

let _svg;
let _transition;

function _getParamValue(param, shapeParams) {
  return {
    param: Names[param],
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

  _transition = transition().duration(1000);
};

function _exit(shapesSelection, shapeParams) {
  let exitShape = shapesSelection
    .exit()
    .transition();

  for (let parameter in shapeParams.exit) {
    const { param, value } = _getParamValue(parameter, shapeParams.exit);

    exitShape
      .attr(param, value);
  }
}

function _update(shapesSelection, shapeParams) {
  for (let parameter in shapeParams.update) {
    const { param, value } = _getParamValue(parameter, shapeParams.update);

    if (param === 'text') {
      shapesSelection
        .text(value);
    } else {
      shapesSelection
        .transition(_transition)
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
      const delay = shapeParams.enter.transition.delay ? shapeParams.enter.transition.delay : 0;

      // define transition selection
      const enterShapeTransitioned = enterShape
        .transition(_transition)
        .delay(delay);

      for (let transitionParameter in shapeParams.enter.transition) {
        const transitionedParam = Names[transitionParameter];
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
  let shapesGroup = _svg;

  if (createGroup) {
    shapesGroup = _svg.append('g')
      .attr('class', `group-${shapeParams.class}`);
  }

  // bind the data with the selection
  let shapesSelection = shapesGroup.selectAll(`.${shapeParams.class}`)
    .data(data);

  // exit, update and enter the selection
  _exit(shapesSelection, shapeParams);
  _update(shapesSelection, shapeParams);
  _enter(shapesSelection, shapeParams);
};

function updateShape(selection, updateParams, transition) {
  const applyTransition = transition === undefined ? true : transition;
  const shapeSelection = typeof selection === 'string' ? _svg.selectAll(selection) : selection;

  for (let parameter in updateParams) {
    const { param, value } = _getParamValue(parameter, updateParams);

    shapeSelection
      .transition()
      .duration(applyTransition ? 500 : 0)
      .attr(param, value);
  }

};

export { createSVG };
export { drawShape };
export { updateShape };
