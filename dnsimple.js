/*
Name:          DNSimple module for Node.js
Source:        https://github.com/fvdm/nodejs-dnsimple
Feedback:      https://github.com/fvdm/nodejs-dnsimple/issues
License:       Unlicense (public domain)
               see UNLICENSE file

Service name:  DNSimple
Service URL:   https://dnsimple.com
Service API:   http://developer.dnsimple.com
*/

var https = require('https')

// init
var app = {}

app.api = {
  hostname: 'api.dnsimple.com',
  email: null,
  token: null,
  domainToken: null,
  twoFactorOTP: null,   // one time password (ie. Authy)
  twoFactorToken: null, // OTP exchange token
  password: null,
  timeout: 5000
}


// DNS

app.dns = {
  // dns.list
  list: function( domainname, callback ) {
    app.talk( 'GET', 'domains/'+ domainname +'/records', function( error, records, meta ) {
      if( error ) { callback( error, null, meta ); return }
      var result = []
      for( var i = 0; i < records.length; i++ ) {
        result.push( records[i].record )
      }
      callback( null, result, meta )
    })
  },

  // dns.show
  show: function( domainname, recordID, callback ) {
    app.talk( 'GET', 'domains/'+ domainname +'/records/'+ recordID, function( error, record, meta ) {
      if( error ) { callback( error, null, meta ); return }
      callback( null, record.record, meta )
    })
  },

  // dns.add
  // REQUIRED: name, record_type, content
  // OPTIONAL: ttl, prio
  add: function( domainname, record, callback ) {
    var post = { record: record }
    app.talk( 'POST', 'domains/'+ domainname +'/records', post, function( error, result, meta ) {
      if( error ) { callback( error, null, meta ); return }
      callback( null, result.record, meta )
    })
  },

  // dns.update
  update: function( domainname, recordID, record, callback ) {
    var post = { record: record }
    app.talk( 'PUT', 'domains/'+ domainname +'/records/'+ recordID, post, function( error, result, meta ) {
      if( error ) { callback( error, null, meta ); return }
      callback( null, result.record, meta )
    })
  },

  // dns.delete
  delete: function( domainname, recordID, callback ) {
    app.talk( 'DELETE', 'domains/'+ domainname +'/records/'+ recordID, function( err, data, meta ) {
      callback( err, meta.statusCode === 200, meta )
    })
  }
}


// DOMAINS

