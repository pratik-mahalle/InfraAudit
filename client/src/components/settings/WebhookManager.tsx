import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { useWebhooks, useCreateWebhook, useDeleteWebhook } from "@/hooks/use-notifications";
import { Plus, Trash2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function WebhookManager() {
    const { toast } = useToast();
    const { data: webhooks, isLoading } = useWebhooks();
    const { mutate: createWebhook } = useCreateWebhook();
    const { mutate: deleteWebhook } = useDeleteWebhook();
    const [isOpen, setIsOpen] = useState(false);

    const [newWebhook, setNewWebhook] = useState({
        name: '',
        url: '',
        events: ['alert', 'drift'] // simplified selection
    });

    const handleSubmit = () => {
        createWebhook(newWebhook, {
            onSuccess: () => {
                setIsOpen(false);
                toast({ title: "Webhook Created", description: "New webhook endpoint registered." });
                setNewWebhook({ name: '', url: '', events: ['alert', 'drift'] });
            },
            onError: () => toast({ title: "Error", description: "Failed to create webhook.", variant: "destructive" })
        });
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this webhook?")) {
            deleteWebhook(id, {
                onSuccess: () => toast({ title: "Deleted", description: "Webhook removed." })
            });
        }
    };

    if (isLoading) return <div>Loading webhooks...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Webhook
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Webhook</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    placeholder="My Webhook"
                                    value={newWebhook.name}
                                    onChange={e => setNewWebhook({ ...newWebhook, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Endpoint URL</Label>
                                <Input
                                    placeholder="https://api.example.com/hooks"
                                    value={newWebhook.url}
                                    onChange={e => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSubmit}>Create Webhook</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Events</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {webhooks && webhooks.length > 0 ? (
                            webhooks.map((hook: any) => (
                                <TableRow key={hook.id}>
                                    <TableCell className="font-medium">{hook.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{hook.url}</TableCell>
                                    <TableCell>{hook.events.join(', ')}</TableCell>
                                    <TableCell>
                                        <span className={`flex items-center gap-1 text-xs ${hook.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                                            <Activity className="w-3 h-3" />
                                            {hook.isEnabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(hook.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    No webhooks configured.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
