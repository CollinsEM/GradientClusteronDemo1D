# GradientClusteronDemo1D

## Visualization of the 1D Gradient Clusteron dendrite learning algorithm.

In this example, we establish a 1D domain with four possible input
features at each location (e.g. one of four base pairs). The top line
is the input domain. On this line, you will see three sensor patches
moving randomly over the domain. Each sensor patch has five sensors
and each sensor has four detectors that distinguish whether a feature
is present or not under each sensor.

The three lines below show a target pattern and current input to each
of the three sensor patches. For each sensor patch, there are 20
pre-synaptic neurons (not shown), and of these, five will be active
during each cycle (corresponding to the currently active detector on
each sensor).

The graphs shown below are visualizations of dendrites for three
post-synaptic neurons. Each dendrite has 20 synapses attached to the
20 pre-synaptic neurons corresponding to the detectors within each
sensor patch. Every synapse has an associated weight and location on
the dendrite. The synaptic weights are indicated by the vertical bars
along the dendrite, and location is represented by its position along
the x-axis.

Activated synapses will generate a localized effect along the dendrite
inversely proportional to the distance away from the synapse
location. This effect is indicated by the Gaussian bump centered on
each active synapse.

The dendrite activation is depicted by the thicker plot line, and the
total activation is integrated into the bar on the far right. The
white horizontal line on this bar is the post-synaptic neuron firing
threshold. These plots will take on different colors depending on the
current state. Green for successful detection of the target pattern
(true-positive), gray for successful non-detection of the pattern
(true-negative), red for detection of the pattern when not present
(false-positive), and cyan for failure to detect the target pattern
(false-negative).

The learning rules for the synaptic weights and positions follows that
described in <a href="https://doi.org/10.1371/journal.pcbi.1009015">
this paper</a> by Toviah Moldwin, et.al.
