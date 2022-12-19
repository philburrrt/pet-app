import React, { useEffect, useState } from 'react'
import { Inventory } from './inventory'

export default function App() {
  const [inventory, setInventory] = useState(null)
  const [team, setTeam] = useState(null)

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
    </app>
  )
}
