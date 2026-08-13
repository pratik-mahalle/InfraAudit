import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, Trash2, Edit, Download, Calendar } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Architecture {
  id: number;
  name: string;
  userId: number;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
}

interface SavedArchitecturesProps {
  setNodes: (nodes: any[]) => void;
  setEdges: (edges: any[]) => void;
  setArchitectureName: (name: string) => void;
}

export function SavedArchitectures({ setNodes, setEdges, setArchitectureName }: SavedArchitecturesProps) {
  const [architectures, setArchitectures] = useState<Architecture[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const fetchArchitectures = async () => {
      try {
        setLoading(true);
        
        setArchitectures([]);
      } catch (err: any) {
        setError(err.message || 'Failed to load saved architectures');
      } finally {
        setLoading(false);
      }
    };

    fetchArchitectures();
  }, []);

  const loadArchitecture = (architecture: Architecture) => {
    setNodes(architecture.nodes);
    setEdges(architecture.edges);
    setArchitectureName(architecture.name);
  };

  const deleteArchitecture = async (id: number) => {
    try {
      // In a real implementation, this would be an API call
      setArchitectures(architectures.filter(arch => arch.id !== id));
      setDeleteId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete architecture');
    }
  };

  const exportArchitecture = (architecture: Architecture) => {
    const dataStr = JSON.stringify({ 
      nodes: architecture.nodes, 
      edges: architecture.edges, 
      name: architecture.name 
    });
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${architecture.name.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Filter architectures based on search term
  const filteredArchitectures = architectures.filter(
    (architecture) => architecture.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p className="text-sm">Error: {error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => setError(null)}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search architectures..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredArchitectures.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No saved architectures found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArchitectures.map((architecture) => (
            <Card key={architecture.id} className="p-3 hover:bg-muted transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="font-medium">{architecture.name}</div>
                    <Badge variant="outline" className="ml-2 px-1 text-xs">
                      {architecture.nodes.length} nodes
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {formatDistanceToNow(new Date(architecture.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => loadArchitecture(architecture)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => exportArchitecture(architecture)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => setDeleteId(architecture.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Delete Architecture</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete "{architecture.name}"? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="justify-between sm:justify-end">
                        <DialogClose asChild>
                          <Button variant="outline" type="button">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button 
                          variant="destructive" 
                          onClick={() => deleteArchitecture(architecture.id)}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {architecture.nodes.slice(0, 3).map((node) => (
                  <Badge 
                    key={node.id} 
                    variant="secondary" 
                    className="text-xs px-1.5"
                  >
                    {node.data.type} - {node.data.label}
                  </Badge>
                ))}
                {architecture.nodes.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1.5">
                    +{architecture.nodes.length - 3} more
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedArchitectures;