app.domains = {

  // domains.list
  // Simple returns only array with domainnames
  list: function( simple, callback ) {
    if( !callback && typeof simple === 'function' ) {
      var callback = simple
      var simple = false
    }

    var result = []

    app.talk( 'GET', 'domains', function( error, domains, meta ) {
      if( error ) { callback( error, null, meta ); return }
      for( var i = 0; i < domains.length; i++ ) {
        if( simple ) {
          result.push( domains[i].domain.name )
        } else {
          result.push( domains[i].domain )
        }
      }
      callback( null, result, meta )
    })
  },

  // domains.findByRegex
  findByRegex: function( regex, callback ) {
    var result = []
    app.domains.list( false, function( error, domains, meta ) {
      if( error ) { callback( error, null, meta ); return }
      var regexp = new RegExp( regex )
      for( var i = 0; i < domains.length; i++ ) {
        if( domains[i].name.match( regexp ) ) {
          result.push( domains[i] )
        }
      }
      callback( null, result, meta )
    })
  },

  // domains.show
  show: function( domainname, callback ) {
    app.talk( 'GET', 'domains/'+ domainname, function( error, domain, meta ) {
      if( error ) { callback( error, null, meta ); return }
      callback( null, domain.domain, meta )
    })
  },

  // domains.add
  add: function( domainname, callback ) {
    var dom = { domain: { name: domainname } }
    app.talk( 'POST', 'domains', dom, function( error, domain, meta ) {
      if( error ) { callback( error, null, meta ); return }
      callback( null, domain.domain, meta )
    })
  },

  // domains.delete
  delete: function( domainname, callback ) {
    app.talk( 'DELETE', 'domains/'+ domainname, function( err, data, meta ) {
      callback( err, meta.statusCode === 200, meta )
    })
  },

  // domains.resetToken
  resetToken: function( domainname, callback ) {
    app.talk( 'POST', 'domains/'+ domainname +'/token', function( err, data, meta ) {
      callback( err, data.domain || null, meta )
    })
  },

  // domains.push
  push: function( domainname, email, regId, callback ) {
    var data = { push: {
      new_user_email: email,
      contact_id: regId
    }}
    app.talk( 'POST', 'domains/'+ domainname +'/push', data, callback )
  },

  // domains.vanitynameservers
  vanitynameservers: function( domainname, enable, callback ) {
    if( enable ) {
      app.talk( 'POST', 'domains/'+ domainname +'/vanity_name_servers', {auto_renewal:{}}, callback )
    } else {
      app.talk( 'DELETE', 'domains/'+ domainname +'/vanity_name_servers', callback )
    }
  },


  // MEMBERSHIPS

  memberships: {
    // domains.memberships.list
    list: function( domainname, callback ) {
      app.talk( 'GET', 'domains/'+ domainname +'/memberships', callback )
    },

    // domains.memberships.add
    add: function( domainname, email, callback ) {
      var data = {membership: {email: email}}
      app.talk( 'POST', 'domains/'+ domainname +'/memberships', data, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        data = data.membership || false
        callback( null, data, meta )
      })
    },

    // domains.memberships.delete
    delete: function( domainname, member, callback ) {
      app.talk( 'DELETE', 'domains/'+ domainname +'/memberships/'+ member, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        data = meta.statusCode === 204 ? true : false
        callback( null, data, meta )
      })
    }
  },


  // REGISTRATION

  // domains.check
  // Check availability
  check: function( domainname, callback ) {
    app.talk( 'GET', 'domains/'+ domainname +'/check', {}, callback )
  },

  // domains.register
  // Register domainname - auto-payment!
  register: function( domainname, registrantID, extendedAttribute, callback ) {
    var vars = {
      domain: {
        name: domainname,
        registrant_id: registrantID
      }
    }

    // fix 3 & 4 params
    if( !callback && typeof extendedAttribute == 'function' ) {
      var callback = extendedAttribute
    } else if( typeof extendedAttribute == 'object' ) {
      vars.domain.extended_attribute = extendedAttribute
    }

    // send
    app.talk( 'POST', 'domain_registrations', vars, callback )
  },

  // domains.transfer
  // Transfer domainname - auto-payment!
  transfer: function( domainname, registrantID, authinfo, callback ) {
    var vars = {
      domain: {
        name: domainname,
        registrant_id: registrantID
      }
    }

    // fix 3 & 4 params
    if( !callback && typeof authinfo == 'function' ) {
      var callback = authinfo
    } else if( typeof authinfo == 'string' ) {
      vars.transfer_order = {
        authinfo: authinfo
      }
    }

    // send
    app.talk( 'POST', 'domain_transfers', vars, callback )
  },

  // domains.renew
  // Renew domainname registration - auto-payment!
  renew: function( domainname, whoisPrivacy, callback ) {
    var vars = {
      domain: {
        name: domainname
      }
    }

    // fix 2 & 3 params
    if( !callback && typeof whoisPrivacy == 'function' ) {
      var callback = whoisPrivacy
    } else {
      // string matching
      if( whoisPrivacy ) {
        vars.domain.renew_whois_privacy = 'true'
      } else {
        vars.domain.renew_whois_privacy = 'false'
      }
    }

    // send
    app.talk( 'POST', 'domain_renewal', vars, callback )
  },

  // domains.autorenew
  // Set auto-renewal for domain
  autorenew: function( domainname, enable, callback ) {
    if( enable ) {
      app.talk( 'POST', 'domains/'+ domainname +'/auto_renewal', {auto_renewal:{}}, callback )
    } else {
      app.talk( 'DELETE', 'domains/'+ domainname +'/auto_renewal', callback )
    }
  },

  // domains.transferout
  // Prepare domain for transferring out
  transferout: function( domainname, callback ) {
    app.talk( 'POST', 'domains/'+ domainname +'/transfer_out', callback )
  },

  // domains.nameservers
  // Set nameservers at registry
  nameservers: function( domainname, nameservers, callback ) {
    var ns = {
      name_servers: nameservers
    }
    app.talk( 'POST', 'domains/'+ domainname +'/name_servers', ns, callback )
  },

  // domains.whoisPrivacy
  whoisPrivacy: function( domainname, enable, callback ) {
    if( enable ) {
      app.talk( 'POST', 'domains/'+ domainname +'/whois_privacy', callback )
    } else {
      app.talk( 'DELETE', 'domains/'+ domainname +'/whois_privacy', callback )
    }
  },
  
  // domains.nameserver_register
  nameserver_register: function( domainname, name, ip, callback ) {
    var vars = {
      name: name,
      ip: ip
    }
    app.talk( 'POST', 'domains/'+ domainname +'/registry_name_servers', vars, callback )
  },
  
  // domains.nameserver_deregister
  nameserver_deregister: function( domainname, name, callback ) {
    app.talk( 'DELETE', 'domains/'+ domainname +'/registry_name_servers/'+ name, vars, callback )
  },
  
  // domains.zone
  zone: function( domainname, zone, callback ) {
    if( typeof zone === 'function' ) {
      app.talk( 'GET', 'domains/'+ domainname +'/zone', function( err, data, meta ) {
        if( err ) { return zone( err, null, meta )}
        zone( null, data, meta )
      })
    } else {
      var zone = {zone_import: {zone_data: zone}}
      app.talk( 'POST', 'domains/'+ domainname +'/zone_imports', zone, function( err, data, meta ) {
        data = data.zone_import || false
        if( err ) { return callback( err, null, meta )}
        callback( null, data, meta )
      })
    }
  },


  // SERVICES

  // Services for domain
  services: {
    // domains.services.list
    // already applied
    list: function( domainname, callback ) {
      app.talk( 'GET', 'domains/'+ domainname +'/applied_services', function( error, result, meta ) {
        if( error ) { callback( error, null, meta ); return }
        var services = []
        for( var i = 0; i < result.length; i++ ) {
          services.push( result[i].service )
        }
        callback( null, services, meta )
      })
    },

    // domains.services.available
    // available
    available: function( domainname, callback ) {
      app.talk( 'GET', 'domains/'+ domainname +'/available_services', function( error, result, meta ) {
        if( error ) { callback( error, null, meta ); return }
        var services = []
        for( var i = 0; i < result.length; i++ ) {
          services.push( result[i].service )
        }
        callback( null, services, meta )
      })
    },

    // domains.services.add
    // apply one
    add: function( domainname, serviceID, settings, callback ) {
      if( typeof settings === 'function' ) {
        var callback = settings
        var settings = null
      }
      var service = { service: { id: serviceID } }
      if( settings ) {
        service.settings = settings
      }
      app.talk( 'POST', 'domains/'+ domainname +'/applied_services', service, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        data = data[0] && data[0].service ? data[0].service : false
        callback( null, data, meta )
      })
    },

    // domains.services.delete
    // delete one
    delete: function( domainname, serviceID, callback ) {
      app.talk( 'DELETE', 'domains/'+ domainname +'/applied_services/'+ serviceID, callback )
    }
  },

  // domains.template
  // apply template -- alias for templates.apply
  template: function( domainname, templateID, callback ) {
    app.templates.apply( domainname, templateID, callback )
  }
}


