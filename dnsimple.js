/*
Name:      DNSimple module for Node.js
Source:    https://github.com/fvdm/nodejs-dnsimple
Feedback:  https://github.com/fvdm/nodejs-dnsimple/issues

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
*/

var https = require('https')

// init
var app = {}

app.api = {
	hostname:	'dnsimple.com',
	email:		'',
	token:		'',
	password:	''
}


/*
	callback: function( result, error )
	
	error false           : all good
	error 300-399         : API fail
	error 400-499         : method error
	error 500-699         : API server fail
	error "invalid json"  : API response fail
	error "request error" : can't connect to API
*/


/////////
// DNS //
/////////

app.dns = {
	
	// List DNS records for domain
	list: function( domainname, callback ) {
		app.talk( 'GET', 'domains/'+ domainname +'/records', function( records, error ) {
			if( !error ) {
				var result = {}
				for( var r in records ) {
					result[ records[r].record.id ] = records[r].record
				}
				callback( result )
			} else {
				callback( records, error )
			}
		})
	},
	
	// Show DNS record
	show: function( domainname, recordID, callback ) {
		app.talk( 'GET', 'domains/'+ domainname +'/records/'+ recordID, function( record, error ) {
			if( status.label == 'success' ) {
				callback( record.record )
			} else {
				callback( record, error )
			}
		})
	},
	
	// Create DNS record
	// REQUIRED: name, record_type, content
	// OPTIONAL: ttl, prio
	add: function( domainname, record, callback ) {
		var post = { record: record }
		app.talk( 'POST', 'domains/'+ domainname +'/records', post, function( result, error ) {
			if( status.label == 'success' ) {
				callback( result.record )
			} else {
				callback( result, error )
			}
		})
	},
	
	// Update DNS record
	update: function( domainname, recordID, record, callback ) {
		var post = { record: record }
		app.talk( 'PUT', 'domains/'+ domainname +'/records/'+ recordID, post, function( result, error ) {
			if( status.label == 'success' ) {
				callback( result.record )
			} else {
				callback( result, error )
			}
		})
	},
	
	// Delete DNS record
	delete: function( domainname, recordID, callback ) {
		app.talk( 'DELETE', 'domains/'+ domainname +'/records/'+ recordID, callback )
	}

}



/////////////
// DOMAINS //
/////////////

