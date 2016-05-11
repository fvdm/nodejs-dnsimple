var dotest = require ('dotest');
var app = require ('./');

// Setup
// set env DNSIMPLE_EMAIL and DNSIMPLE_TOKEN (Travis CI)
var acc = {
  hostname: process.env.DNSIMPLE_HOSTNAME || 'api.sandbox.dnsimple.com',
  timeout: process.env.DNSIMPLE_TIMEOUT || 30000,
  email: process.env.DNSIMPLE_EMAIL || null,
  token: process.env.DNSIMPLE_TOKEN || null,
  password: process.env.DNSIMPLE_PASS || null,
  twoFactorOTP: process.env.DNSIMPLE_OTP || null
};

// fake material to use
var bogus = {
  domain: {
    name: 'test-' + Date.now () + '-delete.me'
  }
};

var dnsimple = app (acc);


// First check API access
dotest.add ('Module', function () {
  dotest.test ()
    .isFunction ('fail', 'exports', app)
    .isFunction ('fail', 'module', dnsimple)
    .done ();
});


// ! API error
dotest.add ('API error', function () {
  dnsimple ('GET', '/invalid-path', function (err) {
    dotest.test ()
      .isError ('fail', 'err', err)
      .isExactly ('fail', 'err.message', err.message, 'API error')
      .done ();
  });
});


// ! Timeout error
dotest.add ('Timeout error', function () {
  var tmpAcc = acc;

  tmpAcc.timeout = 1;
  app (tmpAcc) ('GET', '/prices', function (err) {
    var error = err && err.error;

    dotest.test ()
      .isError ('fail', 'err', err)
      .isExactly ('fail', 'err.message', err && err.message, 'request failed')
      .isError ('fail', 'err.error', error)
      .isExactly ('fail', 'err.error.code', error && error.code, 'TIMEOUT')
      .done ();
  });
});


// ! POST object
dotest.add ('POST object', function () {
  var input = {
    domain: {
      name: bogus.domain.name
    }
  };

  dnsimple ('POST', '/domains', input, function (err, data, meta) {
    var domain = data && data.domain;

    if (data) {
      bogus.domain = domain;
    }

    dotest.test (err)
      .isObject ('fail', 'meta', meta)
      .isExactly ('fail', 'meta.statusCode', meta && meta.statusCode, 201)
      .isObject ('fail', 'data', data)
      .isObject ('fail', 'data.domain', domain)
      .isExactly ('fail', 'data.domain.name', domain && domain.name, bogus.domain.name)
      .done ();
  });
});


// ! GET object
dotest.add ('GET object', function () {
  dnsimple ('GET', '/domains/' + bogus.domain.id, function (err, data) {
    var domain = data && data.domain;

    dotest.test (err)
      .isObject ('fail', 'data', data)
      .isObject ('fail', 'data.domain', domain)
      .isExactly ('fail', 'data.domain.name', domain && domain.name, bogus.domain.name)
      .done ();
  });
});


// ! GET array object
dotest.add ('GET array object', function () {
  dnsimple ('GET', '/domains', function (err, data) {
    var domain = data && data[0] && data[0].domain;

    dotest.test (err)
      .isArray ('fail', 'data', data)
      .isCondition ('fail', 'data.length', data && data.length, '>=', 1)
      .isObject ('fail', 'data[0].domain', domain)
      .isString ('fail', 'data[0].domain.name', domain && domain.name)
      .done ();
  });
});


// ! DELETE
dotest.add ('DELETE', function () {
  dnsimple ('DELETE', '/domains/' + bogus.domain.id, function (err, data) {
    dotest.test (err)
      .isBoolean ('fail', 'data', data)
      .isExactly ('fail', 'data', data, true)
      .done ();
  });
});


// Start the tests
dotest.run ();