// SERVICES

app.services = {
  // services.list
  // List all supported services
  list: function( callback ) {
    app.talk( 'GET', 'services', function( error, list, meta ) {
      if( error ) { callback( error, null, meta ); return }
      var services = []
      for( var i = 0; i < list.length; i++ ) {
        services.push( list[i].service )
      }
      callback( null, services, meta )
    })
  },

  // services.show
  // Get one service' details
  show: function( serviceID, callback ) {
    app.talk( 'GET', 'services/'+ serviceID, function( error, service, meta ) {
      if( error ) { callback( error, null, meta ); return }
      callback( null, service.service, meta )
    })
  }
}


// TEMPLATES

app.templates = {
  // templates.list
  // List all of the custom templates in the account
  list: function( callback ) {
    app.talk( 'GET', 'templates', function( error, list, meta ) {
      if( error ) { callback( error, null, meta ); return }
      var templates = []
      for( var i = 0; i < list.length; i++ ) {
        templates.push( list[i].dns_template )
      }
      callback( null, templates, meta )
    })
  },

  // templates.show
  // Get a specific template
  show: function( templateID, callback ) {
    app.talk( 'GET', 'templates/'+ templateID, function( error, template, meta ) {
      if( error ) { callback( error, null, meta ); return }
      callback( null, template.dns_template, meta )
    })
  },

  // templates.add
  // Create a custom template
  // REQUIRED: name, shortname
  // OPTIONAL: description
  add: function( template, callback ) {
    var set = { dns_template: template }
    app.talk( 'POST', 'templates', set, function( error, result, meta ) {
      if( error ) { callback( error, null, meta ); return }
      callback( null, result.dns_template, meta )
    })
  },

  // templates.delete
  // Delete the given template
  delete: function( templateID, callback ) {
    app.talk( 'DELETE', 'templates/'+ templateID, function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      data = meta.statusCode === 200 ? true : false
      callback( null, data, meta )
    })
  },

  // templates.apply
  // Apply a template to a domain
  apply: function( domainname, templateID, callback ) {
    app.talk( 'POST', 'domains/'+ domainname +'/templates/'+ templateID +'/apply', function( error, result, meta ) {
      if( error ) { callback( error, null, meta ); return }
      var result = result.domain ? result.domain : result
      callback( null, result, meta )
    })
  },

  // records
  records: {
    // templates.records.list
    // list records in template
    list: function( templateID, callback ) {
      app.talk( 'GET', 'templates/'+ templateID +'/records', function( error, result, meta ) {
        if( error ) { callback( error, null, meta ); return }
        var records = []
        for( var i = 0; i < result.length; i++ ) {
          records.push( result[i].dns_template_record )
        }
        callback( null, records, meta )
      })
    },

    // templates.records.show
    // Get one record for template
    show: function( templateID, recordID, callback ) {
      app.talk( 'GET', 'templates/'+ templateID +'/records/'+ recordID, function( error, result, meta ) {
        if( error ) { callback( error, null, meta ); return }
        callback( null, result.dns_template_record, meta )
      })
    },

    // templates.records.add
    // Add record to template
    // REQUIRED: name, record_type, content
    // OPTIONAL: ttl, prio
    add: function( templateID, record, callback ) {
      var rec = { dns_template_record: record }
      app.talk( 'POST', 'templates/'+ templateID +'/records', rec, function( error, result, meta ) {
        if( error ) { callback( error, null, meta ); return }
        callback( null, result.dns_template_record, meta )
      })
    },

    // templates.records.delete
    // Delete record from template
    delete: function( templateID, recordID, callback ) {
      app.talk( 'DELETE', 'templates/'+ templateID +'/records/'+ recordID, {}, function( err, data, meta ) {
        if( err ) { return callback( err, null, meta )}
        data = meta.statusCode === 200 ? true : false
        callback( null, data, meta )
      })
    }
  }
}


