// Code By: Lina Rietuma (H00361943)
//  Finished On: 08/04/2022

// data
const promises = []
let population;
let gdp;
let gdp_per_capita;
let doughnut_data; // processed data for the doughnut charts
let combo; // combines gdp, population, mortality, life expectancy and young births data

// update functions
let bubbleUpdate; // update function for the bubble chart
// update function for the doughnut charts
let d1DoughnutUpdate;
let d2DoughnutUpdate;
let d3DoughnutUpdate;

// global variables
let year = 1960; // currently selected year on the slider
let key = 'mortality'; // currently selected data source (radio buttons)
let key_name = { mortality: 'Mortality', life_expectancy: 'Life Expectancy', young_births: 'Young Births' }
let y_label = { mortality: 'Child Mortality (under 5s) per 1000', life_expectancy: "Female Life Expectancy", young_births: "Adolescent Births (Ages 15-19) per 1000" }
let clicked_bubble = [];

// colour palette: https://coolors.co/palette/f94144-f3722c-f8961e-f9844a-f9c74f-90be6d-43aa8b-4d908e-577590-277da1

// -------------------------------------------- Radio Button Function -------------------------------------------
// called when radio button clicked/ data type changed
// accepts data_type as argument, either 'mortality', 'life_expectancy' or 'young_births'
function dataChanged(data_type) {
    // update the global variable
    key = data_type;
    // update the bubble chart
    bubbleUpdate(combo, year);
    // change the formatting of the selected doughnut chart svg
    d3.select(".d1").classed("d-selected", () => { return (key == 'mortality') ? true : false })
    d3.select(".d2").classed("d-selected", () => { return (key == 'life_expectancy') ? true : false })
    d3.select(".d3").classed("d-selected", () => { return (key == 'young_births') ? true : false })
    // change the selection of the radio button (relevant if data changed by clicking on the doughnut charts)
    document.getElementById(`${data_type}`).checked = true;
}

