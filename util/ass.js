var   q = require('../node_modules/q');
var  rs = require('../node_modules/readline-sync');
var   h = require('../node_modules/htmlstrip-native');
var  sh = require('../node_modules/sanitize-html');
var  nl = require('../node_modules/newline-remove');
var  fr = require('../node_modules/feed-read');
var  fs = require('fs');
var net = require('http');
var   e = require('../node_modules/html-entities').AllHtmlEntities;
var  wn = require('../node_modules/wordnet');
var  tm = require('../node_modules/text-miner');
var  op = require('../node_modules/opinion-lexicon');
var  rq = require('../node_modules/request');
var   o = { include_script: false, include_style: false, compact_whitespace: true };

var entities = new e();

var ft = [];
var negative = 0;
var positive = 0;
var  neutral = 0;


exports.requestJson = function(url) {
  var d = q.defer();
  try {
    rq(url,function(e, r, b) {
      if(e) {
        console.log('request error: %s', e);
        d.resolve({"json": ""});
      } else if(!e && r.statusCode == 200) {
        var j = JSON.parse(b);
        d.resolve(j);
      }
    });
  } catch(ex) { console.log("requestJson() ex: %s", ex); d.reject(ex); }
  return d.promse;
};

exports.askQuestion = function(question) {
   var d = q.defer();
   try  {
      var answer = rs.question(question);
      d.resolve(answer);
   } catch(ex) { d.reject(ex); }
   return d.promise;
};

exports.askInt = function(question) {
  var d = q.defer();
  try  {
     var answer = rs.questionInt(question);
     d.resolve(answer);
  } catch(ex) { d.reject(ex); }
  return d.promise;
};

exports.mineArticle = function(data) {
  console.log('begin mining articles...');
  var d = q.defer();
  try {
    var docArr = [];
    data.articles.forEach(function(article) { 
      docArr.push(article.text); 
      var matches = (article.text).match(/\b([A-Z]{2,})\b/g);
      if(matches !== null) capitals.push(matches);
    });
    
    
    var lNamesPromises = docArr.reduce(function(p, doc) {
      return p.then(function() {
        return findNames(doc);
      });
    }, q.resolve());
    
    lNamesPromises.then(function() {
      data.capitals = capitals;
    
      //data.names = names;
    });
    
    var corpus = new tm.Corpus(docArr);
    //var punc = ['\''  ,  '\"'  ,  '-'  ,   ':'  ,  '<'  ,  '>'  , '('  , ')'];
    corpus = corpus.clean().trim().removeInvalidCharacters().removeDigits().removeInterpunctuation().removeWords(tm.STOPWORDS.EN);
    var terms = new tm.Terms(corpus);
    var frequentTerms = terms.findFreqTerms(1);
    frequentTerms.sort(compare);
    var promises = [];
    frequentTerms.forEach(function(term) { promises.push(JSON.stringify(term)); });
    var last = promises.reduce(function(promise, word) {
      return promise.then(function() {
        return defineWord(word);
      });
    }, q.resolve());
    
    last.then(function() {
      console.log('last word defined.. updating core...');
      data.frequentTerms = ft;
      data.negative = negative;
      data.positive = positive;
      data.neutral  = neutral;
      d.resolve(data);
    });
  } catch(ex) { 
    console.log('mineArticle exceptiopn: %s', ex);
    d.reject(ex); 
  }
  return d.promise;
};

exports.getFeed = function(url) {
  var d = q.defer();
  try {
    fr(url, function(err, articles) {
      if(err) { console.log('%s errored..\n%s', url, err); d.resolve(); }
      else    {
        d.resolve(articles);
      }
    });
  } catch(ex) { d.reject(ex); }
  return d.promise;
};

var names = [];
var capitals = [];

