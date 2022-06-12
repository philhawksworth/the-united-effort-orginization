// return the number of truthy properties in the query object
export default function(query){    

  // copy the query object to avoid impact the original here.
  let queryCopy = JSON.parse(JSON.stringify(query));;

  // ignore some default filters
  delete queryCopy.includeUnknownRent;
  delete queryCopy.includeUnknownIncome;

  const notNull = Object.values(queryCopy).filter(val => val)
  return notNull.length;

}
