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
    /*
      * uid and team is sent to both players in case:
        - a player decides to join and needs to submit their uid and team
        - to not show the controls for the player that is not the current user
          - if controls are shown to anyone else, they can click on them
    */
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

export function InfoBoard() {
  const [match] = useSyncState(state => state.match)
  const [countdown] = useSyncState(state => state.countdown)

  return (
    <>
      <billboard axis="y" position={[0, 0.5, -5]}>
        {match.state != 'idle' && match.state != 'ending' && (
          <text
            value={`Turn: Player ${match.turn + 1}`}
            position={[0, 0, 0]}
            bgColor={'white'}
          />
        )}
        <text
          value={`Phase: ${match.state}`}
          position={[0, -0.1, 0]}
          bgColor={'white'}
        />
        {match.winner && (
          <text
            value={`Winner: ${match.winner}`}
            position={[0, -0.2, 0]}
            bgColor={'white'}
          />
        )}
        {countdown > 0 && (
          <text
            value={`Time til next phase: ${countdown}`}
            position={[0, -0.3, 0]}
            bgColor={'white'}
          />
        )}
      </billboard>
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
    const attackPower = fromPet.attack
    let damage = randomInt(minDamage, maxDamage)
    const manaCost = randomInt(5, 20)
    if (fromPet.mana < manaCost) return console.log('not enough mana')
    damage += parseInt(attackPower) / 2
    const crit = randomInt(0, 100)
    if (crit <= 25) {
      console.log('crit!')
      damage *= 2
    }
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
    if (fromPet.mana < manaCost) return console.log('not enough mana')
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
            setUid(uid)
            dispatch('addPlayer', player, uid, team)

            // ! ----------------- delete after testing (mock user)
            // const fakeUid = 'fake'
            // const fakeTeam = [
            //   {
            //     type: 'Tank',
            //     health: '100',
            //     mana: '100',
            //     attack: '10',
            //   },
            //   {
            //     type: 'DPS',
            //     health: '50',
            //     mana: '100',
            //     attack: '40',
            //   },
            //   {
            //     type: 'Healer',
            //     health: '65',
            //     mana: '100',
            //     attack: '10',
            //   },
            // ]
            // dispatch('addPlayer', player, uid, fakeTeam)
            // dispatch('addPlayer', opponent, fakeUid, fakeTeam)
            // ! ----------------- delete after testing (mock user)
          }}
        />
      )}
      {seat.uid && opponentSeat.uid === null && (
        <text value="Waiting" bgColor="white" />
      )}
      {/* player only controls */}
      {uid && seat.uid === uid && (
        <>
          {petLocations.map((petLoc, i) => (
            // * i === 0 ? 'Tank' : i === 1 ? 'DPS' : 'Healer'
            <group position={[petLoc[0], petLoc[1] - 0.1, petLoc[2]]} key={i}>
              <text
                value={i === 0 ? 'Tank' : i === 1 ? 'DPS' : 'Healer'}
                position={[0, -0.1, 0]}
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
