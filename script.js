//--Set up the globals-----------------------------------
var glblData = []; //global json object holding info about each TRR from all backends
var glblPlatforms = []; //global json object holding info about all supported platforms, including short name and long

// global json object defining the backends feeding the library
// will be read from the backends.json file in the root of the repo
// "Name" is the name of source as you want to show in the results
// "BaseUrl" is the URL to the main branch in the GitHub repo
// "RawIndexBaseUrl" is the URL (if remote) or path (if internal) of foldler holding the platforms.json and index.json for the backend.
import glblBackends from "./backends.json" with { type: 'json' };

//Define the base URL for the main TRR repo backend. Used to build links to reference docs.
const glblLibraryBaseUrl = "https://github.com/tired-labs/techniques/tree/main/"

//Define Mitre tactics in the order we want them to appear in the matrix
//This is needed because the tactics data has no inherent order
const glblOrderedTactics = [
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Command and Control",
  "Inhibit Response Function",
  "Inhibit Process Control",
  "Exfiltration",
  "Impact",
]

//--Define functions-----------------------
 
/**
*Asynchronous function to fetch backend data. Fetches the platforms.json and index.json from each backend. Retrns a combined JSON object containing both the platforms and index JSON objects for the backend.
* @param {backend} - A JSON definition of a repo backend
**/
async function fetchBackendData(backend) {
    const platformUrl = backend.RawIndexBaseUrl + "platforms.json";
    const indexUrl = backend.RawIndexBaseUrl + "index.json";
    try {
      //get the TRR index and supported platforms from the backend
      //by using await here, we wait until the promise is fulfilled and we have the data to proceed.
      var indexData = await fetch(indexUrl).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status:  ${response.status}`);
        }
        const json = response.json();
        //we now have a promise, return it
        return json
      });

      //get the platform data from the backend
      var platformData = await fetch(platformUrl).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status:  ${response.status}`);
        }
        const json = response.json();
        //we now have a promise, return it
        return json
      });

      if (platformData !== null && indexData != null) {
        //we have all needed data for the backend, return it
        var returnBackend = {
          "platforms":platformData,
          "index":indexData
        }
        return returnBackend;
      } else {
        console.log("Unknown problem fetching backend data.");
      }
    } catch (error) {
      console.error("Error fetching backend data:", error);
    }
}

/**
*Adds new JSON object of supported platforms to the global platform object
* @param {platformArray} - JSON object of supported platforms
**/
function addPlatforms(platformArray){
  //add the new platforms to the existing set if not already defined
  glblPlatforms = { ...glblPlatforms, ...platformArray };
}

//function takes in an array of TRR data and enriches it the source repo.
//and the base url to build a link to the TRR in its repo
function enrichData(backend, inData){
  inData.forEach(item => {
    //add the link to the TRR in its source repo
    item['base_url']=backend.BaseUrl;
    item['source_repo']=backend.Name;
  }); //end forEach inData item
}

//function to hide the intro text box.
function hideIntro() {
  var x = document.getElementById("intro-container");
  var y = document.getElementById("showIntro");
  x.style.display="none";
  y.style.display="block";
}

//function to show the intro text box.
function showIntro() {
  var x = document.getElementById("intro-container");
  var y = document.getElementById("showIntro");
  x.style.display="block";
  y.style.display="none";
}

/**
 * Renders the table rows based on the provided data array.
 * @param {Array} data - Array of data objects to display in the table.
 */
function renderTable(data) {
  // Select the table body element where rows will be inserted
  const tableBody = document.querySelector('#dataTable tbody');
  // Clear any existing content in the table body to avoid duplication
  tableBody.innerHTML = '';

  // Iterate over each item in the data array
  data.forEach(item => {
    // Create a new table row element
    const row = document.createElement('tr');
    
    //set up each row using the right json values
    //clicking on the row opens a new window with the TRR.
    row.onclick = function() { window.open(item['base_url'] + "reports/" + item['id'].toLowerCase() + "/" + glblPlatforms[item['platforms'][0]])};
    //create the Primary ID cell
    const IDCell = document.createElement('td');
    IDCell.textContent = item['id'];
    row.appendChild(IDCell);
    //create the Secondary ID cell
    const ExtIDCell = document.createElement('td');
    ExtIDCell.textContent = item['external_ids'].join(", ");
    row.appendChild(ExtIDCell);
    //create the Name cell
    const NameCell = document.createElement('td');
    NameCell.textContent = item['name'];
    row.appendChild(NameCell);
    //create the Platform cell
    const PlatformCell = document.createElement('td');
    PlatformCell.textContent = item['platforms'].join(", ");
    row.appendChild(PlatformCell);
    //create the Procedures cell
    const ProceduresCell = document.createElement('td');
    ProceduresCell.className = "left";
    var strProcedures = "";
    for (const key in item['procedures']) {
      strProcedures = strProcedures + key + ": " + item['procedures'][key] + "\n";
    }
    ProceduresCell.textContent = strProcedures;
    row.appendChild(ProceduresCell);
    //create the Source cell
    const SourceCell = document.createElement('td');
    SourceCell.textContent = item['source_repo'];
    row.appendChild(SourceCell);
    // Append the completed row to the table body
    tableBody.appendChild(row);
  });
}

