var  q = require('../node_modules/q');

exports.search = function() {
   var d = q.defer();
   try  {
      
   } catch(ex) { d.reject(ex); }
   return d.promise;
};

/*
  what if the most frequent keywords should be fed into the wiki with the data
  object from the new.google.com obj.
  
  still could get the top 10 articles for the keywords, but i'm thinking 

*/