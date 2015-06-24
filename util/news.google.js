var    q = require('../node_modules/q');
var  ass = require('./ass');
var   fr = require('../node_modules/feed-read');
var   nr = require('../node_modules/node-readability');

var read = [];

exports.search = function(keywords) {
  var d = q.defer();
  try  {
    keywords = keywords.replace(/ /g, '%20');
    ass.askInt("How many news articles?  (99 max but often 30 is given) ")
      .then(function(count) {
        getFeed(keywords, count)
          .then(function(result) {
            console.log('returned from getFeed()...');
            var last = result.toPromise.reduce(function(promise, article) {
              return promise.then(function() {
                return readArticles(article);
              });
            }, q.resolve());
            
            last.then(function() {
              console.log('last article read.. updating core...');
              result.articles = read;
              console.log(JSON.stringify(result, null, 2));
              d.resolve(result);
            });
            
          }).catch(function(ex) {d.reject(ex);}).done();
      }).catch(function(ex) { d.reject(ex); });
      console.log(keywords);
  } catch(ex) { d.reject(ex); }
  return d.promise;
};

var readArticles = function(articleObjString) {
  var d = q.defer();
  try {
    var art = JSON.parse(articleObjString);
    console.log("begin reading article %s", art.title);
    nr(art.link,function(err, article, meta) {
      if(err) { console.log(err); } 
      else if(!article.content) { console.log('readability returned false...'); } 
      else {
        console.log('read successful...');
        art.content = article.content;
        art.text = ass.strip(art.content);
        if(art.content.indexOf('<p>') > -1) {
          art.containsParagraph = true; 
          
        }
        read.push(art);
        d.resolve();
      }
    });
  } catch(ex) { d.reject(ex); }
  return d.promise;
};

var sh = require('sanitize-html');
var nl = require('newline-remove');
var Entities = require('html-entities').AllHtmlEntities;
entities = new Entities();

var getParagraphs = function(content) {
  var d= q.defer();
  try { 
    var rez = {};
    rez.title = text.title;
    rez.content = text.content;
    rez.para = sh(text.content, {allowedTags: ['p']});
    rez.para = nl(rez.para);
    rez.para = entities.decode(rez.para);
    
    var open = "<p>";
    var clse = "</p>";
    var iB = 0; var iE = 0; var iI = 0;
    
    var pArray = [];
    
    while((iI = rez.para.indexOf(open,iI)) > -1) {
      iB = iI;
      if((iE = rez.para.indexOf(clse, iB)) > -1) {
        pArray.push(rez.para.substring((iB + open.length), iE));
      }
      iI = iE;
    }
    
    
    rez.paragraphs = pArray
  } catch(ex) { d.reject(ex); }
  return d.promise;
};

var getFeed = function(keywords, count) {
  var d = q.defer();
  try {
    var url = "https://news.google.com/news?pz=1&cf=all&ned=us&hl=en&&output=rss&num=" + count +"&q=" + keywords;
    console.log('getting feed.. %s', url);
    fr(url, function(err, articles) {
      if(err) { d.reject(err); } else {
        console.log('feeds obtained..');
        // loop through artciles trimming google from their url
        var result = {};
        result.keywords = keywords.replace(/%20/g,' ');
        result.url = url;
        result.articles = [];
        result.toPromise = [];
        console.log('begin trimming individual articles..');
        articles.forEach(function(article) { 
          delete article.feed;
          delete article.content;
          article.link = ass.gup('url', article.link);  
          result.articles.push(article);
          result.toPromise.push(JSON.stringify(article));
        });
        console.log('finsihed trimming individual articles...');
        d.resolve(result); 
      }
    });    
  } catch(ex) { d.reject(ex); }
  return d.promise;
}