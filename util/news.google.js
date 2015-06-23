var   q = require('../node_modules/q');
var ass = require('./ass');
var  fr = require('../node_modules/feed-read');

exports.search = function(keywords) {
  var d = q.defer();
  try  {
    keywords = keywords.replace(/ /g, '%20');
    ass.askInt("How many news articles?  (99 max but often 30 is given) ")
      .then(function(count) {
        getFeed(keywords, count)
          .then(function(result) {
            d.resolve(result);
          }).catch(function(ex) {d.reject(ex);}).done();
      }).catch(function(ex) { d.reject(ex); });
      console.log(keywords);
  } catch(ex) { d.reject(ex); }
  return d.promise;
};

var getFeed = function(keywords, count) {
  var d = q.defer();
  try {
    var url = "https://news.google.com/news?pz=1&cf=all&ned=us&hl=en&&output=rss&num=" + count +"&q=" + keywords;
    fr(url, function(err, articles) {
      if(err) { d.reject(err); } else {
        // loop through artciles trimming google from their url
        var result = {};
        result.keywords = keywords.replace(/%20/g,' ');
        result.url = url;
        result.articles = [];
        articles.forEach(function(article) { 
          delete article.feed;
          article.link = ass.gup('url', article.link);  
          result.articles.push(article);
        });
        d.resolve(result); 
      }
    });    
  } catch(ex) { d.reject(ex); }
  return d.promise;
}