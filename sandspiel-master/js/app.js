import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";

import { Index } from "./components/ui";

let sizeMap = [2, 5, 10, 18, 30, 45];

function AppRouter() {
  return (
    <Router>
      <Route path="/" component={Index} />
    </Router>
  );
}

ReactDOM.render(<AppRouter />, document.getElementById("ui"));

export { sizeMap };
