var util = require('util')

// Setup
// set env DNSIMPLE_EMAIL and DNSIMPLE_TOKEN (Travis CI)
// or use cli arguments: npm test --dnsemail=me@some.where --dnstoken=abc123
var acc = {
  hostname: process.env.npm_config_dnshostname || process.env.DNSIMPLE_HOSTNAME || 'api.sandbox.dnsimple.com',
  timeout: process.env.npm_config_dnstimeout || process.env.DNSIMPLE_TIMEOUT || null,
  email: process.env.npm_config_dnsemail || process.env.DNSIMPLE_EMAIL || null
}

var token = process.env.npm_config_dnstoken || process.env.DNSIMPLE_TOKEN || null
var pass = process.env.npm_config_dnspass || process.env.DNSIMPLE_PASS || null
var otp = process.env.npm_config_dnsotp || process.env.DNSIMPLE_OTP || null

if( pass && otp ) {
  acc.password = pass
  acc.twoFactorOTP = otp
} else if( token ) {
  acc.token = token
}

var ds = require('./')( acc )

// handle exits
var errors = 0
process.on( 'exit', function() {
  if( errors == 0 ) {
    console.log('\n\033[1mDONE, no errors.\033[0m\n')
    process.exit(0)
  } else {
    console.log('\n\033[1mFAIL, '+ errors +' error'+ (errors > 1 ? 's' : '') +' occurred!\033[0m\n')
    process.exit(1)
  }
})

// prevent errors from killing the process
process.on( 'uncaughtException', function( err ) {
  console.log()
  console.error( err.stack )
  console.trace()
  console.log()
  errors++
})

// Queue to prevent flooding
var queue = []
var next = 0

function doNext() {
  next++
  if( queue[next] ) {
    queue[next]()
  }
}

// doTest( passErr, 'methods', [
//   ['feeds', typeof feeds === 'object']
// ])
function doTest( err, label, tests ) {
  if( err instanceof Error ) {
    console.error( label +': \033[1m\033[31mERROR\033[0m\n' )
    console.error( util.inspect(err, false, 10, true) )
    console.log()
    console.error( err.stack )
    console.log()
    errors++
  } else {
    var testErrors = []
    tests.forEach( function( test ) {
      if( test[1] !== true ) {
        testErrors.push(test[0])
        errors++
      }
    })

    if( testErrors.length == 0 ) {
      console.log( label +': \033[1m\033[32mok\033[0m' )
    } else {
      console.error( label +': \033[1m\033[31mfailed\033[0m ('+ testErrors.join(', ') +')' )
    }
  }

  doNext()
}

// First check API access
queue.push( function() {
  ds.talk('GET', 'prices', function(err, data) {
    if(err) {
      console.log('API access: failed ('+ err.message +')')
      console.log(err.stack)
      errors++
      process.exit(1)
    } else {
      console.log('API access: \033[1m\033[32mok\033[0m')
      doNext()
    }
  })
})

// Real world tests
function testArrObj( src ) {
  return [
    ['data type', src && src instanceof Array],
    ['item type', src && src[0] && src[0] instanceof Object]
  ]
}

function testObj( src ) {
  return [
    ['data type', src && typeof src === 'object']
  ]
}

// bogus material to use
var bogus = {
  domain: {
    name: 'test-'+ Date.now() +'-delete.me'
  },
  dns: [
    { name: 'testing',
      record_type: 'A',
      content: '127.0.0.1',
      ttl: 86400
    },
    { name: 'testing',
      record_type: 'MX',
      content: 'localhost',
      prio: 10
    }
  ],
  contact: {
    first_name: 'John',
    last_name: 'Smith',
    address1: '1000 SW 1st Street',
    city: 'Miami',
    state_province: 'FL',
    postal_code: '33143',
    country: 'US',
    email_address: 'john.smith@example.com',
    phone: '+15051112222',
    organization_name: 'Little Co Inc.',
    job_title: 'President',
    label: 'Office'
  },
  template: {
    name: 'Test dnsimple.js - '+ Date.now(),
    short_name: 'test_'+ Date.now(),
    description: 'Add fake DNS records.'
  }
}

queue.push( function() {
  ds.prices( function( err, data ) { doTest( err, 'prices', testArrObj(data) )})
})

