nodejs-dnsimple
===============

This is an unofficial [DNSimple](http://dnsimple.com/) API module for [Node.js](http://nodejs.org/).
You need a DNSimple account to use this.


Installation
------------

The release on npm is the latest stable version:

	npm install dnsimple

The code on Github is the most recent version, but can be unstable:

	npm install git+https://github.com/fvdm/nodejs-dnsimple


Usage
-----

First you need to load and setup the module with `new require('dnsimple')( setupObject )`.
See _Configuration_ below for details on _setupObject_.

```js
var dnsimple = new require('dnsimple')({ email: 'you@web.tld', token: 'abc123' })

dnsimple.domains.add( 'example.tld', function( err, domain ) {
	console.log( domain.name +' created with ID '+ domain.id )
})
```


Authentication
--------------

The module supports authentication by **email + token**, **email + password** and **domain token**.
The *token* is more secure as it can easily be reset in your account at [dnsimple.com/account](https://dnsimple.com/account).
The *password* uses HTTP Basic Authentication.
Use *domain token* if you can (or wish to) connect to only one specific domainname.


### Account token

```js
require('dnsimple')({ email: 'your@email.tld', token: '12345abcde' })
```


### Password

```js
require('dnsimple')({ email: 'your@email.tld', password: 'secret' })
```


### Domain token

```js
require('dnsimple')({ domainToken: 'abc123' })
```


Configuration
-------------

When loading the module into your code you need to provide a _setupObject_ for authentication as described above.
This object can have a few more settings.

	name          description                             default value
	-----------   -------------------------------------   ----------------
	email         Account email address.
	token         Account access token.
	password      Account password.
	domainToken   Domain specific API access token.
	timeout       End API call after this amount of ms.   5000
	hostname      API endpoint.                           api.dnsimple.com


Methods
-------

Each method takes a _callback function_ with two parameters: `err` and `data`.

When an error occurs `err` is an instance of `Error` and `data` is `null`. It can get a `.code` property if a HTTP error happened and a `.data` property
if the remote API returned something other than JSON data. It also has a `.stack` property to figure out where the error was triggered.

When everything looks alright `err` will be _null_ and `data` will be the parsed JSON _object_ or _array_.


### Errors

	credentials missing   No authentication details set
	connection dropped    Connection was closed too early
	domain exists         You or another DNSimple user has this domain
	not json              Invalid API response, see err.code and err.data
	HTTP error            The API returned an error, see err.code and err.data
	request timeout       The request took too long
	request failed        The request failed, see err.error
	

Domains
-------

### domains.list ( [simpleBool], callback )

List domainnames in your account.


**simpleBool** true

A simple *array* with domainnames.

```js
dnsimple.domains.list( true, console.log )

[ 'one.com',
  'two.net',
  'three.nl' ]
```


**simpleBool** false (default)

An array with your domainnames.

```js
[ { auto_renew: null,
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
    'private_whois?': false } ]
```


### domains.findByRegex ( regexString, cb )

List only domains with names matching on regex.

```js
// All .com domains
dnsimple.domains.findByRegex( '\.com$', console.log )
```


### domains.show ( domainname, cb )

Get details about one domainname

```js
dnsimple.domains.show( 'one.com', console.log )
```


### domains.add ( domainname, cb )

Add a domain to your account

```js
dnsimple.domains.add( 'two.com', console.log )
```


### domains.delete ( domainname, cb )

Delete a domains and its DNS records from your account

```js
dnsimple.domains.delete( 'two.com', console.log )
```


### domains.resetToken ( domainname, cb )

Reset the domain specific API-token.

```js
dnsimple.domains.resetToken( 'two.com', console.log )
```


### domains.push ( domainname, email, contactId, cb )

Give the domain to another DNSimple user.

```js
dnsimple.domains.push( 'two.com', 'other@user.tld', '123', console.log )
```


### domains.vanitynameservers ( domainname, enable, cb )

Toggle vanity nameservers on (`true`) or off (`false`) for a domain.

```js
dnsimple.domains.vanitynameservers( 'two.com', true, console.log )
```


Memberships
-----------

### domains.memberships.list ( domainname, cb )

List memberships for a domain.

```js
dnsimple.domains.memberships.list( 'two.com', console.log )
```


### domains.memberships.add ( domainname, email, cb )

Add a member to a domain.

If the person already exists in DNSimple as a customer then he will immediately be added to the domain’s membership list.
If the person does not yet have a DNSimple account then he will receive an invitation to join via email.

```js
dnsimple.domains.memberships.add( 'two.com', 'other@user.tld', console.log )
```


### domains.memberships.delete ( domainname, member, cb )

Remove a member from a domain.

```js
dnsimple.domains.memberships.delete( 'two.com', 'other@user.tld', console.log )
```


Registration
------------

### domains.check ( domainname, cb )

Check domainname availability for registration or transfer to DNSimple.

```js
dnsimple.domains.check( 'frankl.in', console.log )
```

**Unavailable:**

```js
{ name: 'frankl.in',
  status: 'unavailable',
  price: '25.00',
  currency: 'USD',
  currency_symbol: '$',
  minimum_number_of_years: 1 }
```


**Available:**

```js
{ name: 'awesome-stuff.org',
  status: 'available',
  price: '14.00',
  currency: 'USD',
  currency_symbol: '$',
  minimum_number_of_years: 1 }
```


### domains.register ( domainname, registrantID, [extendedAttribute], cb )

Register a domainname at DNSimple. Your account will be charged on successful registration.

* **domainname** - *required* - the domain to register
* **registrantID** - *required* - the owner of the domain
* **extendedAttribute** - *optional* - extra fields for certain TLDs

```js
dnsimple.domains.register( 'example.tld', 1, console.log )
```


### domains.transfer ( domainname, registrantID, [authinfo], cb )

* **domainname** - *required* - the domain to transfer into your account
* **registrantID** - *required* - the new owner of the domain
* **authinfo** - *optional* - the auth-code required for some TLDs

```js
dnsimple.domains.transfer( 'example.tld', 1, 'abcdefg', console.log )
```


### domains.renew ( domainname, [whoisPrivacy], cb )

Renew a domainname registration for a new period.

* **domainname** - *required* - the domain to renew
* **whoisPrivacy** - *optional* - also renew whois privacy protection, true or false

```js
dnsimple.domains.renew( 'example.tld', true, console.log )
```


### domains.autorenew ( domainname, status, cb )

Enable or disable auto-renewal for a domainname.

* **domainname** - *required* - the domain to set the autorenew for
* **status** - *required* - enabled or disable autorenewal

```js
dnsimple.domains.autorenew( 'example.tld', true, console.log )
```


### domains.transferout ( domainname, cb )

Prepare a domain for transferring to another registrar.

```js
domains.transferout( 'example.tld', console.log )
```


### domains.nameservers ( domainname, nameservers, cb )

Set nameservers for a domain at the registry.

* **domainname** - *required* - the domain to set nameservers for
* **nameservers** - *required* - object with nameservers to set

```js
dnsimple.domains.nameservers(
	'example.tld',
	{
		ns1:	'ns1.company.tld',
		ns2:	'ns2.company.tld'
	},
	console.log
)
```


### domains.whoisPrivacy ( domainname, enable, cb )

Toggle whois privacy protection on a domain on (`true`) or off (`false`).

```js
dnsimple.domains.whoisPrivacy( 'two.com', true, console.log )
```


Services
--------

### domains.services.list ( domainname, cb )

List applied services (vendor presets) for a domain

```js
dnsimple.domains.services.list( 'one.com', console.log )
```


### domains.services.available ( domainname, cb )

List available services for a domain

```js
dnsimple.domains.services.available( 'one.com', console.log )
```


### domains.services.add ( domainname, serviceID, cb )

Apply a service to a domain

**serviceID** can be a service *numeric* ID or its *shortname*

```js
// Apply Heroku presets to one.com
dnsimple.domains.services.add( 'one.com', 'heroku', console.log )
```


### domains.services.delete ( domainname, serviceID, cb )

Remove a service from a domain

**serviceID** can be a service *numeric* ID or its *shortname*

```js
// Remove Heroku presets from one.com
dnsimple.domains.services.delete( 'one.com', 'heroku', console.log )
```


### domains.template ( domainname, templateID, cb )

Apply a template (custom presets) to a domain. This is an alias for *templates.apply*.

**serviceID** can be a service *numeric* ID or its *shortname*

```js
// Apply your office records to one.com
dnsimple.domains.template( 'one.com', 'office', console.log )
```


DNS
---

### dns.list ( domainname, cb )

List DNS records for a domain

```js
dnsimple.dns.list( 'one.com', console.log )
```


### dns.show ( domainname, recordID cb )

Get DNS record details for a *recordID* on *domainname*

```js
dnsimple.dns.show( 'one.com', 1234, console.log )
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
)
```


### dns.update ( domainname, recordID, cb )

Replace a record's details, same syntax as **dns.add**.


### dns.delete ( domainname, recordID, cb )

Delete a DNS record from a domain.

```js
dnsimple.dns.delete( 'one.com', 1234 )
```


Other methods
-------------

### subscription ( [createObject], cb )

Get or create subscription details for your account.


**Get details:**

```js
dnsimple.subscription( console.log )
```


**Create subscription:**

```js
dnsimple.subscription(
	{
		plan: 'Silver',
		credit_card: {
			number: '1',
			first_name: 'John',
			last_name: 'Smith',
			billing_address: '111 SW 1st Street',
			billing_zip: '12345',
			month: '02',
			year: '2015',
			cvv: '111'
		}
	},
	console.log
)
```


### statements ( cb )

Get account history statements.

Note: the *_view properties are very large.

```js
[ { id: 123,
    subscription_id: 111,
    statement_identifier: '987',
    text_view: '...',
    basic_html_view: '...',
    html_view: '...',
    settled_at: null,
    opened_at: '2014-02-06T05:42:55Z',
    closed_at: null,
    created_at: '2014-02-08T08:02:57Z',
    updated_at: '2014-02-12T08:03:45Z' } ]
```


### prices ( cb )

List all prices.

```js
dnsimple.prices( console.log )
```

```js
[ { tld: 'com',
    minimum_registration: 1,
    registration_price: '14.00',
    registration_enabled: true,
    transfer_price: '14.00',
    transfer_enabled: true,
    renewal_price: '14.00',
    renewal_enabled: true } ]
```


Unlicense
---------

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
