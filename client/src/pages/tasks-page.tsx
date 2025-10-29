import { useQuery, useMutation } from "@tanstack/react-query";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import type { Task } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportTasksToJSON, exportTasksToCSV, exportTasksToMarkdown } from "@/lib/export";

export default function TasksPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "" });

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: { title: string; description: string }) => {
      return await apiRequest("POST", "/api/tasks", task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsDialogOpen(false);
      setNewTask({ title: "", description: "" });
      toast({
        title: "نجاح",
        description: "تم إنشاء المهمة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء المهمة",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث المهمة",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tasks/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "نجاح",
        description: "تم حذف المهمة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المهمة",
        variant: "destructive",
      });
    },
  });

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const handleCreateTask = () => {
    if (newTask.title.trim()) {
      createTaskMutation.mutate(newTask);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6" dir="rtl">
          <div>
            <h1 className="text-4xl font-bold mb-2">المهام</h1>
            <p className="text-muted-foreground">
              إدارة المهام وتتبع التقدم
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-export-tasks">
                  <Download className="w-4 h-4 ml-2" />
                  <span dir="rtl">تصدير</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportTasksToJSON(tasks)}>
                  <span dir="rtl">تصدير بصيغة JSON</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportTasksToCSV(tasks)}>
                  <span dir="rtl">تصدير بصيغة CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportTasksToMarkdown(tasks)}>
                  <span dir="rtl">تصدير بصيغة Markdown</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-task">
                  <Plus className="w-4 h-4 ml-2" />
                  <span dir="rtl">مهمة جديدة</span>
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إنشاء مهمة جديدة</DialogTitle>
                <DialogDescription>
                  أضف مهمة جديدة لتتبع عملك
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">العنوان</Label>
                  <Input
                    id="title"
                    placeholder="عنوان المهمة..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    data-testid="input-task-title"
                    dir="auto"
                  />
                </div>
                <div>
                  <Label htmlFor="description">الوصف (اختياري)</Label>
                  <Textarea
                    id="description"
                    placeholder="وصف المهمة..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                    data-testid="input-task-description"
                    dir="auto"
                  />
                </div>
                <Button
                  onClick={handleCreateTask}
                  disabled={!newTask.title.trim() || createTaskMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-task"
                >
                  {createTaskMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "إنشاء المهمة"
                  )}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full" dir="rtl">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-tasks">
              الكل ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending-tasks">
              قيد الانتظار ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress" data-testid="tab-inprogress-tasks">
              قيد التنفيذ ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed-tasks">
              مكتملة ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12" dir="rtl">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">لا توجد مهام بعد</h3>
                <p className="text-muted-foreground mb-4">
                  أنشئ مهمتك الأولى للبدء
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(id, status) => updateTaskMutation.mutate({ id, status })}
                  onDelete={(id) => deleteTaskMutation.mutate(id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-12" dir="rtl">
                <p className="text-muted-foreground">لا توجد مهام قيد الانتظار</p>
              </div>
            ) : (
              pendingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(id, status) => updateTaskMutation.mutate({ id, status })}
                  onDelete={(id) => deleteTaskMutation.mutate(id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="mt-6 space-y-4">
            {inProgressTasks.length === 0 ? (
              <div className="text-center py-12" dir="rtl">
                <p className="text-muted-foreground">لا توجد مهام قيد التنفيذ</p>
              </div>
            ) : (
              inProgressTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(id, status) => updateTaskMutation.mutate({ id, status })}
                  onDelete={(id) => deleteTaskMutation.mutate(id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6 space-y-4">
            {completedTasks.length === 0 ? (
              <div className="text-center py-12" dir="rtl">
                <p className="text-muted-foreground">لا توجد مهام مكتملة</p>
              </div>
            ) : (
              completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(id, status) => updateTaskMutation.mutate({ id, status })}
                  onDelete={(id) => deleteTaskMutation.mutate(id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
