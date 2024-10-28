"use client";

import { LoadingSVG } from "@/components/button/LoadingSVG";
import { ChatMessageType } from "@/components/chat/ChatTile";
import { AudioInputTile } from "@/components/config/AudioInputTile";
import { PlaygroundHeader } from "@/components/playground/PlaygroundHeader";
import { PlaygroundTile } from "@/components/playground/PlaygroundTile";
import { useConfig } from "@/hooks/useConfig";
import {
  BarVisualizer,
  useConnectionState,
  useDataChannel,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState, LocalParticipant, Track } from "livekit-client";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import tailwindTheme from "../../lib/tailwindTheme.preval";

export interface PlaygroundMeta {
  name: string;
  value: string;
}

export interface PlaygroundProps {
  logo?: ReactNode;
  themeColors: string[];
  onConnect: (connect: boolean, opts?: { token: string; url: string }) => void;
}

const headerHeight = 56;

export default function Playground({ logo, onConnect }: PlaygroundProps) {
  const { config } = useConfig();

  const [transcripts, setTranscripts] = useState<ChatMessageType[]>([]);

  const { localParticipant } = useLocalParticipant();

  const voiceAssistant = useVoiceAssistant();

  const roomState = useConnectionState();

  const tracks = useTracks();

  useEffect(() => {
    if (roomState === ConnectionState.Connected) {
      localParticipant.setCameraEnabled(config.settings.inputs.camera);
      localParticipant.setMicrophoneEnabled(config.settings.inputs.mic);
    }
  }, [config, localParticipant, roomState]);

  const localTracks = tracks.filter(
    ({ participant }) => participant instanceof LocalParticipant
  );

  const localMicTrack = localTracks.find(
    ({ source }) => source === Track.Source.Microphone
  );

  const onDataReceived = useCallback(
    (msg: any) => {
      if (msg.topic === "transcription") {
        const decoded = JSON.parse(
          new TextDecoder("utf-8").decode(msg.payload)
        );
        let timestamp = new Date().getTime();
        if ("timestamp" in decoded && decoded.timestamp > 0) {
          timestamp = decoded.timestamp;
        }
        setTranscripts([
          ...transcripts,
          {
            name: "You",
            message: decoded.text,
            timestamp: timestamp,
            isSelf: true,
          },
        ]);
      }
    },
    [transcripts]
  );

  useDataChannel(onDataReceived);

  useEffect(() => {
    document.body.style.setProperty(
      "--lk-theme-color",
      // @ts-ignore
      tailwindTheme.colors[config.settings.theme_color]["500"]
    );
    document.body.style.setProperty(
      "--lk-drop-shadow",
      `var(--lk-theme-color) 0px 0px 18px`
    );
  }, [config.settings.theme_color]);

  const audioTileContent = useMemo(() => {
    const disconnectedContent = (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-700 text-center w-full">
        End call!
      </div>
    );

    const waitingContent = (
      <div className="flex flex-col items-center gap-2 text-gray-700 text-center w-full">
        <LoadingSVG />
        Waiting for me
      </div>
    );

    const visualizerContent = (
      <div
        className={`flex items-center justify-center w-full h-48 [--lk-va-bar-width:30px] [--lk-va-bar-gap:20px] [--lk-fg:var(--lk-theme-color)]`}
      >
        <BarVisualizer
          state={voiceAssistant.state}
          trackRef={voiceAssistant.audioTrack}
          barCount={5}
          options={{ minHeight: 20 }}
        />
      </div>
    );

    if (roomState === ConnectionState.Disconnected) {
      return disconnectedContent;
    }

    if (!voiceAssistant.audioTrack) {
      return waitingContent;
    }

    return visualizerContent;
  }, [voiceAssistant.audioTrack, roomState, voiceAssistant.state]);

  // useEffect(() => {
  //   const audioWaiting = new Audio('/phone-vibrating.mp3');

  //   const playAudio = async () => {
  //     try {
  //       if (!voiceAssistant.audioTrack && roomState !== ConnectionState.Disconnected) {
  //         // Chỉ phát âm thanh nếu nó chưa đang phát
  //         if (audioWaiting.paused) {
  //           await audioWaiting.play();
  //           // Thiết lập onended chỉ khi âm thanh bắt đầu phát
  //           audioWaiting.onended = () => {
  //             playAudio(); // Gọi lại playAudio khi âm thanh đã phát xong
  //           };
  //         }
  //       } else {
  //         // Nếu có audio track hoặc đã ngắt kết nối, dừng âm thanh
  //         audioWaiting.pause();
  //         audioWaiting.currentTime = 0; // Đặt lại thời gian phát
  //         audioWaiting.onended = null; // Ngừng gọi lại hàm playAudio
  //       }
  //     } catch (error) {
  //       console.error("Error playing audio:", error);
  //     }
  //   };

  //   const handleUserInteraction = () => {
  //     // Gọi hàm playAudio khi có tương tác từ người dùng
  //     playAudio();
  //     // Ngừng lắng nghe sự kiện nhấp chuột
  //     window.removeEventListener('click', handleUserInteraction);
  //   };

  //   // Thêm sự kiện nhấp chuột vào window
  //   window.addEventListener('click', handleUserInteraction);

  //   playAudio();

  //   return () => {
  //     audioWaiting.pause();
  //     audioWaiting.currentTime = 0;
  //     audioWaiting.onended = null;
  //     window.removeEventListener('click', handleUserInteraction);
  //   };
  // }, [voiceAssistant.audioTrack, roomState]);

  return (
    <>
      <PlaygroundHeader
        title={config.title}
        logo={logo}
        githubLink={config.github_link}
        height={headerHeight}
        accentColor={config.settings.theme_color}
        connectionState={roomState}
        onConnectClicked={() =>
          onConnect(roomState === ConnectionState.Disconnected)
        }
      />
      <div
        className={`flex gap-4 py-4 grow w-full selection:bg-${config.settings.theme_color}-900`}
        style={{ height: `calc(100% - ${headerHeight}px)` }}
      >
        <div className="flex flex-col grow basis-1/2 gap-4 h-full">
          <PlaygroundTile
            className="w-full h-full grow"
            childrenClassName="justify-center"
          >
            {audioTileContent}
          </PlaygroundTile>
          {localMicTrack && (
            <PlaygroundTile
              className="w-full h-full grow"
              childrenClassName="justify-center"
            >
              <AudioInputTile trackRef={localMicTrack} />
            </PlaygroundTile>
          )}
        </div>
      </div>
    </>
  );
}
