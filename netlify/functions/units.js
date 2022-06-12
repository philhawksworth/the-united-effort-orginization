const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
// const pageTemplate = require("./includes/base.js");

const NO_DATA_STRING = "Call for info";
const NO_INCOME_BRACKET_STRING = "Bracket"
const NO_RENT_STRING = "Call for rent";
const NO_RENT_WITH_NOTES_STRING = "Varies";
const NO_MIN_INCOME_STRING = NO_DATA_STRING;
const NO_MAX_INCOME_STRING = NO_DATA_STRING;
const NO_MAX_OCCUPANCY_STRING = NO_DATA_STRING;
const UNITS_TABLE = "tblRtXBod9CC0mivK"

// Generate a user-friendly string showing an age range.
// If no max age is given, the string will show "<min_age>+"
// If no min age is given, the string will show "<max_age> and under"
const makeAgeRangeString = (min_age, max_age) => {
  if (min_age && max_age) {
    return ` (${min_age} - ${max_age} years)`;
  }
  if (min_age && !max_age) {
    return ` (${min_age}+ years)`;
  }
  if (!min_age && max_age) {
    return ` (${max_age} years and under)`;
  }
  return "";
}

const makeListString = (collection, finalJoinStr) => {
  let strArray = [];
  for (let i = 0; i < collection.length; i++) {
    strArray.push(collection[i]);
    if (i == collection.length - 1) {
      // Final item; no additional joining string required.
      break;
    }
    if (i == collection.length - 2) {
      strArray.push(` ${finalJoinStr} `);
    } else {
      strArray.push(", ");
    }
  }
  return strArray.join("");
}

// Make a definition list from all the data returned about this item
const metaData = (units) => {
  let aptName = units.metadata.aptName || "Apartment Listing";
  let metaNotes = [];
  let definitions = [];
  for (key in units.metadata) {
    // The apartment name is instead rendered as the page title.
    // Notes are instead rendered as a separate paragraph.
    if (key === "aptName" || key === "notesData") { continue; }
    let value = units.metadata[key];
    if (!value) {
      continue
    }
    if (key === "Address") {
      value = `${value} (<a href="https://maps.google.com/maps?q=${encodeURIComponent(value)}+${encodeURIComponent(units.metadata["City"] || "")}&country=us" target="_blank" rel="noopener">map</a>)`
    }
    if (key === "Website") {
      value = `<a href="${value}" target="_BLANK" rel="noopener">${value}</a>`
    }
    if (key === "Email") {
      value = `<a href="mailto:${value}" target="_BLANK" rel="noopener">${value}</a>`
    }
    definitions.push(`<tr><td class="definition_term">${key}</td><td class="definition">${value}</td></tr>`);
  }
  let ageRangeStr = makeAgeRangeString(units.metadata.notesData["_MIN_RESIDENT_AGE"],
    units.metadata.notesData["_MAX_RESIDENT_AGE"]);
  
  let populationsServed = units.metadata.notesData["_POPULATIONS_SERVED"];
  let specialPopulations = populationsServed.filter(x => x !== "General Population");
  let specialPopulationsDisp = [];
  for (const population of specialPopulations) {
    let str = population.toLowerCase()
    if (population === "Seniors" || population === "Youth") {
      str += ageRangeStr;
    }
    specialPopulationsDisp.push(str);
  }
  let populationsStr = makeListString(specialPopulationsDisp, "or");
  if (specialPopulations.length) {
    if (populationsServed.includes("General Population")) {
      metaNotes.push(`In addition to the general population, this property also specifically serves people who are ${populationsStr}.`)
    } else {
      metaNotes.push(`This property only serves people who are ${populationsStr}.`)
    }
  }

  if (units.metadata.notesData["_PREFERS_LOCAL_APPLICANTS"]) {
    let cityStr = units.metadata["City"] || "the local city"
    metaNotes.push(
      `When selecting residents, this property gives preference to those who work or live in ${cityStr}.`);
  }

  if (units.metadata.notesData["_DISALLOWS_PUBLIC_APPLICATIONS"]) {
    metaNotes.push("A referral from a case manager or housing agency is required to apply for this property. Contact the property for details on the referral process.");
  }

  let metaNotesStr = "";
  if (metaNotes.length > 0) {
    metaNotesStr = `<p>${metaNotes.join("</p><p>")}</p>`; 
  }
  return `
    <h1>${aptName}</h1>
    <table class="deflist">${definitions.join("")}</table>
    ${metaNotesStr}`;
}