// CONTACTS

app.contacts = {
  // contacts.list
  list: function( callback ) {
    app.talk( 'GET', 'contacts', callback )
  },

  // contacts.show
  show: function( contactID, callback ) {
    app.talk( 'GET', 'contacts/'+ contactID, callback )
  },

  // contacts.create
  // http://developer.dnsimple.com/contacts/#create-a-contact
  add: function( contact, callback ) {
    app.talk( 'POST', 'contacts', {contact: contact}, function( err, data, meta ) {
      if( err ) { return callback( err, null, meta )}
      data = data.contact || false
      callback( null, data, meta )
    })
  },

  // contacts.update
  // http://developer.dnsimple.com/contacts/#update-a-contact
  update: function( contactID, contact, callback ) {
    app.talk( 'PUT', 'contacts/'+ contactID, {contact: contact}, callback )
  },

  // contacts.delete
  delete: function( contactID, callback ) {
    app.talk( 'DELETE', 'contacts/'+ contactID, callback )
  }
}


// ACCOUNT

app.subscription = function( vars, callback ) {
  if( ! callback ) {
    app.talk( 'GET', 'subscription', function( err, data, meta ) {
      if( err ) { vars( err, null, meta ); return }
      vars( null, data.subscription, meta )
    })
  } else {
    var data = {subscription: vars}
    app.talk( 'PUT', 'subscription', data, function( err, res, meta ) {
      if( err ) { callback( err, null, meta ); return }
      callback( null, res.subscription, meta )
    })
  }
}


// OTHER

app.prices = function( callback ) {
  app.talk( 'GET', 'prices', function( err, data, meta ) {
    if( err ) { callback( err, null, meta ); return }
    var result = []
    if( typeof data === 'object' ) {
      for( var i = 0; i < data.length; i++ ) {
        result.push( data[i].price )
      }
    }
    callback( null, result, meta )
  })
}

app.user = function( user, callback ) {
  var user = {user: user}
  app.talk( 'POST', 'users', user, function( err, data, meta ) {
    if( err ) { return callback( err, null, meta ) }
    var data = data.user || false
    callback( null, data, meta )
  })
}


// MODULE

