// The labs; data/labs.json puts them in the order of the lecture notes under their chapters. Adding a lab: write its
// module, add it here and its words to data/labs.json.
import rlc from "./rlc.js";
import dcmotor from "./dcmotor.js";
import tank from "./tank.js";
import phase from "./phase.js";
import nyquistplot from "./nyquistplot.js";
import bode from "./bode.js";
import pt1 from "./pt1.js";
import pt2 from "./pt2.js";
import pid from "./pid.js";
import deadtime from "./deadtime.js";
import polezero from "./polezero.js";
import loop1dof from "./loop1dof.js";
import routh from "./routh.js";
import nyquist from "./nyquist.js";
import fkl from "./fkl.js";
import sampling from "./sampling.js";
import tustin from "./tustin.js";
import reach from "./reach.js";
import placement from "./placement.js";
import observer from "./observer.js";
import drive from "./drive.js";
import sink from "./sink.js";
import kinematics from "./kinematics.js";
import collision from "./collision.js";
import energy from "./energy.js";
import friction from "./friction.js";
import smd from "./smd.js";
import angular from "./angular.js";
import lagrange from "./lagrange.js";
import radiation from "./radiation.js";
import wall from "./wall.js";
import cylinder from "./cylinder.js";
import fin from "./fin.js";
import transient from "./transient.js";
import fdm from "./fdm.js";

export const labs = [rlc, dcmotor, tank, phase, nyquistplot, bode, pt1, pt2, pid, deadtime, polezero, loop1dof, routh, nyquist, fkl, sampling, tustin, reach, placement, observer, drive, kinematics, collision, energy, friction, smd, angular, lagrange, radiation, wall, cylinder, fin, transient, fdm, sink];
