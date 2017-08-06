// external libraries
import { scaleLinear, scaleSqrt } from 'd3-scale';
import { extent, range } from 'd3-array';

// internal helper functions
import ShapeService from '../utils/shape-service';
import { circleCollision, rectangleCollision, getNewParams } from '../utils/utils';

// internal functions and params for viz
import defaultParams from './defaults';
import { wordCircles, wordTexts, categoryName, mainWordsBackground, mainWordsText,
  scoreBackground, scoreLegendTicks, scoreLegendNumbers, scoreLegendText } from './shapes';

/**
 * OpposiveViz
 * @param {object} data - data containing words and main words
 * @param {object} params - parameters
 * @returns {void}
 */
function OppositeViz(data, params) {

  let _shapeService;
  let _params;
  let _data;

  let _scale = {
    scoreRange: undefined,
    scoreColor: undefined,
    freqRadius: undefined,
    fontSize: undefined
  };

  let _ticks = {
    score: undefined
  };

  let _rendering = {
    circles: {},
    texts: {}
  };

  function _range(param) {
    return _data.words.map(category => {
      // each word has two freq values
      const categoryRange = category.words.map(categoryWord => {
        return [categoryWord.words[0][param], categoryWord.words[1][param]];
      });

      // flatten array of arrays into one array of freq range of a category
      return [].concat(...categoryRange);
    });
  }

  function _sumedFreq() {
    return _data.words.map(category => {
      // each word has two freq values
      const categoryFreq = category.words.map(categoryWord => {
        return categoryWord.words[0].freq + categoryWord.words[1].freq;
      });

      // flatten array of arrays into one array of freq range of a category
      return [].concat(...categoryFreq);
    });
  }

  function _getScoreTicks(scoreExtent) {
    let rangeScore = scoreExtent;

    // if the scores do not include 0, that means that words occur only with one word
    // and scale needs to be adjusted so it is visualized correctly
    if (!rangeScore.includes(0)) {
      const midScore = Math.abs(rangeScore[1] - rangeScore[0]) / 2;

      if (rangeScore[0] < 0) {
        rangeScore = extent([...rangeScore, 0, midScore]);
      } else {
        rangeScore = extent([-midScore, 0, ...rangeScore]);
      }
    }

    // create a test scale from which ticks will be calculated
    let ticks = scaleLinear()
      .domain(rangeScore)
      .ticks(_params.tick.number);

    const tickStep = ticks[1] - ticks[0];

    // if after adjustment, min and max are still not included, add them
    const minData = scoreExtent[0];
    const maxData = scoreExtent[1];
    let minTick = ticks[0];
    let maxTick = ticks[ticks.length - 1];

    // add the missing ticks between minData and minTick
    if (minData < minTick) {
      // ceil the number of steps needed
      const stepsMissingMin = Math.ceil(Math.abs(minData - minTick) / tickStep);

      range(0, stepsMissingMin, 1).forEach(() => {
        // add new min tick
        ticks = [ minTick - tickStep, ...ticks];
        // update the min tick
        minTick = ticks[0];
      });
    }

    // add the missing ticks between maxData and maxTick
    if (maxData > maxTick) {
      // ceil the number of steps needed
      const stepsMissingMin = Math.ceil(Math.abs(maxData - maxTick) / tickStep);

      range(0, stepsMissingMin, 1).forEach(() => {
        // add new max tick
        ticks = [ ...ticks, maxTick + tickStep];
        // update the max tick
        maxTick = ticks[ticks.length - 1];
      });
    }

    // add a tick at each of the ends - this creates a margin for the words
    // so that they do not overlap with main words
    ticks = [ticks[0] - tickStep, ...ticks, ticks[ticks.length - 1] + tickStep];

    return ticks;
  }

  function _createColorRange(scoreExtent) {
    const maxAbs = Math.max(Math.abs(scoreExtent[0]), Math.abs(scoreExtent[1]));

    // symmmetric score extent where 0 is in the middle
    const symmetricScoreExtent = [-maxAbs, maxAbs];

    // symmetric score scale for symmetric colors in params
    const symmetricColorScale = scaleLinear()
      .domain(symmetricScoreExtent)
      .range(_params.score.color);

    // color for given min score
    const minScoreColor = symmetricColorScale(scoreExtent[0]);
    // color for given max score
    const maxScoreColor = symmetricColorScale(scoreExtent[1]);
    // assymmetric colors for given score extent
    const scoreExtentColors = [minScoreColor, maxScoreColor];

    return scoreExtentColors;
  }

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

  function _createMainWords() {
    return [
      {
        id: `main_word-0-${ _data.mainWords[0].text }`,
        text: _data.mainWords[0].text,
        freq: _data.mainWords[0].freq,
        color: _params.score.color[1],
        x: _params.viz.width,
        y: 0
      },
      {
        id: `main_word-1-${ _data.mainWords[1].text }`,
        text: _data.mainWords[1].text,
        freq: _data.mainWords[1].freq,
        color: _params.score.color[0],
        x: -(_params.viz.mainWordWidth),
        y: 0
      }
    ];
  }

  function _createScoreLegendText() {
    return _params.score.showText.map((text, i) => {

      let newLegendText = text;
      const mainWords = _createMainWords();
      const reMainWord1 = /%w1/g.exec(text);

      if (reMainWord1) {
        newLegendText = text.replace(/%w1/g, mainWords[0].text);
      }

      const reMainWord2 = /%w2/g.exec(newLegendText);

      if (reMainWord2) {
        newLegendText = newLegendText.replace(/%w2/g, mainWords[1].text);
      }

      // place the middle word in the place where score is 0, that means in the middle of the scale
      let x = _params.viz.width / 2 + _scale.scoreRange(0);

      if (i === 0) {
        // place the text with the first main word to the left side, belove the word
        x = i * (_params.viz.width / 2) - _params.viz.mainWordWidth;
      } else if (i === _params.score.showText.length - 1) {
        // place the text with the second main word to the left side, belove the word
        x = i * (_params.viz.width / 2) + _params.viz.mainWordWidth;
      }

      let y = _params.viz.height + 15;

      return {
        x,
        y,
        text: newLegendText
      };
    });
  }

  function _createScoreLegendTicks() {
    let legendTicks = _ticks.score.map(tick => ({
      text: tick,
      x: _scale.scoreRange(tick),
      y: _params.viz.height
    }));

    return legendTicks;
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
      words: word.words,
      id: word.words[0].id // both words' id are the same
    };
  }

  function _createWordCircles(word) {
    const radiusCircle1 = _scale.freqRadius(word.words[0].freq);
    const radiusCircle2 = _scale.freqRadius(word.words[1].freq);

    return [
      {
        x: word.x + radiusCircle1,
        y: word.y,
        r: radiusCircle1,
        freq: word.words[0].freq,
        score: word.score,
        color: _params.circle.color[1],
        id: `${word.words[0].id}__0`,
        text: word.text,
        wordX: word.x,
        wordY: word.y
      },
      {
        x: word.x - radiusCircle2,
        y: word.y,
        r: radiusCircle2,
        freq: word.words[1].freq,
        score: word.score,
        color: _params.circle.color[0],
        id: `${word.words[1].id}__1`,
        text: word.text,
        wordX: word.x,
        wordY: word.y
      }
    ];
  }

  function _createScoreBackground(i) {
    // do not create a label for the last tick - it would be hidden behind the main word
    const ticks = _ticks.score.slice(0, _ticks.score.length - 1);

    const tileWidth = _scale.scoreRange(ticks[1]) - _scale.scoreRange(ticks[0]);

    // create an array of objects that include the information for rendering
    const scoreBackground = ticks.reverse().map((number, j) => ({
      score: number,
      x: _scale.scoreRange(number) + _params.viz.width / 2,
      y: 0,
      width: tileWidth,
      height: _params.viz.height,
      id: `${ i }-${ j }`
    }));

    return scoreBackground;
  }

  function _initScales() {
    // range of freq is an array of arrays - an array for each category
    const freqRange = extent([].concat(..._range('freq')));

    // range of sumed freq for each word
    const sumedFreqRange = extent([].concat(..._sumedFreq()));

    // range of scores is an array of arrays - an array containg score differences
    let scoreRange = _data.words.map(category => {
      return category.words.map(word => word.score);
    });

    // get the extent of the score range
    scoreRange = extent([].concat(...scoreRange));

    // update the number of ticks
    const scoreTicks = _getScoreTicks(scoreRange);

    // store the ticks
    _ticks.score = scoreTicks;

    // update the range - take the range from updated ticks
    scoreRange = extent(scoreTicks);

    // adjusted color range for score range that could be assymetric
    const scoreColors = _createColorRange(scoreRange);

    _scale.freqRadius = scaleSqrt()
      .domain(freqRange)
      .range(_params.circle.size);

    _scale.fontSize = scaleSqrt()
      .domain(sumedFreqRange)
      .range(_params.text.size);

    _scale.scoreRange = scaleLinear()
      .domain(scoreRange)
      .range([-_params.viz.width / 2, +_params.viz.width / 2]);

    _scale.scoreColor = scaleLinear()
      .domain(scoreRange)
      .range(_params.circle.color);

    _scale.scoreBackgroundColor = scaleLinear()
      .domain(scoreRange)
      .range(scoreColors);
  }

  function _addPositions(wordsInCategory, i) {
    // all circles for a category
    _rendering.circles[i] = [];

    // all texts for a category
    _rendering.texts[i] = [];

    // sort all word so that words with biggest sum of freqs are placed first
    const sortedWordsInCategory = wordsInCategory.words.slice()
      .sort((word2, word1) => {
        return (word1.words[0].freq + word1.words[1].freq) - (word2.words[0].freq + word2.words[1].freq);
      });

    sortedWordsInCategory.forEach(word => {
      // limit for calculating collisions - the more words, the smaller the threshold
      let threshold = Math.round((1 / (sortedWordsInCategory.length) ^ 2) * 1000);
      // hold circles that are colliding
      let collided = {};

      while (threshold > 0 && collided !== undefined) {
        const minY = _scale.freqRadius.range()[1];
        const maxY = _params.viz.height - minY;

        word.x = _scale.scoreRange(word.score);
        word.y = Math.floor(Math.random() * (maxY - minY)) + minY;

        // create circles for each part
        const wordCircles = _createWordCircles(word);

        // find out if circles collide
        collided = _rendering.circles[i].find(circle => {
          return circleCollision(circle, wordCircles[0]) || circleCollision(circle, wordCircles[1]);
        });

        // if no collision of circles detected, continue to detect collisions of texts
        if (collided === undefined) {
          // create texts for each part
          const wordText = _createWordText(word);

          // find out if texts collide
          collided = _rendering.texts[i].find(text => {
            return rectangleCollision(text, wordText);
          });

          // if no collision of circles and texts detected
          if (collided === undefined) {
            // add the circles
            _rendering.circles[i].push(wordCircles[0]);
            _rendering.circles[i].push(wordCircles[1]);

            // add the text
            _rendering.texts[i].push(wordText);
          }
        }

        threshold--;
      }
    });
  }

  function _draw() {
    _data.words.forEach((wordsInCategory, i) => {
      const svgId = `${ _params.viz.svgId }-${ i }`;

      const mainWords = _createMainWords();

      _shapeService.createSVG(_params.viz, svgId);

      _addPositions(wordsInCategory, i);

      // create data objects with parameters for background shapes
      const bckgData = scoreBackground(`score-bg__rect-${ i }`, _params, _scale);

      // draw background rectangles for score  and put them in a group
      _shapeService.drawShape(_createScoreBackground(i), bckgData, true);

      if (_params.score.showNumbers) {
        // create an array of tick values
        const scoreLegendTickValues = _createScoreLegendTicks();

        // create data objects with parameters for legend ticks and numbers
        const scoreLegendTicksData = scoreLegendTicks(`score-tick__rect-${ i }`, _params);
        const scoreLegendTicksNumbersData = scoreLegendNumbers(`score-tick__text-${ i }`, _params);

        // draw rectangles and numbers as legend and put them in a group
        _shapeService.drawShape(scoreLegendTickValues, scoreLegendTicksData, true);
        _shapeService.drawShape(scoreLegendTickValues, scoreLegendTicksNumbersData, true);
      } else if (_params.score.showText) {
        // create an array of text values
        const scoreLegendTextData = scoreLegendText(`legend-text-${ i }`, _params);

        // draw text as legend and put them in a group
        _shapeService.drawShape(_createScoreLegendText(), scoreLegendTextData, true);
      }

      if (_params.category.showName) {
        const mainWordsTexts = `${ mainWords[0].text }/${ mainWords[1].text }`;
        // create an array that wil cotain the name of the category
        const categoryNameTexts = [wordsInCategory.info.name.replace('%w', mainWordsTexts)];

        // create data objects with parameters for category name
        const categoryNameData = categoryName(`category__text-${ i }`, _params);

        // draw text of the category and put them in a group
        _shapeService.drawShape(categoryNameTexts, categoryNameData, true);
      }

      // create data objects with parameters for main words background
      const mainWordsData = mainWordsBackground(`main-word__rect-${ i }`, _params);

      // draw rectangles of the main words and put them in a group
      _shapeService.drawShape(mainWords, mainWordsData, true);

      if (_params.circle.show) {
        // create data objects with parameters for word circles
        const wordCirclesData = wordCircles(`word__circles-${ i }`, _params, _scale);

        // draw circles of the words and put them in a group
        _shapeService.drawShape(_rendering.circles[i], wordCirclesData, true);
      }

      if (_params.text.show) {
        // create data objects with parameters for main word texts
        const mainWordsTextData = mainWordsText(`main-word__text-${ i }`, _params);
        // create data objects with parameters for word texts
        const wordsTextData = wordTexts(`word__text-${ i }`, _params, _scale);

        // draw the text of main words and all other words and put them in separate groups
        _shapeService.drawShape(mainWords, mainWordsTextData, true);
        _shapeService.drawShape(_rendering.texts[i], wordsTextData, true);
      }
    });
  }

  _shapeService = ShapeService();

  _params = getNewParams(defaultParams, params);
  // update the width - don't include the panels for main words
  _params.viz.width -= _params.viz.mainWordWidth * 2;
  // update the margins - don't include the panels for main words
  _params.viz.margin.left += _params.viz.mainWordWidth;
  _params.viz.margin.right += _params.viz.mainWordWidth;

  // duplicate the data so a local copy can be modified without changing the originally data
  _data = Object.assign({}, data);

  // filter out categories according to their indexes which were given in parameters
  if (_params.category.showItems) {
    _data.words = _params.category.showItems.map(itemIndex => {
      return data.words[itemIndex];
    });
  }

  _initScales();

  _draw();

}

export default OppositeViz;
