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
  
  //populate the dropdown options with the supported platforms
  const platformSelect = document.getElementById('platformSelect')
  platformSelect.innerHTML = ''; // Clear existing options

  //set up default option of 'all platforms'
  const alloption = document.createElement('option');
  alloption.value = "all";
  alloption.text = "All Platforms";
  platformSelect.appendChild(alloption);

  for (let key in glblPlatforms) {
    const option = document.createElement('option');
    option.value = key;
    option.text = key;
    platformSelect.appendChild(option);
  }
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
*Renders the matrix based on provided data array. This supports showing a filtered view of the data.
* @param {Array} data - Array of objects to display in the matrix
**/
function renderMatrix(matrixData) {
  //First we'll process the data and create our matrix in a multidimensional array.
  //matrix is our array of arrays. We'll index it by tactic using OrderedTactics to find the right element.
  const matrix = new Array(glblOrderedTactics.length);
  //make an array to hold the TRRs for each tactic
  for (var i = 0; i < matrix.length; i++) {
  matrix[i] = new Array();
  }
    
  matrixData.forEach(trr => {
    const trrtactics = trr['tactics']; 
    trrtactics.forEach(tactic => {
      //add the trr object to the array corresponding to the tactic
      matrix[glblOrderedTactics.indexOf(tactic)].push(trr);
    })
  });
  
  //console.log(matrix); 
  const table = document.querySelector('#matrixTable');
  // delete the existing row.
  table.deleteRow(0);
  
  //add a new single row to the matrix table
  const matrixRow = table.insertRow();
  //then add a new td and tacticTable for each tactic
  for (var i = 0; i < matrix.length; i++) {
    const tacticArray = matrix[i];
    if (tacticArray.length > 0) { //there are TRRs for the tactic
      //this a cell in the matrixTable's single row that holds the tactic's table
      const holdingCell = matrixRow.insertCell();    
      //create a new table of class tacticTable
      const tacticTable = document.createElement('table');
      tacticTable.className = "tacticTable";
      const th = document.createElement('th');
      tacticTable.append(th);
      th.innerHTML = glblOrderedTactics[i];
      
      //create a new tr and td for each item
      tacticArray.forEach(trrEntry => {
        const tacticRow = tacticTable.insertRow();
        const tacticCell = tacticRow.insertCell();
        tacticCell.innerHTML = trrEntry['name'];
        //make span for tooltip hover
        var hoverSpan = tacticCell.appendChild(document.createElement("span"));
        hoverSpan.className = "tooltiptext";
        hoverSpan.innerHTML= trrEntry['id'] + " (" + trrEntry['source_repo'] + ")<p>" + trrEntry['external_ids'].join(", ") + "</p>";
        
        var link = ""
        //link depends on if it's technique or platform-level
        if (platformSelect.value == "all") {
          //platform-level
          link = (trrEntry['id'].toLowerCase());
        } else {
          //technique-level - link is ID + short platform name (of the first platform, if multiple)
          link = trrEntry['id'].toLowerCase() + "/" + glblPlatforms[trrEntry['platforms'][0]];
        }
        tacticCell.onclick = function() { window.open(trrEntry['base_url'] + "reports/" + link) };
      });
      holdingCell.appendChild(tacticTable);
    }
  }
  //add the row to the table
  table.appendChild(matrixRow);     
}

/**
*Filters the global data object using the platform specified. Returns json object with filtered data.
* @param {String} filterValue - value of the platform to filter for
**/
function filterData(filterValue){
  if (filterValue == "all"){ 
    //render the data for a merged all platforms view
    var filteredData = [];
    const seen = new Set(); //list of TRR IDs already seen
    glblData.forEach(trr => {
      const techID = trr['id'].split(".")[0]; //just the ID, no platform value
      if (seen.has(techID)){
        //merge current trr data with the one already added
        const entry = filteredData.find(item=>item.id==techID);
        var mergedTactics = entry['tactics'].concat(trr['tactics']);
        entry['tactics'] = [...new Set(mergedTactics)];
        var mergedPlatforms = entry['platforms'].concat(trr['platforms']);
        entry['platforms'] = [...new Set(mergedPlatforms)];
        var mergedExtIDs = entry['external_ids'].concat(trr['external_ids']);
        entry['external_ids'] = [...new Set(mergedExtIDs)];
      } else {
        //keep only certain attributes for aggregated view
        const shortEntry = {};
        shortEntry['id'] = techID;
        shortEntry['tactics'] = trr['tactics'];
        shortEntry['platforms'] = trr['platforms'];
        shortEntry['name'] = trr['name'];
        shortEntry['external_ids'] = trr['external_ids'];
        shortEntry['base_url'] = trr['base_url'];
        shortEntry['source_repo'] = trr['source_repo'];
        
        filteredData.push(shortEntry);
        seen.add(techID); //add it to the list of seen TRRs
      }
  });
    return filteredData; 
  }
  //otherwise, make a filtered set that holds just the platform specified
  var filteredData = [];
  glblData.forEach(trr => {
    if (Object.values(trr['platforms']).includes(filterValue)){
      filteredData.push(trr);
    }
  });
  
  return filteredData;
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
      const filtered = filterData("all"); //default view
      renderMatrix(filtered);
    } else {
      console.log("Error loading data from backend: ", backend);
    }
  });
});//end forEach backend


//set up a listener to update the matrix when a new platform is selected
platformSelect.addEventListener("change", function() {
  const selectedValue = this.value;
  const filtered = filterData(selectedValue);
  renderMatrix(filtered);
});

document.getElementById ("hideIntroX").addEventListener ("click", hideIntro);
document.getElementById ("showIntro").addEventListener ("click", showIntro);

//update these to use the main TRR backend.
document.getElementById("TRRGuideRef").href=glblLibraryBaseUrl+"docs/TECHNIQUE-RESEARCH-REPORT.md";
document.getElementById("ProjOverviewRef").href=glblLibraryBaseUrl+"docs/PROJECT-OVERVIEW.md";
document.getElementById("FAQRef").href=glblLibraryBaseUrl+"docs/FAQ.md";
document.getElementById("ContribGuide").href=glblLibraryBaseUrl+"docs/CONTRIBUTING.md";
