// Code By: Lina Rietuma (H00361943)
//  Finished On: 18/03/2022 

// global variables
let data_key_map = 'total_cases_per_million'
let data_key_charts = 'new_cases_smoothed_per_million'
let data_value = 'Cases'

let map_data;
let iso_data;
let covid_data;
let filled_line_chart_data;


// -------------------------------- Button Function ----------------------------------------------------------------------------------------

function updateBtn(cases) {
    // if the active button is clicked do nothing
    if ((cases == true && data_value != 'Cases') || (cases == false && data_value != 'Deaths')) {
        // Cases button clicked
        if (cases == true && data_value != 'Cases') {
            // update the global variables
            data_key_map = 'total_cases_per_million';
            data_key_charts = 'new_cases_smoothed_per_million';
            data_value = 'Cases';
            // update the button formatting 
            d3.select(".btn-cases").classed("selected", true);
            d3.select(".btn-deaths").classed("selected", false);

            // Deaths button clicked
        } else if (cases == false && data_value != 'Deaths') {
            // update the global variables
            data_key_map = 'total_deaths_per_million';
            data_key_charts = 'new_deaths_smoothed_per_million';
            data_value = 'Deaths';
            // update button formatting 
            d3.select(".btn-cases").classed("selected", false);
            d3.select(".btn-deaths").classed("selected", true);

        }
        d3.select("#map").select('svg').remove();
        d3.select("#map").select('text').remove();
        d3.select(".line-countries").select('svg').remove();
        d3.select(".line-vaccines").select('svg').remove();
        d3.select(".bubble").select('text').remove();
        d3.select(".bubble").select("svg").remove();

        // update the charts/ map 
        mapInit(map_data, iso_data, covid_data.data);
        lineChartInit(".line-countries", [covid_data.data.OWID_ASI, covid_data.data.OWID_AFR, covid_data.data.OWID_EUR, covid_data.data.OWID_NAM, covid_data.data.OWID_SAM, covid_data.data.OWID_OCE, covid_data.data.OWID_WRL])
        barChartInit(".line-vaccines", filled_line_chart_data);
        scatterInit(".bubble", covid_data);
    }
}

function updateplot(iso) {
    
    try {
        const data = covid_data.data[iso];
        filled_line_chart_data =  covid_data.data[iso];
        console.log(filled_line_chart_data)
        d3.select(".line-vaccines").select('svg').remove();
        barChartInit(".line-vaccines", filled_line_chart_data)  
    } catch(err) {

    }
}

// -------------------------------- Map Function ----------------------------------------------------------------------------------------

