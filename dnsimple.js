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

var https = require('https');
var app = {};

// ! - Defaults
app.api = {
  hostname: 'api.dnsimple.com',
  email: null,
  token: null,
  domainToken: null,
  twoFactorOTP: null,   // one time password (ie. Authy)
  twoFactorToken: null, // OTP exchange token
  password: null,
  timeout: 30000
};


// ! DNS
app.dns = {};

// ! dns.list
app.dns.list = function( domainname, callback ) {
  app.talk( 'GET', 'domains/'+ domainname +'/records', callback );
}

// ! dns.show
app.dns.show = function( domainname, recordID, callback ) {
  app.talk( 'GET', 'domains/'+ domainname +'/records/'+ recordID, callback );
}

// ! dns.add
// REQUIRED: name, record_type, content
// OPTIONAL: ttl, prio
app.dns.add = function( domainname, record, callback ) {
  var post = { record: record };
  app.talk( 'POST', 'domains/'+ domainname +'/records', post, callback );
}

// ! dns.update
app.dns.update = function( domainname, recordID, record, callback ) {
  var post = { record: record };
  app.talk( 'PUT', 'domains/'+ domainname +'/records/'+ recordID, post, callback );
}

// ! dns.delete
app.dns.delete = function( domainname, recordID, callback ) {
  app.talk( 'DELETE', 'domains/'+ domainname +'/records/'+ recordID, callback );
}


// ! DOMAINS
app.domains = {};

// ! domains.list
// Simple returns only array with domainnames
app.domains.list = function( simple, callback ) {
  if( !callback && typeof simple === 'function' ) {
    var callback = simple;
    var simple = false;
  }

  app.talk( 'GET', 'domains', function( error, domains, meta ) {
    if( simple ) {
      domains.map( function( cur, i, arr ) { arr[i] = cur.name });
    }
    callback( null, domains, meta );
  });
}

// ! domains.findByRegex
app.domains.findByRegex = function( regex, callback ) {
  var result = [];
  app.domains.list( false, function( error, domains, meta ) {
    if( error ) { return callback( error, null, meta )}
    var regexp = new RegExp( regex );
    for( var i = 0; i < domains.length; i++ ) {
      if( domains[i].name.match( regexp ) ) {
        result.push( domains[i] );
      }
    }
    callback( null, result, meta );
  });
}

// ! domains.show
app.domains.show = function( domainname, callback ) {
  app.talk( 'GET', 'domains/'+ domainname, callback );
}

// ! domains.add
app.domains.add = function( domainname, callback ) {
  var dom = { domain: { name: domainname } };
  app.talk( 'POST', 'domains', dom, callback );
}

// ! domains.delete
app.domains.delete = function( domainname, callback ) {
  app.talk( 'DELETE', 'domains/'+ domainname, callback );
}

// ! domains.resetToken
app.domains.resetToken = function( domainname, callback ) {
  app.talk( 'POST', 'domains/'+ domainname +'/token', callback );
}

// ! domains.push
app.domains.push = function( domainname, email, regId, callback ) {
  var data = { push: {
    new_user_email: email,
    contact_id: regId
  }};
  app.talk( 'POST', 'domains/'+ domainname +'/push', data, callback );
}

// ! domains.vanitynameservers
app.domains.vanitynameservers = function( domainname, enable, nameservers, callback ) {
  if( typeof nameservers === 'function' ) {
    var callback = nameservers;
    var nameservers = null;
  }

  if( enable ) {
    var input = {
      vanity_nameserver_configuration: {
        server_source: 'dnsimple'
      }
    };
    if( nameservers ) {
      input.vanity_nameserver_configuration = nameservers;
      input.vanity_nameserver_configuration.server_source = 'external';
    }
    app.talk( 'POST', 'domains/'+ domainname +'/vanity_name_servers', input, callback );
  } else {
    app.talk( 'DELETE', 'domains/'+ domainname +'/vanity_name_servers', callback );
  }
}


// ! DOMAINS.MEMBERSHIPS
app.domains.memberships = {};

// ! domains.memberships.list
app.domains.memberships.list = function( domainname, callback ) {
  app.talk( 'GET', 'domains/'+ domainname +'/memberships', callback );
}

