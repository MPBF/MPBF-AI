import { useQuery, useMutation } from "@tanstack/react-query";
import { KnowledgeCard } from "@/components/knowledge-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, X, Download } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { BusinessProcess } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { exportKnowledgeToJSON, exportKnowledgeToMarkdown } from "@/lib/export";

export default function KnowledgePage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<BusinessProcess | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProcess, setNewProcess] = useState({
    title: "",
    description: "",
    category: "",
    content: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  const { data: processes = [], isLoading } = useQuery<BusinessProcess[]>({
    queryKey: ["/api/knowledge"],
  });

  const filteredProcesses = processes.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createProcessMutation = useMutation({
    mutationFn: async (process: typeof newProcess) => {
      return await apiRequest("POST", "/api/knowledge", process);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] });
      setIsDialogOpen(false);
      setNewProcess({ title: "", description: "", category: "", content: "", tags: [] });
      toast({
        title: "نجاح",
        description: "تم إنشاء إدخال المعرفة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء إدخال المعرفة",
        variant: "destructive",
      });
    },
  });

  const deleteProcessMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/knowledge/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] });
      toast({
        title: "نجاح",
        description: "تم حذف إدخال المعرفة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف إدخال المعرفة",
        variant: "destructive",
      });
    },
  });

  const handleCreateProcess = () => {
    if (newProcess.title.trim() && newProcess.description.trim() && newProcess.category.trim() && newProcess.content.trim()) {
      createProcessMutation.mutate(newProcess);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newProcess.tags.includes(tagInput.trim())) {
      setNewProcess({ ...newProcess, tags: [...newProcess.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewProcess({ ...newProcess, tags: newProcess.tags.filter((t) => t !== tag) });
  };

  const handleViewProcess = (id: string) => {
    const process = processes.find((p) => p.id === id);
    if (process) {
      setSelectedProcess(process);
      setIsViewDialogOpen(true);
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
            <h1 className="text-4xl font-bold mb-2">قاعدة المعرفة</h1>
            <p className="text-muted-foreground">
              العمليات التجارية والوثائق
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-export-knowledge">
                  <Download className="w-4 h-4 ml-2" />
                  <span dir="rtl">تصدير</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportKnowledgeToJSON(processes)}>
                  <span dir="rtl">تصدير بصيغة JSON</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportKnowledgeToMarkdown(processes)}>
                  <span dir="rtl">تصدير بصيغة Markdown</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-knowledge">
                  <Plus className="w-4 h-4 ml-2" />
                  <span dir="rtl">إضافة معرفة</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة إدخال معرفة</DialogTitle>
                <DialogDescription>
                  توثيق عملية تجارية أو معلومات مهمة
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[500px] pr-4">
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">العنوان</Label>
                    <Input
                      id="title"
                      placeholder="عنوان العملية..."
                      value={newProcess.title}
                      onChange={(e) => setNewProcess({ ...newProcess, title: e.target.value })}
                      data-testid="input-knowledge-title"
                      dir="auto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Input
                      id="description"
                      placeholder="وصف مختصر..."
                      value={newProcess.description}
                      onChange={(e) => setNewProcess({ ...newProcess, description: e.target.value })}
                      data-testid="input-knowledge-description"
                      dir="auto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">الفئة</Label>
                    <Input
                      id="category"
                      placeholder="مثال: المبيعات، التسويق، العمليات..."
                      value={newProcess.category}
                      onChange={(e) => setNewProcess({ ...newProcess, category: e.target.value })}
                      data-testid="input-knowledge-category"
                      dir="auto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">المحتوى</Label>
                    <Textarea
                      id="content"
                      placeholder="توثيق العملية بالتفصيل..."
                      value={newProcess.content}
                      onChange={(e) => setNewProcess({ ...newProcess, content: e.target.value })}
                      rows={8}
                      data-testid="input-knowledge-content"
                      dir="auto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">الوسوم</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        placeholder="أضف وسماً..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        data-testid="input-knowledge-tag"
                        dir="auto"
                      />
                      <Button type="button" onClick={handleAddTag} variant="secondary">
                        إضافة
                      </Button>
                    </div>
                    {newProcess.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newProcess.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleCreateProcess}
                    disabled={
                      !newProcess.title.trim() ||
                      !newProcess.description.trim() ||
                      !newProcess.category.trim() ||
                      !newProcess.content.trim() ||
                      createProcessMutation.isPending
                    }
                    className="w-full"
                    data-testid="button-submit-knowledge"
                  >
                    {createProcessMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "إنشاء الإدخال"
                    )}
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mb-6" dir="rtl">
          <Input
            placeholder="البحث في قاعدة المعرفة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-knowledge"
            dir="auto"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProcesses.length === 0 ? (
            <div className="col-span-2 text-center py-12" dir="rtl">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">لا توجد إدخالات معرفة بعد</h3>
              <p className="text-muted-foreground mb-4">
                ابدأ بتوثيق عملياتك التجارية
              </p>
            </div>
          ) : (
            filteredProcesses.map((process) => (
              <KnowledgeCard
                key={process.id}
                process={process}
                onView={handleViewProcess}
                onDelete={(id) => deleteProcessMutation.mutate(id)}
              />
            ))
          )}
        </div>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]" dir="rtl">
            <DialogHeader>
              <DialogTitle dir="auto">{selectedProcess?.title}</DialogTitle>
              <DialogDescription dir="auto">{selectedProcess?.description}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="outline" dir="auto">{selectedProcess?.category}</Badge>
                  {selectedProcess?.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" dir="auto">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap" dir="auto">{selectedProcess?.content}</p>
                </div>
                <div className="text-xs text-muted-foreground pt-4 border-t">
                  آخر تحديث: {selectedProcess && new Date(selectedProcess.updatedAt).toLocaleString('ar-SA')}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
