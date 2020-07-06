require('dotenv').config()
const express = require('express')
const OBSWebSocket = require('obs-websocket-js');
const tmi = require('tmi.js');

const webserver = express()
webserver.listen(4040)

const twitchUsername = process.env.TWITCH_USERNAME
const twitchPassword = process.env.TWITCH_PASSWORD
const twitchChannel = process.env.TWITCH_CHANNEL

const obswsHost = process.env.OBS_HOST
const obsPassword = process.env.OBS_PASSWORD


const obs = new OBSWebSocket();

const chat = new tmi.Client({
	options: { debug: true },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: twitchUsername,
		password: twitchPassword,
	},
	channels: [ twitchChannel ]
});

Promise.all([
  obs.connect({ address: obswsHost, password: obsPassword }),
  chat.connect()
]).then(listenToChat);

const playfieldSourceName = '920'
const faceSourceName = 'face';

let filters = []
let faceFilters = []
let filtersToNotReset = ['default-shader-dont-delete']

const combinedFilters = [
  {
    name: 'hype',
    filters: ['grow', 'vignette'],
    type: 'combined',
  },
  {
    name: '8bit',
    filters: ['blocky', '90s'],
    type: 'combined',
  },
  {
    name: 'matrix',
    filters: ['code', 'sobel'],
  }
]

const filtersToExpose = [
  'hype', '8bit', 'matrix', 'lake', 'sketch', 'glitch', 'rgbglitch'
]

const scenes = ['starting soon', 'pause', 'Scene']
const randomFilterAfter = 1000 * 60 * 2;
let setRandomFilterTimeout = null;
let lastRandomFilter = null

function disableFilters() {
  filters.forEach(f => disableFilter(f, playfieldSourceName))
  faceFilters.forEach(f => disableFilter(f, faceSourceName))
}

function setFilterStatus(filter, source=playfieldSourceName) {
  const req = {
    sourceName: source,
    filterName: filter.name,
    filterEnabled: filter.enabled,
  }
  obs.send('SetSourceFilterVisibility', req).catch(errorHandler)
}
function toggleFilter(filter) {
  filter.enabled = !filter.enabled
  setFilterStatus(filter)
}

function enableFilter(filter, source=playfieldSourceName) {
  filter.enabled = true
  setFilterStatus(filter, source)
}

function disableFilter(filter, source=playfieldSourceName) {
  filter.enabled = false
  setFilterStatus(filter, source)
}


function errorHandler(err) { // Promise convention dicates you have a catch on every chain.
  console.log(err);
}

function doFilterFunction(filterName, f) {
  const filter = filters.find(d => d.name === filterName)
  const combinedFilter = combinedFilters.find(d => d.name === filterName)
  if (filter) {
    f(filter)
  } else if(combinedFilter) {
    combinedFilter.filters.forEach(_filterName => {
      const filter = filters.find(d => d.name === _filterName)
      filter && f(filter)
    })
  } else {
    console.log('missingfilter' , filterName)
    return
  }
}

function scheduleRandomFilter() {
  clearTimeout(setRandomFilterTimeout)
  setRandomFilterTimeout = setTimeout(() => {
    if (lastRandomFilter) {
      disableFilter(lastRandomFilter, faceSourceName)
    }
    const disabledFilters = filters.filter(d => !d.filteredEnabed)
    const randomFilter = disabledFilters[Math.floor(Math.random() * disabledFilters.length)]
    enableFilter(randomFilter, faceSourceName)
    lastRandomFilter = randomFilter
    // chat.say(`#${twitchChannel}`, `!${randomFilter.name}`)
    scheduleRandomFilter();
  }, randomFilterAfter)
}


function listenToChat() {
  obs.send('GetSourceFilters', { sourceName: playfieldSourceName }).then(response => {
    filters = response.filters.filter(d => d.type === 'shader_filter' && !filtersToNotReset.includes(d.name))
    disableFilters()
  }).catch(errorHandler);
  obs.send('GetSourceFilters', { sourceName: faceSourceName }).then(response => {
    faceFilters = response.filters.filter(d => d.type === 'shader_filter' && !filtersToNotReset.includes(d.name))
    disableFilters()
  }).catch(errorHandler);
  scheduleRandomFilter()

  console.log('listening to chat')
  chat.on('message', (channel, tags, message, self) => {
    if(self) return;
    const lowercaseMessage = message.toLowerCase().trim()
    const filterCommandList = [...filters, ...combinedFilters].map(filter => `!${filter.name}`)

    if (filterCommandList.includes(lowercaseMessage)) {
      const filterName =  lowercaseMessage.slice(1)
      if (lastRandomFilter && lastRandomFilter.name === filterName) {
        lastRandomFilter = null
      }
      doFilterFunction(filterName, toggleFilter)
    }


    scheduleRandomFilter()

    if(lowercaseMessage === '!hello') {
      chat.say(channel, `@${tags.username}, heya!`);
    }

    if (lowercaseMessage.includes('mcgrath')) {
      chat.say(channel, `/timeout ${tags.username} 60 don't say McGrath! `);
      chat.say(channel, `@${tags.username} shh we don't say the MCG word here`);
    }

    if (lowercaseMessage === '!reset') {
      disableFilters();
    }

    if (lowercaseMessage === '!filters') {
      const fs = filtersToExpose.map(filter => `!${filter}`).join(' ')
      const filterMessage = `try these fun filters ${fs}`
      chat.say(channel, filterMessage)
    }

    // const vaccuousCommands = ['!commands', '!socials', '!ig', '!insta', '!twitter']
    // if (vaccuousCommands.includes(lowercaseMessage)) {
    //   chat.say(channel, 'Arrest the cops that murdered Breonna Taylor')
    // }

    console.log(tags)
    let gttvMessageSent = false
    if (tags.username === 'gametimetelevision' && !gttvMessageSent) {
      gttvMessageSent = true
      chat.say(channel, 'yo @gametimetelevision try out !filters')
    }


  });
}


webserver.get('/getFilters', (req, res) => {
  res.send(filtersToExpose)
})

webserver.get('/getScenes', (req, res) => {
  res.send(scenes)
})

webserver.get('/reset', (req, res) => {
  disableFilters()
  res.send('ok')
})

webserver.get('/enableFilter', (req, res) => {

  doFilterFunction(req.query.f, enableFilter)
  res.send('ok')
})

webserver.get('/switchToScene', (req, res) => {
  const switchToScene = (scene) => {

    const req = {
      'scene-name': scene,
    }
    obs.send('SetCurrentScene', req).catch(errorHandler)
  }
  switchToScene(req.query.scene)
  res.send('ok')
})