app.domains = {
	
	// List domains, simple returns only array with domainnames
	list: function( simple, callback ) {
		if( !callback && typeof simple === 'function' ) {
			var callback = simple
			var simple = false
		}
		
		var result = simple ? [] : {}
		
		app.talk( 'GET', 'domains', function( domains, error ) {
			if( !error ) {
				for( var d in domains ) {
					if( simple ) {
						result.push( domains[d].domain.name )
					} else {
						result[ domains[d].domain.id ] = domains[d].domain
					}
				}
				callback( result )
			} else {
				callback( domains, error )
			}
		})
	},
	
	// Find domains by regex match
	findByRegex: function( regex, callback ) {
		var result = {}
		app.domains.list( false, function( domains, error ) {
			if( status.label == 'success' ) {
				var regexp = new RegExp( regex )
				for( var d in domains ) {
					if( domains[d].name.match( regexp ) ) {
						result[ domains[d].id ] = domains[d]
					}
				}
				
				callback( result )
			} else {
				callback( domains, error )
			}
		})
	},
	
	// Show domain
	show: function( domainname, callback ) {
		app.talk( 'GET', 'domains/'+ domainname, function( domain, error ) {
			if( status.label == 'success' ) {
				callback( domain.domain )
			} else {
				callback( domain, error )
			}
		})
	},
	
	// Add domain
	add: function( domainname, callback ) {
		var dom = { domain: { name: domainname } }
		app.talk( 'POST', 'domains', dom, function( domain, error ) {
			if( status.label == 'success' ) {
				callback( domain.domain )
			} else {
				callback( domain, error )
			}
		})
	},
	
	// Delete domain
	delete: function( domainname, callback ) {
		app.talk( 'DELETE', 'domains/'+ domainname, callback )
	},
	
	
	//////////////////
	// REGISTRATION //
	//////////////////
	
	// Check availability
	check: function( domainname, callback ) {
		app.talk( 'GET', 'domains/'+ domainname +'/check', {}, callback )
	},
	
	// Register domainname - auto-payment!
	register: function( domainname, registrantID, extendedAttribute, callback ) {
		var vars = {
			domain: {
				name:		domainname,
				registrant_id:	registrantID
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
	
	// Transfer domainname - auto-payment!
	transfer: function( domainname, registrantID, authinfo, callback ) {
		var vars = {
			domain: {
				name:		domainname,
				registrant_id:	registrantID
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
			var whoisPrivacy = whoisPrivacy +''
			if( whoisPrivacy.match( /^(true|yes|1)$/i ) ) {
				vars.domain.renew_whois_privacy = 'true'
			} else if( whoisPrivate.match( /^(false|no|0)$/i ) ) {
				vars.domain.renew_whois_privacy = 'false'
			}
		}
		
		// send
		app.talk( 'POST', 'domain_renewal', vars, callback )
	},
	
	// Set auto-renewal for domain
	autorenew: function( domainname, status, callback ) {
		var status = status +''
		if( status.match( /^(true|yes|on|enable|enabled|1)$/i ) ) {
			app.talk( 'POST', 'domains/'+ domainname +'/auto_renewal', {auto_renewal:{}}, callback )
		} else if( status.match( /^(false|no|off|disable|disabled|0)$/i ) ) {
			app.talk( 'DELETE', 'domains/'+ domainname +'/auto_renewal', callback )
		}
	},
	
	// Prepare domain for transferring out
	transferout: function( domainname, callback ) {
		app.talk( 'POST', 'domains/'+ domainname +'/transfer_out', callback )
	},
	
	// Set nameservers at registry
	nameservers: function( domainname, nameservers, callback ) {
		var ns = {
			name_servers:	nameservers
		}
		app.talk( 'POST', 'domains/'+ domainname +'/name_servers', ns, callback )
	},
	
	
	//////////////
	// SERVICES //
	//////////////
	
	// Services for domain
	services: {
		
		// already applied
		list: function( domainname, callback ) {
			app.talk( 'GET', 'domains/'+ domainname +'/applied_services', function( result, error ) {
				if( !error ) {
					var services = {}
					for( var s in result ) {
						services[ result[s].service.id ] = result[s].service
					}
					callback( services )
				} else {
					callback( result, error )
				}
			})
		},
		
		// available
		available: function( domainname, callback ) {
			app.talk( 'GET', 'domains/'+ domainname +'/available_services', function( result, error ) {
				if( !error ) {
					var services = {}
					for( var s in result ) {
						services[ result[s].service.id ] = result[s].service
					}
					callback( services )
				} else {
					callback( result, error )
				}
			})
		},
		
		// apply one
		add: function( domainname, serviceID, callback ) {
			var service = { service: { id: serviceID } }
			app.talk( 'POST', 'domains/'+ domainname +'/applied_services', service, callback )
		},
		
		// delete one
		delete: function( domainname, serviceID, callback ) {
			app.talk( 'DELETE', 'domains/'+ domainname +'/applied_services/'+ serviceID, callback )
		}
	
	},
	
	
	// apply template -- alias for templates.apply
	template: function( domainname, templateID, callback ) {
		app.templates.apply( domainname, templateID, callback )
	}

}


//////////////
// SERVICES //
//////////////

app.services = {
	
	// List all supported services
	list: function( callback ) {
		app.talk( 'GET', 'services', function( list, error ) {
			if( !error ) {
				var services = {}
				for( var s in list ) {
					services[ list[s].service.id ] = list[s].service
				}
				callback( services )
			} else {
				callback( list, error )
			}
		})
	},
	
	// Get one service' details
	show: function( serviceID, callback ) {
		app.talk( 'GET', 'services/'+ serviceID, function( service, error ) {
			if( !error ) {
				callback( service.service )
			} else {
				callback( service, error )
			}
		})
	}
	
}


///////////////
// TEMPLATES //
///////////////

app.templates = {
	
	// List all of the custom templates in the account
	list: function( callback ) {
		app.talk( 'GET', 'templates', function( list, error ) {
			if( !error ) {
				var templates = {}
				for( var t in list ) {
					templates[ list[t].dns_template.id ] = list[t].dns_template
				}
				callback( templates )
			} else {
				callback( list, error )
			}
		})
	},
	
	// Get a specific template
	show: function( templateID, callback ) {
		app.talk( 'GET', 'templates/'+ templateID, function( template, error ) {
			if( !error ) {
				callback( template.dns_template )
			} else {
				callback( template, error )
			}
		})
	},
	
	// Create a custom template
	// REQUIRED: name, shortname
	// OPTIONAL: description
	add: function( template, callback ) {
		var set = { dns_template: template }
		app.talk( 'POST', 'templates', set, function( result, error ) {
			if( !error ) {
				callback( result.dns_template )
			} else {
				callback( result, error )
			}
		})
	},
	
	// Delete the given template
	delete: function( templateID, callback ) {
		app.talk( 'DELETE', 'templates/'+ templateID, callback )
	},
	
	// Apply a template to a domain
	apply: function( domainname, templateID, callback ) {
		app.talk( 'POST', 'domains/'+ domainname +'/templates/'+ templateID +'/apply', function( result, error ) {
			if( !error ) {
				callback( result )
			} else {
				callback( result )
			}
		})
	},
	
	
	// records
	records: {
		
		// list records in template
		list: function( templateID, callback ) {
			app.talk( 'GET', 'templates/'+ templateID +'/template_records', function( result, error ) {
				if( !error ) {
					var records = {}
					for( var r in result ) {
						records[ result[r].dns_template_record.id ] = result[r].dns_template_record
					}
					callback( records )
				} else {
					callback( result, error )
				}
			})
		},
		
		// Get one record for template
		show: function( templateID, recordID, callback ) {
			app.talk( 'GET', 'templates/'+ templateID +'/template_records/'+ recordID, function( result, error ) {
				if( !error ) {
					callback( result.dns_template_record )
				} else {
					callback( result, error )
				}
			})
		},
		
		// Add record to template
		// REQUIRED: name, record_type, content
		// OPTIONAL: ttl, prio
		add: function( templateID, record, callback ) {
			var rec = { dns_template_record: record }
			app.talk( 'POST', 'templates/'+ templateID +'/template_records', rec, function( result, error ) {
				if( !error ) {
					callback( result.dns_template_record )
				} else {
					callback( result, error )
				}
			})
		},
		
		// Delete record from template
		delete: function( templateID, recordID, callback ) {
			app.talk( 'DELETE', 'templates/'+ templateID +'/template_records/'+ recordID, {}, callback )
		}
		
	}

}

//////////////
// CONTACTS //
//////////////

app.contacts = {
	
	// list
	list: function( callback ) {
		app.talk( 'GET', 'contacts', callback )
	},
	
	// get one
	show: function( contactID, callback ) {
		app.talk( 'GET', 'contacts/'+ contactID, callback )
	},
	
	// create
	// http://developer.dnsimple.com/contacts/#create-a-contact
	add: function( contact, callback ) {
		app.talk( 'POST', 'contacts', {contact: contact}, callback )
	},
	
	// update
	// http://developer.dnsimple.com/contacts/#update-a-contact
	update: function( contactID, contact, callback ) {
		app.talk( 'PUT', 'contacts/'+ contactID, {contact: contact}, callback )
	},
	
	// delete
	delete: function( contactID, callback ) {
		app.talk( 'DELETE', 'contacts/'+ contactID, callback )
	}
	
}


////////////
// MODULE //
////////////

// communicate
app.talk = function( method, path, fields, callback ) {
	
	if( !callback && typeof fields === 'function' ) {
		var callback = fields
		var fields = {}
	}
	
	// prepare
	var querystr = JSON.stringify(fields)
	var headers = {
		'Accept':	'application/json',
		'User-Agent':	'Nodejs-DNSimple'
	}
	
	// token in headers
	if( app.api.token != '' ) {
		headers['X-DNSimple-Token'] = app.api.email +':'+ app.api.token
	}
	
	if( method.match( /(POST|PUT|DELETE)/ ) ) {
		headers['Content-Type']		= 'application/json'
		headers['Content-Length']	= querystr.length
	}
	
	var options = {
		host:		app.api.hostname,
		port:		443,
		path:		'/'+ path,
		method:		method,
		headers:	headers,
		agent:		false
	}
	
	// password authentication
	if( app.api.token == '' && app.api.password != '' ) {
		options.auth = app.api.email +':'+ app.api.password
	}
	
	// build request
	var req = https.request( options, function( response ) {
		
		// process response
		var data = ''
		var requestOK = [100, 200, 201, 202, 203, 204]
		
		response.on( 'data', function( chunk ) { data += chunk })
		
		// request finished
		response.on( 'end', function() {
			
			// parse JSON
			data = data.toString('utf8').trim()
			if( data.match(/^(\{.*\}|\[.*\])$/) ) {
				data = JSON.parse( data )
			} else {
				// failed, no need to continue
				callback( {}, 'invalid json' )
				return
			}
			
			// check HTTP status code
			if( response.statusCode !== undefined ) {
				for( var c = 0; c < requestOK.length; c++ ) {
					if( requestOK[c] == response.statusCode ) {
						// method ok
						callback( data )
						return
					}
				}
				
				if( response.headers.status >= 400 && response.statusCode < 500 ) {
					// method error
					callback( data, response.statusCode )
				} else {
					// API fail
					callback( {}, response.statusCode )
				}
			} else {
				// API fail
				callback( {}, 'api error' )
			}
		})
	})
	
	// error
	req.on( 'error', function( error ) {
		callback( error, 'request error' )
	})
	
	// post and close
	if( method.match( /(POST|PUT|DELETE)/ ) ) {
		req.write( querystr )
	}
	
	req.end()
	
}

// all done
module.exports = app