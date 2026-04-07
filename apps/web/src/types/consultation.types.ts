export type SessionStatus = "TEMP" | "ACTIVE";

export type Session = {
  sessionId: string;
  status: SessionStatus;
  sessionTitle: string;
};

export type Message = {
  initialMessage: string;
  sessionTitle: string;
};

export type CreateNewSessionResponse = {
  sessionId: string;
  status: SessionStatus;
  expiryTime: number;
  initialMessage: string;
  messageCount: number;
  startTime: number;
  userHash: number;
};

export type SessionList = { pageNum: string; pageSize: string };

export type NewSession = { initialMessage: string; sessionTitle: string };
