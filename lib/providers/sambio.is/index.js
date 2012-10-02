var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

var zeroPad = function(num) {
  return (num < 10 ? '0' : '') + num;
}

exports.createPass = function(data, cb) {
  var date = new Date(data.date);
  cb(null, {
    description: date.eventName,
    fields: {
      movieName: data.eventName,
      where: "UNKNOWN",
      court: 'N/A',
      price: data.cost,
      when: {
        value: date.getHours() + ':' + zeroPad(date.getMinutes),
        label: months[date.getMonth()] + ' ' + date.getDay()
      }
    }
  });
};