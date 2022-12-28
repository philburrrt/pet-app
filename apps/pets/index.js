import React, { useEffect, useState } from 'react'
import { useWorld, useSyncState } from 'hyperfy'
import { Inventory } from './inventory'
import { Battle } from './battle'

// TODO:
// * when app is added to the world the control panel displays when it shouldn't (leave for testing)
// // * update inventory to lock types to specific selected slots
// // * if there's a dps and someone clicks another dps, switch them out
// * fix all this parseInt bullshit via api
// * manage round ending
// * add red text that shows how much damage was done above the target pet for 5 seconds
// * figure out why 'heal' is crashing

export default function App() {
  const [inventory, setInventory] = useState(null)
  const [team, setTeam] = useState(null)
  const [address, setAddress] = useState(null)
  const world = useWorld()

  return (
    <app>
      <Inventory
        inventory={inventory}
        setInventory={setInventory}
        setTeam={setTeam}
      />
      <Battle team={team} />
      <InfoBoard />
      {world.isServer && <ServerLogic />}
    </app>
  )
}

// ! Only runs on the server
const MATCH_QUEUED_TIME = 2.5
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
    dispatch('setMatchState', 'queued', world.getTime())
  }, [players])

  // After 15 seconds, start the match
  useEffect(() => {
    if (match.state !== 'queued') return
    return world.onUpdate(() => {
      const now = world.getTime()

      function floor(num) {
        return num.toString().split('.')[0]
      }
      const timeRemaining = floor(MATCH_QUEUED_TIME - (now - match.time))
      if (timeRemaining != state.countdown)
        dispatch('setCountdown', timeRemaining)
      if (now > match.time + MATCH_QUEUED_TIME) {
        dispatch('setMatchState', 'active', world.getTime())
        dispatch('setCountdown', 0)
        console.log('match started')
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
      console.log('Team 1 alive:', player1TeamAlive)
      console.log('Team 2 alive:', player2TeamAlive)
      dispatch('setMatchState', 'ending', world.getTime())
    }
  }, [players])

  // After 15 seconds, end the match and refresh the game
  useEffect(() => {
    if (match.state !== 'ending') return
    return world.onUpdate(() => {
      const now = world.getTime()
      if (now > match.time + MATCH_ENDING_TIME) {
        dispatch('setMatchState', 'idle', world.getTime())
      }
    })
  }, [match])

  return null
}

export function InfoBoard() {
  const [match] = useSyncState(state => state.match)
  const [countdown] = useSyncState(state => state.countdown)
  const fontSize = 0.2

  return (
    <>
      <billboard axis="y" position={[0, 0.5, -5]}>
        {match.state != 'idle' && match.state != 'ending' && (
          <text
            value={`Turn: Player ${match.turn + 1}`}
            position={[0, 0, 0]}
            bgColor={'white'}
            fontSize={fontSize}
          />
        )}
        <text
          value={`Phase: ${match.state}`}
          position={[0, -0.2, 0]}
          bgColor={'white'}
          fontSize={fontSize}
        />
        {match.winner && (
          <text
            value={`Winner: ${match.winner}`}
            position={[0, -0.4, 0]}
            bgColor={'white'}
            fontSize={fontSize}
          />
        )}
        {countdown > 0 && (
          <text
            value={`Time til next phase: ${countdown}`}
            position={[0, -0.6, 0]}
            bgColor={'white'}
            fontSize={fontSize}
          />
        )}
      </billboard>
    </>
  )
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
    turn: 0,
    time: 0,
    winner: null,
  },
  countdown: 0,
}

export function getStore(state = initialState) {
  return {
    state,
    actions: {
      addPlayer(state, player, uid, team) {
        // Don't let player join if already in the game
        // Don't let player join if is taken
        // Don't let player join if match is active
        const inGame = Object.values(state.players).some(
          player => player.uid === uid
        )
        const seatTaken = state.players[player].uid
        if (inGame || seatTaken || state.match.state != 'idle')
          return console.log(`Player ${uid} could not join the game!`)
        state.players[player].uid = uid
        state.players[player].team = team
        console.log(`Player ${uid} joined the game!`)
      },
      removePlayer(state, uid) {
        const player = Object.values(state.players).find(
          player => player.uid === uid
        )
        if (!player) return
        player.uid = null
        player.team = null
        console.log(`Player ${uid} left the game!`)
      },
      damagePet(state, player, pet, amount) {
        const turn = player === 0 ? 1 : 0
        if (state.match.turn !== turn) return console.log('Not your turn!')
        const target = state.players[player].team[pet]
        if (!target) return
        target.health -= amount
        if (target.health < 0) target.health = 0
        console.log(
          `Player ${player} pet ${pet} took ${amount} damage! Now at ${target.health} health!`
        )
      },
      healTeam(state, player, amount) {
        // heal all pets on player's team for amount
        if (state.match.turn !== player) return console.log('Not your turn!')
        const target = state.players[player].team
        if (!target) return
        Object.values(target).forEach(pet => {
          pet.health += amount
          if (pet.health > 100) pet.health = 100
        })
        console.log(`Player ${player} healed all pets for ${amount} health!`)
      },
      useMana(state, player, pet, amount) {
        if (state.match.turn !== player) return console.log('Not your turn!')
        const target = state.players[player].team[pet]
        if (!target) return
        target.mana -= amount
        if (target.mana < 0) target.mana = 0
        console.log(
          `Player ${player} pet ${pet} used ${amount} mana! Now at ${target.mana} mana!`
        )
        const otherPlayer = player === 0 ? 1 : 0
        state.match.turn = otherPlayer
        console.log(`Turn switched to player ${otherPlayer}!`)
      },
      setMatchState(state, newState, time = 0) {
        state.match.state = newState
        state.match.time = time
        console.log(`Match state changed to ${newState}!`)
      },
      setCountdown(state, time) {
        state.countdown = time
      },
    },
  }
}
