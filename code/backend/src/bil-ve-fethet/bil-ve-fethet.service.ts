import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

type PlayerId = 'player' | 'bot1' | 'bot2';

interface RoomPlayer {
  userId: string;
  displayName: string;
  slot: PlayerId;
}

export interface Room {
  code: string;
  hostUserId: string;
  players: RoomPlayer[];
  status: 'waiting' | 'in_game' | 'ended';
  createdAt: Date;
}

@Injectable()
export class BilVeFethetService {
  private rooms = new Map<string, Room>();

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private cleanupOldRooms(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [code, room] of this.rooms.entries()) {
      if (room.createdAt < oneHourAgo) {
        this.rooms.delete(code);
      }
    }
  }

  createRoom(userId: string, displayName: string): { code: string; slot: PlayerId } {
    this.cleanupOldRooms();
    let code = this.generateCode();
    while (this.rooms.has(code)) {
      code = this.generateCode();
    }
    const room: Room = {
      code,
      hostUserId: userId,
      players: [{ userId, displayName, slot: 'player' }],
      status: 'waiting',
      createdAt: new Date(),
    };
    this.rooms.set(code, room);
    return { code, slot: 'player' };
  }

  joinRoom(code: string, userId: string, displayName: string): { slot: PlayerId } {
    const room = this.rooms.get(code);
    if (!room) throw new NotFoundException('Oda bulunamadı');
    if (room.status !== 'waiting') throw new BadRequestException('Oyun zaten başladı');
    if (room.players.find(p => p.userId === userId)) {
      // Re-joining — return existing slot
      return { slot: room.players.find(p => p.userId === userId)!.slot };
    }
    const takenSlots = room.players.map(p => p.slot);
    const availableSlots: PlayerId[] = (['bot1', 'bot2'] as PlayerId[]).filter(s => !takenSlots.includes(s));
    if (availableSlots.length === 0) throw new BadRequestException('Oda dolu');
    const slot = availableSlots[0];
    room.players.push({ userId, displayName, slot });
    return { slot };
  }

  getRoom(code: string): Room {
    const room = this.rooms.get(code);
    if (!room) throw new NotFoundException('Oda bulunamadı');
    return room;
  }

  startRoom(code: string, userId: string): void {
    const room = this.rooms.get(code);
    if (!room) throw new NotFoundException('Oda bulunamadı');
    if (room.hostUserId !== userId) throw new BadRequestException('Sadece oda sahibi başlatabilir');
    room.status = 'in_game';
  }

  leaveRoom(code: string, userId: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    if (room.hostUserId === userId) {
      this.rooms.delete(code);
    } else {
      room.players = room.players.filter(p => p.userId !== userId);
    }
  }
}
