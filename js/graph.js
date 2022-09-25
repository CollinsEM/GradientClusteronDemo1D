const lambda = 100;  // Pulse half-width
const DX = 1;
const C = 60;
const N = 100;
const eta_w = 0.002;            // Weight learning rate
const eta_x = 0.00002;          // Location learning rate
const synapseNoise = 0.0;       // Synaptic noise
const dendriteNoise = 0.0;      // Dendrite activation
const synapseThreshold = 0.9;   // Synapse activation threshold
const dendriteThreshold = 0.9;  // Dendrite activation threshold

class Graph {
  constructor(x0, y0, dx, dy, I, NJ, NK) {
    this.x0 = x0;
    this.y0 = y0;
    this.dx = dx;
    this.dy = dy;
    this.I  = I;  // Number of this sensor patch
    this.NJ = NJ; // Number of sensors per patch
    this.NK = NK; // Number of detectors per sensor
    this.NX = Math.floor(this.dx/DX);
    this.bias = 0.0;
    this.activation = 0.0;            // Post-synaptic neuron activation
    this.Dz = new Float32Array(this.NX)    // Distribution of dendrite excitation
    this.synapse = new Array(NJ);
    for (var j=0; j<NJ; ++j) {
      this.synapse[j] = new Array(NK);
      for (var k=0; k<NK; ++k) {
        this.synapse[j][k] = {
          // w: 2*Math.random()-1,             // Synapse weight (bipolar)
          // x: dx*Math.random(),              // Synapse location (random spacing)
          w: Math.random(),                 // Synapse weight (unipolar)
          x: (j*NK+k+1)*(this.NX)/(NJ*NK+1),// Synapse location (uniform spacing)
          y: 0.0,                           // Presynaptic neuron activation
          wy: 0.0,                          // Synaptic activation
          z: new Float32Array(this.NX)      // Plot of synaptic activation influence
        };
      }
    }
  }
  //------------------------------------------------------------------
  // Update the activation state of the synapse attached to the k'th
  // channel on the j'th sensor subject to noisy input from the
  // presynaptic neuron.
  //
  // If the detector type (k) is the same as the input feature
  // currently at the j'th sensor (j) on the i'th patch (i), then test
  // will be true and the detector will activate with a
  // high-probability, P=(1.0-synapseNoise). Otherwise, it will activate
  // with a low probability, P=(synapseNoise).
  // ------------------------------------------------------------------
  updateSynapseActivations(currSeq) {
    for (let j=0; j<this.NJ; ++j) {
      for (let k=0; k<this.NK; ++k) {
        // Check to see if the current detector matches the input
        const t = Math.random();
        const test = obsBase[this.I][j].innerText == ACGT[k];
        let S = this.synapse[j][k];
        // Presynaptic neuron activation
        S.y = (test ? ( t > synapseNoise ? 1 : 0 ) : ( t < synapseNoise ? 1 : 0 ) );
        // Synaptic activation
        S.wy = S.w*S.y;
        for (let nx=0, x=0; nx<this.NX; ++nx, x+=DX) {
          S.z[nx] = S.wy*this.evalGaussian(x, S.x, 1, lambda);
        }
      }
    }
  }
  //------------------------------------------------------------------
  // Update the activation state of the dendrite attached to the i'th
  // sensor patch.
  //------------------------------------------------------------------
  updateDendriteActivation() {
    // Initialize the dendrite activation to the current bias
    this.Da = this.bias;
    for (let nx=0; nx<this.NX; ++nx) {
      this.Dz[nx] = this.bias;
    }
    // For every synapse on this dendrite compute its nonlinear
    // contribution to the dendrite activation.
    for (let j0=0; j0<this.NJ; ++j0) {
      for (let k0=0; k0<this.NK; ++k0) {
        const S0 = this.synapse[j0][k0];
        S0.a = 0.0; // accumulate dendrite excitation due to synapse(j0,k0)
        for (let j1=0; j1<this.NJ; ++j1) {
          for (let k1=0; k1<this.NK; ++k1) {
            const S1 = this.synapse[j1][k1];
            S0.a += S0.wy*S1.wy*this.evalGaussian(S0.x, S1.x, 1, lambda);
            for (let nx=0; nx<this.NX; ++nx) {
              this.Dz[nx] += S0.z[nx]*S1.z[nx];
            }
          }
        }
        this.Da += S0.a; // Accumulate boosted synaptic activations
      }
    }
    // Compute the noisy activation of the post-dendritic neuron
    // const s = dendriteNoise*(Math.random()-0.5);
    // const t = 0.0*Math.random();
    // this.activation = (this.dendrite.y+s > this.threshold ? (1-t) : t);
    // for (let idx=0; idx<this.NX; ++idx) {
    //   this.dendrite.z[idx] += this.activation*this.dy/2;
    // }
    this.activation = (this.Da > dendriteThreshold ? 1 : 0);
  }
  //------------------------------------------------------------------
  // Update the synpase locations on the dendrite.
  updateSynapseLocations(expected) {
    if (expected == this.activation) return;
    const dA = (expected-this.activation);
    let dX = new Float64Array(this.NJ*this.NK);
    for (let j0=0; j0<this.NJ; ++j0) {
      for (let k0=0; k0<this.NK; ++k0) {
        const s0 = j0*this.NK + k0;
        dX[s0] = 0.0;
        const S0 = this.synapse[j0][k0];
        // const F0 = eta_x*(expected - this.activation)*S0.wy;
        for (let j1=0; j1<this.NJ; ++j1) {
          for (let k1=0; k1<this.NK; ++k1) {
            const S1 = this.synapse[j1][k1];
            // dx[j0][k0] += F0*(S1.x-S0.x)*S1.wy;
            const Fij = this.evalGaussian(S0.x, S1.x, 1, lambda)
            dX[s0] -= eta_x*dA*(S1.x-S0.x)*S0.wy*S1.wy*Fij;
          }
        }
      }
    }
    // console.log(this.I, dx);
    for (let j0=0; j0<this.NJ; ++j0) {
      for (let k0=0; k0<this.NK; ++k0) {
        const s0 = j0*this.NK + k0;
        // console.log(dx[s0]);
        let X = this.synapse[j0][k0].x + dX[s0]*this.dx;
        this.synapse[j0][k0].x = Math.min(this.NX,Math.max(0,X));
      }
    }
  }
  //------------------------------------------------------------------
  // Update the synpase weights on the dendrite.
  updateSynapseWeights(expected) {
    if (expected == this.activation) return;
    for (let j=0; j<this.NJ; ++j) {
      for (let k=0; k<this.NK; ++k) {
        const s = this.synapse[j][k];
        s.w += eta_w*(expected - this.activation)*s.a/s.w;
      }
    }
  }
  // Plot the data series given in z, using the provided line color
  // and line width.
  plotData(z, color, width) {
    const Y0 = this.y0 + this.dy/2;
    const dy = this.dy/2;
    context.beginPath();
    context.lineWidth = width;
    context.strokeStyle = color
    context.moveTo(this.x0, Y0-z[0]);
    for (let idx=1, x=this.x0+DX; idx<this.NX; ++idx, x+=DX) {
      context.lineTo(x, Y0 - z[idx]*dy);
    }
    context.stroke();
  }
  plotActivation(color) {
    const X0 = this.x0+this.dx;
    const dx = 0.01*this.dx;
    const Y0 = this.y0 + this.dy/2;
    const dy = this.dy/2;
    
    context.fillStyle = color;
    context.fillRect(X0, Y0, dx, -this.Da*dy);
    context.beginPath();
    context.lineWidth = 3;
    context.strokeStyle = "white";
    context.moveTo(X0-0.1*dx, Y0-dendriteThreshold*dy);
    context.lineTo(X0+1.1*dx, Y0-dendriteThreshold*dy);
    context.stroke();
  }
  render(color) {
    this.renderXAxis();
    this.renderYAxis();
    for (let j=0; j<this.NJ; ++j) {
      for (let k=0; k<this.NK; ++k) {
        this.plotData(this.synapse[j][k].z, baseColor[k], 1);
      }
    }
    this.plotData(this.Dz, color, 3);
    this.plotActivation(color);
  }
  evalGaussian(x, X, a, b) {
    let z = x-X;
    return a*Math.exp(-0.5*(z*z)/(b*b));
  }
  renderXAxis() {
    const X0 = this.x0;
    const Y0 = this.y0 + this.dy/2;
    const dy = this.dy/2;
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = 'white';
    context.moveTo(X0,         Y0);
    context.lineTo(X0+this.dx, Y0);
    context.stroke();
    for (let j=0; j<this.NJ; ++j) {
      for (let k=0; k<this.NK; ++k) {
        const s = this.synapse[j][k];
        context.beginPath();
        context.strokeStyle = baseColor[k];
        context.moveTo(X0+s.x, Y0);
        context.lineTo(X0+s.x, Y0-this.synapse[j][k].w*this.dy/2);
        context.stroke();
        context.fillStyle = baseColor[k];
        context.fillText(ACGT[k], X0+s.x, Y0+20);
      }
    }
  }
  renderYAxis() {
    const X0 = this.x0;
    const Y0 = this.y0;
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = 'white';
    context.moveTo(X0, Y0);
    context.lineTo(X0, Y0+this.dy);
    context.stroke();
  }
};
