"use client";

import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type RecommendationsBreadcrumbProps = {
  current: string;
  showRoot?: boolean;
};

export default function RecommendationsBreadcrumb({
  current,
  showRoot = true,
}: RecommendationsBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {showRoot ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/recommendations">Рекомендации</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ) : null}
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