// ! account
queue.push( function() {
  ds.subscription( function( err, data ) { doTest( err, 'subscription', testObj(data) )})
})

// ! extendedAttributes
queue.push( function() {
  ds.extendedAttributes( 'uk', function( err, data, meta ) {
    doTest( err, 'extendedAttributes', testArrObj( data ))
  })
})

// ! domains.add
queue.push( function() {
  ds.domains.add( bogus.domain.name, function( err, data ) {
    bogus.domain = data
    doTest( err, 'domains.add', testObj(data) )
  })
})

// ! domains.show
queue.push( function() {
  ds.domains.show( bogus.domain.name, function( err, data ) {
    doTest( err, 'domains.show', [
      ['type', data instanceof Object],
      ['value', data.name === bogus.domain.name]
    ])
  })
})

// ! domains.resetToken
queue.push( function() {
  ds.domains.resetToken( bogus.domain.name, function( err, data ) {
    doTest( err, 'domains.resetToken', [
      ['type', data instanceof Object],
      ['property', typeof data.token === 'string'],
      ['token', data.token != bogus.domain.name.token]
    ])
  })
})

// ! domains.list full
queue.push( function() {
  ds.domains.list( function( err, data ) {
    doTest( err, 'domains.list full', testArrObj(data) )
  })
})

// ! domains.list simple
queue.push( function() {
  ds.domains.list( true, function( err, data ) { doTest( err, 'domains.list simple', [
    ['data type', data instanceof Array]
  ])})
})

// ! domains.findByRegex
queue.push( function() {
  ds.domains.findByRegex( /\.me$/, function( err, data ) {
    doTest( err, 'domains.findByRegex', testArrObj(data) )
  })
})

// ! dns.add
queue.push( function() {
  ds.dns.add( bogus.domain.name, bogus.dns[0], function( err, data ) {
    bogus.dns[0].id = data.id
    doTest( err, 'dns.add', testObj(data))
  })
})

// ! dns.show
queue.push( function() {
  ds.dns.show( bogus.domain.name, bogus.dns[0].id, function( err, data ) {
    doTest( err, 'dns.show', [
      ['type', data instanceof Object],
      ['property', data.id === bogus.dns[0].id]
    ])
  })
})

// ! dns.update
queue.push( function() {
  ds.dns.update( bogus.domain.name, bogus.dns[0].id, {ttl:1000}, function( err, data, meta ) {
    doTest( err, 'dns.update', [
      ['result', meta.statusCode === 200]
    ])
  })
})

// ! domains.zone - get
queue.push( function() {
  ds.domains.zone( bogus.domain.name, function( err, data, meta ) {
    bogus.domain_zone = data
    doTest( err, 'domains.zone get', [
      ['data type', typeof data === 'string'],
      ['data match', !!~data.indexOf('\$ORIGIN '+ bogus.domain.name +'\.')]
    ])
  })
})

// ! domains.zone - import
queue.push( function() {
  ds.domains.zone( bogus.domain.name, bogus.domain_zone, function( err, data, meta ) {
    doTest( err, 'domains.zone import', [
      ['result', meta.statusCode === 201],
      ['data type', data instanceof Object],
      ['record', data.imported_records && data.imported_records[0].ttl === 1000]
    ])
  })
})

// ! dns.list
queue.push( function() {
  ds.dns.list( bogus.domain.name, function( err, data ) {
    doTest( err, 'dns.list', testArrObj(data))
  })
})

// ! dns.delete
queue.push( function() {
  ds.dns.delete( bogus.domain.name, bogus.dns[0].id, function( err, data, meta ) {
    doTest( err, 'dns.delete', [
      ['data type', typeof data === 'boolean'],
      ['data value', data === true]
    ])
  })
})

// ! domains.memberships.add
queue.push( function() {
  ds.domains.memberships.add( bogus.domain.name, 'nodejs.test.account@frankl.in', function( err, data, meta ) {
    bogus.domain_membership = data
    doTest( err, 'domains.memberships.add', [
      ['result', meta.statusCode === 201],
      ['data type', data instanceof Object],
      ['value', data.domain_id === bogus.domain.id]
    ])
  })
})

