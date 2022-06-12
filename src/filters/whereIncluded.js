  // Filter a data set by a value present in an array property
  module.exports = (collection, key, value) => {
    let filtered = [];
    for (item in collection) {
      if (collection[item][key] && collection[item][key].includes(value)) {
        filtered.push(collection[item]);
      }
    }
    return filtered;
  };
