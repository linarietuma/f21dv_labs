// Code By: Lina Rietuma (H00361943)
//  Finished On: 08/04/2022


// reference: https://medium.datadriveninvestor.com/getting-started-with-d3-js-maps-e721ba6d8560
const promises = []
let population;
let mortality;
let gdp;
let life_exp;
let young_births;
let gdp_per_capita;
let data_changed = true;
let yData;
let bubbleUpdate;
let combo;
let year = 1960;
let key = 'mortality';
let key_name = { mortality: 'Mortality', life_expectancy: 'Life Expectancy', young_births: 'Births' }
let y_label = { mortality: 'Child Mortality (under 5s) per 1000', life_expectancy: "Female Life Expectancy", young_births: "Adolescent Births" }

// colour palette: https://coolors.co/palette/f94144-f3722c-f8961e-f9844a-f9c74f-90be6d-43aa8b-4d908e-577590-277da1

// -------------------------------------------- Radio Button Function -------------------------------------------

function dataChanged(data_type) {
    key = data_type;
    bubbleUpdate(combo, year);
}


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
        .width(xSize - 60)
        .tickFormat(d3.format('d'))
        .on('onchange', val => {
            // update the bubble chart 
            bubbleUpdate(combo, val);
            // update the global year variable
            year = val;
        });

    // add svg container 
    const gTime = d3
        .select('.slider-year')
        .append('svg')
        .attr('width', xSize)
        .attr('height', ySize)
        .append('g')
        .attr('transform', 'translate(40,30)');


    function update(data) {

        // add the slider 
        gTime.transition()
            .duration(1000).call(slider);

        // format the slider 
        d3.select('.parameter-value').attr("font-family", "Montserrat").select('text').attr('font-size', 15)
        d3.select('.track').attr('stroke-width', 8).attr("stroke", "black")
        d3.select('.track-inset').attr("stroke", "#5D7565")
        d3.select(".handle").attr("fill", "#84B082").attr("stroke", "black").attr("stroke-width", 2)

    }
    return update;
}

// --------------------------------------------------- Find Max Function --------------------------------------------------------

