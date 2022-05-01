const markdown = require("marked");
const sass = require("sass");
const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");

var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID);

const UNITS_TABLE = "tblNLrf8RTiZdY5KN";


module.exports = function(eleventyConfig) {

  //pass through static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "/" });

  // Eleventy Serverless plugin
  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: "serverless",
    functionsDir: "./netlify/functions/",
  });

  // Markdown filter
  eleventyConfig.addFilter("markdownify", (str) => {
    str = str.replaceAll("http:///", "/");
    return markdown.marked(str)
  });

  // Get all of the unique values of a property
  eleventyConfig.addFilter("index", function(collection, property) {
    let values = [];
    for (item in collection) {
      if (collection[item][property]) {
        values = values.concat(collection[item][property]);
      }
    }
    return [...new Set(values)];
  });

  // Filter a data set by a value present in an array property
  eleventyConfig.addFilter("whereIncluded", function(collection, key, value) {
    let filtered = [];
    for (item in collection) {
      if (collection[item][key] && collection[item][key].includes(value)) {
        filtered.push(collection[item]);
      }
    }
    return filtered;
  });
  // Filter a data set by a value present in an array property
  eleventyConfig.addFilter("whereEmpty", function(collection, key) {
    let filtered = [];
    for (item in collection) {
      if (!collection[item][key]) {
        filtered.push(collection[item]);
      }
    }
    return filtered;
  });

  // Add filter checkbox state from the query parameters to 'filterValues'. 
  eleventyConfig.addFilter("updateFilterState", function(filterValues, query) {
    // If there is no query (such as on the affordable housing landing page)
    // there is no state to add to the filterValues.
    if (!query) { return filterValues; }

    // Updates the state of the FilterSection with the name 'filterName'
    // according to 'queryValue'
    function updateFilterSection(queryValue, filterName) {
      if (!queryValue) { return; }
      let selectedOptions = queryValue.split(", ");
      let filterIdx = filterValues.findIndex(f => f.name == filterName);
      if (filterIdx < 0) { return; }
      for (i = 0; i < selectedOptions.length; i++) {
        let idx = filterValues[filterIdx].options.findIndex(
          v => v.name === selectedOptions[i]);
        if (idx >= 0) {
          filterValues[filterIdx].options[idx].selected = true;
        }
      }
    }

    updateFilterSection(query.availability, "availability");
    updateFilterSection(query.city, "city");
    updateFilterSection(query.unitType, "unitType");
    return filterValues;
  });

  // Gets a subset of all housing results from Airtable based on 'query'.
  eleventyConfig.addFilter("housingResults", async function(query) {
    console.log("housing query: ");
    console.log(query);
    const queryStr = buildQueryStr(query);
    let housing = await fetchHousingList(queryStr);
    console.log("got " + housing.length + " properties.")
    if (query) {
      console.log(housing);
    }
    return housing;
  });

  // Generates an Airtable filter formula string based on 'query'.
  const buildQueryStr = function(query) {
    if (!query) { return ""; }
    const {
      availability,
      city,
      unitType,
      rentMin,
      rentMax,
      income,
      includeUnknownRent,
      includeUnknownIncome
    } = query;

    let parameters = [];

    if (unitType) {
      let rooms = unitType.split(", ");
      let roomsQuery = rooms.map((x) => `{TYPE} = '${x}'`)
      parameters.push(`OR(${roomsQuery.join(",")})`);
    }

    if (city) {
      let cities = city.split(", ");
      let cityQuery = cities.map((x) => `{City (from Housing)} = '${x}'`);
      parameters.push(`OR(${cityQuery.join(",")})`);
    }

    if (availability) {
      let availabilities = availability.split(", ");
      let availabilityQuery = availabilities.map((x) => `{STATUS} = '${x}'`);
      parameters.push(`OR(${availabilityQuery.join(",")})`);
    }

    // No rent filter will be added if a rentMin/rentMax query parameter
    // is present but equal to zero.  This is ok, as a rentMin = 0 is
    // effectively no filter anyways and a rentMax = 0 is a bit nonsensical and 
    // so is ignored.
    if (rentMin) {
      let rentMinParams = [`{RENT_PER_MONTH_USD} >= '${rentMin}'`];
      // If the user wants to see units with no rent listed, make sure units
      // with empty rent values are allowed.
      if (includeUnknownRent) {
        rentMinParams.push(`{RENT_PER_MONTH_USD} = BLANK()`);
      }
      parameters.push(`OR(${rentMinParams.join(",")})`);
    }
    if (rentMax) {
      let rentMaxParams = [`{RENT_PER_MONTH_USD} <= '${rentMax}'`];
      if (includeUnknownRent) {
        rentMaxParams.push(`{RENT_PER_MONTH_USD} = BLANK()`);
      }
      parameters.push(`OR(${rentMaxParams.join(",")})`);
    }
    if (income) {
      let incomeMinParams = [`{MIN_INCOME_PER_YR_USD} <= '${income}'`];
      let incomeMaxParams = [`{MAX_INCOME_PER_YR_USD} >= '${income}'`];
      if (includeUnknownIncome) {
        incomeMinParams.push(`{MIN_INCOME_PER_YR_USD} = BLANK()`);
        incomeMaxParams.push(`{MAX_INCOME_PER_YR_USD} = BLANK()`);
      }
      parameters.push(
        `AND(OR(${incomeMinParams.join(",")}),\
        OR(${incomeMaxParams.join(",")}))`);
    }

    let queryStr = `AND(${parameters.join(",")})`;
    console.log("Airtable query:");
    console.log(queryStr);
    return queryStr;
  };

  // Get housing units from Airtable, filtered by the Airtable formula string
  // 'queryStr'.
  const fetchHousingList = async(queryStr) => {
    let housingList = [];
    const table = base(UNITS_TABLE);

    return table.select({
        view: "API all units",
        filterByFormula: queryStr
      })
      .all()
      .then(records => {
        records.forEach(function(record) {
          housingList.push({
            id: record.get("ID (from Housing)"),
            aptName: record.get("APT_NAME"),
            city: record.get("City (from Housing)"),
            openStatus: record.get("STATUS"),
            unitType: record.get("TYPE"),
            locCoords: record.get("LOC_COORDS (from Housing)"),
            phone: record.get("Phone (from Housing)")
          })
        });
        // De-duplicate results which can be present if the same unit is offered
        // at different rents for different income levels.
        return Array.from(
          new Set(housingList.map((obj) => JSON.stringify(obj)))
        ).map((string) => JSON.parse(string));
      });
  };

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