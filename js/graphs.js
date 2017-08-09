
// This is an immediately-Invoked Function Expression (IIFE)
// This function is executed right after it's created, not after it is parsed.
// The entire script block is parsed before any code in it is executed
(function() {
  "use strict";

  // Graph Class
  window.Graph = Graph;

  // Class object constructor
  function Graph(nodes, links) {
    // preserve the this object for use in the forEach block
    var self = this; 

    this._nodes = nodes;
    this._lastLinkId = 0;
    this._links = [];

    this.toJSON();
    links.forEach(function(e) { self.addLink(e) });

    // Get the max id so that the added nodes will have a unique id.
    this._lastNodeId = nodes.reduce(function( acc, x ){
      return x.id > acc ? x.id : acc;
    }, 0);

    return this;
  } // end constructor
 


  // This function converts the graph to JSON  (JAVA Script Object Notation
  Graph.prototype.toJSON = function() {
    // Make a new copy of links.
    var es = JSON.parse(JSON.stringify(this._links));
    es.map(function(e) {
      e.source = e.source.id;
      e.target = e.target.id;
      return e;
    });

    var graph = {
      vertices: this._nodes,
      links: es,
    },
    graphJSON = JSON.stringify(graph, null, 2);

    return graphJSON;
  }; // end toJSON


  // This function loads the graph from JSON (Java Script Object Notation)
  Graph.fromJSON = function(JSONString) {
    var graphObj = JSON.parse(JSONString);

    var ns = graphObj.vertices;

    var ls = graphObj.links.map(function(e){
      var sourceId = e.source,
          targetId = e.target;
      e.source = ns.filter(function(n) {
        return n.id === sourceId;
      })[0];
      e.target = ns.filter(function(n) {
        return n.id === targetId;
      })[0];
      return e;
    });

    return new Graph(ns, ls);
  }; // end fromJSON


  // This function resets the graph flow rates to 0
  Graph.prototype.resetFlow = function() {
    this._links.forEach(function(l) {
      l.flow = 0;
    });
  }; // end resetFlow


  // This access function returns the nodes in the graph
  Graph.prototype.nodes = function() {
    return this._nodes;
  }; // end nodes


  // This access function returns the links (edges) in the graph
  Graph.prototype.links = function() {
    return this._links;
  }; // end links


  // This function adds a node to the graph
  // Given a x,y coordinate point, a new node is created at that x,y coordinate
  // and with a node id that is one greater than the last created node.
  Graph.prototype.addNode = function(point) {
    var node =
      { id: ++this._lastNodeId
      , x: point[0]
      , y: point[1]
      };
  
    this._nodes.push(node);
    return node;
  }; // end addNode


  // This function returns a node from the graph with a specified node id
  Graph.prototype.getNode = function(id) {
    if (! this._nodes) {return null}

    var res = this._nodes.filter(function (n) {
      return n.id === id;
    });

    if (res.length === 0) {return null}

    return res[0];
  }; // end getNode


  // This function deletes a node from the graph with a specified node id
  Graph.prototype.deleteNode = function(id) {
    this._nodes = this._nodes.filter(function(n) { return n.id !== id; });

    // Remove links incident to node
    this.deleteLinks(function(l) {
      return (l.source.id === id || l.target.id === id);
    });
  }; // end deleteNode


  // This function inserts a new link (edge) into the graph
  // This function takes a link object that specifies the source and target nodes
  // to draw the edge to/from.
  Graph.prototype.addLink = function(link) {
    var source = link.source,
        target = link.target;

    var previous = this.getLink(source, target);

    if (previous) {return previous}

    link.id = Date.now().toString() + (++this._lastLinkId).toString();

    this._links.push( link );

    return link;
  }; // end addLink


  // This function returns a link given the source and target of the link
  Graph.prototype.getLink = function(source, target) {
    if (!this._links) {return null}

    var res = this._links.filter(function(l) {
      return (l.source === source && l.target === target);
    });

    if (res.length === 0) {return null}

    return res[0];
  }; // end getLink


  // This function deletes the links in the graph given a callback routine
  Graph.prototype.deleteLinks = function(cb) {
    var self = this;
    var toSplice = this._links.filter(cb);

    toSplice.map(function(l) {
      self._links.splice(self._links.indexOf(l), 1);
    });
  }; // end deleteLinks


  // Residual Sub-Class
  window.Residual = Residual;

  // The residual graph is required to finding the max flow in a flow network
  // This function take as input the network flow graph and the previous residual graph
  function Residual(graph, preres) {
    var self = this,
        ns = [],
        ls = [];

    var id;
    for (id in preres) {
      var es = preres[id];

      id = parseInt(id.charAt(1));
      ns.push({id: id});

      // No need to check for dupulicates
      es.forEach(function (e) {
        ls.push({
          source: id,
          target: parseInt(e.target),
          flow: e.flow
        });
      });
    } // end for

    ns = ns.map(function(n) {
      var node = graph.getNode(n.id);
      return JSON.parse( JSON.stringify(node) );
    });

    ls = ls.map(function(e){
      var sourceId = e.source,
          targetId = e.target;
      e.source = ns.filter(function(n) {
        return n.id === sourceId;
      })[0];
      e.target = ns.filter(function(n) {
        return n.id === targetId;
      })[0];
      return e;
    });

    return new Graph(ns, ls);
  }

})(); // end IIFE

