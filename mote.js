var    q = require('q');
var feed = require('./util/google.feed');
var news = require('./util/news.google');
var wiki = require('./util/wiki');
var  ass = require('./util/ass');

var init = function() {
  getNews().then (function(data) { console.log(JSON.stringify(data, null, 2)); })
           .catch(function(ex)   { console.log(ex);                            })
           .done ();
};

var getNews = function() {
  var d = q.defer();
  try {
    ass.askQuestion("What type of news are you looking for? ")
    .then(function(keywords) {
      news.search(keywords)
        .then (function(results) { d.resolve(results); })
        .catch(function(ex)      { d.reject(ex); })
        .done();
      
    }).catch(function(ex) { console.log(ex);});  
  } catch(ex) { d.reject(ex); }
  return d.promise;
};

init();