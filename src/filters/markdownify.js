  // Markdown filter

  const markdown = require("marked"); 
  module.exports = (str) => {
    str = str.replaceAll("http:///", "/");
    return markdown.marked(str)
  };
  