Passlet is a development environment for adding 3rd party passbook support to 
arbitrary web sites. This was to scratch a personal itch since most local 
businesses don't support it yet, and may not bother to in a close future.

## Usage

* Install bookmarklet from a passlet server.
* Invoke the bookmarklet on a web site you want a pass from. (f.ex. movie 
  ticket receipt page)
* The bookmarklet downloads a domain specific script which scrapes the current 
  page and sends information to the passlet server.
* The passlet server creates a passlet and either lets the user download it, 
  or sends it to his email address.

## Developers

It is simple to add support for a new web site. A provider consists of a 
client scraper script, a server handler and a pass template.

Please check out the built in providers in `lib/providers`.