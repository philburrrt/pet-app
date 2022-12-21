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

export function ServerLogic() {
  const [state, dispatch] = useSyncState(state => state)

  return null
}

const initialState = {
  status: 'idle', // idle -> queued -> starting -> active -> ending
  teams: {
    0: null,
    1: null,
  }, // health and mana bars for each teams' pets (3)
}

export function getStore(state = initialState) {
  return {
    state,
    actions: {
      addPlayer(state, slot) {
        if (state.status !== 'idle') return
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
    },
  }
}
