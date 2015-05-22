# iseeyou

By exploiting differences between network and disk cache image load times, we can determine which websites a user has visited in the past.

## Usefulness

I see this as being most useful to help to fingerprint visitors more than compiling a complete list of website browsing history.

## How it works

Chrome, Safari and Firefox all return cached images immediately (< 5s).  This is much less time than it takes to load via network -- even local.

By timing how long it takes to load a website's logo, we can determine whether or not the site has been visited in the past.

This method works both via `file://` or `http(s)://`.

## Caveat

Once we run, all our test images will then be cached by the browser.  Additional tests will result in a website showing up as visited.

To avoid this, a special request to Google's logo with a unique cache key to determine if the code has run before.  (This can be abused on its own.  More info there to come.)

## Running test code yourself

Open `run.html` in your target browser and click the button with the console open.

Seed data exists in `./data`. See `generate-resource-data.js` for more info about this data or to generate your own.

## Beyond Logos

This code targets a website logo but it could just as easily use any image on a web page e.g. determine which news articles were read by the target visitor on cnn.com.

You could probably even create a complex decision tree and build a psych profile of the current visitor but I'll leave that up to the reader.
