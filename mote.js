var    q = require('q');
var feed = require('./util/google.feed');
var news = require('./util/news.google');
var arch = require('./util/archive.org');
var wiki = require('./util/wiki');
var  ass = require('./util/ass');
var   fs = require('fs');

var init = function() {
  getNews().then (function(data) { return arch.search(data);     })
           .catch(function(ex)   { console.log(ex); })
           .done (function(data) {
             console.log("%s queried successfully", data.keywords);
             var filename = 'queries/' + data.keywords + '.json';
             delete data.toPromise;
             var contents = JSON.stringify(data,null,2);
             fs.writeFile(filename, contents, function(err) {
               if(err) console.log('write failed: %s', err);
               else    console.log('write successful!');
             });
           });
};

var getNews = function() {
  var d = q.defer();
  try {
    ass.askQuestion("What type of news are you looking for? ")
    .then(function(keywords) {
      news.search(keywords)
        .then (function(results) { return ass.mineArticle(results); })
        .then (function(results) { d.resolve(results);})
        .catch(function(ex)      { d.reject(ex); })
        .done();
      
    }).catch(function(ex) { console.log(ex);});  
  } catch(ex) { d.reject(ex); }
  return d.promise;
};

init();