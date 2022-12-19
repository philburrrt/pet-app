import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useEth, useWorld } from 'hyperfy'

const CONTRACT = '0x6E01827b174C0Af2E2a8697349174210f3443d1D'

export function Inventory({ inventory, setInventory }) {
  const TRAIT_URL = 'http://localhost:3000/api/pets?tokenId='
  const world = useWorld()
  const [page, setPage] = useState(0)

  const eth = useEth('goerli') // defaults to ethereum network
  const contract = useMemo(() => eth.contract(CONTRACT), [])

  async function getInventory(address) {
    const owned = await contract.read('getOwned', address)
    console.log(owned)
    if (!owned) return
    const items = []
    for (const tokenId of owned) {
      const res = await world.http({
        method: 'GET',
        url: `${TRAIT_URL}${parseInt(tokenId)}`,
      })
      items.push(res)
      console.log(res)
    }
    setInventory(items)
  }

  function paginate(direction) {
    if (direction === 'left') {
      if (page === 0) return
      setPage(page - 1)
    } else {
      if (page === Math.floor(inventory.length / 3)) return
      setPage(page + 1)
    }
  }

  const imagePositions = [
    [-0.6, 0.25, 0],
    [0, 0.25, 0],
    [0.6, 0.25, 0],
  ]

  return (
    <>
      <text
        value="Open Inventory"
        position={[0, -0.1, 0]}
        bgColor="white"
        onClick={() => {
          getInventory('0x7789818791c12a2633e88d46457230bC1D9cd110')
        }}
      />
      {inventory && (
        <>
          <text
            value="<"
            position={[-1, 0.3, 0]}
            bgColor="white"
            onClick={() => paginate('left')}
          />
          <text
            value=">"
            position={[1, 0.3, 0]}
            bgColor="white"
            onClick={() => paginate('right')}
          />
        </>
      )}
      {inventory && (
        <>
          {inventory.map((item, i) => {
            if (i < page * 3 || i > page * 3 + 2) return
            return (
              <>
                <image
                  key={i}
                  src={item.image}
                  position={imagePositions[i - page * 3]}
                  width={0.5}
                />
                <text
                  value={item.name}
                  position={[
                    imagePositions[i - page * 3][0],
                    imagePositions[i - page * 3][1] - 0.2,
                    0,
                  ]}
                  fontSize={0.05}
                  bgColor="white"
                />
              </>
            )
          })}
        </>
      )}
    </>
  )
}

export default function App() {
  const [inventory, setInventory] = useState(null)

  useEffect(() => {
    if (!inventory) return
    console.log(inventory)
  }, [inventory])

  return (
    <app>
      <Inventory inventory={inventory} setInventory={setInventory} />
    </app>
  )
}
