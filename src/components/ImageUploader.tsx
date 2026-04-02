import { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, Trash2, Check, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getAllImages,
  saveImage,
  updateImage,
  deleteImage,
  type UploadedImage,
} from "@/lib/storage";

interface ImageUploaderProps {
  isSessionActive: boolean;
  currentSessionId: string | null;
}

export function ImageUploader({ isSessionActive, currentSessionId }: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [noteText, setNoteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllImages().then(setImages);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      const image: UploadedImage = {
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl,
        uploadedAt: Date.now(),
        sessionId: currentSessionId || undefined,
        reviewed: false,
        notes: "",
      };
      await saveImage(image);
    }
    const updated = await getAllImages();
    setImages(updated);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    await deleteImage(id);
    const updated = await getAllImages();
    setImages(updated);
    if (selectedImage?.id === id) setSelectedImage(null);
  };

  const handleMarkReviewed = async (image: UploadedImage) => {
    const updated = { ...image, reviewed: !image.reviewed };
    await updateImage(updated);
    setImages(await getAllImages());
    if (selectedImage?.id === image.id) setSelectedImage(updated);
  };

  const handleSaveNotes = async () => {
    if (!selectedImage) return;
    const updated = { ...selectedImage, notes: noteText };
    await updateImage(updated);
    setImages(await getAllImages());
    setSelectedImage(updated);
  };

  const handleSelectImage = (image: UploadedImage) => {
    setSelectedImage(image);
    setNoteText(image.notes);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-file-upload"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="w-full gap-2 border-dashed"
        data-testid="button-upload-image"
      >
        <Upload className="w-4 h-4" />
        Upload Images / Questions
      </Button>

      {isSessionActive && images.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <ImageIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Images uploaded. Review them after your session ends.
          </p>
        </div>
      )}

      {!isSessionActive && images.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => handleSelectImage(img)}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedImage?.id === img.id
                    ? "border-primary"
                    : "border-transparent hover:border-border"
                }`}
                data-testid={`img-thumbnail-${img.id}`}
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                {img.reviewed && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedImage && (
            <div className="border rounded-xl p-4 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1">{selectedImage.name}</span>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1 hover:bg-accent rounded text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <img
                src={selectedImage.dataUrl}
                alt={selectedImage.name}
                className="w-full rounded-lg max-h-48 object-contain bg-muted"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedImage.reviewed ? "default" : "outline"}
                  onClick={() => handleMarkReviewed(selectedImage)}
                  className="gap-1.5"
                  data-testid={`button-mark-reviewed-${selectedImage.id}`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {selectedImage.reviewed ? "Reviewed" : "Mark Reviewed"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(selectedImage.id)}
                  className="gap-1.5 text-destructive hover:text-destructive"
                  data-testid={`button-delete-image-${selectedImage.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  Notes
                </div>
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add notes about this question..."
                  className="min-h-[80px] text-sm"
                  data-testid={`textarea-notes-${selectedImage.id}`}
                />
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  className="w-full"
                  data-testid={`button-save-notes-${selectedImage.id}`}
                >
                  Save Notes
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {images.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-2">
          No images uploaded yet.
        </p>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
