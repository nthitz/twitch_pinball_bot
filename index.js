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

const filters = ['blocky']

function listenToChat() {
  console.log('listening to chat')
  chat.on('message', (channel, tags, message, self) => {
    if(self) return;
    const lowercaseMessage = message.toLowerCase()
    if(lowercaseMessage === '!hello') {
      chat.say(channel, `@${tags.username}, heya!`);
    }

    if (lowercaseMessage.includes('mcgrath')) {
      chat.say(channel, `/timeout ${tags.username} 60`);
      chat.say(channel, `@${tags.username} shh we don't say the MCG word here`);
    }

    if (lowercaseMessage === '!trip') {
      obs.send('SetSourceFilterVisibility', {
        sourceName: 'playfield',
        filterName: 'blocky',
        filterEnabled: true,
      }) // returns Promise
    }
    if (lowercaseMessage === '!reset') {
      obs.send('SetSourceFilterVisibility', {
        sourceName: 'playfield',
        filterName: 'blocky',
        filterEnabled: false,
      }) // returns Promise
    }




  });
}