function mapInit(map, iso, covid_data) {
    // get the dimensions of the user's screen
    let el = document.querySelector("#map");
    let xSize = el.clientWidth;
    let ySize = el.clientHeight - 30;

    // create a projection for the map
    let projection = d3.geoEquirectangular().scale(125).translate([420, 210]).center([0, 5]);
    let geoGenerator = d3.geoPath().projection(projection);

    let max_cases = 0;
    // find the max total cases per million among the countries
    Object.keys(covid_data).forEach(key => {
        let total_cases = covid_data[key].data[covid_data[key].data.length - 1][data_key_map]
        if (total_cases > max_cases) {
            max_cases = total_cases;
        }
    });

    // use max cases to create a domain for the color palette
    const domain = [max_cases, 0]
    // create a color palette
    const colorScheme = d3.scaleSequentialSqrt().domain(domain).interpolator(d3.interpolateViridis)

    // Add map title 
    d3.select("#map").append("text")
        .attr("class", "title map-svg")
        .text(`Total ${data_value} per Million`)

    // Add SVG container for the map
    const svg = d3.select("#map")
        .append("svg")
        .attr('width', xSize)
        .attr('height', ySize)
        .call(d3.zoom() // add zooming functionality for the map
            .scaleExtent([1, 6]) // min/ max scale factor
            .on("zoom", function (event) { // zoom event handler
                svg.selectAll("path").attr("transform", event.transform)
            }))
        .attr("class", "map-svg");

    // Add countries as separate paths
    svg.append("g")
        .selectAll("path")
        .data(map.features)
        .enter()
        .append('path')
        .attr("class", d => {
            // convert iso alpha 2 codes (used in the map) to iso alpha 3 (used in the covid data)
            let key = d.id
            return iso[key]
        })
        .attr("d", d => {
            return geoGenerator(d)
        })
        .attr("fill", d => {
            // convert iso alpha 2 codes (used in the map) to iso alpha 3 (used in the covid data)
            let key = d.id
            let iso3 = iso[key]

            try {
                // index of the most recent record
                let index = covid_data[iso3].data.length - 1
                let cases = covid_data[iso3].data[index][data_key_map]
                // 
                return colorScheme(cases)
            } catch (err) {
                // some countries don't have data available
                console.log(iso3 + ": Data unavailable.")
            }
        })
        .attr("opacity", 0.8)
        .on('mouseover', mapMouseover)
        .on("mouseout", mapMouseout)
        .on("click", mapClick);

    // Add tooltip container
    const onHover = svg.append("g")
        .attr("class", "hover-map")
        .style("display", "none");

    // Add tooltip rectangle (background)
    onHover.append('rect')
        .attr("class", "tooltip-map")
        .attr("fill", "white")
        .attr("opacity", 0.85)
        .attr("width", 170)
        .attr("height", 50)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

    // Add tooltip text/ text placeholders
    onHover.append("text")
        .attr("x", 18)
        .attr("y", -2)
        .text("Country: ")
        .attr("font-size", "12px");

    onHover.append("text")
        .attr("class", "tooltip-map-country")
        .attr("x", 75)
        .attr("y", -2)
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

    onHover.append("text")
        .attr("x", 18)
        .attr("y", 18)
        .text(`${data_value}: `)
        .attr("font-size", "12px");

    onHover.append("text")
        .attr("class", "tooltip-map-cases")
        .attr("x", 75)
        .attr("y", 18)
        .attr("font-size", "12px");

    // -------- Map Legend ----------
    // Add a container for the legend
    const legend = svg.append("g")
        .attr("class", "legend")

    // Add legend background
    legend.append("rect")
        .attr("class", "legend-map")
        .attr("fill", "white")
        .attr("opacity", 0.85)
        .attr("width", 230)
        .attr("height", 110)
        .attr("border-radius", "20px")
        .attr("x", 5)
        .attr("y", ySize * 0.75)

    // Add a square to represent countries with no data
    legend.append("rect")
        .attr("fill", "black")
        .attr("opacity", 0.85)
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", 15)
        .attr("y", ySize * 0.94)
    // Add a label 
    legend.append("text")
        .text("Data Unavailable")
        .attr("x", 40)
        .attr("y", ySize * 0.97)
        .attr("font-size", "10px");

    // Add a label 
    legend.append("text")
        .text(`Total ${data_value} per Million`)
        .attr("x", 15)
        .attr("y", ySize * 0.8)
        .attr("font-size", "12px");

    // Add a bar to represent the color range
    const barWidth = 1.5;
    const barHeight = 20;
    const points = d3.range(0, max_cases, max_cases / 120)
    legend.selectAll(".bars")
        .data(points)
        .enter()
        .append("rect")
        .attr('y', ySize * 0.82)
        .attr('x', (d, i) => 15 + i * barWidth)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr("fill", colorScheme)
    // Add labels to the color range
    legend.selectAll('.barLables')
        .data(points)
        .enter()
        .append('text')
        .text((d, i) => {
            if (d % (max_cases * 0.4) == 0) {
                return (d / 1000).toFixed(0) + 'k'
            }
        })
        .attr('y', ySize * 0.91)
        .attr('x', (d, i) => 15 + i * barWidth)
        .attr("font-size", "10px");

    // map mouseover function 
    function mapMouseover(e, d) {
        // format the selected country
        d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("stroke", "black")
            .style("stroke-width", 0.1)

        // ------- Map Tooltip ----------
        let key = d.id
        let iso3 = iso[key]
        let cases;

        try {
            // index of the most recent record
            let index = covid_data[iso3].data.length - 1
            cases = covid_data[iso3].data[index][data_key_map]
            svg.select(".tooltip-map-cases").text(cases)

        } catch (err) {
            console.log(iso3 + ": Data unavailable.")
        }

        // make the tooltip visible
        onHover.style("display", null);
        svg.select(".tooltip-map-country").text(d.properties.name)


        // get the location of the mouse pointer
        let pointer_loc = d3.pointer(e)
        // reposition the tooltip to the left if country is close to the tight edge of the container 
        if (pointer_loc[0] > 0.7 * xSize) {
            onHover.attr("transform", "translate(" + (pointer_loc[0] - 200) + "," + pointer_loc[1] + ")");

        } else {
            onHover.attr("transform", "translate(" + pointer_loc + ")");
        }
    }

    // map mouseout function
    function mapMouseout(e, d) {
        // make the tooltip invisible 
        onHover.style("display", "none");

        // revert the styling of the selected country
        d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 0.8)
            .style("stroke", "none")
    }
    // add an interaction with the scatter plot on click 
    function mapClick() {
        // get the class (iso code) of the clicked country
        const cl = d3.select(this).attr("class");
        updateplot(cl);

        // select the clicked country in the scatter plot using the class name
        const dot_class = d3.select(".bubble").select(`.${cl.substring(0,3)}`).select(".bubble-dots").attr("class")
        // if the data point already selected, unselect it
        if (dot_class.includes("clicked-dot")) {
            d3.select(".bubble").select(`.${cl.substring(0,3)}`).select(".bubble-dots").classed("clicked-dot", false);
            // if the data point not selected, select it
        } else {
            d3.select(".bubble").select(`.${cl.substring(0,3)}`).raise().select(".bubble-dots").classed("clicked-dot", true);
        }
    }
}

