export default function (obj) {
  Object.keys(obj).forEach(key => {
    if (!obj[key]) {
      delete obj[key];
    }
  });
  return Object.keys(obj).length;
}
