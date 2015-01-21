nodejs-dnsimple
===============

This is an unofficial DNSimple API module for node.js.
You need a DNSimple account to use this.

[![Build Status](https://travis-ci.org/fvdm/nodejs-dnsimple.svg?branch=Tests)](https://travis-ci.org/fvdm/nodejs-dnsimple)

[Documentation](https://github.com/fvdm/nodejs-dnsimple/blob/master/README.md) -
[Changelog](https://github.com/fvdm/nodejs-dnsimple/blob/master/CHANGELOG.md)

[node.js](http://nodejs.org/) -
[DNSimple](https://dnsimple.com/) -
[API documentation](http://developer.dnsimple.com/)


Installation
------------

Stable: `npm install dnsimple`

Develop: `npm install fvdm/nodejs-dnsimple`


Usage
-----

See _Configuration_ below for details.


```js
var dnsimple = new require('dnsimple')({ email: 'you@web.tld', token: 'abc123' })

dnsimple.domains.add( 'example.tld', function( err, domain ) {
  console.log( domain.name +' created with ID '+ domain.id )
})
```


Authentication
--------------

This module supports multiple authentication methods.
None of them is totally secure, but some are easier to reset.


### Account token

Full API access, easy to reset at [dnsimple.com/account](https://dnsimple.com/account).


```js
require('dnsimple')({ email: 'your@email.tld', token: '12345abcde' })
```


### Password

Full API and web access, don't use.


```js
require('dnsimple')({ email: 'your@email.tld', password: 'secret' })
```


### Two-factor authentication (2FA / OTP)

Full API access, can't reset token.

When you have set up two-factor authentication for your account the module returns
error `twoFactorOTP missing` when you did not provide your one-time password.

First your need to tell the API _once_ your one-time code from Authy or SMS, by
defining it during setup along with your email and password and calling a random
method. Then the API returns a token which you can use instead of your email and password.


```js
// Set the OTP code on load
var dnsimple = require('dnsimple')({
  email: 'my@mail.tld',
  password: 'my-secret',
  twoFactorOTP: '0123456'
})

// Now call a random method to trade the OTP for a longterm token
dnsimple.subscription( function( err, data, meta ) {
  if( err ) { return console.log(err) }
  console.log( 'Two-factor token: '+ meta.twoFactorToken )
})

// From now on only use this token - no email/password
var dnsimple = require('dnsimple')({
  twoFactorToken: '22596363b3de40b06f981fb85d82312e'
})
```


### Domain token

Access to only one domain name, easy to reset.


```js
require('dnsimple')({ domainToken: 'abc123' })
```


Configuration
-------------

When loading the module into your code you need to provide an _Object_ for
authentication as described above.
This object can have a few more settings.

name        | description                           | default
----------- | ------------------------------------- | ----------------
email       | Account email address                 |
token       | Account access token                  |
password    | Account password                      |
domainToken | Domain specific API access token      |
timeout     | End API call after this amount of ms  | 5000
hostname    | API endpoint                          | api.dnsimple.com


To use the [sandbox](http://developer.dnsimple.com/sandbox/) environment
set `hostname` to `api.sandbox.dnsimple.com`.


Methods
-------

Each method takes a _callback_ function with three parameters: `err`, `data` and `meta`.

When an error occurs `err` is an instance of `Error` and `data` may not be available.
`err` can have additional properties.

When everything is good `err` will be _null_ and `data` will be the parsed result.

The `meta` parameter is always available and contains extra information from the API,
such as statusCode, request_id, runtime and twoFactorToken.


### Errors

message             | description
------------------- | --------------------------------------------------------
credentials missing | No authentication details set
connection dropped  | Connection was closed too early
not json            | Invalid API response, see `err.code` and `err.data`
API error           | The API returned an error, see `err.code` and `err.data`
request timeout     | The request took too long
request failed      | The request cannot be made, see `err.error`


Domains
-------

### DomainObject

When below `DomainObject` is mentioned, it looks like the one below.
It is passed through directly from the API.

```js
{
  id: 1111,
  user_id: 432,
  registrant_id: null,
  name: 'example.net',
  unicode_name: 'example.net',
  token: 'uwakVhw4AB4ibbn4_gv',
  state: 'hosted',
  language: null,
  auto_renew: false,
  whois_protected: false,
  record_count: 13,
  service_count: 0,
  expires_on: null,
  created_at: '2012-08-04T14:31:10.058Z',
  updated_at: '2013-12-23T15:24:50.250Z'
}
```


### domains.list ( [simple], callback )

List domain names in your account.


param    | type     | required | description
---------|----------|----------|---------------------------------------
simple   | boolean  | no       | return shallow array with domain names
callback | function | yes      | your callback function


A simple _array_ with domain names.

```js
dnsimple.domains.list( true, console.log )

[ 'one.com',
  'two.net',
  'three.nl' ]
```


An _array_ with your detailed domains.

```js
[ DomainObject,
  DomainObject ]
```


### domains.findByRegex ( regex, callback )

List only domains with names matching on regex.


param    | type     | required | description
---------|----------|----------|-----------------------
regex    | string   | yes      | regular expression
callback | function | yes      | your callback function


```js
// All your .com domains
dnsimple.domains.findByRegex( '\.com$', console.log )
```

Same output format as `domains.list`.


### domains.show ( domainname, callback )

Get details about one domain name.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name or ID
callback   | function | yes      | your callback function


```js
dnsimple.domains.show( 'one.com', console.log )
```

Output: `DomainObject`


### domains.add ( domainname, callback )

Add a domain to your account


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name or ID
callback   | function | yes      | your callback function


```js
dnsimple.domains.add( 'mydomain.net', console.log )
```

Success

`DomainObject`

Error

```js
{ [Error: API error]
  code: 400,
  data: { errors: { name: [ 'has already been taken' ] } } }
```

```js
{ [Error: API error]
  code: 400,
  data: { errors: { name: [ 'is an invalid domain' ] } } }
```


### domains.delete ( domainname, callback )

Delete a domains and its DNS records from your account.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name or ID
callback   | function | yes      | your callback function


```js
dnsimple.domains.delete( 'two.com', console.log )
```


### domains.resetToken ( domainname, callback )

Reset the domain specific API-token.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name or ID
callback   | function | yes      | your callback function


```js
dnsimple.domains.resetToken( 'two.com', console.log )
```


### domains.push ( domain name, email, contactId, callback )

Give the domain to another DNSimple user.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name or ID
callback   | function | yes      | your callback function


```js
dnsimple.domains.push( 'two.com', 'other@user.tld', '123', console.log )
```


### domains.vanitynameservers ( domainname, enable, [external], callback )

Toggle vanity name servers on (`true`) or off (`false`) for a domain.

**Note:** contact support to activate this feature.


param      | type     | required | description
-----------|----------|----------|------------------
domainname | string   | yes      | domain name
enable     | boolean  | yes      | switch on or off
external   | object   | no       | use custom names
cb         | function | yes      | callback function


#### Just enable

```js
dnsimple.domains.vanitynameservers( 'two.com', true, console.log )
```


#### Enable with custom names

```js
var names = {
  ns1: 'ns1.company.net',
  ns2: 'ns2.company.net',
  ns3: 'ns3.company.net'
}

dnsimple.domains.vanitynameservers( 'two.com', true, names, console.log )
```


### domains.zone ( domainname, callback )

Get a plain text zone for the specified domain name.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name or ID
callback   | function | yes      | your callback function


```js
dnsimple.domains.zone( 'two.com', console.log )
```


### domains.importZone ( domainname, zone, callback )

Import a plain text zone for the specified domain name.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name or ID
zone       | string   | yes      | zone file text
callback   | function | yes      | your callback function


```js
var text = '$ORIGIN two.com.\n$TTL 1h\ntwo.com. IN  SOA ns1.dnsimple.com admin.dnsimple.com 2011092001 86400 7200 604800 300\ntwo.com. IN NS  ns1.dnsimple.com.\ntwo.com. IN NS  ns2.dnsimple.com.\ntwo.com. IN NS  ns3.dnsimple.com.\ntwo.com. IN NS  ns4.dnsimple.com.\nds1.two.com. 3600 IN  A 184.106.215.134\n; two.com. 3600 IN  URL http://dnsimple.com\n; www.two.com. 3600 IN  URL https://dnsimple.com'

dnsimple.domains.zone( 'two.com', text, console.log )
```


Memberships
-----------

### domains.memberships.list ( domainname, callback )

List memberships for a domain.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name or ID
callback   | function | yes      | your callback function


```js
dnsimple.domains.memberships.list( 'two.com', console.log )
```


### domains.memberships.add ( domainname, email, callback )

Add a member to a domain.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name or ID
email      | string   | yes      | new member's email
callback   | function | yes      | your callback function


If the person already exists in DNSimple as a customer then he will immediately
be added to the domain’s membership list.
If the person does not yet have a DNSimple account then he will receive an
invitation to join via email.

```js
dnsimple.domains.memberships.add( 'two.com', 'other@user.tld', console.log )
```


### domains.memberships.delete ( domainname, member, callback )

Remove a member from a domain.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name or ID
member     | string   | yes      | member email or ID
callback   | function | yes      | your callback function


```js
dnsimple.domains.memberships.delete( 'two.com', 'other@user.tld', console.log )
```


Registration
------------

### domains.check ( domainname, callback )

Check domain name availability for registration or transfer to DNSimple.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name
callback   | function | yes      | your callback function


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


### domains.register ( domainname, registrantID, [extendedAttribute], callback )

Register a domain name at DNSimple. Your account will be charged on successful registration.


param             | type     | required | description
------------------|----------|----------|-----------------------
domainname        | string   | yes      | domain name
registrantID      | string   | yes      | existing contact ID
extendedAttribute | object   | no       | extended attributes for certain TLDs
callback          | function | yes      | your callback function


```js
dnsimple.domains.register( 'example.tld', 1, console.log )
```


### domains.transfer ( domainname, registrantID, [authinfo], callback )

Transfer a domain name to DNSimple.


param        | type     | required | description
-------------|----------|----------|------------------------
domainname   | string   | yes      | domain name
registrantID | string   | yes      | existing contact ID
authinfo     | string   | no       | auth-code for some TLDs
callback     | function | yes      | your callback function


```js
dnsimple.domains.transfer( 'example.tld', 1, 'abcdefg', console.log )
```


### domains.renew ( domainname, [whoisPrivacy], callback )

Renew a domain name registration for a new period.


param        | type     | required | description
-------------|----------|----------|-----------------------
domainname   | string   | yes      | domain name
whoisPrivacy | boolean  | no       | hide your registration details from public
callback     | function | yes      | your callback function


```js
dnsimple.domains.renew( 'example.tld', true, console.log )
```


### domains.autorenew ( domainname, status, callback )

Enable or disable auto-renewal for a domainname.


param      | type     | required | description
-----------|----------|----------|---------------------------
domainname | string   | yes      | domain name
status     | boolean  | yes      | switch auto renewal on/off
callback   | function | yes      | your callback function


```js
dnsimple.domains.autorenew( 'example.tld', true, console.log )
```


### domains.transferout ( domainname, callback )

Prepare a domain for transferring to another registrar.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name
callback   | function | yes      | your callback function


```js
domains.transferout( 'example.tld', console.log )
```


### domains.nameservers ( domainname, [nameservers], callback )

Get or set nameservers for a domain at the registry.


param       | type     | required | description
------------|----------|----------|-----------------------
domainname  | string   | yes      | domain name
nameservers | object   | no       | new nameservers to set
callback    | function | yes      | your callback function


#### Get current nameservers

```js
dnsimple.domains.nameservers( 'example.tld', console.log )
```


#### Change nameservers

```js
dnsimple.domains.nameservers(
  'example.tld',
  {
    ns1: 'ns1.company.tld',
    ns2: 'ns2.company.tld'
  },
  console.log
)
```


### domains.whoisPrivacy ( domainname, enable, callback )

Get current whois privacy setting or switch it on or off.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name
enable     | boolean  | no       | switch on or off
callback   | function | yes      | your callback function


#### Switch on

```js
dnsimple.domains.whoisPrivacy( 'two.com', true, console.log )
```


#### Get current setting

```js
dnsimple.domains.whoisPrivacy( 'two.com', console.log )
```


Services
--------

### domains.services.list ( domainname, callback )

List applied services (vendor presets) for a domain


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name
callback   | function | yes      | your callback function


```js
dnsimple.domains.services.list( 'one.com', console.log )
```


### domains.services.available ( domainname, callback )

List available services for a domain


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name
callback   | function | yes      | your callback function


```js
dnsimple.domains.services.available( 'one.com', console.log )
```


### domains.services.add ( domainname, service, callback )

Apply a service to a domain


param      | type     | required | description
-----------|----------|----------|---------------------------
domainname | string   | yes      | domain name
service    | string   | yes      | service `short_name` or ID
callback   | function | yes      | your callback function


```js
// Apply Heroku presets to one.com
dnsimple.domains.services.add( 'one.com', 'heroku', console.log )
```


### domains.services.delete ( domainname, service, callback )

Remove a service from a domain


param      | type     | required | description
-----------|----------|----------|---------------------------
domainname | string   | yes      | domain name
service    | string   | yes      | service `short_name` or ID
callback   | function | yes      | your callback function


```js
// Remove Heroku presets from one.com
dnsimple.domains.services.delete( 'one.com', 'heroku', console.log )
```


### domains.template ( domainname, template, callback )

Apply a template (custom presets) to a domain. This is an alias for *templates.apply*.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name
template   | string   | yes      | template name or ID
callback   | function | yes      | your callback function



```js
// Apply your office records to one.com
dnsimple.domains.template( 'one.com', 'office', console.log )
```


DNS
---

### dns.list ( domainname, callback )

List DNS records for a domain


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name
callback   | function | yes      | your callback function


```js
dnsimple.dns.list( 'one.com', console.log )
```


### dns.show ( domainname, record, cb )

Get DNS record details.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name
record     | numeric  | yes      | dns record ID
callback   | function | yes      | your callback function


```js
dnsimple.dns.show( 'one.com', 1234, console.log )
```

Returns an object with the record details:

```js
{
  id: 1234,
  domain_id: 123,
  parent_id: 123,
  name: '',
  content: '4.3.2.1',
  prio: null,
  record_type: 'A',
  system_record: null,
  ttl: 3600,
  created_at: '2011-03-31T01:21:08Z',
  updated_at: '2011-11-28T20:39:51Z'
}
```


### dns.add ( domainname, recordObject, callback )

Add a DNS record to a domain name.


param      | type     | required | description
-----------|----------|----------|--------------------------
domainname | string   | yes      | domain name
record     | object   | yes      | record details, see below
callback   | function | yes      | your callback function


#### Record object

param       | required | description
------------|----------|-------------------------------------------
name        | yes      | sub domain, wildcard (*) or empty for root
record_type | yes      | A, AAAA, MX, TXT, etc.
content     | yes      | record value
ttl         | no       | record expire time in seconds
prio        | no       | recort priority for MX


```js
dnsimple.dns.add(
  'one.com',
  {
    name:        'www',
    record_type: 'A',
    content:     '4.3.2.1'
  },
  console.log()
)
```


### dns.update ( domainname, recordID, record, callback )

Replace a record's details, same syntax as `dns.add`


param      | type     | required | description
-----------|----------|----------|-----------------------------
domainname | string   | yes      | domain name
recordID   | numeric  | yes      | record ID to update
record     | object   | yes      | record object, see `dns.add`
callback   | function | yes      | your callback function


### dns.delete ( domainname, recordID, callback )

Delete a DNS record from a domain.


param      | type     | required | description
-----------|----------|----------|-----------------------
domainname | string   | yes      | domain name
recordID   | object   | yes      | record ID to delete
callback   | function | yes      | your callback function


```js
dnsimple.dns.delete( 'one.com', 1234 )
```


Other methods
-------------

### subscription ( [subscription], callback )

Get or create subscription details for your account.


param        | type     | required | description
-------------|----------|----------|-------------------------
subscription | object   | no       | new details, see example
callback     | function | yes      | your callback function


#### Get details

```js
dnsimple.subscription( console.log )
```


#### Create subscription

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


### prices ( cb )

List all prices.


param    | type     | required | description
---------|----------|----------|-----------------------
callback | function | yes      | your callback function


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


### user ( details, callback )

Create a user account at DNSimple.com


param    | type     | required | description
---------|----------|----------|-----------------------
details  | object   | yes      | user account details
callback | function | yes      | your callback function


#### Create account

```js
var details = {
  email:                 'john.smith@example.net',
  password:              'abc123',
  password_confirmation: 'abc123'
}
dnsimple.user( details, console.log )
```


#### Callback data

```js
{
  id: 104,
  email: 'john.smith@example.net',
  referral_token: 'd1a416add1d12a',
  single_access_token: '2aLdAc71vg1aIM1wLaTh',
  domain_count: 0,
  domain_limit: 10,
  login_count: 0,
  failed_login_count: 0,
  created_at: '2014-10-30T18:55:40.819Z',
  updated_at: '2014-10-30T18:55:40.848Z',
  default_contact_id: null
}
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


Author
------

Franklin van de Meent
| [Website](https://frankl.in)
| [Github](https://github.com/fvdm)
