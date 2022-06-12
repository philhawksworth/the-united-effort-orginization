// optionFilter
//
// Filter a collection of objects by the value of a provided key
// where either the haystack we're looking in, or the needle we 
// are looking for can be either a string or an array of strings.

export default function (collection, key, value) {
  
  return collection.filter(obj => {

    // we're matching against array entries
    if(typeof obj[key] === "object") {

      // we looking for any entry in an array in this array
      if(typeof value === "object"){
        return obj[key].some(r=> value.indexOf(r) >= 0)
      } 
      // we're looking for a string in this array
      else {
        return obj[key].includes(value);
      }

    } 
    
    // we're matching against a string
    else {

      // we looking for any entry in an array which matches this string
      if(typeof value === "object"){
        return value.includes(obj[key]);
      } 
      
      // we're just checking if strings match
      else {
        return obj[key] === value;
      }

    }
  });
}
