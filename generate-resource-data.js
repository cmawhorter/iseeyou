// This goes through each site in our source list and attempts to get the logo image URL

// It does a poor job of this since a lot of sites specify it in CSS.  It also makes no attempt
// to limit to the target domain because that'd exclude CDNs and other things that should match.

// tl;dr; there is a lot of room for improvement here but it should be good enough for a POC

var fs = require('fs')
  , path = require('path')
  , http = require('http');

var request = require('request')
  , async = require('async')
  , cheerio = require('cheerio');

var CONCURRENCY = 250;
var LIMIT = Infinity;
http.globalAgent.maxSockets = 10000;

var completed = 0;

function worker(websiteUrl, callback) {
  console.log('==> %s', websiteUrl);
  var startTime = new Date().getTime();
  request({
    url: websiteUrl,
    timeout: 10000, // this doens't exactly work as advertised
    strictSSL: false, // assuming someone on the list will have an expired cert...
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36',
    }
  }, function(err, res, body) {
    console.log('<== %s; Took: %s seconds', websiteUrl, ((new Date().getTime() - startTime) / 1000).toFixed(1));
    var imgSrc = null;
    if (err || res.statusCode !== 200) {
      imgSrc = null;
    }
    else {
      var $ = cheerio.load(body);
      var $imgs = $('img');
      for (var i=0; i < $imgs.length; i++) {
        var src = (($imgs.get(i) || {}).attribs || {}).src || '';
        if (/^((http|https):)?\/\//.test(src)) {
          imgSrc = src;
          break;
        }
      }
    }
    completed++;
    callback(null, imgSrc);
  });
}

var top1k = require('./data/top1000.json').filter(function(el) { return /\.(net|org|com)$/i.test(el) });
var tasks = [];
var websiteUrl;
while (websiteUrl = top1k[tasks.length]) {
  if (tasks.length >= LIMIT) break;
  tasks.push(async.apply(worker, 'http://' + websiteUrl + '/'));
}

var consecutive = 0;
var lastComplete = -1;
var logger = setInterval(function() {
  if (lastComplete === completed) {
    consecutive++;
  }
  else {
    consecutive = 0;
  }
  if (consecutive === 3) {
    console.log(new Array(61).join(' ') + '=============================================');
    console.log(new Array(61).join(' ') + 'Please be patient.');
    console.log(new Array(61).join(' ') + 'request doesn\'t timeout properly so this can');
    console.log(new Array(61).join(' ') + 'take some time to completely finish.');
    console.log(new Array(61).join(' ') + '=============================================');
    consecutive = 0;
  }
  else {
    console.log(new Array(81).join(' ') + 'Completed: %s / %s', completed, tasks.length);
  }
  lastComplete = completed;
}, 1000);

async.parallelLimit(tasks, CONCURRENCY, function(err, images) {
  if (err) throw err;
  var combined = {};
  for (var i=0; i < images.length; i++) {
    var key = top1k[i]
      , value = images[i];
    if (value) {
      combined[key] = value;
    }
    else {
      console.warn('Warning: Skipped %s', key);
    }
  }
  clearInterval(logger);
  fs.writeFileSync(path.join(__dirname, 'data/images.js.raw'), JSON.stringify(images, null, 2));
  fs.writeFileSync(path.join(__dirname, 'data/images.js'), 'var IMAGE_DATA = ' + JSON.stringify(combined, null, 2) + ';');
  process.exit(0);
});
