import { scaleLinear } from 'd3-scale';

function getNewParams(defaultParams, params) {
  // new object holding all parameters - either
  let newParams = {};

  // loop through all default parameters and rewrite only those defined
  for (let type in defaultParams) {
    newParams[type] = {};

    for (let param in defaultParams[type]) {
      if (params && params[type] && params[type][param]) {
        newParams[type][param] = params[type][param];
      } else {
        newParams[type][param] = defaultParams[type][param];
      }
    }
  }

  // update the actual width of the viz according to the margin convention
  newParams.viz.width = newParams.viz.width - newParams.viz.margin.left - newParams.viz.margin.right;
  newParams.viz.height = newParams.viz.height - newParams.viz.margin.top - newParams.viz.margin.bottom;

  return newParams;
}

function rectangleCollision(one, two) {
  // get the left and right coordinates from the middle point and width
  // and top and bottom coordinates from the middle point and height
  const a = {
    left: one.x - one.width / 2,
    right: one.x + one.width / 2,
    top: one.y - one.height / 2,
    bottom: one.y + one.height / 2
  };

  const b = {
    left: two.x - two.width / 2,
    right: two.x + two.width / 2,
    top: two.y - two.height / 2,
    bottom: two.y + two.height / 2
  };

  const collided = !(
    b.left >= a.right
    || b.right <= a.left
    || b.top >= a.bottom
    || b.bottom <= a.top
  );

  return collided;
}

function circleCollision(one, two) {
  return (Math.pow(one.x - two.x, 2) + Math.pow(one.y - two.y, 2)) <= Math.pow(one.r + two.r, 2);
}

function circleOverlap(one, two) {
  // TODO
}

function randomAngle() {
  return Math.random() * Math.PI * 2;
}

function randomPointOnCircle(radius, range) {
  const scale = scaleLinear()
    .domain([0, Math.PI * 2])
    .range(range ? range : [0, Math.PI * 2]);

  const angle = scale(randomAngle());

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  };
}

export {
  getNewParams,
  circleCollision,
  circleOverlap,
  randomPointOnCircle,
  randomAngle,
  rectangleCollision
};
