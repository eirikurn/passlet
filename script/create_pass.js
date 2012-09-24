#!/usr/bin/env node

var pass = require('../lib/pass');

pass.createPass('sambio.is', {}, function(err, pass) {
  if (err) {
    console.log("Failed :(");
  } else {
    console.log('Worked', pass);
  }
});