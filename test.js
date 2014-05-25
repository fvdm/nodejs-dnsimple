// Setup: test -email=me@some.where -token=abc123
var opts = {}
for( var i=2; i < process.argv.length; i++ ) {
	var p = process.argv[i].match(/-(\w+)=([^ ]+)/)
	opts[ p[1] ] = p[2]
}

var ds = require('./')({email: opts.email, token: opts.token})

