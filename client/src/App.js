import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [filters, setFilters] = useState([])
  useEffect(() => {
    window.fetch('/getFilters')
      .then(r => r.json())
      .then(f => {
        setFilters(f)
      })
  }, [])

  const enableFilter = filter => event => {
    if (filter.type === 'reset') {
      window.fetch('/reset')
    } else {
      window.fetch(`/enableFilter?f=${filter.name}`)
    }
  }

  const filtersWithButtons = [...filters.filter(d => d.type === 'combined'), { name: 'reset', type: 'reset'}]

  const buttons = filtersWithButtons.map(filter =>
    <div key={filter.name} onClick={enableFilter(filter)} className='button'><div>{filter.name}</div></div>
  )
  return (
    <div className="App">
      <div className='chat'>
        <iframe width="100%" height="100%" id="nthitz" src="https://www.twitch.tv/embed/nthitz/chat?parent=localhost"></iframe>
      </div>
      <div className='buttons'>
        {buttons}
      </div>
    </div>
  );
}

export default App;
