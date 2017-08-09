window.homePath = window.location.pathname;

// Load the editor on active history entry changes
window.onpopstate = function(e) {
   var stepPath = homePath + "?view=step";

   if (e.target.location.pathname === homePath) {
      // Using the network flow editor
      e.preventDefault();
      createEditor();
   } else if (e.target.location.pathname === stepPath) {
      // Using the stepper view instead of the network flow editor
      e.preventDefault();
      stepView();
   }
};


// This function creates the network flow editor
function createEditor() {
  "use strict";
  var margin = {top: 20, right: 10, bottom: 20, left: 10};
  var width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      colors = d3.scale.category20(),
      percentile = width / 10;

  d3.select('#app-container').remove();
  var body = d3.select('body')
     .append('div')
     .attr('id', 'app-container');

  //-----------------------
  // User Interface Stuff
  //-----------------------

// JAH
  // Create a label area to report the maximum flow
  var maxFlowLabel = body.append('div')
     .attr('class', 'maxflow')
     .text("Maximum Flow: ")
     .append("span");

  // Create our command button containers
  var cmdButtonContainer = body.append('div')
     .attr('class', 'cmdbuttonContainer');

  // Add a run command button to the set of command buttons
  var runButton = cmdButtonContainer.append('button')
     .attr('class', 'button')
     .attr('name', "run")
     .attr('type', "button")
     .text("Run")
     .on('click', runEdmondsKarp_click);

  // Add a reset button to clear flow rates and max flow label
  var resetButton = cmdButtonContainer.append('button')
     .attr('class', 'button')
     .attr("name", "reset")
     .attr("type", "button")
     .text("Reset")
     .on('click', resetNetworkFlow_click);

  // Add a step button to walk through each iteration in calculating  max flow
  var stepButton = cmdButtonContainer.append('button')
     .attr('class', 'button')
     .attr("name", "step")
     .attr("type", "button")
     .text("Step")
     .on('click', stepNetworkFlow_click);

  // Create our object container
  var objContainer = body.append('div')
     .attr('class', 'objContainer');

  var objTypeLabel = objContainer.append('text')
      .attr('class', 'control_label')
      .text("Object Type:")
      .style("width", "80px")
      .style("display", "inline-block");

  var objTypeValueLabel = objContainer.append('label')
      .text("N/A")         // None until an object is selected
      .style("width", "50px")
      .style("display", "inline-block");

  var objNameLabel = objContainer.append('text')
      .attr('class', 'control_label')
      .text("Value:")
      .style("width", "60px")
      .style("display", "inline-block");

  // TextBox control for viewing/editting an object's label
  var objNameTextBox = objContainer.append('input')
      .attr('type', 'text')
      .style("width", "60px")
      .attr('disabled', "true") // default disabled until an object is selected
      .text("")
      .onKey('return', textBox_onEnter);

  var deleteButton = objContainer.append('button')
     .attr('class', 'delete')
     .attr('name', "delete")
     .attr('type', "button")
     .attr('disabled', "true") // default disabled until an object is selected
     //.attr('disabled', null)   // enabled
     .text("Delete")
     .on('click', deleteObject_click);

  var checkBoxLabel = objContainer.append('text')
    .attr('class', 'control_label')
    .text("Enable Move:")
    .style("width", "100px")
    .style("display", "inline-block");

  var moveCheckBox = objContainer.append('input')
    .attr('type', 'checkbox')
    .style("width", "10px")
    .attr('name', "move")
    .attr("checked", null)
    .on('change', movecheckBox_onChange);


  //---------------- 
  // Callbacks
  //---------------- 

  // This function is the callback for the detele button
  // This function deletes the currently selected object
  function deleteObject_click() {
    objTypeValueLabel.text('N/A');
    objNameLabel.text("Value:");
    objNameTextBox
      .attr('disabled', "true") // default disabled until an object is selected
      .attr('placeholder', "");
    deleteButton.attr('disabled', "true");

    if (selected_node) {
      networkGraph.deleteNode(selected_node.id)
      restart();
    }
    else if (selected_link) {
      networkGraph.deleteLinks(function(l) {
         return (l.source.id == selected_link.source.id && l.target.id == selected_link.target.id)
       });
      restart();
    }
    else {
      alert("Please select a node or a link first!");
    }
  } // end deleteObject_click


  // This function is the callback for when the move checkbox is changed
  // When the checkbox is checked, then nodes are allowed to be moved
  // When the checkbox is unchecked, we can drag lines from one node to the other
  // to create new edges
  function movecheckBox_onChange() {
     if (moveCheckBox.property("checked")) {
       circle.call(drag);
       svg.classed('drag', true);
     }
     else {
       circle
        .on('mousedown.drag', null)
        .on('touchstart.drag', null);
       svg.classed('drag', false);
     }
  }

  // The callback for the run command button click
  // Excutes the Edmonds-Karp algorithm and updates the graph
  function runEdmondsKarp_click() {
     var result = EdmondsKarp(networkGraph.nodes(), networkGraph.links());
     updateGraph(result[0]);
  } // end runEdmondsKarp_click


  // A wrapper function to reset the flow rates on the graph
  function resetNetworkFlow() {
     // Clear the flow rates in the graph to 0
     networkGraph.resetFlow();
     
     // clear the max flow information to display no result
     maxFlowLabel.text("");
     restart();  
  } // end resetNetworkFlow


  // The callback for resetting the network flow
  function resetNetworkFlow_click() {
     resetNetworkFlow()
  } // end resetNetworkFlow_click


  // This function performs Edmonds-Karp algorithm, determines the maximum flow,
  // logs the results and switch into flow view mode
  function stepNetworkFlow_click() {
     // Tell the browser to load the flow view URL but do not save the history
     var url = homePath + "?view=step";
     window.history.pushState(null, null, url);

     // Perform Edmonds-Karp algorithm
     var res = EdmondsKarp(networkGraph.nodes(), networkGraph.links()),
         finalFlow = res[0],
         log = res[1];

     // Log the results
     window.log = log
     window.networkGraph = networkGraph;

     stepView();
  } // end stepNetworkFlow_click

 
  // Given the resultant max flow, links and vertices, this function
  // updates the network graph with the appropriate labels 
  function updateGraph(result) {
     var flow = result.maxflow,
         tmpLinks = result.links,
         tmpNodes = result.vertices;

     networkGraph = new Graph([],[]);
     maxFlowLabel.text("");

     restart();  // clear the graph area

     // Create the new updated graph
     networkGraph = new Graph(tmpNodes, tmpLinks);
    
     // update the max flow label with the result
     maxFlowLabel.text(flow);
  
     restart();  // update the graph are with new info
  } // end updateGraph 

  // This function handles the onEnter event of the text box control
  function textBox_onEnter(e) {
    // Make the SVG drawing the active control
    svg.classed('active', true)

    // verify the event is the enter key
    // This uses jquery call to standardize the values across browsers
    // key 13 is the enter key
    if (d3.event.which !== 13) {return}

    var value = objNameTextBox[0][0].value;
    objNameTextBox[0][0].value = "";

    // Sets the name of vertex, used when a vertex is the active selection
    function setName(n, v) {
      n.name = v;
      restart();
    } // end setName

    // Sets the capacity of a link, used when an link is the active selection
    function setCapacity(e, v) {
      e.capacity = v;
      restart();
    } // end setCapacity

    // Get the capacity of a link
    function getCapacity(e, v) {
      return e.capacity;
    } // end getCapacity

    
    //
    // Now handle the input
    //

    // disable default input handler so that we can type check   
    d3.event.preventDefault();

    // Check if the field is empty
    if (value === "") {
      if (selected_node) {
        alert("Please enter valid non-empty node name!");
      } else if (selected_link) {
        alert("Please enter valid non-empty capacity value!");
      }
      return;
    } else if (!selected_node && !selected_link) {
        // oops... nothing selected  
        alert("Please select a link or node first!");
    }

    if (selected_node) {
       if (value.length > 2) {
          alert("Please enter a node name up to 2 characters in length!");
       }
       else {
          setName(selected_node, value);
       } 
    } else if (selected_link) {
      // capacity is about to change invalidating the calculated flow rates    
      resetNetworkFlow(); 

      var capacity_value = parseInt(value, null);
      if (isNaN(capacity_value)) {
        alert("Please enter a numeric value for the link capacity!");
      }
      else {
        setCapacity(selected_link, capacity_value);
      } 
    }
  } // end textBox_onEnter

  //-----------------
  // Graph SVG
  //-----------------

  var svg = body
    .append('svg')
    .attr('class', 'editor')
    .attr('width', width)
    .attr('height', height);

  // Set up initial nodes and links
  // - Source has id equal to 0 and sink has an id of 1 (reserved)
  // - links are always source < target; link directions are indicated by
  //   'left' and 'right'
  var tmpNodes = [
      {id: 0, name: 's', fixed: true, x: (percentile), y: height/2},
      {id: 1, name: 't', fixed: true, x: (width-percentile), y: height/2},
      {id: 2, name: 'a'}
    ],
      tmpLinks = [
      {source: tmpNodes[0], target: tmpNodes[2], capacity: 10},
      {source: tmpNodes[2], target: tmpNodes[1], capacity: 5}
    ];
 
  var networkGraph;
  if (window.networkGraph) {
    networkGraph = Graph.fromJSON( window.networkGraph.toJSON() );
  }
  else {
    networkGraph = new Graph(tmpNodes, tmpLinks);
  }

  // Initialize the D3 force layout
  var force = d3.layout.force()
      .nodes(networkGraph.nodes)
      .links(networkGraph.links)
      .size([width, height])
      .linkDistance(100)
      .gravity(0.1)
      .charge(-1000)
      .linkStrength(0.05)
      .on('tick', tick);

  var drag = force.drag();

  // define the arrow markers for links
  var defs = svg.append('svg:defs');

  // Define the end marker for the links
  defs.append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 6)
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('markerUnits', "userSpaceOnUse")
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

   // Create line that is displayed when draging from a node
   var drag_line = svg.append('svg:path')
       .attr('class', 'link dragline hidden')
       .attr('d', 'M0, 0L0,0')

 
  // Handles to the link and node element groups
  // the svg:g groups the svg elements together and then we select it as
  // a group.  There are two groups, one for circles and another for links/paths
  // These variables get updated with either links or nodes in the restart routine.
  var path = svg.append('svg:g').selectAll('g'),
      circle = svg.append('svg:g').selectAll('g');


  // This function performs the force layout of the graph
  // The force layout runs asynchronously.  When you call force.start(),
  // it starts performing its computations that determine the position of
  // the nodes in parallel in the background.  These computations are not
  // a single operation.  Rather it is a simulation running over a long
  // time.  The tick handler is the function that enables us to get the 
  // state of the layout when it has changed.  i.e. the simulation has
  // advanced by one tick.  This allows us to act upon the change and redraw
  // the nodes and links where they are currently located in the simulation.
  function tick() {
    // Draw and layout the directed links
    path.selectAll('path').attr('d', function(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dist = Math.sqrt(dx*dx + dy*dy),
          normX = dx / dist,
          normY = dy / dist,
          sourcePad = 12,
          targetPad = 17,
          sourceX = d.source.x + (sourcePad * normX),
          sourceY = d.source.y + (sourcePad * normY),
          targetX = d.target.x - (targetPad * normX),
          targetY = d.target.y - (targetPad * normY);

      return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    // layout the nodes
    circle.attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });
  } // end tick 


  // This function updates the graph with any graph information changes and
  // then sets the force graph into motion
  function restart() {
   // Re-seed force layout with new nodes (/links).
    force.nodes(networkGraph.nodes())
        .links(networkGraph.links());

    // path (link) group 
    path = path.data(networkGraph.links(), function(d) {return d.id});

    // add new links

    // Creates the svg group for paths
    var g = path.enter().append('g')
      .attr('class', 'link')
      .on('mousedown', function(d) {
        if(d3.event.altKey) { return }

        // select link
        mousedown_link = d;
        if(mousedown_link === selected_link) {selected_link = null}
        else {selected_link = mousedown_link;}
        selected_node = null;

        // JAH
        var capStr = "" + mousedown_link.capacity;

        objTypeValueLabel.text('Link');
        objNameLabel.text("Capacity:");
        objNameTextBox
          .attr('disabled', null) 
          .attr('placeholder', capStr)
          .text("");
        deleteButton.attr('disabled', null);

        restart();
      })

    // Add paths to the svg group
    g.append('svg:path')
      .attr('class', 'link')
      .attr('id', function(d) {return d.id})
      .classed('selected', function(d) { return d === selected_link; })
      .style('marker-end', 'url(#end-arrow)');

    g.append("svg:path")
        .attr('class', 'halo');

    g.append('text')
      .append('textPath')
        .attr('xlink:href', function (d) {return "#" + d.id})
        .attr('startOffset', '50%')
      .append('tspan')
        .attr('dy', -5);

    // remove old links
    path.exit().remove();

    // update existing links by marking the path that is selected as class 'selected'
    path.select('path').classed('selected', function(d) { return d === selected_link; })
      .style('marker-end', 'url(#end-arrow)');

    // fill in the flow and capacities on each edge
    path.select('text')
      .select('tspan')
        .text(function(d) {
          if (d.flow) {return d.flow + " / " + d.capacity;}
          else {return 0 + " / " + d.capacity;}
        });
        

    // circle (node) group
    circle = circle.data(networkGraph.nodes(), function(d) {return d.id});

    // Mark the node that is selected with the class 'selected'
    circle
      .classed('selected', function(d){ return d === selected_node; });

    // For each node, give assign it an id
    circle.selectAll('text')
        .attr('y', 4)
        .attr('class', 'id')
        .text(function(d) { return d.name; });

    // update existing nodes (selected visual states), brighter for the selected node
    circle.selectAll('circle')
      .style('fill', function(d) {
        return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
      });

    // add new nodes
    var gC = circle.enter().append('svg:g');

    // Add the circle where it should be.
    gC.attr('class','node')
        .classed('selected', function(d){ return d === selected_node })
        .attr('transform', function(d) {
          if (!d.x || !d.y) {return ""}
          return 'translate(' + d.x + ',' + d.y + ')';
        })

    gC.append('svg:circle')
      .attr('r', 12)
      .style('fill', function(d) {
        return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
      })
      .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); });

    // show node names
    gC.append('svg:text')
        .attr('y', 4)
        .attr('class', 'name')
        .text(function(d) { return d.name; });

    gC.on('mouseover', function(d) {
        if(!mousedown_node || d === mousedown_node) {return}
        // e.target target node
        d3.select(this).select('circle').transition().attr('transform', 'scale(1.1)');
      })
      .on('mouseout', function(d) {
        if(!mousedown_node || d === mousedown_node) {return}
        // unenlarge target node
        d3.select(this).select('circle').transition().attr('transform', '');
      })
      .on('mousedown', function(d) {
        if(d3.event.altKey) {return} 

        // select node
        mousedown_node = d;
        selected_node = mousedown_node;
        selected_link = null;

        objTypeValueLabel.text('Node');
        objNameLabel.text("Value:");
        objNameTextBox
          .attr('disabled', null) // default disabled until an object is selected
          .attr('placeholder', mousedown_node.name)
          .text("");

        deleteButton.attr('disabled', null);

        // reposition drag line
        drag_line
          .style('marker-end', 'url(#end-arrow)')
          .classed('hidden', false)
          .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

        restart();
      })
      .on('mouseup', function(d) {

        if(!mousedown_node) {return}
        // needed by FF
        drag_line.classed('hidden', true)
          .style('marker-end', '');

        // check for drag-to-self
        mouseup_node = d;
        if(mouseup_node === mousedown_node) { resetMouseEventVars(); return; }

        // unenlarge target node
        d3.select(this).select('circle').transition().attr('transform', '');

        // add link to graph (update if exists)
        // NB: links are strictly source < target; arrows separately specified by booleans
        var source = mousedown_node,
            target = mouseup_node;

        var link = networkGraph.addLink({source: source, target: target});

        var capStr = "" + link.capacity;

        objTypeValueLabel.text('Link');
        objNameLabel.text("Capacity:");
        objNameTextBox
          .attr('disabled', null)
          .attr('placeholder', capStr)
          .text("");

        deleteButton.attr('disabled', null);

        // select new link
        selected_link = link;
        selected_node = null;
        restart();
      });

    // remove old nodes
    circle.exit().remove();


    // set the graph in motion
    force.start();
  } // end restart


  // 
  // Mouse Events
  //
  
  // Mouse Event Variables
  var selected_node = null,
      selected_link = null,
      mousedown_node = null,
      mouseup_node = null,
      mousedown_link = null;

  // This function reset the mouse event variables to an initialized state
  function resetMouseEventVars() {
    mousedown_node = null;
    mousedown_link = null;
    mouseup_node = null;
  } // end resetMouseEventVars


  //
  // Mouse Event Listeners
  // 

  // Mouse listener that handles when the mouse click goes down 
  function mousedown() {
    // Make the SVG drawing the active control
    svg.classed('active', true)

    // verify the event is left mouse down click
    // This uses jquery call to standardize the values across browsers
    // 1 for left, 2 for middle, and 3 for right mouse buttons
    if (d3.event.which !== 1) {return}

    // Verify the event is on the blank canvas
    // Otherwise we are perfoming a different operation
    // such as node selection (indicated by mousedown_node) or 
    // link selection (indicated by mousedown_link) or
    // alt-key in combination with the mouse down to drag an object 
    // to rearrange it the graph.
    if (d3.event.altKey || mousedown_node || mousedown_link) { return }


    // Insert a new node at the mouse down location
    var pt = d3.mouse(this),
        node = networkGraph.addNode(pt); 

    // Add an indicator in the text box on what it currently can be used for
    // At this moment, we can creat a name (tag) for the node.
    objTypeValueLabel.text('Node');
    objNameLabel.text("Value");
    objNameTextBox
      .attr('disabled', null)
      .attr('placeholder', "")
      .text("");
      
    deleteButton.attr('disabled', null);

    // Update our selected object tracking variables to indicate that a 
    // node and not a link is currently selected
    selected_link = null;
    selected_node = node;

    restart();
  } // end mousedown


  // Mouse listener that handles when the mouse pointer moves
  // In particular, this function creates the drag line from a selected 
  // vertex to the current mouse position. 
  function mousemove() {
    // Check if we have the mouse button down as we drag from a vertex node
    // If no vertex node is selected we simply return
    if (!mousedown_node) {return}
    
    // Create a line from the node to our current position
    drag_line.attr('d', 'M' + mousedown_node.x + ',' + 
                   mousedown_node.y + 'L' + 
                   d3.mouse(this)[0] + ',' +
                   d3.mouse(this)[1]);

    restart(); 
  } // end mousemove


  // Mouse listener that handles when the mouse click goes up
  function mouseup() {
    // Check if the drag line is no longer needed
    // i.e. the mouse button is up and we successfully created an link to the
    // graph  or we failed to match up to a target node.
    if (mousedown_node) {
      drag_line
        .classed('hidden', true)
        .style('marker-end', '');
    }

    svg.classed('active', false);

    resetMouseEventVars();
  } // end mouseup


  //
  // Key Listeners
  //

  // This function handles cases when a key is pressed.
  // In particular, we are allowing the following key combination to be
  // used in combination with the mouse click:
  // alt-key + 
  function keydown() {
     if (d3.event.altKey) {
       circle.call(drag);
       svg.classed('drag', true);
     }
  } // end keydown


  // This function disables the drag feature of a node when the key 
  // is depressed.  In particular, the alt-key.  However, any up key event
  // will do.  This keyup event will disable the drag mode for both 
  // mouse and touch interfaces
  function keyup() {
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('drag', false);
  } // end keyup

  // This function enables the delete button to remove an object
  function removeObject() {
     // Prevent the default behavior of delete which is to go back a page
     d3.event.preventDefault();

     if (selected_node) {
      networkGraph.deleteNode(selected_node.id);
     } else if(selected_link) {
       networkGraph.deleteLinks(function(l) {return l === selected_link; });
     }

     selected_link = null;
     selected_node = null;

     resetNetworkFlow();
     restart();
  } // end removeObject

  // Enable the listeners
  d3.select(window)
    .onKey('backspace/del', removeObject);

 
  //----------------------- 
  // Start the force graph 
  //-----------------------
  svg.on('mousedown', mousedown)
     .on('mousemove', mousemove)
     .on('mouseup', mouseup);

  d3.select(window)
     .on('keydown', keydown)
     .on('keyup', keyup);

  restart();  // draws everything and sets the force graph in motion
} // end createEditor

createEditor(); 
