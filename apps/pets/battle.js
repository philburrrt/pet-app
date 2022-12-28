import React, { useState, useEffect, Fragment } from 'react'
import { useSyncState, DEG2RAD, randomInt } from 'hyperfy'

// center of each player's controls
const positions = [
  [-5, 0, -5],
  [5, 0, -5],
]

const options = ['Attack', 'Heal']
// 0 = tank, 1 = dps, 2 = healer
const petLocations = [
  [-2, 0, 0],
  [0, 0, 0],
  [2, 0, 0],
]
const optionLocations = [
  [-0.25, -0.2, 0],
  [0.25, -0.2, 0],
]

const players = [0, 1]

export function Battle({ team }) {
  return (
    <>
      {players.map(player => {
        return (
          <group
            key={player}
            position={positions[player]}
            rotation={[0, DEG2RAD * (player === 0 ? -90 : 90), 0]}
          >
            <Controls player={player} team={team} />
            <Pets player={player} />
          </group>
        )
      })}
    </>
  )
}

export function Pets({ player }) {
  const [pets] = useSyncState(state => state.players[player].team)

  if (!pets) return null
  return (
    <>
      {pets.map((pet, i) => {
        if (parseInt(pet.health) === 0) return null
        return (
          <Fragment key={i}>
            <panel
              size={[0.4, 0.05]}
              canvasSize={[128, 128]}
              unitSize={1}
              style={{ bg: 'rgba(0,0,0,.2)' }}
              position={[
                petLocations[i][0],
                petLocations[i][1],
                petLocations[i][2] - 0.5,
              ]}
            >
              <rect
                style={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: pet.health + '%',
                  bg: '#00ff00',
                }}
              />
            </panel>
            <panel
              size={[0.4, 0.05]}
              canvasSize={[128, 128]}
              unitSize={1}
              style={{ bg: 'rgba(0,0,0,.2)' }}
              position={[
                petLocations[i][0],
                petLocations[i][1] - 0.075,
                petLocations[i][2] - 0.5,
              ]}
            >
              <rect
                style={{
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: pet.mana + '%',
                  bg: '#0000ff',
                }}
                position={[0, -0.05, 0]}
              />
            </panel>
            <model
              src={`${pet.type}.glb`}
              position={[
                petLocations[i][0],
                petLocations[i][1] - 1.5,
                petLocations[i][2] - 0.5,
              ]}
              rotation={[0, DEG2RAD * 180, 0]}
              scale={2}
              animate={true}
            />
          </Fragment>
        )
      })}
    </>
  )
}

/*
  * Displays pet options and targets. Triggers damage/healing.
  @param player: 0 or 1 (0 is left, 1 is right)
  @param uid: current user's uid
  @param team: current user's team
*/
export function Controls({ player, team }) {
  // ------------------ State
  const [state, dispatch] = useSyncState(state => state)
  const seat = state.players[player]
  const [selected, setSelected] = useState({
    pet: null,
    option: null,
  })
  const [uid, setUid] = useState(null)

  // ------------------ Global variables
  const opponent = player === 0 ? 1 : 0
  const opponentSeat = state.players[opponent]

  // * ------------------ Determines damage
  const maxDamage = 25
  const minDamage = 10
  function damagePet(fromPet, targetPet) {
    let damage = randomInt(minDamage, maxDamage)
    const manaCost = damage / 2
    if (fromPet.mana < manaCost) return console.log('not enough mana')
    const crit = randomInt(0, 100)
    if (crit <= 25) {
      console.log('crit!')
      damage *= 1.5
    }
    const fromType = fromPet.type === 'Tank' ? 0 : 'DPS' ? 1 : 2
    const targetType = targetPet.type === 'Tank' ? 0 : 'DPS' ? 1 : 2
    if (fromType === 1) {
      const attackPower = fromPet.attack
      const multiplier = attackPower / 100 + 1.5
      damage *= multiplier
    }
    if (targetType === 0) {
      const defense = targetPet.defense
      const multiplier = 1 - defense / 100 / 2
      damage *= multiplier
    }
    dispatch('damagePet', opponent, targetType, damage)
    dispatch('useMana', player, fromType, manaCost)
  }

  // * ------------------ Determines healing
  const maxHeal = 25
  const minHeal = 10
  function healTeam(seat, fromPet) {
    let healAmount = randomInt(minHeal, maxHeal)
    const manaCost = healAmount / 2
    if (fromPet.mana < manaCost) return console.log('not enough mana')
    const fromType = fromPet.type === 'Tank' ? 0 : 'DPS' ? 1 : 2
    const crit = randomInt(0, 100)
    if (crit <= 25) {
      console.log('crit!')
      healAmount *= 1.5
    }
    if ((fromType = 2)) {
      const healPower = fromPet.healing
      const multiplier = healPower / 100 + 1.5
      healAmount *= multiplier
    }
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
            // if (!team) return
            const { uid } = e.avatar
            setUid(uid)
            // dispatch('addPlayer', player, uid, team)
            // ! ----------------- delete after testing (mock user)
            const fakeUid = 'fake'
            const fakeTeam = [
              {
                type: 'Tank',
                health: '100',
                mana: '100',
                defense: '75',
              },
              {
                type: 'DPS',
                health: '100',
                mana: '100',
                attack: '75',
              },
              {
                type: 'Healer',
                health: '100',
                mana: '100',
                attack: '75',
              },
            ]
            dispatch('addPlayer', player, uid, fakeTeam)
            dispatch('addPlayer', opponent, fakeUid, fakeTeam)
            // ! ----------------- delete after testing (mock user)
          }}
        />
      )}
      {seat.uid && opponentSeat.uid === null && (
        <text value="Waiting" bgColor="white" />
      )}
      {/* player only controls */}
      {uid && seat.uid === uid && state.match.state === 'active' && (
        <>
          {petLocations.map((petLoc, i) => (
            // * i === 0 ? 'Tank' : i === 1 ? 'DPS' : 'Healer'
            <group position={[petLoc[0], petLoc[1] - 0.1, petLoc[2]]} key={i}>
              <text
                value={i === 0 ? 'Tank' : i === 1 ? 'DPS' : 'Healer'}
                position={[0, -0.1, 0]}
                bgColor="white"
              />
              <text
                value={
                  i === 0 && state.match.turn === player ? 'Your turn...' : ''
                }
                position={[-0.4, 0.2, 0]}
                bgColor="white"
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
                            const tank = opponentSeat.team[0]
                            if (parseInt(tank.health) <= 0)
                              return console.log('ALREADY DEAD')
                            damagePet(seat.team[i], tank)
                          }}
                        />
                        <text
                          value="DPS"
                          bgColor="white"
                          position={[-0, -0.1, 0]}
                          onClick={() => {
                            const dps = opponentSeat.team[1]
                            if (parseInt(dps.health) <= 0)
                              return console.log('ALREADY DEAD')
                            damagePet(seat.team[i], dps)
                          }}
                        />
                        <text
                          value="Healer"
                          bgColor="white"
                          position={[0.15, -0.2, 0]}
                          onClick={() => {
                            const healer = opponentSeat.team[2]
                            if (parseInt(healer.health) <= 0)
                              return console.log('ALREADY DEAD')
                            damagePet(seat.team[i], healer)
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
