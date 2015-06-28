var    q = require('../node_modules/q');
var  ass = require('./ass');
var   fr = require('../node_modules/feed-read');
var   nr = require('../node_modules/node-readability');

var read = [];

/*
  find more stuff to 
*/

exports.search = function(keywords) {
  var d = q.defer();
  try  {
    keywords = keywords.replace(/ /g, '%20');
    ass.askInt("How many news articles?  (99 max but often 30 is given) ")
      .then(function(count) {
        getFeed(keywords, count)
          .then(function(result) {
            //console.log('returned from getFeed()...');
            var last = result.toPromise.reduce(function(promise, article) {
              return promise.then(function() {
                return readArticle(article);
              });
            }, q.resolve());
            
            last.then(function() {
              console.log('last article read.. updating core...');
              result.articles = read;
              d.resolve(result);
            });
            
          }).catch(function(ex) {d.reject(ex);}).done();
      }).catch(function(ex) { d.reject(ex); });
      console.log(keywords);
  } catch(ex) { d.reject(ex); }
  return d.promise;
};

var readArticle = function(articleObjString) {
  var d = q.defer();
  try {
    var art = JSON.parse(articleObjString);
    console.log("begin reading article %s", art.title);
    nr(art.link,function(err, article, meta) {
      if(err) { console.log(err); d.resolve();} 
      else if(!article.content) { console.log('readability returned false...'); d.resolve(); } 
      else {
        //console.log('read successful...');
        art.content = article.content;
        art.text = ass.strip(art.content);
        if(art.content.indexOf('<p>') > -1) {
          art.containsParagraph = true; 
          ass.getParagraphs(article)
            .then(function(result) {
              art.paragraphs = result.paragraphs;
              read.push(art);
              d.resolve();
            }).catch(function(ex) {d.reject(ex);});
        } else {
          art.containsParagraph = false;
          read.push(art);
          d.resolve();
        }
      }
    });
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
        console.log('feeds obtained, %s articles..', articles.length);
        // loop through artciles trimming google from their url
        var result = {};
        result.keywords = keywords.replace(/%20/g,' ');
        result.url = url;
        result.articles = [];
        result.toPromise = [];
        articles.forEach(function(article) { 
          delete article.feed;
          delete article.content;
          article.link = ass.gup('url', article.link);  
          result.articles.push(article);
          if(article.link.indexOf('nytimes.com') === -1)
            result.toPromise.push(JSON.stringify(article));
        });
        d.resolve(result); 
      }
    });    
  } catch(ex) { d.reject(ex); }
  return d.promise;
}