// ! domains.memberships.list
queue.push( function() {
  ds.domains.memberships.list( bogus.domain.name, function( err, data, meta ) {
    doTest( err, 'domains.memberships.list', [
      ['data type', meta.statusCode === 200 && data instanceof Array]
    ])
  })
})

// ! domains.memberships.delete
queue.push( function() {
  ds.domains.memberships.delete( bogus.domain.name, bogus.domain_membership.id, function( err, data, meta ) {
    doTest( err, 'domains.memberships.delete', [
      ['result', data === true]
    ])
  })
})

// ! domains.services.available
queue.push( function() {
  ds.domains.services.available( bogus.domain.name, function( err, data, meta ) {
    doTest( err, 'domains.services.available', testArrObj(data))
  })
})

// ! domains.services.add
queue.push( function() {
  ds.domains.services.add( bogus.domain.name, 31, {url:'http://npmjs.org/'}, function( err, data, meta ) {
    doTest( err, 'domains.services.add', [
      ['result', meta.statusCode === 200],
      ['type', data instanceof Object],
      ['value', data.short_name === 'urlforward']
    ])
  })
})

// ! domains.services.list
queue.push( function() {
  ds.domains.services.list( bogus.domain.name, function( err, data, meta ) {
    doTest( err, 'domains.services.list', testArrObj(data))
  })
})

// ! domains.services.delete
queue.push( function() {
  ds.domains.services.delete( bogus.domain.name, 31, function( err, data, meta ) {
    doTest( err, 'domains.services.delete', [
      ['result', meta.statusCode === 200]
    ])
  })
})

// ! services.list
queue.push( function() {
  ds.services.list( function( err, data, meta ) {
    doTest( err, 'services.list', testArrObj(data))
  })
})

// ! services.show
queue.push( function() {
  ds.services.show( 31, function( err, data, meta ) {
    doTest( err, 'services.show', testObj(data))
  })
})

// ! templates.add
queue.push( function() {
  ds.templates.add( bogus.template, function( err, data, meta ) {
    bogus.template = data
    doTest( err, 'templates.add', [
      ['result', meta.statusCode === 201],
      ['type', data instanceof Object]
    ])
  })
})

// ! templates.show
queue.push( function() {
  ds.templates.show( bogus.template.short_name, function( err, data, meta ) {
    doTest( err, 'templates.show', [
      ['type', data instanceof Object],
      ['value', data.id === bogus.template.id]
    ])
  })
})

// ! templates.list
queue.push( function() {
  ds.templates.list( function( err, data, meta ) {
    doTest( err, 'templates.list', testArrObj(data))
  })
})

// ! templates.records.add
queue.push( function() {
  ds.templates.records.add( bogus.template.id, bogus.dns[0], function( err, data, meta ) {
    bogus.template_record = data
    doTest( err, 'templates.records.add', testObj(data))
  })
})

// ! templates.records.show
queue.push( function() {
  ds.templates.records.show( bogus.template.id, bogus.template_record.id, function( err, data, meta ) {
    doTest( err, 'templates.records.show', [
      ['result', meta.statusCode === 200],
      ['content', data.content === bogus.template_record.content]
    ])
  })
})

// ! templates.records.list
queue.push( function() {
  ds.templates.records.list( bogus.template.id, function( err, data, meta ) {
    doTest( err, 'templates.records.list', testArrObj(data))
  })
})

// ! templates.apply
queue.push( function() {
  ds.templates.apply( bogus.domain.name, bogus.template.id, function( err, data, meta ) {
    doTest( err, 'templates.apply', [
      ['result', meta.statusCode === 200],
      ['data', data.id === bogus.domain.id]
    ])
  })
})

// ! templates.records.delete
queue.push( function() {
  ds.templates.records.delete( bogus.template.id, bogus.template_record.id, function( err, data, meta ) {
    doTest( err, 'templates.records.delete', [
      ['result', data === true]
    ])
  })
})

// ! templates.delete
queue.push( function() {
  ds.templates.delete( bogus.template.id, function( err, data, meta ) {
    doTest( err, 'templates.delete', [
      ['result', data === true]
    ])
  })
})

// ! domains.delete
queue.push( function() {
  ds.domains.delete( bogus.domain.name, function( err, data, meta ) {
    doTest( err, 'domains.delete (1/2)', [
      ['data type', typeof data === 'boolean'],
      ['data value', data === true]
    ])
  })
})

