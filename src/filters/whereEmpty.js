
  // Find items in a collections where a given property is empty
  module.exports = (collection, key) => {

    let filtered = [];
    for (item in collection) {
      if (!collection[item][key]) {
        filtered.push(collection[item]);
      }
    }
    return filtered;
  };
