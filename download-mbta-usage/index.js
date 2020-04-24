const fs = require("fs");
const fetch = require("node-fetch");

const dataStartDate = process.argv[2] || "2019-12-25 00:00:00";
const savedDataPath = process.argv[3] || "../data/MBTA_Gated_Station_Entries.json";

(async () => {
  if (fs.existsSync(savedDataPath)) {
    console.error(`${savedDataPath} already exists`);
    return;
  }

  const data = await fetchAllData(dataStartDate);

  fs.writeFileSync(savedDataPath, JSON.stringify(data));
})();

async function fetchAllData(startDate) {
  const allFeatures = [];
  let done = false;
  while (!done) {
    const resultOffset = allFeatures.length;
    console.log(`Fetching with offset ${resultOffset}`);
    const { features, exceededTransferLimit } = await fetchData(
      startDate,
      resultOffset
    );
    allFeatures.push(...features);
    done = !exceededTransferLimit;
  }
  console.log("Done fetching all data");
  return allFeatures;
}

function getEndpointUrl(startDate, resultOffset) {
  return `https://services1.arcgis.com/ceiitspzDAHrdGO1/arcgis/rest/services/GSE/FeatureServer/0/query?where=service_date >= DATE '${startDate}'&objectIds=&time=&resultType=none&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=${resultOffset}&resultRecordCount=&sqlFormat=none&f=pjson&token=`;
}

function fetchData(startDate, resultOffset) {
  return fetch(getEndpointUrl(startDate, resultOffset)).then((response) => {
    if (response.status === 200) {
      return response.json();
    }
    throw Error(`Failed request with status ${response.status}`);
  });
}
