# RSS2Twitter

A node.js utility to parse RSS feeds and tweet them via the Twitter API.

## Installation

* Clone this repository
* `npm i`

## Usage

You need to provide environment variables containing the details of your
Twitter API keys:

    TWITTER_CONSUMER_KEY
    TWITTER_CONSUMER_SECRET
    TWITTER_ACCESS_TOKEN
    TWITTER_ACCESS_TOKEN_SECRET

`node index.js {RSS-URL} [dry-run flag]`

On first run, an SQLite3 database `tweets.db` will be created in the current
working directory. It contains the links from the RSS feed and the date-time
they were tweeted (to prevent duplicates).

To prevent historical entries from the RSS feed being tweeted (e.g. if you
are migrating from another solution, or just want to avoid spamming your
followers), provide a second parameter - at the moment, anything will do.
