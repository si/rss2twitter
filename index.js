const util = require('util');
const reader = require('feed-read');
const twit = require('twit');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./tweets.db');

const twitter = new twit({
  consumer_key:        process.env.TWITTER_CONSUMER_KEY||'consumer-key',
  consumer_secret:     process.env.TWITTER_CONSUMER_SECRET||'consumer-secret',
  access_token:        process.env.TWITTER_ACCESS_TOKEN||'access-token',
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET||'access-token-secret' 
});

const rundate = new Date();
const feed = process.argv[2];

let dryrun = process.argv.length>3;

if (feed) {
    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS tweets (feed TEXT,link TEXT,tweeted DATETIME)");
        // TODO delete rows > 90 days old
    });
    reader(feed,function(err,articles){
        if (articles && articles.length) {
            let articleCount = articles.length;
            let done = 0;
            let stmt = db.prepare('INSERT INTO tweets VALUES (?,?,?)');
            for (let article of articles) {
                db.get('SELECT tweeted FROM tweets WHERE feed = ? AND link = ?',[feed,article.link],function(err,row){
                    console.log(article.link);
                    if (!row || !row.tweeted) {
                       console.log(article.title);
                       if (!dryrun) {
                           twitter.post('statuses/update',{ status: article.title+' '+article.link },function(err,status){
                               if (err) console.warn(util.inspect(err));
                           });
                       }
                       stmt.run(feed,article.link,rundate.toISOString());
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
