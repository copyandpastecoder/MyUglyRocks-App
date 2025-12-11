'use client';

import { Fragment, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  separator?: ReactNode;
  showHome?: boolean;
  className?: string;
}

/**
 * Breadcrumb - Navigation breadcrumb component
 *
 * Usage:
 * ```tsx
 * // Auto-generated from path
 * <Breadcrumb />
 *
 * // Custom items
 * <Breadcrumb
 *   items={[
 *     { label: 'Cycles', href: '/cycles' },
 *     { label: 'My Cycle', href: '/cycles/123' },
 *     { label: 'Stage 1' },
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({
  items,
  separator = <ChevronRight className="w-4 h-4 text-muted-foreground" />,
  showHome = true,
  className,
}: BreadcrumbProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from path if no items provided
  const breadcrumbItems: BreadcrumbItem[] = items || generateBreadcrumbs(pathname);

  // Add home if requested
  const allItems = showHome
    ? [{ label: 'Home', href: '/dashboard', icon: <Home className="w-4 h-4" /> }, ...breadcrumbItems]
    : breadcrumbItems;

  if (allItems.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm', className)}
    >
      <ol className="flex items-center gap-1.5">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <Fragment key={index}>
              <li className="flex items-center">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm'
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'flex items-center gap-1.5',
                      isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
              {!isLast && (
                <li className="flex items-center" aria-hidden="true">
                  {separator}
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// Path segment to label mapping
const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  cycles: 'Cycles',
  tumblers: 'Tumblers',
  learn: 'Learn',
  settings: 'Settings',
  preferences: 'Preferences',
  account: 'Account',
  new: 'New',
  edit: 'Edit',
  photos: 'Photos',
  stages: 'Stages',
  admin: 'Admin',
  users: 'Users',
};

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Remove leading slash and split
  const segments = pathname.split('/').filter(Boolean);

  // Skip first segment if it's a route group (starts with parentheses)
  const filteredSegments = segments.filter((s) => !s.startsWith('('));

  // Build breadcrumb items
  const items: BreadcrumbItem[] = [];
  let currentPath = '';

  filteredSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === filteredSegments.length - 1;

    // Check if segment is an ID (UUID or number)
    const isId = /^[0-9a-f-]{36}$|^\d+$/.test(segment);

    // Get label
    let label = labelMap[segment.toLowerCase()] || segment;

    // Format ID segments
    if (isId) {
      label = `#${segment.slice(0, 8)}...`;
    }

    items.push({
      label: capitalize(label),
      href: isLast ? undefined : currentPath,
    });
  });

  return items;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Breadcrumb with schema.org structured data
interface BreadcrumbWithSchemaProps extends BreadcrumbProps {
  baseUrl?: string;
}

export function BreadcrumbWithSchema({
  baseUrl = '',
  ...props
}: BreadcrumbWithSchemaProps) {
  const pathname = usePathname();
  const items = props.items || generateBreadcrumbs(pathname);

  const schemaItems = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: item.href ? `${baseUrl}${item.href}` : undefined,
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: schemaItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Breadcrumb {...props} items={items} />
    </>
  );
}
