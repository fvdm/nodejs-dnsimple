Changelog
=========

v1.0.0
------

### Interface

* Module converted to API wrapper, see README.md
* Callback parameter order is now `function( err, data, meta )`
* Named result objects are trimmed, i.e. `data[0].domain.name` -> `data[0].name`
* Listing methods now always return an array with items, without ID keys

### New

* Support for two-factor authentication
* Support for domain token authentication
* Request timeout, default 30 seconds
* CHANGELOG.md

### Changed

* API version fixed in request path
* Improved error handling
* README.md updated
* Other bug fixes
* Huge code clean up
