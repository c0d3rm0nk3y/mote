/**
 * this will utilize internet archive.org api
 * 
 * this should open up access to the video and audio clips
 * 
 * https://www.npmjs.com/package/archive.org
 * npm install archive.org --save
 * 
 * Example
   Archive = require('archive.org');
   archive = new Archive();
    
   archive.search({q: 'Grateful Dead'}, function(err, res) {
     console.log(res);
   });
   
   here is something from their own site on their api..
   
   https://archive.org/advancedsearch.php?q=bunny+AND+licenseurl:[http://creativecommons.org/a+TO+http://creativecommons.org/z]
                                          &fl[]=identifier,title,mediatype,collection&rows=15&output=json
                                          &callback=IAE.search_hits
 
 * https://archive.org/advancedsearch.php#raw
 **/
 