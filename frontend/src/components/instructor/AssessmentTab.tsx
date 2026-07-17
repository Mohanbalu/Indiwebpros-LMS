import { useState, useEffect } from "react";
import { 
  HelpCircle, ClipboardList, Plus, Trash2, Edit, Save, CheckCircle, 
  ChevronRight, Calendar, User, Download, Award, Check 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";

interface AssessmentTabProps {
  courseDetail: any;
  refetch: () => void;
}

export function AssessmentTab({ courseDetail, refetch }: AssessmentTabProps) {
  const [subTab, setSubTab] = useState<"quizzes" | "assignments">("quizzes");
  
  // Quiz states
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    instructions: "",
    timeLimitMinutes: 30,
    passingPercentage: 60,
    maxAttempts: 3,
  });

  const [activeQuizDetail, setActiveQuizDetail] = useState<any | null>(null);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    questionType: "MULTIPLE_CHOICE_SINGLE",
    explanation: "",
    marks: 1,
    options: [
      { text: "Option A", isCorrect: true },
      { text: "Option B", isCorrect: false },
      { text: "Option C", isCorrect: false },
      { text: "Option D", isCorrect: false },
    ],
  });

  // Assignment states
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    instructions: "",
    maxMarks: 100,
    dueDate: "",
  });

  // Selected Submission for grading
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({
    marks: 85,
    feedback: "",
    status: "GRADED",
  });

  // Fetch full quiz question details when a quiz is opened
  const handleSelectQuiz = async (quizId: string) => {
    try {
      const res = await api.get(`/quizzes/${quizId}`);
      setActiveQuizDetail(res.data.data);
    } catch (err) {
      console.error("Failed to load quiz questions:", err);
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuiz) {
        await api.put(`/quizzes/${editingQuiz.id}`, {
          ...quizForm,
          courseId: courseDetail.id,
        });
      } else {
        await api.post("/quizzes", {
          ...quizForm,
          courseId: courseDetail.id,
          status: "DRAFT",
          createdBy: courseDetail.instructorId || "",
        });
      }
      setIsCreatingQuiz(false);
      setEditingQuiz(null);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    try {
      await api.delete(`/quizzes/${id}`);
      refetch();
      if (activeQuizDetail?.id === id) setActiveQuizDetail(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Add quiz questions & options
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuizDetail) return;
    try {
      // 1. Create the question record
      const questionRes = await api.post(`/quizzes/${activeQuizDetail.id}/questions`, {
        question: questionForm.question,
        questionType: questionForm.questionType,
        explanation: questionForm.explanation,
        marks: questionForm.marks,
      });

      const questionId = questionRes.data.data.id;

      // 2. Add options sequentially
      if (questionForm.questionType === "MULTIPLE_CHOICE_SINGLE" || questionForm.questionType === "MULTIPLE_CHOICE_MULTIPLE") {
        for (let i = 0; i < questionForm.options.length; i++) {
          const opt = questionForm.options[i];
          if (opt.text.trim()) {
            await api.post(`/quizzes/questions/${questionId}/options`, {
              text: opt.text,
              isCorrect: opt.isCorrect,
              sortOrder: i,
            });
          }
        }
      } else if (questionForm.questionType === "TRUE_FALSE") {
        // True/False options
        await api.post(`/quizzes/questions/${questionId}/options`, {
          text: "True",
          isCorrect: questionForm.options[0].isCorrect,
          sortOrder: 0,
        });
        await api.post(`/quizzes/questions/${questionId}/options`, {
          text: "False",
          isCorrect: !questionForm.options[0].isCorrect,
          sortOrder: 1,
        });
      }

      setIsCreatingQuestion(false);
      setQuestionForm({
        question: "",
        questionType: "MULTIPLE_CHOICE_SINGLE",
        explanation: "",
        marks: 1,
        options: [
          { text: "Option A", isCorrect: true },
          { text: "Option B", isCorrect: false },
          { text: "Option C", isCorrect: false },
          { text: "Option D", isCorrect: false },
        ],
      });
      // Refresh active quiz questions
      handleSelectQuiz(activeQuizDetail.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!activeQuizDetail) return;
    try {
      await api.delete(`/quizzes/questions/${qId}`);
      handleSelectQuiz(activeQuizDetail.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Assignments operations
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await api.put(`/assignments/${editingAssignment.id}`, {
          ...assignmentForm,
          courseId: courseDetail.id,
        });
      } else {
        await api.post("/assignments", {
          ...assignmentForm,
          courseId: courseDetail.id,
          status: "DRAFT",
        });
      }
      setIsCreatingAssignment(false);
      setEditingAssignment(null);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await api.delete(`/assignments/${id}`);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Submission grading operations
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmissionId) return;
    try {
      await api.post(`/assignments/submissions/${activeSubmissionId}/grade`, {
        marks: Number(gradeForm.marks),
        feedback: gradeForm.feedback,
        status: gradeForm.status,
      });
      setActiveSubmissionId(null);
      setGradeForm({ marks: 85, feedback: "", status: "GRADED" });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Sub tabs switcher */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => { setSubTab("quizzes"); setActiveQuizDetail(null); }}
          className={`pb-1 text-xs font-black uppercase tracking-wider transition ${
            subTab === "quizzes" 
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" 
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          Quizzes & Tests
        </button>
        <button
          onClick={() => { setSubTab("assignments"); }}
          className={`pb-1 text-xs font-black uppercase tracking-wider transition ${
            subTab === "assignments" 
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" 
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          Practical Assignments
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          QUIZZES SECTION
          ─────────────────────────────────────────────────────────────────────── */}
      {subTab === "quizzes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left / Middle: Quizzes List & Forms */}
          <div className="lg:col-span-2 space-y-6">
            {isCreatingQuiz || editingQuiz ? (
              /* Quiz creation form */
              <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                    {editingQuiz ? "Edit Quiz details" : "Create new course quiz"}
                  </h4>
                  <button onClick={() => { setIsCreatingQuiz(false); setEditingQuiz(null); }} className="text-xs text-zinc-400 font-bold hover:underline">
                    Cancel
                  </button>
                </div>
                
                <form onSubmit={handleSaveQuiz} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Quiz Title</label>
                    <input 
                      type="text" 
                      value={quizForm.title}
                      onChange={(e) => setQuizForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Description</label>
                    <textarea 
                      value={quizForm.description}
                      onChange={(e) => setQuizForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Time limit (mins)</label>
                      <input 
                        type="number" 
                        value={quizForm.timeLimitMinutes}
                        onChange={(e) => setQuizForm((prev) => ({ ...prev, timeLimitMinutes: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Passing Score (%)</label>
                      <input 
                        type="number" 
                        value={quizForm.passingPercentage}
                        onChange={(e) => setQuizForm((prev) => ({ ...prev, passingPercentage: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Max attempts</label>
                      <input 
                        type="number" 
                        value={quizForm.maxAttempts}
                        onChange={(e) => setQuizForm((prev) => ({ ...prev, maxAttempts: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-2">
                    <Save className="h-4 w-4 mr-2" /> Save Quiz
                  </Button>
                </form>
              </div>
            ) : activeQuizDetail ? (
              /* Quiz Question Builder */
              <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-850 pb-3">
                  <div>
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Question Workspace</span>
                    <h4 className="text-base font-black text-zinc-900 dark:text-white leading-tight">{activeQuizDetail.title}</h4>
                  </div>
                  <button onClick={() => setActiveQuizDetail(null)} className="text-xs text-zinc-400 font-bold hover:underline">
                    Back to Quizzes
                  </button>
                </div>

                {/* Questions timeline */}
                <div className="space-y-4">
                  {activeQuizDetail.questions?.map((q: any, qIdx: number) => (
                    <div key={q.id} className="p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          Q{qIdx + 1}. {q.question}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{q.marks} pts</span>
                          <button onClick={() => handleDeleteQuestion(q.id)} className="text-rose-500 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Options listing */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options?.map((opt: any) => (
                          <div key={opt.id} className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                            opt.isCorrect 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black" 
                              : "bg-white dark:bg-zinc-900 border-zinc-150 dark:border-zinc-850"
                          }`}>
                            {opt.isCorrect && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Add Question form */}
                  {isCreatingQuestion ? (
                    <form onSubmit={handleSaveQuestion} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Add New Question</span>
                      
                      <div>
                        <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Question Type</label>
                        <select
                          value={questionForm.questionType}
                          onChange={(e) => setQuestionForm((prev) => ({ ...prev, questionType: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                        >
                          <option value="MULTIPLE_CHOICE_SINGLE">Multiple Choice (Single Option)</option>
                          <option value="TRUE_FALSE">True / False</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Question Text</label>
                        <input
                          type="text"
                          value={questionForm.question}
                          onChange={(e) => setQuestionForm((prev) => ({ ...prev, question: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                          required
                        />
                      </div>

                      {/* Options manager for MCQ */}
                      {questionForm.questionType === "MULTIPLE_CHOICE_SINGLE" && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase block">Answers Options</label>
                          {questionForm.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                name="mcq-correct" 
                                checked={opt.isCorrect}
                                onChange={() => {
                                  const updated = questionForm.options.map((o, oIdx) => ({
                                    ...o,
                                    isCorrect: oIdx === idx
                                  }));
                                  setQuestionForm((prev) => ({ ...prev, options: updated }));
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300"
                              />
                              <input 
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const updated = [...questionForm.options];
                                  updated[idx].text = e.target.value;
                                  setQuestionForm((prev) => ({ ...prev, options: updated }));
                                }}
                                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                                required
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Options manager for True False */}
                      {questionForm.questionType === "TRUE_FALSE" && (
                        <div className="flex gap-4 py-2">
                          <label className="flex items-center gap-1.5 text-xs font-bold select-none cursor-pointer">
                            <input 
                              type="radio" 
                              name="tf-correct"
                              checked={questionForm.options[0].isCorrect}
                              onChange={() => {
                                const updated = [...questionForm.options];
                                updated[0].isCorrect = true;
                                setQuestionForm((prev) => ({ ...prev, options: updated }));
                              }}
                              className="h-4 w-4 text-blue-600"
                            />
                            True is Correct
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-bold select-none cursor-pointer">
                            <input 
                              type="radio" 
                              name="tf-correct"
                              checked={!questionForm.options[0].isCorrect}
                              onChange={() => {
                                const updated = [...questionForm.options];
                                updated[0].isCorrect = false;
                                setQuestionForm((prev) => ({ ...prev, options: updated }));
                              }}
                              className="h-4 w-4 text-blue-600"
                            />
                            False is Correct
                          </label>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        <Button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">
                          Save Question
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreatingQuestion(false)}
                          className="flex-1 py-2.5 text-xs font-bold rounded-xl"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button 
                      onClick={() => setIsCreatingQuestion(true)}
                      className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-550 hover:bg-zinc-50 dark:hover:bg-zinc-950 font-bold rounded-2xl flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" /> Add Question to Quiz
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* Default Quizzes list */
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">Pathway Quizzes</h4>
                  <Button 
                    onClick={() => {
                      setQuizForm({ title: "", description: "", instructions: "", timeLimitMinutes: 30, passingPercentage: 60, maxAttempts: 3 });
                      setIsCreatingQuiz(true);
                    }}
                    className="py-1.5 px-3 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Quiz
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(courseDetail.quizzes || []).map((quiz: any) => (
                    <div key={quiz.id} className="p-4 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between h-40">
                      <div>
                        <div className="flex justify-between items-start gap-3">
                          <span className="text-xs font-black text-zinc-900 dark:text-white block line-clamp-1">{quiz.title}</span>
                          <span className="text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full font-bold uppercase">
                            {quiz.attemptsCount || 0} attempts
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium mt-1 line-clamp-2">{quiz.description || "No description configured"}</p>
                      </div>

                      <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                        <button 
                          onClick={() => handleSelectQuiz(quiz.id)}
                          className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Questions <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setQuizForm({
                                title: quiz.title,
                                description: quiz.description || "",
                                instructions: quiz.instructions || "",
                                timeLimitMinutes: quiz.timeLimitMinutes,
                                passingPercentage: quiz.passingPercentage,
                                maxAttempts: quiz.maxAttempts,
                              });
                              setEditingQuiz(quiz);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-1.5 text-rose-500 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: Quiz analytics metadata */}
          <div className="space-y-6">
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider block">Quiz Guidelines</h3>
              <ul className="text-[11px] text-zinc-550 dark:text-zinc-450 space-y-2.5 font-bold">
                <li>• Quizzes start in Draft state and must be published to be visible.</li>
                <li>• Students will be graded automatically based on correct choices.</li>
                <li>• MCQ correct answer marks are aggregated to calculate final attempt score.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          ASSIGNMENTS SECTION
          ─────────────────────────────────────────────────────────────────────── */}
      {subTab === "assignments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Assignments listing / creator forms */}
          <div className="lg:col-span-2 space-y-6">
            {isCreatingAssignment || editingAssignment ? (
              /* Assignment form */
              <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                    {editingAssignment ? "Edit Assignment details" : "Create Course Assignment"}
                  </h4>
                  <button onClick={() => { setIsCreatingAssignment(false); setEditingAssignment(null); }} className="text-xs text-zinc-400 font-bold hover:underline">
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveAssignment} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Assignment Title</label>
                    <input 
                      type="text" 
                      value={assignmentForm.title}
                      onChange={(e) => setAssignmentForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Description</label>
                    <textarea 
                      value={assignmentForm.description}
                      onChange={(e) => setAssignmentForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Max Score Marks</label>
                      <input 
                        type="number" 
                        value={assignmentForm.maxMarks}
                        onChange={(e) => setForm((prev: any) => ({ ...prev, maxMarks: Number(e.target.value) }))}
                        className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Due Date</label>
                      <input 
                        type="date" 
                        value={assignmentForm.dueDate}
                        onChange={(e) => setAssignmentForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl mt-2">
                    <Save className="h-4 w-4 mr-2" /> Save Assignment
                  </Button>
                </form>
              </div>
            ) : activeSubmissionId ? (
              /* Grading/Review Submission form */
              <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-850 pb-3">
                  <h4 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">Review student submission</h4>
                  <button onClick={() => setActiveSubmissionId(null)} className="text-xs text-zinc-400 font-bold hover:underline">
                    Back
                  </button>
                </div>

                <form onSubmit={handleGradeSubmission} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Awarded Marks / Score</label>
                    <input 
                      type="number" 
                      value={gradeForm.marks}
                      onChange={(e) => setGradeForm((prev) => ({ ...prev, marks: Number(e.target.value) }))}
                      className="w-full mt-1 px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Review Feedback</label>
                    <textarea 
                      value={gradeForm.feedback}
                      onChange={(e) => setGradeForm((prev) => ({ ...prev, feedback: e.target.value }))}
                      className="w-full mt-1 px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      rows={3}
                      placeholder="Provide constructive feedback..."
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl">
                    Submit Grade & Feedback
                  </Button>
                </form>
              </div>
            ) : (
              /* Assignments listing */
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-wider">Course Assignments</h4>
                  <Button 
                    onClick={() => {
                      setAssignmentForm({ title: "", description: "", instructions: "", maxMarks: 100, dueDate: "" });
                      setIsCreatingAssignment(true);
                    }}
                    className="py-1.5 px-3 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Assignment
                  </Button>
                </div>

                <div className="space-y-3">
                  {(courseDetail.assignments || []).map((asg: any) => (
                    <div key={asg.id} className="p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-xs font-black text-zinc-900 dark:text-white block">{asg.title}</span>
                          <p className="text-[10px] text-zinc-400 font-medium mt-1">{asg.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => {
                              setAssignmentForm({
                                title: asg.title,
                                description: asg.description,
                                instructions: asg.instructions || "",
                                maxMarks: asg.maxMarks,
                                dueDate: asg.dueDate ? new Date(asg.dueDate).toISOString().split("T")[0] : "",
                              });
                              setEditingAssignment(asg);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 border border-zinc-100 rounded-xl"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteAssignment(asg.id)} className="p-1.5 text-rose-500 hover:text-rose-600 border border-rose-100 rounded-xl">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-zinc-450 border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                        <span className="flex items-center gap-1 font-bold">
                          <Calendar className="h-3.5 w-3.5" /> Due: {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : "No deadline"}
                        </span>
                        <span className="font-extrabold uppercase bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                          Max Marks: {asg.maxMarks}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: submissions grading inbox */}
          <div className="space-y-6">
            <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider block">Submission Inbox</h3>
              
              <div className="space-y-2">
                {/* List student submissions related to assignments of this course */}
                {(courseDetail.submissions || []).length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 text-xs font-bold">
                    No submissions uploaded
                  </div>
                ) : (
                  courseDetail.submissions.map((sub: any) => (
                    <div key={sub.id} className="p-3 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-xs font-bold">
                      <div>
                        <span className="block text-zinc-900 dark:text-white truncate max-w-[120px]">{sub.studentName}</span>
                        <span className="text-[9px] text-zinc-400 font-medium block mt-0.5">{sub.assignmentTitle}</span>
                      </div>
                      
                      {sub.status === "GRADED" ? (
                        <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {sub.marks} / 100
                        </span>
                      ) : (
                        <button 
                          onClick={() => {
                            setActiveSubmissionId(sub.id);
                            setGradeForm({ marks: sub.marks || 85, feedback: "", status: "GRADED" });
                          }}
                          className="text-[9px] font-black uppercase text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-xl"
                        >
                          Grade
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
