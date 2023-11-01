import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const port = 8000;
const root = path.join(__dirname, 'public');
const template = path.join(__dirname, 'templates');

const db = new sqlite3.Database(path.join(__dirname, 'energy.sqlite3'), sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log(err)
    } else {
        console.log("Connected to database")
    }
})

const COLUMNS = ["AVG(biomass)",
    "AVG(brown_coal_lignite)",
    "AVG(coal_derived_gas)",
    "AVG(gas)",
    "AVG(hard_coal)",
    "AVG(oil)",
    "AVG(oil_shale)",
    "AVG(peat)",
    "AVG(geothermal)",
    "AVG(hydro_pumped_storage_consumption)",
    "AVG(hydro_run_of_river_and_poundage)",
    "AVG(hydro_water_reservoir)",
    "AVG(marine)",
    "AVG(nuclear)",
    "AVG(other)",
    "AVG(other_renewable)",
    "AVG(solar)",
    "AVG(waste)",
    "AVG(wind_offshore)",
    "AVG(wind_onshore)",
    "AVG(price_actual)"]

function dbSelect(query, params) {
    let p = new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    })
}

let app = express();
app.use(express.static(root));

app.get('/test/', (req, res) => {
   
    const query = "SELECT * FROM energy;"

    let result = dbSelect(query, [])

    console.log(result)
})

app.get('/prices/:price', (req, res) => {
    const price = req.params.price;
    const prices = price.split("_")
    const minRange = parseInt(prices[0])
    const maxRange = parseInt(prices[1])

    const query = `SELECT ${COLUMNS} FROM energy WHERE price_actual > ? AND price_actual < ?;`

    let result = dbSelect(query, [prices[0], prices[1]])
})

app.get('/fuels/:fuel', (req, res) => {
    const fuel = req.params.fuel.toLowerCase();

    const fuelMap = new Map();
    fuelMap.set('coal', ["AVG(brown_coal_lignite)", "AVG(coal_derived_gas)", "AVG(hard_coal)"])
    fuelMap.set('oil_gas', ["AVG(gas)", "AVG(oil)", "AVG(oil_shale)"])
    fuelMap.set('wind', ["AVG(wind_offshore)", "AVG(wind_onshore)"])
    fuelMap.set('hydro', ["AVG(hydro_pumped_storage_consumption)", "AVG(hydro_run_of_river_and_poundage)", "AVG(hydro_water_reservoir)"])
    fuelMap.set('other_renewable', ["AVG(solar)", "AVG(nuclear)", "AVG(other_renewable)"])
    fuelMap.set('other_fossile', ["AVG(biomass)", "AVG(waste)", "AVG(peat)"])

    const query = `SELECT ${fuelMap[fuel]} FROM energy_data;`
})

app.get('/time/:hr', (req, res) => {
    const hour = req.params.hr;

    const query = `SELECT ${COLUMNS} FROM energy_data WHERE Time = ?;`

    let result = dbSelect(query, hour)

})


app.listen(port, () => {
    console.log('Now listening on port ' + port);
});