// ! domains.memberships.add
app.domains.memberships.add = function( domainname, email, callback ) {
  var data = {membership: {email: email}};
  app.talk( 'POST', 'domains/'+ domainname +'/memberships', data, callback );
}

// ! domains.memberships.delete
app.domains.memberships.delete = function( domainname, member, callback ) {
  app.talk( 'DELETE', 'domains/'+ domainname +'/memberships/'+ member, callback );
}


// ! DOMAINS REGISTRATION

// ! domains.check
// Check availability
app.domains.check = function( domainname, callback ) {
  app.talk( 'GET', 'domains/'+ domainname +'/check', callback );
}

// ! domains.register
// Register domainname - auto-payment!
app.domains.register = function( domainname, registrantID, extendedAttribute, callback ) {
  var vars = {
    domain: {
      name: domainname,
      registrant_id: registrantID
    }
  };

  // fix 3 & 4 params
  if( !callback && typeof extendedAttribute == 'function' ) {
    var callback = extendedAttribute;
  } else if( typeof extendedAttribute == 'object' ) {
    vars.domain.extended_attribute = extendedAttribute;
  }

  // send
  app.talk( 'POST', 'domain_registrations', vars, callback );
}

// ! domains.transfer
// Transfer domainname - auto-payment!
app.domains.transfer = function( domainname, registrantID, authinfo, callback ) {
  var vars = {
    domain: {
      name: domainname,
      registrant_id: registrantID
    }
  };

  // fix 3 & 4 params
  if( !callback && typeof authinfo == 'function' ) {
    var callback = authinfo;
  } else if( typeof authinfo == 'string' ) {
    vars.transfer_order = {
      authinfo: authinfo
    }
  }

  // send
  app.talk( 'POST', 'domain_transfers', vars, callback );
}

// ! domains.transferAttribute
// Transfer domainname with Extended Attributes - auto-payment!
app.domains.transferAttribute = function( domainname, registrantID, attr, authinfo, callback ) {
  var vars = {
    domain: {
      name: domainname,
      registrant_id: registrantID
    },
    extended_attribute: attr
  };

  // fix 3 & 4 params
  if( !callback && typeof authinfo == 'function' ) {
    var callback = authinfo;
  } else if( typeof authinfo == 'string' ) {
    vars.transfer_order = {
      authinfo: authinfo
    }
  }

  // send
  app.talk( 'POST', 'domain_transfers', vars, callback );
}

// ! domains.renew
// Renew domainname registration - auto-payment!
app.domains.renew = function( domainname, whoisPrivacy, callback ) {
  var vars = {
    domain: {
      name: domainname
    }
  };

  // fix 2 & 3 params
  if( !callback && typeof whoisPrivacy == 'function' ) {
    var callback = whoisPrivacy;
  } else {
    // string matching
    if( whoisPrivacy ) {
      vars.domain.renew_whois_privacy = 'true';
    } else {
      vars.domain.renew_whois_privacy = 'false';
    }
  }

  // send
  app.talk( 'POST', 'domain_renewals', vars, callback );
}

// ! domains.autorenew
// Set auto-renewal for domain
app.domains.autorenew = function( domainname, enable, callback ) {
  var method = enable ? 'POST' : 'DELETE';
  app.talk( method, 'domains/'+ domainname +'/auto_renewal', callback );
}

// ! domains.transferout
// Prepare domain for transferring out
app.domains.transferout = function( domainname, callback ) {
  app.talk( 'POST', 'domains/'+ domainname +'/transfer_outs', callback );
}

// ! domains.whoisPrivacy
app.domains.whoisPrivacy = function( domainname, enable, callback ) {
  var method = enable ? 'POST' : 'DELETE';
  app.talk( method, 'domains/'+ domainname +'/whois_privacy', callback );
}

// ! domains.nameservers
// Get or set nameservers at registry
app.domains.nameservers = function( domainname, nameservers, callback ) {
  if( typeof nameservers === 'function' ) {
    var callback = nameservers;
    var nameservers = null;
  }
  if( nameservers ) {
    var ns = {
      name_servers: nameservers
    };
    app.talk( 'POST', 'domains/'+ domainname +'/name_servers', ns, callback );
  } else {
    app.talk( 'GET', 'domains/'+ domainname +'/name_servers', callback );
  }
}