// ! contacts.add
queue.push( function() {
  ds.contacts.add( bogus.contact, function( err, data, meta ) {
    bogus.contact = data
    doTest( err, 'contacts.add', [
      ['type', data instanceof Object]
    ])
  })
})

// ! contacts.show
queue.push( function() {
  ds.contacts.show( bogus.contact.id, function( err, data, meta ) {
    doTest( err, 'contacts.show', testObj(data))
  })
})

// ! contacts.update
queue.push( function() {
  ds.contacts.update( bogus.contact.id, {last_name:'Wayne'}, function( err, data, meta ) {
    doTest( err, 'contacts.update', [
      ['result', data instanceof Object],
      ['content', data.last_name === 'Wayne']
    ])
  })
})

// ! contacts.list
queue.push( function() {
  ds.contacts.list( function( err, data, meta ) {
    doTest( err, 'contacts.list', testArrObj(data))
  })
})

// ! domains.check
queue.push( function() {
  ds.domains.check( 'example.net', function( err, data, meta ) {
    doTest( err, 'domains.check', [
      ['result', meta.statusCode === 200],
      ['type', data instanceof Object]
    ])
  })
})

// ! domains.register taken
queue.push( function() {
  ds.domains.register( 'example.net', bogus.contact.id, function( err, data, meta ) {
    doTest( null, 'domains.register taken', [
      ['result', err && err.code === 400]
    ])
  })
})

// ! domains.register available
queue.push( function() {
  ds.domains.register( bogus.domain.name, bogus.contact.id, function( err, data, meta ) {
    bogus.domain = data
    doTest( err, 'domains.register available', [
      ['result', meta.statusCode === 201]
    ])
  })
})

// ! domains.renew
queue.push( function() {
  ds.domains.renew( bogus.domain.name, function( err, data, meta ) {
    doTest( null, 'domains.renew', [
      ['too soon', err && meta.statusCode === 422]
    ])
  })
})

// ! domains.autorenew
queue.push( function() {
  ds.domains.autorenew( bogus.domain.name, true, function( err, data, meta ) {
    doTest( err, 'domains.autorenew', [
      ['result', meta.statusCode === 200],
      ['data', data instanceof Object],
      ['value', data.id === bogus.domain.id]
    ])
  })
})

// ! domains.transferout
queue.push( function() {
  ds.domains.transferout( bogus.domain.name, function( err, data, meta ) {
    doTest( err, 'domains.transferout', testObj(data))
  })
})

// ! domains.transfer
queue.push( function() {
  ds.domains.transfer( bogus.domain.name, bogus.contact.id, 'abc', function( err, data, meta ) {
    doTest( null, 'domains.transfer', [
      ['exists', meta.statusCode === 400]
    ])
  })
})

// ! domains.nameservers
queue.push( function() {
  var ns = {
    ns1: 'ns1.example.net',
    ns2: 'ns2.example.net'
  }
  ds.domains.nameservers( bogus.domain.name, ns, function( err, data, meta ) {
    doTest( err, 'domains.nameservers', [
      ['result', meta.statusCode === 200],
      ['type', data instanceof Array],
      ['content', data[0] === ns.ns1 && data[1] === ns.ns2]
    ])
  })
})

// ! domains.whoisPrivacy on
queue.push( function() {
  ds.domains.whoisPrivacy( bogus.domain.name, true, function( err, data, meta ) {
    doTest( err, 'domains.whoisPrivacy on', testObj( data ))
  })
})

// ! domains.whoisPrivacy off
queue.push( function() {
  ds.domains.whoisPrivacy( bogus.domain.name, false, function( err, data, meta ) {
    doTest( err, 'domains.whoisPrivacy off', [
      ['result', data === true]
    ])
  })
})

// ! domains.delete
queue.push( function() {
  ds.domains.delete( bogus.domain.name, function( err, data, meta ) {
    doTest( err, 'domains.delete (2/2)', [
      ['data type', typeof data === 'boolean'],
      ['data value', data === true]
    ])
  })
})

// ! contacts.delete
queue.push( function() {
  ds.contacts.delete( bogus.contact.id, function( err, data, meta ) {
    doTest( err, 'contacts.delete', [
      ['result', data === true]
    ])
  })
})


// Start the tests
queue[0]()
