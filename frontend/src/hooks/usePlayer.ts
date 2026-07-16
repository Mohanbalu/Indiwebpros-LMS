import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { playerService } from "@/services/player.service";

export function useCourseStructure(courseId: string) {
  return useQuery({
    queryKey: ["courseStructure", courseId],
    queryFn: () => playerService.getCourseStructure(courseId),
    enabled: !!courseId,
  });
}

export function useLessonDetails(lessonId: string, enabled = true) {
  return useQuery({
    queryKey: ["lessonDetails", lessonId],
    queryFn: () => playerService.getLessonDetails(lessonId),
    enabled: !!lessonId && enabled,
  });
}

export function useResumeLearning() {
  return useQuery({
    queryKey: ["resumeLearning"],
    queryFn: () => playerService.getResumeLearning(),
  });
}

export function useBookmarks() {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => playerService.listBookmarks(),
  });
}

export function useNotes(params?: { courseId?: string; lessonId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["notes", params],
    queryFn: () => playerService.listNotes(params),
    enabled: !!params?.lessonId || !!params?.courseId,
  });
}

export function useAddBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => playerService.addBookmark(lessonId),
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["lessonDetails", lessonId] });
      // Invalidate course structure queries to sync bookmark indicators
      queryClient.invalidateQueries({ queryKey: ["courseStructure"] });
    },
  });
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idOrLessonId: string) => playerService.removeBookmark(idOrLessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["lessonDetails"] });
      queryClient.invalidateQueries({ queryKey: ["courseStructure"] });
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      lessonId: string;
      title?: string;
      content: string;
      videoTimestamp?: number;
    }) => playerService.createNote(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["lessonDetails", data.lessonId] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        title?: string;
        content: string;
        videoTimestamp?: number;
      };
    }) => playerService.updateNote(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["lessonDetails"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => playerService.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["lessonDetails"] });
    },
  });
}

export function useUpdateVideoProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      lessonId: string;
      positionSeconds: number;
      durationSeconds: number;
    }) => playerService.updateVideoProgress(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lessonDetails", variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["courseStructure"] });
      queryClient.invalidateQueries({ queryKey: ["resumeLearning"] });
    },
  });
}

export function useUpdatePdfProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      lessonId: string;
      pageNumber: number;
      totalPages: number;
    }) => playerService.updatePdfProgress(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lessonDetails", variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["courseStructure"] });
      queryClient.invalidateQueries({ queryKey: ["resumeLearning"] });
    },
  });
}

export function useUpdateArticleProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      lessonId: string;
      completed: boolean;
    }) => playerService.updateArticleProgress(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lessonDetails", variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["courseStructure"] });
      queryClient.invalidateQueries({ queryKey: ["resumeLearning"] });
    },
  });
}

export function useTrackDownload() {
  return useMutation({
    mutationFn: (resourceId: string) => playerService.trackDownload(resourceId),
  });
}
