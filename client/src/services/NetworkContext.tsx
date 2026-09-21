import NetInfo from "@react-native-community/netinfo";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const NetworkContext = createContext<boolean>(true);

/**
 * Whether the device currently has usable internet.
 *
 * `isInternetReachable` is deliberately preferred over `isConnected`: campus
 * wifi that has associated but not authenticated reports connected while every
 * request times out, which is the single most common "why is nothing loading"
 * case on a university network. It is null until the first probe resolves, and
 * null is treated as online so the banner never flashes on a cold start.
 */
export function NetworkProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isInternetReachable ?? state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  return <NetworkContext.Provider value={online}>{children}</NetworkContext.Provider>;
}

export function useIsOnline() {
  return useContext(NetworkContext);
}
