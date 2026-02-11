
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGlobalAlert } from "@/components/ui/GlobalAlert";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

const pixSchema = z.object({
    pixKey: z.string().min(5, "Chave Pix inválida").max(100, "Chave Pix muito longa"),
    pixType: z.enum(["cpf", "cnpj", "email", "phone", "random"]).default("cpf"), // Simplificado, pode ser expandido
});

type PixFormValues = z.infer<typeof pixSchema>;

export function PixConfigModal({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const { showAlert } = useGlobalAlert();
    const queryClient = useQueryClient();

    const form = useForm<PixFormValues>({
        resolver: zodResolver(pixSchema),
        defaultValues: {
            pixKey: "",
            pixType: "cpf",
        },
    });

    const onSubmit = async (data: PixFormValues) => {
        try {
            // Mock API call - in reality check schema.ts for endpoint
            await apiRequest("PATCH", "/api/instructors/me", { pixKey: data.pixKey });

            showAlert("success", "Chave Pix salva!", "Sua chave Pix foi atualizada com sucesso.");
            queryClient.invalidateQueries({ queryKey: ["/api/instructors/me"] });
            setOpen(false);
        } catch (error: any) {
            showAlert("error", "Erro ao salvar", error.message || "Tente novamente mais tarde.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Configurar Pix</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configurar Chave Pix</DialogTitle>
                    <DialogDescription>
                        Receba seus pagamentos diretamente em sua conta via Pix.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="pixKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Chave Pix</FormLabel>
                                    <FormControl>
                                        <Input placeholder="CPF, Email, ou Chave Aleatória" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Poderíamos adicionar um select para o tipo de chave aqui */}

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Salvando..." : "Salvar Chave Pix"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
