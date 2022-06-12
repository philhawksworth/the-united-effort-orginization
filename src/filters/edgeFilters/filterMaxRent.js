export default function (collection, value, includeUnknown) {

  return collection.filter(obj => {

    return obj.units.some(unit => {
      // if the units hold no value, include it instead of rejecting it if told to do so.
      if (!unit.RENT_PER_MONTH_USD && includeUnknown) return true;
      return Number(unit.RENT_PER_MONTH_USD) <= Number(value)
    });
  
  });
}
