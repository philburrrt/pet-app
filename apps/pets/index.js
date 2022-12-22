import React, { useEffect, useState } from 'react'
import { useWorld, useSyncState } from 'hyperfy'
import { Inventory } from './inventory'
import { Battle } from './battle'

export default function App() {
  const [inventory, setInventory] = useState(null)
  const [team, setTeam] = useState(null)
  const [uid, setUid] = useState(null)
  const world = useWorld()

  // ! When user enters the world, store their uid in state
  useEffect(() => {
    return world.on('join', avatar => {
      setUid(avatar.uid)
    })
  }, [])

  return (
    <app>
      <Inventory
        inventory={inventory}
        setInventory={setInventory}
        setTeam={setTeam}
      />
      <Battle uid={uid} />
      {world.isServer && <ServerLogic />}
    </app>
  )
}

// ! Only runs on the server
const MATCH_QUEUED_TIME = 5
const MATCH_ENDING_TIME = 5
export function ServerLogic() {
  const world = useWorld()
  const [state, dispatch] = useSyncState(state => state)
  const players = state.players
  const match = state.match

  // Removes players from the game if they leave the world
  useEffect(() => {
    function onAvatarLeave(avatar) {
      const exists = Object.values(players).some(
        player => player.uid === avatar.uid
      )
      if (!exists) return
      dispatch('removePlayer', avatar.uid)
    }
    world.on('leave', onAvatarLeave)
    return () => {
      world.off('leave', onAvatarLeave)
    }
  }, [players])

  // If there are 2 players, queue the match
  useEffect(() => {
    if (match.state !== 'idle') return
    const playerCount = Object.values(players).filter(
      player => player.uid
    ).length
    if (playerCount !== 2) return
    dispatch('setMatchState', 'queued', world.getServerTime)
  }, [players])

  // After 15 seconds, start the match
  useEffect(() => {
    if (match.state !== 'queued') return
    return world.onUpdate(() => {
      const now = world.getTime()
      if (now > match.time + MATCH_QUEUED_TIME) {
        dispatch('setStatus', 'active')
      }
    })
  }, [match])

  // If one team has no health left on any of their pets, end the match
  useEffect(() => {
    if (match.state !== 'active') return
    const playerCount = Object.values(players).filter(
      player => player.uid
    ).length
    if (playerCount !== 2) return
    const player1 = players[0]
    const player2 = players[1]
    const player1Team = player1.team
    const player2Team = player2.team
    const player1TeamAlive = Object.values(player1Team).some(
      pet => pet.health > 0
    )
    const player2TeamAlive = Object.values(player2Team).some(
      pet => pet.health > 0
    )
    if (!player1TeamAlive || !player2TeamAlive) {
      dispatch('setMatchState', 'ending', world.getServerTime)
    }
  }, [players])

  // After 15 seconds, end the match and refresh the game
  useEffect(() => {
    if (match.state !== 'ending') return
    return world.onUpdate(() => {
      const now = world.getTime()
      if (now > match.time + MATCH_ENDING_TIME) {
        dispatch('setMatchState', 'idle', world.getServerTime)
      }
    })
  }, [match])

  return null
}

const initialState = {
  players: {
    0: {
      uid: null,
      team: null,
    },
    1: {
      uid: null,
      team: null,
    },
  },
  match: {
    state: 'idle', // idle, queued, active, ending
    time: 0,
    winner: null,
  },
}

export function getStore(state = initialState) {
  return {
    state,
    actions: {
      addPlayer(state, player, uid) {
        // Don't let player join if already in the game
        // Don't let player join if seat is taken
        // Don't let player join if match is active
        const inGame = Object.values(state.players).some(
          player => player.uid === uid
        )
        const seatTaken = state.players[player].uid
        if (inGame || seatTaken || state.match.state != 'idle')
          return console.log(`Player ${uid} could not join the game!`)
        state.players[player].uid = uid
        state.players[player].team = {
          tank: {
            health: 100,
            mana: 100,
          },
          dps: {
            health: 100,
            mana: 100,
          },
          healer: {
            health: 100,
            mana: 100,
          },
        }
        console.log(`Player ${uid} joined the game!`)
      },
      removePlayer(state, uid) {
        const player = state.players.find(player => player.uid === uid)
        if (!player) return
        player.uid = null
        player.team = null
        console.log(`Player ${uid} left the game!`)
      },
      damagePet(state, player, pet, amount) {
        const target = state.players[player].team[pet]
        if (!target) return
        target.health -= amount
        if (target.health < 0) target.health = 0
        console.log(`Player ${player} pet ${pet} took ${amount} damage!`)
      },
      healPet(state, player, pet, amount, mana) {
        const target = state.players[player].team[pet]
        if (!target) return
        target.health += amount
        if (target.health > 100) target.health = 100
        console.log(`Player ${player} pet ${pet} healed ${amount} health!`)
      },
      useMana(state, player, pet, amount) {
        const target = state.players[player].team[pet]
        if (!target) return
        target.mana -= amount
        if (target.mana < 0) target.mana = 0
        console.log(`Player ${player} pet ${pet} used ${amount} mana!`)
      },
      setMatchState(state, newState, time = 0) {
        state.match.state = newState
        state.match.time = time
        console.log(`Match state changed to ${newState}!`)
      },
    },
  }
}
