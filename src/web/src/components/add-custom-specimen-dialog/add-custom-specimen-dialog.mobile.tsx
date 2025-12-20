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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { cn } from '@/lib/utils';
import type { AddCustomSpecimenDialogProps } from './types';
import { MATERIAL_TYPES, DIFFICULTIES } from './types';
import type { CreateUserSpecimenRequest } from '@/types/user-specimen';

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

export function AddCustomSpecimenDialogMobile({
  open,
  onOpenChange,
  onSuccess,
  initialName,
}: AddCustomSpecimenDialogProps) {
  const createMutation = useCreateUserSpecimen();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    confidenceScore: number;
    confidenceReason?: string | null;
    isKnownSpecimen: boolean;
    scientificName?: string | null;
    alias?: string | null;
    rockFamily?: string | null;
    species?: string | null;
    variety?: string | null;
    materialType?: string | null;
    mohsHardnessMin?: number | null;
    mohsHardnessMax?: number | null;
    tumblingDifficulty?: string | null;
    recommendedGritSequence?: string | null;
    specialConsiderations?: string | null;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceDescription, setSourceDescription] = useState('');

  // Mobile-specific collapsible sections
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
      setDetailsOpen(false);
      setAdvancedOpen(false);
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
        // Auto-expand details if we got data
        setDetailsOpen(true);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] flex flex-col p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle>Add Custom Specimen</SheetTitle>
          <SheetDescription>
            Create a new specimen entry for rocks not in the reference database.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <form id="specimen-form-mobile" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* AI Lookup Section */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <span className="text-base font-medium">AI-Powered Lookup</span>
              </div>

              <div className="space-y-3">
                <Input
                  {...form.register('commonName')}
                  placeholder="e.g., Rainbow Jasper, Dragon Stone"
                  className="h-12 text-base"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLookup}
                  disabled={isLookingUp}
                  className="w-full h-12 text-base"
                >
                  {isLookingUp ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Lookup Specimen
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
                  <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground h-10">
                    <span>Add source info (optional)</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", sourceOpen && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Listing URL</Label>
                    <Input
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Seller / Store</Label>
                    <Input
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="e.g., RockShed, eBay seller"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Listing Description</Label>
                    <Textarea
                      value={sourceDescription}
                      onChange={(e) => setSourceDescription(e.target.value)}
                      placeholder="Copy/paste description..."
                      rows={2}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {lookupError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{lookupError}</AlertDescription>
                </Alert>
              )}

              {lookupResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border p-3 bg-background">
                    <div className="flex items-center gap-2">
                      {lookupResult.isKnownSpecimen ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="text-sm">
                        {lookupResult.isKnownSpecimen ? 'Recognized' : 'Unrecognized'}
                      </span>
                    </div>
                    <Badge variant={lookupResult.confidenceScore >= 80 ? 'default' : lookupResult.confidenceScore >= 50 ? 'secondary' : 'outline'}>
                      {lookupResult.confidenceScore}%
                    </Badge>
                  </div>
                  {lookupResult.confidenceReason && (
                    <p className="text-xs text-muted-foreground">{lookupResult.confidenceReason}</p>
                  )}
                </div>
              )}
            </div>

            {/* Basic Details - Collapsible */}
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <Label className="text-base font-semibold cursor-pointer">Specimen Details</Label>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", detailsOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-base">Scientific Name</Label>
                  <Input
                    {...form.register('scientificName')}
                    placeholder="e.g., SiO2"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Material Type</Label>
                  <Select
                    value={form.watch('materialType')}
                    onValueChange={(value) => form.setValue('materialType', value)}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="py-3">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Tumbling Difficulty</Label>
                  <Select
                    value={form.watch('tumblingDifficulty') || '__none__'}
                    onValueChange={(value) => form.setValue('tumblingDifficulty', value === '__none__' ? null : value)}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" className="py-3">Not specified</SelectItem>
                      {DIFFICULTIES.map((diff) => (
                        <SelectItem key={diff} value={diff} className="py-3">
                          {diff}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-base">Mohs Min</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      min="1"
                      max="10"
                      {...form.register('mohsHardnessMin', { valueAsNumber: true })}
                      placeholder="1-10"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">Mohs Max</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      min="1"
                      max="10"
                      {...form.register('mohsHardnessMax', { valueAsNumber: true })}
                      placeholder="1-10"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Advanced Details - Collapsible */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <Label className="text-base font-semibold cursor-pointer">Advanced Details</Label>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-base">Rock Family</Label>
                  <Input
                    {...form.register('rockFamily')}
                    placeholder="e.g., Agate, Jasper"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Species</Label>
                  <Input
                    {...form.register('species')}
                    placeholder="e.g., Quartz, Feldspar"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Variety</Label>
                  <Input
                    {...form.register('variety')}
                    placeholder="e.g., Banded, Moss"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Alias / Alternative Names</Label>
                  <Input
                    {...form.register('alias')}
                    placeholder="Comma-separated names"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Recommended Grit Sequence</Label>
                  <Input
                    {...form.register('recommendedGritSequence')}
                    placeholder="e.g., 60/90 → 120/220 → 500"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Special Considerations</Label>
                  <Textarea
                    {...form.register('specialConsiderations')}
                    placeholder="Any special handling notes..."
                    rows={2}
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Personal Notes</Label>
                  <Textarea
                    {...form.register('notes')}
                    placeholder="Your notes..."
                    rows={2}
                    className="text-base"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Public Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Make Public</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to use this specimen
                </p>
              </div>
              <Switch
                checked={form.watch('isPublic')}
                onCheckedChange={(checked) => form.setValue('isPublic', checked)}
              />
            </div>
          </form>
        </div>

        <SheetFooter className="p-4 border-t bg-background">
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="specimen-form-mobile"
              disabled={createMutation.isPending}
              className="flex-1 h-12 text-base"
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Create
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
