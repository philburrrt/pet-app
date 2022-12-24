import React, { useState } from 'react'
import { useSyncState, DEG2RAD, randomInt } from 'hyperfy'

const positions = [
  [-8, 0, -5],
  [8, 0, -5],
]

export function Battle({ uid, team }) {
  return (
    <>
      <group position={positions[0]} rotation={[0, DEG2RAD * -90, 0]}>
        <Controls player={0} uid={uid} team={team} />
      </group>
      <group position={positions[1]} rotation={[0, DEG2RAD * 90, 0]}>
        <Controls player={1} uid={uid} team={team} />
      </group>
    </>
  )
}

/*
 * Players need to have a team set before they can battle
 * 1 player joins, their "play" button turns to "waiting"
 * 2 players join, 15 second countdown starts before match
 * match starts, 3 panels appear (along with 3 pets) with:
 *  - attack
 * - heal
 * - run
 * - health bar
 * - mana bar
 */

const options = ['Attack', 'Heal']
// 0 = tank, 1 = dps, 2 = healer
const petLocations = [
  [-2, 0, 0],
  [0, 0, 0],
  [2, 0, 0],
]
const optionLocations = [
  [-0.25, 0, 0],
  [0.25, 0, 0],
]

export function Controls({ player, uid, team }) {
  const [state, dispatch] = useSyncState(state => state)
  const seat = state.players[player]
  const [selected, setSelected] = useState({
    pet: null,
    option: null,
  })

  const maxDamage = 25
  const minDamage = 10

  function damagePet(seat, pet, targetPet) {
    const attackPower = pet.attack

    let damage = randomInt(minDamage, maxDamage) + attackPower
    const manaCost = damage / 2
    const crit = randomInt(0, 100)
    if (crit <= 25) {
      console.log('crit!')
      damage *= 2
    }

    const toType = pet.type === 'tank' ? 0 : pet.type === 'dps' ? 1 : 2
    const fromType =
      targetPet.type === 'tank' ? 0 : targetPet.type === 'dps' ? 1 : 2
    const toSeat = seat === 0 ? 1 : 0

    console.log(
      `damaging ${targetPet.type} for ${damage} damage, using ${manaCost} mana`
    )

    dispatch('damagePet', toSeat, toType, damage)
    dispatch('useMana', seat, fromType, manaCost)
  }

  const maxHeal = 25
  const minHeal = 10
  function healTeam(seat, fromPet) {
    let healAmount = randomInt(minHeal, maxHeal)
    const manaCost = healAmount / 2
    const crit = randomInt(0, 100)
    const fromType =
      fromPet.type === 'Tank' ? 0 : fromPet.type === 'DPS' ? 1 : 2
    if (fromType === 2) {
      console.log('is healer')
      healAmount *= 2
    }

    if (crit <= 25) {
      console.log('crit!')
      healAmount *= 1.5
    }

    console.log(`healing team for ${healAmount} health, using ${manaCost} mana`)

    dispatch('healTeam', seat, healAmount)
  }

  return (
    <>
      <text
        value={'test'}
        bgColor="white"
        onClick={() => {
          damagePet()
        }}
        position={[0, 0.1, 0]}
      />
      {!seat.uid && (
        <text
          value="Play"
          bgColor="white"
          onClick={e => {
            if (!team) return
            const { uid } = e.avatar
            dispatch('addPlayer', player, uid, team)
            // delete after testing (mock user)
            const otherPlayer = player === 0 ? 1 : 0
            const fakeUid = 'fake'
            const fakeTeam = [
              {
                type: 'Tank',
                health: '100',
                mana: '100',
                attack: '10',
              },
              {
                type: 'DPS',
                health: '100',
                mana: '100',
                attack: '40',
              },
              {
                type: 'Healer',
                health: '100',
                mana: '100',
                attack: '10',
              },
            ]
            dispatch('addPlayer', otherPlayer, fakeUid, fakeTeam)
          }}
        />
      )}
      {seat.uid === uid && (
        <>
          {petLocations.map((petLoc, i) => (
            <group position={petLoc} key={i}>
              <text
                value={i === 0 ? 'Tank' : i === 1 ? 'DPS' : 'Healer'}
                position={[0, 0.1, 0]}
              />
              {optionLocations.map((optionLoc, j) => (
                // j === 0 ? 'Attack' : 'Heal'
                <group position={optionLoc} key={j}>
                  <text
                    value={options[j]}
                    bgColor="white"
                    onClick={() => {
                      if (j !== 1) {
                        setSelected({
                          pet: i,
                          option: j,
                        })
                      } else {
                        healTeam(player, seat.team[i])
                      }
                      console.log('selected', { pet: i, option: j })
                    }}
                  />
                  {selected.pet === i &&
                    selected.option === j &&
                    selected.option != 1 && (
                      <>
                        <text
                          value="Tank"
                          bgColor="white"
                          position={[-0.15, -0.2, 0]}
                          onClick={() => {
                            const otherPlayer = player === 0 ? 1 : 0
                            damagePet(
                              player,
                              seat.team[i],
                              state.players[otherPlayer].team[0]
                            )
                          }}
                        />
                        <text
                          value="DPS"
                          bgColor="white"
                          position={[-0, -0.1, 0]}
                          onClick={() => {
                            const otherPlayer = player === 0 ? 1 : 0
                            damagePet(
                              player,
                              seat.team[i],
                              state.players[otherPlayer].team[1]
                            )
                          }}
                        />
                        <text
                          value="Healer"
                          bgColor="white"
                          position={[0.15, -0.2, 0]}
                          onClick={() => {
                            const otherPlayer = player === 0 ? 1 : 0
                            damagePet(
                              player,
                              seat.team[i],
                              state.players[otherPlayer].team[2]
                            )
                          }}
                        />
                      </>
                    )}
                </group>
              ))}
            </group>
          ))}
        </>
      )}
    </>
  )
}
