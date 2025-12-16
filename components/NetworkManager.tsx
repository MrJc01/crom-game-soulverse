import React, { useState, useEffect } from 'react';
import { socket } from '../utils/socketClient';
import { NetworkPlayer } from './NetworkPlayer';

interface PlayerData {
  id: string;
  x: number;
  y: number;
  z: number;
  color: string;
  facingRight: boolean;
}

export const NetworkManager: React.FC = () => {
  const [otherPlayers, setOtherPlayers] = useState<Record<string, PlayerData>>({});

  useEffect(() => {
    // 1. Receive list of current players when connecting
    socket.on('currentPlayers', (serverPlayers: Record<string, PlayerData>) => {
      const { [socket.id]: myPlayer, ...others } = serverPlayers;
      setOtherPlayers(others);
    });

    // 2. Handle a new player joining
    socket.on('newPlayer', (newPlayer: PlayerData) => {
      // Don't add ourselves
      if (newPlayer.id === socket.id) return;
      
      setOtherPlayers((prev) => ({
        ...prev,
        [newPlayer.id]: newPlayer
      }));
    });

    // 3. Handle a player disconnecting
    socket.on('playerDisconnected', (id: string) => {
      setOtherPlayers((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    });

    return () => {
      socket.off('currentPlayers');
      socket.off('newPlayer');
      socket.off('playerDisconnected');
    };
  }, []);

  return (
    <>
      {Object.values(otherPlayers).map((player: PlayerData) => (
        <NetworkPlayer 
          key={player.id}
          id={player.id}
          initialPos={{ x: player.x, y: player.y, z: player.z }}
          color={player.color}
          initialFacingRight={player.facingRight}
        />
      ))}
    </>
  );
};