// external libraries
import { scaleLinear, scaleSqrt } from 'd3-scale';
import { extent } from 'd3-array';
import { pie } from 'd3-shape';

// internal helper functions
import ShapeService from '../utils/shape-service';
import { allWords, range } from '../utils/data-service';
import { circleCollision, rectangleCollision, pointOnCircle, randomPointOnCircle, getNewParams } from '../utils/utils';

// internal functions and params for viz
import defaultParams from './defaults';
import { wordCircles, mainWordText, wordTexts, mainWordCircle,
  categoryArcs, categoryTexts, scoreLegendTicks } from './shapes';

/**
 * RadialViz
 * @param {object} data - data containing words
 * @param {object} params - parameters
 * @returns {void}
 */
function RadialViz(data, params) {

  let _shapeService;
  let _params;
  let _data;
  let _categories;

  let _scale = {
    scoreRadius: undefined,
    scoreColor: undefined,
    freqRadius: undefined,
    fontSize: undefined
  };

  let _rendering = {
    circles: undefined,
    texts: undefined
  };

  function _getBoundingBox(word) {
    const id = 'bbox_text_id';
    // render a text to get its bounding box
    const textParams = {
      shape: 'text',
      class: 'bbox_text',
      enter: {
        id: d => id,
        x: d => 0,
        y: d => 0,
        fontSize: d => _scale.fontSize(d.freq),
        fontFamily: d => _params.text.font,
        text: d => d.text
      }
    };

    // draw the text into SVG
    _shapeService.drawShape([word], textParams, false);

    // default width is the length of the word
    let width = word.text.length;
    // default height is font size
    let height = _params.text.size[0];

    // get the rendered element
    const element = document.getElementById(id);

    if (element) {
      // get the bounding box
      const bbox = element.getBBox();

      // remove the text from SVG
      element.parentElement.removeChild(element);

      // update the variables
      width = bbox.width;
      height = bbox.height;
    }

    return {
      width,
      height
    };
  }

  function _initScales() {
    // firstly, initialize scales dependent on radius (will be used for score scales)
    const freqRange = extent(
      range(_data, 'freq', _params.circle.includeMainWord)
    );

    _scale.freqRadius = scaleSqrt()
      .domain(freqRange)
      .range(_params.circle.size);

    _scale.fontSize = scaleLinear()
      .domain(freqRange)
      .range(_params.text.size);

    // then initialize all other scales
    const scoreRange = extent(range(_data, 'score', false));

    const minScoreRadius = _params.circle.includeMainWord
      ? _scale.freqRadius(_data.mainWord.freq) * 1.75
      : _params.circle.spaceAroundCentre;

    _scale.scoreRadius = scaleLinear()
      .domain(scoreRange)
      .range([minScoreRadius, _params.viz.width / 2]);

    _scale.scoreColor = scaleLinear()
      .domain(scoreRange)
      .range(_params.circle.color);
  }

  function _createWordText(word) {
    const { width, height } = _getBoundingBox(word);

    return {
      x: word.x,
      y: word.y,
      width: width,
      height: height,
      text: word.text,
      score: word.score,
      id: word.id // both words' id are the same
    };
  }

  function _findPositions(sortedWords) {
    // initiliaze circles - circles with main word's circle can collide
    _rendering.circles = [];

    // however, texts with main word's text cannot collide, therefore initialize texts with the main word's text in it
    // its position is in the middle at [0, 0] - as they will be translated with half of viz width and height
    _data.mainWord.x = 0;
    _data.mainWord.y = 0;
    _rendering.texts = [_createWordText(_data.mainWord)];

    let collided;
    let thresholdReached = 0;

    sortedWords.forEach(word => {
      // limit for calculating collisions - the more words, the smaller the threshold
      let threshold = Math.round((1 / (sortedWords.length) ^ 2) * 10);

      // hold circles and text that are colliding
      collided = {};

      while (threshold > 0 && collided !== undefined && collided !== undefined) {
        let angleRange;

        if (_categories) {
          let startAngle = word.category.startAngle;
          let endAngle = word.category.endAngle;

          // if angle is wide enough, make 'padding' inside the arc so that words wouldn't be rendered on the edge
          if (endAngle - startAngle > 0.5) {
            const padding = 0.1;

            startAngle += padding;
            endAngle -= padding;
          }

          angleRange = [startAngle, endAngle];
        }

        const wordRadius = _scale.scoreRadius(word.score);
        const randomPoint = randomPointOnCircle(wordRadius, angleRange);

        word.x = randomPoint.x;
        word.y = randomPoint.y;

        const wordCircle = {
          x: word.x,
          y: word.y,
          r: _scale.freqRadius(word.freq),
          text: word.text,
          id: word.id,
          freq: word.freq,
          score: word.score
        };

        // find out if circles collide
        collided = _rendering.circles.find(circle => {
          return circleCollision(circle, wordCircle);
        });

        // if no collision of circles detected, continue to detect collisions of texts
        if (collided === undefined) {
          // create text
          const wordText = _createWordText(word);

          // find out if texts collide
          collided = _rendering.texts.find(text => {
            return rectangleCollision(text, wordText);
          });

          // if no collision of circles and texts detected
          if (collided === undefined) {
            // add the circle
            _rendering.circles.push(wordCircle);

            // add the text
            _rendering.texts.push(wordText);
          }
        }

        threshold--;

        if (threshold === 0) {
          thresholdReached++;
        }
      }
    });

    return thresholdReached;
  }

  function _addPositions() {
    const words = allWords(_data.words);

    // sort all word so that words with biggest sum of freqs are placed first
    const sortedWords = words.sort((word2, word1) => word1.freq - word2.freq);

    let threshold = 10;
    let thresholdReached = -1;

    while (threshold > 0 && thresholdReached !== 0) {
      // find positions and store positions
      thresholdReached = _findPositions(sortedWords);

      if (thresholdReached !== 0) {
        // make the range's of circles and fonts smaller and find positions again
        const oldFreqRadius = _scale.freqRadius.range();
        const minFreqRadius = oldFreqRadius[0] * 0.9;
        const maxFreqRadius = oldFreqRadius[1] * 0.9;

        _scale.freqRadius.range([minFreqRadius, maxFreqRadius]);

        const oldFontSize = _scale.fontSize.range();
        const minFontSize = oldFontSize[0] * 0.95;
        const maxFontSize = oldFontSize[1] * 0.95;

        _scale.fontSize.range([minFontSize, maxFontSize]);
      }

      threshold--;
    }

    // if positioning couldn't be find even after scaling down the scales
    if (threshold === 0 && thresholdReached !== 0) {
      // add random positions even if some of the words will be overlapped
      _findPositions(sortedWords);
    }
  }

  function _draw() {
    // draw all shapes, start with SVG container
    _shapeService.createSVG(_params.viz, _params.viz.svgId);

    // add the positions to the words
    _addPositions();

    // // order the words to be from the inside to the outside
    _data.words.forEach(words => words.sort((a, b) => a.score - b.score));

    // if categories are enabled, draw them as arcs in the background
    if (_categories && _params.category.show) {
      const categoryArcsData = categoryArcs('category__arc', _params, _scale, _shapeService);

      _shapeService.drawShape(_categories, categoryArcsData, true);
    }

    if (_categories && _params.category.showLabel) {
      const categoryTextsData = categoryTexts('category__text', _params, _scale);
      const categoryParams = _categories.map((category, i) => {
        // take the max radius and make it bigger so that text doesn't collide with category arc
        const radius = _scale.scoreRadius.range()[1] + _params.category.labelPadding;
        // the angle at which the label will be placed is in the middle between startAngle and endAngle
        const angle = category.startAngle + (category.endAngle - category.startAngle) / 2;
        // get the point the circle according to the given arguments
        const point = pointOnCircle(radius, angle);

        return {
          id: `category__text-${i}`,
          name: category.name,
          text: category.text,
          mainWord: _data.mainWord.text,
          x: point.x,
          y: point.y
        };
      });

      _shapeService.drawShape(categoryParams, categoryTextsData, true);
      _shapeService.createTspanText(categoryParams, _params);
    }

    if (_params.tick.show) {
      // use the ticks function from score scale to get rounded values for ticks
      const ticksData = _scale.scoreColor.ticks(_params.tick.number);

      // store the distance between two ticks; only if relevant
      if (ticksData.length > 1) {
        _params.tick.difference = ticksData[1] - ticksData[0];
      }

      const scoreLegendTicksData = scoreLegendTicks('score-tick__circle', _params, _scale, _shapeService);

      _shapeService.drawShape(ticksData, scoreLegendTicksData, true);
    }

    if (_params.circle.show) {
      const mainWordCircleData = mainWordCircle('main-word__circle', _params, _scale, _shapeService);
      const wordCirclesData = wordCircles('word__circle', _params, _scale, _shapeService);

      _shapeService.drawShape([_data.mainWord], mainWordCircleData, true);
      _shapeService.drawShape(allWords(_data.words), wordCirclesData, true);
    }

    if (_params.text.show) {
      const mainWordTextData = mainWordText('main-word__text', _params, _scale, _shapeService);
      const wordTextsData = wordTexts('word__text', _params, _scale, _shapeService);

      _shapeService.drawShape([_data.mainWord], mainWordTextData, true);
      _shapeService.drawShape(allWords(_data.words), wordTextsData, true);
    }
  }

  function _prepareData(data) {
    let updatedData = {};
    let newWords = [];

    data.words.forEach((words, i) => {

      // create new array of words
      let newCategoryWords = [];

      words.forEach(word => {
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

    data.words.forEach(words => {
      let categoryVisible = false;

      if (words.length) {
        // all words have the same category, so find from the first one what is the name of the category
        const name = words[0].category.name;

        // find the category settings from the params
        const category = _params.category.items.find(category => category.name === name);

        // if the category is not defined in the params, it should be not shown by default
        categoryVisible = category ? category.show : false;
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
    // create a function that creates the pie arc objects
    // value - get all frequencies summed up for a given category
    const pieShape = pie()
      .sort(null)
      .value(words => {
        // if the frequency differene should not be shown, assign the same number to all of the words categories
        let value = 1;

        if (_params.category.diff) {
          // if the frequency diff should be shown, assign the sum of all frequencies to the value
          value = words.reduce((sum, word) => sum + word.freq, 0);
        }

        return value;
      });

    // move the start and end angle so that the result does not resemble a "target" when showing four categories
    pieShape
      .startAngle(Math.PI / 4)
      .endAngle(Math.PI * 2 + Math.PI / 4);

    // return new array where for each category
    // there is an object containing information about its renderable arc
    return pieShape(data);
  }

  _shapeService = ShapeService();

  _params = getNewParams(defaultParams, params);

  // if category is disabled all data will be shown
  // duplicate the data so a local copy can be modified without changing the originally data
  let shownData = Object.assign({}, data);

  if (_params.category.show) {

    // if there are items specified, filter only the given categories into the shown data
    if (_params.category.items) {
      shownData = _filterData(data);
    }

    // calculate the arc information for categories
    _categories = _calculateCategoryParams(shownData.words);
  }

  // prepare the data (add categories if enabled, change the structure - add mainWord and data)
  _data = _prepareData(shownData);

  _initScales();

  _draw();

}

export default RadialViz;
