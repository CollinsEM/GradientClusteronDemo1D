/**
   The gist of this experiment is to get some experience navigating a 1D
   data stream using one or more HTM columns. The specific example used
   here is navigating through the base pairs of some randomly generated
   snipet of DNA.
   
   At the very minimum, we should be able to implement a grid cell module
   for keeping track of position relative to certain specific features.
*/

window.addEventListener('load', init);
window.addEventListener('click', onClick);
// List of useful colors
const COLORS = ['rgb(192,128,64)', 'rgb(128,64,192)', 'rgb(192,64,128)', 'rgb(64,128,192)',
                'magenta', 'yellow', 'purple', 'orange', 'pink',
                'red', 'green', 'lime', 'blue', 'orange'];
// The four letters of the DNA alphabet
const ACGT = ['A','C','G','T'];
// Inverse of the map above
const INDEX = { 'A' : 0, 'C' : 1, 'G' : 2, 'T' : 3 } ;
const numBase = ACGT.length;
const baseColor = COLORS.slice(0, numBase);
// Length of the generated sequence
let seqLength = 120;
// Number of independent sensor patches
let numPatches = 3;
// Number of sensors per patch
let numSensors = 5;
// Number of mini-columns in the temporal memory
let numMC = 4*numSensors+3;
// Number of cells per mini-column
let numCellsMC = 8;
// Starting location of the sensor patches
let start = new Array(numPatches);
// Current location of the sensor patches
let pos = new Array(numPatches);
// Handle to the DOM element displaying the sequence
var domSeq, domObs, domEnc, canvas, context;
var seqSpan = [], obsDiv = [], obsSpan = [], refSpan = [], obsBase = [], refBase = [];
var seqText;        // Entire sequence
var startSeq = [];  // Start sequence for each patch
var currSeq = [];   // Current sequence for each patch
var R=10, colSep = 3*R, rowSep = 3*R;
var colWidth = Math.max((numSensors*4+3), numMC)*colSep;
var graph = new Array(numPatches);

function init() {
  // Get a handle to the DOM element
  domSeq = document.getElementById('sequence');
  domObs = document.getElementById('observation');
  domEnc = document.getElementById('obsEncoded');
  
  // Fill the DOM element with a random sequence of base pairs
  seqText = "";
  for (let i=0; i<seqLength; ++i) {
    seqSpan[i] = document.createElement("span");
    let b = Math.floor(Math.random()*4);
    let base = ACGT[b];
    seqSpan[i].innerText = base;
    seqSpan[i].style.color = baseColor[b];
    domSeq.appendChild(seqSpan[i]);
    seqText += base;
  }
  console.log(seqText);
  
  let NI = numSensors*numPatches;
  for (let i=0; i<numPatches; ++i) {
    let patchWidth = seqLength/(numPatches);
    obsDiv[i] = document.createElement("div");
    
    refSpan[i] = document.createElement("span");
    obsDiv[i].appendChild(refSpan[i]);
    
    var gap = document.createElement("span");
    gap.innerText = " -- ";
    obsDiv[i].appendChild(gap);
    
    obsSpan[i] = document.createElement("span");
    obsSpan[i].classList.add("sensor");
    obsDiv[i].appendChild(obsSpan[i]);
    
    domObs.appendChild(obsDiv[i]);
    
    start[i] = Math.floor(i*Math.floor(patchWidth) + Math.random()*(patchWidth-numSensors));
    pos[i] = start[i];
    startSeq[i] = "";
    refBase[i] = [];
    obsBase[i] = [];
    for (let j=0; j<numSensors; ++j) {
      const base = seqText[start[i]+j];
      const b = INDEX[base];
      startSeq[i] += base;
      
      refBase[i][j] = document.createElement("span");
      refBase[i][j].innerText = base;
      refBase[i][j].style.color = baseColor[b];
      refSpan[i].appendChild(refBase[i][j]);
      
      obsBase[i][j] = document.createElement("span");
      obsBase[i][j].innerText = base;
      obsBase[i][j].style.color = baseColor[b];
      obsSpan[i].appendChild(obsBase[i][j]);
    }
  }
  // Prepare the canvas for the graphs
  canvas = document.getElementById('canvas');
  canvas.width  = 4*numPatches*(numSensors+1)*colSep;
  canvas.height = (window.innerHeight-domSeq.clientHeight-domObs.clientHeight)*canvas.width/window.innerWidth;
  context = canvas.getContext('2d');
  context.font = '20px sans-serif';
  console.log(context.font);
  // console.log(canvas.width, canvas.height);
  for (let i=0; i<numPatches; ++i) {
    // Initialize the graph
    graph[i] = new Graph(0.05*canvas.width, i*canvas.height/numPatches,
                         0.9*canvas.width, 0.9*canvas.height/numPatches,
                         i, numSensors, numBase);
  }
  // Enter the main update loop
  update();
}

