// Filter a collection of objects by the value of a provided key
// which should be present in one or more of an item's Units
export default function (collection, key, value) {

  // we looking for any entry in an array in this array
  if(typeof value === "object"){
    return collection.filter(obj => {
      return obj.units.some(unit => {
        return value.indexOf(unit[key]) >= 0;
      })
    })
  }

  // we're looking for a string in this array
  else {
    return collection.filter(obj => {
      return obj.units.some(unit => {
        return unit[key] === value;
      });
    });
  }

}
