import React from 'react'
import { DEG2RAD } from 'hyperfy'

const positions = [
  [-8, 0, -5],
  [8, 0, -5],
]

export function Battle({ team }) {
  return (
    <>
      <group position={positions[0]} rotation={[0, DEG2RAD * -90, 0]}>
        <Controls team={team} />
      </group>
      <group position={positions[1]} rotation={[0, DEG2RAD * 90, 0]}>
        <Controls />
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

export function Controls() {
  return (
    <>
      <text value="Play" bgColor="white" />
    </>
  )
}
