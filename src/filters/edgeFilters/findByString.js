export default function (collection, key, searchString) {

  return collection.filter(obj => {
    const property = obj[key].toLowerCase();
    return property.includes(searchString.toLowerCase());
  });
}
