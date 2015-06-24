var  q = require('../node_modules/q');
var rs = require('../node_modules/readline-sync');

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