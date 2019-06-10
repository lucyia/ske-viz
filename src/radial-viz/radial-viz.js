import {
  allWords,
  range
} from '../utils/data-service';
import {
  categoryArcs,
  categoryTexts,
  mainWordCircle,
  mainWordText,
  scoreLegendTicks,
  wordCircles,
  wordTexts
} from './shapes';
import {
  circleCollision,
  getCircleId,
  getNewParams,
  getTextId,
  pointOnCircle,
  randomPointOnCircle,
  rectangleCollision
} from '../utils/utils';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation
} from 'd3-force';
import {
  scaleLinear,
  scaleSqrt
} from 'd3-scale';
import {
  select,
  selectAll
} from 'd3-selection';

// internal helper functions
import ShapeService from '../utils/shape-service';
// internal functions and params for viz
import defaultParams from './defaults';
import ellipseCollide from '../utils/ellipse-collide';
import {
  extent
} from 'd3-array';
import {
  pie
} from 'd3-shape';
import uniqueId from 'lodash/uniqueId';

/**
 * RadialViz
 * @param {object} data - data containing words
 * @param {object} params - parameters
 * @param {boolean} debug - flag for allowing extra elements to be visible and logs in console
 * @returns {void}
 */
function RadialViz(data, params, debug = true) {

  let _debug = debug;
  let _svg;
  let _shapeService;
  let _params;
  let _data;
  let _categories;

  let _scale = {
    scoreRadius: undefined,
    scoreColor: undefined,
    scoreOpacity: undefined,
    freqRadius: undefined,
    fontSize: undefined
  };

  let _rendering = {
    circles: undefined,
    texts: undefined
  };

  function _initScales() {
    // firstly, initialize scales dependent on radius (will be used for score scales)
    const freqRange = extent(
      range(_data, 'freq', _params.circle.includeMainWord)
    );

    // if circles should be scaled, takze values from params; if they shouln't, take the lower bound for both bounds
    const freqRadiusRange = _params.circle.scale
      ? _params.circle.size : [_params.circle.size[0], _params.circle.size[0]];

    _scale.freqRadius = scaleSqrt()
      .domain(freqRange)
      .range(freqRadiusRange);

    // if text should be scaled, take values from params; if it shouldn't, take lower bound for both bounds
    const fontSizeRange = _params.text.scale
      ? _params.text.size : [_params.text.size[0], _params.text.size[0]];

    _scale.fontSize = scaleLinear()
      .domain(freqRange)
      .range(fontSizeRange);

    // then initialize all other scales
    const scoreRange = extent(range(_data, 'score', false));

    const minScoreRadius = _params.circle.includeMainWord
      ? _scale.freqRadius(freqRange[1]) * 1.75
      : _params.circle.spaceAroundCentre;

    // highest score is in the middle (closest to the main word); the lower the score, the further away from main word
    _scale.scoreRadius = scaleLinear()
      .domain(scoreRange)
      .range([_params.viz.width / 2, minScoreRadius]);

    _scale.scoreColor = scaleLinear()
      .domain(scoreRange)
      .range(_params.circle.color);

    _scale.scoreOpacity = scaleLinear()
      .domain(scoreRange)
      .range([0.3, 1]);
  }

  function _getWordSize(word, svg) {
    // render the word to find out the bounding box
    const textElement = svg
      .append('text')
      .attr('font-size', _scale.fontSize(word.freq))
      .attr('font-family', _params.text.font)
      .text(word.text);

    const size = textElement.node().getBBox();

    return {
      width: size.width,
      height: size.height
    };
  }

  function _addWordSize() {
    // create testing svg
    const svg = select('body').append('svg');

    // add word sizes
    _data.words.forEach(category => {
      category.forEach(word => {
        word.size = _getWordSize(word, svg);
      });
    });

    // add main word size
    _data.mainWord.size = _getWordSize(_data.mainWord, svg);

    // after all words have calculated bounding boxes, remove svg with all texts
    svg.remove();
  }

  function _addDefaultPositions() {
    const words = allWords(_data.words);

    // sort all word so that words with biggest sum of freqs are placed first
    const sortedWords = words.sort((word2, word1) => word1.freq - word2.freq);

    // initiliaze circles - circles with main word's circle can collide
    _rendering.circles = [];

    // however, texts with main word's text cannot collide, therefore initialize texts with the main word's text in it
    // its position is in the middle at [0, 0] - as they will be translated with half of viz width and height
    _data.mainWord.x = 0;
    _data.mainWord.y = 0;
    _rendering.texts = [{
      x: _data.mainWord.x,
      y: _data.mainWord.y,
      text: _data.mainWord.text,
      score: _data.mainWord.score,
      id: _data.mainWord.id // both words' id are the same
    }];

    sortedWords.forEach(word => {
      let angleRange;

      if (_categories) {
        const startAngle = word.category.startAngle;
        const endAngle = word.category.endAngle;

        angleRange = [startAngle, endAngle];
      }

      const wordRadial = _scale.scoreRadius(word.score);
      const randomPoint = randomPointOnCircle(wordRadial, angleRange);

      word.x = randomPoint.x;
      word.y = randomPoint.y;

      const radius = _scale.freqRadius(word.freq);

      // create word's circle
      const wordCircle = {
        class: 'word_circle',
        x: word.x,
        y: word.y,
        r: radius,
        rx: Math.max(word.size.width / 1.8, radius * 1.2),
        ry: Math.max(word.size.height / 1.8, radius * 1.2),
        wordRadial,
        text: word.text,
        id: word.id,
        freq: word.freq,
        score: word.score,
        fill: 'rgba(50, 50, 50, 0.3)'
      };

      if (_categories) {
        wordCircle.category = word.category;
      }

      // create word's text
      let wordText = {
        class: 'word_text',
        x: word.x,
        y: word.y,
        wordRadial,
        width: word.size.width,
        height: word.size.height,
        text: word.text,
        score: word.score,
        fill: 'rgba(50, 50, 50, 0.6)',
        id: word.id // both words' id are the same
      };

      // add the circle
      _rendering.circles.push(wordCircle);

      // add the text
      _rendering.texts.push(wordText);
    });
  }

  function _addPositions() {
    // add default positions of word circles with its text
    _addDefaultPositions();

    const ellipseClass = 'word__circle_test';

    let collisionSelection;
    let collisionEllipses;

    let called = false;

    function _simulationCirclesTick() {
      const collisionElements = collisionSelection.filter(d => !d.isMainWord);

      collisionElements.each(d => {
        const xPos = _params.viz.width / 2 + d.x;
        const yPos = _params.viz.height / 2 + d.y;

        _svg
          .select(`#${getCircleId(d)}`)
          .attr('cx', xPos)
          .attr('cy', yPos);

        _svg
          .select(`#${getTextId(d)}`)
          .attr('x', xPos)
          .attr('y', yPos);
      });

      collisionSelection
        .attr('cx', d => _params.viz.width / 2 + d.x)
        .attr('cy', d => _params.viz.height / 2 + d.y);
    };

    function _simulationCategoriesCirclesTick() {
      if (!called) {
        console.log('SVG', _params.viz.svgId, select(`#${_params.viz.svgId}`),
          select(`#${_params.viz.svgId}`).selectAll('.word__circle'));
        called = true;
      }

      collisionSelection.each(d => {
        const positionRadius = _scale.scoreRadius(d.score);
        const startAnglePoint = pointOnCircle(positionRadius, d.category.startAngle);
        const endAnglePoint = pointOnCircle(positionRadius, d.category.endAngle);

        const angle = Math.PI - Math.atan2(d.y, d.x);

        if (angle < d.category.startAngle) {
          d.x = startAnglePoint.x;
          d.y = startAnglePoint.y;
        } else if (angle > d.category.endAngle) {
          d.x = endAnglePoint.x;
          d.y = endAnglePoint.y;
        }

        // if (d.text === 'be') {
        //   console.log('ANGLE', d.x, d.y);
        //   console.log(angle, d.category.startAngle, d.category.endAngle);
        // }

        _svg.select(`#${ellipseClass}_${getCircleId(d)}`)
          .attr('cx', _params.viz.width / 2 + d.x)
          .attr('cy', _params.viz.height / 2 + d.y);

        _svg
          .select(`#${getCircleId(d)}`)
          .attr('cx', _params.viz.width / 2 + d.x)
          .attr('cy', _params.viz.height / 2 + d.y);

        _svg
          .select(`#${getTextId(d)}`)
          .attr('x', _params.viz.width / 2 + d.x)
          .attr('y', _params.viz.height / 2 + d.y);
      });
    };

    if (!_categories) {
      const mainWord = _data.mainWord;
      const mainWordEllipse = {
        isMainWord: true,
        x: mainWord.x + _params.viz.width / 2,
        y: mainWord.y + _params.viz.height / 2,
        fx: mainWord.x, // fixed x position: the node's position is not changed by force layout
        fy: mainWord.y, // fixed y position
        rx: Math.max(mainWord.size.width / 1.5, _scale.freqRadius(mainWord.freq)),
        ry: mainWord.size.height / 1.5,
        wordRadial: 0,
        text: mainWord.text,
        fill: 'rgba(50, 50, 50, 0.3)'
      };

      collisionEllipses = [..._rendering.circles, mainWordEllipse];

      const _simulationCircles = forceSimulation(collisionEllipses)
        .force('charge', forceManyBody().strength(-20))
        .force('collide', ellipseCollide().radius(d => ([d.rx, d.ry])))
        .force('r', forceRadial(d => d.wordRadial));

      _simulationCircles.on('tick', _simulationCirclesTick);

      // ellipses used for force layout - visible in debug only
      collisionSelection = _svg
        .selectAll(`.${ellipseClass}_${_params.viz.svgId}`)
        .data(collisionEllipses)
        .enter()
        .append('ellipse')
        .attr('id', d => `${ellipseClass}_${getCircleId(d)}`)
        .attr('class', `${ellipseClass}_${_params.viz.svgId}`)
        .attr('fill', d => d.fill)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('rx', d => d.rx)
        .attr('ry', d => d.ry)
        .attr('opacity', 0.5)
        .attr('title', d => d.text)
        .style('display', _debug ? 'inherit' : 'none');
    } else {
      collisionEllipses = _rendering.circles;

      const _simulationCircles = forceSimulation(collisionEllipses)
        .force('charge', forceManyBody().strength(10))
        .force('collide', ellipseCollide().radius(d => ([d.rx, d.ry])))
        .force('r', forceRadial(d => d.wordRadial));

      _simulationCircles.on('tick', _simulationCategoriesCirclesTick);

      // ellipses used for force layout - visible in debug only
      collisionSelection = _svg
        .selectAll(`.${ellipseClass}_${_params.viz.svgId}`)
        .data(collisionEllipses)
        .enter()
        .append('ellipse')
        .attr('id', d => `${ellipseClass}_${getCircleId(d)}`)
        .attr('class', `${ellipseClass}_${_params.viz.svgId}`)
        .attr('fill', d => d.fill)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('rx', d => d.rx)
        .attr('ry', d => d.ry)
        .attr('opacity', 0.5)
        .attr('title', d => d.text)
        .style('display', _debug ? 'inherit' : 'none');
    }
  }

  function _draw(initShapes) {
    if (initShapes) {
      // draw all shapes, start with SVG container
      _svg = _shapeService.createSVG(_params.viz, _params.viz.svgId);
    }

    // add the positions to the words
    _addPositions();

    // if categories are enabled, draw them as arcs in the background
    if (_categories && _params.category.show) {
      const categoryArcsData = categoryArcs('category__arc', _params, _scale, _shapeService);

      _shapeService.drawShape(_categories, categoryArcsData, initShapes);
    }

    if (_categories && _params.category.showLabel) {
      const categoryTextsData = categoryTexts('category__text', _params, _scale);
      const categoryParams = _categories.map((category, i) => {
        // take the max radius and make it bigger so that text doesn't collide with category arc
        const radius = _scale.scoreRadius.range()[0] + _params.category.labelPadding;
        // the angle at which the label will be placed is in the middle between startAngle and endAngle
        const angle = category.startAngle + (category.endAngle - category.startAngle) / 2;
        // get the point the circle according to the given arguments
        const point = pointOnCircle(radius, angle);

        return {
          id: `category__text-${i}`,
          name: category.name,
          text: category.text,
          mainWord: _data.mainWord.text,
          index: i,
          x: point.x,
          y: point.y
        };
      });

      _shapeService.drawShape(categoryParams, categoryTextsData, initShapes);
      _shapeService.createTspanText(categoryParams, _params);
    }

    if (_params.tick.show) {
      // use the ticks function from score scale to get rounded values for ticks
      const ticksData = _scale.scoreColor.ticks(_params.tick.number);

      // order the ticks from highest score to the lowest (from middle to outside score)
      ticksData.sort((a, b) => b - a);

      // store the ticks so it is accessible
      _params.tick.values = ticksData.map(d => ({
        id: uniqueId(d),
        value: d
      }));

      const scoreLegendTicksData = scoreLegendTicks('score-tick__circle', _params, _scale, _shapeService);

      _shapeService.drawShape(_params.tick.values, scoreLegendTicksData, initShapes);
    }

    // order words so that they are sorted from highest to the lowest scoreLegendTicksData
    const allWordsSorted = allWords(_data.words).sort((a, b) => b.score - a.score);

    if (_params.circle.show) {
      const mainWordCircleData = mainWordCircle('main-word__circle', _params, _scale, _shapeService);
      const wordCirclesData = wordCircles('word__circle', _params, _scale, _shapeService);

      _shapeService.drawShape([_data.mainWord], mainWordCircleData, initShapes);
      _shapeService.drawShape(allWordsSorted, wordCirclesData, initShapes);
    }

    if (_params.text.show) {
      const mainWordTextData = mainWordText('main-word__text', _params, _scale, _shapeService);
      const wordTextsData = wordTexts('word__text', _params, _scale, _shapeService);

      _shapeService.drawShape([_data.mainWord], mainWordTextData, initShapes);
      _shapeService.drawShape(allWordsSorted, wordTextsData, initShapes);
    }
  }

  function _prepareData(data) {
    let updatedData = {};
    let newWords = [];

    data.words.forEach((words, i) => {

      // create new array of words
      let newCategoryWords = [];

      // sort words according to the score
      words.sort((a, b) => b.score - a.score);

      // by default, show all words
      let shownWords = words;

      // but if parameter specified, take only given number of words for each category
      if (_params.viz.maxItems) {
        shownWords = words.slice(0, _params.viz.maxItems);
      }

      shownWords.forEach(word => {
        let newWord = Object.assign({}, word);

        // if categories are created, add the information to each word
        if (_categories) {
          // copy the category info
          const categoryInfo = Object.assign({}, newWord.category);

          // store the link to the category to which the word belongs to
          newWord.category = _categories[i];
          // add the category info back to the word's category object
          newWord.category.freq = categoryInfo.freq;
          newWord.category.name = categoryInfo.name;
          newWord.category.text = categoryInfo.text;
          newWord.category.score = categoryInfo.score;
        }

        newCategoryWords.push(newWord);
      });

      newWords.push(newCategoryWords);
    });

    updatedData.mainWord = Object.assign({}, data.mainWord);
    updatedData.words = newWords;

    return updatedData;
  }

  function _filterData(data) {
    let updatedData = {};
    let filteredWords = [];

    data.words.forEach((words, categoryIndex) => {

      let categoryVisible = false;

      if (words.length) {
        // all words have the same category, so find from the first one what is the name of the category
        const name = words[0].category.name;

        // find the category settings from the params
        // 1) it can be defined either by the name in "category.items"
        const category = _params.category.items
          ? _params.category.items.find(category => category.name === name)
          : false;

        // if category item is found get the info if it should be shown
        const categoryNameDefined = category
          ? category.show
          : false;

        // find the category settings from the params
        // 2) it can be defined as an index in "category.showItems"
        const categoryIndexDefined = _params.category.showItems
          ? _params.category.showItems.includes(categoryIndex)
          : false;

        // if the category is not defined in the params, it should be not shown by default
        if (categoryNameDefined || categoryIndexDefined) {
          categoryVisible = true;
        }
      }

      // only if the category should be shown, add the words to the new array of words
      if (categoryVisible) {
        filteredWords.push(words);
      }

    });

    updatedData.mainWord = Object.assign({}, data.mainWord);
    updatedData.words = filteredWords;

    return updatedData;
  }

  function _calculateCategoryParams(data) {
    // adjust the padAngle so that strokes do not overlap each other
    let padAngle = _params.category.strokeWidth / 200;

    // create a function that creates the pie arc objects
    // value - get all frequencies summed up for a given category
    const pieShape = pie()
      .sort(null)
      .value(words => {
        // if the frequency differene should not be shown, assign the same number to all of the words categories
        let value = 1;

        if (_params.category.differentAngles) {
          // if the frequency diff should be shown, assign the sum of all frequencies to the value
          value = words.reduce((sum, word) => sum + word.freq, 0);
        }

        return value;
      });

    // move the start and end angle so that the result does not resemble a "target" when showing four categories
    pieShape
      .startAngle(0)
      .endAngle(Math.PI * 2)
      .padAngle(padAngle);

    // return new array where for each category
    // there is an object containing information about its renderable arc
    return pieShape(data);
  }

  function createViz(data, initShapes) {
    // if category is disabled all data will be shown
    // duplicate the data so a local copy can be modified without changing the originally data
    let shownData = Object.assign({}, data);

    if (_params.category.show) {
      // if there are items specified, filter only the given categories into the shown data
      if (_params.category.items || _params.category.showItems) {
        shownData = _filterData(data);
      }

      // calculate the arc information for categories
      _categories = _calculateCategoryParams(shownData.words);
    }

    // prepare the data (add categories if enabled, change the structure - add mainWord and data)
    _data = _prepareData(shownData);

    _initScales();

    // after scales were created, find the words' sizes
    _addWordSize();

    _draw(initShapes);
  }

  function update(data) {
    createViz(data, false);
  }

  (function init(data, params) {
    _shapeService = ShapeService();

    _params = getNewParams(defaultParams, params);

    createViz(data, true);
  })(data, params);

  return {
    _svg,
    _data,
    _scale,
    _params,
    update
  };
}

export default RadialViz;
