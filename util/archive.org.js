var arch = require('../node_modules/archive.org');
var  ass = require('./ass');
var   q = require('../node_modules/q');
var  rq = require('../node_modules/request');
var idents = [];
var content = [];
var audio   = [];
var images  = [];
var videos  = [];
var docs    = [];
var archive = [];
var     xml = [];
var torrent = [];

exports.search = function(data) {
  var d = q.defer();
  try {
    arch.search({q: data.keywords}, function(err, res) {
      /*
        arch.search() response [docs] 
          - "identifier" : "..." this is with a url to pull down available media
            - "server" :  "..."  the domain of the download url
            - "dir" : "..."  this is the directory to append to the "sever" 
            - "presenter", "contributor"  - mine these to see if who's actually 
                                            in the content
            - "files" : {
              "/blah.gif" : {  <-- uses this to finish the content url
                source
                format
                original
                mtime 
                size
                md5
                crc32
                sha1
              }
            }
            
  https://ia801004.us.archive.org/27/items/RagRadio2013-11-22-SamDaley-harris/RagRadio2013-11-22-SamDaley-harris.mp3
      */
      
      if(err) { console.log('archive.org error: %s', err); d.resolve(data); }
      else    { 
        data.archive = res; 
        // data.archive.response.docs.identifier 
        var promises = buildIdentificationUrls(res.response.docs);
        downloadAllIdentificationUrls(promises)
          .then(function() {
            data.idents   = idents;
            data.content  = content;
            data.images   = images;
            data.audio    = audio;
            data.videos   = videos;
            data.docs     = docs;
            data.archives = archive;
            data.xml      = xml;
            data.torrent  = torrent;
            d.resolve(data); 
          }, function(err) {d.reject(err);});
        
        // http://archive.org/details/ + identifier +  &output=json
        // console.log(JSON.stringify(res,null,2)); 
        // https://ia700806.us.archive.org/15/items/KochBrothersGopPrimaryDoom/kochprimary.ogg
      }
    });  
  } catch(ex) { console.log("archive.org ex:%s",ex); d.resolve(data); }
  return d.promise;
};

var downloadAllIdentificationUrls = function(urls) {
  var d = q.defer();
  try {
    console.log('beginning dowloading of resources')
    
    var l = urls.reduce(function(p,j) { 
      return p.then(function() { 
        return requestJson(j); 
      }); 
    }, q.resolve());
    
    l.then(function() {
      console.log('finished downloading %s resources...', idents.length);
      d.resolve();
    });
  } catch(ex) { 
    console.log('downloadAllIdentificationUrls() exception: %s', ex);
    d.reject(ex);
  }
  return d.promise;
};

var buildIdentificationUrls = function(docs) {
  
  try {
    var results = [];
    docs.forEach(function(doc) {
      var a = 'http://archive.org/details/' + doc.identifier +  '&output=json';
      results.push(a);
    });
    return results;
  } catch(ex) { console.log('buildIdentificationUrls() exception: %s', ex); }
};

var requestJson = function(url) {
  console.log('requesting %s', url);
  var d = q.defer();
  try {
    rq(url,function(e, r, b) {
      if(e) {
        console.log('request error: %s', e);
        d.resolve({"json": ""});
      } else if(!e && r.statusCode == 200) {
        
        var j = JSON.parse(b);
        
        var baseurl = "https://" + j.server + j.dir;
        
        Object.keys(j.files).forEach(function(file) {
          var z = baseurl + file;
          if(isImage(z)) {
            images.push(z);
          } else if(isAudio(z)) {
            audio.push(z);
          } else if(isVideo(z)) {
            videos.push(z);
          } else if(isDoc(z)) {
            docs.push(z);
          } else if(isArchive(z)) {
            archive.push(z);
          } else if(z.indexOf('.xml') > -1) {
            xml.push(z);
          } else if(z.indexOf('.torrent' > -1)) {
            torrent.push(z);
          } else {
            content.push(z);
          }
        });
        
        // https://ia800308.us.archive.org/11/items/KochBrothersExposed/koch-exposed.png
        
        idents.push(j);
        
        d.resolve();
      } else if(r.statusCode !== 200) {
        console.log("status code: %s", r.statusCode);
        d.reject();
      }
    });
  } catch(ex) { console.log("requestJson() ex: %s", ex); d.reject(ex); }
  return d.promise;
};

var isImage = function(link) {
  if( (link.indexOf('.jpg') > -1) ||
      (link.indexOf('.png') > -1) ||
      (link.indexOf('.gif') > -1) ||
      (link.indexOf('.tif') > -1) )   
  { return true; } else { return false; }
};
 
var isAudio = function(link) {
  if( (link.indexOf('.mp3') > -1) ||
      (link.indexOf('.wma') > -1) ||
      (link.indexOf('.wav') > -1) ||
      (link.indexOf('.ogg') > -1) ||
      (link.indexOf('.mid') > -1) )
  { return true; } else { return false; }
};

var isVideo = function(link) {
  if( (link.indexOf('.avi') > -1) ||
      (link.indexOf('.mp4') > -1) ||
      (link.indexOf('.mov') > -1) ||
      (link.indexOf('.wmv') > -1) ||
      (link.indexOf('.mpeg') > -1) ||
      (link.indexOf('.ogv') > -1) ||
      (link.indexOf('.flv') > -1) )
  { return true; } else { return false; }
};

var isDoc = function(link) {
  if( (link.indexOf('.pdf') > -1) ||
      (link.indexOf('.txt') > -1) ||
      (link.indexOf('.html') > -1) ||
      (link.indexOf('.djvu') > -1) )
  { return true; } else { return false; }
};

var isArchive = function(link) {
  if( (link.indexOf('.zip') > -1) ||
      (link.indexOf('.gz') > -1) )
  { return true; } else { return false; }
};

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
 
