exports.createPass = function(data, cb) {
  cb(null, {
    description: "awesome",
    fields: {
      movieName: "Batman",
      where: "Sambíóin Egilshöll",
      court: 1,
      price: 500,
      when: "8:00"
    }
  });
};