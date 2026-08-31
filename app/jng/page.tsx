"use client";

// Jatinegara — interactive dispatching table (schematic mode).
// Click signals to set routes (auto route set), throw points, and watch the
// interlocking respond, exactly like the Bekasi table.

import DispatchingTable from "../components/dispatching-table";
import { JATINEGARA_DISPATCH } from "../dispatching/jatinegara";

export default function JatinegaraPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">
      <DispatchingTable dispatch={JATINEGARA_DISPATCH} />
    </main>
  );
}
