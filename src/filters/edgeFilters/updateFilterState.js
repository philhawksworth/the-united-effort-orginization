// Add filter checkbox state from the query parameters to 'filterValues'. 
export default function(filterValues, query) {


  console.log(arguments);
  

  // The AssetCache holding filterValues stores a buffered version of the
  // cached filterValues and does not read it in from the filesystem on each
  // page render. We need to be sure to not modify the original object, lest
  // those edits persist in the cached object.
  let filterValuesCopy = JSON.parse(JSON.stringify(filterValues));
  // If there is no query (such as on the affordable housing landing page)
  // there is no state to add to the filterValues.
  if (!query) { return filterValuesCopy; }

  // Updates the state of the FilterSection with the name 'filterName'
  // according to 'queryValue'
  function updateFilterSection(queryValue, filterName) {
    if (!queryValue) { return; }
    let selectedOptions = queryValue.split(", ");
    let filterIdx = filterValuesCopy.findIndex(f => f.name == filterName);
    if (filterIdx < 0) { return; }
    for (i = 0; i < selectedOptions.length; i++) {
      let idx = filterValuesCopy[filterIdx].options.findIndex(
        v => v.name === selectedOptions[i]);
      if (idx >= 0) {
        filterValuesCopy[filterIdx].options[idx].selected = true;
      }
    }
  }
  for (section in query){
    updateFilterSection(query[section], section);
  }

  return filterValuesCopy;
};
