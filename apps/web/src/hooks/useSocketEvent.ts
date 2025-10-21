import { useEffect } from "react";
import { ServerEvents, type ServerToClientEvents } from "socket/types";
import { clientSocket } from "../lib/clientSocket";

export const useSocketEvent = <T extends ServerEvents>(
  event: T,
  handler: ServerToClientEvents[T],
  once = false,
) => {
  useEffect(() => {
    clientSocket[once ? 'once' : 'on'](event, handler);

    return () => {
      clientSocket.off(event, handler);
    };
  }, [event, handler, once]);
}
