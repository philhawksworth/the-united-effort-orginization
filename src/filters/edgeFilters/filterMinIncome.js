// TODO: Fully express all the logic for qualifying based on income

export default function (collection, value, includeUnknown) {
  return collection.filter(obj => {
    return obj.units.some(unit => {
      // if the units hold no value, include it instead of rejecting it if told to do so.
      if (!unit.MAX_YEARLY_INCOME_HH_1_USD && includeUnknown) return true;      
      return Number(unit.MAX_YEARLY_INCOME_HH_1_USD) >= Number(value)
    });
  });
}


/*

if (income) {
  let incomeMinParams = [`{MIN_YEARLY_INCOME_USD} <= '${income}'`];
  let incomeMaxParams = [`{MAX_YEARLY_INCOME_HIGH_USD} >= '${income}'`];
  let incomeOp = "OR";
  if (includeUnknownIncome) {
    incomeMinParams.push(`NOT({MIN_YEARLY_INCOME_USD} & "")`);
    incomeMaxParams.push(`NOT({MAX_YEARLY_INCOME_HIGH_USD} & "")`);
  } else {
    incomeMinParams.push(`({MIN_YEARLY_INCOME_USD} & "")`);
    incomeMaxParams.push(`({MAX_YEARLY_INCOME_HIGH_USD} & "")`);
    incomeOp = "AND"
  }
  parameters.push(
    `AND(${incomeOp}(${incomeMinParams.join(",")}),` +
    `${incomeOp}(${incomeMaxParams.join(",")}))`);
}

*/