const formatCurrency = (value) => {
  return value.toLocaleString("en-US", {
    style: "currency", 
    maximumFractionDigits: 0, 
    minimumFractionDigits: 0, 
    currency: "USD"});
}

const compareRents = (a, b) => {
  // Compare rent table rows.
  // If both units have differing rent, sort according to those.  
  // Otherwise, use min income if available.
  // Otherwise, use max income (the low end of the range) if available.
  // Otherwise, use AMI percentage if available.
  // If the units have none of those three values, don't sort at all, as 
  // there is nothing to compare against.
  let compA = 0;
  let compB = 0;
  if (a.record.RENT_PER_MONTH_USD && 
      b.record.RENT_PER_MONTH_USD && 
      a.record.RENT_PER_MONTH_USD != b.record.RENT_PER_MONTH_USD) {
    compA = a.record.RENT_PER_MONTH_USD;
    compB = b.record.RENT_PER_MONTH_USD;
  } else if (a.record.MIN_YEARLY_INCOME_USD && 
             b.record.MIN_YEARLY_INCOME_USD &&
             a.record.MIN_YEARLY_INCOME_USD != b.record.MIN_YEARLY_INCOME_USD) {
    compA = a.record.MIN_YEARLY_INCOME_USD;
    compB = b.record.MIN_YEARLY_INCOME_USD;
  } else if (
      a.record.MAX_YEARLY_INCOME_LOW_USD && 
      b.record.MAX_YEARLY_INCOME_LOW_USD &&
      a.record.MAX_YEARLY_INCOME_LOW_USD != b.record.MAX_YEARLY_INCOME_LOW_USD) {
    compA = a.record.MAX_YEARLY_INCOME_LOW_USD;
    compB = b.record.MAX_YEARLY_INCOME_LOW_USD;
  }
  else if (
      a.record.PERCENT_AMI && 
      b.record.PERCENT_AMI &&
      a.record.PERCENT_AMI != b.record.PERCENT_AMI) {
    compA = a.record.PERCENT_AMI;
    compB = b.record.PERCENT_AMI;
  }
  if (compA < compB) {
    return -1;
  }
  if (compA > compB) {
    return 1;
  }
  return 0;
}

const sortUnitTypes = (values, property='') => {
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
}

