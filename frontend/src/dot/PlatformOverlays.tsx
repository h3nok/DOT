import { AnimatePresence } from "framer-motion";
import type React from "react";
import { CircleSurface } from "./Circle";
import { Invite } from "./Invite";
import { InviteWelcome } from "./InviteWelcome";
import { JoinSurface } from "./JoinSurface";
import { PresenceSurface } from "./PresenceSurface";
import { SignIn } from "./SignIn";
import { SupportSurface } from "./SupportSurface";
import { TwinSurface } from "./TwinSurface";
import { VaultSurface } from "./VaultSurface";
import type { DotNode } from "./types";
import type { PlatformSurface } from "./types";
import type { AgentWorkspaceRequest } from "./AgentWorkspace";
import type { AuthUser } from "./useAuth";
import type { InviteArrival } from "./useInviteArrival";

interface PlatformOverlaysProps {
  surface: PlatformSurface;
  origin: { x: number; y: number };
  reducedMotion: boolean;
  root: DotNode;
  isOwner: boolean;
  companionRequest: (AgentWorkspaceRequest & { id: number }) | null;
  onSetSurface: (s: PlatformSurface) => void;
  onCloseSupport: () => void;
  onOpenNode: (nodeId: string) => void;
  onClearCompanion: () => void;
  onInvite?: () => void;
}

export const PlatformOverlays: React.FC<PlatformOverlaysProps> = ({
  surface,
  origin,
  reducedMotion,
  root,
  isOwner,
  companionRequest,
  onSetSurface,
  onCloseSupport,
  onOpenNode,
  onClearCompanion,
  onInvite,
}) => (
  <>
    <AnimatePresence>
      {surface === "circle" && (
        <CircleSurface
          ownerName={root.label}
          isOwner={isOwner}
          origin={origin}
          reducedMotion={reducedMotion}
          onInvite={() => {
            onSetSurface(null);
            onInvite?.();
          }}
          onClose={() => onSetSurface(null)}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {surface === "vault" && (
        <VaultSurface
          origin={origin}
          reducedMotion={reducedMotion}
          onClose={() => onSetSurface(null)}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {surface === "support" && (
        <SupportSurface
          origin={origin}
          reducedMotion={reducedMotion}
          onClose={onCloseSupport}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {surface === "join" && (
        <JoinSurface
          origin={origin}
          reducedMotion={reducedMotion}
          onClose={() => onSetSurface(null)}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {surface === "twin" && (
        <TwinSurface
          origin={origin}
          reducedMotion={reducedMotion}
          initialRequest={companionRequest}
          onClose={() => {
            onClearCompanion();
            onSetSurface(null);
          }}
          onOpenNode={onOpenNode}
        />
      )}
    </AnimatePresence>
  </>
);

interface ModalOverlaysProps {
  signInOpen: boolean;
  inviteOpen: boolean;
  presenceOpen: boolean;
  origin: { x: number; y: number };
  reducedMotion: boolean;
  user: AuthUser | null;
  invited: {
    open: boolean;
    arrival: InviteArrival | null;
    token: string | null;
    dismiss: () => void;
  };
  rootLabel: string;
  isOwner: boolean;
  onCloseSignIn: () => void;
  onSignedIn: () => void;
  onCloseInvite: () => void;
  onClosePresence: () => void;
  onOpenConversations: () => void;
  onPresenceInvite: () => void;
  onSignOut: () => void;
  onEnterInvite: () => void;
}

export const ModalOverlays: React.FC<ModalOverlaysProps> = ({
  signInOpen,
  inviteOpen,
  presenceOpen,
  origin,
  reducedMotion,
  user,
  invited,
  rootLabel,
  onCloseSignIn,
  onSignedIn,
  onCloseInvite,
  onClosePresence,
  onOpenConversations,
  onPresenceInvite,
  onSignOut,
  onEnterInvite,
}) => (
  <>
    <AnimatePresence>
      {signInOpen && (
        <SignIn
          origin={origin}
          reducedMotion={reducedMotion}
          onClose={onCloseSignIn}
          onSignedIn={onSignedIn}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {inviteOpen && (
        <Invite
          origin={origin}
          reducedMotion={reducedMotion}
          onClose={onCloseInvite}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {presenceOpen && user && (
        <PresenceSurface
          user={user}
          reducedMotion={reducedMotion}
          onClose={onClosePresence}
          onOpenConversations={onOpenConversations}
          onInvite={onPresenceInvite}
          onSignOut={onSignOut}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {invited.open && (
        <InviteWelcome
          ownerName={rootLabel}
          arrival={invited.arrival}
          origin={origin}
          reducedMotion={reducedMotion}
          onEnter={onEnterInvite}
          onClose={() => invited.dismiss()}
        />
      )}
    </AnimatePresence>
  </>
);