// ! domains.nameserver_register
app.domains.nameserver_register = function( domainname, name, ip, callback ) {
  var vars = {
    name_server: {
      name: name,
      ip: ip
    }
  };
  app.talk( 'POST', 'domains/'+ domainname +'/registry_name_servers', vars, callback );
}

// ! domains.nameserver_deregister
app.domains.nameserver_deregister = function( domainname, name, callback ) {
  app.talk( 'DELETE', 'domains/'+ domainname +'/registry_name_servers/'+ name, vars, callback );
}

// ! domains.zone
// See http://developer.dnsimple.com/domains/zones/#zone
app.domains.zone = function( domainname, callback ) {
  app.talk( 'GET', 'domains/'+ domainname +'/zone', function( err, data, meta ) {
    callback( err, data.zone || null, meta )
  });
}

// ! domains.importZone
// See http://developer.dnsimple.com/domains/zones/#import
app.domains.importZone = function( domainname, zone, callback ) {
  var zone = { zone_import: { zone_data: zone }};
  app.talk( 'POST', 'domains/'+ domainname +'/zone_imports', zone, callback );
}


// ! DOMAINS SERVICES
app.domains.services = {};

// ! domains.services.list
// already applied
app.domains.services.list = function( domainname, callback ) {
  app.talk( 'GET', 'domains/'+ domainname +'/applied_services', callback );
}

// ! domains.services.available
// available
app.domains.services.available = function( domainname, callback ) {
  app.talk( 'GET', 'domains/'+ domainname +'/available_services', callback );
}

// ! domains.services.add
// apply one
app.domains.services.add = function( domainname, serviceID, settings, callback ) {
  if( typeof settings === 'function' ) {
    var callback = settings;
    var settings = null;
  }
  var service = { service: { id: serviceID } };
  if( settings ) {
    service.settings = settings;
  }
  app.talk( 'POST', 'domains/'+ domainname +'/applied_services', service, callback );
}

// ! domains.services.delete
// delete one
app.domains.services.delete = function( domainname, serviceID, callback ) {
  app.talk( 'DELETE', 'domains/'+ domainname +'/applied_services/'+ serviceID, callback );
}


// ! domains.template
// apply template -- alias for templates.apply
app.domains.template = function( domainname, templateID, callback ) {
  app.templates.apply( domainname, templateID, callback );
}


// ! EMAIL FORWARDS
app.domains.email_forwards = {};

// ! domains.email_forwards.list
app.domains.email_forwards.list = function( domainname, callback ) {
  app.talk( 'GET', 'domains/'+ domainname +'/email_forwards', callback );
}

// ! domains.email_forwards.add
app.domains.email_forwards.add = function( domainname, from, to, callback ) {
  var vars = {
    email_forward: {
      from: from,
      to: to
    }
  };
  app.talk( 'POST', 'domains/'+ domainname +'/email_forwards', vars, callback );
}

// ! domains.email_forwards.show
app.domains.email_forwards.show = function( domainname, id, callback ) {
  app.talk( 'GET', 'domains/'+ domainname +'/email_forwards/'+ id, callback );
}

// ! domains.email_forwards.delete
app.domains.email_forwards.delete = function( domainname, id, callback ) {
  app.talk( 'DELETE', 'domains/'+ domainname +'/email_forwards/'+ id, callback );
}


// ! CERTIFICATES
app.domains.certificates = {};

// ! domains.certificates.list
app.domains.certificates.list = function( domain, callback ) {
  app.talk( 'GET', 'domains/'+ domain +'/certificates', callback );
}

// ! domains.certificates.show
app.domains.certificates.show = function( domain, id, callback ) {
  app.talk( 'GET', 'domains/'+ domain +'/certificates/'+ id, callback );
}

// ! domains.certificates.add
app.domains.certificates.add = function( domain, subdomain, contactId, csr, callback ) {
  if( typeof csr === 'function' ) {
    var callback = csr;
    var csr = null;
  }
  var input = {
    certificate: {
      name: subdomain || '',
      contact_id: contactId
    }
  };
  if( csr ) {
    input.certificate.csr = csr;
  }
  app.talk( 'POST', 'domains/'+ domain +'/certificates', input, callback );
}