/**
 * Handles the search functionality by filtering the data array
 * based on the user's input and re-rendering the table. Uses case
 * insensitive regex to find the search terms in any case and order.
 */
function handleSearch() {
  const query = searchInput.value;   
  const words = query.split(' ');
  var exp = '';
  //build postive lookahead regex for each word in the query
  words.forEach(word => {
    exp += '(?=.*' + word + ')';
  });
  
  const regex = new RegExp(exp, 'i');
  const results = glblData.filter(obj => {
    //regex test the whole object (stringified) so we can match across all values
    return regex.test(JSON.stringify(obj));
  });
   renderTable(results);;
};

/**
 * Handles the sorting functionality by sorting the data array
 * based on the selected column and re-rendering the table.
 * @param {Event} event - The click event triggered by clicking a table header.
 */
function handleSort(event) {
  // Reference to the clicked header element
  const header = event.target;
  // Get the column to sort by from the data attribute
  const column = header.getAttribute('data-column');
  // Get the current sort order (asc or desc) from the class attribute
  const order = header.getAttribute('class');

  // Determine the new sort order by toggling the current order
  const newOrder = order === 'desc' ? 'asc' : 'desc';
  // Update the data-order attribute with the new sort order
  header.setAttribute('class', newOrder);

  // Create a sorted copy of the data array to avoid mutating the original
  const sortedData = [...glblData].sort((a, b) => {
    // Compare the two items based on the selected column
    if (a[column] > b[column]) {
      // Return 1 or -1 based on the sort order
      return newOrder === 'asc' ? 1 : -1;
    } else if (a[column] < b[column]) {
      return newOrder === 'asc' ? -1 : 1;
    } else {
      // Return 0 if the values are equal
      return 0;
    }
  });

  // Re-render the table using the sorted data array
  renderTable(sortedData);
}

//--Perform everything needed for inital setup of the page-------------------------------------

//Fetch data from the backends and process it in to the global vars
console.log("Number of registered backends: ", glblBackends.length);

glblBackends.forEach(backend => {
  fetchBackendData(backend).then(backendData =>{
    if (backendData != null) {
      //First update the platforms global with the new supported platforms
      addPlatforms(backendData.platforms);
      //enrich the data
      enrichData(backend, backendData.index);
      //then add the index data to the data global
      glblData = glblData.concat(backendData.index);
      //console.log("The post-enriched data is", glblData);
      //then we render the matrix
      renderTable(glblData);
    } else {
      console.log("Error loading data from backend: ", backend);
    }
  });
});//end forEach backend

// Add an event listener to handle input changes in the search field
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('keyup', handleSearch);

// Select all table header cells that are sortable
const headers = document.querySelectorAll('th');
// Add a click event listener to each sortable header cell to enable sorting
headers.forEach(header => {
  if (header.className != "nosort") {header.addEventListener('click', handleSort)}
});
document.getElementById ("hideIntroX").addEventListener ("click", hideIntro);
document.getElementById ("showIntro").addEventListener ("click", showIntro);
document.getElementById("TRRGuideRef").href=glblLibraryBaseUrl+"docs/TECHNIQUE-RESEARCH-REPORT.md";
document.getElementById("ProjOverviewRef").href=glblLibraryBaseUrl+"docs/PROJECT-OVERVIEW.md";
document.getElementById("FAQRef").href=glblLibraryBaseUrl+"docs/FAQ.md";
document.getElementById("ContribGuide").href=glblLibraryBaseUrl+"docs/CONTRIBUTING.md";
