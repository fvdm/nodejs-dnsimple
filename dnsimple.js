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


var http = require ('httpreq');

module.exports = function (setup) {
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
  return function (method, path, fields, callback) {
    if (!callback && typeof fields === 'function') {
      callback = fields;
      fields = {};
    }

    // process callback data
    var complete = false;
    function doCallback (err, data, meta) {
      if (!complete) {
        complete = true;

        if (err) {
          callback (err, null, meta);
          return;
        }

        if (method === 'DELETE' && !(data instanceof Object && Object.keys (data).length > 0)) {
          callback (null, meta.statusCode === 200 || meta.statusCode === 204, meta);
          return;
        }

        callback (null, data, meta);
      }
    }

    // credentials set?
    if (! (api.email && api.token) && ! (api.email && api.password) && ! api.domainToken && ! api.twoFactorToken) {
      doCallback (new Error ('credentials missing'));
      return;
    }

    // prepare
    var options = {
      url: 'https://' + api.hostname + '/v1' + path,
      method: method || 'GET',
      timeout: api.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Nodejs-DNSimple'
      }
    };

    // token in headers
    if (api.token) {
      options.headers['X-DNSimple-Token'] = api.email +':'+ api.token;
    }

    if (api.domainToken) {
      options.headers['X-DNSimple-Domain-Token'] = api.domainToken;
    }

    // build request
    if (method.match (/(POST|PUT|DELETE)/)) {
      options.json = fields;
    } else {
      options.parameters = fields;
    }

    // password authentication
    if (! api.twoFactorToken && ! api.token && ! api.domainToken && api.password && api.email) {
      options.auth = api.email +':'+ api.password;

      // two-factor authentication (2FA)
      if (api.twoFactorOTP) {
        headers['X-DNSimple-2FA-Strict'] = 1;
        headers['X-DNSimple-OTP'] = api.twoFactorOTP;
      }
    }

    if (api.twoFactorToken) {
      options.auth = api.twoFactorToken +':x-2fa-basic';
      headers['X-DNSimple-2FA-Strict'] = 1;
    }

    // start request
    http.doRequest (options, function (err, response) {
      var error = null;
      var apiError = null;
      var data = response && response.body || '';
      var meta = {};

      if (err) {
        error = new Error ('request failed');
        error.error = err;
        doCallback (error);
        return;
      }

      try {
        data = JSON.parse (data);
      } catch (e) {
        error = new Error ('invalid response');
        error.error = e;
      }

      meta.statusCode = response.statusCode;
      meta.request_id = response.headers ['x-request-id'];
      meta.runtime = response.headers ['x-runtime'];

      if (typeof response.headers ['x-dnsimple-otp-token'] === 'string') {
        meta.twoFactorToken = response.headers ['x-dnsimple-otp-token'];
      }

      // status ok, no data
      if (!data && meta.statusCode < 300) {
        error = null;
      }

      // domain check 404 = free
      if (path.match (/^domains\/.+\/check$/) && meta.statusCode === 404) {
        error = null;
      }

      // check HTTP status code
      if (!error && response.statusCode < 300) {
        doCallback (null, data, meta);
        return;
      } else if (response.statusCode === 401 && response.headers ['x-dnsimple-otp'] === 'required') {
        error = new Error ('twoFactorOTP required');
      } else {
        error = new Error ('API error');
      }

      error.code = response.statusCode;
      error.error = data.message || data.error || data.errors || null;
      error.data = data;

      doCallback (error, null, meta);
    });
  };
};