// ! domains.certificates.configure
app.domains.certificates.configure = function( domain, id, callback ) {
  app.talk( 'PUT', 'domains/'+ domain +'/certificates/'+ id +'/configure', callback );
}

// ! domains.certificates.submit
app.domains.certificates.submit = function( domain, id, email, callback ) {
  var input = {
    certificate: {
      approver_email: email
    }
  };
  app.talk( 'PUT', 'domains/'+ domain +'/certificates/'+ id +'/submit', input, callback );
}


// ! SERVICES
app.services = {};

// ! services.list
// List all supported services
app.services.list = function( callback ) {
  app.talk( 'GET', 'services', callback );
}

// ! services.show
// Get one service' details
app.services.show = function( serviceID, callback ) {
  app.talk( 'GET', 'services/'+ serviceID, callback );
}

// ! services.config
app.services.config = function( serviceName, callback ) {
  var complete = false;
  function doCallback( err, res, meta ) {
    if( ! complete ) {
      complete = true;
      callback( err, res || null, meta );
    };
  }

  https.get( 'https://raw.githubusercontent.com/aetrion/dnsimple-services/master/services/'+ serviceName +'/config.json', function( response ) {
    var data = [];
    var size = 0;
    var error = null;

    response.on( 'data', function(ch) {
      data.push(ch);
      size += ch.length;
    })

    response.on( 'end', function() {
      data = new Buffer.concat( data, size ).toString('utf8').trim();

      try {
        data = JSON.parse( data );
      } catch(e) {
        error = new Error('not json');
      }

      if( response.statusCode >= 300 ) {
        error = new Error('API error');
        error.code = response.statusCode;
        error.headers = response.headers;
        error.body = data;
      }

      doCallback( error, data, {service: 'github'} );
    });
  });
}


// ! TEMPLATES
app.templates = {};

// ! templates.list
// List all of the custom templates in the account
app.templates.list = function( callback ) {
  app.talk( 'GET', 'templates', callback );
}

// ! templates.show
// Get a specific template
app.templates.show = function( templateID, callback ) {
  app.talk( 'GET', 'templates/'+ templateID, callback );
}

// ! templates.add
// Create a custom template
// REQUIRED: name, shortname
// OPTIONAL: description
app.templates.add = function( template, callback ) {
  var set = { dns_template: template };
  app.talk( 'POST', 'templates', set, callback );
}

// ! templates.delete
// Delete the given template
app.templates.delete = function( templateID, callback ) {
  app.talk( 'DELETE', 'templates/'+ templateID, callback );
},

// ! templates.apply
// Apply a template to a domain
app.templates.apply = function( domainname, templateID, callback ) {
  app.talk( 'POST', 'domains/'+ domainname +'/templates/'+ templateID +'/apply', callback );
}

// records
app.templates.records = {};

// ! templates.records.list
// list records in template
app.templates.records.list = function( templateID, callback ) {
  app.talk( 'GET', 'templates/'+ templateID +'/records', callback );
}

// ! templates.records.show
// Get one record for template
app.templates.records.show = function( templateID, recordID, callback ) {
  app.talk( 'GET', 'templates/'+ templateID +'/records/'+ recordID, callback );
}

// ! templates.records.add
// Add record to template
// REQUIRED: name, record_type, content
// OPTIONAL: ttl, prio
app.templates.records.add = function( templateID, record, callback ) {
  var rec = { dns_template_record: record };
  app.talk( 'POST', 'templates/'+ templateID +'/records', rec, callback );
}

// ! templates.records.delete
// Delete record from template
app.templates.records.delete = function( templateID, recordID, callback ) {
  app.talk( 'DELETE', 'templates/'+ templateID +'/records/'+ recordID, callback );
}


// ! CONTACTS
app.contacts = {};

// ! contacts.list
app.contacts.list = function( callback ) {
  app.talk( 'GET', 'contacts', callback );
}

// ! contacts.show
app.contacts.show = function( contactID, callback ) {
  app.talk( 'GET', 'contacts/'+ contactID, callback );
}

// ! contacts.add
// http://developer.dnsimple.com/contacts/#create-a-contact
app.contacts.add = function( contact, callback ) {
  app.talk( 'POST', 'contacts', {contact: contact}, callback );
}

