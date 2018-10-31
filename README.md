# RSS2Twitter

A node.js utility to parse RSS feeds and tweet them via the Twitter API.

## Installation

* Clone this repository
* Install node.js (any LTS version from 6 is supported)
* `npm i`

## Usage

1. Get a [Twitter Developer](https://developer.twitter.com) account
2. [Create an app](https://developer.twitter.com/en/apps/create) with the following required settings
	* App Name (e.g. _RSS2Twitter for @mytwitterfeed_)
	* Description 
	* Website URL (e.g. https://twitter.com/mytwitterfeed)
	* Tell us how this app will be used
3. Get the following details from the *Keys and tokens* tab
	* Consumer API key
	* Consumer API secret key
	* Access token
	* Access token secret
4. Add the following environment variables to your `~/.bashrc` file:
```
# Configuration for RSS2Twitter with {@twitter_handle}
export TWITTER_CONSUMER_KEY={consumer API key}
export TWITTER_CONSUMER_SECRET={consumer API secret}
export TWITTER_ACCESS_TOKEN={access token}
export TWITTER_ACCESS_TOKEN_SECRET={access secret}
```
5. Run the following command with sudo permissions: `node index.js {RSS-URL} [dry-run flag]`

On first run, an SQLite3 database `tweets.db` will be created in the current
working directory. It contains the links from the RSS feed and the date-time
they were tweeted (to prevent duplicates).

To prevent historical entries from the RSS feed being tweeted (e.g. if you
are migrating from another solution, or just want to avoid spamming your
followers), provide a second parameter - at the moment, anything will do.

It is recommended to run `rss2twitter` from a shell script, and it is
likely that you will want to call this script from a `cron` job. Be aware
of Twitter's API limits - at the time of writing they limit the number of
tweets within a 15-minute window.