// find min/ max for the y axis
function findMinMax(data, data_key) {

    let min = 100000;
    let max = 0;

    data.forEach(c => {
        Object.keys(c).forEach(key => {
            // the key is a year
            if (key.length == 4) {
                if (!isNaN(c[key][data_key])) {
                    let value = parseFloat(c[key][data_key])
                    if (value > max) {

                        max = value;
                    } else if (value < min) {
                        min = value;
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
    const height = ySize - 2.5 * margin;

    // add a SVG container
    const svg = d3.select(".chart")
        .append("svg")
        .attr('width', xSize)
        .attr('height', ySize)
        .append("g")
        .attr("transform", "translate(" + margin + "," + 1.5 * margin + ")")

    svg.append("rect")
        .attr("height", height)
        .attr("width", width)
        .attr("fill", "none")
        .attr("class", "chartBack");

    const extentX = findMinMax(combo, 'gdp_per_capita');
    const minX = extentX[0];
    const maxX = extentX[1];


    // initialise x axis
    const x = d3.scaleSqrt().range([0, width]).domain([minX - 100, maxX]);
    var xAxis = d3.axisBottom().scale(x).tickFormat(d3.format(".2s"));;

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "xAxis")


    svg.selectAll(".xAxis").transition().duration(1000).call(xAxis);

    // initialise y axis
    var y = d3.scaleLinear().range([height, 0]);
    var yAxis = d3.axisLeft().scale(y);
    svg.append("g")
        .attr("class", "yAxis");


    // text label for the x axis
    svg.append("text")
        .attr("transform",
            "translate(" + width / 2 + " ," +
            height * 1.09 + ")")
        .style("text-anchor", "middle")
        .text("GDP per Capita (in US $)")
        .attr("font-size", "12px");

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin / 1.5)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("class", "yLabel");

    const rExtent = findMinMax(combo, 'population');
    let minR = rExtent[0];
    let maxR = rExtent[1];

    const r = d3.scaleSqrt().range([4, 50]).domain([minR, maxR]);

    // add initial circles
    svg.append("g").attr("class", "bubbleArea").selectAll("circle")
        .data(combo)
        .enter()
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 0)

    svg.append('text')
        .style("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height / 1.5)
        .attr("font-size", "150px")
        .attr("class", "year")
        .attr("fill", "white")


    // ------------- Tooltip ----------------
    const onHover = svg.append("g")
        .attr("class", "hover")
        .style("display", "none");

    // add tooltip background
    onHover.append("rect")
        .attr("class", "tooltip")
        .attr("fill", "white")
        .attr("width", 180)
        .attr("height", 90)
        .attr("opacity", 0.85)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

    onHover.append("text")
        .attr("class", "tooltip-country")
        .attr("x", 18)
        .attr("y", -2)
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

    // add tooltip text/ placeholder text
    onHover.append("text")
        .attr("x", 18)
        .attr("y", 18)
        .text(`${key_name[key]}:`)
        .attr("font-size", "12px")
        .attr("class", "tooltip-data")
    onHover.append("text")
        .attr("class", "tooltip-mortality")
        .attr("x", 119)
        .attr("y", 18)
        .attr("font-size", "12px");
    onHover.append("text")
        .attr("x", 18)
        .attr("y", 38)
        .text("Population: ")
        .attr("font-size", "12px");
    onHover.append("text")
        .attr("class", "tooltip-population")
        .attr("x", 119)
        .attr("y", 38)
        .attr("font-size", "12px");

    onHover.append("text")
        .attr("x", 18)
        .attr("y", 58)
        .text("GDP per Capita:")
        .attr("font-size", "12px");
    onHover.append("text")
        .attr("class", "tooltip-gdp")
        .attr("x", 119)
        .attr("y", 58)
        .attr("font-size", "12px");


    function positionTooltip(e, d) {
        let coords = d3.pointer(e);
        // reposition the tooltip to the left if country is close to the tight edge of the container 
        if ((x(d[year]['gdp_per_capita']) > 0.5 * width) && (y(d[year][key]) > 0.5 * height)) {
            onHover.attr("transform", `translate(${coords[0] - 200}, ${coords[1] - 60})`)
        } else if ((x(d[year]['gdp_per_capita']) > 0.5 * width) && (y(d[year][key]) < 0.5 * height)) {
            onHover.attr("transform", `translate(${coords[0] - 200}, ${coords[1]})`)
        } else if ((x(d[year]['gdp_per_capita']) < 0.5 * width) && (y(d[year][key]) > 0.5 * height)) {
            onHover.attr("transform", `translate(${coords[0]}, ${coords[1] - 60})`)
        } else if ((x(d[year]['gdp_per_capita']) < 0.5 * width) && (y(d[year][key]) < 0.5 * height)) {
            onHover.attr("transform", `translate(${coords[0]}, ${coords[1]})`)
        }

    }

    function showTooltip(e, d) {

        d3.select(this).raise()
        onHover.style("display", null);
        onHover.select(".tooltip-country").text(d.country_name)
        onHover.select(".tooltip-population").text(d[year]['population'])
        onHover.select(".tooltip-gdp").text(d[year]['gdp_per_capita'].toFixed(1))
        onHover.select(".tooltip-mortality").text(d[year][key])

        positionTooltip(e, d);

    }

    function mouseMove(e, d) {
        positionTooltip(e, d)
    }

    function hideTooltip(e, d) {
        d3.select(this).lower()
        onHover.style("display", "none");

    }


    function update(data, year) {

        if (data_changed) {
            // find min/max values for both axis

            const extentY = findMinMax(combo, key);
            const minY = extentY[0];
            const maxY = extentY[1];
            if (key == 'life_expectancy') {
                // define the new domain for y axis 
                y.domain([minY, maxY]);
            } else {
                // define the new domain for y axis 
                y.domain([maxY, minY]);

            }


            svg.selectAll(".yAxis")
                .transition()
                .duration(1000)
                .call(yAxis);

            svg.selectAll(".yLabel").text(y_label[key]);
            svg.select(".tooltip-data").text(`${key_name[key]}:`);
        }

        // Add dots
        let circles = svg.select('.bubbleArea')
            .selectAll("circle")
            .data(data)
        // remove unnecessary circles 
        circles.exit().remove();
        // create circle objects for the additional data points
        circles.enter().append("circle").attr("r", 0)

        circles
            .transition()
            .duration(100)
            .attr("r", d => {

                if ((isNaN(d[year][key])) || (isNaN(d[year]['gdp_per_capita'])) || (isNaN(d[year]['population']))) {
                    return 0;
                } else {
                    return r(parseInt(d[year]['population']));
                }
            })
            .transition()
            .duration(1000)
            .attr("cx", d => { return x(d[year]['gdp_per_capita']); })
            .attr("cy", d => { return y(parseFloat(d[year][key])); })

            .attr("fill", "#5D7565")
            .attr("stroke", "black")
            .attr("opacity", 0.5)


        circles.on("mouseover", showTooltip)
            .on("mouseleave", hideTooltip)
            .on("mousemove", mouseMove);

        // change the text label in the centre of the chart
        svg.select(".year").transition().duration(500).text(year).attr("opacity", 0.1).attr("fill", "black")
        svg.select(".year").lower()


    }

    return update;
}

function findGDPerCapita() {

    const gdp_per_capita = [];

    gdp.forEach((c, i) => {
        let el = []
        Object.keys(c).forEach(key => {
            // the key is a year
            if (key.length == 4) {
                // if data for the given for the given country exist
                if ((c[key].length != 0) && (population[i][key].length != 0)) {
                    // find the gdp per capita
                    let gdp_per_capita = c[key] / population[i][key];
                    el.push([key, gdp_per_capita]);

                } else {
                    el.push([key, ""]);
                }
            } else {
                el.push([key, c[key]]);
            }
        })
        gdp_per_capita.push(Object.fromEntries(el))
    })

    return gdp_per_capita;
}

function combineData() {
    const combo = []
    population.forEach((c, index) => {
        let el = []

        Object.keys(c).forEach(key => {
            if (key.length == 4) {
                let year = []
                year.push(["population", parseInt(c[key])]);
                year.push(["gdp_per_capita", parseFloat(gdp_per_capita[index][key])]);
                year.push(["mortality", parseFloat(mortality[index][key])]);
                year.push(["life_expectancy", parseFloat(life_exp[index][key])]);
                year.push(["young_births", parseFloat(young_births[index][key])]);

                el.push([key, Object.fromEntries(year)]);
            } else {
                el.push([key, c[key]]);
            }
        })
        combo.push(Object.fromEntries(el))
    })

    return combo;

}




promises.push(d3.csv("data/mortality.csv"))
promises.push(d3.csv("data/population.csv"))
promises.push(d3.csv("data/gdp.csv")) // gdp in current US dollars
promises.push(d3.csv("data/female_life_expectancy.csv"))
promises.push(d3.csv("data/young_fertility.csv"))


// once all promises fulfilled, execute the functions 
let fulfilled = Promise.all(promises).then((data) => {

    mortality = data[0];
    population = data[1];
    gdp = data[2];
    life_exp = data[3];
    young_births = data[4];
    yData = mortality;
    gdp_per_capita = findGDPerCapita();

    combo = combineData();

    const sliderUpdate = createSlider();
    bubbleUpdate = createChart();


    sliderUpdate();
    bubbleUpdate(combo, 1960);



})
