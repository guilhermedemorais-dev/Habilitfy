import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Trash2, Edit, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AdminUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    adminRole: 'master' | 'manager' | 'support';
    createdAt: string;
};

export function AdminUsersTable() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        adminRole: "support",
    });

    const { data: admins, isLoading } = useQuery<AdminUser[]>({
        queryKey: ["/api/admin/admins"],
        enabled: user?.adminRole === 'master',
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof newAdmin) => {
            const res = await apiRequest("POST", "/api/admin/admins", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
            setIsCreateOpen(false);
            setNewAdmin({ firstName: "", lastName: "", email: "", password: "", adminRole: "support" });
            toast({ title: "Admin criado com sucesso" });
        },
        onError: (error: any) => {
            toast({ title: "Erro ao criar admin", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/admin/admins/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
            toast({ title: "Admin removido" });
        },
        onError: (error: any) => {
            toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(newAdmin);
    };

    if (isLoading) return <Loader2 className="h-8 w-8 animate-spin" />;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Gestão de Acesso</h2>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Novo Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Administrador</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome</Label>
                                    <Input
                                        required
                                        value={newAdmin.firstName}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sobrenome</Label>
                                    <Input
                                        required
                                        value={newAdmin.lastName}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    required
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Senha Inicial</Label>
                                <Input
                                    type="password"
                                    required
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Permissão (Role)</Label>
                                <Select
                                    value={newAdmin.adminRole}
                                    onValueChange={(val) => setNewAdmin({ ...newAdmin, adminRole: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="master">Master</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="support">Support</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Criando..." : "Criar Admin"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {admins?.map((admin) => (
                            <TableRow key={admin.id}>
                                <TableCell>{admin.firstName} {admin.lastName}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>
                                    <Badge variant={admin.adminRole === 'master' ? "default" : "secondary"}>
                                        {admin.adminRole?.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    {admin.id !== user?.id && (
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm("Tem certeza que deseja remover este admin?")) {
                                                    deleteMutation.mutate(admin.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