var running = true;
function onClick() {
  running = !running;
  if (running) update();
}

var numCycles = 0;
var numFrames = 0;
var maxFrames = 30;
const t0 = Date.now();
function update() {
  if (running) requestAnimationFrame(update);
  // Reset the default styles on all of the base pairs
  context.clearRect(0, 0, canvas.width, canvas.height);
  // Update the sensor locations every maxFrames iterations
  if ((numFrames++)%maxFrames==0) {
    numCycles++;
    // Clear the background at the current patch locations
    for (let i=0; i<numPatches; ++i) {
      for (let j=0, p=pos[i]; j<numSensors; ++j, ++p) {
        seqSpan[p].style.background = "rgb(0,0,0)";
      }
    }
    for (let i=0; i<numPatches; ++i) {
      // Compute a new location for the patch
      const dx = Math.floor(3*Math.random()-1); // left: -1, stay: 0, right: 1
      const loc = Math.min(seqLength-numSensors-1,Math.max(0,pos[i] + dx));
      pos[i] = loc;
      currSeq[i] = "";
      // obsSpan[i].innerText = "";
      for (let j=0, p=pos[i]; j<numSensors; ++j, ++p) {
        const base = seqText[p];
        const b = INDEX[base];
        obsBase[i][j].innerText = base;
        obsBase[i][j].style.color = baseColor[b];
        currSeq[i] += base;
      }
      var color = (currSeq[i] == startSeq[i] ? "green" : "gray");
      for (let j=0, p=pos[i]; j<numSensors; ++j, ++p) {
        seqSpan[p].style.background = color;
      }
    }
  }
  const t = (Date.now()-t0)/1000;
  // Update the synaptic activations every iteration
  for (let i=0; i<numPatches; ++i) {
    // graph[i].bias = Math.cos(t);
    graph[i].updateSynapseActivations(currSeq[i]);
    graph[i].updateDendriteActivation();
    // Update the weights - expected is true when the observed
    // sequence at the patches' current position is the same as the
    // one at its orginal start postion
    const expected = (currSeq[i] == startSeq[i] ? 1 : 0);
    graph[i].updateSynapseWeights(expected);
    graph[i].updateSynapseLocations(expected);
    // const tp = ( expected &&  graph[i].activation);
    // const fn = ( expected && !graph[i].activation);
    // const tn = (!expected && !graph[i].activation);
    // const fp = (!expected &&  graph[i].activation);
    const color = ( expected ?
                    ( graph[i].activation ? "green" : "cyan") :
                    ( graph[i].activation ? "red" : "gray" ) );
    obsSpan[i].style.background = color;
    graph[i].render(color);
  }
}

class RGB {
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  hexify() {
    var r = this.r.toString(16);
    var g = this.g.toString(16);
    var b = this.b.toString(16);
    if (r.length < 2) r = '0' + r;
    if (g.length < 2) g = '0' + g;
    if (b.length < 2) b = '0' + b;
    return `#${r}${g}${b}`;
  }
};

function rgb(r,g,b) { return new RGB(r,g,b); }

function renderNode(x, y, fill, stroke) {
  context.beginPath();
  context.strokeStyle = (stroke.r === undefined ? stroke : stroke);
  context.fillStyle   = (fill.r   === undefined ? fill   : fill);
  context.arc(x, y, R, 0, 2*Math.PI, true);
  context.fill();
  context.stroke();
}