// -------------------------------- Find Max Function ----------------------------------------------------------------------------------------

// finds the min/ max value among multiple datasets
// countries passed as an array
function findMax(countries) {
    let max = 0;
    let min = 1000;

    for (const c of countries) {
        // find the min/ max value for the given dataset
        const extent = d3.extent(c.data, d => { return d[data_key_charts]; });

        // if max of the current dataset larger than the previous max value, save as the new max
        if (extent[1] > max) {
            max = extent[1];
        }
        // if min of the current dataset smaller than the previous min value, save as the new min
        if (extent[0] < min) {
            min = extent[0];
        }
    }
    return [min, max];
}

// -------------------------------- Line Chart Function ----------------------------------------------------------------------------------------

const lineChartInit = (htmlEl, data) => {
    // find the screen dimensions of the user
    let el = document.querySelector(htmlEl);
    let xSize = el.clientWidth;
    let ySize = el.clientHeight;

    const margin = 50;
    // colour scheme
    const color = d3.scaleOrdinal().range(d3.schemeSet2);

    // add a SVG container
    const svg = d3.select(htmlEl)
        .append("svg")
        .attr('width', xSize)
        .attr('height', ySize)
        .append("g")
        .attr("transform", "translate(" +1.5* margin + "," + margin + ")");

    // scale of x axis the same for all data arrays 
    const maxX = data[0].data[(data[0].data.length - 1)].date // latest date appears last in the array 
    const minX = data[0].data[0].date // earliest date appears first in the array 

    // find the min/max values of the y axis
    const extentY = findMax(data)
    const minY = extentY[0]
    const maxY = extentY[1]

    // Reference: http://using-d3js.com/04_04_working_with_dates.html
    const parseTime = d3.timeParse("%Y-%m-%d");

    // create x/y scales 
    const xScale = d3.scaleTime().domain([parseTime(minX), parseTime(maxX)]).range([0, (xSize - 1.75 * margin)]);
    const yScale = d3.scaleLinear().domain([maxY, minY]).range([0, (ySize - 1.75 * margin)]);

    // create a y axis 
    const yAxisGenerator = d3.axisLeft(yScale).tickFormat(d3.format(".2s"));

    // add y axis 
    svg.append("g")
        .attr("transform", "translate(0," + (-0.5 * margin) + ")")
        .transition()
        .duration(500)
        .call(yAxisGenerator);

    // add x axis  
    svg.append("g")
        .attr("transform", "translate(0," + (ySize - 2 * margin) + ")")
        .transition()
        .duration(500)
        .call(d3.axisBottom(xScale))

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - 1.2 * margin)
        .attr("x", 0 - (ySize / 3))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(`New ${data_value} per Million`)
        .attr("font-size", "12px");

    // set font of the ticks
    svg.selectAll(".tick text").attr("font-family", "Montserrat");

    // add title
    svg.append("text")
        .text(`New ${data_value} per Million (7-Day Average)`)
        .attr("x", xSize / 2 - 2.5 * margin)
        .attr("y", -margin / 2);


    // ------------- Tooltip ----------------
    const onHover = svg.append("g")
        .attr("class", "hover")
        .style("display", "none");

    // add the tooltip line 
    const tooltipLine = svg.append("line")
        .attr("class", "tooltip-line")
        .attr('stroke', 'gray')
        .style("stroke-dasharray", ("3, 3"))
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', -margin / 2)
        .attr('y2', ySize - 2 * margin)
        .style("display", "none");

    // add tooltip background
    onHover.append("rect")
        .attr("class", "tooltip")
        .attr("fill", "none")
        .attr("width", 150)
        .attr("height", 80)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

    // add tooltip text/ placeholder text
    onHover.append("text")
        .attr("x", 18)
        .attr("y", -2)
        .text("Date: ")
        .attr("font-size", "12px");
    onHover.append("text")
        .attr("class", "tooltip-date")
        .attr("x", 60)
        .attr("y", -2)
        .attr("font-size", "12px");

    // y location of the initial text label
    let textLoc = 18;
    // add text/placeholder text for all the input data
    for (const d of data) {

        onHover.append("text")
            .attr("x", 18)
            .attr("y", textLoc)
            .attr("font-size", "12px")
            .attr("class", d.location.substring(0, 4))
            .text(d.location + ": ")
            .attr("fill", color(data.indexOf(d)))
            .attr("opacity", 1)
        onHover.append("text")
            .attr("class", d.location.substring(0, 3))
            .attr("x", 120)
            .attr("font-size", "12px")
            .attr("y", textLoc);

        textLoc += 20;
    }

    // ----------------- Graph Elements ---------------

    // add the area (same as the graph) were the mouseover events are active
    svg.append("rect")
        .attr("width", xSize - 1.75 * margin)
        .attr("height", ySize - margin)
        .attr("opacity", 0)
        .on("mouseout", mousestop)
        .on("mousemove", mousemove);

    // add a line for element in the input data array
    for (const cc of data) {

        svg.append("path")
            .datum(cc.data)
            .attr("class", cc.location.substring(0, 2))
            .attr("fill", "none")
            .attr("transform", "translate(0," + (-0.5 * margin) + ")")
            .attr("stroke", color(data.indexOf(cc)))
            .attr("opacity", 0.8)
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .defined((d) => { return d[data_key_charts] !== undefined; }) // skip undefined values
                .x(d => { return xScale(parseTime(d.date)); })
                .y(d => { return yScale(d[data_key_charts]); }))
            .on("mousemove", mousemove);
    }
    // style the world data line 
    svg.select(".Worl").attr("fill", "red")
    d3.select(".Wo").attr("stroke-width", 2).attr("stroke", "red").attr("opacity", 1)


    // -------------- Event Handler Functions -------------

    function mousestop() {
        onHover.style("display", "none");
        tooltipLine.style("display", "none");
    }

    // Reference: https://bl.ocks.org/Qizly/8f6ba236b79d9bb03a80
    function mousemove(event) {
        // make the tooltip visible 
        onHover.style("display", null);
        tooltipLine.style("display", null);

        const x0 = xScale.invert(d3.pointer(event)[0])
        const bisectDate = d3.bisector((d) => { return parseTime(d.date); }).left;
        let i = bisectDate(data[0].data, x0, 1);

        let d0 = data[0].data[i - 1];
        let d1 = data[0].data[i];
        let d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        // reposition the tooltip to the left if country is close to the tight edge of the container 
        if (xScale(parseTime(d.date)) > 0.7 * xSize) {
            onHover.attr("transform", "translate(" + (xScale(parseTime(d.date)) - 180) + ",0)");
        } else {
            onHover.attr("transform", "translate(" + xScale(parseTime(d.date)) + "," + 0 + ")");
        }
        // position the tooltip line to the location of the pointer 
        tooltipLine
            .attr('x1', xScale(parseTime(d.date)))
            .attr('x2', xScale(parseTime(d.date)))

        // set tooltip date 
        svg.select(".tooltip-date").text(d.date)

        for (const c of data) {
            try {
                svg.select("." + c.location.substring(0, 3))
                    .text(c.data[i][data_key_charts])
            } catch (err) {

            }
        }
    }
}

