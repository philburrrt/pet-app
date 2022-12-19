import React, { useRef, useEffect, useState } from 'react'
import { useWorld } from 'hyperfy'

export function Traits() {
  const TRAIT_URL = 'http://localhost:3000/api/pets?tokenId='
  const world = useWorld()
  const [traits, setTraits] = useState(null)

  async function getTraits(tokenId) {
    const response = await world.http({
      method: 'GET',
      url: `${TRAIT_URL}${parseInt(tokenId)}`,
    })
    const traits = response.attributes
    console.log(JSON.stringify(traits))
  }

  return <text value="hi" onClick={getTraits(1)} />
}

export default function App() {
  return (
    <app>
      <Traits />
    </app>
  )
}
