var pkg = require ('./package.json');
var util = require ('util');
var testStart = Date.now ();
var errors = 0;
var queue = [];
var next = 0;

// Setup
// set env DNSIMPLE_EMAIL and DNSIMPLE_TOKEN (Travis CI)
var acc = {
  hostname: process.env.DNSIMPLE_HOSTNAME || 'api.sandbox.dnsimple.com',
  timeout: process.env.DNSIMPLE_TIMEOUT || 30000,
  email: process.env.DNSIMPLE_EMAIL || null
};

var token = process.env.DNSIMPLE_TOKEN || null;
var pass = process.env.DNSIMPLE_PASS || null;
var otp = process.env.DNSIMPLE_OTP || null;

if (pass && otp) {
  acc.password = pass;
  acc.twoFactorOTP = otp;
} else if (token) {
  acc.token = token;
}

var app = require ('./') (acc);

// handle exits
process.on ('exit', function () {
  if (errors === 0) {
    console.log ('\n\u001b[1mDONE, no errors.\u001b[0m\n');
    process.exit (0);
  } else {
    console.log ('\n\u001b[1mFAIL, ' + errors + ' error' + (errors > 1 ? 's' : '') + ' occurred!\u001b[0m\n');
    process.exit (1);
  }
});

// prevent errors from killing the process
process.on ('uncaughtException', function (err) {
  console.log ();
  console.log (err);
  console.log ();
  console.log (err.stack);
  console.log ();
  errors++;
});

// Queue to prevent flooding
function doNext () {
  next++;
  if (queue [next]) {
    queue [next] ();
  }
}

// doTest( passErr, 'methods', [
//   ['feeds', typeof feeds === 'object']
// ])
function doTest (err, label, tests) {
  var testErrors = [];
  var i;

  if (err instanceof Error) {
    console.log ('\u001b[1m\u001b[31mERROR\u001b[0m - ' + label + '\n');
    console.dir (err, { depth: null, colors: true });
    console.log ();
    console.log (err.stack);
    console.log ();
    errors++;
  } else {
    for (i = 0; i < tests.length; i++) {
      if (tests [i] [1] !== true) {
        testErrors.push (tests [i] [0]);
        errors++;
      }
    }

    if (testErrors.length === 0) {
      console.log ('\u001b[1m\u001b[32mgood\u001b[0m - ' + label);
    } else {
      console.log ('\u001b[1m\u001b[31mFAIL\u001b[0m - ' + label + ' (' + testErrors.join (', ') + ')');
    }
  }

  doNext ();
}

// First check API access
queue.push (function () {
  app ('GET', '/prices', function (err) {
    if (err) {
      console.log ('API access: failed ('+ err.message +')');
      console.log (err.stack);
      errors++;
      process.exit (1);
    } else {
      console.log ('\u001b[1m\u001b[32mgood\u001b[0m - API access');
      doNext ();
    }
  });
});


// ! API error
queue.push (function () {
  app ('GET', '/invalid-path', function (err) {
    doTest (null, 'API error', [
      ['type', err instanceof Error],
      ['message', err && err.message === 'API error']
    ]);
  });
});


// ! Timeout error
queue.push (function () {
  var tmp_acc = acc;
  tmp_acc.timeout = 1;
  var tmp_app = require ('./') (tmp_acc);

  tmp_app ('GET', '/prices', function (err, data) {
    doTest (null, 'Timeout error', [
      ['type', err instanceof Error],
      ['code', err.error.code === 'TIMEOUT'],
      ['data', !data]
    ]);
  });
});


// fake material to use
var bogus = {
  domain: {
    name: 'test-'+ Date.now () +'-delete.me'
  }
};


// ! POST object
queue.push (function () {
  var works = null;
  var input = {
    domain: {
      name: bogus.domain.name
    }
  };
  app ('POST', '/domains', input, function (err, data, meta) {
    if (data) {
      bogus.domain = data.domain;
    }
    doTest (err, 'POST object', [
      ['code', meta.statusCode === 201],
      ['type', works = data && data.domain instanceof Object],
      ['item', works && data.domain.name === bogus.domain.name]
    ]);
  });
});

// ! GET object
queue.push (function () {
  var works = null;
  app ('GET', '/domains/'+ bogus.domain.id, function (err, data) {
    doTest (err, 'GET object', [
      ['type', works = data && data.domain instanceof Object],
      ['name', works && data.domain.name === bogus.domain.name]
    ]);
  });
});

// ! GET array object
queue.push (function () {
  app ('GET', '/domains', function (err, data) {
    var works = null;
    doTest (err, 'GET array object', [
      ['data type', works = data instanceof Array],
      ['data size', works = works && data.length >= 1],
      ['item type', works = works && data[0].domain instanceof Object],
      ['item name', works && typeof data[0].domain.name === 'string']
    ]);
  });
});

// ! DELETE
queue.push (function () {
  app ('DELETE', '/domains/'+ bogus.domain.id, function (err, data) {
    doTest (err, 'DELETE', [
      ['data', data === true]
    ]);
  });
});


// Start the tests
console.log ('Running tests...');
console.log ('Node.js v' + process.versions.node);
console.log ('Module  v' + pkg.version);
console.log ();
queue [0] ();
