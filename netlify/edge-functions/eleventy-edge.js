import { EleventyEdge } from "https://cdn.11ty.dev/edge@1.0.1/eleventy-edge.js";
import precompiledAppData from "./_generated/eleventy-edge-app-data.js";
import accommodation from "./_generated/accommodation.js";

// import searchFilters
import countKeys from "../../src/filters/edgeFilters/countKeys.js";
import findByString from "../../src/filters/edgeFilters/findByString.js";
import optionFilter from "../../src/filters/edgeFilters/optionFilter.js";
import optionFilterUnits from "../../src/filters/edgeFilters/optionFilterUnits.js";
import sortUnitType from "../../src/filters/edgeFilters/sortUnitType.js";
import numFiltersApplied from "../../src/filters/edgeFilters/numFiltersApplied.js";
import optionSelected from "../../src/filters/edgeFilters/optionSelected.js";
import filterMaxRent from "../../src/filters/edgeFilters/filterMaxRent.js";
import filterMinIncome from "../../src/filters/edgeFilters/filterMinIncome.js";
import flatten from "../../src/filters/edgeFilters/flatten.js";

export default async (request, context) => {
  try {
    let edge = new EleventyEdge("edge", {
      request,
      context,
      precompiled: precompiledAppData,
      cookies: [],
    });
    

    // construct an object of all the querystring parameters since the 
    // built-in eleventy.edge.query does not capture multiple matching 
    // query params. See the tracking issue for details:
    // https://github.com/11ty/eleventy/issues/2422
    const url = new URL(request.url);
    let queries = {};
    for (const [k, v] of url.searchParams.entries()) {
      if(v) {
        if(!queries[k]) {
          queries[k] = v;
        } else {
          if(typeof queries[k] == "string") {
            queries[k] = [queries[k]];
          }
          queries[k].push(v);
        }
      }
    }
    
    edge.config((eleventyConfig) => {
      
      // Expose data
      eleventyConfig.addGlobalData("accommodation", accommodation);
      eleventyConfig.addGlobalData("searchParams", queries);
      eleventyConfig.addGlobalData("date", () => { 
        const now = new Date().toLocaleDateString();
        return now.replaceAll("/","-");
      });
      
      // Add filters
      eleventyConfig.addFilter("countKeys", countKeys);
      eleventyConfig.addFilter("findByString", findByString);
      eleventyConfig.addFilter("optionFilter", optionFilter);
      eleventyConfig.addFilter("optionFilterUnits", optionFilterUnits);
      eleventyConfig.addFilter("sortUnitType", sortUnitType);
      eleventyConfig.addFilter("numFiltersApplied", numFiltersApplied);
      eleventyConfig.addFilter("optionSelected", optionSelected);
      eleventyConfig.addFilter("filterMaxRent", filterMaxRent);
      eleventyConfig.addFilter("filterMinIncome", filterMinIncome);
      eleventyConfig.addFilter("flatten", flatten);

      
    });

    return await edge.handleResponse();
  } catch (e) {
    console.log("ERROR", { e });
    return context.next(e);
  }
};
