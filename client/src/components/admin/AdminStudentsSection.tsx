import { useMemo } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminStudentRecord = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isBlocked?: boolean;
  createdAt?: string | null;
};

type AdminStudentsSectionProps = {
  students: AdminStudentRecord[];
  isUnauthorized: boolean;
  studentsLoading: boolean;
  studentsError: unknown;
  searchTerm: string;
  formatPersonName: (person?: AdminStudentRecord | null) => string;
  onReview: (userId?: string | null) => void;
};

export function AdminStudentsSection({
  students,
  isUnauthorized,
  studentsLoading,
  studentsError,
  searchTerm,
  formatPersonName,
  onReview,
}: AdminStudentsSectionProps) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredStudents = useMemo(() => {
    if (!normalizedSearch) return students;

    return students.filter((student) => {
      const fields = [student.firstName, student.lastName, student.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return fields.includes(normalizedSearch);
    });
  }, [normalizedSearch, students]);

  return (
    <section id="alunos" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-blue-100">
            Lista de alunos
          </h2>
          <p className="text-sm text-slate-500 dark:text-blue-400">
            Alunos cadastrados e ativos na plataforma.
          </p>
        </div>
        <Badge variant="outline" className="text-slate-500">
          {filteredStudents.length} de {students.length}
        </Badge>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="min-h-[120px]">
          {isUnauthorized ? (
            <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
              <AlertTriangle className="h-4 w-4" />
              Acesso restrito. Faça login como admin.
            </div>
          ) : studentsLoading ? (
            <div className="flex items-center gap-2 p-4 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando alunos...
            </div>
          ) : studentsError ? (
            <div className="flex items-center gap-2 p-4 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Erro ao carregar alunos: {(studentsError as Error).message}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">
              Nenhum aluno encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {formatPersonName(student)}
                    </TableCell>
                    <TableCell>{student.email || "—"}</TableCell>
                    <TableCell>
                      {student.isBlocked ? (
                        <Badge className="border-none shadow-none bg-red-100 text-red-700">
                          Banido
                        </Badge>
                      ) : (
                        <Badge className="border-none shadow-none bg-green-100 text-green-700">
                          Ativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.createdAt
                        ? new Date(student.createdAt).toLocaleDateString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-md px-3"
                        onClick={() => onReview(student.id)}
                      >
                        Revisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </section>
  );
}
