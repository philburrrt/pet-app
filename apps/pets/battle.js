import React from 'react'
import { useSyncState, DEG2RAD } from 'hyperfy'

const positions = [
  [-8, 0, -5],
  [8, 0, -5],
]

export function Battle({ uid }) {
  return (
    <>
      <group position={positions[0]} rotation={[0, DEG2RAD * -90, 0]}>
        <Controls player={0} uid={uid} />
      </group>
      <group position={positions[1]} rotation={[0, DEG2RAD * 90, 0]}>
        <Controls player={1} uid={uid} />
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
const petLocations = [
  [-2, 0, 0],
  [0, 0, 0],
  [2, 0, 0],
]
const optionLocations = [
  [-0.25, 0, 0],
  [0.25, 0, 0],
]

export function Controls({ player, uid }) {
  const [state, dispatch] = useSyncState(state => state)
  const seat = state.players[player]

  return (
    <>
      {!seat.uid && (
        <text
          value="Play"
          bgColor="white"
          onClick={e => {
            const { uid } = e.avatar
            dispatch('addPlayer', player, uid)
          }}
        />
      )}
      {seat.uid === uid && (
        <>
          {petLocations.map((petLoc, i) => (
            <group position={petLoc} key={i}>
              {optionLocations.map((optionLoc, j) => (
                <group position={optionLoc} key={j}>
                  <text value={options[j]} bgColor="white" />
                </group>
              ))}
            </group>
          ))}
        </>
      )}
    </>
  )
}