// -------------------------------- Filled Line Chart Function ----------------------------------------------------------------------------------------

const barChartInit = (htmlEl, data) => {
    // get the dimensions of the user screen
    let el = document.querySelector(htmlEl);
    let xSize = el.clientWidth;
    let ySize = el.clientHeight;

    const margin = 50;

    // Add the svg container
    const svg = d3.select(htmlEl)
        .append("svg")
        .attr('width', xSize)
        .attr('height', ySize)
        .append("g")
        .attr("transform", "translate(" + 1.5 * margin + "," + margin + ")");


    // scale of x axis the same for all data arrays 
    const maxX = data.data[(data.data.length - 1)].date // latest date appears last in the array 

    let minX = 0;
    let index_minX = 0;
    // find the first instance of the vaccination data where value not undefined
    for (const el of data.data) {
        let vacc = el.people_vaccinated
        if (vacc != undefined) {
            minX = el.date;
            break;
        }
        index_minX++;
    }

    // find the boundary values for x/y axis
    const minY = 0;
    let maxY = 0;
    for (const val of data.data) {
        let vacc = val.people_vaccinated
        if (vacc > maxY) {
            maxY = vacc;
        }
    }

    // min/max values for the second Y axis
    const extentY2 = findMax([data])
    const minY2 = extentY2[0]
    const maxY2 = extentY2[1]

    // Reference: http://using-d3js.com/04_04_working_with_dates.html
    const parseTime = d3.timeParse("%Y-%m-%d");

    // create x/y scales based on the min/max values
    const xScale = d3.scaleTime().domain([parseTime(minX), parseTime(maxX)]).range([0, (xSize - 3 * margin)]);
    const yScale = d3.scaleLinear().domain([maxY, minY]).range([0, (ySize - 1.5 * margin)]);
    // second y axis
    const yScale2 = d3.scaleLinear().domain([maxY2, minY2]).range([0, (ySize - 1.5 * margin)]);

    // create y axis
    const yAxisGenerator = d3.axisLeft(yScale).tickFormat(d3.format(".2s"));
    // add y axis 
    svg.append("g")
        .attr("transform", "translate(0," + (-0.5 * margin) + ")")
        .transition()
        .duration(500)
        .call(yAxisGenerator);

    // create the second y axis
    const yAxisGenerator2 = d3.axisRight(yScale2).tickFormat(d3.format(".2s"));
    // add y axis 
    svg.append("g")
        .attr("transform", "translate(" + (xSize - 3 * margin) + "," + (-0.5 * margin) + ")")
        .transition()
        .duration(500)
        .call(yAxisGenerator2);

    // create x axis 
    const xAxisGenerator = d3.axisBottom(xScale).ticks(6);

    // add x axis  
    svg.append("g")
        .attr("transform", "translate(0," + (ySize - 2 * margin) + ")")
        .transition()
        .duration(500)
        .call(xAxisGenerator)


    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - 1.2 * margin)
        .attr("x", 0 - (ySize / 3))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(`Total Vaccinations`)
        .attr("font-size", "12px");

    // text label for the second y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", xSize - 2.2 * margin)
        .attr("x", 0 - (ySize / 3))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(`New ${data_value} per Million`)
        .attr("font-size", "12px");

    // set font of the ticks
    svg.selectAll(".tick text").attr("font-family", "Montserrat");

    // add title
    svg.append("text")
        .text(`Vaccination vs New ${data_value} per Million`)
        .attr("x", xSize / 8)
        .attr("y", -margin / 2);


    // ----------------- Graph Elements ---------------
    // add the area (same as the graph) were the mousemove function is called
    svg.append("rect")
        .attr("width", xSize - 3 * margin)
        .attr("height", ySize - margin)
        .attr("opacity", 0)
        .on("mouseout", mousestop)
        .on("mousemove", mousemove);

    // vaccination data to display
    const vacc_data = ['people_vaccinated', 'people_fully_vaccinated', 'total_boosters']
    const vacc_colours = ['#20828f', '#40c16b', '#e5e600']

    // add a line for each element in the vaccination data array
    vacc_data.forEach((el, i) => {
        // define the area and add the area
        svg.append("path")
            .datum(data.data)
            .attr("class", "area")
            .attr("fill", vacc_colours[i])
            .attr("opacity", 0.3)
            .attr("d", d3.area()
                .defined((d) => { return d[el] !== undefined; })
                .x(d => xScale(parseTime(d.date)))
                .y0(ySize - 2 * margin)
                .y1(d => yScale(d[el]) - 0.5 * margin))
            .on("mousemove", mousemove);

        // add data line
        svg.append("path")
            .datum(data.data)
            .attr("fill", "none")
            .attr("transform", "translate(0," + (-0.5 * margin) + ")")
            .attr("stroke", vacc_colours[i])
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .defined((d) => { return d[el] !== undefined; }) // skip undefined values
                .x(d => { return xScale(parseTime(d.date)); })
                .y(d => { return yScale(d[el]); }))
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)

    })

    // add data line for the total cases/ deaths
    svg.append("path")
        .datum(data.data.slice(index_minX))
        .attr("fill", "none")
        .attr("transform", "translate(0," + (-0.5 * margin) + ")")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .defined((d) => { return d[data_key_charts] !== undefined; }) // skip undefined values
            .x(d => { return xScale(parseTime(d.date)); })
            .y(d => { return yScale2(d[data_key_charts]); }))


    // ------------- Tooltip ----------------

    // Add tooltip container
    const onHover = svg.append("g")
        .attr("class", "hover")
        .style("display", "none");

    // Add tooltip line 
    const tooltipLine = svg.append("line")
        .attr("class", "tooltip-line")
        .attr('stroke', 'gray')
        .style("stroke-dasharray", ("3, 3"))
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', -margin / 2)
        .attr('y2', ySize - 2 * margin)
        .style("display", "none");

    // Add tooltip background
    onHover.append("rect")
        .attr("class", "tooltip")
        .attr("fill", "white")
        .attr("opacity", 0.8)
        .attr("width", 220)
        .attr("height", 125)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

    // Add tooltip text/ text placeholders
    onHover.append("text")
        .attr("x", 18)
        .attr("y", -2)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(data.location)
        .attr("opacity", 1)

    onHover.append("text")
        .attr("x", 18)
        .attr("y", 18)
        .text("Date: ")
        .attr("font-size", "12px");
    onHover.append("text")
        .attr("class", "tooltip-date")
        .attr("x", 140)
        .attr("y", 18)
        .attr("font-size", "12px");

    onHover.append("text")
        .attr("x", 18)
        .attr("y", 38)
        .text("People Vaccinated: ")
        .attr("font-size", "12px")
        .attr("fill", vacc_colours[0]);

    onHover.append("text")
        .attr("class", vacc_data[0])
        .attr("x", 140)
        .attr("font-size", "12px")
        .attr("y", 38);

    onHover.append("text")
        .attr("x", 18)
        .attr("y", 58)
        .text("Fully Vaccinated: ")
        .attr("font-size", "12px")
        .attr("fill", vacc_colours[1]);

    onHover.append("text")
        .attr("class", vacc_data[1])
        .attr("x", 140)
        .attr("font-size", "12px")
        .attr("y", 58);

    onHover.append("text")
        .attr("x", 18)
        .attr("y", 78)
        .text("Total Boosters: ")
        .attr("font-size", "12px")
        .attr("fill", vacc_colours[2]);

    onHover.append("text")
        .attr("class", vacc_data[2])
        .attr("x", 140)
        .attr("font-size", "12px")
        .attr("y", 78);

    onHover.append("text")
        .attr("x", 18)
        .attr("y", 98)
        .text(`${data_value} per Million: `)
        .attr("font-size", "12px")
        .attr("fill", "red");

    onHover.append("text")
        .attr("class", "cases-per-mil")
        .attr("x", 140)
        .attr("font-size", "12px")
        .attr("y", 98);


    // -------------- Event Handler Functions -------------
    // mouseover function for the line
    function mouseover() {
        d3.select(this)
            .attr("opacity", 1)
            .attr("stroke-width", 2)
    }

    // mouseout function for the line
    function mouseout() {
        d3.select(this)
            .attr("opacity", 0.3)
            .attr("stroke-width", 1.5)
    }

    // mouseout function for the graph area
    function mousestop() {
        onHover.style("display", "none");
        tooltipLine.style("display", "none");
    }

    // Reference: https://bl.ocks.org/Qizly/8f6ba236b79d9bb03a80
    // mousemove function for the graph area
    function mousemove(event) {
        // make tooltip visible
        onHover.style("display", null);
        tooltipLine.style("display", null);

        // get the date at the location of the pointer
        const x0 = xScale.invert(d3.pointer(event)[0])

        // find the index of the pointer date in the data array
        const bisectDate = d3.bisector((d) => { return parseTime(d.date); }).left;
        let i = bisectDate(data.data, x0, 1);

        let d0 = data.data[i - 1];
        let d1 = data.data[i];
        let d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        // reposition the tooltip to the left if country is close to the tight edge of the container 
        if (xScale(parseTime(d.date)) > 0.4 * xSize) {
            onHover.attr("transform", "translate(" + (xScale(parseTime(d.date)) - 240) + ",0)");
        } else {
            onHover.attr("transform", "translate(" + xScale(parseTime(d.date)) + "," + 0 + ")");
        }
        // position the tooltip line to the location of the pointer 
        tooltipLine
            .attr('x1', xScale(parseTime(d.date)))
            .attr('x2', xScale(parseTime(d.date)))

        // set tooltip date 
        svg.select(".tooltip-date").text(d.date)
        svg.select(".cases-per-mil").text(data.data[i][data_key_charts])

        vacc_data.forEach(d => {
            try {
                svg.select("." + d)
                    .text(data.data[i][d])
            } catch (err) {

            }
        })
    }
}

