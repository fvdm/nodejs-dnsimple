/*
Name:          DNSimple module for Node.js
Author:        Franklin van de Meent (https://frankl.in)
Source:        https://github.com/fvdm/nodejs-dnsimple
Feedback:      https://github.com/fvdm/nodejs-dnsimple/issues
License:       Unlicense (public domain)
               see UNLICENSE file

Service name:  DNSimple
Service URL:   https://dnsimple.com
Service API:   http://developer.dnsimple.com
*/


module.exports = function( setup ) {
  // ! Defaults
  var api = {
    hostname: setup.hostname || 'api.dnsimple.com',
    email: setup.email || null,
    token: setup.token || null,
    domainToken: setup.domainToken || null,
    twoFactorOTP: setup.twoFactorOTP || null,     // one time password (ie. Authy)
    twoFactorToken: setup.twoFactorToken || null, // OTP exchange token
    password: setup.password || null,
    timeout: setup.timeout || 30000
  };

  // ! API
  return function( method, path, fields, callback ) {
    if( !callback && typeof fields === 'function' ) {
      var callback = fields;
      var fields = {};
    }

    // process callback data
    var complete = false;
    function doCallback( err, data, meta ) {
      if( !complete ) {
        complete = true;

        if( err ) {
          callback( err, null, meta );
          return;
        }

        if( method === 'DELETE' && !(data instanceof Object && Object.keys(data).length > 0) ) {
          callback( null, meta.statusCode === 200 || meta.statusCode === 204, meta );
          return;
        }

        // [ {type: {}}, {type: {}} ]
        if( data instanceof Array && data[0] instanceof Object ) {
          var keys = Object.keys( data[0] );
          if( keys.length === 1 && data[0][ keys[0] ] instanceof Object ) {
            data.map( function( cur, i, arr ) { arr[i] = cur[ keys[0] ]; });
          }
        }

        // {type: {}}
        else if( data instanceof Object ) {
          var keys = Object.keys( data );
          if( keys.length === 1 && data[ keys[0] ] instanceof Object ) {
            data = data[ keys[0] ];
          }
        }

        callback( null, data, meta );
      }
    }

    // credentials set?
    if( ! (api.email && api.token) && ! (api.email && api.password) && ! api.domainToken && ! api.twoFactorToken ) {
      doCallback( new Error('credentials missing') );
      return;
    }

    // prepare
    var querystr = JSON.stringify(fields);
    var headers = {
      'Accept': 'application/json',
      'User-Agent': 'Nodejs-DNSimple'
    };

    // token in headers
    if( api.token ) {
      headers['X-DNSimple-Token'] = api.email +':'+ api.token;
    }

    if( api.domainToken ) {
      headers['X-DNSimple-Domain-Token'] = api.domainToken;
    }

    // build request
    if( method.match( /(POST|PUT|DELETE)/ ) ) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = querystr.length;
    }

    var options = {
      host: api.hostname,
      port: 443,
      path: '/v1'+ path,
      method: method,
      headers: headers
    };

    // password authentication
    if( ! api.twoFactorToken && ! api.token && ! api.domainToken && api.password && api.email ) {
      options.auth = api.email +':'+ api.password;

      // two-factor authentication (2FA)
      if( api.twoFactorOTP ) {
        headers['X-DNSimple-2FA-Strict'] = 1;
        headers['X-DNSimple-OTP'] = api.twoFactorOTP;
      }
    }

    if( api.twoFactorToken ) {
      options.auth = api.twoFactorToken +':x-2fa-basic';
      headers['X-DNSimple-2FA-Strict'] = 1;
    }

    // start request
    var request = require('https').request( options );

    // response
    request.on( 'response', function( response ) {
      var meta = {statusCode: null};
      var data = [];
      var size = 0;

      response.on( 'data', function( chunk ) {
        data.push( chunk );
        size += chunk.length;
      });

      response.on( 'close', function() {
        doCallback( new Error('connection dropped') );
      });

      // request finished
      response.on( 'end', function() {
        data = new Buffer.concat( data, size ).toString('utf8').trim();
        var failed = null;

        meta.statusCode = response.statusCode;
        meta.request_id = response.headers['x-request-id'];
        meta.runtime = response.headers['x-runtime'];

        if( typeof response.headers['x-dnsimple-otp-token'] === 'string' ) {
          meta.twoFactorToken = response.headers['x-dnsimple-otp-token'];
        }

        if( response.statusCode !== 204 ) {
          try {
            data = JSON.parse( data );
          } catch(e) {
            doCallback(new Error('not json'), data);
          }
        }

        // overrides
        var noError = false;
        var error = null;

        // status ok, no data
        if( data === '' && meta.statusCode < 300 ) {
          noError = true;
        }
        // domain check 404 = free
        if( path.match(/^domains\/.+\/check$/) && meta.statusCode === 404 ) {
          noError = true;
        }

        // check HTTP status code
        if( noError || (!failed && response.statusCode < 300) ) {
          doCallback( null, data, meta );
        } else {
          if( response.statusCode === 401 && response.headers['x-dnsimple-otp'] === 'required' ) {
            error = new Error('twoFactorOTP required');
          } else {
            error = failed || new Error('API error');
          }
          error.code = response.statusCode;
          error.error = data.message || data.error || (data.errors && data instanceof Object && Object.keys(data.errors)[0] ? data.errors[ Object.keys(data.errors)[0] ] : null) || null;
          error.data = data;
          doCallback( error, null, meta );
        }
      });
    });

    // timeout
    request.on( 'socket', function( socket ) {
      if( typeof api.timeout === 'number' ) {
        socket.setTimeout( api.timeout );
        socket.on( 'timeout', function() {
          doCallback( new Error('request timeout') );
          request.abort();
        });
      }
    });

    // error
    request.on( 'error', function( error ) {
      var er = null;
      if( error.code === 'ECONNRESET' ) {
        er = new Error('request timeout');
      } else {
        er = new Error('request failed');
      }
      er.error = error;
      doCallback( er );
    });

    // run it
    if( method.match( /(POST|PUT|DELETE)/ ) ) {
      request.end( querystr );
    } else {
      request.end();
    }
  };
};
