import React from "react";
import AreaChart from "./components/AreaChart";

function App() {
  return (
    <div className="bg-[#10141e] text-white text-opacity-75 min-h-screen p-8">
      <h1 className="text-xl">DEX Volume Chart</h1>
      <AreaChart />
    </div>
  );
}

export default App;
