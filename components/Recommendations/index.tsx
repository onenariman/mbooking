"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RecommendationsBreadcrumb from "./RecommendationsBreadcrumb";

export default function RecommendationsSection() {
  return (
    <div className="flex flex-col gap-4 pb-8">
      <RecommendationsBreadcrumb current="Рекомендации" showRoot={false} />
      <Card>
        <CardHeader>
          <CardTitle>Отчеты</CardTitle>
          <CardDescription>
            Рейтинг по оценкам и список сырых отзывов вынесены на отдельные
            страницы.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/recommendations/ratings">Рейтинг по оценкам</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/recommendations/raw">Сырые отзывы</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Рекомендации</CardTitle>
          <CardDescription>
            Быстрые рекомендации и рекомендации по датам вынесены на отдельные
            страницы.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/recommendations/quick">Быстрые рекомендации</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/recommendations/range">Рекомендации по датам</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