// ------------------------------------------------ K Means Clustering Functions ----------------------------------------------------------
// generate a random point with min/ max domain
function getRandomPoint(min, max) {
    return min + Math.floor(Math.random() * (max - min));
}

// Reference: https://medium.com/geekculture/implementing-k-means-clustering-from-scratch-in-javascript-13d71fbcb31e
// assign data points to clusters 
function assignPoints(data, centroids) {
    // iterate through the data points
    for (let d in data) {
        let distances = []
        // iterate through the centroids
        for (let p in centroids) {
            // find the difference between centroid centres and the data point
            let diff_cases = centroids[p].total_cases - data[d].total_cases
            let diff_gdp = centroids[p].gdp_per_capita - data[d].gdp_per_capita

            // sum of squares
            let sum = Math.pow(diff_cases, 2) + Math.pow(diff_gdp, 2)
            distances[p] = Math.sqrt(sum);
        }
        // assign closest centroid
        data[d].centroid = distances.indexOf(Math.min.apply(null, distances));
    }
}

function moveCentroids(k, data, centroids) {

    assignPoints(data, centroids);

    let sums_cases = [];
    let sums_gdps = [];
    let count_points = []
    let moved = true;
    let clusters_moved = centroids.length;

    for (let d in data) {
        // get the assigned cluster if the data point
        let centroid = data[d].centroid;

        // sum all the data points for each cluster
        if (isNaN(sums_cases[centroid])) {
            sums_cases[centroid] = data[d].total_cases;
            sums_gdps[centroid] = data[d].gdp_per_capita;
            count_points[centroid] = 1;

        } else {
            sums_cases[centroid] = sums_cases[centroid] + data[d].total_cases;
            sums_gdps[centroid] = sums_gdps[centroid] + data[d].gdp_per_capita;
            // increment the number of points a cluster has (used to find the mean)
            count_points[centroid]++;
        }
    }


    // move centroids
    for (let c in centroids) {
        // find the new cluster centres
        let new_cases = sums_cases[c] / count_points[c];
        let new_gdp = sums_gdps[c] / count_points[c];

        // check if cluster centres have moved 
        // round values to speed up the clustering
        if ((Math.round(new_cases) == Math.round(centroids[c].total_cases) && (Math.round(new_gdp) == Math.round(centroids[c].gdp_per_capita)))) {

            clusters_moved--;
        }
        // find the means 
        centroids[c].total_cases = new_cases;
        centroids[c].gdp_per_capita = new_gdp;
    }

    // if none of the clusters have moved 
    if (clusters_moved == 0) {
        moved = false;
    }
    return moved;
}

