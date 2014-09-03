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
	password: null,
	timeout: 5000
}


// DNS

app.dns = {
	// dns.list
	list: function( domainname, callback ) {
		app.talk( 'GET', 'domains/'+ domainname +'/records', function( error, records ) {
			if( error ) { callback( error ); return }
			var result = []
			for( var i = 0; i < records.length; i++ ) {
				result.push( records[i].record )
			}
			callback( null, result )
		})
	},

	// dns.show
	show: function( domainname, recordID, callback ) {
		app.talk( 'GET', 'domains/'+ domainname +'/records/'+ recordID, function( error, record ) {
			if( error ) { callback( error ); return }
			callback( null, record.record )
		})
	},

	// dns.add
	// REQUIRED: name, record_type, content
	// OPTIONAL: ttl, prio
	add: function( domainname, record, callback ) {
		var post = { record: record }
		app.talk( 'POST', 'domains/'+ domainname +'/records', post, function( error, result ) {
			if( error ) { callback( error ); return }
			callback( null, result.record )
		})
	},

	// dns.update
	update: function( domainname, recordID, record, callback ) {
		var post = { record: record }
		app.talk( 'PUT', 'domains/'+ domainname +'/records/'+ recordID, post, function( error, result ) {
			if( error ) { callback( error ); return }
			callback( null, result.record )
		})
	},

	// dns.delete
	delete: function( domainname, recordID, callback ) {
		app.talk( 'DELETE', 'domains/'+ domainname +'/records/'+ recordID, callback )
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

    app.talk( 'GET', 'domains', function( error, domains ) {
      if( error ) { callback( error ); return }
      for( var i = 0; i < domains.length; i++ ) {
        if( simple ) {
          result.push( domains[i].domain.name )
        } else {
          result.push( domains[i].domain )
        }
      }
      callback( null, result )
    })
  },

  // domains.findByRegex
  findByRegex: function( regex, callback ) {
    var result = []
    app.domains.list( false, function( error, domains ) {
      if( error ) { callback( error ); return }
      var regexp = new RegExp( regex )
      for( var i = 0; i < domains.length; i++ ) {
        if( domains[i].name.match( regexp ) ) {
          result.push( domains[i] )
        }
      }
      callback( null, result )
    })
  },

  // domains.show
  show: function( domainname, callback ) {
    app.talk( 'GET', 'domains/'+ domainname, function( error, domain ) {
      if( error ) { callback( error ); return }
      callback( null, domain.domain )
    })
  },

  // domains.add
  add: function( domainname, callback ) {
    var dom = { domain: { name: domainname } }
    app.talk( 'POST', 'domains', dom, function( error, domain ) {
      if( error ) { callback( error ); return }
      callback( null, domain.domain )
    })
  },

  // domains.delete
  delete: function( domainname, callback ) {
    app.talk( 'DELETE', 'domains/'+ domainname, callback )
  },

  // domains.resetToken
  resetToken: function( domainname, callback ) {
    app.talk( 'POST', 'domains/'+ domainname +'/token', callback )
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
      app.talk( 'POST', 'domains/'+ domainname +'/memberships', data, callback )
    },

    // domains.memberships.delete
    delete: function( domainname, member, callback ) {
      app.talk( 'DELETE', 'domains'+ domainname +'/memberships/'+ member, callback )
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
			name_servers:	nameservers
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


	// SERVICES

	// Services for domain
	services: {
		// domains.services.list
		// already applied
		list: function( domainname, callback ) {
			app.talk( 'GET', 'domains/'+ domainname +'/applied_services', function( error, result ) {
				if( error ) { callback( error ); return }
				var services = []
				for( var i = 0; i < result.length; i++ ) {
					services.push( result[i].service )
				}
				callback( null, services )
			})
		},

		// domains.services.available
		// available
		available: function( domainname, callback ) {
			app.talk( 'GET', 'domains/'+ domainname +'/available_services', function( error, result ) {
				if( error ) { callback( error ); return }
				var services = []
				for( var i = 0; i < result.length; i++ ) {
					services.push( result[i].service )
				}
				callback( null, services )
			})
		},

		// domains.services.add
		// apply one
		add: function( domainname, serviceID, callback ) {
			var service = { service: { id: serviceID } }
			app.talk( 'POST', 'domains/'+ domainname +'/applied_services', service, callback )
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
		app.talk( 'GET', 'services', function( error, list ) {
			if( error ) { callback( error ); return }
			var services = []
			for( var i = 0; i < list.length; i++ ) {
				services.push( list[i].service )
			}
			callback( null, services )
		})
	},

	// services.show
	// Get one service' details
	show: function( serviceID, callback ) {
		app.talk( 'GET', 'services/'+ serviceID, function( error, service ) {
			if( error ) { callback( error ); return }
			callback( null, service.service )
		})
	}
}


// TEMPLATES

app.templates = {
	// templates.list
	// List all of the custom templates in the account
	list: function( callback ) {
		app.talk( 'GET', 'templates', function( error, list ) {
			if( error ) { callback( error ); return }
			var templates = []
			for( var i = 0; i < list.length; i++ ) {
				templates.push( list[i].dns_template )
			}
			callback( null, templates )
		})
	},

	// templates.show
	// Get a specific template
	show: function( templateID, callback ) {
		app.talk( 'GET', 'templates/'+ templateID, function( error, template ) {
			if( error ) { callback( error ); return }
			callback( null, template.dns_template )
		})
	},

	// templates.add
	// Create a custom template
	// REQUIRED: name, shortname
	// OPTIONAL: description
	add: function( template, callback ) {
		var set = { dns_template: template }
		app.talk( 'POST', 'templates', set, function( error, result ) {
			if( error ) { callback( error ); return }
			callback( null, result.dns_template )
		})
	},

	// templates.delete
	// Delete the given template
	delete: function( templateID, callback ) {
		app.talk( 'DELETE', 'templates/'+ templateID, callback )
	},

	// templates.apply
	// Apply a template to a domain
	apply: function( domainname, templateID, callback ) {
		app.talk( 'POST', 'domains/'+ domainname +'/templates/'+ templateID +'/apply', function( error, result ) {
			if( error ) { callback( error ); return }
			callback( null, result )
		})
	},

	// records
	records: {
		// templates.records.list
		// list records in template
		list: function( templateID, callback ) {
			app.talk( 'GET', 'templates/'+ templateID +'/template_records', function( error, result ) {
				if( error ) { callback( error ); return }
				var records = []
				for( var i = 0; i < result.length; i++ ) {
					records.push( result[i].dns_template_record )
				}
				callback( null, records )
			})
		},

		// templates.records.show
		// Get one record for template
		show: function( templateID, recordID, callback ) {
			app.talk( 'GET', 'templates/'+ templateID +'/template_records/'+ recordID, function( error, result ) {
				if( error ) { callback( error ); return }
				callback( null, result.dns_template_record )
			})
		},

		// templates.records.add
		// Add record to template
		// REQUIRED: name, record_type, content
		// OPTIONAL: ttl, prio
		add: function( templateID, record, callback ) {
			var rec = { dns_template_record: record }
			app.talk( 'POST', 'templates/'+ templateID +'/template_records', rec, function( error, result ) {
				if( error ) { callback( error ); return }
				callback( null, result.dns_template_record )
			})
		},

		// templates.records.delete
		// Delete record from template
		delete: function( templateID, recordID, callback ) {
			app.talk( 'DELETE', 'templates/'+ templateID +'/template_records/'+ recordID, {}, callback )
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
		app.talk( 'POST', 'contacts', {contact: contact}, callback )
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
		app.talk( 'GET', 'subscription', function( err, data ) {
			if( err ) { vars( err ); return }
			vars( null, data.subscription )
		})
	} else {
		var data = {subscription: vars}
		app.talk( 'PUT', 'subscription', data, function( err, res ) {
			if( err ) { callback( err ); return }
			callback( null, res.subscription )
		})
	}
}

app.statements = function( callback ) {
	app.talk( 'GET', 'statements', function( err, data ) {
		if( err ) { callback( err ); return }
		var result = []
		if( typeof data === 'object' ) {
			for( var i = 0; i < data.length; i++ ) {
				result.push( data[i].statement )
			}
		}
		callback( null, result )
	})
}


// OTHER

app.prices = function( callback ) {
	app.talk( 'GET', 'prices', function( err, data ) {
		if( err ) { callback( err ); return }
		var result = []
		if( typeof data === 'object' ) {
			for( var i = 0; i < data.length; i++ ) {
				result.push( data[i].price )
			}
		}
		callback( null, result )
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
	function doCallback( err, res ) {
		if( !complete ) {
			complete = true
			callback( err || null, res || null )
		}
	}

	// credentials set?
	if( ! (app.api.email && app.api.token) && ! (app.api.email && app.api.password) && ! app.api.domainToken ) {
		doCallback( new Error('credentials missing') )
		return
	}

	// prepare
	var querystr = JSON.stringify(fields)
	var headers = {
		'Accept': 'application/json',
		'User-Agent': 'Nodejs-DNSimple'
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
	if( ! app.api.token && ! app.api.domainToken && app.api.password && app.api.email ) {
		options.auth = app.api.email +':'+ app.api.password
	}

	// start request
	var request = https.request( options )

	// response
	request.on( 'response', function( response ) {
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

			try {
				data = JSON.parse( data )
			} catch(e) {
				if( typeof data === 'string' && data.indexOf('<h1>The Domain Already Exists</h1>') > -1 ) {
					failed = new Error('domain exists')
				} else {
					failed = new Error('not json')
				}
			}

			// check HTTP status code
			if( ! failed && response.statusCode < 300 ) {
				doCallback( null, data )
			} else {
				var error = failed || new Error('API error')
				error.code = response.statusCode
				error.error = data.message || data.error || data.errors.name[0] || null
				error.data = data
				doCallback( error )
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
