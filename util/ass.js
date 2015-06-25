var        q = require('../node_modules/q');
var       rs = require('../node_modules/readline-sync');
var        h = require('../node_modules/htmlstrip-native');
var       sh = require('../node_modules/sanitize-html');
var       nl = require('../node_modules/newline-remove');
var       fr = require('../node_modules/feed-read');
var Entities = require('../node_modules/html-entities').AllHtmlEntities;
var entities = new Entities();


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


var  o = { include_script: false, include_style: false, compact_whitespace: true };

exports.strip = function(text) {
  try {
    text = h.html_strip(text,o);
    return text;
  } catch(ex) { return 'parse failure: ' + ex + ' for '  + text; }
};