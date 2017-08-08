import { json } from 'd3-request';

const _parseWord = (data, category, mainWord) => {
  let word = {
    text: data.word || (data.name.replace('"%w"', mainWord)),
    freq: data.freq || data.count,
    score: data.score,
    id: data.id || data.seek
  };

  if (category) {
    word.category = category;
  }

  return word;
};

const _parseWSDiffWord = (data) => {
  const score1 = data.rnk1str === '--' ? 0 : parseFloat(data.rnk1str);
  const score2 = data.rnk2str === '--' ? 0 : parseFloat(data.rnk2str);

  return {
    text: data.word,
    score: score1 - score2,
    words: [
      {
        score: score1,
        freq: data.cnt1,
        id: data.seek1
      },
      {
        score: score2,
        freq: data.cnt2,
        id: data.seek2
      }
    ]
  };
};

const _parseCategory = (data, sketchClusterWord) => {
  // Thes contains category name in 'word' param; Sketch contains it in name param
  const name = data.name || data.word;

  // Sketch should include category name along with clustered word
  // Thes category's name is the clustered word, so it doesn't need to be added
  const text = sketchClusterWord ? `${name} (${sketchClusterWord})` : name;

  return {
    name,
    text,
    score: data.score,
    freq: data.freq || 0
  };
};

const _parseThesWords = (rawWords) => {
  let words;

  // check whether data is clustered
  const clustered = rawWords.find(d => d.Clust) !== undefined;

  if (clustered) {
    // array of arrays - each array represents one cluster
    words = rawWords.map(wordsInCluster => {
      // add the information about the cluster into an object
      const category = _parseCategory(wordsInCluster);

      // add all words from the cluster
      let cluster = wordsInCluster.Clust ? wordsInCluster.Clust.map(word => _parseWord(word, category)) : [];

      // add the word that is main for the current cluster and indicate that
      let mainWordInCluster = _parseWord(wordsInCluster, category);

      mainWordInCluster.mainInCluster = true;
      cluster.push(mainWordInCluster);

      return cluster;
    });
  } else {
    // array containg one array only
    words = [ rawWords.map(word => _parseWord(word)) ];
  }

  return words;
};

const _parseSketchWords = (rawWords, mainWord) => {
  let words;

  // check whether data is clustered
  const clustered = rawWords.find(d => d.Words.find(w => w.Clust)) !== undefined;

  if (clustered) {
    words = [];

    rawWords.forEach(wordsInCategory => {
      // the clustered words are inside the words object
      wordsInCategory.Words.forEach(wordsInCluster => {
        const category = _parseCategory(wordsInCategory, wordsInCluster.word);

        // create a cluster of the words, if there is not the Clust array, then create an empty array
        const cluster = wordsInCluster.Clust
          ? wordsInCluster.Clust.map(word => _parseWord(word, category, mainWord))
          : [];

        // add the word that is main for the current cluster and indicate that
        const mainWordInCluster = _parseWord(wordsInCluster, category, mainWord);

        mainWordInCluster.mainInCluster = true;
        cluster.push(mainWordInCluster);

        // add the array of words representing one cluster to the words array
        words.push(cluster);
      });
    });

  } else {
    words = rawWords.map(wordsInCategory => {
      const category = _parseCategory(wordsInCategory);

      return wordsInCategory.Words.map(word => _parseWord(word, category, mainWord));
    });
  }

  return words;
};

const _parseWSDiffWords = (rawWords, mainWords) => {
  let categories = [];

  // there are number of categories (grammatical relations), each containing words
  rawWords.forEach(wordsInTable => {
    const category = {};

    category.info = {
      name: wordsInTable.table.Header[0],
      words: [
        {
          freq: wordsInTable.table.Header[1],
          score: parseFloat(wordsInTable.table.Header[3])
        }, {
          freq: wordsInTable.table.Header[2],
          score: parseFloat(wordsInTable.table.Header[4])
        }
      ]
    };

    category.words = wordsInTable.table.Rows.map(word => _parseWSDiffWord(word));

    // push the updated data structure into all words array
    categories.push(category);
  });

  return categories;
};

const parseData = (rawData, type) => {
  // type of raw data mapped to the function which parses the data into the correct structure
  const parse = {
    'THES': {
      func: _parseThesWords,
      words: rawData.Words,
      mainWord: {
        text: rawData.lemma,
        freq: rawData.freq
      }
    },
    'SKETCH': {
      func: _parseSketchWords,
      words: rawData.Gramrels,
      mainWord: {
        text: rawData.lemma,
        freq: rawData.freq
      }
    },
    'WS_DIFF': {
      func: _parseWSDiffWords,
      words: rawData.content ? rawData.content.common : undefined,
      mainWords: [
        {
          text: rawData.lbl1,
          freq: rawData.frq1
        },
        {
          text: rawData.lbl2,
          freq: rawData.frq2
        }
      ]
    }
  };

  // create new data structure
  let data = {};

  // type of word of the query - if only one word 'mainWord' is chosen, otherwise 'mainWords' is chosen
  const mainWordType = parse[type].mainWord ? 'mainWord' : 'mainWords';

  data.words = parse[type].func(parse[type].words, parse[type][mainWordType].text);
  data[mainWordType] = parse[type][mainWordType];

  return data;
};

const parseURL = (url, type) => {
  return new Promise((resolve, reject) => {
    json(url, (error, data) => {
      return error ? reject(error) : resolve(parseData(data, type));
    });
  });
};

const range = (data, param, includeMainWord) => {
  let range = [];

  // words is array of arrays of objects
  data.words.forEach(words => {
    // for each object in the array in the words array, add the parameter's value into the array
    words.forEach(word => range.push(word[param]));
  });

  if (includeMainWord) {
    // initiate the array with the main words param
    range.push(data.mainWord[param]);
  }

  return range;
};

const allWords = (data) => {
  return [].concat.apply([], data);
};

export { parseURL, parseData, range, allWords };
