[![Build Status](https://secure.travis-ci.org/fvdm/nodejs-dnsimple.png?branch=master)](http://travis-ci.org/fvdm/nodejs-dnsimple)

nodejs-dnsimple
===============

This is an unofficial [DNSimple](http://dnsimple.com/) API module for [Node.js](http://nodejs.org/). You need a DNSimple account at to use this.

## Installation

```
npm install dnsimple
```

## Usage

```js
var dnsimple = require('dnsimple');

dnsimple.api.email = 'your@email.tld';
dnsimple.api.token = 'your API token';

dnsimple.domains.add( 'example.tld', function( domain ) {
	console.log( domain.name +' created with ID '+ domain.id );
});
```

## License

This module is **copyleft** meaning you can do anything you want except copyrighting it. It would be nice to refer back to http://github.com/fvdm/nodejs-fibonacci for later reference.