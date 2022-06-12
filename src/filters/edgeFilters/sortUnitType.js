export default function (values, property='') {
  let sorted = values.sort(function(a, b) {
    let valA = property ? a[property] : a;
    let valB = property ? b[property] : b;
    // Return < 0 if 'a' should go before 'b'
    // Return > 0 if 'b' should go before 'a'
    if ((valA === "SRO" && valB === "Studio") || // SRO before Studio.
        (valA === "SRO" || valA === "Studio") || // SRO/Studio always first.
        (valB === "Others")) { // Others always last.
      return -1; 
    }
    if ((valA === "Studio" && valB === "SRO") || // SRO before Studio
        (valB === "SRO" || valB === "Studio") || // SRO/Studio always first.
        (valA === "Others")) { // Others always last.
      return 1;
    }
    if (valA < valB) {
      return -1;
    }
    if (valA > valB) {
      return 1;
    }
    return 0;
  });
  return sorted;
};
