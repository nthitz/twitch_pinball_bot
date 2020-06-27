require('dotenv').config()

const OBSWebSocket = require('obs-websocket-js');
const tmi = require('tmi.js');

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

const combinedFilters = [
  {
    name: 'hype',
    filters: ['grow', 'vignette'],
  },
  {
    name: '8bit',
    filters: ['blocky', '90s'],
  }
]

function disableFilters() {
  console.log('disable filters')
  console.log(filters.length)
  filters.forEach(filter => {
    filter.enabled = false;
    obs.send('SetSourceFilterVisibility', {
      sourceName: playfieldSourceName,
      filterName: filter.name,
      filterEnabled: false,
    })
  })
}

function toggleFilter(filter) {
  console.log(filter)
  filter.enabled = !filter.enabled
  obs.send('SetSourceFilterVisibility', {
    sourceName: playfieldSourceName,
    filterName: filter.name,
    filterEnabled: filter.enabled,
  }).catch(errorHandler)
}

function errorHandler(err) { // Promise convention dicates you have a catch on every chain.
  console.log(err);
}
function listenToChat() {
  obs.send('GetSourceFilters', { sourceName: playfieldSourceName }).then(response => {
    filters = response.filters.filter(d => d.type === 'shader_filter')
    console.log(filters)
    disableFilters()
  }).catch(errorHandler);

  console.log('listening to chat')
  chat.on('message', (channel, tags, message, self) => {
    if(self) return;
    const lowercaseMessage = message.toLowerCase().trim()
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

    const filterCommandList = [...filters, ...combinedFilters].map(filter => `!${filter.name}`)
    if (lowercaseMessage === '!filters') {
      const fs = filterCommandList.join(' ')
      const filterMessage = `try these fun filters ${fs}`
      chat.say(channel, filterMessage)
    }

    if (filterCommandList.includes(lowercaseMessage)) {
      const filterName =  lowercaseMessage.slice(1)
      const filter = filters.find(d => d.name === filterName)
      const combinedFilter = combinedFilters.find(d => d.name === filterName)
      if (filter) {
        toggleFilter(filter)
      } else if(combinedFilter) {
        combinedFilter.filters.forEach(_filterName => {
          const filter = filters.find(d => d.name === _filterName)
          filter && toggleFilter(filter)
        })
      } else {
        console.log('missingfilter' ,lowercaseMessage)
        return
      }
    }

  });
}