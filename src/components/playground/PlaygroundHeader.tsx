import { Button } from "@/components/button/Button";
import { LoadingSVG } from "@/components/button/LoadingSVG";
import { SettingsDropdown } from "@/components/playground/SettingsDropdown";
import { useConfig } from "@/hooks/useConfig";
import { ConnectionState } from "livekit-client";
import { ReactNode } from "react";

type PlaygroundHeader = {
  logo?: ReactNode;
  title?: ReactNode;
  githubLink?: string;
  height: number;
  accentColor: string;
  connectionState: ConnectionState;
  onConnectClicked: () => void;
};

export const PlaygroundHeader = ({
  accentColor,
  height,
  onConnectClicked,
  connectionState,
}: PlaygroundHeader) => {
  const { config } = useConfig();
  return (
    <div
      className={`flex gap-4 pt-4 text-${accentColor}-500 justify-between items-center shrink-0`}
      style={{
        height: height + "px",
      }}
    >
      <div className="flex items-center gap-3 basis-2/3">
        <div className="flex lg:basis-1/2">
          <a href="https://cybertech.com.vn/">
            <img
              src="http://cbtcdn.cybertech.com.vn/cbtcdn/logo-text.png"
              className="h-[33px]"
              alt="Logo"
            />
          </a>
        </div>
      </div>
      <div className="flex basis-1/3 justify-end items-center gap-2">
        {config.settings.editable && <SettingsDropdown />}
        <Button
          accentColor={
            connectionState === ConnectionState.Connected ? "red" : accentColor
          }
          disabled={connectionState === ConnectionState.Connecting}
          onClick={() => {
            onConnectClicked();
          }}
        >
          {connectionState === ConnectionState.Connecting ? (
            <LoadingSVG />
          ) : connectionState === ConnectionState.Connected ? (
            "Disconnect"
          ) : (
            "Connect"
          )}
        </Button>
      </div>
    </div>
  );
};