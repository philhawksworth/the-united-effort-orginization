const { AssetCache } = require("@11ty/eleventy-fetch");
var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);


const fetchSection = (id) => {
  const table = base("tblAkC6dlPJc4o0Je"); // sections table
  return table.find(id).then(record => {
    if (record.get("Type") == "Markdown page") {
      return record.get("Markdown");
    } else {
      return record.get("Content");
    }
  });

}


// Fetch content for our pages from Airtable
const fetchPages = async() => {
  let pages = [];
  let data = [];
  const table = base("tblTqhITQfO1MJQaE"); // Structured pages table

  return table.select({
      view: "API page content"
    })
    .all()
    .then(async(records) => {

      for (record of records) {

        if (record.get("Status") == "Published") {
          let name = record.get("Page title");
          let path = record.get("Page path");
          let sectionID = record.get("Section")[0];
          let content = await fetchSection(sectionID);

          if (!data[name]) {
            data[name] = {
              url: path,
              sections: [],
              name: name
            };
          }

          data[name].sections.push({
            type: record.get("Type")[0].replace(" ", "-"),
            content: content
          });
        }
      };

      // Collect each page array into our pages array
      for (const key in data) {
        const element = data[key];
        pages.push(element);
      }
      return pages;
    });

};


module.exports = async function() {
  let asset = new AssetCache("airtable_pages");
  if (asset.isCacheValid("1h")) {
    return asset.getCachedValue();
  }
  console.log("Fetching pages.");
  let p = await fetchPages();
  await asset.save(p, "json");
  return p ;
}
