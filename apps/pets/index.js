import React, { useEffect, useState } from 'react'
import { useWorld, useSyncState } from 'hyperfy'
import { Inventory } from './inventory'
import { Battle } from './battle'

export default function App() {
  const [inventory, setInventory] = useState(null)
  const [team, setTeam] = useState(null)
  const world = useWorld()

  useEffect(() => {
    if (!inventory) return
    console.log(inventory)
  }, [inventory])

  return (
    <app>
      <Inventory
        inventory={inventory}
        setInventory={setInventory}
        setTeam={setTeam}
      />
      <Battle />
      {world.isServer && <ServerLogic />}
    </app>
  )
}

const MATCH_QUEUED_TIME = 5
const MATCH_STARTING_TIME = 5
const MATCH_ACTIVE_TIME = 20
const MATCH_ENDING_TIME = 5
export function ServerLogic() {
  const world = useWorld()
  const [state, dispatch] = useSyncState(state => state)
  const status = state.status
  const players = state.players

  useEffect(() => {
    function onAvatarLeave(avatar) {
      const exists = players.includes(avatar.uid)
      if (!exists) return
      dispatch('removePlayer', avatar.uid)
    }
    world.on('leave', onAvatarLeave)
    // not sure what this does
    // return () => {
    //   world.off('leave', onAvatarLeave)
    // }
  }, [players])

  useEffect(() => {
    // if both players are ready, start countdown
    if (status === 'idle') {
      if (state.teams[0] !== null && state.teams[1] !== null) {
        dispatch('status', 'queued', world.getTime())
        console.log('starting match in 5 seconds')
        return
      }
    }

    // if one player leaves, reset
    if (status === 'queued') {
      if (!state.teams[0] || !state.teams[1]) {
        dispatch('status', 'idle', 0)
        console.log('match cancelled')
        return
      }
    }

    // if countdown is over, start match
    if (status === 'queued') {
      return world.onUpdate(() => {
        const now = world.getTime()
        if (now - state.time > MATCH_STARTING_TIME) {
          dispatch('status', 'active', now)
          console.log('match started')
        }
      })
    }
  }, [state])

  return null
}

const initialState = {
  status: 'idle', // idle -> queued -> starting -> active -> ending
  time: 0, // time in seconds
  teams: {
    0: null,
    1: null,
  }, // health and mana bars for each teams' pets (3)
  players: [], // list of players in the match
}

export function getStore(state = initialState) {
  return {
    state,
    actions: {
      addPlayer(state, slot, player) {
        if (state.status !== 'idle') return
        console.log(`adding player ${player} to slot ${slot}`)
        state.players.push(player)
        state.teams[slot] = {
          tank: {
            health: 100,
            mana: 100,
          },
          healer: {
            health: 100,
            mana: 100,
          },
          dps: {
            health: 100,
            mana: 100,
          },
        }
      },
      removePlayer(state, slot, player) {
        state.teams[slot] = null
        state.players = state.players.filter(p => p !== player)
      },
      status(state, status, time) {
        state.status = status
        state.time = time
      },
    },
  }
}