// Make table rows for all the rent offerings of the unit type described by 'data'.
const unitDetails = (data) => {
  let rows = [];
  let sortedData = data.sort(compareRents);
  for (item in sortedData) {
    let unit = sortedData[item].record;
    let incomeBracketStr = `${NO_INCOME_BRACKET_STRING} ${parseInt(item) + 1}`;
    let rentStr = NO_RENT_STRING;
    let minIncomeStr = NO_MIN_INCOME_STRING;
    let maxIncomeStr = NO_MAX_INCOME_STRING;
    let rentInfo = "";
    let minIncomeInfo = "";
    let maxIncomeInfo = "";
    if (unit.PERCENT_AMI) {
      incomeBracketStr = `${unit.PERCENT_AMI}% <abbr title="Area Median Income">AMI</abbr>`;
    }
    if (unit.RENT_PER_MONTH_USD) {
      rentStr = formatCurrency(unit.RENT_PER_MONTH_USD);
    } else if (unit.RENT_NOTES) {
      rentStr = NO_RENT_WITH_NOTES_STRING;
      rentInfo = `<span class="tooltip_entry"><span class="icon_info"></span><span class="tooltip_content">${unit.RENT_NOTES}</span></span>`;
    }
    if (unit.MIN_YEARLY_INCOME_USD) {
      minIncomeStr = formatCurrency(unit.MIN_YEARLY_INCOME_USD);
    }
    if (unit.MAX_YEARLY_INCOME_LOW_USD && unit.MAX_YEARLY_INCOME_HIGH_USD) {
      if (unit.MAX_YEARLY_INCOME_LOW_USD == unit.MAX_YEARLY_INCOME_HIGH_USD) {
        maxIncomeStr = formatCurrency(unit.MAX_YEARLY_INCOME_LOW_USD);
      } else {
       maxIncomeStr = `${formatCurrency(unit.MAX_YEARLY_INCOME_LOW_USD)} to ${formatCurrency(unit.MAX_YEARLY_INCOME_HIGH_USD)}`;
      }    
    }
    if (unit.MIN_YEARLY_INCOME_USD && 
        unit.MIN_INCOME_RENT_FACTOR && 
        !unit.OVERRIDE_MIN_YEARLY_INCOME_USD) {
      minIncomeInfo = `<span class="tooltip_entry"><span class="icon_info"></span><span class="tooltip_content">Calculated as ${unit.MIN_INCOME_RENT_FACTOR} times yearly rent</span></span>`;
    }
    // TODO: Make a "has details" field?
    if (unit.MAX_YEARLY_INCOME_LOW_USD && 
        unit.MAX_YEARLY_INCOME_HIGH_USD &&
        (unit.MAX_YEARLY_INCOME_HH_1_USD ||
         unit.MAX_YEARLY_INCOME_HH_2_USD ||
         unit.MAX_YEARLY_INCOME_HH_3_USD ||
         unit.MAX_YEARLY_INCOME_HH_4_USD ||
         unit.MAX_YEARLY_INCOME_HH_5_USD ||
         unit.MAX_YEARLY_INCOME_HH_6_USD ||
         unit.MAX_YEARLY_INCOME_HH_7_USD ||
         unit.MAX_YEARLY_INCOME_HH_8_USD ||
         unit.MAX_YEARLY_INCOME_HH_9_USD ||
         unit.MAX_YEARLY_INCOME_HH_10_USD ||
         unit.MAX_YEARLY_INCOME_HH_11_USD ||
         unit.MAX_YEARLY_INCOME_HH_12_USD)) {
      let detailStrs = [];
      for(idx=0; idx<12; idx++) {
        let householdSize = idx + 1;
        let field = `MAX_YEARLY_INCOME_HH_${householdSize}_USD`;
        let value = unit[field];
        if (!value || (unit.MAX_OCCUPANCY && householdSize > unit.MAX_OCCUPANCY)) {
          continue;
        }
        detailStrs.push(`Household of ${householdSize}: ${formatCurrency(value)}`);
      }
      maxIncomeInfo = `<span class="tooltip_entry"><span class="icon_info"></span><span class="tooltip_content">${detailStrs.join("<br/>")}</span></span>`;
    }
    rows.push(`
      <td>${incomeBracketStr}</td>
      <td>${minIncomeStr} ${minIncomeInfo}</td>
      <td>${maxIncomeStr} ${maxIncomeInfo}</td>
      <td>${rentStr} ${rentInfo}</td>
    `);
  }
  return `<tr>${rows.join("</tr><tr>")}<tr>`;
}


