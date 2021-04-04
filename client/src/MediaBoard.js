import React, { useEffect, useState } from 'react'
import { io } from "socket.io-client";

import jokesMp4 from './media/jokes.mp4'
import notapunMp4 from './media/notapun.mp4'
import onfireMp4 from './media/onfire.mp4'
import thitzMp3 from './media/thitz.mp3'

import './MediaBoard.scss'
const socket = io("ws://localhost:3030");

const media = [
    {
        file: jokesMp4,
        cmd: 'jokes',

    },
    {
        file: notapunMp4,
        cmd: 'notapun',
        video: true,
    },
    {
        file: onfireMp4,
        cmd: 'onfire',
    },
    {
        file: thitzMp3,
        cmd: 'thitz',
    },

]

const jokeTimeout = 60 * 1000 // 1000
export default function Media(props) {
    const [mediaFromChat, setMediaFromChat] = useState([])
    const [mediaEnded, setMediaEnded] = useState([])
    useEffect(() => {
        const jokeHandler = joke => {
            console.log(joke)
            const matchingMedia = media.find(d => d.cmd === joke)
            const now = Date.now()
            let tellJoke = false
            if (!matchingMedia.lastToldAt) {
                tellJoke = true
            } else if (now - matchingMedia.lastToldAt > jokeTimeout) {
                tellJoke = true
            }
            if (matchingMedia && tellJoke) {
                matchingMedia.lastToldAt = now
                console.log(matchingMedia)
                setMediaFromChat(mediaFromChat => [...mediaFromChat, matchingMedia])
            }
        }
        socket.on('joke', jokeHandler)
        return () => {
            socket.removeAllListeners('joke')
        }
    }, [])


    const mediaEnd = (index) => event => {
        setMediaEnded(mediaEnded => [...mediaEnded, index])
    }

    return <div className='MediaBoard'>
        {mediaFromChat.map((item, index) => {
            const Tag = item.video ? 'video' : 'audio'
            const ended = mediaEnded.includes(index)

            return (
                <Tag
                    key={index}
                    src={item.file}
                    onEnded={mediaEnd(index)}
                    autoPlay
                    controls
                    volume={ended ? 0 : 1}
                    style={{ opacity: ended ? 0 : 1}}
                />
            )
        })}
    </div>
}