[![Build Status](https://secure.travis-ci.org/fvdm/nodejs-dnsimple.png?branch=master)](http://travis-ci.org/fvdm/nodejs-dnsimple)

nodejs-dnsimple
===============

This is an unofficial [DNSimple](http://dnsimple.com/) API module for [Node.js](http://nodejs.org/). You need a DNSimple account to use this.

# Installation

```
npm install dnsimple
```

# Usage

```js
var dnsimple = require('dnsimple');

dnsimple.api.email = 'your@email.tld';
dnsimple.api.token = 'your API token';

dnsimple.domains.add( 'example.tld', function( domain ) {
	console.log( domain.name +' created with ID '+ domain.id );
});
```

## Authentication

The module supports both authentication by **email:token** and **email:password**. The *token* is more secure as it can easily be reset in account at [dnsimple.com/account](https://dnsimple.com/account). The password uses HTTP Basic Authentication.

### Token

```js
dnsimple.api.email = 'your@email.tld';
dnsimple.api.token = '12345abcde';
```

### Password

```js
dnsimple.api.email = 'your@email.tld';
dnsimple.api.password = 'secret';
```

# Functions

The functions all allow a callback parameter at the end. The first arguement is always the intended result object or array.

**cb = callback function()**

## domains

### domains.list ( simpleBool, cb )

List domainnames in account.

```js
dnsimple.domains.list( false, function( domains ) {
	console.log( domains );
});
```

**simpleBool** true

A simple *array* with domainnames.

```ks
[ 'one.com',
  'two.net',
  'three.nl' ]
```

**simpleBool** false

An object with domainnames details, the keys are their IDs.

```js
{ '123': 
   { auto_renew: null,
     created_at: '2011-01-09T02:24:58Z',
     expires_at: null,
     id: 123,
     language: null,
     last_name_server_status_check: '2012-05-18T18:53:24Z',
     lockable: null,
     name: 'one.com',
     name_server_status: 'inactive',
     parsed_expiration_date: null,
     real_time: null,
     registrant_id: null,
     registration_status: 'hosted',
     state: 'hosted',
     token: 'Zp1J...',
     unicode_name: 'one.com',
     updated_at: '2012-05-18T18:53:24Z',
     use_route53: null,
     user_id: 121,
     uses_external_name_servers: null,
     record_count: 1,
     service_count: 0,
     'private_whois?': false }
}
```

### domains.findByRegex ( regexString, cb )

List only domains with names matching on regex.

```js
// All .com domains
dnsimple.domains.findByRegex( '\.com$', console.log );
```

### domains.show ( domainname, cb )

Get details about one domainname

```js
dnsimple.domains.show( 'one.com', console.log );
```

### domains.add ( domainname, cb )

Add a domain to your account

```js
dnsimple.domains.add( 'two.com', console.log );
```

### domains.delete ( domainname, cb )

Delete a domains and its DNS records from your account

```js
dnsimple.domains.delete( 'two.com', console.log );
```

### domains.services.list ( domainname, cb )

List applied services (vendor presets) for a domain

```js
dnsimple.domains.services.list( 'one.com', console.log );
```

### domains.services.available ( domainname, cb )

List available services for a domain

```js
dnsimple.domains.services.available( 'one.com', console.log );
```

### domains.services.add ( domainname, serviceID, cb )

Apply a service to a domain

**serviceID** can be a service *numeric* ID or its *shortname*

```js
// Apply Heroku presets to one.com
dnsimple.domains.services.add( 'one.com', 'heroku', console.log );
```

### domains.services.delete ( domainname, serviceID, cb )

Remove a service from a domain

**serviceID** can be a service *numeric* ID or its *shortname*

```js
// Remove Heroku presets from one.com
dnsimple.domains.services.delete( 'one.com', 'heroku', console.log );
```

### domains.template ( domainname, templateID, cb )

Apply a template (custom presets) to a domain. This is an alias for *templates.apply*.

**serviceID** can be a service *numeric* ID or its *shortname*

```js
// Apply your office records to one.com
dnsimple.domains.template( 'one.com', 'office', console.log );
```

## DNS

### dns.list ( domainname, cb )

List DNS records for a domain

```js
dnsimple.dns.list( 'one.com', console.log );
```

### dns.show ( domainname, recordID cb )

Get DNS record details for a *recordID* on *domainname*

```js
dnsimple.dns.show( 'one.com', 1234, console.log );
```

Returns an object with the record details:

```js
{ content: '4.3.2.1',
  created_at: '2011-03-31T01:21:08Z',
  domain_id: 123,
  domain_service_id: null,
  id: 1234,
  name: '',
  pdns_identifier: '112233',
  prio: null,
  record_type: 'A',
  special_type: null,
  ttl: 3600,
  updated_at: '2011-11-28T20:39:51Z' }
```

### dns.add ( domainname, recordObject, cb )

**Required:** name, record_type, content

**Optional:** ttl, prio

```js
dnsimple.dns.add(
	'one.com',
	{
		name:			'www',
		record_type:	'A',
		content:		'4.3.2.1'
	},
	console.log()
);
```

### dns.update ( domainname, recordID, cb )

Replace a record's details, same syntax as **dns.add**.

### dns.delete ( domainname, recordID, cb )

Delete a DNS record from a domain.

```js
dnsimple.dns.delete( 'one.com', 1234 );
```

# License

This module is **copyleft** meaning you can do anything you want except copyrighting it. It would be nice to refer back to http://github.com/fvdm/nodejs-dnsimple for later reference.