const unitTables = (units) => {
  let tables = [];
  let unitTypes = sortUnitTypes(Object.keys(units.data));
  for (idx in unitTypes) {
    // 'units' is guaranteed to have at least one item for each key
    // based on how it is generated in fetchData. Max occupancy and status
    // should always be the same in every entry for a given rental property &
    // unit type, so just take the first one here.
    let maxOccupancy = units.data[unitTypes[idx]][0].record.MAX_OCCUPANCY || NO_MAX_OCCUPANCY_STRING;
    let openStatus = units.data[unitTypes[idx]][0].record.STATUS;
    let statusBadgeClass = "badge__warn";
    if (openStatus === "Waitlist Closed") {
      statusBadgeClass = "badge__bad";
    } else if (openStatus === "Waitlist Open") {
      statusBadgeClass = "badge__ok";
    }
    tables.push(`
      <h3>${unitTypes[idx] == "undefined" ? "" : unitTypes[idx]}<span class="badge ${statusBadgeClass}">${openStatus}</span></h3>
      Maximum occupancy: ${maxOccupancy}
      <table>
        <thead>
          <tr>
            <th>Income bracket</th>
            <th>Min income (per year)</th>
            <th>Max income (per year)</th>
            <th>Rent (per month)</th>
          </tr>
        </thead>
        <tbody>
        ${unitDetails(units.data[unitTypes[idx]])}
        </tbody>
      </table>
    `);
  }
  return `
      ${metaData(units)}
      ${tables.join("")}
  `;
};


// Lookup data for this item from the Airtable API
const fetchData = async(housingID) => {
  const table = base(UNITS_TABLE);
  return table.select({
      view: "API all units",
      filterByFormula: `{ID (from Housing)} = "${housingID}"`
    })
    .all()
    .then(records => {
      let units = {"metadata": {"notesData": {}}, "data": []};
      if (records[0]){
        units.metadata["aptName"] = (
          records[0].fields["APT_NAME"]?.[0]|| "");
        units.metadata["Address"] = (
          records[0].fields["Address (from Housing)"]?.[0]|| "");
        units.metadata["City"] = (
          records[0].fields["City (from Housing)"]?.[0]|| "");
        units.metadata["Units"] = (
          records[0].fields["UNITS_CNT (from Housing)"]?.[0]|| "");
        units.metadata["Email"] = (
          records[0].fields["EMAIL (from Housing)"]?.[0]|| "");
        units.metadata["Phone"] = (
          records[0].fields["Phone (from Housing)"]?.[0]|| "");
        units.metadata["Website"] = (
          records[0].fields["URL (from Housing)"]?.[0]|| "");
        units.metadata.notesData["_POPULATIONS_SERVED"] = (
          records[0].fields["_POPULATIONS_SERVED"]);
        units.metadata.notesData["_MIN_RESIDENT_AGE"] = (
          records[0].fields["_MIN_RESIDENT_AGE"]?.[0]|| "");
        units.metadata.notesData["_MAX_RESIDENT_AGE"] = (
          records[0].fields["_MAX_RESIDENT_AGE"]?.[0]|| "");
        units.metadata.notesData["_PREFERS_LOCAL_APPLICANTS"] = (
          records[0].fields["_PREFERS_LOCAL_APPLICANTS"]?.[0]|| "");
        units.metadata.notesData["_DISALLOWS_PUBLIC_APPLICATIONS"] = (
          records[0].fields["_DISALLOWS_PUBLIC_APPLICATIONS"]?.[0]|| "");
      }
      for (record in records) {
        let unitKey = records[record].fields.TYPE;
        units.data[unitKey] = units.data[unitKey] || [];
        units.data[unitKey].push({record: records[record].fields});
      }
      return units;
    });
};




exports.handler = async function(event) {

  // get the housing ID from the URL
  const housingID = event.path.split("affordable-housing/")[1];
  
  // // determine if we'll return a view of the json data
  const json = event.path.startsWith("/data/");

  // Look up the property in the DB
  let data = await fetchData(housingID);
  console.log(data);
  if (json) {
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        "Content-type": "application/json"
      }
    };
  } else {
    const units = unitTables(data);
    return {
      statusCode: 200,
      body: pageTemplate(units)
    };
  }
};
