import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicForm } from '@/components/logbook/DynamicForm';
import { LogbookSchema, LogbookEntry } from '@/types/logbook-config';
import { getAllSchemas, deleteSchema } from '@/lib/schema-storage';
import { logbookAPI } from '@/lib/api';
import { Plus, FileText, Thermometer, Wind, Filter, Grid3X3, Trash2, MoreVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  utility: Thermometer,
  validation: Wind,
  maintenance: Grid3X3,
  quality: Filter,
};

const categoryColors: Record<string, string> = {
  utility: 'bg-blue-500',
  validation: 'bg-teal-500',
  maintenance: 'bg-orange-500',
  quality: 'bg-purple-500',
};

export default function LogbooksPage() {
  const { user } = useAuth();
  const [schemas, setSchemas] = useState<LogbookSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<LogbookSchema | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [schemaToDelete, setSchemaToDelete] = useState<LogbookSchema | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch schemas from API
  const fetchSchemas = async () => {
    try {
      setIsLoading(true);
      const data = await logbookAPI.list();
      // Transform backend data to frontend format
      const transformedSchemas: LogbookSchema[] = data.map((schema: any) => ({
        id: schema.id,
        name: schema.name,
        description: schema.description,
        clientId: schema.client_id,
        category: schema.category,
        fields: schema.fields || [],
        workflow: schema.workflow || {},
        display: schema.display || {},
        metadata: schema.metadata || {},
        createdAt: schema.created_at ? new Date(schema.created_at) : new Date(),
        updatedAt: schema.updated_at ? new Date(schema.updated_at) : new Date(),
      }));
      setSchemas(transformedSchemas);
    } catch (error: any) {
      console.error('Failed to load logbooks:', error);
      toast.error('Failed to load logbooks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemas();
    
    // Listen for logbook saved event to refresh
    const handleLogbookSaved = () => {
      fetchSchemas();
    };
    
    // Refresh when page becomes visible (user navigates back to this tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSchemas();
      }
    };
    
    window.addEventListener('logbookSaved', handleLogbookSaved);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('logbookSaved', handleLogbookSaved);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleCreateEntry = (schemaId: string, data: Record<string, any>) => {
    const newEntry: LogbookEntry = {
      id: `entry-${Date.now()}`,
      schemaId,
      clientId: 'svu-enterprises',
      data,
      operatorId: user?.id || 'unknown',
      operatorName: user?.name || 'Unknown',
      timestamp: new Date(),
      status: 'draft',
    };

    setEntries([newEntry, ...entries]);
    setIsDialogOpen(false);
    setSelectedSchema(null);
    toast.success('Logbook entry created successfully');
  };

  const handleSchemaSelect = (schema: LogbookSchema) => {
    setSelectedSchema(schema);
    setIsDialogOpen(true);
  };

  const getEntriesForSchema = (schemaId: string) => {
    return entries.filter(entry => entry.schemaId === schemaId);
  };

  const handleDeleteSchema = (schema: LogbookSchema, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setSchemaToDelete(schema);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (schemaToDelete) {
      try {
        await logbookAPI.delete(schemaToDelete.id);
        // Remove from local state
        setSchemas(schemas.filter(s => s.id !== schemaToDelete.id));
        // Also remove entries for this schema
        setEntries(entries.filter(entry => entry.schemaId !== schemaToDelete.id));
        toast.success('Logbook deleted successfully');
        setIsDeleteDialogOpen(false);
        setSchemaToDelete(null);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.detail || 
                            error?.response?.data?.error || 
                            'Failed to delete logbook';
        toast.error(errorMessage);
      }
    }
  };

  const isCustomSchema = (schemaId: string) => {
    // All schemas from backend are considered custom (created by managers)
    return true;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header
          title="Logbooks"
          subtitle="Create and manage logbook entries"
        />
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading logbooks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Logbooks"
        subtitle="Create and manage logbook entries"
      />

      <div className="p-6 space-y-6">
        {/* Schema Selection Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Logbooks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schemas.map(schema => {
              const Icon = categoryIcons[schema.category] || FileText;
              const entryCount = getEntriesForSchema(schema.id).length;

              const isCustom = isCustomSchema(schema.id);

              return (
                <div
                  key={schema.id}
                  className={cn(
                    'bg-card rounded-lg border p-6 cursor-pointer hover:shadow-md transition-all relative group',
                    selectedSchema?.id === schema.id && 'ring-2 ring-accent'
                  )}
                  onClick={() => handleSchemaSelect(schema)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      categoryColors[schema.category] || 'bg-muted'
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{entryCount} entries</Badge>
                      {/* Delete button - only for managers and super admins */}
                      {isCustom && (user?.role === 'super_admin' || user?.role === 'manager') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => handleDeleteSchema(schema, e)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Logbook
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-1">{schema.name}</h3>
                  {schema.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {schema.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="accent" className="text-xs">
                      {schema.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {schema.fields.length} fields
                    </span>
                    {isCustom && (
                      <Badge variant="secondary" className="text-xs">
                        Custom
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Entry Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Entry: {selectedSchema?.name}</DialogTitle>
            </DialogHeader>
            {selectedSchema && (
              <DynamicForm
                schema={selectedSchema}
                onSubmit={(data) => handleCreateEntry(selectedSchema.id, data)}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setSelectedSchema(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Entries</h2>
            <div className="bg-card rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Logbook
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Operator
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entries.slice(0, 10).map(entry => {
                      const schema = schemas.find(s => s.id === entry.schemaId);
                      return (
                        <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {schema?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {entry.id}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-foreground">{entry.operatorName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {format(entry.timestamp, 'dd/MM/yyyy HH:mm')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                entry.status === 'approved'
                                  ? 'success'
                                  : entry.status === 'rejected'
                                  ? 'danger'
                                  : 'pending'
                              }
                            >
                              {entry.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Logbook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{schemaToDelete?.name}"? This action cannot be undone.
              {schemaToDelete && getEntriesForSchema(schemaToDelete.id).length > 0 && (
                <span className="block mt-2 text-warning">
                  Warning: This logbook has {getEntriesForSchema(schemaToDelete.id).length} entry/entries that will also be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSchemaToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

