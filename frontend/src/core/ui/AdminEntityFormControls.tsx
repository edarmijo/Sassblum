import { ImagePlus, Loader2, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card'

interface AdminImagePickerProps {
  idPrefix: string
  urlValue: string
  onUrlChange: (value: string) => void
  fileLabel: string
  filePlaceholder: string
  fileName?: string
  onFileChange: (file: File | null) => void
}

export function AdminImagePicker({
  idPrefix, urlValue, onUrlChange, fileLabel, filePlaceholder, fileName, onFileChange,
}: Readonly<AdminImagePickerProps>) {
  const urlId = `${idPrefix}-url`
  const fileId = `${idPrefix}-img`
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={urlId}>URL de imagen</Label>
        <Input id={urlId} value={urlValue} onChange={(e) => onUrlChange(e.target.value)} placeholder="https://…" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fileId}>{fileLabel}</Label>
        <label htmlFor={fileId} className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 hover:border-brand-cyan">
          <ImagePlus className="h-4 w-4 text-brand-cyan" />
          {fileName ?? filePlaceholder}
        </label>
        <input id={fileId} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
      </div>
    </>
  )
}

interface AdminFormActionsProps {
  submitting: boolean
  submitContent: ReactNode
  isEditing: boolean
  onCancel: () => void
}

export function AdminFormActions({ submitting, submitContent, isEditing, onCancel }: Readonly<AdminFormActionsProps>) {
  return (
    <div className="flex gap-2">
      <Button type="submit" disabled={submitting} className="flex-1 bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitContent}
      </Button>
      {isEditing && (
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      )}
    </div>
  )
}

interface AdminFormCardProps {
  isEditing: boolean
  editTitle: string
  createTitle: string
  editDescription: string
  createDescription: string
  onCancel: () => void
  onSubmit: (e: React.FormEvent) => void
  children: ReactNode
}

export function AdminFormCard({
  isEditing, editTitle, createTitle, editDescription, createDescription, onCancel, onSubmit, children,
}: Readonly<AdminFormCardProps>) {
  return (
    <Card className="lg:col-span-1 h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{isEditing ? editTitle : createTitle}</CardTitle>
            <CardDescription>{isEditing ? editDescription : createDescription}</CardDescription>
          </div>
          {isEditing && (
            <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Cancelar edición">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
        </form>
      </CardContent>
    </Card>
  )
}

interface AdminEntityLayoutProps {
  formCard: ReactNode
  listArea: ReactNode
}

export function AdminEntityLayout({ formCard, listArea }: Readonly<AdminEntityLayoutProps>) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {formCard}
      <div className="lg:col-span-2">{listArea}</div>
    </div>
  )
}
