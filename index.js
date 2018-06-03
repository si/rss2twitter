const util = require('util');
const reader = require('feed-read-parser');
const twit = require('twit');
const fetch = require('node-fetch');
const base64stream = require('base64-stream');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./tweets.db');

const twitter = new twit({
  consumer_key:        process.env.TWITTER_CONSUMER_KEY||'consumer-key',
  consumer_secret:     process.env.TWITTER_CONSUMER_SECRET||'consumer-secret',
  access_token:        process.env.TWITTER_ACCESS_TOKEN||'access-token',
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET||'access-token-secret'
});

const LIMIT = 5;

const rundate = new Date();
const feed = process.argv[2];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function tweetWithMedia(article,callback) {
  console.log(article.enclosure.url);
  fetch(article.enclosure.url)
  .then(function(res){
    return new Promise((resolve, reject) => {
      let chunks = [];
      let myStream = res.body.pipe(base64stream.encode());
      myStream.on('data', (chunk) => {
        chunks = chunks.concat(chunk);
      });
      myStream.on('end', () => {
        resolve(chunks.toString('base64'));
      });
    });
  })
  .then(function(b64content){
    // first we must post the media to Twitter
    twitter.post('media/upload', { media_data: b64content }, function (err, data, response) {
      if (err) console.log(err);
      // now we can assign alt text to the media, for use by screen readers and
      // other text-based presentations and interpreters
      var mediaIdStr = data.media_id_string;
      var altText = article.description ? article.description.substr(0,80) : 'Media image';
      var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };

      twitter.post('media/metadata/create', meta_params, function (err, data, response) {
        if (!err) {
          // now we can reference the media and post a tweet (media will attach to the tweet)
          var params = { status: article.title + ' ' + article.link, media_ids: [mediaIdStr] }

          twitter.post('statuses/update', params, function (err, data, response) {
            if (err) console.log(err);
            callback(err,data);
          })
        }
        else {
          console.log(err);
          callback(err,null);
        }
      })
    });
  })
  .catch(function(err){
    console.log(err);
    callback(err,null);
  });
}

let dryrun = process.argv.length>3;

if (feed) {
    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS tweets (feed TEXT,link TEXT,tweeted DATETIME)");
        // TODO delete rows > 90 days old
    });
    reader(feed,function(err,articles){
        if (articles && articles.length) {
            let articleCount = articles.length;
	    if (articleCount > LIMIT) {
                shuffleArray(articles);
                articles = articles.slice(0,LIMIT);
		articleCount = LIMIT;
            }
            let done = 0;
            let stmt = db.prepare('INSERT INTO tweets VALUES (?,?,?)');
            for (let article of articles) {
                db.get('SELECT tweeted FROM tweets WHERE feed = ? AND link = ?',[feed,article.link],function(err,row){
                    console.log(article.link);
                    if (!row || !row.tweeted) {
                       console.log(article.title);
                       if (!dryrun) {
                           let needsMedia = false;
                           if (article.link.indexOf('netflix')>=0) needsMedia = true;
                           if (article.link.indexOf('film4')>=0) needsMedia = true;
			   if (!article.enclosure || !article.enclosure.url) needsMedia = false;
                           if (needsMedia) {
                          	tweetWithMedia(article,function(err,status){
				    if (!err) stmt.run(feed,article.link,rundate.toISOString());
			 	});
                           }
                           else {
                             twitter.post('statuses/update',{ status: article.title+' '+article.link },function(err,status){
                                 if (err) console.warn(util.inspect(err));
				 else stmt.run(feed,article.link,rundate.toISOString());
                             });
                           }
                       }
                    }
                    else {
                        console.log('Already tweeted at '+row.tweeted);
                    }
                    done++;
                    if (done>=articleCount) {
                        console.log('Calling finalize...');
                        stmt.finalize();
                        db.close();
                    }
                });
            }
        }
    });
}

process.on('error',function(err){
    console.log(util.inspect(err));
});