// ! contacts.update
// http://developer.dnsimple.com/contacts/#update-a-contact
app.contacts.update = function( contactID, contact, callback ) {
  app.talk( 'PUT', 'contacts/'+ contactID, {contact: contact}, callback );
}

// ! contacts.delete
app.contacts.delete = function( contactID, callback ) {
  app.talk( 'DELETE', 'contacts/'+ contactID, callback );
}


// ! ACCOUNT

// ! .subscription
app.subscription = function( vars, callback ) {
  if( ! callback ) {
    app.talk( 'GET', 'subscription', vars );
  } else {
    var data = {subscription: vars};
    app.talk( 'PUT', 'subscription', data, callback );
  }
}


// ! OTHER

// ! .prices
app.prices = function( callback ) {
  app.talk( 'GET', 'prices', callback );
}

// ! .user
app.user = function( user, callback ) {
  var user = {user: user};
  app.talk( 'POST', 'users', user, callback );
}

// ! .extendedAttributes
app.extendedAttributes = function( tld, callback ) {
  app.talk( 'GET', 'extended_attributes/'+ tld, callback );
}


// MODULE

// ! - Communicate
app.talk = function( method, path, fields, callback ) {
  if( !callback && typeof fields === 'function' ) {
    var callback = fields;
    var fields = {};
  }

  // prevent multiple callbacks
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
          data.map( function( cur, i, arr ) { arr[i] = cur[ keys[0] ] });
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
  if( ! (app.api.email && app.api.token) && ! (app.api.email && app.api.password) && ! app.api.domainToken && ! app.api.twoFactorToken ) {
    doCallback( new Error('credentials missing') );
    return;
  }

  // prepare
  var querystr = JSON.stringify(fields)
  var headers = {
    'Accept': 'application/json',
    'User-Agent': 'Nodejs-DNSimple'
  };

  // token in headers
  if( app.api.token ) {
    headers['X-DNSimple-Token'] = app.api.email +':'+ app.api.token;
  }

  if( app.api.domainToken ) {
    headers['X-DNSimple-Domain-Token'] = app.api.domainToken;
  }

  // build request
  if( method.match( /(POST|PUT|DELETE)/ ) ) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = querystr.length;
  }

  var options = {
    host: app.api.hostname,
    port: 443,
    path: '/v1/'+ path,
    method: method,
    headers: headers
  };

  // password authentication
  if( ! app.api.twoFactorToken && ! app.api.token && ! app.api.domainToken && app.api.password && app.api.email ) {
    options.auth = app.api.email +':'+ app.api.password;

    // two-factor authentication (2FA)
    if( app.api.twoFactorOTP ) {
      headers['X-DNSimple-2FA-Strict'] = 1;
      headers['X-DNSimple-OTP'] = app.api.twoFactorOTP;
    }
  }

  if( app.api.twoFactorToken ) {
    options.auth = app.api.twoFactorToken +':x-2fa-basic';
    headers['X-DNSimple-2FA-Strict'] = 1;
  }

  // start request
  var request = https.request( options );

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

      // status ok, no data
      if( data == '' && meta.statusCode < 300 ) {
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
        if( response.statusCode == 401 && response.headers['x-dnsimple-otp'] == 'required' ) {
          var error = new Error('twoFactorOTP required');
        } else {
          var error = failed || new Error('API error');
        }
        error.code = response.statusCode;
        error.error = data.message
          || data.error
          || (data.errors && data instanceof Object && Object.keys(data.errors)[0] ? data.errors[ Object.keys(data.errors)[0] ] : null)
          || null;
        error.data = data;
        doCallback( error, null, meta );
      }
    });
  });

  // timeout
  request.on( 'socket', function( socket ) {
    if( app.api.timeout ) {
      socket.setTimeout( app.api.timeout );
      socket.on( 'timeout', function() {
        doCallback( new Error('request timeout') );
        request.abort();
      });
    }
  });

  // error
  request.on( 'error', function( error ) {
    if( error.code === 'ECONNRESET' ) {
      var er = new Error('request timeout');
    } else {
      var er = new Error('request failed');
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
}

// wrap it up
module.exports = function( setup ) {
  for( var i in setup ) {
    app.api[i] = setup[i];
  }
  return app;
}
