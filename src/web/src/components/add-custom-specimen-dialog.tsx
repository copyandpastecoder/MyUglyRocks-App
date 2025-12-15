'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateUserSpecimen } from '@/hooks/use-user-specimens';
import type { CreateUserSpecimenRequest } from '@/types/user-specimen';

const materialTypes = ['Rock', 'Mineral', 'Glass', 'Fossil', 'Other'];
const difficulties = ['Easy', 'Medium', 'Hard'];

const specimenSchema = z.object({
  commonName: z.string().min(1, 'Name is required').max(100),
  scientificName: z.string().max(100).optional().nullable(),
  alias: z.string().max(255).optional().nullable(),
  rockFamily: z.string().max(100).optional().nullable(),
  species: z.string().max(100).optional().nullable(),
  variety: z.string().max(100).optional().nullable(),
  materialType: z.string().default('Rock'),
  mohsHardnessMin: z.number().min(1).max(10).optional().nullable(),
  mohsHardnessMax: z.number().min(1).max(10).optional().nullable(),
  tumblingDifficulty: z.string().optional().nullable(),
  recommendedGritSequence: z.string().max(255).optional().nullable(),
  specialConsiderations: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
});

type SpecimenFormData = z.infer<typeof specimenSchema>;

// Data passed to onSuccess callback
export interface CustomSpecimenCreatedData {
  userSpecimenId: string;
  commonName: string;
  scientificName: string | null;
  tumblingDifficulty: string | null;
  materialType: string;
}

interface AddCustomSpecimenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: CustomSpecimenCreatedData) => void;
  initialName?: string;
}

export function AddCustomSpecimenDialog({
  open,
  onOpenChange,
  onSuccess,
  initialName,
}: AddCustomSpecimenDialogProps) {
  const createMutation = useCreateUserSpecimen();

  const form = useForm<SpecimenFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type inference limitation
    resolver: zodResolver(specimenSchema) as any,
    defaultValues: {
      commonName: initialName || '',
      scientificName: null,
      alias: null,
      rockFamily: null,
      species: null,
      variety: null,
      materialType: 'Rock',
      mohsHardnessMin: null,
      mohsHardnessMax: null,
      tumblingDifficulty: null,
      recommendedGritSequence: null,
      specialConsiderations: null,
      notes: null,
      isPublic: false,
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        commonName: initialName || '',
        scientificName: null,
        alias: null,
        rockFamily: null,
        species: null,
        variety: null,
        materialType: 'Rock',
        mohsHardnessMin: null,
        mohsHardnessMax: null,
        tumblingDifficulty: null,
        recommendedGritSequence: null,
        specialConsiderations: null,
        notes: null,
        isPublic: false,
      });
    }
  }, [open, initialName, form]);

  const handleSubmit = async (data: SpecimenFormData) => {
    try {
      const result = await createMutation.mutateAsync(data as CreateUserSpecimenRequest);
      onOpenChange(false);
      form.reset();
      if (onSuccess && result.userSpecimenId) {
        onSuccess({
          userSpecimenId: result.userSpecimenId,
          commonName: result.commonName,
          scientificName: result.scientificName,
          tumblingDifficulty: result.tumblingDifficulty,
          materialType: result.materialType,
        });
      }
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Custom Specimen</DialogTitle>
          <DialogDescription>
            Create a new specimen entry for rocks not in the reference database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Common Name */}
            <div className="space-y-2">
              <Label htmlFor="commonName">Common Name *</Label>
              <Input
                id="commonName"
                {...form.register('commonName')}
                placeholder="e.g., Rainbow Jasper"
              />
              {form.formState.errors.commonName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.commonName.message}
                </p>
              )}
            </div>

            {/* Scientific Name */}
            <div className="space-y-2">
              <Label htmlFor="scientificName">Scientific Name</Label>
              <Input
                id="scientificName"
                {...form.register('scientificName')}
                placeholder="e.g., SiO2"
              />
            </div>

            {/* Material Type */}
            <div className="space-y-2">
              <Label htmlFor="materialType">Material Type</Label>
              <Select
                value={form.watch('materialType')}
                onValueChange={(value) => form.setValue('materialType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tumbling Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="tumblingDifficulty">Tumbling Difficulty</Label>
              <Select
                value={form.watch('tumblingDifficulty') || '__none__'}
                onValueChange={(value) => form.setValue('tumblingDifficulty', value === '__none__' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Not specified</SelectItem>
                  {difficulties.map((diff) => (
                    <SelectItem key={diff} value={diff}>
                      {diff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mohs Hardness Min */}
            <div className="space-y-2">
              <Label htmlFor="mohsHardnessMin">Mohs Hardness (Min)</Label>
              <Input
                id="mohsHardnessMin"
                type="number"
                step="0.5"
                min="1"
                max="10"
                {...form.register('mohsHardnessMin', { valueAsNumber: true })}
                placeholder="1-10"
              />
            </div>

            {/* Mohs Hardness Max */}
            <div className="space-y-2">
              <Label htmlFor="mohsHardnessMax">Mohs Hardness (Max)</Label>
              <Input
                id="mohsHardnessMax"
                type="number"
                step="0.5"
                min="1"
                max="10"
                {...form.register('mohsHardnessMax', { valueAsNumber: true })}
                placeholder="1-10"
              />
            </div>

            {/* Rock Family */}
            <div className="space-y-2">
              <Label htmlFor="rockFamily">Rock Family</Label>
              <Input
                id="rockFamily"
                {...form.register('rockFamily')}
                placeholder="e.g., Silicate"
              />
            </div>

            {/* Variety */}
            <div className="space-y-2">
              <Label htmlFor="variety">Variety</Label>
              <Input
                id="variety"
                {...form.register('variety')}
                placeholder="e.g., Banded"
              />
            </div>
          </div>

          {/* Alias */}
          <div className="space-y-2">
            <Label htmlFor="alias">Alias / Alternative Names</Label>
            <Input
              id="alias"
              {...form.register('alias')}
              placeholder="Comma-separated alternative names"
            />
          </div>

          {/* Recommended Grit Sequence */}
          <div className="space-y-2">
            <Label htmlFor="recommendedGritSequence">Recommended Grit Sequence</Label>
            <Input
              id="recommendedGritSequence"
              {...form.register('recommendedGritSequence')}
              placeholder="e.g., 60/90 → 120/220 → 500 → Polish"
            />
          </div>

          {/* Special Considerations */}
          <div className="space-y-2">
            <Label htmlFor="specialConsiderations">Special Considerations</Label>
            <Textarea
              id="specialConsiderations"
              {...form.register('specialConsiderations')}
              placeholder="Any special handling notes..."
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Personal Notes</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Your notes about this specimen..."
              rows={2}
            />
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Make Public</Label>
              <p className="text-sm text-muted-foreground">
                Allow other users to see and use this specimen
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={form.watch('isPublic')}
              onCheckedChange={(checked) => form.setValue('isPublic', checked)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Specimen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
