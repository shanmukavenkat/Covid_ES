const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'covid19India.db');
let db = null;

const initializationDbserver = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log('The server is running at http://localhost:3000');
    });
  } catch (e) {
    console.log(`DB Server Error: ${e.message}`);
    process.exit(1);
  }
};

initializationDbserver();

// Convert snake_case to camelCase
const toCamelCase = (snakeCase) => {
  const camelCaseObj = {};
  for (const key in snakeCase) {
    if (snakeCase.hasOwnProperty(key)) {
      const camelCaseKey = key.replace(/_([a-z])/g, (match, letter) =>
        letter.toUpperCase()
      );
      camelCaseObj[camelCaseKey] = snakeCase[key];
    }
  }
  return camelCaseObj;
};

// Returns a list of all states in the state table
app.get('/states/', async (request, response) => {
  const getStates = `SELECT * FROM state`;
  const theData = await db.all(getStates);
  response.send(theData.map(toCamelCase));
});

// Returns a state based on the state ID
app.get('/states/:stateId/', async (request, response) => {
  const { stateId } = request.params;
  const getState = `
    SELECT * 
    FROM state 
    WHERE state_id = ${stateId};
  `;
  const fetchData = await db.get(getState);
  response.send(toCamelCase(fetchData));
});

// Update district details
app.put('/districts/:districtId/', async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateData = `
    UPDATE district
    SET
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE
      district_id = ${districtId};
  `;

  await db.run(updateData);
  response.send('District Details Updated');
});

// Get statistics of a specific state
app.get('/states/:stateId/stats/', async (request, response) => {
  const { stateId } = request.params;

  const getStateStatsQuery = `
    SELECT 
      SUM(cases) AS totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = ${stateId};
  `;

  const stats = await db.get(getStateStatsQuery);
  response.send(toCamelCase(stats));
});

// Get state name from district ID
app.get('/districts/:districtId/details/', async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    SELECT state_id FROM district 
    WHERE district_id = ${districtId};
  `;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
    SELECT state_name AS stateName 
    FROM state 
    WHERE state_id = ${getDistrictIdQueryResponse.state_id};
  `;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

// Delete a district
app.delete('/districts/:districtId/', async (request, response) => {
  const { districtId } = request.params;
  const deleteData = `
    DELETE
    FROM district
    WHERE district_id = ${districtId};
  `;

  await db.run(deleteData);
  response.send('District Removed');
});

// Add a new district
app.post('/districts/', async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const addDistrictQuery = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
  `;

  await db.run(addDistrictQuery);
  response.send('District Successfully Added');
});

// Get district details
app.get('/districts/:districtId/', async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * 
    FROM district 
    WHERE district_id = ${districtId};
  `;
  const district = await db.get(getDistrictQuery);
  response.send(toCamelCase(district));
});

module.exports = app;
