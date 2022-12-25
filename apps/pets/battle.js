import React, { useState } from 'react'
import { useSyncState, DEG2RAD, randomInt } from 'hyperfy'

// center of each player's controls
const positions = [
  [-8, 0, -5],
  [8, 0, -5],
]

export function Battle({ uid, team }) {
  return (
    /*
      * uid and team is sent to both players in case:
        - a player decides to join and needs to submit their uid and team
        - to not show the controls for the player that is not the current user
          - if controls are shown to anyone else, they can click on them
    */
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

/*
  * Displays pet options and targets. Triggers damage/healing.
  @param player: 0 or 1 (0 is left, 1 is right)
  @param uid: current user's uid
  @param team: current user's team
*/
export function Controls({ player, uid, team }) {
  // ------------------ State
  const [state, dispatch] = useSyncState(state => state)
  const seat = state.players[player]
  const [selected, setSelected] = useState({
    pet: null,
    option: null,
  })

  // ------------------ Global variables
  const opponent = player === 0 ? 1 : 0
  const opponentSeat = state.players[opponent]

  // * ------------------ Determines damage
  const maxDamage = 25
  const minDamage = 10
  function damagePet(fromPet, targetPet) {
    const attackPower = fromPet.attack
    console.log('fromPet', fromPet)
    console.log('targetPet', targetPet)
    let damage = randomInt(minDamage, maxDamage) + attackPower
    const manaCost = damage / 2
    const crit = randomInt(0, 100)
    if (crit <= 25) {
      console.log('crit!')
      damage *= 2
    }
    console.log('fromPet', fromPet)
    let fromType = fromPet.type === 'Tank' ? 0 : fromPet.type === 'DPS' ? 1 : 2
    let targetType =
      targetPet.type === 'Tank' ? 0 : targetPet.type === 'DPS' ? 1 : 2
    console.log(
      `damaging ${targetPet.type} for ${damage} damage, using ${manaCost} mana`
    ) // this is logging the targetPet.type correctly, the damagePet method is saying pet 0 for every one
    dispatch('damagePet', opponent, targetType, damage)
    dispatch('useMana', player, fromType, manaCost)
  }

  // * ------------------ Determines healing
  const maxHeal = 25
  const minHeal = 10
  function healTeam(seat, fromPet) {
    let healAmount = randomInt(minHeal, maxHeal)
    const manaCost = healAmount / 2
    const crit = randomInt(0, 100)
    console.log('fromPet', fromPet)
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
    dispatch('useMana', seat, fromType, manaCost)
  }

  return (
    <>
      {!seat.uid && (
        <text
          value="Play"
          bgColor="white"
          onClick={e => {
            if (!team) return
            const { uid } = e.avatar
            dispatch('addPlayer', player, uid, team)

            // ! ----------------- delete after testing (mock user)
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
            dispatch('addPlayer', opponent, fakeUid, fakeTeam)
          }}
          // ! ----------------- delete after testing (mock user)
        />
      )}
      {seat.uid && opponentSeat.uid === null && (
        <text value="Waiting" bgColor="white" />
      )}
      {seat.uid === uid && (
        <>
          {petLocations.map((petLoc, i) => (
            // * i === 0 ? 'Tank' : i === 1 ? 'DPS' : 'Healer'
            <group position={petLoc} key={i}>
              <text
                value={i === 0 ? 'Tank' : i === 1 ? 'DPS' : 'Healer'}
                position={[0, 0.1, 0]}
              />
              <model
                src={i === 0 ? 'tank.glb' : i === 1 ? 'dps.glb' : 'healer.glb'}
                position={[0, -1.5, -0.5]}
                rotation={[0, DEG2RAD * 180, 0]}
                animate={true}
                scale={2}
              />
              {optionLocations.map((optionLoc, j) => (
                // * j === 0 ? 'Attack' : 'Heal'
                <group position={optionLoc} key={j}>
                  <text
                    value={options[j]}
                    bgColor="white"
                    onClick={() => {
                      // * If j is 'Attack', then prompt a new menu for target
                      if (j !== 1) {
                        setSelected({
                          pet: i,
                          option: j,
                        })
                        // * If j is 'Heal', then heal the entire team & move on
                      } else {
                        healTeam(player, seat.team[i])
                      }
                      console.log('selected', { pet: i, option: j })
                    }}
                  />
                  {selected.pet === i &&
                    selected.option === j &&
                    selected.option != 1 && (
                      // * Target menu for 'Attack'
                      // 0 = Tank, 1 = DPS, 2 = Healer
                      <>
                        <text
                          value="Tank"
                          bgColor="white"
                          position={[-0.15, -0.2, 0]}
                          onClick={() => {
                            damagePet(seat.team[i], opponentSeat.team[0])
                          }}
                        />
                        <text
                          value="DPS"
                          bgColor="white"
                          position={[-0, -0.1, 0]}
                          onClick={() => {
                            damagePet(seat.team[i], opponentSeat.team[1])
                          }}
                        />
                        <text
                          value="Healer"
                          bgColor="white"
                          position={[0.15, -0.2, 0]}
                          onClick={() => {
                            damagePet(seat.team[i], opponentSeat.team[2])
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
