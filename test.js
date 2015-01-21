var testStart = Date.now();
var util = require('util');

// Setup
// set env DNSIMPLE_EMAIL and DNSIMPLE_TOKEN (Travis CI)
// or use cli arguments: npm test --dnsemail=me@some.where --dnstoken=abc123
var acc = {
  hostname: process.env.npm_config_dnshostname || process.env.DNSIMPLE_HOSTNAME || 'api.sandbox.dnsimple.com',
  timeout: process.env.npm_config_dnstimeout || process.env.DNSIMPLE_TIMEOUT || null,
  email: process.env.npm_config_dnsemail || process.env.DNSIMPLE_EMAIL || null
};

var token = process.env.npm_config_dnstoken || process.env.DNSIMPLE_TOKEN || null;
var pass = process.env.npm_config_dnspass || process.env.DNSIMPLE_PASS || null;
var otp = process.env.npm_config_dnsotp || process.env.DNSIMPLE_OTP || null;

if( pass && otp ) {
  acc.password = pass;
  acc.twoFactorOTP = otp;
} else if( token ) {
  acc.token = token;
}

var app = require('./')( acc );

// handle exits
var errors = 0;
process.on( 'exit', function() {
  var testTime = Date.now() - testStart;
  if( errors == 0 ) {
    console.log('\n\033[1mDONE, no errors.\033[0m');
    console.log('Timing: \033[33m%s ms\033[0m\n', testTime);
    process.exit(0);
  } else {
    console.log('\n\033[1mFAIL, '+ errors +' error'+ (errors > 1 ? 's' : '') +' occurred!\033[0m');
    console.log('Timing: \033[33m%s ms\033[0m\n', testTime);
    process.exit(1);
  }
});

// prevent errors from killing the process
process.on( 'uncaughtException', function( err ) {
  console.log();
  console.error( err.stack );
  console.trace();
  console.log();
  errors++
});

// Queue to prevent flooding
var queue = [];
var next = 0;

function doNext() {
  next++;
  if( queue[next] ) {
    queue[next]();
  }
}

// doTest( passErr, 'methods', [
//   ['feeds', typeof feeds === 'object']
// ]);
function doTest( err, label, tests ) {
  if( err instanceof Error ) {
    console.error( label +': \033[1m\033[31mERROR\033[0m\n' );
    console.error( util.inspect(err, false, 10, true) );
    console.log();
    console.error( err.stack );
    console.log();
    errors++;
  } else {
    var testErrors = [];
    tests.forEach( function( test ) {
      if( test[1] !== true ) {
        testErrors.push(test[0]);
        errors++;
      }
    });

    if( testErrors.length == 0 ) {
      console.log( label +': \033[1m\033[32mok\033[0m' );
    } else {
      console.error( label +': \033[1m\033[31mfailed\033[0m ('+ testErrors.join(', ') +')' );
    }
  }

  doNext();
}

// First check API access
queue.push( function() {
  app( 'GET', '/prices', function(err, data) {
    if(err) {
      console.log('API access: failed ('+ err.message +')');
      console.log(err.stack);
      errors++
      process.exit(1);
    } else {
      console.log('API access: \033[1m\033[32mok\033[0m');
      doNext();
    }
  });
});


// fake material to use
var bogus = {
  domain: {
    name: 'test-'+ Date.now() +'-delete.me'
  }
}


// ! POST object
queue.push( function() {
  var input = {
    domain: {
      name: bogus.domain.name
    }
  }
  app( 'POST', '/domains', input, function( err, data, meta ) {
    bogus.domain = data;
    doTest( err, 'POST object', [
      ['code', meta.statusCode === 201],
      ['type', data instanceof Object],
      ['item', data.name === bogus.domain.name]
    ]);
  });
});

// ! GET object
queue.push( function() {
  app( 'GET', '/domains/'+ bogus.domain.id, function( err, data, meta ) {
    doTest( err, 'GET object', [
      ['type', data instanceof Object],
      ['name', data.name === bogus.domain.name]
    ]);
  });
});

// ! GET array object
queue.push( function() {
  app( 'GET', '/domains', function( err, data, meta ) {
    doTest( err, 'GET array object', [
      ['data type', data instanceof Array],
      ['data size', data && data.length >= 1],
      ['item type', data[0] instanceof Object],
      ['item name', data[0].name === bogus.domain.name]
    ]);
  });
});

// ! DELETE
queue.push( function() {
  app( 'DELETE', '/domains/'+ bogus.domain.id, function( err, data, meta ) {
    doTest( err, 'DELETE', [
      ['data', data === true]
    ]);
  });
});

// ! Error
queue.push( function() {
  app( 'GET', '/domains/'+ bogus.domain.id, function( err, data, meta ) {
    doTest( null, 'Error', [
      ['type', err && err.message === 'API error']
    ]);
  });
});

// Start the tests
queue[0]();
