import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MatchSession {
  id: string;
  game_id: string;
  status: 'waiting' | 'matched' | 'playing' | 'finished';
  player1_id: string;
  player2_id: string | null;
  current_turn: string | null;
  player1_score: number;
  player2_score: number;
  started_at: string | null;
  finished_at: string | null;
  winner_id: string | null;
}

export const useMatchmaking = (gameId: string) => {
  const [isInQueue, setIsInQueue] = useState(false);
  const [matchSession, setMatchSession] = useState<MatchSession | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Join matchmaking queue
  const joinQueue = async () => {
    if (!userId) return;

    try {
      setIsMatching(true);
      
      // Add to queue
      const { error } = await supabase
        .from('match_queue')
        .insert({ user_id: userId, game_id: gameId });

      if (error) throw error;

      setIsInQueue(true);

      // Try to match players
      await supabase.rpc('match_players');
    } catch (error) {
      console.error('Error joining queue:', error);
    }
  };

  // Leave matchmaking queue
  const leaveQueue = async () => {
    if (!userId) return;

    try {
      await supabase
        .from('match_queue')
        .delete()
        .eq('user_id', userId)
        .eq('game_id', gameId);

      setIsInQueue(false);
      setIsMatching(false);
    } catch (error) {
      console.error('Error leaving queue:', error);
    }
  };

  // Subscribe to queue updates
  useEffect(() => {
    if (!gameId) return;

    let queueChannel: RealtimeChannel;
    let matchChannel: RealtimeChannel;

    const setupSubscriptions = async () => {
      // Subscribe to queue count
      queueChannel = supabase
        .channel(`queue:${gameId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'match_queue',
            filter: `game_id=eq.${gameId}`,
          },
          async () => {
            // Update queue count
            const { count } = await supabase
              .from('match_queue')
              .select('*', { count: 'exact', head: true })
              .eq('game_id', gameId);
            
            setQueueCount(count || 0);
          }
        )
        .subscribe();

      // Subscribe to match sessions
      if (userId) {
        matchChannel = supabase
          .channel(`match:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'match_sessions',
              filter: `player1_id=eq.${userId}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                setMatchSession(payload.new as MatchSession);
                setIsInQueue(false);
                setIsMatching(false);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'match_sessions',
              filter: `player2_id=eq.${userId}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                setMatchSession(payload.new as MatchSession);
                setIsInQueue(false);
                setIsMatching(false);
              }
            }
          )
          .subscribe();
      }
    };

    setupSubscriptions();

    return () => {
      queueChannel?.unsubscribe();
      matchChannel?.unsubscribe();
    };
  }, [gameId, userId]);

  // Switch turn
  const switchTurn = async (matchId: string) => {
    if (!matchSession || !userId) return;

    const nextPlayer = matchSession.current_turn === matchSession.player1_id
      ? matchSession.player2_id
      : matchSession.player1_id;

    await supabase
      .from('match_sessions')
      .update({ current_turn: nextPlayer })
      .eq('id', matchId);
  };

  // Update score
  const updateScore = async (matchId: string, score: number) => {
    if (!matchSession || !userId) return;

    const isPlayer1 = userId === matchSession.player1_id;
    const scoreField = isPlayer1 ? 'player1_score' : 'player2_score';

    await supabase
      .from('match_sessions')
      .update({ [scoreField]: score })
      .eq('id', matchId);
  };

  // End match
  const endMatch = async (matchId: string, winnerId: string) => {
    await supabase
      .from('match_sessions')
      .update({
        status: 'finished',
        finished_at: new Date().toISOString(),
        winner_id: winnerId,
      })
      .eq('id', matchId);
  };

  return {
    isInQueue,
    matchSession,
    isMatching,
    queueCount,
    userId,
    joinQueue,
    leaveQueue,
    switchTurn,
    updateScore,
    endMatch,
    isMyTurn: matchSession?.current_turn === userId,
  };
};
