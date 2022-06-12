// return "checked" if this option was specified in the querystring
export default function (val, key) {
  if(typeof key === "object") {
    if(key.includes(val)) return "checked"
  } else {
    if(val == key) return "checked";
  }
  return false;
}
