import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { detectLumpy, getLumpyStats } from "@/api/endpoints";

export function useLumpyStats() {
  return useQuery({
    queryKey: ["lumpy", "stats"],
    queryFn: getLumpyStats,
    staleTime: 15_000,
  });
}

export function useDetectLumpy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detectLumpy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lumpy", "stats"] });
    },
  });
}
