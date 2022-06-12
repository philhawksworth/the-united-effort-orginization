  // Get all of the unique values of a property
  module.exports = (collection, property) => {
    let values = [];
    for (item in collection) {
      if (collection[item][property]) {
        values = values.concat(collection[item][property]);
      }
    }
    return [...new Set(values)];
  }
