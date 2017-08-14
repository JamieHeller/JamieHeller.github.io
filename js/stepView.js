// This javascript create a network flow graph that displays the results
// of running the Edmonds-Karp algorithm which was recorded in a log.
// This function shows each step of the max flow calculation.
function stepView(){
  "use strict";

  var margin = {top: 20, right: 10, bottom: 20, left: 10};
  var width = 960 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom,
      colors = d3.scale.category20(),
      percentile = width/10;

  var index = 0;

  // Build a log viewer
  d3.select('#app-container').remove();

  var body = d3.select('body')
      .append("div")
    .attr('id', 'app-container');

  var navContainer = body.append('div')
      .attr('class', 'navcontainer');

  // Create a button to navigate back to the Network Flow Graph Editor
  var editor = navContainer.append('button')
      .attr('id', 'editor')
      .attr("name", "editor")
      .attr("type", "button")
      .attr("style", "display:block; margin:auto;")
      .text("Editor")
      .on('click', function() {
        var loc = window.location.href,
            editor = loc.split('?view=step')[0];
        window.history.pushState(null,null,editor);
        createEditor();
      });

  // Create the step backward button
  var back = navContainer.append('button')
      .attr('id', 'back')
      .attr("name", "back")
      .attr("type", "button")
      .text("<")
      .on('click', function() {showStep(--index);});

  // Create the step forward button
  var forward = navContainer.append('button')
      .attr('id', 'forward')
      .attr("name", "forward")
      .attr("type", "button")
      .text(">")
      .on('click', function() {showStep(++index);});

  var svg = body.append('svg')
      .attr('class', 'steps')
      .attr('width', width)
      .attr('height', 3*height);

  // Create the definitions for links (arrows, etc)
  var defs = svg.append('svg:defs');

  // Marker for the flow link
  defs.append('svg:marker')
      .attr('id', 'end-arrow-flow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('markerUnits', "userSpaceOnUse")
      .attr('orient', 'auto')
    .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

   // Marker for the residual capacity link
  defs.append('svg:marker')
      .attr('id', 'end-arrow-res')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', -0.5)
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('markerUnits', "userSpaceOnUse")
      .attr('orient', 'auto')
    .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

  // Make flow and residual graphs. (non-interactive)
  var flowG = svg.append('g')
      .attr('class', 'flow');

  var residualG = svg.append('g')
      .attr('class', 'residual')
      .attr('transform', 'translate(0,'+ (height/2) + ')');
  

  //
  // initialize flow and residual
  //

  function chargeF (d) {
    // Source and sink should have more charge
    if (d.name === 's' || d.name === 't') {
      return -5000;
    }
    return -4000;
  } // end chargeF


  // This function forces the tick operation for the graph
  function forceTick() {
    flowPath.selectAll("path").attr("d", linkArc);
    flowCircle.attr("transform", transform);

    function transform(d) {
      return "translate(" + d.x + "," + d.y + ")";
    } // end transform

    function linkArc(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dist = Math.sqrt(dx * dx + dy * dy),
          normX = dx / dist,
          normY = dy / dist,
          sourcePadding = 10,
          targetPadding = 10,
          sourceX = d.source.x + (sourcePadding * normX),
          sourceY = d.source.y + (sourcePadding * normY),
          targetX = d.target.x - (targetPadding * normX),
          targetY = d.target.y - (targetPadding * normY);
      return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    } // end linkArc
  } // end forceTick

  // Create the Flow Force Graph
  var flowForce = d3.layout.force()
      .nodes([])
      .links([])
      .size([width, height/2])
      .linkDistance(150)
      .gravity(0.1)
      .charge(chargeF)
      .on("tick", forceTick)
      .start();

  var flowPath = flowG.append("g").selectAll("g");
  var flowCircle = flowG.append("g").selectAll("g");

  function residualTick() {
    var fmax_x = 0.0;
    var fmin_x = Number.MAX_SAFE_INTEGER;
    var fmax_y = 0.0;
    var fmin_y = Number.MAX_SAFE_INTEGER;
    var rmax_x = 0.0;
    var rmin_x = Number.MAX_SAFE_INTEGER;
    var rmax_y = 0.0;
    var rmin_y = Number.MAX_SAFE_INTEGER;
 

    residualPath.selectAll("path").attr("d", linkArc);
    residualCircle.attr("transform", transform);


    flowCircle.each(function(d) {
       if (d.x > fmax_x) fmax_x = d.x;
       if (d.y > fmax_y) fmax_y = d.y;
       if (d.x < fmin_x) fmin_x = d.x;
       if (d.y < fmin_y) fmin_y = d.y;
    });

    residualCircle.each(function(d) {
       if (d.x > rmax_x) rmax_x = d.x;
       if (d.y > rmax_y) rmax_y = d.y;
       if (d.x < rmin_x) rmin_x = d.x;
       if (d.y < rmin_y) rmin_y = d.y;
    });

    // Translate the residual graph so it does not overlap with the flow graph
    var padding = 40;
    var x_offset = fmax_x - rmin_x + padding;
    var y_offset = fmax_y - rmin_y + padding;

    //var new_width = max_x + x_offset;
   // var new_height = max_y + y_offset;
    //new_height = new_height * 2;  // hack to just give me plenty of room to play with

    // Resize the svg to fit the graph
    //svg.attr("width", new_width);
    //svg.attr("height", new_height);
    //flowForce.attr("width", new_width/2);
    //flowForce.attr("height", new_height/2);

    residualG.attr("transform", "translate(0,"+ y_offset +")");


    function transform(d) {
      return "translate(" + d.x + "," + d.y + ")";
    }
    function linkArc(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dist = Math.sqrt(dx * dx + dy * dy),
          dr = dist*2,
          normX = dx / dist,
          normY = dy / dist,
          sourcePadding = 10,
          targetPadding = 10,
          sourceX = d.source.x + (sourcePadding * normX),
          sourceY = d.source.y + (sourcePadding * normY),
          targetX = d.target.x - (targetPadding * normX),
          targetY = d.target.y - (targetPadding * normY);
      return "M" + sourceX + "," + sourceY + "A" + dr + "," + dr + " 0 0,1 " + targetX + "," + targetY;
    }
    // residualPath.select('tspan')
    //     .filter(function(d) { return d.source.x > d.target.x })
    //   .attr('rotate', 180)
    //   .attr('style', 'text-anchor: start; dominant-baseline:text-before-edge;');
  }
  
  var residualForce = d3.layout.force()
      .nodes([])
      .links([])
      .size([width, height/2])
      .linkDistance(200)
      .gravity(0.1)
      .charge(chargeF)
      .on("tick", residualTick)
      .start();

  var residualPath = residualG.append("g").selectAll("g");
  var residualCircle = residualG.append("g").selectAll("g");


  // This function constructs the residual graph for the current step and displays the flow results
  // This function takes the current step index as input
  function showStep(index) {
    // Get the logged item for the specified index
    // We will use the log information to construct the residual and flow graphs.
    // The log information was generated by running the Edmonds-Karp algorithm 
    // The log flow entry contains the set of vertices (vertex ids and name mapping)
    //                    contains the set of edges (src/dst vertices, capacity, andcurrent flow)
    // The log residual entry contains the residual capacity (forward link) and 
    //                        contains the flow rate (backward link) 
    var logItem = log[index],
        path = logItem.path,
        flow = new Graph(logItem.flow.vertices, logItem.flow.links),
        residual = new Residual(flow, logItem.residual);

    back.attr("disabled", function(){ return index <= 0 ? true : null; });
    forward.attr("disabled", function(){ return index >= log.length-1 ? true : null; });

    // Create a force graph for the Network Flow
    flowForce.nodes(flow.nodes())
        .links(flow.links());

    // Construct the flow and residual graph data.
    flowPath = flowPath.data(flow.links(), function(l) { return l.source.id.toString() + l.target.id.toString(); });
    var flowLinkEnter = flowPath.enter().append("g");

    flowLinkEnter
        .attr("class", "link")
        .append("path")
        .attr("class", "link")
        .attr("marker-end", "url(#end-arrow-flow)")
        .attr('id', function(d) {return 'flow' + d.source.id.toString() + '-' + d.target.id.toString();});

    
    flowLinkEnter.append('text')
      .append('textPath')
        .attr('xlink:href', function (d) {
          return "#flow" + d.source.id.toString() + '-' + d.target.id.toString();
        })
        .attr('startOffset', '50%')
      .append('tspan')
        .attr('dy', -5);

    // Categorizes the edge set into two groups (sending and resending)
    // Sending means that the source index is greater than target index by 1
    // Resending means that the source index is less than target index by 1
    flowPath
        .classed('sending', function(d) {
          if (! path) {return false}
          var sourceIndex = path.indexOf(d.source.id),
              targetIndex = path.indexOf(d.target.id);
          return sourceIndex >=0 && targetIndex >= 0 && sourceIndex === targetIndex-1;
        })
        .classed('resending', function(d) {
          if (! path) {return false}
          var sourceIndex = path.indexOf(d.source.id),
              targetIndex = path.indexOf(d.target.id);
          return sourceIndex >=0 && targetIndex >= 0 && sourceIndex === targetIndex+1;
        });


    // Sets the links text in the Network Flow graph to contain the flow/capacity
    flowPath.select('text')
      .select('tspan')
        .text(function(d) {
          if (d.flow) {return d.flow + " / " + d.capacity;}
          else {return 0 + " / " + d.capacity;}
        });

    // Create the nodes in the Network Flow Graph with the appropriate IDs, names, 
    // positions, and drawing attributes/style/color
    flowCircle = flowCircle.data(flow.nodes(), function(n){ return n.id; });
    var flowNodeEnter = flowCircle.enter().append("g")
        .attr('class', 'node')
        .attr('transform', function(d) {
          if (!d.x || !d.y) {return ""}
          return 'translate(' + d.x + ',' + d.y + ')';
        });

    flowNodeEnter.append("circle")
        .attr('r', 12)
        .attr("fill", function(d){ return colors(d.id) })
        .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); });

    flowNodeEnter.append("text")
        .attr("x", 8)
        .attr('class', 'name')
        .attr('x', 0)
        .attr('y', 4)
        .text(function(d) { return d.name; });

    flowPath.exit().remove();
    flowCircle.exit().remove();

    // Build the Residual Force Graph with the nodes and residual links
    // The log residual entry contains the residual capacity (forward link) and 
    //                        contains the flow rate (backward link) 
    residualForce.nodes(residual.nodes())
        .links(residual.links());

    // Build svg of flow and residual.
    residualPath = residualPath.data(residual.links(), function(l) { return l.source.id.toString() + l.target.id.toString(); });
    var residualLinkEnter = residualPath.enter().append("g");
   
    // Create the residual graph links with IDs based upon their direction (source to target or target to source)
    // i.e. a link for each reverse flow edge and a link for each residual capacity edge 
    residualLinkEnter
        .attr("class", "link")
        .append("path")
        .attr("class", "link")
        .attr("marker-end", "url(#end-arrow-res)")
        .attr('id', function(d) {return 'res' + d.source.id.toString() + d.target.id.toString();});

    residualLinkEnter.append('text')
        .attr("text-anchor", "middle")
        .append('textPath')
        .attr('xlink:href', function (d) {
          return "#res" + d.source.id.toString() + d.target.id.toString();
        })
        .attr('startOffset', '50%')
        .append('tspan');


    // Categorizes the residual edge set into two groups (sending and resending)
    // Sending means that the source index is greater than target index by 1
    // Resending means that the source index is less than target index by 1
    residualPath
        .classed('sending', function(d) {
          if (! path) {return false}
          var sourceIndex = path.indexOf(d.source.id),
              targetIndex = path.indexOf(d.target.id);
          return sourceIndex >=0 && targetIndex >= 0 && sourceIndex === targetIndex+1;
        })
        .classed('resending', function(d) {
          if (! path) {return false}
          var sourceIndex = path.indexOf(d.source.id),
              targetIndex = path.indexOf(d.target.id);
          return sourceIndex >=0 && targetIndex >= 0 && sourceIndex === targetIndex-1;
        });

    residualPath.select('text')
      .select('tspan')
        .text(function(d) {
          return d.flow || 0;
        });
    

    residualCircle = residualCircle.data(residual.nodes(), function(n){ return n.id; });
    var resNodeEnter = residualCircle.enter().append("g")
        .attr('class', 'node')
        .attr('transform', function(d) {
          if (!d.x || !d.y) {return ""}
          return 'translate(' + d.x + ',' + d.y + ')';
        });
        
    resNodeEnter.append("circle")
        .attr('r', 12)
        .attr("fill", function(d){ return colors(d.id) })
        .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); });

    resNodeEnter.append("text")
        .attr('class', 'name')
        .attr('x', 0)
        .attr('y', 4)
        .text(function(d) { return d.name; });

    residualPath.exit().remove();
    residualCircle.exit().remove();

    // Stop the graphs from updating so that we can step through them 
    residualForce.stop();
    flowForce.stop();
  } // end showStep



  showStep(index); // step through the Edmonds-Karp algorithm via the log history 

  // Start the residual and flow force graphs (we will stop them after each step
  residualForce.start();
  flowForce.start();
} // end stepView
