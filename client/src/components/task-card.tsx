import { Check, MoreVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "@shared/schema";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const isPending = task.status === "pending";

  const handleCheckChange = () => {
    onStatusChange(task.id, isCompleted ? "pending" : "completed");
  };

  return (
    <Card className="p-4 hover-elevate" data-testid={`task-card-${task.id}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCheckChange}
          className="mt-1"
          data-testid={`checkbox-task-${task.id}`}
        />
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "text-base font-medium mb-1",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {isPending && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
            {task.status === "in_progress" && (
              <Badge variant="default" className="text-xs">
                In Progress
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                <Check className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-task-menu-${task.id}`}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isPending && (
              <DropdownMenuItem onClick={() => onStatusChange(task.id, "in_progress")}>
                Mark In Progress
              </DropdownMenuItem>
            )}
            {task.status === "in_progress" && (
              <DropdownMenuItem onClick={() => onStatusChange(task.id, "completed")}>
                Mark Completed
              </DropdownMenuItem>
            )}
            {isCompleted && (
              <DropdownMenuItem onClick={() => onStatusChange(task.id, "pending")}>
                Reopen Task
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => onDelete(task.id)}
              className="text-destructive"
            >
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
