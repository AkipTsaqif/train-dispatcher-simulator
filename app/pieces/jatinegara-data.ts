// Jatinegara data tables that are NOT geometric (Phase 9 Step 6).
//
// These stay authored because no placement rule produces them: which lever
// couples which switches, what a block section covers (a graph-global
// question), where trains stop, and the legacy node ordering.
//
// Signals keep explicit edge ids here rather than group+x, because their
// offsets were tuned against the generated split points; re-deriving them
// would change the compiled output for no benefit.

import type {
  StationStopPoint,
  SwitchControlGroup,
  TopologySignal,
} from "../lib/topology";

export const JATINEGARA_CONTROL_GROUPS: readonly SwitchControlGroup[] = [
  {"id":"PC1","switchIds":[1,6],"coupled":true},
  {"id":"PC2","switchIds":[7,15],"coupled":true},
  {"id":"PC3","switchIds":[16,26],"coupled":true},
  {"id":"PC4","switchIds":[25,17],"coupled":true},
  {"id":"PC5","switchIds":[46,41],"coupled":true},
  {"id":"PC6","switchIds":[40,47],"coupled":true},
  {"id":"PC7","switchIds":[42,27],"coupled":true},
  {"id":"PC8","switchIds":[48,52],"coupled":true},
  {"id":"PC9","switchIds":[28,38],"coupled":true},
  {"id":"PC10","switchIds":[2,9],"coupled":true},
  {"id":"PC11","switchIds":[8,3],"coupled":true},
  {"id":"PC12","switchIds":[10,18],"coupled":true},
  {"id":"PC13","switchIds":[20,11],"coupled":true},
  {"id":"PC14","switchIds":[30,19],"coupled":true},
  {"id":"PC15","switchIds":[32,21],"coupled":true},
  {"id":"PC16","switchIds":[22,13],"coupled":true},
  {"id":"PC17","switchIds":[12,4],"coupled":true},
  {"id":"PC18","switchIds":[14,5],"coupled":true},
  {"id":"PC19","switchIds":[23,33],"coupled":true},
  {"id":"PC20","switchIds":[24,35],"coupled":true},
  {"id":"g29","switchIds":[29],"coupled":false},
  {"id":"g31","switchIds":[31],"coupled":false},
  {"id":"g34","switchIds":[34],"coupled":false},
  {"id":"g53","switchIds":[57],"coupled":false},
  {"id":"PC21","switchIds":[59,61],"coupled":true},
  {"id":"g36","switchIds":[36],"coupled":false},
  {"id":"g43","switchIds":[43],"coupled":false},
  {"id":"g44","switchIds":[44],"coupled":false},
  {"id":"g49","switchIds":[49],"coupled":false},
  {"id":"g50","switchIds":[50],"coupled":false},
];


