
function mapInit(map, iso, covid_data) {
    let el = document.querySelector("#map");
    let xSize = el.clientWidth;
    let ySize = el.clientHeight - 30;

    let projection = d3.geoEquirectangular().scale(125).translate([420, 210]).center([0, 5]);
    let geoGenerator = d3.geoPath().projection(projection);

    let max_cases = 0;
    // find the max total cases per million among the countries
    Object.keys(covid_data).forEach(key => {
        let total_cases = covid_data[key].data[covid_data[key].data.length -1].total_cases_per_million
        if (total_cases > max_cases) {
            max_cases = total_cases;
        }
    });

    const domain = [max_cases, 0]
   
    // create a color palette 
    const colorScheme = d3.scaleSequentialSqrt().domain(domain).interpolator(d3.interpolateViridis)

    // Add map title 
    d3.select("#map").append("text")
        .attr("class", "title")
        .text("Total cases per million")

    // Add SVG container for the map
    const svg = d3.select("#map")
        .append("svg")
        .attr('width', xSize)
        .attr('height', ySize)
        .call(d3.zoom()
            .scaleExtent([1, 6]) // min/ max scale factor
            .on("zoom", function (event) { // zoom event handler
                svg.selectAll("path").attr("transform", event.transform)
            }));

    // Add country as separate paths
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
                let cases = covid_data[iso3].data[index].total_cases_per_million
                // 
                return colorScheme(cases)
            } catch (err) {
                // some countries don't have data available
                console.log(iso3 + ": Data unavailable.")
            }
        })
        .attr("opacity", 0.8)
        .on('mouseover', mapMouseover)
        .on("mouseout", mapMouseout);

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
        .text("Cases: ")
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
     .text("Total Cases per Million")
     .attr("x", 15)
     .attr("y", ySize * 0.8)
     .attr("font-size", "12px");

    const barWidth = 1.5;
    const barHeight = 20;
    const points = d3.range(0, max_cases, 5000)
    legend.selectAll(".bars")
        .data(points)
        .enter()
        .append("rect")
        .attr('y', ySize*0.82)
        .attr('x', (d, i) => 15+i * barWidth)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr("fill", colorScheme)
    
    legend.selectAll('.barLables')
        .data(points)
        .enter()
        .append('text')
        .text((d, i)=> {
            if (i%25 == 0) {
                return (d/1000) +'k'
            }
        })
        .attr('y', ySize*0.91)
        .attr('x', (d, i) => 15+i * barWidth)
        .attr("font-size", "10px");









    function mapMouseover(e, d) {

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
            cases = covid_data[iso3].data[index].total_cases_per_million
            svg.select(".tooltip-map-cases").text(cases)

        } catch (err) {
            console.log(iso3 + ": Data unavailable.")
        }

        onHover.style("display", null);
        svg.select(".tooltip-map-country").text(d.properties.name)


        // get the location of the mouse pointer
        let pointer_loc = d3.pointer(e)
        console.log(e)
        // reposition the tooltip to the left if country is close to the tight edge of the container 
        if (pointer_loc[0] > 0.7 * xSize) {
            onHover.attr("transform", "translate(" + (pointer_loc[0] - 190) + "," + pointer_loc[1] + ")");

        } else {
            onHover.attr("transform", "translate(" + pointer_loc + ")");
        }
    }

    function mapMouseout(e, d) {
        onHover.style("display", "none");

        d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 0.8)
            .style("stroke", "none")

    }

}


