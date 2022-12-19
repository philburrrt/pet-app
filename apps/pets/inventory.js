import React, { useEffect, useState, useMemo } from 'react'
import { useEth, useWorld } from 'hyperfy'

const CONTRACT = '0x6E01827b174C0Af2E2a8697349174210f3443d1D'

export function Inventory({ inventory, setInventory, setTeam }) {
  const TRAIT_URL = 'http://localhost:3000/api/pets?tokenId='
  const world = useWorld()
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState([])

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

  useEffect(() => {
    if (!selected) return
    console.log(selected)
  }, [selected])

  return (
    <>
      <text
        value={
          inventory && inventory.length > 0
            ? 'Close Inventory'
            : 'Get Inventory'
        }
        position={
          inventory && inventory.length > 0 ? [-0.5, -0.1, 0] : [0, -0.1, 0]
        }
        bgColor="white"
        onClick={() => {
          if (inventory && inventory.length > 0) {
            setInventory(null)
            setSelected([])
            setPage(0)
          } else {
            getInventory('0x7789818791c12a2633e88d46457230bC1D9cd110')
          }
        }}
      />
      {inventory && inventory.length > 0 && (
        <text
          value="Submit Team"
          position={[0.3, -0.1, 0]}
          bgColor="white"
          onClick={() => {
            if (selected.length < 3) return
            console.log('submitting team')
            setTeam(selected)
            setInventory(null)
            setSelected([])
            setPage(0)
          }}
        />
      )}
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
                  onClick={() => {
                    if (selected.length > 2) return
                    setSelected([...selected, item])
                  }}
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
          {selected.length > 0 && (
            <>
              {selected.map((item, i) => {
                return (
                  <>
                    <image
                      key={i}
                      src={item.image}
                      position={[-0.6 + i * 0.35, 0.6, 0]}
                      width={0.3}
                    />
                    <text
                      value={item.name}
                      position={[-0.6 + i * 0.35, 0.77, 0]}
                      fontSize={0.035}
                      bgColor="white"
                    />
                  </>
                )
              })}
              <image
                src="reload.png"
                position={[0.4, 0.6, 0]}
                onClick={() => setSelected([])}
                width={0.1}
                frameColor="white"
                frameWidth={0.025}
              />
            </>
          )}
        </>
      )}
    </>
  )
}
