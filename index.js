require('dotenv').config()
const tmi = require('tmi.js');

const username = process.env.TWITCH_USERNAME
const password = process.env.TWITCH_PASSWORD
const channel = process.env.TWITCH_CHANNEL

const client = new tmi.Client({
	options: { debug: true },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username,
		password,
	},
	channels: [ channel ]
});
client.connect();
client.on('message', (channel, tags, message, self) => {
	if(self) return;
	if(message.toLowerCase() === '!hello') {
		client.say(channel, `@${tags.username}, heya!`);
  }

  if (message.toLowerCase().includes('mcgrath')) {
    client.say(channel, `/timeout ${tags.username} 60`);
    client.say(channel, `@${tags.username} shh we don't say the MCG word here`);

  }
});
