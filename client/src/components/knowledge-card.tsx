import { FileText, MoreVertical, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BusinessProcess } from "@shared/schema";

interface KnowledgeCardProps {
  process: BusinessProcess;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export function KnowledgeCard({ process, onView, onDelete }: KnowledgeCardProps) {
  return (
    <Card 
      className="p-6 hover-elevate cursor-pointer active-elevate-2" 
      onClick={() => onView(process.id)}
      data-testid={`knowledge-card-${process.id}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-1">{process.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {process.description}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {process.category}
            </Badge>
            {process.tags && process.tags.length > 0 && (
              <>
                {process.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {process.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{process.tags.length - 3} more
                  </span>
                )}
              </>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Updated {new Date(process.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" data-testid={`button-knowledge-menu-${process.id}`}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onView(process.id);
            }}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(process.id);
              }}
              className="text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
