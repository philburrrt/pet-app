import React, { useEffect, useState, useMemo } from 'react'
import { useEth, useWorld } from 'hyperfy'

const CONTRACT = '0x6E01827b174C0Af2E2a8697349174210f3443d1D'

/*
  Improvements:
    - Cache metadata in same order as tokenIds
*/

export function Inventory({ setTeam }) {
  const METADATA_URL = 'http://localhost:3000/api/pets?tokenId='
  const world = useWorld()
  const [owned, setOwned] = useState(null)
  const [page, setPage] = useState(0)
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState([])

  const eth = useEth('goerli')
  const contract = useMemo(() => eth.contract(CONTRACT), [])

  const imagePositions = [
    [-0.6, 0.25, 0],
    [0, 0.25, 0],
    [0.6, 0.25, 0],
  ]

  async function getInventory(address, page = 0) {
    setPage(page)
    let tokenIds = owned
    if (owned === null) {
      tokenIds = await contract.read('getOwned', address)
      setOwned(tokenIds)
    }
    const start = page * 3
    const end = page * 3 + 3
    const pageTokenIds = tokenIds.slice(start, end)

    for (const token in pageTokenIds) {
      const tokenId = pageTokenIds[token]
      let res
      try {
        res = await world.http({
          type: 'GET',
          url: METADATA_URL + tokenId,
        })
      } catch (err) {
        console.log(err)
      }
      setOptions(prev => {
        const newOptions = [...prev]
        newOptions[token] = res
        return newOptions
      })
    }
  }

  function paginate(direction) {
    if (direction === 'right') {
      getInventory('0x7789818791c12a2633e88d46457230bC1D9cd110', page + 1)
    } else {
      getInventory('0x7789818791c12a2633e88d46457230bC1D9cd110', page - 1)
    }
  }

  useEffect(() => {
    if (!options || options.length < 3) return
    console.log(options)
  }, [options])

  return (
    <>
      <text
        value={options.length > 0 ? 'Close Inventory' : 'Get Inventory'}
        position={
          options && options.length > 0 ? [-0.5, -0.1, 0] : [0, -0.1, 0]
        }
        bgColor="white"
        onClick={() => {
          if (options && options.length > 0) {
            setOptions([])
            setSelected([])
          } else {
            getInventory('0x7789818791c12a2633e88d46457230bC1D9cd110')
          }
        }}
      />
      {options.length > 0 && (
        <text
          value="Submit Team"
          position={[0.3, -0.1, 0]}
          bgColor="white"
          onClick={() => {
            if (selected.length < 3) return
            const stats = []
            // filter stats from selected[i].attributes[0],[3],[4],[5],[6]
            for (const pet in selected) {
              const attributes = selected[pet].attributes
              stats.push({
                type: attributes[0].value,
                health: attributes[3].value,
                mana: attributes[4].value,
                attack: attributes[5].value,
              })
            }
            console.log(stats)
            setTeam(stats)
            setOptions([])
            setSelected([])
          }}
        />
      )}
      {options.length > 0 && (
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
      {options.length > 0 && (
        <>
          {options.map((item, i) => {
            return (
              <>
                <image
                  key={i}
                  src={item.image}
                  position={imagePositions[i]}
                  width={0.5}
                  onClick={() => {
                    if (selected.length > 2 || selected.includes(item)) return
                    setSelected([...selected, item])
                  }}
                />
                <text
                  value={item.name}
                  position={[
                    imagePositions[i][0],
                    imagePositions[i][1] - 0.2,
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
  )
}
