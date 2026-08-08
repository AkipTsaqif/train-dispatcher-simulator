"use client";

// Jatinegara — interactive dispatching table (schematic mode).
// Click signals to set routes (auto route set), throw points, and watch the
// interlocking respond, exactly like the Bekasi table.

import DispatchingTable from "../components/dispatching-table";
import { JATINEGARA_DISPATCH } from "../dispatching/jatinegara";

export default function JatinegaraPage() {
  return <DispatchingTable dispatch={JATINEGARA_DISPATCH} />;
}
