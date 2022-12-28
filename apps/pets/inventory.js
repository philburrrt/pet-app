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
            // filter stats from selected[i].attributes[0],[3],[4],[5]
            let reordered
            while (!reordered) {
              for (const pet in selected) {
                const type = selected[pet].attributes[0].value
                // filter information from selected[pet].attributes
                // we want type, health, mana, and attack
                const filtered = {
                  type,
                  health: selected[pet].attributes[3].value,
                  mana: selected[pet].attributes[4].value,
                }
                // if type = Tank, and stats[0] is empty, add to stats[0]
                if (type === 'Tank' && !stats[0]) {
                  stats[0] = filtered
                  stats[0].defense = selected[pet].attributes[5].value
                  reordered = true
                } // if type = DPS, and stats[1] is empty, add to stats[1]
                else if (type === 'DPS' && !stats[1]) {
                  stats[1] = filtered
                  stats[1].attack = selected[pet].attributes[5].value
                  reordered = true
                } // if type = Healer, and stats[2] is empty, add to stats[2]
                else if (type === 'Healer' && !stats[2]) {
                  stats[2] = filtered
                  stats[2].healing = selected[pet].attributes[5].value
                  reordered = true
                } // if stats.length === 3, it is reordered
                else if (stats.length === 3) {
                  reordered = true
                }
              }
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
                    for (const pet in selected) {
                      const type = selected[pet].attributes[0].value // type = 'tank', 'healer', 'dps'
                      if (type === item.attributes[0].value) return // if type is already selected, return
                    }
                    setSelected([...selected, item])
                  }}
                />
                <text
                  value={item.name}
                  position={[
                    imagePositions[i][0],
                    imagePositions[i][1] - 0.25,
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
                  position={[-0.6 + i * 0.35, 0.75, 0]}
                  width={0.3}
                />
                <text
                  value={item.name}
                  position={[-0.6 + i * 0.35, 0.95, 0]}
                  fontSize={0.035}
                  bgColor="white"
                />
              </>
            )
          })}
          <image
            src="reload.png"
            position={[0.4, 0.7, 0]}
            onClick={() => setSelected([])}
            width={0.075}
            frameColor="white"
            frameWidth={0.025}
          />
        </>
      )}
    </>
  )
}
