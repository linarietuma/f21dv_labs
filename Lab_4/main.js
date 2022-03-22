// colour palette: https://coolors.co/palette/f94144-f3722c-f8961e-f9844a-f9c74f-90be6d-43aa8b-4d908e-577590-277da1

// -------------------------------------------- SLider Function ---------------------------------------------------------------------

function createSlider() {

    // get the dimensions of the user's screen
    let el = document.querySelector(".slider-year");
    let xSize = el.clientWidth - 50;
    let ySize = el.clientHeight - 20;

    let min = 1960;
    let max = 2020;
    let step = 5;

    // range for the slider
    const range = d3.range(min, max, step)

    // create the slider object
    const slider = d3
        .sliderBottom()
        .default(2000)
        .min(min)
        .max(max)
        .default(min)
        .tickValues(range)
        .step(1)
        .width(xSize - 80)
        .tickFormat(d3.format('d'))
        .on('onchange', val => {
            console.log(val)
        });

    // add svg container 
    const gTime = d3
        .select('.slider-year')
        .append('svg')
        .attr('width', xSize)
        .attr('height', ySize)
        .append('g')
        .attr('transform', 'translate(30,30)');


    function update(data) {

        // add the slider 
        gTime.transition()
            .duration(1000).call(slider);

        // format the slider 
        d3.select('.parameter-value').attr("font-family", "Montserrat").select('text').attr('font-size', 15)
        d3.select('.track').attr('stroke-width', 8).attr("stroke", "black")
        d3.select('.track-inset').attr("stroke", "#277da1")
        d3.select(".handle").attr("fill", "#277da1").attr("stroke", "black").attr("stroke-width", 2)

    }
    return update;
}

// --------------------------------------------------- Find Max Functions --------------------------------------------------------

// find min/max values from the GDP dataset
function findMinMaxGDP() {
    let min = 100000;
    let max = 0;

    gdp.forEach((c, i) => {
        Object.keys(c).forEach(key => {
            // the key is a year
            if (key.length == 4) {
                // if data for the given for the given country exist
                if ((c[key].length != 0) && (population[i][key].length != 0)) {
                    // find the gdp per capita
                    let gdp_per_capita = c[key] / population[i][key];
                    // update min/max values if conditions met
                    if (gdp_per_capita > max) {
                        max = gdp_per_capita;
                    } else if (gdp_per_capita < min) {
                        min = gdp_per_capita;
                    };
                }
            }
        })
    });

    return [min, max];
}

// find min/ max for the y axis
function findMinMax(data) {

    let min = 100000;
    let max = 0;
    console.log(data)
    data.forEach(c => {
        Object.keys(c).forEach(key => {
            // the key is a year
            if (key.length == 4) {
                if (c[key] != undefined) {
                    if (c[key] > max) {
                        max = c[key];
                    } else if (c[key] < min) {
                        min = c[key];
                    }
                }
            }
        })
    });

    return [min, max];
}

// --------------------------------------------------- Bubble Chart Function --------------------------------------------------------

function createChart() {
    // get the dimensions of the user's screen
    let el = document.querySelector(".chart");
    let xSize = el.clientWidth;
    let ySize = el.clientHeight;
    const margin = 70;

    const width = xSize - 1.5 * margin;
    const height = ySize - 1.5 * margin;

    // add a SVG container
    const svg = d3.select(".chart")
        .append("svg")
        .attr('width', xSize)
        .attr('height', ySize)
        .append("g")
        .attr("transform", "translate(" + margin + "," + 0.75 * margin + ")");

    const extentX = findMinMaxGDP();
    const minX = extentX[0];
    const maxX = extentX[1];


    // initialise x axis
    const x = d3.scaleLinear().range([0, width]).domain([minX, maxX]);
    var xAxis = d3.axisBottom().scale(x);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "xAxis");

    svg.selectAll(".xAxis").transition().duration(1000).call(xAxis);

    // initialise y axis
    var y = d3.scaleLinear().range([height, 0]);
    var yAxis = d3.axisLeft().scale(y);
    svg.append("g")
        .attr("class", "yAxis");


    // text label for the x axis
    svg.append("text")
        .attr("transform",
            "translate(" + width/2+ " ," +
            height*1.09 + ")")
        .style("text-anchor", "middle")
        .text("GDP per Capita (in US $)")
        .attr("font-size", "12px");

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin/1.5)
        .attr("x", -height/2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(`Child Mortality (per 1000)`)
        .attr("font-size", "12px");

    function update(data, year) {

        if (data_changed) {
            // find min/max values for both axis
            const extentY = findMinMax(data);
            const minY = extentY[0];
            const maxY = extentY[1];
            // define the new domain for y axis 
            y.domain([minY, maxY]);

            svg.selectAll(".yAxis")
                .transition()
                .duration(1000)
                .call(yAxis);
        }

    }

    return update;
}






// reference: https://medium.datadriveninvestor.com/getting-started-with-d3-js-maps-e721ba6d8560
const promises = []
let population;
let mortality;
let gdp;
let data_changed = true;
let yData;


promises.push(d3.csv("data/mortality.csv"))
promises.push(d3.csv("data/population.csv"))
promises.push(d3.csv("data/gdp.csv")) // gdp in current US dollars


// once all promises fulfilled, execute the functions 
let fulfilled = Promise.all(promises).then((data) => {

    mortality = data[0];
    population = data[1];
    gdp = data[2];
    yData = mortality;

    console.log(gdp)

    const sliderUpdate = createSlider();
    const bubbleUpdate = createChart();


    sliderUpdate();
    bubbleUpdate(yData, 1960);



})