// -------------------------------------------- SLider Function ---------------------------------------------------------------------
// created a slider element
// returns an update() function for the slider 
function createSlider() {

    // get the dimensions of the user's screen
    let el = document.querySelector(".slider-year");
    let xSize = el.clientWidth - 50;
    let ySize = el.clientHeight - 20;

    let min = 1960; // min year
    let max = 2019; // max year
    let step = 5; // tick intervals

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
            // update doughnut charts
            d1DoughnutUpdate(val);
            d2DoughnutUpdate(val);
            d3DoughnutUpdate(val);
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

    // slider update function
    function update() {

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

// find min/ max for the axes
// data_key is the selected data type, either 'mortality', 'life_expectancy' or 'young_births'
// returns an array of the min and max values
function findMinMax(data, data_key) {

    let min = 100000;
    let max = 0;
    // data is an array of objects (one per country)
    data.forEach(c => {
        // each country object contains an object for every year in the range 1960 - 2019/2020
        Object.keys(c).forEach(key => {
            // the key is a year
            if (key.length == 4) {
                // if a data value for the given country for the given year exists
                if (!isNaN(c[key][data_key])) {
                    let value = parseFloat(c[key][data_key])
                    // update the min or max value
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
// creates a bubble chart
// return an update() function for the bubble chart
function createChart() {
    // get the dimensions of the user's screen
    let el = document.querySelector(".chart");
    let xSize = el.clientWidth;
    let ySize = el.clientHeight;
    const margin = 70;

    // set the dimensions of the chart
    const width = xSize - 1.5 * margin;
    const height = ySize - 2.5 * margin;

    // add a SVG container
    const svg = d3.select(".chart")
        .append("svg")
        .attr('width', xSize)
        .attr('height', ySize)
        .append("g")
        .attr("transform", "translate(" + margin + "," + 1.5 * margin + ")")

    // ----------------- x axis------------------------------------------

    // find min/max values for the x axis
    const extentX = findMinMax(combo, 'gdp_per_capita'); // returns [min, max]
    const minX = extentX[0];
    const maxX = extentX[1];


    // initialise x axis
    const x = d3.scaleSqrt().range([0, width]).domain([minX - 100, maxX]);
    var xAxis = d3.axisBottom().scale(x).tickFormat(d3.format(".2s"));;

    // add a container for the x axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "xAxis")
    // call the x axis
    svg.selectAll(".xAxis").transition().duration(1000).call(xAxis);


    // text label for the x axis
    svg.append("text")
        .attr("transform",
            "translate(" + width / 2 + " ," +
            height * 1.09 + ")")
        .style("text-anchor", "middle")
        .text("GDP per Capita (in US $)")
        .attr("font-size", "12px");


    // ------------------ y axis ------------------------------------------

    // initialise y axis
    var y = d3.scaleLinear().range([height, 0]);
    var yAxis = d3.axisLeft().scale(y);
    svg.append("g")
        .attr("class", "yAxis");

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin / 1.5)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("class", "yLabel");


    // ------------------- bubbles --------------------------------------

    // find the min/max values for bubble radiuses 
    const rExtent = findMinMax(combo, 'population');
    let minR = rExtent[0];
    let maxR = rExtent[1];
    // create a scale for the radiuses
    const r = d3.scaleSqrt().range([4, 50]).domain([minR, maxR]);

    // add initial circles
    svg.append("g").attr("class", "bubbleArea").selectAll("circle")
        .data(combo)
        .enter()
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 0)
        .classed("visible", true)


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

    // ---------------------------- legend ----------------------------

    // add legend
    const legend = svg.append("g")
        .attr("class", "legend")

    // add legend's background
    legend.append("rect")
        .attr("fill", "white")
        .attr("width", 180)
        .attr("height", 180)
        .attr("opacity", 0.1)
        .attr("x", width / 1.21)
        .attr("y", height / 1.95)

    // add legend markers and text
    legend.append("circle")
        .attr("r", 10)
        .attr("transform", `translate(${width / 1.18}, ${height / 1.7})`)
        .attr("stroke", "black")
        .classed("first_quartile", true)
        .on('click', () => { onClick(['.second_quartile', '.third_quartile', '.fourth_quartile'], '.first_quartile') })
    legend.append("text").text("First Quartile").attr("transform", `translate(${width / 1.16}, ${height / 1.67})`)

    legend.append("circle")
        .attr("r", 10)
        .attr("transform", `translate(${width / 1.18}, ${height / 1.7 + 40})`)
        .attr("stroke", "black")
        .classed("second_quartile", true)
        .on('click', () => { onClick(['.first_quartile', '.third_quartile', '.fourth_quartile'], '.second_quartile') })
    legend.append("text").text("Second Quartile").attr("transform", `translate(${width / 1.16}, ${height / 1.67 + 40})`)

    legend.append("circle")
        .attr("r", 10)
        .attr("transform", `translate(${width / 1.18}, ${height / 1.7 + 80})`)
        .attr("stroke", "black")
        .classed("third_quartile", true)
        .on('click', () => { onClick(['.second_quartile', '.first_quartile', '.fourth_quartile'], '.third_quartile') })
    legend.append("text").text("Third Quartile").attr("transform", `translate(${width / 1.16}, ${height / 1.67 + 80})`)

    legend.append("circle")
        .attr("r", 10)
        .attr("transform", `translate(${width / 1.18}, ${height / 1.7 + 120})`)
        .attr("stroke", "black")
        .classed("fourth_quartile", true)
        .on('click', () => { onClick(['.second_quartile', '.third_quartile', '.first_quartile'], '.fourth_quartile') })
    legend.append("text").text("Fourth Quartile").attr("transform", `translate(${width / 1.16}, ${height / 1.67 + 120})`)

    // center text (i.e., year)
    svg.append('text')
        .style("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height / 1.5)
        .attr("font-size", "150px")
        .attr("class", "year")
        .attr("fill", "white")

    // positions the tooltip relative to its position in the svg, i.e., ensures the tooltip doesn't overflow
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

    // display tooltip on mouseover event 
    function showTooltip(e, d) {
        // bring forward the selected bubble
        d3.select(this).raise()

        onHover.style("display", null); // make the tooltip visible

        // update the tooltip text
        onHover.select(".tooltip-country").text(d.country_name)
        onHover.select(".tooltip-population").text(d[year]['population'])
        onHover.select(".tooltip-gdp").text(d[year]['gdp_per_capita'].toFixed(1))
        onHover.select(".tooltip-mortality").text(d[year][key])

        // position the tooltip
        positionTooltip(e, d);
    }

    // hide tooltip on mouseout event
    function hideTooltip() {
        // bring backwards the selected element (ensures smaller bubbles don't get blocked)
        d3.select(this).lower()
        onHover.style("display", "none"); // hide the tooltip
    }

    // highlight clicked bubble
    function clickBubble(e, d) {
        if (clicked_bubble.includes(d.country_code)) {

            let index = clicked_bubble.indexOf(d.country_code)
            clicked_bubble.splice(index, 1);

            d3.select('.bubbleArea').select(`#${d.country_code}`).classed("bubble_clicked", false);

        } else {
            clicked_bubble.push(d.country_code)
            d3.select('.bubbleArea').select(`#${d.country_code}`).classed("bubble_clicked", true);
        }
    }

    // bubble chart update function
    function update(data, year) {

        // find min/max values for both axis
        const extentY = findMinMax(combo, key);
        let minY = extentY[0];
        let maxY = extentY[1];

        // invert the y axis if data type is life expectancy
        if (key == 'life_expectancy') {
            y.domain([minY, maxY]);
        } else {
            // define the new domain for y axis 
            y.domain([maxY, minY]);
        }

        // update the y axis
        svg.selectAll(".yAxis")
            .transition()
            .duration(1000)
            .call(yAxis);

        // update the label for y axis and the tooltip
        svg.selectAll(".yLabel").text(y_label[key]);
        svg.select(".tooltip-data").text(`${key_name[key]}:`);


        // Add bubbles
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
            .attr("r", d => { // if any of the data points for the given country, for the given year are undefined, set radius to 0

                if ((isNaN(d[year][key])) || (isNaN(d[year]['gdp_per_capita'])) || (isNaN(d[year]['population']))) {
                    return 0;
                } else {
                    return r(parseInt(d[year]['population']));
                }
            })
            .transition()
            .duration(1000)
            .attr("cx", d => { return x(d[year]['gdp_per_capita']); })
            .attr("cy", d => { return y(d[year][key]); })
            .attr("stroke", "black")
            .attr("opacity", 0.5)
            .attr("id", d => d.country_code)


        // determine the formatting of the bubble based on its membership to a quartile 
        circles.classed("bubble_clicked", d => { return clicked_bubble.includes(d.country_code) })
            .classed("first_quartile", d => { return (d[year][key] < minY + (maxY - minY) * 0.25) ? true : false })
            .classed("second_quartile", d => { return ((d[year][key] >= minY + (maxY - minY) * 0.25) && (d[year][key] < minY + (maxY - minY) * 0.5)) ? true : false })
            .classed("third_quartile", d => { return ((d[year][key] >= minY + (maxY - minY) * 0.5) && (d[year][key] < minY + (maxY - minY) * 0.75)) ? true : false })
            .classed("fourth_quartile", d => { return (d[year][key] >= minY + (maxY - minY) * 0.75) ? true : false })
            .classed("visible", true);


        // add action listener functions
        circles.on("mouseover", showTooltip)
            .on("mouseleave", hideTooltip)
            .on("mousemove", positionTooltip)
            .on("click", clickBubble)

        // change the text label in the centre of the chart
        svg.select(".year").transition().duration(500).text(year).attr("opacity", 0.1).attr("fill", "black")
        svg.select(".year").lower()
    }
    return update;
}


// ------------------------------------------- Create Doughnut Chart Function -----------------------------------------
// creates doughnut chart
// accepts DOM element the chart should be added to (DOM), data type (key) and index as arguments
// returns an update() function for the doughnut chart
function createDoughnut(DOM, key, index) {
    // get the dimensions of the user's screen
    let el = document.querySelector(DOM);
    let xSize = el.clientWidth;
    let ySize = el.clientHeight;
    const margin = 20;

    // set the dimensions of the chart
    const width = xSize - margin;
    const height = ySize - margin;
    const radius = Math.min(width, height) / 2;
    // colour palette
    const colors = ["#5D7565", "#885A5A", "#353A47", "#F7C1BB"];
    const current_angle = [] // current angles of the displayed data go here

    // create pie chart
    const pie = d3.pie()
        .sort(null);

    // create individual arc elements
    const arc = d3.arc()
        .innerRadius(radius - 50)
        .outerRadius(radius);

    // create svg element
    const svg = d3.select('.doughnuts').select(DOM)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2 + margin / 2) + ")");

    svg.append("rect")
        .attr("height", ySize)
        .attr("width", xSize)
        .attr("fill", "transparent")
        .attr("transform", "translate(" + (-xSize / 2) + "," + (-ySize / 2) + ")")
        .on('click', () => { dataChanged(key) }) // possible to change data source by clicking on the doughnut chart container

    // initial selection
    d3.select(DOM).classed("d-selected", () => { return (key == 'mortality') ? true : false });

    // find the world average
    let sum = doughnut_data[year]["world_sum"][index];
    let nr_countries = doughnut_data[year][key].reduce((pv, cv) => pv + cv, 0);
    let avg = sum / nr_countries;
    // add the annotation
    svg.append("text").text(avg.toFixed(1)).attr("x", -25).attr("y", 0).attr("font-weight", "bold").attr("font-size", 25).attr("class", "world_avg")
    svg.append("text").text("World Avg").attr("font-size", 10).attr("x", -25).attr("y", 13).attr("class", "world_avg_label")


    // create the donut chart
    let path = svg.selectAll("path")
        .data(pie(doughnut_data[year][key]))
        .enter()
        .append("path")
        .attr("class", "pie")
        .attr("fill", (d, i) => colors[i])
        .attr("d", arc)
        .on("mouseover", (e, d) => {
            // display the % of countries in the hovered quartile/arc
            let nr_countries = doughnut_data[year][key].reduce((pv, cv) => pv + cv, 0)
            let format_percentage = d3.format(",.0%");

            // update the central annotation of the doughnut chart
            svg.select(".world_avg").text(format_percentage(d.data / nr_countries))
            svg.select(".world_avg_label").text("Of Countries")
        })
        .on("mouseout", () => {
            // return the annotation to its original state
            svg.select(".world_avg").text(avg.toFixed(1))
            svg.select(".world_avg_label").text("World Avg")
        })
        .on("click", (e, d) => {
            // on click, update the data type (same as when clicking the legend in the bubble chart)
            let classes = ['.first_quartile', '.second_quartile', '.third_quartile', '.fourth_quartile']
            let clicked = classes[d.index]
            // find which quartile/arc has not been clicked
            let not_clicked = classes.filter(x => { return x !== clicked; })
            onClick(not_clicked, clicked);
        })
        // save the current angle 
        .each(d => { current_angle.push(d); }) // reference: https://bl.ocks.org/mbostock/1346410 
        .transition()
        .duration(1000)
        .attrTween("d", d => {

            const i = d3.interpolate(d.endAngle, d.startAngle);
            return function (t) {
                // update the starting angle
                d.startAngle = i(t);
                return arc(d);
            }
        });

    // update function for a doughnut chart
    function update(year) {
        // recalculate world average
        sum = doughnut_data[year]["world_sum"][index];
        nr_countries = doughnut_data[year][key].reduce((pv, cv) => pv + cv, 0)
        avg = sum / nr_countries
        // update hte central annotation
        svg.select(".world_avg").text(avg.toFixed(1));

        const newData = pie(doughnut_data[year][key])

        // update the chart
        path = svg.selectAll(".pie")
            .data(newData)
            .transition()
            .duration(1000)
            .attrTween("d", (d, i) => {

                // Code reference: https://bl.ocks.org/mbostock/1346410
                // update the current arcs with the new data
                const j = d3.interpolate(current_angle[i], d);
                // update the current angle
                current_angle[i] = j(0)

                return function (t) {
                    return arc(j(t));
                }
            });
    }
    return update;
}

//-------------------------------------------- Click Function ---------------------------------------------------------
// click function for the bubble chart legend/ doughnut charts
// input is an array of three classes ('.first_quartile', etc) out of the four quartile classes that have not been selected
// clicked is the class which has been selected
function onClick(input, clicked) {

    let visible = [] // visibility status of the unselected quartiles goes here
    // loop through the unselected classes and determine their visibility
    input.forEach(el => {
        try {
            visible.push(d3.select('.bubbleArea').selectAll(el).classed("visible"))
        } catch {
            visible.push(false)
        }
    })

    // if all quartiles besides the clicked quartile already invisible, make them visible
    if ((visible[0] == false) && (visible[1] == false) && (visible[2] == false)) {
        // maintain the clicked quartile visible
        d3.selectAll('.bubbleArea').selectAll(clicked).classed("visible", true);
        // make other quartiles visible
        input.forEach(key => {
            d3.selectAll('.bubbleArea').selectAll(key).classed("visible", true).classed("invisible", false);
        })

        // otherwise, hide other quartiles besides the clicked one
    } else {

        // maintain the clicked quartile visible
        d3.selectAll('.bubbleArea').selectAll(clicked).classed("visible", true);
        // make other quartiles invisible
        input.forEach(key => {
            d3.selectAll('.bubbleArea').selectAll(key).classed("visible", false).classed("invisible", true);

        })
    }
}

// ------------------------------------------ DGP per Capita Function --------------------------------------------------
// finds gdp per capita based on gdp and population data for each country
function findGDPerCapita() {

    const gdp_per_capita = []; // gdp per capita data go here

    // gdp is an array of objects (on per each country)
    gdp.forEach((c, i) => {
        let el = []
        // each country object contains gdp data for each year between 1960-2020 as value-key pairs, in addition to some metadata
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
        // convert the array to an object
        gdp_per_capita.push(Object.fromEntries(el))
    })

    return gdp_per_capita;
}


// ----------------------------------------------- Combine Data Function -----------------------------------------------------------
// combines data from the different sources into one collection of objects
function combineData(population, gdp_per_capita, mortality, life_exp, young_births) {

    const combo = [] // combined data go here
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

// ---------------------------------------------- Doughnut Data Function ----------------------------------------------------------------------------
// process data for the doughnut chart 
function doughnutData() {
    // data types
    const data_type = ["mortality", "life_expectancy", "young_births"];
    let minMax = [[10000, 0], [10000, 0], [10000, 0]];
    let quartile_data = []; // data for the doughnut charts will go here

    // find min/max values for the three data types
    combo.forEach((c, i) => {
        Object.keys(c).forEach(key => {
            // the key is a year
            if (key.length == 4) {
                // ensure the key/value pairs are pushed only
                if (i == 0) {
                    let year = []
                    year.push([data_type[0], [0, 0, 0, 0]]);
                    year.push([data_type[1], [0, 0, 0, 0]]);
                    year.push([data_type[2], [0, 0, 0, 0]]);
                    year.push(["world_sum", [0, 0, 0]])

                    // prepare the data array
                    quartile_data.push([key, Object.fromEntries(year)]);
                }
                // find min/max values for each data type
                data_type.forEach((dt, index) => {
                    if (!isNaN(c[key][dt])) {
                        let value = c[key][dt]
                        if (value > minMax[index][1]) {

                            minMax[index][1] = value;
                        } else if (value < minMax[index][0]) {
                            minMax[index][0] = value;
                        }
                    }
                })
            }
        })
    });
    // transform the list of key/value pairs into an object 
    quartile_data = Object.fromEntries(quartile_data);

    // find the number of countries in each quartile in each year
    combo.forEach(c => {
        Object.keys(c).forEach(key => {
            // the key is a year
            if (key.length == 4) {

                data_type.forEach((dt, index) => {
                    let value = c[key][dt]
                    let min = minMax[index][0]
                    let max = minMax[index][1]
                    if (!isNaN(value)) {
                        quartile_data[key]['world_sum'][index] += value;
                    }
                    // value in the bottom quartile
                    if (value < min + (max - min) * 0.25) {
                        quartile_data[key][dt][0] += 1
                    }
                    // value in the 2nd quartile
                    else if ((value >= min + (max - min) * 0.25) && (value < min + (max - min) * 0.5)) {
                        quartile_data[key][dt][1] += 1
                    }
                    // value in the 3rd quartile
                    else if ((value >= min + (max - min) * 0.5) && (value < min + (max - min) * 0.75)) {
                        quartile_data[key][dt][2] += 1
                    }
                    // value in the top quartile
                    else if ((value >= min + (max - min) * 0.75)) {
                        quartile_data[key][dt][3] += 1
                    }
                })
            }
        })
    });
    return quartile_data;
}


// read in the data
promises.push(d3.csv("data/mortality.csv"))
promises.push(d3.csv("data/population.csv"))
promises.push(d3.csv("data/gdp.csv")) // gdp in current US dollars
promises.push(d3.csv("data/female_life_expectancy.csv"))
promises.push(d3.csv("data/young_fertility.csv"))


// once all promises fulfilled, execute the functions 
let fulfilled = Promise.all(promises).then((data) => {

    population = data[1];
    gdp = data[2];

    gdp_per_capita = findGDPerCapita();

    combo = combineData(population, gdp_per_capita, data[0], data[3], data[4]);
    doughnut_data = doughnutData();

    const sliderUpdate = createSlider();
    bubbleUpdate = createChart();

    d1DoughnutUpdate = createDoughnut(".d1", "mortality", 0);
    d2DoughnutUpdate = createDoughnut(".d2", "life_expectancy", 1);
    d3DoughnutUpdate = createDoughnut(".d3", "young_births", 2);


    sliderUpdate();
    bubbleUpdate(combo, 1960);
})
