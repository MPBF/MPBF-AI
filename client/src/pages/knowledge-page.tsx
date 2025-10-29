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
        title: "Success",
        description: "Knowledge entry created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create knowledge entry",
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
        title: "Success",
        description: "Knowledge entry deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete knowledge entry",
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Knowledge Base</h1>
            <p className="text-muted-foreground">
              Business processes and documentation
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-export-knowledge">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportKnowledgeToJSON(processes)}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportKnowledgeToMarkdown(processes)}>
                  Export as Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-knowledge">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Knowledge
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Knowledge Entry</DialogTitle>
                <DialogDescription>
                  Document a business process or important information
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[500px] pr-4">
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Process title..."
                      value={newProcess.title}
                      onChange={(e) => setNewProcess({ ...newProcess, title: e.target.value })}
                      data-testid="input-knowledge-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief description..."
                      value={newProcess.description}
                      onChange={(e) => setNewProcess({ ...newProcess, description: e.target.value })}
                      data-testid="input-knowledge-description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Sales, Marketing, Operations..."
                      value={newProcess.category}
                      onChange={(e) => setNewProcess({ ...newProcess, category: e.target.value })}
                      data-testid="input-knowledge-category"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Detailed process documentation..."
                      value={newProcess.content}
                      onChange={(e) => setNewProcess({ ...newProcess, content: e.target.value })}
                      rows={8}
                      data-testid="input-knowledge-content"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        data-testid="input-knowledge-tag"
                      />
                      <Button type="button" onClick={handleAddTag} variant="secondary">
                        Add
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
                      "Create Entry"
                    )}
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-knowledge"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProcesses.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No knowledge entries yet</h3>
              <p className="text-muted-foreground mb-4">
                Start documenting your business processes
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
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedProcess?.title}</DialogTitle>
              <DialogDescription>{selectedProcess?.description}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="outline">{selectedProcess?.category}</Badge>
                  {selectedProcess?.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{selectedProcess?.content}</p>
                </div>
                <div className="text-xs text-muted-foreground pt-4 border-t">
                  Last updated: {selectedProcess && new Date(selectedProcess.updatedAt).toLocaleString()}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
