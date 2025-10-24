import useSWR from "swr";
import { useEffect, useState } from "react";
import { api } from "@/src/services/api";

// --- Base fetchers ---
const fetcher = (url: string) => api.get(url).then((res) => res.data);

async function fetchConnections() {
  const res = await api.get("/user/connections");
  return res.data.connections || [];
}

// --- Hook definition ---
export default function useConnections() {
  const { data: connections, error, isLoading } = useSWR("/user/connections", fetchConnections);
  const [enrichedConnections, setEnrichedConnections] = useState<any[]>([]);

  useEffect(() => {
    if (!connections || !Array.isArray(connections)) return;

    (async () => {
      try {
        // Create a local cache to avoid multiple identical requests
        const userCache: Record<string, any> = {};

        const fullConnections = await Promise.all(
          connections.map(async (conn) => {
            const userId = conn.receiver_id;
            if (!userId) return conn;

            // Reuse cached user if already fetched
            if (!userCache[userId]) {
              const { data } = await api.get(`/user/${userId}`);
              userCache[userId] = data.user;
            }

            return { ...conn, user: userCache[userId] };
          })
        );

        setEnrichedConnections(fullConnections);
      } catch (err) {
        console.error("Error enriching connections:", err);
      }
    })();
  }, [connections]);

  return {
    connections: enrichedConnections,
    isLoading,
    error,
  };
}
