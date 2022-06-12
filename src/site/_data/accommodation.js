const { AssetCache } = require("@11ty/eleventy-fetch");
const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const UNITS_TABLE = "tblRtXBod9CC0mivK";
const HOUSING_DB_TABLE = "tbl8LUgXQoTYEw2Yh";


const fetchLocationsFromAirtable = async() => {
  
  let locations = [];
  let cities = [];
  let populations = [];
  
  const table = base(HOUSING_DB_TABLE);
  return table.select({
      view: "API all housing"
    })
    .all()
    .then(records => {
      records.forEach(function(record) {
        
        // collect some of the available options for populating filtering later
        cities.push(record.get("CITY"));
        populations = populations.concat(record.get("POPULATIONS_SERVED"));

        // generate a location from every unit and add ut to a locations array that we'll dedupe later
        locations.push({
          id: record.get("DISPLAY_ID"),
          aptName: record.get("APT_NAME"),
          address: record.get("ADDRESS"),
          city: record.get("CITY"),
          locCoords: record.get("LOC_COORDS"),
          phone: record.get("PHONE"),
          website: record.get("PROPERTY URL"),
          email: record.get("EMAIL"),
          units_count: record.get("UNITS_CNT"),
          populations_served: record.get("POPULATIONS_SERVED"),
          referrals_only: record.get("DISALLOWS_PUBLIC_APPLICATIONS") ? true : false,
          wheelchairAccessibleOnly: record.get("HAS_WHEELCHAIR_ACCESSIBLE_UNITS") ? "on" : ""
        }); 
      });

      // dedupe and return collected arrays
      cities = [...new Set(cities)];
      populations = [...new Set(populations)];
      return [locations, cities, populations]; 
    });

};


const fetchUnitsFromAirtable = async() => {
  let units = [];  
  const table = base(UNITS_TABLE);
  return table.select({
      view: "API all units"
    })
    .all()
    .then(records => {
      records.forEach(function(record) {
        // add the unit info to an object in the units array 
        units.push({
          id: record.get("ID (from Housing)")?.[0] || "",
          type: record.get("TYPE") || "",
          status: record.get("STATUS") || "",
          ami_rent: record.get("ami_rent"),
          ami_max_income: record.get("ami_max_income"),
          RENT_PER_MONTH_USD: record.get("RENT_PER_MONTH_USD"),
          MIN_INCOME_RENT_FACTOR: record.get("MIN_INCOME_RENT_FACTOR"),
          MAX_YEARLY_INCOME_HH_1_USD: record.get("MAX_YEARLY_INCOME_HH_1_USD"),
          MAX_YEARLY_INCOME_HH_2_USD: record.get("MAX_YEARLY_INCOME_HH_2_USD"),
          MAX_YEARLY_INCOME_HH_3_USD: record.get("MAX_YEARLY_INCOME_HH_3_USD"),
          MAX_OCCUPANCY: record.get("MAX_OCCUPANCY"),
          PERCENT_AMI: record.get("PERCENT_AMI")
        });
      });
      return units; 
  });

};





module.exports = async function() {
  
  // Development cache management
  let asset = new AssetCache("affordable_housing_data");
  let cacheDuration = "1m";

  // Return data from the cache if it is fresh enough
  if(asset.isCacheValid(cacheDuration)) {
    return asset.getCachedValue(); 
  } 

  // Otherwise we can fetch, cache, and return the data from Airtable
  let units = await fetchUnitsFromAirtable();
  let [locations, cities, populations] = await fetchLocationsFromAirtable();

  // add the associated units to each location object
  for (const location of locations) {
    location.units = units.filter(({ id }) => id === location.id );
  }

  // stash and return the data
  const data = {
    units: units, 
    locations: locations,
    cities: cities,
    populations: populations
  }
  await asset.save(data, "json");
  return data;

}
