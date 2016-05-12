dnsimple
========

This is an unofficial DNSimple API module for node.js.
You need a DNSimple account to use this.

[![Build Status](https://travis-ci.org/fvdm/nodejs-dnsimple.svg?branch=master)](https://travis-ci.org/fvdm/nodejs-dnsimple)
[![Dependency Status](https://gemnasium.com/badges/github.com/fvdm/nodejs-dnsimple.svg)](https://gemnasium.com/github.com/fvdm/nodejs-dnsimple#runtime-dependencies)

* [Node.js](https://nodejs.org)
* [Source code](https://github.com/fvdm/nodejs-dnsimple)
* [DNSimple](https://dnsimple.com/)
* [API documentation](https://developer.dnsimple.com/)


Installation
------------

`npm install dnsimple`


Example
-------

See _Configuration_ below for details.


```js
var dnsimple = new require ('dnsimple') ({
  email: 'you@web.tld',
  token: 'abc123'
});

// Add a domain name
var input = {
  domain: { name: 'example.tld' }
};

dnsimple ('POST', '/domains', input, function (err, data) {
  if (err) {
    return console.log (err);
  }

  console.log (data.domain.name + ' created with ID ' + data.domain.id);
});
```

> **More examples:** <https://github.com/fvdm/nodejs-dnsimple/wiki>


Authentication
--------------

This module supports multiple authentication methods.
None of them is totally secure, but some are easier to reset.


### Account token

Most secure, easy to reset at [dnsimple.com/account](https://dnsimple.com/account).


```js
var dnsimple = require ('dnsimple') ({
  email: 'your@email.tld',
  token: '12345abcde'
});
```


### Email & password

```js
var dnsimple = require ('dnsimple') ({
  email: 'your@email.tld',
  password: 'secret'
});
```


### Domain token

Access to only one domain name, easy to reset.

```js
var dnsimple = require ('dnsimple') ({
  domainToken: 'abc123'
});
```


### Two-factor authentication (2FA / OTP)

When you have set up two-factor authentication for your account the module returns
error `twoFactorOTP missing` when you did not provide your one-time password.

First your need to tell the API _once_ your one-time code from Authy or SMS, by
defining it during setup along with your `email` and `password` and calling a random
method. Then the API returns a token which you can use instead of your email and password.


```js
// Set the OTP code on load
var dnsimple = require ('dnsimple') ({
  email: 'my@mail.tld',
  password: 'my-secret',
  twoFactorOTP: '0123456'
});

// Now call a random method to trade the OTP for a longterm token
dnsimple ('GET', '/subscription', function (err, data, meta) {
  if (err) { return console.log (err); }

  console.log ('Two-factor token: '+ meta.twoFactorToken);
});

// From now on only use this token - no email/password
var dnsimple = require ('dnsimple') ({
  twoFactorToken: '22596363b3de40b06f981fb85d82312e'
});
```


Configuration
-------------

When loading the module into your code you need to provide an _Object_ for
authentication as described above.
This object can have a few more settings.

name           | description                          | default
:--------------|:-------------------------------------|:----------------
email          | Account email address                |
token          | Account access token                 |
password       | Account password                     |
domainToken    | Domain specific API access token     |
twoFactorOTP   | One-time code, i.e. Authy            |
twoFactorToken | Login token, from `twoFactorOTP`     |
timeout        | End API call after this amount of ms | 30000
hostname       | API endpoint                         | api.dnsimple.com


> To use the [sandbox](http://developer.dnsimple.com/sandbox/) environment
> set `hostname` to `api.sandbox.dnsimple.com`.


dnsimple
--------
**( method, path, [params], callback )**

The module is only one method which takes care of all the error handling
and basic post-processing.

See the [API documentation](http://developer.dnsimple.com/) for details on each method.


#### Module Arguments

name     | type     | required | description
:--------|:---------|:---------|:-------------------------------------
method   | string   | yes      | GET, POST, PUT, DELETE
path     | string   | yes      | i.e. `/domains/two.com`
params   | object   | no       | i.e. `{domain: { name: 'one.com' } }`
callback | function | yes      | Function to receive response


#### Callback Arguments

The last argument `callback` receives three arguments: `err`, `data` and `meta`.
When an error occurs `err` is an instance of _Error_ and `data` is _null_.
`err` can have additional properties.
When everything is good `err` will be _null_ and `data` will be the parsed result.

The `meta` parameter is always available and contains extra information from
the API, such as statusCode, request_id, runtime and twoFactorToken.

* DELETE result `data` is boolean _true_ on success, _false_ otherwise.


#### Errors

The `err.message` can be any of these:


message             | description                     | additional
:-------------------|:--------------------------------|:----------------------
credentials missing | No authentication details set   |
request failed      | The request cannot be made      | `err.error`
invalid reponse     | Invalid API response            | `err.code`, `err.error`, `err.data`
API error           | The API returned an error       | `err.code`, `err.error`, `err.data`


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

[Franklin van de Meent](https://frankl.in)