var findNames = function(text) {
  var d = q.defer();
  try {
    var words = text.split(' ');
    var lastWord = false;
    var capsInARow = [];
    for(var i=0; i<words.length; i++) {
      if(words[i].trim() !== '') {
        if(/[A-Z]/.test(words[i][0]) && words[i].length > 1) {
          if(words[i].indexOf(',') === -1)
          capsInARow.push(words[i]);
          lastWord = true;
        } else {
          if(capsInARow.length > 1) capitals.push(capsInARow);
          capsInARow = [];
          lastWord = false;
        }
      } 
      // if(words[i].trim() !== '' || words[i + 1].trim() !== '') {
      //   if(/[A-Z]/.test(words[i][0]) && /[A-Z]/.test(words[i+1][0]) ) {
      //     names.push(words[i] + ' ' + words[i+1]);
      //   }
      // } 
    }
    d.resolve();
  } catch(ex) { console.log('findNames() exception: %s',ex.message); d.reject(ex);  }
  return d.promise;
};

exports.downloadFile = function(url, filePath, cb) {
  var d = q.defer();
  try {
    var file = fs.createWriteStream(filePath);
    var  req = net.get(url, function(res) {
      res.pipe(file);
      file.on('finish', function() {file.close(cb);});
    }).on('err0r', function(err) {
      fs.unlink(filePath);
      if(cb) cb(err.message);
      d.reject();
    });
    
  } catch(ex) { 
    console.log('donwloadFile() ex: %s', ex); 
    d.reject(ex);
  }
  return d.promise;
}

exports.buildGoogleNewsUrl = function() {
  var d = q.defer();
  try {
    var keywords = rs.question("Please enter keywords to search: ");
    var  count = rs.questionInt("How many news articles?  (99 max but often 30 is presented) ");
    var url = "https://news.google.com/news?pz=1&cf=all&ned=us&hl=en&&output=rss&num=" + count +"&q=" + keywords.replace(/ /g, '%20');
    var result = {};
    result.url = url;
    result.keywords = keywords;
    d.resolve(result);
  } catch(ex) { d.reject(ex); }
  return d.promise;
};

exports.getParagraphs = function(objReadability) {
  var d = q.defer();
  try {
  var rezult = {};
  rezult.title = objReadability.title;
  rezult.content = objReadability.content;
  rezult.para = sh(objReadability.content, {allowedTags: ['p']});
  rezult.para = nl(rezult.para);
  rezult.para = entities.decode(rezult.para);
  
  var open = "<p>";
  var clse = "</p>";
  var iB = 0; var iE = 0; var iI = 0;
  
  var pArray = [];
  
  while((iI = rezult.para.indexOf(open,iI)) > -1) {
    iB = iI;
    if((iE = rezult.para.indexOf(clse, iB)) > -1) {
      var p = rezult.para.substring((iB + open.length), iE).trim();
      if(p !== '')
        pArray.push(p);
    }
    iI = iE;
  }
  
  rezult.paragraphs = pArray;
  d.resolve(rezult);    
  } catch(ex) { d.reject(ex); }
  return d.promise;
};

exports.gup = function( name, link ) {
  name        = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS  = "[\\?&]"+name+"=([^&#]*)";
  var regex   = new RegExp( regexS );
  var results = regex.exec( link );
  if(results === null) return null;
  else                 return results[1];
};

exports.strip = function(text) {
  try {
    text = h.html_strip(text,o);
    return text;
  } catch(ex) { return 'parse failure: ' + ex + ' for '  + text; }
};


function compare(a,b) {
  if(a.count < b.count) return -1;
  if(a.count > b.count) return  1;
  return 0;
}

var defineWord = function(wordString) {
  var word = JSON.parse(wordString);
  var d = q.defer();
  try {
    wn.lookup(word.word, function(err, definitions) {
      
      if(err) { d.resolve(); }
      else {
        var glossory = [];
        definitions.forEach(function(definition) { glossory.push(definition.glossary);});
        word.glossory   = glossory;
        word.isPositive = false;
        word.isNeutral  = false;
        word.isNegative = false;
        if(op.isPositive(word.word)) {
          positive++;
          word.isPositive = op.isPositive(word.word);  
        } else if(op.isNeutral(word.word)) {
          neutral++;
          word.isNeutral = op.isNeutral(word.word);  
        } else if(op.isNegative(word.word)) {
          negative++;
          word.isNegative = op.isNegative(word.word);
        }
        ft.push(word);
        d.resolve();
      }
    });
  } catch(ex) { d.reject(ex); console.log('defineWord exceptiopn: %s', ex);}
  return d.promise;
};