// communicate
app.talk = function( method, path, fields, callback ) {
  if( !callback && typeof fields === 'function' ) {
    var callback = fields
    var fields = {}
  }

  // prevent multiple callbacks
  var complete = false
  function doCallback( err, res, meta ) {
    if( !complete ) {
      complete = true
      callback( err || null, res || null, meta )
    }
  }

  // credentials set?
  if( ! (app.api.email && app.api.token) && ! (app.api.email && app.api.password) && ! app.api.domainToken && ! app.api.twoFactorToken ) {
    doCallback( new Error('credentials missing') )
    return
  }

  // prepare
  var querystr = JSON.stringify(fields)
  var headers = {
    'Accept': 'application/json',
    'User-Agent': 'Nodejs-DNSimple'
  }
  
  // Plain text
  if( path.match(/\/zone$/) ) {
    headers.Accept = 'text/plain'
  }

  // token in headers
  if( app.api.token ) {
    headers['X-DNSimple-Token'] = app.api.email +':'+ app.api.token
  }

  if( app.api.domainToken ) {
    headers['X-DNSimple-Domain-Token'] = app.api.domainToken
  }

  // build request
  if( method.match( /(POST|PUT|DELETE)/ ) ) {
    headers['Content-Type'] = 'application/json'
    headers['Content-Length'] = querystr.length
  }

  var options = {
    host: app.api.hostname,
    port: 443,
    path: '/v1/'+ path,
    method: method,
    headers: headers
  }

  // password authentication
  if( ! app.api.twoFactorToken && ! app.api.token && ! app.api.domainToken && app.api.password && app.api.email ) {
    options.auth = app.api.email +':'+ app.api.password

    // two-factor authentication (2FA)
    if( app.api.twoFactorOTP ) {
      headers['X-DNSimple-2FA-Strict'] = 1
      headers['X-DNSimple-OTP'] = app.api.twoFactorOTP
    }
  }

  if( app.api.twoFactorToken ) {
    options.auth = app.api.twoFactorToken +':x-2fa-basic'
    headers['X-DNSimple-2FA-Strict'] = 1
  }

  // start request
  var request = https.request( options )

  // response
  request.on( 'response', function( response ) {
    var meta = {statusCode: null}
    var data = ''

    response.on( 'data', function( chunk ) {
      data += chunk
    })

    response.on( 'close', function() {
      doCallback( new Error('connection dropped') )
    })

    // request finished
    response.on( 'end', function() {
      data = data.toString('utf8').trim()
      var failed = null

      meta.statusCode = response.statusCode
      meta.request_id = response.headers['x-request-id']
      meta.runtime = response.headers['x-runtime']

      if( typeof response.headers['x-dnsimple-otp-token'] === 'string' ) {
        meta.twoFactorToken = response.headers['x-dnsimple-otp-token']
      }

      try {
        data = JSON.parse( data )
      } catch(e) {
        if( typeof data === 'string' && data.indexOf('<h1>The Domain Already Exists</h1>') > -1 ) {
          failed = new Error('domain exists')
        } else if( typeof data === 'string' && headers.Accept == 'text/plain' ) {
          // data = data
        } else if( data == '' && meta.statusCode < 300 ) {
          // status ok, no data
        } else {
          failed = new Error('not json')
        }
      }

      // check HTTP status code
      if( ! failed && response.statusCode < 300 ) {
        doCallback( null, data, meta )
      } else {
        if( response.statusCode == 401 && response.headers['x-dnsimple-otp'] == 'required' ) {
          var error = new Error('twoFactorOTP required')
        } else {
          var error = failed || new Error('API error')
        }
        error.code = response.statusCode
        error.error = data.message
          || data.error
          || (data.errors && data.errors.name && data.errors.name[0] ? data.errors.name[0] : null)
          || (data.errors && data.errors.content && data.errors.content[0] ? data.errors.content[0] : null)
          || (data.errors && data.errors.base && data.errors.base[0] ? data.errors.base[0] : null)
          || null
        error.data = data
        doCallback( error, null, meta )
      }
    })
  })

  // timeout
  request.on( 'socket', function( socket ) {
    if( app.api.timeout ) {
      socket.setTimeout( app.api.timeout )
      socket.on( 'timeout', function() {
        request.abort()
      })
    }
  })

  // error
  request.on( 'error', function( error ) {
    if( error.code === 'ECONNRESET' ) {
      var er = new Error('request timeout')
    } else {
      var er = new Error('request failed')
    }
    er.error = error
    doCallback( er )
  })

  // run it
  if( method.match( /(POST|PUT|DELETE)/ ) ) {
    request.end( querystr )
  } else {
    request.end()
  }
}

// wrap it up
module.exports = function( setup ) {
  for( var i in setup ) {
    app.api[ i ] = setup[ i ]
  }
  return app
}