// Reference: https://burakkanber.com/blog/machine-learning-k-means-clustering-in-javascript-part-1/
// Reference: https://medium.com/geekculture/implementing-k-means-clustering-from-scratch-in-javascript-13d71fbcb31e
function kMeans(k, data, minX, maxX, minY, maxY) {

    // generate random centroids
    const centroids = []
    while (k--) {
        centroids.push({ gdp_per_capita: getRandomPoint(minX, maxX), total_cases: getRandomPoint(minY, maxY) })
    }
   
    let moved = true;
    while ((moved != false)) {
        moved = moveCentroids(k, data, centroids);
    }
}

// -------------------------------- Scatter Plot Function ----------------------------------------------------------------------------------------

function scatterInit(htmlEl, data) {
    const margin = 50;
    // get the dimensions of the user screen
    let el = document.querySelector(htmlEl);
    let xSize = el.clientWidth;
    let ySize = el.clientHeight;

    // Add map title 
    d3.select(htmlEl).append("text")
        .style("margin-top", "30px")
        .text(`GDP per Capita vs Total ${data_value} per Million`)

    // Add the svg container
    const svg = d3.select(htmlEl)
        .append("svg")
        .attr('width', xSize)
        .attr('height', ySize)
        .append("g")
        .attr("transform", "translate(" + 1.5 * margin + "," + margin + ")");

    // Add brushing
    svg.append("g").call(d3.brush()
        .extent([[0, 0], [xSize, ySize - 2 * margin]])
        .on("start brush", brushed)
    )

    const covid_data = [];
    let max_gdp = 0;
    let max_cases = 0;
    let min_gdp = 10000;
    let min_cases = 100000;
    // find the max total cases per million among the countries
    Object.keys(data.data).forEach(key => {
        // only save data for countries (ISO codes for continents 3+ letters)
        if (key.length == 3) {
            // get the length of the data array for each country (differs)
            let index = data.data[key].data.length
            // get the latests figure of the cases for each country 
            let total_cases = data.data[key].data[index - 1][data_key_map]
            let gdp_per_capita = data.data[key].gdp_per_capita
            let country = data.data[key].location;

            if (total_cases != undefined && gdp_per_capita != undefined) {
                covid_data.push({ iso: key, country: country, gdp_per_capita: gdp_per_capita, total_cases: total_cases, centroid: 0 })

                if (total_cases > max_cases) {
                    max_cases = total_cases;
                } else if (total_cases < min_cases) {
                    min_cases = total_cases;
                }

                if (gdp_per_capita > max_gdp) {
                    max_gdp = gdp_per_capita;
                } else if (gdp_per_capita < min_gdp) {
                    min_gdp = gdp_per_capita;
                }
            }
        }
    });

    // generate x/y scale based on the min/max values
    const scaleX = d3.scaleSequentialSqrt().domain([min_gdp, max_gdp]).range([0, (xSize - 2 * margin)])
    const scaleY = d3.scaleSequentialSqrt().domain([max_cases, min_cases]).range([0, (ySize - 2 * margin)])


    kMeans(3, covid_data, min_gdp, max_gdp, min_cases, max_cases);

    const yAxisGenerator = d3.axisLeft(scaleY).tickFormat(d3.format(".2s")).ticks(6);
    const xAxisGenerator = d3.axisBottom(scaleX).tickFormat(d3.format(".2s")).ticks(8);

    // add y axis 
    svg.append("g")
        .attr("transform", "translate(0," + ySize - 2 * margin + ")")
        .transition()
        .duration(500)
        .call(yAxisGenerator);

    // add x axis  
    svg.append("g")
        .attr("transform", "translate(0," + (ySize - 2 * margin) + ")")
        .transition()
        .duration(500)
        .call(xAxisGenerator)

    // text label for the x axis
    svg.append("text")
        .attr("transform",
            "translate(" + (xSize / 2.5) + " ," +
            (ySize - 1.25 * margin) + ")")
        .style("text-anchor", "middle")
        .text("GDP per Capita")
        .attr("font-size", "12px");

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - 1.1 * margin)
        .attr("x", 0 - (ySize / 3))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(`Total ${data_value} per Million`)
        .attr("font-size", "12px");

    // set font of the ticks
    svg.selectAll(".tick text").attr("font-family", "Montserrat");

    const containerSize = 12;
    const clusterColor = d3.scaleOrdinal().range(d3.schemeSet2);
    // Add dots
    const dots_container = svg
        .selectAll("bubble-dots")
        .data(covid_data)
        .enter()
        .append("svg")
        .attr("height", containerSize)
        .attr("width", containerSize)
        // center the SVG container on the line
        .attr("y", d => { return scaleY(d.total_cases) - containerSize / 2 })
        .attr("x", d => { return scaleX(d.gdp_per_capita) - containerSize / 2 })

        .attr("class", d => d.iso)
        .classed("bubbles-container", true);


    const dots = dots_container.append("circle")
        .style("fill", d => clusterColor(d.centroid))
        .attr("cx", containerSize / 2)
        .attr("cy", containerSize / 2)
        .attr("r", 3)
        .attr("class", "bubble-dots");

    // add event handlers 
    dots.on("mouseover", mouseover)
        .on("mouseout", mouseout);



    // ------------- Tooltip ----------------

    // Add tooltip container
    const onHover = svg.append("g")
        .attr("class", "hover")
        .style("display", "none");


    // Add tooltip background
    onHover.append("rect")
        .attr("class", "tooltip")
        .attr("fill", "white")
        .attr("opacity", 0.8)
        .attr("width", 120)
        .attr("height", 75)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

    // Add tooltip text/ text placeholders
    onHover.append("text")
        .attr("class", "bubble-tooltip-country")
        .attr("x", 18)
        .attr("y", -2)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
    onHover.append("text")
        .text(`${data_value}: `)
        .attr("x", 18)
        .attr("y", 18)
        .attr("font-size", "12px")

    onHover.append("text")
        .attr('class', "bubble-tooltip-cases")
        .attr("x", 70)
        .attr("y", 18)
        .attr("font-size", "12px")

    onHover.append("text")
        .text(`GDP: `)
        .attr("x", 18)
        .attr("y", 38)
        .attr("font-size", "12px")

    onHover.append("text")
        .attr('class', "bubble-tooltip-gdp")
        .attr("x", 70)
        .attr("y", 38)
        .attr("font-size", "12px")

    function mouseover(e, i) {
        onHover.style("display", null);

        // reposition the tooltip to the left if country is close to the tight edge of the container 
        if ((scaleX(i.gdp_per_capita) > 0.5 * xSize) && (scaleY(i.total_cases) > 0.5 * ySize)) {
            onHover.attr("transform", "translate(" + (scaleX(i.gdp_per_capita) - 150) + "," + (scaleY(i.total_cases) - 60) + ")");
        } else if ((scaleX(i.gdp_per_capita) > 0.5 * xSize) && (scaleY(i.total_cases) < 0.5 * ySize)) {
            onHover.attr("transform", "translate(" + (scaleX(i.gdp_per_capita) - 150) + "," + scaleY(i.total_cases) + ")");
        } else if ((scaleX(i.gdp_per_capita) < 0.5 * xSize) && (scaleY(i.total_cases) > 0.5 * ySize)) {
            onHover.attr("transform", "translate(" + (scaleX(i.gdp_per_capita)) + "," + (scaleY(i.total_cases) - 60) + ")");
        } else if ((scaleX(i.gdp_per_capita) < 0.5 * xSize) && (scaleY(i.total_cases) < 0.5 * ySize)) {
            onHover.attr("transform", "translate(" + scaleX(i.gdp_per_capita) + "," + scaleY(i.total_cases) + ")");
        }

        svg.select(".bubble-tooltip-country").text(i.country);
        svg.select(".bubble-tooltip-cases").text(i.total_cases);
        svg.select(".bubble-tooltip-gdp").text(i.gdp_per_capita);

    }

    function mouseout(e, i) {
        onHover.style("display", "none");
    }

    // Reference: https://www.d3-graph-gallery.com/graph/interactivity_brush.html
    function isBrushed(coords, x, y, iso) {
        const x0 = coords[0][0],
            x1 = coords[1][0],
            y0 = coords[0][1],
            y1 = coords[1][1];

        const isBrushed = x0 <= x && x <= x1 && y0 <= y && y <= y1;

        // add interactivity with the map
        if (isBrushed == true) {
            d3.select("#map").select(`.${iso}`).classed("selected-map", true);
        } else {
            d3.select("#map").select(`.${iso}`).classed("selected-map", false);
        }
        return isBrushed;
    }

    function brushed(e, i) {
        // area selected
        const brush = e.selection;

        // style brushed circles
        svg.selectAll(".bubbles-container").classed("selected-dot", d => isBrushed(brush, scaleX(d.gdp_per_capita), scaleY(d.total_cases), d.iso));

    }

}

// reference: https://medium.datadriveninvestor.com/getting-started-with-d3-js-maps-e721ba6d8560
const promises = []

promises.push(d3.json("data/map.json"))
promises.push(d3.json("data/covid-data.json"))
promises.push(d3.json("data/iso3.json"))

// once all promises fulfilled, execute the functions 
let fulfilled = Promise.all(promises).then((data) => {
    map_data = data[0];
    iso_data = data[2];
    covid_data = d3.hierarchy(data[1]) // *d3.hierarchy function which gets/organised data*
    filled_line_chart_data = covid_data.data.OWID_WRL;

    mapInit(map_data, iso_data, covid_data.data)
    lineChartInit(".line-countries", [covid_data.data.OWID_ASI, covid_data.data.OWID_AFR, covid_data.data.OWID_EUR, covid_data.data.OWID_NAM, covid_data.data.OWID_SAM, covid_data.data.OWID_OCE, covid_data.data.OWID_WRL])
    barChartInit(".line-vaccines", covid_data.data.OWID_WRL)
    scatterInit(".bubble", covid_data)

})