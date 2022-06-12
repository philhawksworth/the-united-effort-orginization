// return true if:
// the page is set to published
// the URL is on this site
module.exports = (page) => {
  return (page['"Show on website'] && page.URL.startsWith("/"));
};
