"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";


export default function ChildPage() {
  const [slides, setSlides] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
  const [scoreVisible, setScoreVisible] = useState(true);
  const [effect, setEffect] = useState("none");
  const subscriptionRef = useRef<any>(null);

  // データ取得関数
  const fetchAll = async () => {
    const { data: teamData } = await supabase.from("teams").select();
    setTeams(teamData ?? []);
    const { data: slideData } = await supabase.from("slides").select().order("order");
    setSlides(slideData ?? []);
    const { data: scoreData } = await supabase.from("scores").select();
    setScores(scoreData ?? []);
    // スライド状態取得
    const { data: slideState } = await supabase.from("slide_state").select().eq("id", 1).single();
    if (slideState) {
      setCurrentSlideId(slideState.current_slide);
      setEffect(slideState.effect ?? "none");
    }
    // 得点表示状態取得
    const { data: scoreState } = await supabase.from("score_state").select().eq("id", 1).single();
    if (scoreState) setScoreVisible(scoreState.visible);
  };

  // 初回取得＋Realtime購読
  useEffect(() => {
    fetchAll();

    // Realtime購読
    const channel = supabase.channel('child-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slide_state' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'score_state' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, fetchAll)
      .subscribe();
    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 得点を降順でソート
  const sortedTeams = [...teams].sort((a, b) => {
    const sa = scores.find((s: any) => s.team_id === a.id)?.score ?? 0;
    const sb = scores.find((s: any) => s.team_id === b.id)?.score ?? 0;
    return sb - sa;
  });

  // 現在スライドの画像URL取得
  const getImageUrl = (filename: string) => {
    if (!filename) return "";
    const { data } = supabase.storage.from("slides").getPublicUrl(filename);
    return data.publicUrl;
  };
  const currentSlide = slides.find((s) => s.id === currentSlideId);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
      {/* スライド画像 */}
      <div className="w-[640px] h-[360px] bg-zinc-800 flex items-center justify-center text-white text-2xl font-bold mb-8">
        {currentSlide ? (
          <img
            src={getImageUrl(currentSlide.filename)}
            alt={currentSlide.filename}
            className="w-full h-full object-contain"
          />
        ) : (
          <span>スライドなし</span>
        )}
      </div>
      {/* 得点表示（順位順） */}
      {scoreVisible && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/90 rounded shadow px-8 py-4 flex gap-8">
          {sortedTeams.map((team) => {
            const score = scores.find((s) => s.team_id === team.id)?.score ?? 0;
            return (
              <div key={team.id} className="flex flex-col items-center" style={{ color: team.color }}>
                <span className="font-bold text-lg">{team.name}</span>
                <span className="text-2xl font-mono">{score}</span>
              </div>
            );
          })}
        </div>
      )}
      {/* 演出（ダミー） */}
      {effect !== "none" && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
          演出: {effect}
        </div>
      )}
    </div>
  );
}
