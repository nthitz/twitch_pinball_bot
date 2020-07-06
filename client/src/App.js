import React, { useEffect, useState } from 'react';
import './App.css';
import classnames from 'classnames';
function App() {
  const [filters, setFilters] = useState([])
  const [scenes, setScenes] = useState([])
  useEffect(() => {
    window.fetch('/getFilters')
      .then(r => r.json())
      .then(f => {
        setFilters(f)
      })
    window.fetch('/getScenes')
      .then(r => r.json())
      .then(s => {
        setScenes(s)
      })

  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      window.fetch('/getScenes')
      .then(r => r.json())
      .then(s => {
        /// this looks dumb but it's me just trying to keep the network conn alive
      })
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const enableFilter = filter => event => {
    if (filter === 'reset') {
      window.fetch('/reset')
    } else {
      window.fetch(`/enableFilter?f=${filter}`)
    }
  }
  const switchToScene = scene => event => {
    window.fetch(`/switchToScene?scene=${scene}`)
  }


  const filtersWithButtons = [...filters, 'reset']

  const buttons = filtersWithButtons.map(filter =>
    <div key={filter} onClick={enableFilter(filter)} className={classnames('button', { reset: filter === 'reset'})}><div>{filter}</div></div>
  )
  const sceneButtons = scenes.map(scene =>
    <div key={scene} onClick={switchToScene(scene)} className='button scene'><div>{scene}</div></div>
  )
  return (
    <div className="App">
      <div className='buttons'>
        {buttons}
        {sceneButtons}
      </div>
    </div>
  );
}

export default App;
