import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TagLite = { id: string; name: string };

export function useAllTags() {
  return useQuery({
    queryKey: ["admin", "tags-all"],
    queryFn: async (): Promise<TagLite[]> => {
      const { data, error } = await supabase.from("tags").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });
}

