var opts = {}
for( var i=2; i < process.argv.length; i++ ) {
	var p = process.argv[i].match(/-(\w+)=([^ ]+)/)
	opts[ p[1] ] = p[2]
}

// Setup
// set env API_EMAIL and API_TOKEN (Travis CI)
// or use cli arguments -email=me@some.where -token=abc123
var ds = require('./')({
	email: opts.email || process.env.API_EMAIL || null,
	token: opts.token || process.env.API_TOKEN || null
})

