Changelog
=========

v1.0.0
------

### Interface

* Module converted from _object_ to _function_, see README.md
* Callback parameter order is now `function( err, data )`
* Listing methods now always return an array with items, without ID keys
* Changed string input on toggles to boolean, `true` vs `"on"`

### New

* Support for domain token authentication
* Method subscription
* Method statements
* Method prices
* Method domains.resetToken
* Method domains.push
* Method domains.vanitynameservers
* Method domains.memberships.list
* Method domains.memberships.add
* Method domains.memberships.delete
* Method domains.whoisPrivacy
* Catch `domain exists` error
* Request timeout, default 5 seconds
* CHANGELOG.md

### Changed

* Removed Travis CI
* API version fixed in request path
* Improved error handling
* README.md updated
* Other bug fixes