// finds the min/ max value among multiple datasets
// countries passed as an array
function findMax(countries) {
    let max = 0;
    let min = 1000;

    for (const c of countries) {
        // find the min/ max value for the given dataset
        const extent = d3.extent(c.data, d => { return d.new_cases_per_million; });

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


const chartInit = (htmlEl, data) => {

    let el = document.querySelector(htmlEl);
    let xSize = el.clientWidth;
    let ySize = el.clientHeight;

    const margin = 50;

    // colour scheme
    const color = d3.scaleOrdinal().range(d3.schemeSet2);

    const svg = d3.select(htmlEl)
        .append("svg")
        .attr('width', xSize)
        .attr('height', ySize)
        .append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")");


    // scale of x axis the same for all data arrays 
    const maxX = data[0].data[(data[0].data.length - 1)].date // latest date appears last in the array 
    const minX = data[0].data[0].date // earliest date appears first in the array 

    const extentY = findMax(data)
    const minY = extentY[0]
    const maxY = extentY[1]

    // Reference: http://using-d3js.com/04_04_working_with_dates.html
    const parseTime = d3.timeParse("%Y-%m-%d");

    const xScale = d3.scaleTime().domain([parseTime(minX), parseTime(maxX)]).range([0, (xSize - 1.5 * margin)]);
    const yScale = d3.scaleLinear().domain([maxY, minY]).range([0, (ySize - 1.5 * margin)]);

    // add y axis 
    svg.append("g")
        .attr("transform", "translate(0," + (-0.5 * margin) + ")")
        .call(d3.axisLeft(yScale));

    // add x axis  
    svg.append("g")
        .attr("transform", "translate(0," + (ySize - 2 * margin) + ")")
        .call(d3.axisBottom(xScale))

    // set font of the ticks
    svg.selectAll(".tick text").attr("font-family", "Montserrat");

    // add title
    svg.append("text")
        .text("New cases per million")
        .attr("x", xSize / 2 - 2.5 * margin)
        .attr("y", -margin / 2)

    svg.selectAll()
        .data(data)
        .append("text")
        .text(d => d.location)
        .attr("fill", "black")
        .attr("x", xSize - 1.5 * margin)
        .attr("y", d => yScale(d[0].new_cases_per_million));

    // ------------- Tooltip ----------------
    const onHover = svg.append("g")
        .attr("class", "hover")
        .style("display", "none");

    const tooltipLine = svg.append("line")
        .attr("class", "tooltip-line")
        .attr('stroke', 'gray')
        .style("stroke-dasharray", ("3, 3"))
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', -margin / 2)
        .attr('y2', ySize - 2 * margin)
        .style("display", "none");

    onHover.append("rect")
        .attr("class", "tooltip")
        .attr("fill", "none")
        .attr("width", 150)
        .attr("height", 80)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);


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

    let textLoc = 18;

    for (const d of data) {

        onHover.append("text")

            .attr("x", 18)
            .attr("y", textLoc)
            .attr("font-size", "12px")
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

    svg.append("rect")
        .attr("width", xSize - 1.5 * margin)
        .attr("height", ySize - margin)
        .attr("opacity", 0)
        .on("mouseout", mousestop)
        .on("mousemove", mousemove);


    // add lines
    for (const cc of data) {
        svg.append("path")
            .datum(cc.data)
            .attr("fill", "none")
            .attr("transform", "translate(0," + (-0.5 * margin) + ")")
            .attr("stroke", color(data.indexOf(cc)))
            .attr("opacity", 0.3)
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .defined((d) => { return d.new_cases_per_million !== undefined; }) // skip undefined values
                .x(d => { return xScale(parseTime(d.date)); })
                .y(d => { return yScale(d.new_cases_per_million); }))
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);
    }


    // -------------- Event Handler Functions -------------


    function mouseover() {
        d3.select(this)
            .attr("opacity", 1)
            .attr("stroke-width", 2)
    }
    function mouseout() {
        d3.select(this)
            .attr("opacity", 0.3)
            .attr("stroke-width", 1.5)
    }


    function mousestop() {
        onHover.style("display", "none");
        tooltipLine.style("display", "none");
    }

    // Reference: https://bl.ocks.org/Qizly/8f6ba236b79d9bb03a80
    function mousemove(event) {
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
                    .text(c.data[i].new_cases_per_million)
            } catch (err) {

            }
        }
    }
}





// reference: https://medium.datadriveninvestor.com/getting-started-with-d3-js-maps-e721ba6d8560
const promises = []


promises.push(d3.json("data/map.json"))
promises.push(d3.json("data/covid-data.json"))
promises.push(d3.json("data/iso3.json"))


let fulfilled = Promise.all(promises).then((data) => {

    const root = d3.hierarchy(data[1]) // *d3.hierarchy function which gets/organised data*
    mapInit(data[0], data[2], root.data)
    chartInit(".line-countries", [root.data.OWID_ASI, root.data.OWID_AFR, root.data.OWID_EUR, root.data.OWID_NAM, root.data.OWID_SAM, root.data.OWID_OCE])
    chartInit(".line-vaccines", [root.data.OWID_WRL])




})