import React, { useEffect, useState } from 'react';
import './App.css';

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

  const enableFilter = filter => event => {
    if (filter.type === 'reset') {
      window.fetch('/reset')
    } else {
      window.fetch(`/enableFilter?f=${filter.name}`)
    }
  }
  const switchToScene = scene => event => {
    window.fetch(`/switchToScene?scene=${scene}`)
  }


  const filtersWithButtons = [...filters.filter(d => d.type === 'combined'), { name: 'reset', type: 'reset'}]

  const buttons = filtersWithButtons.map(filter =>
    <div key={filter.name} onClick={enableFilter(filter)} className='button'><div>{filter.name}</div></div>
  )
  const sceneButtons = scenes.map(scene =>
    <div key={scene} onClick={switchToScene(scene)} className='button'><div>{scene}</div></div>
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
