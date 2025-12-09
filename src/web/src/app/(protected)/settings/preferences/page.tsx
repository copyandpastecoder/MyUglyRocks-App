'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { UpdateSettingsRequest, StageFieldVisibility } from '@/types/user';

// Helper to get default field visibility with current values
function getDefaultFieldVisibility(current: StageFieldVisibility | null | undefined): StageFieldVisibility {
  return {
    showLoadWeight: current?.showLoadWeight ?? false,
    showFillLevel: current?.showFillLevel ?? false,
    showWaterLevel: current?.showWaterLevel ?? false,
    showWaterAmount: current?.showWaterAmount ?? false,
    showQualityMetrics: current?.showQualityMetrics ?? false,
  };
}

export default function PreferencesPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: userApi.getSettings,
    staleTime: 1000 * 60 * 5,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: userApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast.success('Preferences saved');
    },
    onError: () => {
      toast.error('Failed to save preferences');
    },
  });

  const handleUpdate = (updates: UpdateSettingsRequest) => {
    updateSettingsMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>Customize how content is displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color theme
              </p>
            </div>
            <Select
              value={settings.theme}
              onValueChange={(value) => handleUpdate({ theme: value })}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="obsidian">Obsidian (Dark)</SelectItem>
                <SelectItem value="lapis-lazuli">Lapis Lazuli (Dark)</SelectItem>
                <SelectItem value="bumblebee-jasper">Bumblebee Jasper (Dark)</SelectItem>
                <SelectItem value="malachite">Malachite (Dark)</SelectItem>
                <SelectItem value="rose-quartz">Rose Quartz (Dark)</SelectItem>
                <SelectItem value="tigers-eye">Tiger's Eye (Dark)</SelectItem>
                <SelectItem value="snowflake-obsidian">Snowflake Obsidian (Light)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Font Size</Label>
              <p className="text-sm text-muted-foreground">
                Adjust text size for better readability
              </p>
            </div>
            <Select
              value={settings.fontSize}
              onValueChange={(value) => handleUpdate({ fontSize: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Small">Small</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Density</Label>
              <p className="text-sm text-muted-foreground">
                Control spacing and padding
              </p>
            </div>
            <Select
              value={settings.density}
              onValueChange={(value) => handleUpdate({ density: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Comfortable">Comfortable</SelectItem>
                <SelectItem value="Compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Relative Times</Label>
              <p className="text-sm text-muted-foreground">
                Display times as &quot;2 hours ago&quot; instead of exact dates
              </p>
            </div>
            <Switch
              checked={settings.showRelativeTimes}
              onCheckedChange={(checked) =>
                handleUpdate({ showRelativeTimes: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Regional</CardTitle>
          <CardDescription>
            Date, time, and measurement preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Date Format</Label>
              <p className="text-sm text-muted-foreground">
                How dates are displayed
              </p>
            </div>
            <Select
              value={settings.dateFormat}
              onValueChange={(value) => handleUpdate({ dateFormat: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MMDDYYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DDMMYYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYYMMDD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Time Format</Label>
              <p className="text-sm text-muted-foreground">12-hour or 24-hour</p>
            </div>
            <Select
              value={settings.timeFormat}
              onValueChange={(value) => handleUpdate({ timeFormat: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TwelveHour">12-hour (AM/PM)</SelectItem>
                <SelectItem value="TwentyFourHour">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>First Day of Week</Label>
              <p className="text-sm text-muted-foreground">
                For calendar displays
              </p>
            </div>
            <Select
              value={settings.firstDayOfWeek}
              onValueChange={(value) => handleUpdate({ firstDayOfWeek: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sunday">Sunday</SelectItem>
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Saturday">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Measurement System</Label>
              <p className="text-sm text-muted-foreground">
                For weight and volume
              </p>
            </div>
            <Select
              value={settings.measurementSystem}
              onValueChange={(value) =>
                handleUpdate({ measurementSystem: value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Imperial">Imperial (lb, oz)</SelectItem>
                <SelectItem value="Metric">Metric (kg, g)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Control what notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Stage Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a stage is ready to complete
              </p>
            </div>
            <Switch
              checked={settings.notifyStageReminders}
              onCheckedChange={(checked) =>
                handleUpdate({ notifyStageReminders: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Comments</Label>
              <p className="text-sm text-muted-foreground">
                Notify when someone comments on your posts
              </p>
            </div>
            <Switch
              checked={settings.notifyComments}
              onCheckedChange={(checked) =>
                handleUpdate({ notifyComments: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Replies</Label>
              <p className="text-sm text-muted-foreground">
                Notify when someone replies to your comment
              </p>
            </div>
            <Switch
              checked={settings.notifyReplies}
              onCheckedChange={(checked) =>
                handleUpdate({ notifyReplies: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ugly Rocks! Votes</Label>
              <p className="text-sm text-muted-foreground">
                Notify when someone votes on your posts
              </p>
            </div>
            <Switch
              checked={settings.notifyUglyRocks}
              onCheckedChange={(checked) =>
                handleUpdate({ notifyUglyRocks: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Digest</Label>
              <p className="text-sm text-muted-foreground">
                How often to receive summary emails
              </p>
            </div>
            <Select
              value={settings.digestFrequency}
              onValueChange={(value) =>
                handleUpdate({ digestFrequency: value })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Never">Never</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tumbling Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Tumbling</CardTitle>
          <CardDescription>
            Customize your tumbling workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tracking Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Controls which fields appear when adding stages
                </p>
              </div>
              <Select
                value={settings.trackingMode}
                onValueChange={(value) => handleUpdate({ trackingMode: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simple">Simple</SelectItem>
                  <SelectItem value="Detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              {settings.trackingMode === 'Simple' ? (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Simple mode:</span>{' '}
                  Track basic stage info (name, duration, materials, notes). Great for casual hobbyists.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Detailed mode:</span>{' '}
                  Track additional metrics like load weight, fill level, water level, and quality ratings.
                  Ideal for optimizing your results over time.
                </p>
              )}
            </div>
          </div>

          {/* Stage Field Toggles - only show in Detailed mode */}
          {settings.trackingMode === 'Detailed' && (
            <>
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Stage Fields</Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Choose which optional fields to show when adding stages
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-normal">Load Weight</Label>
                      <p className="text-xs text-muted-foreground">
                        Track rock weight before and after each stage
                      </p>
                    </div>
                    <Switch
                      checked={settings.stageFieldVisibility?.showLoadWeight ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdate({
                          stageFieldVisibility: {
                            ...getDefaultFieldVisibility(settings.stageFieldVisibility),
                            showLoadWeight: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-normal">Fill Level</Label>
                      <p className="text-xs text-muted-foreground">
                        Record barrel fill percentage
                      </p>
                    </div>
                    <Switch
                      checked={settings.stageFieldVisibility?.showFillLevel ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdate({
                          stageFieldVisibility: {
                            ...getDefaultFieldVisibility(settings.stageFieldVisibility),
                            showFillLevel: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-normal">Water Level</Label>
                      <p className="text-xs text-muted-foreground">
                        Track water level (just covering, halfway, etc.)
                      </p>
                    </div>
                    <Switch
                      checked={settings.stageFieldVisibility?.showWaterLevel ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdate({
                          stageFieldVisibility: {
                            ...getDefaultFieldVisibility(settings.stageFieldVisibility),
                            showWaterLevel: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-normal">Water Amount (ml)</Label>
                      <p className="text-xs text-muted-foreground">
                        Record precise water measurements
                      </p>
                    </div>
                    <Switch
                      checked={settings.stageFieldVisibility?.showWaterAmount ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdate({
                          stageFieldVisibility: {
                            ...getDefaultFieldVisibility(settings.stageFieldVisibility),
                            showWaterAmount: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-normal">Quality Metrics</Label>
                      <p className="text-xs text-muted-foreground">
                        Rate shape, scratch level, pitting, and shine when completing stages
                      </p>
                    </div>
                    <Switch
                      checked={settings.stageFieldVisibility?.showQualityMetrics ?? false}
                      onCheckedChange={(checked) =>
                        handleUpdate({
                          stageFieldVisibility: {
                            ...getDefaultFieldVisibility(settings.stageFieldVisibility),
                            showQualityMetrics: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-fill from Last Run</Label>
              <p className="text-sm text-muted-foreground">
                Pre-fill new stages with previous settings
              </p>
            </div>
            <Switch
              checked={settings.autoFillFromLastRun}
              onCheckedChange={(checked) =>
                handleUpdate({ autoFillFromLastRun: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Default Post Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Default visibility when sharing cycles
              </p>
            </div>
            <Select
              value={settings.defaultPostVisibility}
              onValueChange={(value) =>
                handleUpdate({ defaultPostVisibility: value })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Public</SelectItem>
                <SelectItem value="Unlisted">Unlisted</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {updateSettingsMutation.isPending && (
        <div className="fixed bottom-4 right-4">
          <div className="flex items-center gap-2 rounded-lg bg-background border px-4 py-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        </div>
      )}
    </div>
  );
}
