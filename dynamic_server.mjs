import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import * as Plotly from 'plotly';

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

    const COLUMNS_NONAVG = ["biomass",
    "brown_coal_lignite",
    "coal_derived_gas",
    "gas",
    "hard_coal",
    "oil",
    "oil_shale",
    "peat",
    "geothermal",
    "hydro_pumped_storage_consumption",
    "hydro_run_of_river_and_poundage",
    "hydro_water_reservoir",
    "marine",
    "nuclear",
    "other",
    "other_renewable",
    "solar",
    "waste",
    "wind_offshore",
    "wind_onshore",
    "price_actual"]

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
    return p
}

function openTemplate() {
    let p = new Promise((resolve, reject) => {
        fs.readFile(path.join(template, 'temp.html'), 'utf-8', (err,data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        })
    })
    return p
}

let app = express();
app.use(express.static(root));

app.get('/test/', (req, res) => {
   
    const query = "SELECT * FROM energy;"

    let result = dbSelect(query, [])

    console.log(result)
})

//price format is MIN_MAX
app.get('/prices/:price', (req, res) => {
    const price = req.params.price;
    const prices = price.split("_")

    const URL_PARAMS = ['0_10', '10_20', '20_30', '30_40', '40_50', '50_60', '60_70', '70_80', '80_90', '90_100', '100_110', '110_120']

    const COLUMN_NAMES = ["Biomass", "Brown coal/Lignite", "Coal Derived Gas", "Gas", "Hard Coal", "Oil", "Oil Shale", "Peat", 
    "Geothermal", "Hydro Pumped Storage Consumption", "Hydro Run of River and Poundage", "Hydro Water Resevoir", "Marine", 
    "Nuclear, Other, Other_Renewable, Solar, Waste, Wind Offsh0re, Wind Onshore, Actual Price"]

    const query = `SELECT ${COLUMNS_NONAVG} FROM energy WHERE price_actual > ? AND price_actual < ?;`;
    let p1 = dbSelect(query, [prices[0], prices[1]]);
    p1.then((data, err) => {
        fillTable(data, COLUMN_NAMES, "Time", res)
    })
});

app.get('/fuels/:fuel', (req, res) => {
    const fuel = req.params.fuel.toLowerCase();

    const fuelMap = new Map();
    fuelMap.set('coal', ["AVG(brown_coal_lignite)", "AVG(coal_derived_gas)", "AVG(hard_coal)"])
    fuelMap.set('oil_gas', ["AVG(gas)", "AVG(oil)", "AVG(oil_shale)"])
    fuelMap.set('wind', ["AVG(wind_offshore)", "AVG(wind_onshore)"])
    fuelMap.set('hydro', ["AVG(hydro_pumped_storage_consumption)", "AVG(hydro_run_of_river_and_poundage)", "AVG(hydro_water_reservoir)"])
    fuelMap.set('other_renewable', ["AVG(solar)", "AVG(nuclear)", "AVG(other_renewable)"])
    fuelMap.set('other_fossil', ["AVG(biomass)", "AVG(waste)", "AVG(peat)"])

    const COLUMN_NAMES = new Map();
    COLUMN_NAMES.set('coal', ["Brown Coal Lignite", "Coal Derived Gas", "Hard Coal"])
    COLUMN_NAMES.set('oil_gas', ["Gas", "Oil", "Oil Shale"])
    COLUMN_NAMES.set('wind', ["Wind Offshore", "Wind Onshore"])
    COLUMN_NAMES.set('hydro', ["Hydro Pumped Storage Consumption", "Hydro Run Of River and Poundage", "Hydro Water Reservoir"])
    COLUMN_NAMES.set('other_renewable', ["Solar", "Nuclear", "Other Renewable"])
    COLUMN_NAMES.set('other_fossil', ["Bbiomass", "Waste", "Peat"])

    const URL_PARAMS = ['coal', 'oil_gas', 'wind', 'hydro', 'other_renewable', 'other fossil']

    const query = `SELECT ${fuelMap.get(fuel)} FROM energy;`

    console.log(fuel, fuelMap.get(fuel))
    let p1 = dbSelect(query, []);
    p1.then((data, err) => {
        fillTable(data, COLUMN_NAMES.get(fuel), "Fuels", res)
    })
});

app.get('/time/:hr', (req, res) => {
    const hour = req.params.hr;

    const HOUR_PARAMS = ["0:00:00", "1:00:00", "2:00:00", "3:00:00", 
    "4:00:00", "5:00:00", "6:00:00", "7:00:00", "8:00:00", "9:00:00", 
    "10:00:00", "11:00:00", "12:00:00", "13:00:00", "14:00:00", "15:00:00", 
    "16:00:00", "17:00:00", "18:00:00", "19:00:00", "20:00:00", "21:00:00", 
    "22:00:00", "23:00:00"]

    const COLUMN_NAMES = ["Biomass", "Brown Coal Lignite", "Coal Derived Gas", "Gas", "Hard Coal", "Oil", "Oil Shale", "Peat", 
    "Geothermal", "Hydro Pumped Storage Consumption", "Hydro Run of River and Poundage", "Hydro Water Resevoir", "Marine", 
    "Nuclear", "Other", "Other_Renewable", "Solar", "Waste", "Wind Offshore", "Wind Onshore", "Actual Price"]

    const query = `SELECT ${COLUMNS_NONAVG} FROM energy WHERE Time = ?;`


    let p1 = dbSelect(query, hour);

    p1.then((data, err) => {
        fillTable(data, COLUMN_NAMES, "Time", res)
    }
    )
})

let fillTable = function(energyData, columns, title, res) {
    fs.readFile(path.join(template, 'temp.html'), 'utf-8', (err,data) => {
        if (err) {
            throw err
        }

        let tableHeader = "<tr> \n";

        columns.forEach((column) => {
            tableHeader += `<th>${column}</th> \n`
        })
        tableHeader += "</tr> \n"


        let tableBody = "";

        energyData.forEach((row) => {
            tableBody += "<tr>\n"
            for (const val of Object.values(row)) {
                tableBody += `<td>${val}</td> \n`
            }
            tableBody += "</tr>\n"

        })
        let table = `<table>${tableHeader} ${tableBody}</table>`

        let response = data.replace('$$DATA_TITLE$$', title)
        response = response.replace('$$DATA_TABLE$$', table)

        if (title == "Fuels") {
            const xArray = [COLUMN_NAMES.get(fuel)];
            const yArray = [fuelMap.get(fuel)];
            const data = [{
                x: xArray,
                y: yArray,
                type: "bar",
                orientation:"h",
                marker: {color:"rgba(0,0,255)"}
            }];
            const layout = {title:"Average Energy Generated By" + fuel};
            response = response.replace("$$DATA_IMG$$", Plotly.newPlot("plot", data, layout))
        }
        
        res.status(200).type("html").send(response)    
    })
}


app.listen(port, () => {
    console.log('Now listening on port ' + port);
});