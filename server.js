var app = require('./app');
var port = process.env.PORT || 3011;

var server = app.listen(port, function() {
  console.log('Backend server listening on port ' + port);
});