exports.createPass = function(data, cb) {
  cb(null, {
    description: "awesome",
    fields: {
      movieName: "Batman",
      where: "Sambíóin Egilshöll",
      court: 1,
      price: 500,
      when: {
        value: "8:00",
        label: "Oct 31"
      }
    }
  });
};