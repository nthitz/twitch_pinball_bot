
import classnames from 'classnames';
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
export default function ControlPanel(props) {
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

    const tellJoke = joke => event => {
        window.fetch(`/joke?joke=${joke}`)
    }

    const filtersWithButtons = [...filters, 'reset']

    const buttons = filtersWithButtons.map(filter =>
        <div key={filter} onClick={enableFilter(filter)} className={classnames('button', { reset: filter === 'reset'})}><div>{filter}</div></div>
    )
    const sceneButtons = scenes.map(scene =>
        <div key={scene} onClick={switchToScene(scene)} className='button scene'><div>{scene}</div></div>
    )
    const jokes = ['notapun']

    const jokeButtons = jokes.map(joke =>
        <div key={joke} onClick={tellJoke(joke)} className='button'><div>{joke}</div></div>
    )
    return (
        <div className='buttons'>
            {buttons}
            {sceneButtons}
            {jokeButtons}
            <div>
                <Link to='/media'>Media</Link>
            </div>
        </div>
    );
}
