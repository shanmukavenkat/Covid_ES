const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializationDbserver = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('The server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Server Error: ${e.message}`)
    process.exit(1)
  }
}

initializationDbserver()

// Convert snake_case to camelCase
const toCamelCase = snakeCase => {
  const camelCaseObj = {}
  for (const key in snakeCase) {
    if (snakeCase.hasOwnProperty(key)) {
      const camelCaseKey = key.replace(/_([a-z])/g, (match, letter) =>
        letter.toUpperCase(),
      )
      camelCaseObj[camelCaseKey] = snakeCase[key]
    }
  }
  return camelCaseObj
}

// Returns a list of all states in the state table
app.get('/states/', async (request, response) => {
  const getStates = `SELECT * FROM state`
  const theData = await db.all(getStates)
  response.send(theData.map(toCamelCase)) //  send method
})

// Returns a state based on the state ID
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params

  const getState = `
  SELECT * 
  FROM state 
  WHERE state_id = ${stateId};`

  const fetchData = await db.get(getState)
  const camelCase = toCamelCase(fetchData) // Corrected: call toCamelCase directly
  response.send(camelCase) //  send method
})

app.post('/districts/', async (request, response) => {
  const theDistrict = request.body
  const {districtName, stateId, cases, cured, active, deaths} = theDistrict

  const addTheData = ` INSERT INTO 
  district(district_name,state_id,cases,curved,active,deaths)
  VALUES(
    ${districtName},
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  )
  `
  const dbResponse = await db.run(addTheData)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const theData = `SELECT 
  * 
  FROM 
  district
  WHERE
  district_id = ${districtId};`

  const fetchData = await db.get(theData)
  const camelCase = toCamelCase(fetchData)
  response.send(camelCase)
})

//delete the data
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteData = `
  DELETE
  FROM 
  district
  WHERE
  district_id = ${districtId};`

  await db.run(deleteData)
  response.send('District Removed')
})
///update the data
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params;
  const theDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = theDetails;

  const updateData = `
    UPDATE district
    SET
      district_name = ${districtName},
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

//get the data in a counted way

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params

  const getState = `
  SELECT 
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeath
  FROM district
  WHERE state_id = ${stateId};`

  const stats = await db.get(getState)
  console.log(stats)

  response.send({
    totalCases: stats['totalCases'],
    totalCured: stats['totalCured'],
    totalActive: stats['totalActive'],
    totalDeath: stats['totalDeath'],
  })
})

///get form the two tables
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `
  //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery)
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    ` //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await database.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
}) //sending the required response

module.exports = app
