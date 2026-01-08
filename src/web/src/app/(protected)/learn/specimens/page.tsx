'use client';

import { useState } from 'react';
import { useSpecimens, useSpecimen } from '@/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Gem, AlertCircle, Settings2 } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';

const MATERIAL_TYPES = ['Rock', 'Mineral', 'Gemstone', 'Fossil', 'Glass', 'Other'];
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard', 'Expert'];

// Column visibility configuration
type ColumnKey = 'alias' | 'family' | 'materialType' | 'hardness' | 'difficulty';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}

const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { key: 'alias', label: 'Alias', defaultVisible: true },
  { key: 'family', label: 'Family', defaultVisible: true },
  { key: 'materialType', label: 'Material Type', defaultVisible: true },
  { key: 'hardness', label: 'Hardness', defaultVisible: true },
  { key: 'difficulty', label: 'Tumbling Difficulty', defaultVisible: true },
];

const STORAGE_KEY = 'learn-specimens-columns';

function getDifficultyColor(difficulty: string | null): string {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'hard': return 'bg-orange-100 text-orange-800';
    case 'expert': return 'bg-red-100 text-red-800';
    default: return 'bg-muted text-muted-foreground';
  }
}

export default function SpecimensPage() {
  const [search, setSearch] = useState('');
  const [materialType, setMaterialType] = useState<string>('__all__');
  const [difficulty, setDifficulty] = useState<string>('__all__');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Column visibility state - load from localStorage
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Invalid JSON, use defaults
        }
      }
    }
    // Default visibility
    return AVAILABLE_COLUMNS.reduce((acc, col) => {
      acc[col.key] = col.defaultVisible;
      return acc;
    }, {} as Record<ColumnKey, boolean>);
  });

  // Save column visibility to localStorage
  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const { data: specimens, isLoading, error } = useSpecimens({
    query: search || undefined,
    materialType: materialType === '__all__' ? undefined : materialType,
    difficulty: difficulty === '__all__' ? undefined : difficulty,
  });

  const { data: selectedSpecimen } = useSpecimen(selectedId);

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rock & Mineral Database</h1>
        <p className="text-muted-foreground">
          Learn about different specimens and their tumbling characteristics
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search rocks, minerals, gemstones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={materialType} onValueChange={setMaterialType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Types</SelectItem>
                  {MATERIAL_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Levels</SelectItem>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Column visibility dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings2 className="h-4 w-4" />
                    <span className="sr-only">Toggle columns</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {AVAILABLE_COLUMNS.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.key}
                      checked={visibleColumns[column.key]}
                      onCheckedChange={() => toggleColumn(column.key)}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium">Error loading specimens</p>
              <p className="text-sm text-muted-foreground">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      ) : specimens?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gem className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No specimens found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {visibleColumns.alias && (
                    <TableHead className="hidden md:table-cell">Alias</TableHead>
                  )}
                  {visibleColumns.family && (
                    <TableHead className="hidden sm:table-cell">Family</TableHead>
                  )}
                  {visibleColumns.materialType && (
                    <TableHead>Type</TableHead>
                  )}
                  {visibleColumns.hardness && (
                    <TableHead>Hardness</TableHead>
                  )}
                  {visibleColumns.difficulty && (
                    <TableHead>Difficulty</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {specimens?.map((specimen) => (
                  <TableRow
                    key={specimen.specimenId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedId(specimen.specimenId)}
                  >
                    <TableCell className="font-medium">{specimen.commonName}</TableCell>
                    {visibleColumns.alias && (
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {specimen.alias || '—'}
                      </TableCell>
                    )}
                    {visibleColumns.family && (
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {specimen.rockFamily || '—'}
                      </TableCell>
                    )}
                    {visibleColumns.materialType && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {specimen.materialType}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.hardness && (
                      <TableCell>
                        {specimen.mohsHardnessMin != null ? (
                          <Badge variant="outline" className="text-xs">
                            {specimen.mohsHardnessMin}
                            {specimen.mohsHardnessMax && specimen.mohsHardnessMax !== specimen.mohsHardnessMin
                              ? `-${specimen.mohsHardnessMax}`
                              : ''}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.difficulty && (
                      <TableCell>
                        {specimen.tumblingDifficulty ? (
                          <Badge className={getDifficultyColor(specimen.tumblingDifficulty)}>
                            {specimen.tumblingDifficulty}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="pt-4 text-sm text-muted-foreground">
              {specimens?.length} specimens
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-3xl">
          {selectedSpecimen && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSpecimen.commonName}</DialogTitle>
                <DialogDescription>
                  {selectedSpecimen.scientificName || selectedSpecimen.rockFamily || selectedSpecimen.materialType}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedSpecimen.materialType}</Badge>
                  <Badge variant="outline">
                    Mohs: {selectedSpecimen.mohsHardnessMin}
                    {selectedSpecimen.mohsHardnessMax && selectedSpecimen.mohsHardnessMax !== selectedSpecimen.mohsHardnessMin
                      ? `-${selectedSpecimen.mohsHardnessMax}`
                      : ''}
                  </Badge>
                  {selectedSpecimen.tumblingDifficulty && (
                    <Badge className={getDifficultyColor(selectedSpecimen.tumblingDifficulty)}>
                      {selectedSpecimen.tumblingDifficulty}
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Also Known As</p>
                  <p className="text-sm">{selectedSpecimen.alias || <span className="text-muted-foreground italic">Not specified</span>}</p>
                </div>

                {selectedSpecimen.variety && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Variety</p>
                    <p className="text-sm">{selectedSpecimen.variety}</p>
                  </div>
                )}

                {selectedSpecimen.recommendedGritSequence && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recommended Grits</p>
                    <p className="text-sm">{selectedSpecimen.recommendedGritSequence}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Special Considerations</p>
                  <p className="text-sm">{selectedSpecimen.specialConsiderations || <span className="text-muted-foreground italic">Not specified</span>}</p>
                </div>

                {selectedSpecimen.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm">{selectedSpecimen.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
}
