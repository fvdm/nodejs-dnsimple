#!/bin/bash
result=0

echo "Running ESLint..."
eslint *.js lib/ || result=1
istanbul cover test.js || result=1

if [ "$TRAVIS" == "true" ]; then
  echo
  echo "Sending coverage report to Coveralls..."
  cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js -v || result=1
fi

exit $result
