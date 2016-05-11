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


/**
 * Process httpreq response
 *
 * @callback callback
 * @param err {Error, null} - Agent error
 * @param response {object} - Response details
 * @param request {object} - Request details
 * @param callback {function} - `function (err, data) {}`
 * @returns {void}
 */

function processResponse (err, response, request, callback) {
  var error = null;
  var data = response && response.body || '';
  var meta = {};

  // agent error
  if (err) {
    error = new Error ('request failed');
    error.error = err;
    callback (error);
    return;
  }

  // parse response
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
  if (request.path.match (/^domains\/.+\/check$/) && meta.statusCode === 404) {
    error = null;
  }

  // delete ok
  if (request.method === 'DELETE' && !(data instanceof Object && Object.keys (data).length > 0)) {
    callback (null, meta.statusCode === 200 || meta.statusCode === 204, meta);
    return;
  }


  // check HTTP status code
  if (!error && response.statusCode < 300) {
    callback (null, data, meta);
    return;
  } else if (response.statusCode === 401 && response.headers ['x-dnsimple-otp'] === 'required') {
    error = new Error ('twoFactorOTP required');
  } else {
    error = new Error ('API error');
  }

  error.code = response.statusCode;
  error.error = data.message || data.error || data.errors || null;
  error.data = data;

  callback (error, null, meta);
}


/**
 * Send request to API
 *
 * @param config {object}
 * @param config.path {string} - Request path
 * @param [config.method] {string} - GET, POST, PUT, DELETE
 * @param config.auth {object} - See module.exports below
 */

function sendRequest (props) {
  var options = {
    url: 'https://' + props.config.hostname + '/v1' + props.path,
    method: props.method || 'GET',
    timeout: props.config.timeout,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Nodejs-DNSimple'
    }
  };

  // credentials set?
  if (
    !(props.config.email && props.config.token)
    && !(props.config.email && props.config.password)
    && !props.config.domainToken
    && !props.config.twoFactorToken
  ) {
    props.callback (new Error ('credentials missing'));
    return;
  }

  // token in headers
  if (props.config.token) {
    options.headers['X-DNSimple-Token'] = props.config.email + ':' + props.config.token;
  }

  if (props.config.domainToken) {
    options.headers['X-DNSimple-Domain-Token'] = props.config.domainToken;
  }

  // build request
  if (options.method.match (/(POST|PUT|DELETE)/)) {
    options.json = props.fields;
  } else {
    options.parameters = props.fields;
  }

  // password authentication
  if (
    !props.config.twoFactorToken
    && !props.config.token
    && !props.config.domainToken
    && props.config.password
    && props.config.email
  ) {
    options.auth = props.config.email + ':' + props.config.password;

    // two-factor authentication (2FA)
    if (props.config.twoFactorOTP) {
      options.headers['X-DNSimple-2FA-Strict'] = 1;
      options.headers['X-DNSimple-OTP'] = props.config.twoFactorOTP;
    }
  }

  if (props.config.twoFactorToken) {
    options.auth = props.config.twoFactorToken + ':x-2fa-basic';
    options.headers['X-DNSimple-2FA-Strict'] = 1;
  }

  // start request
  http.doRequest (options, function (err, res) {
    processResponse (err, res, options, props.callback);
  });
}


/**
 * Module configuration and interface
 *
 * @param config {object} - Configuration, see README.md
 * @param [config.hostname = api.dnsimple.com] {string} - API hostname
 * @param [config.email] {string} - Account email
 * @param [config.token] {string} - Account token
 * @param [config.password] {string} - Account password
 * @param [config.domainToken] {string} - Domain token
 * @param [config.twoFactorTokeb] {string} - TFA token
 * @param [config.twoFactorOTP] {string} - TFA one-time code
 * @param [config.timeout = 30000] {string} - Request timeout in ms
 * @returns {function} - `( method, path, [fields], callback )`
 */

module.exports = function (config) {
  var api = {
    hostname: config.hostname || 'api.dnsimple.com',
    email: config.email || null,
    token: config.token || null,
    domainToken: config.domainToken || null,
    twoFactorOTP: config.twoFactorOTP || null,
    twoFactorToken: config.twoFactorToken || null,
    password: config.password || null,
    timeout: config.timeout || 30000
  };

  // interface
  return function (method, path, fields, callback) {
    if (typeof fields === 'function') {
      callback = fields;
      fields = null;
    }

    sendRequest ({
      method: method,
      path: path,
      fields: fields,
      callback: callback,
      auth: api
    });
  };
};
