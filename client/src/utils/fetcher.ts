// utils/fetcher.ts
import { api } from "../services/authServices";

export const fetcher = <T>(url: string): Promise<T> =>
  api.get<T>(url).then((res) => res.data);
