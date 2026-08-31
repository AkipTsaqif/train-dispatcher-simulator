import DispatchingTable from "./components/dispatching-table";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">
      <DispatchingTable />
    </main>
  );
}
