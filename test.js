// cli arguments
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

// handle exits
var errors = 0
process.on( 'exit', function() {
	if( errors == 0 ) {
		console.log('\nDONE, no errors.\n')
		process.exit(0)
	} else {
		console.log('\nFAIL, '+ errors +' error'+ (errors > 1 ? 's' : '') +' occurred!\n')
		process.exit(1)
	}
})

// doTest( passErr, 'methods', [
//   ['feeds', typeof feeds, 'object']
// ])
function doTest( err, label, tests ) {
	if( err instanceof Error ) {
		console.log( label +': ERROR' )
		console.log( err, err.stack )
		errors++
	} else {
		var testErrors = []
		tests.forEach( function( test ) {
			if( test[1] !== test[2] ) {
				testErrors.push(test[0])
				errors++
			}
		})
		
		if( testErrors.length == 0 ) {
			console.log( label +': ok' )
		} else {
			console.log( label +': failed ('+ testErrors.join(', ') +')' )
		}
	}
}
