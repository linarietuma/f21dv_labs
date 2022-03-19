// colour palette: https://coolors.co/palette/f94144-f3722c-f8961e-f9844a-f9c74f-90be6d-43aa8b-4d908e-577590-277da1



function createSlider() {

    // get the dimensions of the user's screen
    let el = document.querySelector(".slider-year");
    let xSize = el.clientWidth-50;
    let ySize = el.clientHeight-10;

    // range for the slider
    const range = d3.range(1998, 2028)
    // create the slider object
    const slider = d3
        .sliderBottom()
        .min(d3.min(range))
        .max(d3.max(range))
        .step(1)
        .width(xSize-50)
        .tickFormat(d3.format('d'))
        .tickValues(range)
        .default(1998)
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
        .attr('transform', 'translate(20,30)');

    // add the slider 
    gTime.call(slider);

    // format the slider 
    d3.selectAll('.tick').attr("font-family", "Montserrat").select("text").attr("opacity", 0)
    d3.select('.parameter-value').attr("font-family", "Montserrat").select('text').attr('font-size', 15)
    d3.select('.track').attr('stroke-width', 8).attr("stroke", "black")
    d3.select('.track-inset').attr("stroke", "#277da1")
    d3.select(".handle").attr("fill", "#277da1").attr("stroke", "black").attr("stroke-width", 2)

}

createSlider();
