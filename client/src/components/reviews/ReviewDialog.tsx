import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview } from "@/hooks/useReviews";

interface ReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    instructorId: string;
    instructorName: string;
    bookingId: string;
}

export function ReviewDialog({
    open,
    onOpenChange,
    instructorId,
    instructorName,
    bookingId,
}: ReviewDialogProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const createReview = useCreateReview();

    const handleSubmit = () => {
        if (rating === 0) {
            return;
        }

        createReview.mutate(
            {
                instructorId,
                bookingId,
                rating,
                comment,
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    setRating(0);
                    setComment("");
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Avaliar Instrutor</DialogTitle>
                    <DialogDescription>
                        Como foi sua experiência com {instructorName}?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Star Rating */}
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-sm font-medium text-slate-700">
                            Sua avaliação
                        </p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                                >
                                    <Star
                                        className={`w-10 h-10 ${star <= (hoveredRating || rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p className="text-sm text-slate-500">
                                {rating === 1 && "Muito ruim"}
                                {rating === 2 && "Ruim"}
                                {rating === 3 && "Regular"}
                                {rating === 4 && "Bom"}
                                {rating === 5 && "Excelente"}
                            </p>
                        )}
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <label
                            htmlFor="comment"
                            className="text-sm font-medium text-slate-700"
                        >
                            Comentário (opcional)
                        </label>
                        <Textarea
                            id="comment"
                            placeholder="Conte-nos mais sobre sua experiência..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                            disabled={createReview.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 bg-primary hover:bg-green-700"
                            disabled={rating === 0 || createReview.isPending}
                        >
                            {createReview.isPending ? "Enviando..." : "Enviar Avaliação"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
