'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { helpTopics, getMainHelpTopics } from '@/data/help-content';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ChevronLeft, ChevronRight, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';

interface TopicPageProps {
  params: Promise<{ topic: string }>;
}

export default function TopicHelpPage({ params }: TopicPageProps) {
  const { topic } = use(params);
  const router = useRouter();
  const helpTopic = helpTopics[topic];

  // If topic doesn't exist, redirect to main FAQ
  if (!helpTopic) {
    router.replace('/learn/faq');
    return null;
  }

  const Icon = helpTopic.icon;

  // Get related topics for navigation
  const relatedTopics = helpTopic.relatedTopics
    ?.map(slug => helpTopics[slug])
    .filter(Boolean) || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/learn/faq">Help Center</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{helpTopic.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{helpTopic.title}</h1>
          <p className="text-lg text-muted-foreground mt-1">{helpTopic.description}</p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {helpTopic.sections.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              {section.description && (
                <CardDescription className="text-base">{section.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fields */}
              {section.fields && section.fields.length > 0 && (
                <Accordion type="multiple" className="w-full">
                  {section.fields.map((field, fieldIndex) => (
                    <AccordionItem key={fieldIndex} value={`field-${sectionIndex}-${fieldIndex}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.name}</span>
                          {field.required && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Required
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <p className="text-muted-foreground">{field.description}</p>
                          {field.tips && field.tips.length > 0 && (
                            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                Tips
                              </div>
                              <ul className="space-y-1">
                                {field.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {/* General Tips */}
              {section.tips && section.tips.length > 0 && !section.fields && (
                <div className="space-y-2">
                  {section.tips.map((tip, tipIndex) => (
                    <div key={tipIndex} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <p className="text-sm">{tip}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips below fields */}
              {section.tips && section.tips.length > 0 && section.fields && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Additional Tips
                  </div>
                  <ul className="space-y-2">
                    {section.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Related Topics */}
      {relatedTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Help Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedTopics.map((related) => {
                const RelatedIcon = related.icon;
                return (
                  <Link
                    key={related.slug}
                    href={`/learn/faq/${related.slug}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <RelatedIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{related.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {related.description}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back to Help Center */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="ghost" asChild>
          <Link href="/learn/faq">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Help Center
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Need more help? Contact support.
        </p>
      </div>
    </div>
  );
}
