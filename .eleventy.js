const { EleventyEdgePlugin } = require("@11ty/eleventy");
const sass = require("sass");

// const UNITS_TABLE = "tblRtXBod9CC0mivK";

module.exports = function(eleventyConfig) {

  //pass through static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "/" });

  // Enable Eleventy Edge
  eleventyConfig.addPlugin(EleventyEdgePlugin);

  // add build-time Eleventy filters
  eleventyConfig.addFilter("markdownify", require("./src/filters/markdownify.js"));
  eleventyConfig.addFilter("index", require("./src/filters/index.js"));
  eleventyConfig.addFilter("whereIncluded", require("./src/filters/whereIncluded.js"));
  eleventyConfig.addFilter("whereEmpty", require("./src/filters/whereEmpty.js"));
  eleventyConfig.addFilter("json", obj => JSON.stringify(obj, null, 2));
  eleventyConfig.addFilter("isPublishedPage",  require("./src/filters/isPublishedPage.js"));



  // By default, hide any units not allowing public applications (i.e. referrals only).
  // if(!includeReferrals) {
  //   parameters.push("{_DISALLOWS_PUBLIC_APPLICATIONS} = 0")
  // }


  // Sass pipeline
  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    compile: function(contents, includePath) {
      let includePaths = [this.config.dir.includes];
      return () => {
        let ret = sass.renderSync({
          file: includePath,
          includePaths,
          data: contents,
          outputStyle: "compressed"
        });
        return ret.css.toString("utf8");
      }
    }
  });

  return {
    dir: {
      input: "src/site",
      output: "dist"
    }
  }
};
