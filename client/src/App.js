import React from 'react';
import './App.css';
import ControlPanel from './ControlPanel'
import MediaBoard from './MediaBoard'

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path='/media'>
            <MediaBoard />
          </Route>
          <Route path='/'>
            <ControlPanel />
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
