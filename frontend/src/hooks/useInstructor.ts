import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { instructorService } from "@/services/instructor.service";

export function useInstructorDashboard() {
  return useQuery({
    queryKey: ["instructorDashboard"],
    queryFn: async () => {
      const res = await instructorService.getDashboard();
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useInstructorCourses() {
  return useQuery({
    queryKey: ["instructorCourses"],
    queryFn: async () => {
      const res = await instructorService.getCourses();
      return res.data.data;
    },
  });
}

export function useInstructorCourseDetails(courseId: string) {
  return useQuery({
    queryKey: ["instructorCourse", courseId],
    queryFn: async () => {
      const res = await instructorService.getCourseDetails(courseId);
      return res.data.data;
    },
    enabled: !!courseId,
  });
}

export function useInstructorStudents() {
  return useQuery({
    queryKey: ["instructorStudents"],
    queryFn: async () => {
      const res = await instructorService.getStudents();
      return res.data.data;
    },
  });
}

export function useInstructorAssignments() {
  return useQuery({
    queryKey: ["instructorAssignments"],
    queryFn: async () => {
      const res = await instructorService.getAssignments();
      return res.data.data;
    },
  });
}

export function useInstructorQuizzes() {
  return useQuery({
    queryKey: ["instructorQuizzes"],
    queryFn: async () => {
      const res = await instructorService.getQuizzes();
      return res.data.data;
    },
  });
}

export function useInstructorCertificates() {
  return useQuery({
    queryKey: ["instructorCertificates"],
    queryFn: async () => {
      const res = await instructorService.getCertificates();
      return res.data.data;
    },
  });
}

export function useInstructorAnalytics() {
  return useQuery({
    queryKey: ["instructorAnalytics"],
    queryFn: async () => {
      const res = await instructorService.getAnalytics();
      return res.data.data;
    },
  });
}

// Mutations
export function useCreateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => instructorService.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructorCourses"] });
    },
  });
}

export function useUpdateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => instructorService.updateCourse(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["instructorCourses"] });
      queryClient.invalidateQueries({ queryKey: ["instructorCourse", variables.id] });
    },
  });
}

export function usePublishCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instructorService.publishCourse(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["instructorCourses"] });
      queryClient.invalidateQueries({ queryKey: ["instructorCourse", id] });
    },
  });
}

export function useArchiveCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instructorService.archiveCourse(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["instructorCourses"] });
      queryClient.invalidateQueries({ queryKey: ["instructorCourse", id] });
    },
  });
}

export function useDuplicateCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instructorService.duplicateCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructorCourses"] });
    },
  });
}

export function useDeleteCourseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instructorService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructorCourses"] });
    },
  });
}

export function useReviewSubmissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, score, status, feedback }: { submissionId: string; score: number; status: string; feedback: string }) =>
      instructorService.reviewSubmission(submissionId, score, status, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructorAssignments"] });
    },
  });
}
