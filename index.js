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

let filters = []

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

const randomFilterAfter = 1000 * 60 * 5;
let setRandomFilterTimeout = null;

function disableFilters() {
  filters.forEach(filter => {
    filter.enabled = false;
    setFilterStatus(filter)
  })
}

function setFilterStatus(filter) {
  obs.send('SetSourceFilterVisibility', {
    sourceName: playfieldSourceName,
    filterName: filter.name,
    filterEnabled: filter.enabled,
  }).catch(errorHandler)
}
function toggleFilter(filter) {
  filter.enabled = !filter.enabled
  setFilterStatus(filter)
}

function enableFilter(filter) {
  filter.enabled = true
  setFilterStatus(filter)
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
    console.log('missingfilter' ,lowercaseMessage)
    return
  }
}

function scheduleRandomFilter() {
  clearTimeout(setRandomFilterTimeout)
  setRandomFilterTimeout = setTimeout(() => {

    const randomFilter = filters[Math.floor(Math.random() * filters.length)]
    chat.say(twitchChannel, `!${randomFilter.name}`)
    scheduleRandomFilter();
  }, randomFilterAfter)
}


function listenToChat() {
  obs.send('GetSourceFilters', { sourceName: playfieldSourceName }).then(response => {
    filters = response.filters.filter(d => d.type === 'shader_filter' && !filtersToNotReset.includes(d.name))
    disableFilters()
  }).catch(errorHandler);
  scheduleRandomFilter()

  console.log('listening to chat')
  chat.on('message', (channel, tags, message, self) => {
    const lowercaseMessage = message.toLowerCase().trim()
    const filterCommandList = [...filters, ...combinedFilters].map(filter => `!${filter.name}`)

    if (filterCommandList.includes(lowercaseMessage)) {
      const filterName =  lowercaseMessage.slice(1)
      doFilterFunction(filterName, toggleFilter)
    }

    if(self) return;

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
      const fs = filterCommandList.join(' ')
      const filterMessage = `try these fun filters ${fs}`
      chat.say(channel, filterMessage)
    }


  });
}


webserver.get('/getFilters', (req, res) => {
  res.send([...filters, ...combinedFilters])
})

webserver.get('/reset', (req, res) => {
  disableFilters()
})

webserver.get('/enableFilter', (req, res) => {

  doFilterFunction(req.query.f, enableFilter)
})
