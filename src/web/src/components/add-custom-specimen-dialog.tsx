'use client';

import { useEffect, useState } from 'react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCreateUserSpecimen } from '@/hooks/use-user-specimens';
import { userSpecimenApi } from '@/lib/api';
import type { CreateUserSpecimenRequest, SpecimenLookupData } from '@/types/user-specimen';

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
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<SpecimenLookupData | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceDescription, setSourceDescription] = useState('');

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
      setLookupResult(null);
      setLookupError(null);
      setSourceUrl('');
      setSourceName('');
      setSourceDescription('');
      setSourceOpen(false);
    }
  }, [open, initialName, form]);

  const handleLookup = async () => {
    const commonName = form.getValues('commonName');
    if (!commonName || commonName.length < 2) {
      setLookupError('Please enter a name with at least 2 characters');
      return;
    }

    setIsLookingUp(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const response = await userSpecimenApi.lookup({
        commonName,
        sourceUrl: sourceUrl || null,
        sourceName: sourceName || null,
        sourceDescription: sourceDescription || null,
      });

      if (response.success && response.data) {
        setLookupResult(response.data);
        // Auto-populate form fields
        const data = response.data;
        form.setValue('scientificName', data.scientificName);
        form.setValue('alias', data.alias);
        form.setValue('rockFamily', data.rockFamily);
        form.setValue('species', data.species);
        form.setValue('variety', data.variety);
        form.setValue('materialType', data.materialType || 'Rock');
        form.setValue('mohsHardnessMin', data.mohsHardnessMin);
        form.setValue('mohsHardnessMax', data.mohsHardnessMax);
        form.setValue('tumblingDifficulty', data.tumblingDifficulty);
        form.setValue('recommendedGritSequence', data.recommendedGritSequence);
        form.setValue('specialConsiderations', data.specialConsiderations);
      } else {
        setLookupError(response.error || 'Failed to lookup specimen');
      }
    } catch {
      setLookupError('Failed to connect to AI service');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (data: SpecimenFormData) => {
    try {
      // Include AI lookup data if available
      const requestData: CreateUserSpecimenRequest = {
        ...data,
        aiConfidenceScore: lookupResult?.confidenceScore ?? null,
        aiIsKnownSpecimen: lookupResult?.isKnownSpecimen ?? null,
      };
      const result = await createMutation.mutateAsync(requestData);
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
          {/* AI Lookup Section */}
          <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">AI-Powered Lookup</span>
            </div>

            <div className="flex gap-2">
              <Input
                id="commonName"
                {...form.register('commonName')}
                placeholder="e.g., Rainbow Jasper, Dragon Stone"
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleLookup}
                disabled={isLookingUp}
              >
                {isLookingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Lookup
                  </>
                )}
              </Button>
            </div>
            {form.formState.errors.commonName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.commonName.message}
              </p>
            )}

            {/* Source Info Collapsible */}
            <Collapsible open={sourceOpen} onOpenChange={setSourceOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                  <span>Add source info (optional)</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${sourceOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="sourceUrl" className="text-xs text-muted-foreground">Listing URL</Label>
                  <Input
                    id="sourceUrl"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sourceName" className="text-xs text-muted-foreground">Seller / Store</Label>
                  <Input
                    id="sourceName"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="e.g., RockShed, eBay seller name"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sourceDescription" className="text-xs text-muted-foreground">Listing Description</Label>
                  <Textarea
                    id="sourceDescription"
                    value={sourceDescription}
                    onChange={(e) => setSourceDescription(e.target.value)}
                    placeholder="Copy/paste any description from the listing..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Lookup Error */}
            {lookupError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{lookupError}</AlertDescription>
              </Alert>
            )}

            {/* Lookup Result Indicator */}
            {lookupResult && (
              <div className="flex items-center justify-between rounded-md border p-2 bg-background">
                <div className="flex items-center gap-2">
                  {lookupResult.isKnownSpecimen ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm">
                    {lookupResult.isKnownSpecimen ? 'Recognized specimen' : 'Unrecognized name'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={lookupResult.confidenceScore >= 80 ? 'default' : lookupResult.confidenceScore >= 50 ? 'secondary' : 'outline'}>
                    {lookupResult.confidenceScore}% confidence
                  </Badge>
                  {lookupResult.isKnownSpecimen && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Review for DB
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {lookupResult?.confidenceReason && (
              <p className="text-xs text-muted-foreground">{lookupResult.confidenceReason}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="e.g., Agate, Jasper, Silicate"
              />
            </div>

            {/* Species */}
            <div className="space-y-2">
              <Label htmlFor="species">Species</Label>
              <Input
                id="species"
                {...form.register('species')}
                placeholder="e.g., Quartz, Feldspar, Beryl"
              />
            </div>

            {/* Variety */}
            <div className="space-y-2">
              <Label htmlFor="variety">Variety</Label>
              <Input
                id="variety"
                {...form.register('variety')}
                placeholder="e.g., Banded, Moss, Brazilian"
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
