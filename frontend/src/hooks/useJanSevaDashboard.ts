import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createServiceRequest,
  getServiceRequests,
  sendJanSevaChat,
  updateServiceRequestStatus,
} from "@/api/endpoints";

export function useServiceRequests() {
  return useQuery({
    queryKey: ["janseva", "requests"],
    queryFn: getServiceRequests,
    staleTime: 10_000,
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createServiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["janseva", "requests"] });
    },
  });
}

export function useUpdateServiceRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateServiceRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["janseva", "requests"] });
    },
  });
}

export function useJanSevaChat() {
  return useMutation({
    mutationFn: ({ message, language }: { message: string; language?: string }) =>
      sendJanSevaChat(message, language),
  });
}
