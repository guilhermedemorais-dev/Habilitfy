import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye } from "lucide-react";

export default function Admin() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Painel Administrativo</h1>
            <div className="flex gap-2">
                <Button variant="outline">Exportar Relatórios</Button>
            </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-lg">Instrutores Pendentes (3)</h2>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Aguardando Aprovação</Badge>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Credencial</TableHead>
                        <TableHead>Data Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3].map((i) => (
                        <TableRow key={i}>
                            <TableCell className="font-medium">João Candidato {i}</TableCell>
                            <TableCell>Chevrolet Onix 2024</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1 text-blue-600 text-xs cursor-pointer hover:underline">
                                    <Eye className="w-3 h-3" /> Ver documento
                                </div>
                            </TableCell>
                            <TableCell>Hoje, 10:3{i}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0 text-white rounded-full">
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8 w-8 p-0 rounded-full">
                                    <X className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-6 border-b border-gray-100">
                <h2 className="font-bold text-lg">Últimos Agendamentos</h2>
            </div>
            <Table>
                 <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Instrutor</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>#8921</TableCell>
                        <TableCell>Maria Silva</TableCell>
                        <TableCell>Carlos Instrutor</TableCell>
                        <TableCell>R$ 80,00</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-700 border-none shadow-none">Confirmado</Badge></TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell>#8920</TableCell>
                        <TableCell>Pedro Souza</TableCell>
                        <TableCell>Fernanda Costa</TableCell>
                        <TableCell>R$ 145,00</TableCell>
                        <TableCell><Badge className="bg-yellow-100 text-yellow-700 border-none shadow-none">Pendente Pix</Badge></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
