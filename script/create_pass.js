#!/usr/bin/env node

var pass = require('../pass');

pass.createPass('sambio.is', {}, function(err, pass) {
  if (err) {
    console.log("Failed :(");
  } else {
    console.log('Worked', pass);
  }
});