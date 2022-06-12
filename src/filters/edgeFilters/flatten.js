// Flatten a query string object so that items holding arrays
// re expressed as multiple instances of that item
export default function (obj) {
  let args = []
  for (const [key, value] of Object.entries(obj)) {
    if(typeof value == "object") {
      value.forEach(item => {
        args.push(`${key}=${item}`);
        
      });  
    } else {
      args.push(`${key}=${value}`);
    } 
  }
  return args.join("&")
};
